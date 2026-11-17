import { Student } from '../models/Student.js';
import { Payment } from '../models/Payment.js';
import { Fine } from '../models/Fine.js';
import { Attendance } from '../models/Attendance.js';
import { Timetable } from '../models/Timetable.js';
import { Result } from '../models/Result.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { Notice } from '../models/Notice.js';
import { Complaint } from '../models/Complaint.js';
import { Hostel } from '../models/Hostel.js';
import { Transport } from '../models/Transport.js';
import { StudentDocument } from '../models/StudentDocument.js';
import { calculateStudentFees } from '../services/feeService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  generateAdmitCardPdf,
  generateFeeClearanceCertificatePdf,
  generateNoDuesCertificatePdf,
  generateStudentIdCardPdf,
  generateMarksheetPdf,
  generateBonafideCertificatePdf,
  generateCharacterCertificatePdf
} from '../services/documentPdfService.js';


/**
 * Get Student Dashboard Data
 * GET /api/student/dashboard
 */
export const getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // 1. Authoritative fee calculation
    const feeSummary = await calculateStudentFees(studentId);

    // 2. Attendance Summary
    const attendanceRecords = await Attendance.find({ studentId }).lean();
    let totalClassesAll = 0;
    let attendedClassesAll = 0;

    const subjects = attendanceRecords.map((att) => {
      totalClassesAll += att.totalClasses;
      attendedClassesAll += att.attendedClasses;
      const absentClasses = Math.max(att.totalClasses - att.attendedClasses, 0);
      let status = 'Satisfactory';
      if (att.percentage >= 85) status = 'Excellent';
      else if (att.percentage >= 75) status = 'Good';
      else if (att.percentage >= 60) status = 'Warning';
      else status = 'Critical Shortage';

      return {
        _id: att._id,
        subject: att.subject,
        totalClasses: att.totalClasses,
        attendedClasses: att.attendedClasses,
        absentClasses,
        percentage: att.percentage,
        status
      };
    });

    const overallAttendancePercent =
      totalClassesAll > 0
        ? Math.round(((attendedClassesAll / totalClassesAll) * 100) * 100) / 100
        : 0;

    // 3. Recent Payments (Latest 5)
    const recentPayments = await Payment.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 4. Latest Successful Receipt
    const latestSuccessPayment = await Payment.findOne({
      studentId,
      status: 'SUCCESS'
    })
      .sort({ paymentDate: -1 })
      .lean();

    // 5. Recent Fines (Latest 5)
    const recentFines = await Fine.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 6. Unpaid fines check
    const unpaidFinesCount = recentFines.filter((f) => f.status === 'UNPAID').length;

    // Document Eligibility Flags
    const isFeeCleared = feeSummary.pendingAmount === 0 && feeSummary.status === 'CLEAR';
    const isAllDuesCleared = isFeeCleared && unpaidFinesCount === 0;

    return sendSuccess(res, 'Student dashboard fetched successfully', {
      student: req.user,
      metrics: {
        totalFee: feeSummary.totalPayable,
        paidFee: feeSummary.netPaid || feeSummary.totalPaid,
        pendingFee: feeSummary.pendingAmount,
        feeStatus: feeSummary.status,
        academicFee: feeSummary.academicFee,
        tuitionFee: feeSummary.tuitionFee,
        examinationFee: feeSummary.examinationFee,
        libraryFee: feeSummary.libraryFee,
        laboratoryFee: feeSummary.laboratoryFee,
        hostelFee: feeSummary.hostelFee,
        transportFee: feeSummary.transportFee,
        otherCharges: feeSummary.otherCharges,
        waiverTotal: feeSummary.waiverTotal,
        lateFineTotal: feeSummary.totalLateFines,
        totalPaid: feeSummary.totalPaid,
        totalRefunded: feeSummary.totalRefunded,
        netPaid: feeSummary.netPaid,
        currentDue: feeSummary.pendingAmount,
        totalFine: feeSummary.unpaidFineTotal,
        extraPayment: feeSummary.extraPayment,
        attendancePercentage: overallAttendancePercent,
        totalClassesAll,
        attendedClassesAll
      },
      documentEligibility: {
        canDownloadAdmitCard: isFeeCleared,
        admitCardMessage: isFeeCleared
          ? 'Eligible for Examination Admit Card'
          : 'Please clear your pending fees to download the admit card.',
        canDownloadClearance: isFeeCleared,
        clearanceMessage: isFeeCleared
          ? 'Eligible for Fee Clearance Certificate'
          : 'Please clear your pending fees to download the fee clearance certificate.',
        canDownloadNoDues: isAllDuesCleared,
        noDuesMessage: isAllDuesCleared
          ? 'All college departmental dues cleared'
          : 'Outstanding fees or fines must be cleared to download No-Dues Certificate.'
      },
      installments: feeSummary.installments || [],
      waivers: feeSummary.waivers || [],
      latestReceipt: latestSuccessPayment
        ? {
            paymentId: latestSuccessPayment._id,
            receiptNumber: latestSuccessPayment.receiptNumber,
            amount: latestSuccessPayment.amount,
            date: latestSuccessPayment.paymentDate
          }
        : null,
      recentPayments,
      recentFines,
      attendanceSummary: {
        overallPercentage: overallAttendancePercent,
        subjectCount: subjects.length,
        subjects
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Student Profile
 * GET /api/student/profile
 */
export const getStudentProfile = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id).lean();
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }
    return sendSuccess(res, 'Student profile fetched', student);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Student Profile
 * PUT /api/student/profile
 */
export const updateStudentProfile = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { fullName, fatherName, mobile, email, profilePhoto } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // Check duplicate email or mobile if modified
    if (email && email.toLowerCase() !== student.email) {
      const existing = await Student.findOne({ email: email.toLowerCase() });
      if (existing) {
        return sendError(res, 'This email address is already in use.', 400);
      }
      student.email = email.toLowerCase();
    }

    if (mobile && mobile !== student.mobile) {
      const existing = await Student.findOne({ mobile });
      if (existing) {
        return sendError(res, 'This mobile number is already registered.', 400);
      }
      student.mobile = mobile;
    }

    if (fullName) student.fullName = fullName.trim();
    if (fatherName) student.fatherName = fatherName.trim();
    if (profilePhoto !== undefined) student.profilePhoto = profilePhoto;

    await student.save();

    return sendSuccess(res, 'Profile updated successfully', student);
  } catch (error) {
    next(error);
  }
};

