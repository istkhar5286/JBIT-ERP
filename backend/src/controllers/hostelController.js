import { Hostel } from '../models/Hostel.js';
import { HostelBed } from '../models/HostelBed.js';
import { HostelApplication } from '../models/HostelApplication.js';
import { HostelAllocation } from '../models/HostelAllocation.js';
import { HostelComplaint } from '../models/HostelComplaint.js';
import { HostelLeaveRequest } from '../models/HostelLeaveRequest.js';
import { HostelNotice } from '../models/HostelNotice.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { Notification } from '../models/Notification.js';
import { generateTransactionId, generateReceiptNumber } from '../utils/receiptNumberGenerator.js';
import { sendHostelAllocationEmail } from '../services/emailService.js';
import { generateHostelReceiptPdf, generateHostelAllocationCardPdf } from '../services/hostelTransportPdfService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * 1. Get Available Hostel Options & Fees for Students
 * GET /api/hostel/options
 */
export const getHostelOptions = async (req, res, next) => {
  try {
    const student = req.user;
    const gender = student?.gender || '';

    let typeFilter = {};
    if (gender.toLowerCase() === 'female') {
      typeFilter = { hostelType: { $in: ['GIRLS', 'CO-ED'] } };
    } else if (gender.toLowerCase() === 'male') {
      typeFilter = { hostelType: { $in: ['BOYS', 'CO-ED'] } };
    }

    const hostels = await Hostel.find({ status: { $ne: 'INACTIVE' }, ...typeFilter }).lean();

    const options = await Promise.all(
      hostels.map(async (h) => {
        const [totalBeds, availableBeds] = await Promise.all([
          HostelBed.countDocuments({ hostelId: h._id }),
          HostelBed.countDocuments({ hostelId: h._id, status: 'AVAILABLE' })
        ]);
        const rooms = await HostelBed.distinct('roomNumber', { hostelId: h._id });

        return {
          _id: h._id,
          hostelName: h.hostelName,
          hostelType: h.hostelType,
          building: h.building,
          blocks: h.blocks,
          floors: h.floors,
          totalRooms: rooms.length,
          totalBeds,
          availableBeds,
          hostelFee: h.hostelFee,
          feeBreakdown: h.feeBreakdown,
          facilities: h.facilities,
          description: h.description,
          wardenName: h.wardenName,
          wardenContact: h.wardenContact
        };
      })
    );

    return sendSuccess(res, 'Available hostel options fetched', options);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get Current Student's Hostel Status & Profile
 * GET /api/hostel/my-status
 */
export const getMyHostelStatus = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // 1. Check active allocation
    const activeAllocation = await HostelAllocation.findOne({ studentId, status: 'ACTIVE' })
      .populate('hostelId')
      .populate('bedId')
      .lean();

    // 2. Check latest application
    const latestApplication = await HostelApplication.findOne({ studentId })
      .sort({ createdAt: -1 })
      .lean();

    // 3. Check complaints
    const complaints = await HostelComplaint.find({ studentId }).sort({ createdAt: -1 }).lean();

    // 4. Check outings / leave passes
    const outings = await HostelLeaveRequest.find({ studentId }).sort({ departureDate: -1 }).lean();

    // 5. Check notices
    const notices = await HostelNotice.find().sort({ createdAt: -1 }).limit(10).lean();

    // 6. Check payments
    const payments = await Payment.find({
      studentId,
      transactionId: { $regex: /^(TXN_HST|HST)/i }
    }).sort({ createdAt: -1 }).lean();

    return sendSuccess(res, 'Student hostel status retrieved', {
      isAllocated: !!activeAllocation,
      allocation: activeAllocation,
      application: latestApplication,
      complaints,
      outings,
      notices,
      payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Submit Student Hostel Application
 * POST /api/hostel/apply
 */
export const applyHostel = async (req, res, next) => {
  try {
    const student = req.user;
    const { hostelId, preferredBlock, preferredRoomType = 'Standard Double' } = req.body;

    if (!hostelId) {
      return sendError(res, 'Target Hostel selection is required', 400);
    }

    // Prevent duplicate active application
    const existingActiveApp = await HostelApplication.findOne({
      studentId: student._id,
      status: { $in: ['PENDING_PAYMENT', 'PAYMENT_SUCCESSFUL', 'PENDING_ALLOCATION', 'ALLOCATED', 'WAITLISTED'] }
    });

    if (existingActiveApp) {
      if (existingActiveApp.status === 'ALLOCATED') {
        return sendError(res, 'You already have an active hostel allocation.', 400);
      }
      if (existingActiveApp.status === 'PENDING_PAYMENT') {
        return sendSuccess(res, 'Resuming existing pending hostel application', existingActiveApp);
      }
      return sendError(res, `You already have an application in progress (Status: ${existingActiveApp.status}).`, 400);
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return sendError(res, 'Hostel not found', 404);
    }

    const feeAmount = hostel.hostelFee || 45000;

    const application = await HostelApplication.create({
      studentId: student._id,
      studentName: student.fullName,
      studentRoll: student.universityRollNumber,
      studentEmail: student.email,
      studentMobile: student.mobile,
      gender: student.gender || '',
      course: student.course || '',
      semester: student.semester || '1',
      academicYear: student.academicYear || '2024-2025',
      hostelId: hostel._id,
      hostelName: hostel.hostelName,
      preferredBlock: preferredBlock ? preferredBlock.trim() : '',
      preferredRoomType,
      feeAmount,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT'
    });

    return sendSuccess(res, 'Hostel application created. Please complete payment to confirm allocation.', application, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 3b. Submit Manual QR Code Payment with UTR & Screenshot for Hostel Fee
 * POST /api/hostel/submit-qr-payment
 */
export const submitHostelQrPayment = async (req, res, next) => {
  try {
    const student = req.user;
    const { applicationId, utrNumber, paymentScreenshot } = req.body;

    if (!applicationId) {
      return sendError(res, 'Application ID is required', 400);
    }
    if (!utrNumber || utrNumber.trim().length < 6) {
      return sendError(res, 'Please provide a valid UTR / Transaction Reference Number (min 6 digits)', 400);
    }
    if (!paymentScreenshot) {
      return sendError(res, 'Payment screenshot is required', 400);
    }

    if (typeof paymentScreenshot !== 'string' || !paymentScreenshot.startsWith('data:image/')) {
      return sendError(res, 'Invalid image format. Please upload PNG or JPG/JPEG screenshot.', 400);
    }
    if (paymentScreenshot.length > 7000000) {
      return sendError(res, 'Screenshot file size exceeds 5MB limit. Please upload a smaller image.', 400);
    }

    const application = await HostelApplication.findById(applicationId);
    if (!application) {
      return sendError(res, 'Hostel application not found', 404);
    }

    if (application.studentId.toString() !== student._id.toString()) {
      return sendError(res, 'Unauthorized to submit payment for this application', 403);
    }

    const cleanUtr = utrNumber.trim().toUpperCase();
    const uniqueTxn = `TXN_HST_${cleanUtr}_${Date.now()}`;
    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create({
      studentId: student._id,
      amount: application.feeAmount,
      transactionId: uniqueTxn,
      receiptNumber,
      paymentMethod: 'UPI',
      status: 'PENDING',
      purpose: `Hostel Accommodation Fee - ${application.hostelName}`,
      utrNumber: cleanUtr,
      paymentScreenshot,
      allocationType: 'HOSTEL',
      applicationId: application._id,
      paymentDate: new Date(),
      previousDue: application.feeAmount,
      remainingDue: application.feeAmount
    });

    application.paymentStatus = 'PENDING';
    application.paymentId = payment._id;
    application.transactionId = uniqueTxn;
    application.utrNumber = cleanUtr;
    application.paymentScreenshot = paymentScreenshot;
    application.status = 'PENDING_VERIFICATION';
    await application.save();

    await Notification.create({
      recipientId: student._id,
      recipientRole: 'STUDENT',
      title: '⏳ Hostel Payment Submitted for Verification',
      message: `Your hostel fee payment (UTR #${cleanUtr}) has been submitted. The Administration will verify the transaction and allocate your bed in ${application.hostelName}.`,
      type: 'HOSTEL_APPLICATION',
      link: '/hostel'
    });

    return sendSuccess(res, 'Hostel payment submitted successfully! Awaiting administrative verification.', {
      application,
      paymentId: payment._id,
      status: 'PENDING_VERIFICATION'
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Process Payment & Trigger Atomic Bed Allocation
 * POST /api/hostel/verify-payment-and-allocate
 */
export const verifyPaymentAndAllocate = async (req, res, next) => {
  try {
    const student = req.user;
    const { applicationId, paymentMethod = 'UPI', gatewayResponse = {} } = req.body;

    if (!applicationId) {
      return sendError(res, 'Application ID is required', 400);
    }

    const application = await HostelApplication.findById(applicationId);
    if (!application) {
      return sendError(res, 'Hostel application not found', 404);
    }

    if (application.studentId.toString() !== student._id.toString()) {
      return sendError(res, 'Unauthorized to process this application', 403);
    }

    if (application.status === 'ALLOCATED') {
      return sendError(res, 'This application has already been allocated a bed.', 400);
    }

    // 1. Process / Create Payment Record in backend
    const transactionId = generateTransactionId('TXN_HST');
    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create({
      studentId: student._id,
      amount: application.feeAmount,
      transactionId,
      receiptNumber,
      paymentMethod,
      status: 'SUCCESS',
      paymentDate: new Date(),
      previousDue: application.feeAmount,
      remainingDue: 0,
      extraPayment: 0,
      gatewayDetails: {
        provider: 'JBIT_HOSTEL_GATEWAY_V2',
        orderId: `HST_ORD_${Date.now()}`,
        authCode: 'AUTH_HST_OK',
        ...gatewayResponse
      }
    });

    // Update application payment details
    application.paymentStatus = 'SUCCESS';
    application.paymentId = payment._id;
    application.transactionId = transactionId;
    application.receiptNumber = receiptNumber;
    application.paymentDate = new Date();

    // 2. ATOMIC BED ALLOCATION ENGINE
    // Try to find an AVAILABLE bed in the requested hostel (and preferred block if specified)
    const bedFilter = {
      hostelId: application.hostelId,
      status: 'AVAILABLE'
    };

    if (application.preferredBlock) {
      bedFilter.block = application.preferredBlock;
    }

    // Atomic find and update: guarantees only one process can seize this bed
    let allocatedBed = await HostelBed.findOneAndUpdate(
      bedFilter,
      {
        $set: {
          status: 'OCCUPIED',
          occupantStudentId: student._id
        }
      },
      { new: true }
    );

    // If preferred block had no available bed, fall back to any available bed in the same hostel
    if (!allocatedBed && application.preferredBlock) {
      allocatedBed = await HostelBed.findOneAndUpdate(
        { hostelId: application.hostelId, status: 'AVAILABLE' },
        {
          $set: {
            status: 'OCCUPIED',
            occupantStudentId: student._id
          }
        },
        { new: true }
      );
    }

    // 3. Case A: Bed Found & Successfully Locked
    if (allocatedBed) {
      // Create permanent Allocation record
      const allocation = await HostelAllocation.create({
        studentId: student._id,
        studentName: student.fullName || application.studentName,
        rollNumber: student.universityRollNumber || application.studentRoll,
        hostelId: allocatedBed.hostelId,
        bedId: allocatedBed._id,
        applicationId: application._id,
        hostelName: allocatedBed.hostelName,
        block: allocatedBed.block,
        floor: allocatedBed.floor,
        roomNumber: allocatedBed.roomNumber,
        bedNumber: allocatedBed.bedNumber,
        allocationDate: new Date(),
        academicYear: application.academicYear || '2024-2025',
        paymentReference: transactionId,
        receiptNumber,
        status: 'ACTIVE'
      });

      // Link allocation record to bed
      allocatedBed.allocationId = allocation._id;
      await allocatedBed.save();

      // Update Application status
      application.status = 'ALLOCATED';
      application.allocatedBedId = allocatedBed._id;
      application.allocationDetails = {
        hostelName: allocatedBed.hostelName,
        block: allocatedBed.block,
        floor: allocatedBed.floor,
        roomNumber: allocatedBed.roomNumber,
        bedNumber: allocatedBed.bedNumber,
        allocatedAt: new Date()
      };
      await application.save();

      // Update Student profile hostel document
      await Student.findByIdAndUpdate(student._id, {
        hostel: {
          hostelName: allocatedBed.hostelName,
          roomNumber: allocatedBed.roomNumber,
          bedNumber: allocatedBed.bedNumber,
          status: 'Allocated'
        }
      });

      // Update hostel building occupancy counter
      const occupiedCount = await HostelBed.countDocuments({ hostelId: allocatedBed.hostelId, status: 'OCCUPIED' });
      const availableCount = await HostelBed.countDocuments({ hostelId: allocatedBed.hostelId, status: 'AVAILABLE' });
      await Hostel.findByIdAndUpdate(allocatedBed.hostelId, {
        occupiedBeds: occupiedCount,
        availableBeds: availableCount
      });

      // In-app Notification
      await Notification.create({
        recipientId: student._id,
        recipientRole: 'STUDENT',
        title: '🎉 Hostel Bed Successfully Allocated!',
        message: `Your payment was verified. You have been assigned ${allocatedBed.hostelName}, Room ${allocatedBed.roomNumber}, Bed ${allocatedBed.bedNumber}. Download your Allocation Card now!`,
        type: 'HOSTEL_ALLOCATION',
        link: '/hostel'
      });

      // Email dispatch
      if (student.email) {
        sendHostelAllocationEmail({
          email: student.email,
          studentName: student.fullName,
          allocation
        }).catch((err) => console.error('Non-fatal hostel email dispatch error:', err.message));
      }

      return sendSuccess(res, 'Payment verified and Hostel Bed automatically allocated!', {
        status: 'ALLOCATED',
        application,
        allocation,
        bed: allocatedBed,
        receiptNumber,
        transactionId
      });
    }

    // 4. Case B: NO BEDS AVAILABLE -> WAITLISTED (No fake allocation)
    application.status = 'WAITLISTED';
    application.remarks = 'Payment received. No beds are currently available in this hostel; placed on prioritized waitlist.';
    await application.save();

    await Student.findByIdAndUpdate(student._id, {
      'hostel.status': 'Waitlisted'
    });

    await Notification.create({
      recipientId: student._id,
      recipientRole: 'STUDENT',
      title: 'Hostel Waitlisted',
      message: 'Payment confirmed. However, all rooms in the selected hostel are currently full. You have been placed on the prioritized waitlist. Warden will process allocation as soon as a bed vacates.',
      type: 'HOSTEL_APPLICATION',
      link: '/hostel'
    });

    return sendSuccess(res, 'Payment confirmed. No beds are currently available; application placed on waitlist.', {
      status: 'WAITLISTED',
      application,
      receiptNumber,
      transactionId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Download Hostel Fee Receipt PDF
 * GET /api/hostel/receipt/:paymentId/pdf
 */
export const getHostelReceiptPdf = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) return sendError(res, 'Payment receipt not found', 404);

    const student = await Student.findById(payment.studentId);
    if (!student) return sendError(res, 'Student record not found', 404);

    // Auth check
    if (req.role === 'STUDENT' && student._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Unauthorized to view this receipt', 403);
    }

    const application = await HostelApplication.findOne({ paymentId: payment._id }) || {
      hostelName: 'Mandakini Hostel',
      studentName: student.fullName,
      studentRoll: student.universityRollNumber,
      academicYear: '2024-2025'
    };

    generateHostelReceiptPdf({ payment, application, student, res });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Download Hostel Allocation Card PDF
 * GET /api/hostel/allocation-card/:allocationId/pdf
 */
export const getHostelAllocationCardPdf = async (req, res, next) => {
  try {
    const { allocationId } = req.params;
    const allocation = await HostelAllocation.findById(allocationId);
    if (!allocation) return sendError(res, 'Allocation card not found', 404);

    const student = await Student.findById(allocation.studentId);
    if (!student) return sendError(res, 'Student record not found', 404);

    // Auth check
    if (req.role === 'STUDENT' && student._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Unauthorized to view this allocation card', 403);
    }

    generateHostelAllocationCardPdf({ allocation, student, res });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Submit Hostel Complaint
 * POST /api/hostel/complaints
 */
export const submitComplaint = async (req, res, next) => {
  try {
    const student = req.user;
    const { category, subject, description, priority } = req.body;

    if (!subject || !description) {
      return sendError(res, 'Subject and description are required', 400);
    }

    const allocation = await HostelAllocation.findOne({ studentId: student._id, status: 'ACTIVE' });

    const complaint = await HostelComplaint.create({
      studentId: student._id,
      studentName: student.fullName,
      rollNumber: student.universityRollNumber,
      hostelId: allocation ? allocation.hostelId : null,
      hostelName: allocation ? allocation.hostelName : (student.hostel?.hostelName || ''),
      roomNumber: allocation ? allocation.roomNumber : (student.hostel?.roomNumber || ''),
      bedNumber: allocation ? allocation.bedNumber : (student.hostel?.bedNumber || ''),
      category: category || 'MAINTENANCE',
      subject: subject.trim(),
      description: description.trim(),
      priority: priority || 'MEDIUM',
      status: 'OPEN'
    });

    return sendSuccess(res, 'Hostel complaint submitted successfully to warden desk', complaint, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Submit Outing / Leave Pass
 * POST /api/hostel/outing
 */
export const submitOutingRequest = async (req, res, next) => {
  try {
    const student = req.user;
    const { departureDate, expectedReturnDate, reason, destination, parentContact } = req.body;

    if (!departureDate || !expectedReturnDate || !reason) {
      return sendError(res, 'Departure date, expected return date, and reason are required', 400);
    }

    const allocation = await HostelAllocation.findOne({ studentId: student._id, status: 'ACTIVE' });

    const outing = await HostelLeaveRequest.create({
      studentId: student._id,
      studentName: student.fullName,
      rollNumber: student.universityRollNumber,
      hostelName: allocation ? allocation.hostelName : (student.hostel?.hostelName || ''),
      roomNumber: allocation ? allocation.roomNumber : (student.hostel?.roomNumber || ''),
      bedNumber: allocation ? allocation.bedNumber : (student.hostel?.bedNumber || ''),
      mobile: student.mobile,
      parentContact: parentContact || student.guardianContact || '',
      departureDate: new Date(departureDate),
      expectedReturnDate: new Date(expectedReturnDate),
      reason: reason.trim(),
      destination: destination ? destination.trim() : '',
      status: 'PENDING'
    });

    return sendSuccess(res, 'Outing request / Gate pass submitted to warden', outing, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Get Hostel Notices
 * GET /api/hostel/notices
 */
export const getHostelNotices = async (req, res, next) => {
  try {
    const notices = await HostelNotice.find().sort({ createdAt: -1 }).limit(20).lean();
    return sendSuccess(res, 'Hostel notices fetched', notices);
  } catch (error) {
    next(error);
  }
};
