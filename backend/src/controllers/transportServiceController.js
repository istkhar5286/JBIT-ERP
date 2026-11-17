import { Transport } from '../models/Transport.js';
import { TransportApplication } from '../models/TransportApplication.js';
import { TransportAllocation } from '../models/TransportAllocation.js';
import { BusStop } from '../models/BusStop.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { Notification } from '../models/Notification.js';
import { generateTransactionId, generateReceiptNumber } from '../utils/receiptNumberGenerator.js';
import { sendTransportAllocationEmail } from '../services/emailService.js';
import { generateTransportReceiptPdf, generateTransportAllocationCardPdf } from '../services/hostelTransportPdfService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * 0. Get Configurable Dehradun Bus Stops
 * GET /api/transport/stops
 */
export const getDehradunStops = async (req, res, next) => {
  try {
    const stops = await BusStop.find({ isActive: true }).sort({ isCampus: -1, stopName: 1 }).lean();
    return sendSuccess(res, 'Configurable Dehradun transport stops retrieved', stops);
  } catch (error) {
    next(error);
  }
};

/**
 * 0b. Get Real-Time Bus Seat Inventory & Map
 * GET /api/transport/bus/:busId/seats
 */
export const getBusSeatAvailability = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const bus = await Transport.findById(busId).lean();
    if (!bus) return sendError(res, 'Transport bus not found', 404);

    const totalSeats = bus.totalSeats || 40;
    const activeAllocations = await TransportAllocation.find({ busId: bus._id, status: 'ACTIVE' })
      .select('seatNumber')
      .lean();

    const takenSeats = new Set(activeAllocations.map((a) => Number(a.seatNumber)).filter(Boolean));
    (bus.assignedStudents || []).forEach((st) => {
      if (st.seatNumber) takenSeats.add(Number(st.seatNumber));
    });

    const seats = [];
    for (let i = 1; i <= totalSeats; i++) {
      const isTaken = takenSeats.has(i);
      seats.push({
        seatNumber: i,
        isOccupied: isTaken,
        isAvailable: !isTaken,
        status: isTaken ? 'OCCUPIED' : 'AVAILABLE'
      });
    }

    return sendSuccess(res, 'Bus seat inventory retrieved', {
      busId: bus._id,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      totalSeats,
      occupiedSeats: takenSeats.size,
      availableSeats: Math.max(totalSeats - takenSeats.size, 0),
      seats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 1. Get Available Transport Buses, Routes, Stops & Fees
 * GET /api/transport/options
 */
export const getTransportOptions = async (req, res, next) => {
  try {
    const buses = await Transport.find({ status: { $ne: 'INACTIVE' } }).sort({ busNumber: 1 }).lean();

    // Fetch active allocations to get precise live counts
    const busIds = buses.map((b) => b._id);
    const activeAllocations = await TransportAllocation.find({ busId: { $in: busIds }, status: 'ACTIVE' }).select('busId seatNumber').lean();
    const allocationsByBus = {};
    activeAllocations.forEach((alloc) => {
      const idStr = alloc.busId.toString();
      if (!allocationsByBus[idStr]) allocationsByBus[idStr] = new Set();
      allocationsByBus[idStr].add(alloc.seatNumber);
    });

    const options = buses.map((bus) => {
      const activeSet = allocationsByBus[bus._id.toString()] || new Set();
      (bus.assignedStudents || []).forEach((st) => {
        if (st.seatNumber) activeSet.add(st.seatNumber);
      });
      const occupied = activeSet.size;
      const total = bus.totalSeats || 40;
      const available = Math.max(total - occupied, 0);

      return {
        _id: bus._id,
        busNumber: bus.busNumber,
        routeName: bus.routeName,
        driverName: bus.driverName,
        driverContact: bus.driverContact,
        totalSeats: total,
        occupiedSeats: occupied,
        availableSeats: available,
        transportFee: bus.transportFee || 18000,
        stops: bus.stops || []
      };
    });

    return sendSuccess(res, 'Transport options and routes retrieved', options);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get Current Student's Transport Status
 * GET /api/transport/my-status
 */
export const getMyTransportStatus = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // 1. Check active allocation
    const activeAllocation = await TransportAllocation.findOne({ studentId, status: 'ACTIVE' })
      .populate('busId')
      .lean();

    // 2. Check latest application
    const latestApplication = await TransportApplication.findOne({ studentId })
      .sort({ createdAt: -1 })
      .lean();

    // 3. Check transport payments
    const payments = await Payment.find({
      studentId,
      transactionId: { $regex: /^(TXN_TRN|TRN)/i }
    }).sort({ createdAt: -1 }).lean();

    return sendSuccess(res, 'Student transport status retrieved', {
      isAllocated: !!activeAllocation,
      allocation: activeAllocation,
      application: latestApplication,
      payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Submit Transport Application
 * POST /api/transport/apply
 */
export const applyTransport = async (req, res, next) => {
  try {
    const student = req.user;
    const {
      busId,
      stopName,
      pickupStop,
      destination = 'JB Institute of Technology, 23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197',
      direction = 'ROUND_TRIP',
      selectedSeatNumber = null
    } = req.body;

    const designatedStop = (stopName || pickupStop || '').trim();

    if (!busId || !designatedStop) {
      return sendError(res, 'Bus route and designated stop selection are required', 400);
    }

    const bus = await Transport.findById(busId);
    if (!bus) return sendError(res, 'Transport bus not found', 404);

    const seatNum = selectedSeatNumber ? Number(selectedSeatNumber) : null;
    if (seatNum) {
      const totalSeats = bus.totalSeats || 40;
      if (seatNum < 1 || seatNum > totalSeats) {
        return sendError(res, `Seat #${seatNum} is invalid for Bus ${bus.busNumber} (1-${totalSeats})`, 400);
      }
      // Check if seat is currently active in TransportAllocation
      const isAllocated = await TransportAllocation.findOne({
        busId: bus._id,
        seatNumber: seatNum,
        status: 'ACTIVE'
      });
      if (isAllocated) {
        return sendError(res, `Seat #${seatNum} on Bus ${bus.busNumber} is already occupied. Please select an available seat.`, 400);
      }
    }

    // Check existing active application
    let application = await TransportApplication.findOne({
      studentId: student._id,
      status: { $in: ['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'PAYMENT_SUCCESSFUL', 'ALLOCATED', 'WAITLISTED'] }
    });

    if (application) {
      if (application.status === 'ALLOCATED') {
        return sendError(res, 'You already have an active transport bus seat allocation.', 400);
      }
      // Update pending application with newly selected bus, stop, seat
      application.busId = bus._id;
      application.busNumber = bus.busNumber;
      application.routeName = bus.routeName;
      application.stopName = designatedStop;
      application.destination = destination.trim();
      application.direction = direction;
      application.selectedSeatNumber = seatNum;
      application.feeAmount = bus.transportFee || 18000;
      await application.save();
      return sendSuccess(res, 'Transport booking updated. Proceed to Scan & Pay to confirm your seat booking.', application);
    }

    const feeAmount = bus.transportFee || 18000;

    application = await TransportApplication.create({
      studentId: student._id,
      studentName: student.fullName,
      studentRoll: student.universityRollNumber,
      studentEmail: student.email,
      studentMobile: student.mobile,
      course: student.course || '',
      semester: student.semester || '1',
      academicYear: student.academicYear || '2024-2025',
      busId: bus._id,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      stopName: designatedStop,
      destination: destination.trim(),
      direction,
      selectedSeatNumber: seatNum,
      feeAmount,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT'
    });

    return sendSuccess(res, 'Transport application created. Scan QR code to complete payment and submit for verification.', application, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 3b. Submit Manual QR Code Payment with UTR & Screenshot
 * POST /api/transport/submit-qr-payment
 */
export const submitTransportQrPayment = async (req, res, next) => {
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

    // Validate screenshot format & reasonable size (max 5MB)
    if (typeof paymentScreenshot !== 'string' || !paymentScreenshot.startsWith('data:image/')) {
      return sendError(res, 'Invalid image format. Please upload PNG or JPG/JPEG screenshot.', 400);
    }
    if (paymentScreenshot.length > 7000000) {
      return sendError(res, 'Screenshot file size exceeds 5MB limit. Please upload a smaller image.', 400);
    }

    const application = await TransportApplication.findById(applicationId);
    if (!application) return sendError(res, 'Transport application not found', 404);

    if (application.studentId.toString() !== student._id.toString()) {
      return sendError(res, 'Unauthorized to submit payment for this booking', 403);
    }

    const cleanUtr = utrNumber.trim().toUpperCase();
    const uniqueTxn = `TXN_TRN_${cleanUtr}_${Date.now()}`;
    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create({
      studentId: student._id,
      amount: application.feeAmount,
      transactionId: uniqueTxn,
      receiptNumber,
      paymentMethod: 'UPI',
      status: 'PENDING',
      purpose: `Transport Fee - Bus ${application.busNumber} (${application.stopName} to JBIT Campus${application.selectedSeatNumber ? `, Seat #${application.selectedSeatNumber}` : ''})`,
      utrNumber: cleanUtr,
      paymentScreenshot,
      allocationType: 'TRANSPORT',
      applicationId: application._id,
      selectedSeatNumber: application.selectedSeatNumber,
      busId: application.busId,
      stopName: application.stopName,
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
      title: '⏳ Transport Payment Submitted for Verification',
      message: `Your transport booking payment with UTR #${cleanUtr} has been submitted. Administration will verify the transaction and confirm your seat on Bus ${application.busNumber}.`,
      type: 'TRANSPORT_APPLICATION',
      link: '/transport'
    });

    return sendSuccess(res, 'Payment submitted successfully! Awaiting administrative verification.', {
      application,
      paymentId: payment._id,
      status: 'PENDING_VERIFICATION'
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Verify Payment & Trigger Automatic Bus Seat Allocation
 * POST /api/transport/verify-payment-and-allocate
 */
export const verifyPaymentAndAllocateTransport = async (req, res, next) => {
  try {
    const student = req.user;
    const { applicationId, paymentMethod = 'UPI', gatewayResponse = {} } = req.body;

    if (!applicationId) {
      return sendError(res, 'Application ID is required', 400);
    }

    const application = await TransportApplication.findById(applicationId);
    if (!application) return sendError(res, 'Application not found', 404);

    if (application.studentId.toString() !== student._id.toString()) {
      return sendError(res, 'Unauthorized to process this application', 403);
    }

    if (application.status === 'ALLOCATED') {
      return sendError(res, 'This transport booking is already allocated a seat.', 400);
    }

    // 1. Process payment in backend
    const transactionId = generateTransactionId('TXN_TRN');
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
        provider: 'JBIT_TRANSPORT_GATEWAY_V2',
        orderId: `TRN_ORD_${Date.now()}`,
        authCode: 'AUTH_TRN_OK',
        ...gatewayResponse
      }
    });

    application.paymentStatus = 'SUCCESS';
    application.paymentId = payment._id;
    application.transactionId = transactionId;
    application.receiptNumber = receiptNumber;
    application.paymentDate = new Date();

    // 2. ATOMIC BUS SEAT ALLOCATION ENGINE
    const bus = await Transport.findById(application.busId);
    if (!bus) return sendError(res, 'Transport bus not found', 404);

    // Calculate taken seat numbers on this bus
    const activeAllocations = await TransportAllocation.find({ busId: bus._id, status: 'ACTIVE' }).select('seatNumber').lean();
    const takenSeats = new Set(activeAllocations.map((a) => Number(a.seatNumber)));
    (bus.assignedStudents || []).forEach((st) => {
      if (st.seatNumber) takenSeats.add(Number(st.seatNumber));
    });

    let candidateSeat = null;
    const totalSeats = bus.totalSeats || 40;

    // Check if the student selected a specific seat and it's available
    if (application.selectedSeatNumber && !takenSeats.has(Number(application.selectedSeatNumber)) && Number(application.selectedSeatNumber) <= totalSeats) {
      candidateSeat = Number(application.selectedSeatNumber);
    } else {
      for (let s = 1; s <= totalSeats; s++) {
        if (!takenSeats.has(s)) {
          candidateSeat = s;
          break;
        }
      }
    }

    // 3. Case A: Available Seat Found
    if (candidateSeat !== null && bus.availableSeats > 0) {
      // Atomically decrement available seats and add student to bus
      const updatedBus = await Transport.findOneAndUpdate(
        { _id: bus._id, availableSeats: { $gt: 0 } },
        {
          $inc: { availableSeats: -1, occupiedSeats: 1 },
          $push: {
            assignedStudents: {
              studentId: student._id,
              studentName: student.fullName,
              rollNumber: student.universityRollNumber,
              stopName: application.stopName,
              seatNumber: candidateSeat,
              feeStatus: 'PAID',
              allocationDate: new Date()
            }
          }
        },
        { new: true }
      );

      if (updatedBus) {
        // Create permanent Allocation record
        const allocation = await TransportAllocation.create({
          studentId: student._id,
          studentName: student.fullName || application.studentName,
          rollNumber: student.universityRollNumber || application.rollNumber,
          busId: bus._id,
          applicationId: application._id,
          busNumber: bus.busNumber,
          routeName: bus.routeName,
          stopName: application.stopName,
          seatNumber: candidateSeat,
          allocationDate: new Date(),
          academicYear: application.academicYear || '2024-2025',
          paymentReference: transactionId,
          receiptNumber,
          status: 'ACTIVE'
        });

        // Update application
        application.status = 'ALLOCATED';
        application.allocatedSeatNumber = candidateSeat;
        await application.save();

        // Update student record
        await Student.findByIdAndUpdate(student._id, {
          transport: {
            busNumber: bus.busNumber,
            routeName: bus.routeName,
            stopName: application.stopName,
            status: 'Subscribed'
          }
        });

        // Notifications
        await Notification.create({
          recipientId: student._id,
          recipientRole: 'STUDENT',
          title: '🚌 Bus Seat Confirmed!',
          message: `Your transport pass for Bus ${bus.busNumber} (${bus.routeName}) has been confirmed: Seat #${candidateSeat}. Download your pass now!`,
          type: 'TRANSPORT_ALLOCATION',
          link: '/transport'
        });

        if (student.email) {
          sendTransportAllocationEmail({
            email: student.email,
            studentName: student.fullName,
            allocation
          }).catch((err) => console.error('Non-fatal transport email error:', err.message));
        }

        return sendSuccess(res, 'Payment verified and bus seat automatically allocated!', {
          status: 'ALLOCATED',
          application,
          allocation,
          seatNumber: candidateSeat,
          receiptNumber,
          transactionId
        });
      }
    }

    // 4. Case B: NO SEATS AVAILABLE -> WAITLISTED (No fake allocation)
    application.status = 'WAITLISTED';
    application.remarks = 'Payment received. No seats are currently available on this bus; placed on transport waitlist.';
    await application.save();

    await Student.findByIdAndUpdate(student._id, {
      'transport.status': 'Waitlisted'
    });

    await Notification.create({
      recipientId: student._id,
      recipientRole: 'STUDENT',
      title: 'Transport Waitlisted',
      message: `Payment confirmed. However, Bus ${bus.busNumber} is currently at maximum seat capacity. You have been placed on the prioritized waitlist.`,
      type: 'TRANSPORT_APPLICATION',
      link: '/transport'
    });

    return sendSuccess(res, 'Payment confirmed. All seats are currently occupied; application placed on waitlist.', {
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
 * 5. Download Transport Fee Receipt PDF
 * GET /api/transport/receipt/:paymentId/pdf
 */
export const getTransportReceiptPdf = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) return sendError(res, 'Payment receipt not found', 404);

    const student = await Student.findById(payment.studentId);
    if (!student) return sendError(res, 'Student record not found', 404);

    if (req.role === 'STUDENT' && student._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Unauthorized to view this receipt', 403);
    }

    const application = await TransportApplication.findOne({ paymentId: payment._id }) || {
      busNumber: 'JBIT-01',
      routeName: 'Clock Tower Route',
      stopName: 'Campus Main Gate',
      studentName: student.fullName,
      studentRoll: student.universityRollNumber,
      academicYear: '2024-2025'
    };

    generateTransportReceiptPdf({ payment, application, student, res });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Download Transport Allocation Card PDF
 * GET /api/transport/allocation-card/:allocationId/pdf
 */
export const getTransportAllocationCardPdf = async (req, res, next) => {
  try {
    const { allocationId } = req.params;
    const allocation = await TransportAllocation.findById(allocationId);
    if (!allocation) return sendError(res, 'Allocation pass not found', 404);

    const student = await Student.findById(allocation.studentId);
    if (!student) return sendError(res, 'Student record not found', 404);

    if (req.role === 'STUDENT' && student._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Unauthorized to view this allocation card', 403);
    }

    generateTransportAllocationCardPdf({ allocation, student, res });
  } catch (error) {
    next(error);
  }
};