/**
 * Detailed Student Fees Page
 * GET /api/student/fees
 */
export const getStudentFees = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const feeSummary = await calculateStudentFees(studentId);

    const payments = await Payment.find({ studentId })
      .sort({ createdAt: -1 })
      .lean();

    const fines = await Fine.find({ studentId })
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Student fee breakdown fetched', {
      ...feeSummary,
      summary: feeSummary,
      installments: feeSummary.installments || [],
      waivers: feeSummary.waivers || [],
      payments,
      fines
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student Payment History
 * GET /api/student/payments
 */
export const getStudentPayments = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const payments = await Payment.find({ studentId })
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Payments history fetched', payments);
  } catch (error) {
    next(error);
  }
};

/**
 * Student Attendance Details
 * GET /api/student/attendance
 */
export const getStudentAttendance = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const records = await Attendance.find({ studentId }).sort({ subject: 1 }).lean();

    let totalClasses = 0;
    let attendedClasses = 0;

    const subjects = records.map((r) => {
      totalClasses += r.totalClasses;
      attendedClasses += r.attendedClasses;
      const absentClasses = Math.max(r.totalClasses - r.attendedClasses, 0);

      let status = 'Good';
      if (r.percentage >= 85) status = 'Excellent';
      else if (r.percentage >= 75) status = 'Good';
      else if (r.percentage >= 60) status = 'Shortage Warning';
      else status = 'Detained/Critical';

      return {
        _id: r._id,
        subject: r.subject,
        totalClasses: r.totalClasses,
        attendedClasses: r.attendedClasses,
        absentClasses,
        percentage: r.percentage,
        status,
        updatedAt: r.updatedAt
      };
    });

    const overallPercentage =
      totalClasses > 0
        ? Math.round(((attendedClasses / totalClasses) * 100) * 100) / 100
        : 0;

    return sendSuccess(res, 'Attendance data fetched', {
      overallPercentage,
      totalClasses,
      attendedClasses,
      absentClasses: Math.max(totalClasses - attendedClasses, 0),
      subjects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student Fines Details
 * GET /api/student/fines
 */
export const getStudentFines = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const fines = await Fine.find({ studentId }).sort({ createdAt: -1 }).lean();

    let unpaidTotal = 0;
    let paidTotal = 0;

    fines.forEach((f) => {
      if (f.status === 'UNPAID') unpaidTotal += f.amount;
      else paidTotal += f.amount;
    });

    return sendSuccess(res, 'Student fines fetched', {
      fines,
      unpaidTotal,
      paidTotal,
      grandTotal: unpaidTotal + paidTotal
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check Document Eligibility
 * GET /api/student/documents/eligibility
 */
export const getStudentDocumentEligibility = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const feeSummary = await calculateStudentFees(studentId);
    const unpaidFines = await Fine.find({ studentId, status: 'UNPAID' }).lean();

    const isFeeCleared = feeSummary.pendingAmount === 0 && feeSummary.status === 'CLEAR';
    const isAllDuesCleared = isFeeCleared && unpaidFines.length === 0;

    return sendSuccess(res, 'Document eligibility status fetched', {
      canDownloadAdmitCard: isFeeCleared,
      admitCardMessage: isFeeCleared
        ? 'Eligible for Examination Admit Card'
        : 'Please clear your pending fees to download the admit card.',
      canDownloadClearance: isFeeCleared,
      clearanceMessage: isFeeCleared
        ? 'Eligible for Fee Clearance Certificate'
        : 'Please clear your pending fees to download the fee clearance certificate.',
      canDownloadNoDues: isAllDuesCleared,
      noDuesMessage: isAllDuesCleared
        ? 'All college departmental dues cleared'
        : 'Outstanding fees or fines must be cleared to download No-Dues Certificate.',
      admitCard: {
        eligible: isFeeCleared,
        message: isFeeCleared
          ? 'Eligible for Examination Admit Card'
          : 'Please clear your pending fees to download the admit card.'
      },
      clearanceCertificate: {
        eligible: isFeeCleared,
        message: isFeeCleared
          ? 'Eligible for Fee Clearance Certificate'
          : 'Please clear your pending fees to download the fee clearance certificate.'
      },
      noDuesCertificate: {
        eligible: isAllDuesCleared,
        message: isAllDuesCleared
          ? 'All college departmental dues cleared'
          : 'Outstanding fees or fines must be cleared to download No-Dues Certificate.'
      },
      pendingAmount: feeSummary.pendingAmount,
      unpaidFinesCount: unpaidFines.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download Examination Admit Card
 * GET /api/student/documents/admit-card
 * STRICT RULE: Only accessible when outstanding fee = 0!
 */
export const downloadAdmitCard = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) return sendError(res, 'Student not found', 404);

    const feeSummary = await calculateStudentFees(student._id);

    if (feeSummary.pendingAmount > 0 || feeSummary.status !== 'CLEAR') {
      return sendError(res, 'Please clear your pending fees to download the admit card.', 403);
    }

    await generateAdmitCardPdf(student, feeSummary, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Download Fee Clearance Certificate
 * GET /api/student/documents/clearance-certificate
 * STRICT RULE: Only accessible when outstanding fee = 0!
 */
export const downloadFeeClearanceCertificate = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) return sendError(res, 'Student not found', 404);

    const feeSummary = await calculateStudentFees(student._id);

    if (feeSummary.pendingAmount > 0 || feeSummary.status !== 'CLEAR') {
      return sendError(res, 'Fee clearance certificate is only accessible when outstanding balance is ₹0.', 403);
    }

    generateFeeClearanceCertificatePdf(student, feeSummary, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Download Institutional No-Dues Certificate
 * GET /api/student/documents/no-dues-certificate
 * STRICT RULE: Only accessible when ALL dues and fines are 0!
 */
export const downloadNoDuesCertificate = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) return sendError(res, 'Student not found', 404);

    const feeSummary = await calculateStudentFees(student._id);
    const unpaidFines = await Fine.find({ studentId: student._id, status: 'UNPAID' }).lean();

    if (feeSummary.pendingAmount > 0 || unpaidFines.length > 0) {
      return sendError(res, 'No-Dues Certificate can only be issued when all departmental dues and fines are ₹0.', 403);
    }

    generateNoDuesCertificatePdf(student, feeSummary, unpaidFines, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Student Timetable
 * GET /api/student/timetable
 */
export const getStudentTimetable = async (req, res, next) => {
  try {
    const student = req.user;
    const filter = {
      course: student.course,
      semester: student.semester ? student.semester.toString() : '1'
    };
    if (student.branch) filter.branch = student.branch;

    const slots = await Timetable.find(filter).sort({ day: 1, timeSlot: 1 }).lean();
    return sendSuccess(res, 'Student timetable fetched', slots);
  } catch (error) {
    next(error);
  }
};

/**
 * Student Results / Marksheets
 * GET /api/student/results
 */
export const getStudentResults = async (req, res, next) => {
  try {
    const results = await Result.find({ studentId: req.user._id }).sort({ semester: 1 }).lean();
    return sendSuccess(res, 'Student results fetched', results);
  } catch (error) {
    next(error);
  }
};

/**
 * Download Marksheet PDF
 * GET /api/student/documents/marksheet
 */
export const downloadStudentMarksheet = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) return sendError(res, 'Student not found', 404);

    const { semester } = req.query;
    const query = { studentId: student._id };
    if (semester) query.semester = semester;

    const resultRecord = await Result.findOne(query).sort({ semester: -1 }).lean();
    await generateMarksheetPdf(student, resultRecord, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Download Student ID Card PDF
 * GET /api/student/documents/id-card
 */
export const downloadStudentIdCard = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) return sendError(res, 'Student not found', 404);

    await generateStudentIdCardPdf(student, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Download Bonafide Certificate PDF
 * GET /api/student/documents/bonafide
 */
export const downloadBonafideCertificate = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) return sendError(res, 'Student not found', 404);

    const { purpose } = req.query;
    await generateBonafideCertificatePdf(student, purpose || 'Academic Verification', res);
  } catch (error) {
    next(error);
  }
};

/**
 * Download Character Certificate PDF
 * GET /api/student/documents/character
 */
export const downloadCharacterCertificate = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) return sendError(res, 'Student not found', 404);

    await generateCharacterCertificatePdf(student, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Student Study Materials & Assignments
 * GET /api/student/study-materials
 */
export const getStudentStudyMaterials = async (req, res, next) => {
  try {
    const student = req.user;
    const filter = {
      course: student.course,
      semester: student.semester ? student.semester.toString() : '1'
    };

    const materials = await StudyMaterial.find(filter)
      .populate('facultyId', 'name designation department')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Study materials fetched', materials);
  } catch (error) {
    next(error);
  }
};

/**
 * Student Notices
 * GET /api/student/notices
 */
export const getStudentNotices = async (req, res, next) => {
  try {
    const student = req.user;
    const filter = {
      $or: [
        { targetAudience: 'ALL' },
        { targetAudience: 'STUDENTS' },
        {
          targetAudience: 'COURSE_SPECIFIC',
          targetCourse: student.course
        }
      ]
    };

    const notices = await Notice.find(filter).sort({ date: -1 }).lean();
    return sendSuccess(res, 'Student notices fetched', notices);
  } catch (error) {
    next(error);
  }
};

/**
 * Student Complaints
 * GET /api/student/complaints
 */
export const getStudentComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ studentId: req.user._id }).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 'Complaints fetched', complaints);
  } catch (error) {
    next(error);
  }
};

/**
 * Create Complaint
 * POST /api/student/complaints
 */
export const createStudentComplaint = async (req, res, next) => {
  try {
    const student = req.user;
    const { category, subject, description, attachment } = req.body;

    if (!subject || !description) {
      return sendError(res, 'Subject and description are required', 400);
    }

    const complaint = new Complaint({
      studentId: student._id,
      studentName: student.fullName,
      rollNumber: student.universityRollNumber,
      category: category || 'ACADEMIC',
      subject: subject.trim(),
      description: description.trim(),
      attachment: attachment || '',
      status: 'OPEN'
    });

    await complaint.save();
    return sendSuccess(res, 'Complaint ticket submitted successfully', complaint, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Student Hostel & Transport Information
 * GET /api/student/hostel-transport
 */
export const getStudentHostelTransport = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const student = await Student.findById(studentId).lean();

    // Check hostel room if allocated
    let hostelDetails = null;
    let outingRequests = [];
    const hostelRoom = await Hostel.findOne({ occupantStudentId: studentId }).lean();
    if (hostelRoom) {
      hostelDetails = {
        hostelName: hostelRoom.hostelName,
        block: hostelRoom.block,
        floor: hostelRoom.floor,
        roomNumber: hostelRoom.roomNumber,
        bedNumber: hostelRoom.bedNumber,
        wardenName: hostelRoom.wardenName,
        wardenContact: hostelRoom.wardenContact
      };
      outingRequests = hostelRoom.outingRequests?.filter(
        (o) => o.studentId && o.studentId.toString() === studentId.toString()
      ) || [];
    }

    // Check bus route
    let transportDetails = null;
    const bus = await Transport.findOne({ 'assignedStudents.studentId': studentId }).lean();
    if (bus) {
      const assigned = bus.assignedStudents.find(
        (s) => s.studentId && s.studentId.toString() === studentId.toString()
      );
      transportDetails = {
        busNumber: bus.busNumber,
        routeName: bus.routeName,
        driverName: bus.driverName,
        driverContact: bus.driverContact,
        stopName: assigned?.stopName || 'Campus Main Gate',
        stops: bus.stops
      };
    }

    return sendSuccess(res, 'Hostel and transport details fetched', {
      hostel: hostelDetails,
      outingRequests,
      transport: transportDetails
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request Hostel Outing / Gate Pass
 * POST /api/student/hostel/outing
 */
export const requestHostelOuting = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { reason, departureDate, returnDate } = req.body;

    if (!reason || !departureDate || !returnDate) {
      return sendError(res, 'Reason, departure date, and return date are required', 400);
    }

    const hostelRoom = await Hostel.findOne({ occupantStudentId: studentId });
    if (!hostelRoom) {
      return sendError(res, 'You are not assigned to any hostel room', 400);
    }

    hostelRoom.outingRequests.push({
      studentId,
      studentName: req.user.fullName,
      reason: reason.trim(),
      departureDate: new Date(departureDate),
      returnDate: new Date(returnDate),
      status: 'PENDING'
    });

    await hostelRoom.save();
    return sendSuccess(res, 'Outing request submitted to hostel warden', hostelRoom.outingRequests.slice(-1)[0], 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Student Uploaded Documents
 * GET /api/student/documents
 */
export const getStudentDocuments = async (req, res, next) => {
  try {
    const documents = await StudentDocument.find({ studentId: req.user._id }).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 'Student documents fetched', documents);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Student Document
 * POST /api/student/documents
 */
export const uploadStudentDocument = async (req, res, next) => {
  try {
    const { documentType, title, fileName, fileType, fileData } = req.body;
    if (!title || !fileName || !fileData) {
      return sendError(res, 'Document Title, File Name, and File Data are required', 400);
    }

    const doc = new StudentDocument({
      studentId: req.user._id,
      documentType: documentType || 'OTHER',
      title: title.trim(),
      fileName: fileName.trim(),
      fileType: fileType || 'application/pdf',
      fileData,
      status: 'VERIFIED'
    });

    await doc.save();
    return sendSuccess(res, 'Document uploaded successfully', doc, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Student Document
 * DELETE /api/student/documents/:id
 */
export const deleteStudentDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await StudentDocument.findOneAndDelete({ _id: id, studentId: req.user._id });
    if (!doc) return sendError(res, 'Document not found', 404);
    return sendSuccess(res, 'Document removed successfully');
  } catch (error) {
    next(error);
  }
};

