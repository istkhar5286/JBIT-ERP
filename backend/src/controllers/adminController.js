import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Student } from '../models/Student.js';
import { Faculty } from '../models/Faculty.js';
import { Course, Subject } from '../models/Academic.js';
import { Timetable } from '../models/Timetable.js';
import { Exam } from '../models/Exam.js';
import { Result } from '../models/Result.js';
import { Notice } from '../models/Notice.js';
import { Notification } from '../models/Notification.js';
import { Complaint } from '../models/Complaint.js';
import { Hostel } from '../models/Hostel.js';
import { Warden } from '../models/Warden.js';
import { Transport } from '../models/Transport.js';
import QRCode from 'qrcode';
import { StudentDocument } from '../models/StudentDocument.js';
import { Fee } from '../models/Fee.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { Fine } from '../models/Fine.js';
import { Attendance } from '../models/Attendance.js';
import { Payment } from '../models/Payment.js';
import { PaymentSetting } from '../models/PaymentSetting.js';
import { BusStop } from '../models/BusStop.js';
import { TransportAllocation } from '../models/TransportAllocation.js';
import { TransportApplication } from '../models/TransportApplication.js';
import { HostelAllocation } from '../models/HostelAllocation.js';
import { HostelApplication } from '../models/HostelApplication.js';
import { HostelBed } from '../models/HostelBed.js';
import { calculateStudentFees, calculateGlobalFinancials } from '../services/feeService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { sendFeeReminderEmail, sendTransportAllocationEmail, sendHostelAllocationEmail } from '../services/emailService.js';
import { isValidPhotoDataUrl } from './authController.js';
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
 * Admin Dashboard Metrics & Analytics Charts
 * GET /api/admin/dashboard
 */
export const getAdminDashboard = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'active' });

    // Financial summaries
    const financials = await calculateGlobalFinancials();

    // Monthly Fee Collection (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyCollectionAgg = await Payment.aggregate([
      {
        $match: {
          status: 'SUCCESS',
          paymentDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const found = monthlyCollectionAgg.find((item) => item._id.year === y && item._id.month === m);
      monthlyTrends.push({
        month: `${monthNames[m - 1]} ${y}`,
        amount: found ? found.total : 0,
        count: found ? found.count : 0
      });
    }

    // Recent transactions
    const recentPayments = await Payment.find()
      .populate('studentId', 'fullName universityRollNumber course semester')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // Real-time academic, administrative & faculty metrics from actual database collections
    const totalFaculty = await Faculty.countDocuments();
    const activeFaculty = await Faculty.countDocuments({ status: 'active' });
    const upcomingExamsCount = await Exam.countDocuments({ examDate: { $gte: new Date() } });
    const pendingComplaintsCount = await Complaint.countDocuments({ status: { $in: ['OPEN', 'PROCESSING'] } });
    const recentNoticesCount = await Notice.countDocuments();

    // Attendance stats
    const attAgg = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: '$percentage' },
          totalRecords: { $sum: 1 }
        }
      }
    ]);
    const averageAttendance = attAgg[0] ? Math.round(attAgg[0].avgPercentage * 10) / 10 : 0;

    // Real Lists
    const upcomingExams = await Exam.find({ examDate: { $gte: new Date() } }).sort({ examDate: 1 }).limit(5).lean();
    const pendingComplaints = await Complaint.find({ status: { $in: ['OPEN', 'PROCESSING'] } }).sort({ createdAt: -1 }).limit(5).lean();
    const recentNotices = await Notice.find().sort({ date: -1 }).limit(5).lean();

    return sendSuccess(res, 'Admin dashboard metrics retrieved', {
      cards: {
        totalStudents,
        activeStudents,
        totalFaculty,
        facultyCount: activeFaculty,
        upcomingExamsCount,
        pendingComplaintsCount,
        recentNoticesCount,
        averageAttendance,
        clearStudentsCount: financials.clearStudentsCount,
        pendingStudentsCount: financials.pendingStudentsCount,
        overdueStudentsCount: financials.overdueStudentsCount,
        partialStudentsCount: financials.partialStudentsCount,
        totalFees: financials.totalFeesConfigured,
        totalCollected: financials.totalCollected,
        netCollected: financials.netCollected,
        totalPending: financials.totalOutstanding,
        totalPendingFees: financials.totalPendingFees,
        totalOutstanding: financials.totalOutstanding,
        todayCollection: financials.todayCollection,
        monthlyCollection: financials.monthlyCollection,
        totalScholarships: financials.totalScholarships,
        totalRefunds: financials.totalRefunds
      },
      charts: {
        monthlyTrends,
        paymentDistribution: [
          { status: 'SUCCESS', count: financials.successfulPaymentsCount, amount: financials.totalCollected },
          { status: 'PENDING', count: financials.pendingPaymentsCount, amount: 0 },
          { status: 'FAILED', count: financials.failedPaymentsCount, amount: 0 }
        ]
      },
      recentPayments,
      upcomingExams,
      pendingComplaints,
      recentNotices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Students List with Search, Filter, Pagination, and Live Dues
 * GET /api/admin/students
 */
export const getStudents = async (req, res, next) => {
  try {
    const {
      search = '',
      course = '',
      branch = '',
      semester = '',
      status = '',
      feeStatus = '',
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (course) query.course = course;
    if (branch) query.branch = branch;
    if (semester) query.semester = semester.toString();
    if (status) query.status = status;

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: regex },
        { universityRollNumber: regex },
        { collegeRegistrationNumber: regex },
        { email: regex },
        { mobile: regex }
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Attach live authoritative financial status to each student
    const enrichedStudents = await Promise.all(
      students.map(async (st) => {
        const fees = await calculateStudentFees(st._id);
        return {
          ...st,
          feeStatus: fees.status,
          totalPayable: fees.totalPayable,
          totalPaid: fees.totalPaid,
          pendingAmount: fees.pendingAmount,
          remainingDue: fees.pendingAmount,
          waiverTotal: fees.waiverTotal,
          totalLateFines: fees.totalLateFines,
          feeSummary: fees
        };
      })
    );

    // Filter by feeStatus if requested
    const filtered = feeStatus
      ? enrichedStudents.filter((s) => s.feeStatus.toUpperCase() === feeStatus.toUpperCase())
      : enrichedStudents;

    return sendSuccess(res, 'Students retrieved successfully', {
      students: filtered,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Students Categorized by Fee Status (CLEAR, PENDING, or OVERDUE)
 * GET /api/admin/fees-by-status
 */
export const getFeeCategorizedStudents = async (req, res, next) => {
  try {
    const { status = 'PENDING', search = '' } = req.query;
    const targetStatus = status.toUpperCase();

    const allStudents = await Student.find().sort({ createdAt: -1 }).lean();
    const categorized = [];

    for (const student of allStudents) {
      const feeSummary = await calculateStudentFees(student._id);
      let match = false;

      if (targetStatus === 'CLEAR') {
        match = feeSummary.status === 'CLEAR' && feeSummary.pendingAmount === 0;
      } else if (targetStatus === 'OVERDUE') {
        match = feeSummary.status === 'OVERDUE';
      } else if (targetStatus === 'PENDING') {
        match = feeSummary.status === 'PENDING' || feeSummary.status === 'PARTIAL' || feeSummary.pendingAmount > 0;
      } else {
        match = feeSummary.status === targetStatus;
      }

      if (match) {
        if (
          !search ||
          student.fullName.toLowerCase().includes(search.toLowerCase()) ||
          student.universityRollNumber.toLowerCase().includes(search.toLowerCase()) ||
          student.email.toLowerCase().includes(search.toLowerCase())
        ) {
          categorized.push({
            _id: student._id,
            fullName: student.fullName,
            universityRollNumber: student.universityRollNumber,
            collegeRegistrationNumber: student.collegeRegistrationNumber,
            email: student.email,
            mobile: student.mobile,
            course: student.course,
            branch: student.branch || 'General',
            semester: student.semester,
            academicYear: student.academicYear,
            totalPayable: feeSummary.totalPayable,
            paidAmount: feeSummary.netPaid || feeSummary.totalPaid,
            pendingAmount: feeSummary.pendingAmount,
            status: feeSummary.status,
            feeStatus: feeSummary.status,
            waiverTotal: feeSummary.waiverTotal,
            totalLateFines: feeSummary.totalLateFines,
            feeSummary
          });
        }
      }
    }

    return sendSuccess(res, `${targetStatus} fee students list retrieved`, {
      status: targetStatus,
      count: categorized.length,
      students: categorized
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Creates Student
 * POST /api/admin/students
 */
export const createStudent = async (req, res, next) => {
  try {
    const {
      fullName,
      fatherName,
      motherName = '',
      mobile,
      email,
      universityRollNumber,
      collegeRegistrationNumber,
      admissionNumber = '',
      dateOfBirth = '',
      gender = '',
      course,
      branch = 'General',
      semester,
      section = 'A',
      academicYear,
      category = 'General',
      address = '',
      city = '',
      state = '',
      pincode = '',
      guardianContact = '',
      profilePhoto = '',
      password = 'Password@123',
      tuitionFee = 0,
      examinationFee = 0,
      registrationFee = 0,
      libraryFee = 0,
      laboratoryFee = 0,
      hostelFee = 0,
      transportFee = 0,
      otherCharges = 0,
      academicFee = 0
    } = req.body;

    if (!fullName || !fatherName || !mobile || !email || !universityRollNumber || !course || !semester || !academicYear) {
      return sendError(res, 'Full Name, Father Name, Mobile, Email, Roll Number, Course, Semester, and Academic Year are required.', 400);
    }

    if (profilePhoto && !isValidPhotoDataUrl(profilePhoto)) {
      return sendError(res, 'Profile photo must be a valid image under 5MB.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const regNumber = collegeRegistrationNumber || admissionNumber || universityRollNumber;
    const admNumber = admissionNumber || collegeRegistrationNumber || universityRollNumber;

    const student = await Student.create({
      fullName: fullName.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      mobile: mobile.trim(),
      email: email.trim().toLowerCase(),
      universityRollNumber: universityRollNumber.trim().toUpperCase(),
      collegeRegistrationNumber: regNumber.trim().toUpperCase(),
      admissionNumber: admNumber.trim().toUpperCase(),
      dateOfBirth: dateOfBirth.trim(),
      gender: gender.trim(),
      course: course.trim(),
      branch: branch.trim(),
      semester: semester.toString().trim(),
      section: section.trim() || 'A',
      academicYear: academicYear.trim(),
      category: category.trim() || 'General',
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      guardianContact: guardianContact.trim(),
      profilePhoto: profilePhoto || '',
      passwordHash,
      status: 'active'
    });

    const parsedTuition = Number(tuitionFee) || Number(academicFee) || 0;

    // Create Fee record
    await Fee.create({
      studentId: student._id,
      tuitionFee: parsedTuition,
      examinationFee: Number(examinationFee) || 0,
      registrationFee: Number(registrationFee) || 0,
      libraryFee: Number(libraryFee) || 0,
      laboratoryFee: Number(laboratoryFee) || 0,
      hostelFee: Number(hostelFee) || 0,
      transportFee: Number(transportFee) || 0,
      otherCharges: Number(otherCharges) || 0,
      academicFee: parsedTuition
    });

    const feeSummary = await calculateStudentFees(student._id);

    return sendSuccess(
      res,
      'Student created successfully',
      {
        student,
        feeSummary
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Student 360 Details for Admin
 * GET /api/admin/students/:id
 */
export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid student ID', 400);
    }

    const student = await Student.findById(id).lean();
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    const feeSummary = await calculateStudentFees(student._id);
    const feeConfig = await Fee.findOne({ studentId: student._id }).lean();
    const payments = await Payment.find({ studentId: student._id }).sort({ createdAt: -1 }).lean();
    const fines = await Fine.find({ studentId: student._id }).sort({ createdAt: -1 }).lean();
    const attendance = await Attendance.find({ studentId: student._id }).sort({ subject: 1 }).lean();

    return sendSuccess(res, 'Student details fetched', {
      student,
      feeConfig: feeConfig || { tuitionFee: 0, otherCharges: 0 },
      feeSummary,
      payments,
      fines,
      attendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Student Details
 * PUT /api/admin/students/:id
 */
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      fatherName,
      motherName,
      mobile,
      email,
      course,
      branch,
      semester,
      section,
      academicYear,
      admissionNumber,
      dateOfBirth,
      gender,
      category,
      address,
      city,
      state,
      pincode,
      guardianContact,
      profilePhoto,
      status
    } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    if (fullName) student.fullName = fullName.trim();
    if (fatherName) student.fatherName = fatherName.trim();
    if (motherName !== undefined) student.motherName = motherName.trim();
    if (mobile) student.mobile = mobile.trim();
    if (email) student.email = email.trim().toLowerCase();
    if (course) student.course = course.trim();
    if (branch) student.branch = branch.trim();
    if (semester !== undefined) student.semester = semester.toString().trim();
    if (section !== undefined) student.section = section.trim();
    if (academicYear) student.academicYear = academicYear.trim();
    if (admissionNumber !== undefined) student.admissionNumber = admissionNumber.trim();
    if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth.trim();
    if (gender !== undefined) student.gender = gender.trim();
    if (category !== undefined) student.category = category.trim();
    if (address !== undefined) student.address = address.trim();
    if (city !== undefined) student.city = city.trim();
    if (state !== undefined) student.state = state.trim();
    if (pincode !== undefined) student.pincode = pincode.trim();
    if (guardianContact !== undefined) student.guardianContact = guardianContact.trim();
    if (profilePhoto !== undefined) {
      if (profilePhoto && !isValidPhotoDataUrl(profilePhoto)) {
        return sendError(res, 'Invalid photo format or file exceeds 5MB.', 400);
      }
      student.profilePhoto = profilePhoto;
    }
    if (status && ['active', 'inactive'].includes(status)) student.status = status;

    await student.save();

    return sendSuccess(res, 'Student updated successfully', student);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Student
 * DELETE /api/admin/students/:id
 */
export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    await Fee.deleteMany({ studentId: id });
    await Fine.deleteMany({ studentId: id });
    await Attendance.deleteMany({ studentId: id });
    await Payment.deleteMany({ studentId: id });

    return sendSuccess(res, 'Student and associated records removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Student Fee Configuration
 * GET /api/admin/fees/:studentId
 */
export const getStudentFee = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const feeSummary = await calculateStudentFees(studentId);
    return sendSuccess(res, 'Fee details fetched', feeSummary);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Student Fee Configuration
 * PUT /api/admin/fees/:studentId
 */
export const updateStudentFee = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const {
      tuitionFee,
      examinationFee,
      registrationFee,
      libraryFee,
      laboratoryFee,
      hostelFee,
      transportFee,
      otherCharges,
      academicFee,
      lateFineRule
    } = req.body;

    let feeRecord = await Fee.findOne({ studentId });
    if (!feeRecord) {
      feeRecord = new Fee({ studentId });
    }

    if (tuitionFee !== undefined) feeRecord.tuitionFee = Number(tuitionFee);
    else if (academicFee !== undefined) feeRecord.tuitionFee = Number(academicFee);

    if (examinationFee !== undefined) feeRecord.examinationFee = Number(examinationFee);
    if (registrationFee !== undefined) feeRecord.registrationFee = Number(registrationFee);
    if (libraryFee !== undefined) feeRecord.libraryFee = Number(libraryFee);
    if (laboratoryFee !== undefined) feeRecord.laboratoryFee = Number(laboratoryFee);
    if (hostelFee !== undefined) feeRecord.hostelFee = Number(hostelFee);
    if (transportFee !== undefined) feeRecord.transportFee = Number(transportFee);
    if (otherCharges !== undefined) feeRecord.otherCharges = Number(otherCharges);

    if (lateFineRule) {
      feeRecord.lateFineRule = {
        type: lateFineRule.type || 'PER_DAY',
        amount: Number(lateFineRule.amount || 50),
        graceDays: Number(lateFineRule.graceDays || 5)
      };
    }

    await feeRecord.save();

    const updatedSummary = await calculateStudentFees(studentId);
    return sendSuccess(res, 'Fee structure updated successfully', updatedSummary);
  } catch (error) {
    next(error);
  }
};

/**
 * Configure Installments for Student
 * POST /api/admin/fees/:studentId/installments
 */
export const configureInstallments = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { installments } = req.body;

    if (!Array.isArray(installments) || installments.length === 0) {
      return sendError(res, 'At least one installment is required', 400);
    }

    let feeRecord = await Fee.findOne({ studentId });
    if (!feeRecord) {
      feeRecord = new Fee({ studentId });
    }

    feeRecord.installments = installments.map((inst, idx) => ({
      installmentNumber: inst.installmentNumber || idx + 1,
      title: inst.title || `Installment ${idx + 1}`,
      amount: Number(inst.amount || 0),
      dueDate: new Date(inst.dueDate || Date.now() + (idx + 1) * 30 * 86400000),
      paidAmount: 0,
      remainingAmount: Number(inst.amount || 0),
      lateFine: 0,
      status: 'UPCOMING'
    }));

    await feeRecord.save();
    const updatedSummary = await calculateStudentFees(studentId);
    return sendSuccess(res, 'Installments configured successfully', updatedSummary);
  } catch (error) {
    next(error);
  }
};

/**
 * Apply Scholarship / Discount / Waiver
 * POST /api/admin/fees/:studentId/waivers
 */
export const applyWaiver = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { type = 'SCHOLARSHIP', title, amount, reason, approvedBy } = req.body;

    if (!title || !amount || Number(amount) <= 0) {
      return sendError(res, 'Valid title and positive amount are required', 400);
    }

    let feeRecord = await Fee.findOne({ studentId });
    if (!feeRecord) {
      feeRecord = new Fee({ studentId });
    }

    feeRecord.waivers.push({
      type: ['SCHOLARSHIP', 'DISCOUNT', 'WAIVER'].includes(type) ? type : 'SCHOLARSHIP',
      title: title.trim(),
      amount: Number(amount),
      reason: (reason || 'Administrative waiver').trim(),
      approvedBy: (approvedBy || req.user?.name || 'JBIT Administration').trim(),
      appliedDate: new Date()
    });

    await feeRecord.save();
    const updatedSummary = await calculateStudentFees(studentId);
    return sendSuccess(res, 'Scholarship/Discount applied successfully', updatedSummary);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Scholarship / Waiver
 * DELETE /api/admin/fees/:studentId/waivers/:waiverId
 */
export const removeWaiver = async (req, res, next) => {
  try {
    const { studentId, waiverId } = req.params;
    const feeRecord = await Fee.findOne({ studentId });
    if (!feeRecord) return sendError(res, 'Fee record not found', 404);

    feeRecord.waivers = feeRecord.waivers.filter((w) => w._id.toString() !== waiverId);
    await feeRecord.save();

    const updatedSummary = await calculateStudentFees(studentId);
    return sendSuccess(res, 'Scholarship/Waiver removed successfully', updatedSummary);
  } catch (error) {
    next(error);
  }
};

/**
 * Record Payment Refund
 * POST /api/admin/payments/:paymentId/refund
 */
export const recordPaymentRefund = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { refundAmount, reason, referenceNumber } = req.body;

    if (!refundAmount || Number(refundAmount) <= 0 || !reason) {
      return sendError(res, 'Valid refund amount and reason are required', 400);
    }

    const refNum = referenceNumber?.trim() || `REF-${Date.now()}`;

    const payment = await Payment.findById(paymentId);
    if (!payment) return sendError(res, 'Payment transaction not found', 404);
    if (payment.status !== 'SUCCESS') return sendError(res, 'Refund can only be recorded on successful payments', 400);

    const currentRefunded = Number(payment.totalRefunded || 0);
    const maxRefundable = Number(payment.amount) - currentRefunded;

    if (Number(refundAmount) > maxRefundable) {
      return sendError(res, `Refund amount cannot exceed remaining refundable amount of ₹${maxRefundable}`, 400);
    }

    payment.refunds.push({
      refundAmount: Number(refundAmount),
      refundDate: new Date(),
      reason: reason.trim(),
      referenceNumber: refNum,
      approvedBy: req.user?.name || 'JBIT Accounts Office'
    });

    payment.totalRefunded = currentRefunded + Number(refundAmount);
    payment.refundStatus = payment.totalRefunded >= payment.amount ? 'FULL' : 'PARTIAL';
    await payment.save();

    // Recalculate student fees automatically
    const updatedSummary = await calculateStudentFees(payment.studentId);

    return sendSuccess(res, 'Refund recorded successfully against payment', {
      payment,
      studentFees: updatedSummary,
      updatedFees: updatedSummary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fee Structures Master Templates
 * GET /api/admin/fee-structures
 */
export const getFeeStructures = async (req, res, next) => {
  try {
    const structures = await FeeStructure.find().sort({ course: 1, semester: 1 }).lean();
    return sendSuccess(res, 'Master fee structures retrieved', structures);
  } catch (error) {
    next(error);
  }
};

export const createFeeStructure = async (req, res, next) => {
  try {
    const structure = await FeeStructure.create(req.body);
    return sendSuccess(res, 'Fee structure created successfully', structure, 201);
  } catch (error) {
    next(error);
  }
};

export const updateFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const structure = await FeeStructure.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!structure) return sendError(res, 'Fee structure not found', 404);
    return sendSuccess(res, 'Fee structure updated successfully', structure);
  } catch (error) {
    next(error);
  }
};

export const deleteFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const structure = await FeeStructure.findByIdAndDelete(id);
    if (!structure) return sendError(res, 'Fee structure not found', 404);
    return sendSuccess(res, 'Fee structure deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Send Fee Reminder Notice
 * POST /api/admin/fees/reminders/send
 */
export const sendFeeReminder = async (req, res, next) => {
  try {
    const { studentId, reminderType = 'UPCOMING' } = req.body;
    if (!studentId) return sendError(res, 'Student ID is required', 400);

    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const feeSummary = await calculateStudentFees(studentId);
    if (feeSummary.pendingAmount <= 0) {
      return sendError(res, 'Student has no pending dues', 400);
    }

    const firstUnpaidInst = feeSummary.installments?.find((i) => i.status !== 'PAID') || {
      title: 'Semester Fee',
      remainingAmount: feeSummary.pendingAmount,
      dueDate: new Date(Date.now() + 15 * 86400000)
    };

    const sent = await sendFeeReminderEmail({
      email: student.email,
      studentName: student.fullName,
      reminderType: reminderType.toUpperCase(),
      installment: firstUnpaidInst,
      remainingDue: feeSummary.pendingAmount
    });

    return sendSuccess(res, `Fee reminder dispatch initiated for [${student.email}]`, { sent });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Payments across all students with filters
 * GET /api/admin/payments
 */
export const getAllPayments = async (req, res, next) => {
  try {
    const {
      search = '',
      status = '',
      paymentMethod = '',
      startDate = '',
      endDate = '',
      page = 1,
      limit = 25
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 25, 1);
    const skip = (pageNum - 1) * limitNum;

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const matchingStudents = await Student.find({
        $or: [
          { fullName: regex },
          { universityRollNumber: regex },
          { collegeRegistrationNumber: regex }
        ]
      }).select('_id');

      const studentIds = matchingStudents.map((s) => s._id);

      query.$or = [
        { receiptNumber: regex },
        { transactionId: regex },
        { studentId: { $in: studentIds } }
      ];
    }

    const totalCount = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('studentId', 'fullName universityRollNumber collegeRegistrationNumber course semester mobile email')
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return sendSuccess(res, 'All payments retrieved', {
      payments,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Attendance Management Controllers
 */
export const getStudentAttendanceAdmin = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const records = await Attendance.find({ studentId }).sort({ subject: 1 }).lean();
    return sendSuccess(res, 'Attendance records fetched', records);
  } catch (error) {
    next(error);
  }
};

export const addAttendance = async (req, res, next) => {
  try {
    const { studentId, subject, totalClasses, attendedClasses } = req.body;

    if (!studentId || !subject || totalClasses === undefined || attendedClasses === undefined) {
      return sendError(res, 'Student, subject, total classes and attended classes are required', 400);
    }

    if (Number(attendedClasses) > Number(totalClasses)) {
      return sendError(res, 'Attended classes cannot exceed total classes', 400);
    }

    const record = new Attendance({
      studentId,
      subject: subject.trim(),
      totalClasses: Number(totalClasses),
      attendedClasses: Number(attendedClasses)
    });

    await record.save();
    return sendSuccess(res, 'Attendance record added successfully', record, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, totalClasses, attendedClasses } = req.body;

    const record = await Attendance.findById(id);
    if (!record) return sendError(res, 'Attendance record not found', 404);

    if (subject) record.subject = subject.trim();
    if (totalClasses !== undefined) record.totalClasses = Number(totalClasses);
    if (attendedClasses !== undefined) record.attendedClasses = Number(attendedClasses);

    if (record.attendedClasses > record.totalClasses) {
      return sendError(res, 'Attended classes cannot exceed total classes', 400);
    }

    await record.save();
    return sendSuccess(res, 'Attendance updated successfully', record);
  } catch (error) {
    next(error);
  }
};

export const deleteAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await Attendance.findByIdAndDelete(id);
    if (!record) return sendError(res, 'Attendance record not found', 404);
    return sendSuccess(res, 'Attendance record deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * Fine Management Controllers
 */
export const getStudentFinesAdmin = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const fines = await Fine.find({ studentId }).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 'Student fines retrieved', fines);
  } catch (error) {
    next(error);
  }
};

export const addFine = async (req, res, next) => {
  try {
    const { studentId, reason, amount, dueDate } = req.body;
    if (!studentId || !reason || amount === undefined || Number(amount) <= 0) {
      return sendError(res, 'Student, reason and positive amount are required', 400);
    }

    const fine = new Fine({
      studentId,
      reason: reason.trim(),
      amount: Number(amount),
      dueDate: dueDate ? new Date(dueDate) : null
    });

    await fine.save();
    await calculateStudentFees(studentId);

    return sendSuccess(res, 'Fine added successfully', fine, 201);
  } catch (error) {
    next(error);
  }
};

export const updateFine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, amount, status } = req.body;

    const fine = await Fine.findById(id);
    if (!fine) return sendError(res, 'Fine not found', 404);

    if (reason) fine.reason = reason.trim();
    if (amount !== undefined) fine.amount = Number(amount);
    if (status && ['UNPAID', 'PAID', 'WAIVED'].includes(status)) {
      fine.status = status;
      if (status === 'PAID') fine.paidDate = new Date();
    }

    await fine.save();
    await calculateStudentFees(fine.studentId);

    return sendSuccess(res, 'Fine updated successfully', fine);
  } catch (error) {
    next(error);
  }
};

export const deleteFine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fine = await Fine.findByIdAndDelete(id);
    if (!fine) return sendError(res, 'Fine not found', 404);

    await calculateStudentFees(fine.studentId);
    return sendSuccess(res, 'Fine removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Reports Handlers
 */
export const getFeeReports = async (req, res, next) => {
  try {
    const students = await Student.find({ status: 'active' })
      .select('fullName universityRollNumber collegeRegistrationNumber course branch semester mobile email')
      .lean();

    const reportData = await Promise.all(
      students.map(async (st) => {
        const fees = await calculateStudentFees(st._id);
        return {
          studentId: st._id,
          name: st.fullName,
          rollNumber: st.universityRollNumber,
          regNumber: st.collegeRegistrationNumber,
          course: st.course,
          branch: st.branch || 'General',
          semester: st.semester,
          tuitionFee: fees.tuitionFee,
          examinationFee: fees.examinationFee,
          otherCharges: fees.otherCharges,
          waiverTotal: fees.waiverTotal,
          unpaidFines: fees.totalLateFines,
          totalPayable: fees.totalPayable,
          totalPaid: fees.netPaid || fees.totalPaid,
          remainingDue: fees.pendingAmount,
          status: fees.status
        };
      })
    );

    const totals = reportData.reduce(
      (acc, curr) => {
        acc.totalPayable += curr.totalPayable;
        acc.totalPaid += curr.totalPaid;
        acc.totalDue += curr.remainingDue;
        acc.totalScholarships += curr.waiverTotal;
        return acc;
      },
      { totalPayable: 0, totalPaid: 0, totalDue: 0, totalScholarships: 0 }
    );

    return sendSuccess(res, 'Fee report generated', {
      totals,
      studentsCount: reportData.length,
      rows: reportData
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentReports = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('studentId', 'fullName universityRollNumber course semester')
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    const summary = payments.reduce(
      (acc, p) => {
        if (p.status === 'SUCCESS') {
          acc.totalSuccessAmount += p.amount;
          acc.successCount += 1;
        } else if (p.status === 'PENDING') {
          acc.pendingCount += 1;
        } else if (p.status === 'FAILED') {
          acc.failedCount += 1;
        }
        acc.totalRefunded += Number(p.totalRefunded || 0);
        return acc;
      },
      { totalSuccessAmount: 0, successCount: 0, pendingCount: 0, failedCount: 0, totalRefunded: 0 }
    );

    return sendSuccess(res, 'Payment report generated', {
      summary,
      totalTransactions: payments.length,
      rows: payments
    });
  } catch (error) {
    next(error);
  }
};

export const getFineReports = async (req, res, next) => {
  try {
    const fines = await Fine.find()
      .populate('studentId', 'fullName universityRollNumber course semester')
      .sort({ createdAt: -1 })
      .lean();

    const summary = fines.reduce(
      (acc, f) => {
        if (f.status === 'PAID') {
          acc.paidAmount += f.amount;
          acc.paidCount += 1;
        } else {
          acc.unpaidAmount += f.amount;
          acc.unpaidCount += 1;
        }
        return acc;
      },
      { paidAmount: 0, paidCount: 0, unpaidAmount: 0, unpaidCount: 0 }
    );

    return sendSuccess(res, 'Fine report generated', {
      summary,
      totalFines: fines.length,
      rows: fines
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Reports to CSV
 * GET /api/admin/reports/export-csv
 */
export const exportReportCsv = async (req, res, next) => {
  try {
    const { type = 'fees' } = req.query;

    if (type === 'payments') {
      const payments = await Payment.find({ status: 'SUCCESS' })
        .populate('studentId', 'fullName universityRollNumber course semester')
        .sort({ paymentDate: -1 })
        .lean();

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="JBIT_Payment_Report_${Date.now()}.csv"`);

      let csv = 'Receipt No,Transaction ID,Student Name,Roll No,Course,Amount,Payment Method,Date,Refunded Amount,Status\n';
      payments.forEach((p) => {
        csv += `"${p.receiptNumber}","${p.transactionId}","${p.studentId?.fullName || ''}","${p.studentId?.universityRollNumber || ''}","${p.studentId?.course || ''}",${p.amount},"${p.paymentMethod}","${new Date(p.paymentDate).toLocaleDateString('en-IN')}",${p.totalRefunded || 0},"${p.status}"\n`;
      });
      return res.send(csv);
    }

    // Default: Fees Report
    const students = await Student.find({ status: 'active' }).lean();
    let csv = 'Roll No,Student Name,Course,Semester,Total Payable,Paid Amount,Pending Amount,Scholarship,Late Fine,Fee Status\n';

    for (const st of students) {
      const fees = await calculateStudentFees(st._id);
      csv += `"${st.universityRollNumber}","${st.fullName}","${st.course}","${st.semester}",${fees.totalPayable},${fees.netPaid},${fees.pendingAmount},${fees.waiverTotal},${fees.totalLateFines},"${fees.status}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="JBIT_Fee_Ledger_${Date.now()}.csv"`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Download Student Documents
 */
export const getAdminStudentAdmitCard = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const feeSummary = await calculateStudentFees(studentId);
    await generateAdmitCardPdf(student, feeSummary, res);
  } catch (error) {
    next(error);
  }
};

export const getAdminStudentClearance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const feeSummary = await calculateStudentFees(studentId);
    generateFeeClearanceCertificatePdf(student, feeSummary, res);
  } catch (error) {
    next(error);
  }
};

export const getAdminStudentNoDues = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const feeSummary = await calculateStudentFees(studentId);
    const unpaidFines = await Fine.find({ studentId, status: 'UNPAID' }).lean();
    generateNoDuesCertificatePdf(student, feeSummary, unpaidFines, res);
  } catch (error) {
    next(error);
  }
};

export const getAdminStudentIdCard = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    await generateStudentIdCardPdf(student, res);
  } catch (error) {
    next(error);
  }
};

export const getAdminStudentMarksheet = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;
    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const query = { studentId };
    if (semester) query.semester = semester;
    const resultRecord = await Result.findOne(query).sort({ semester: -1 }).lean();

    await generateMarksheetPdf(student, resultRecord, res);
  } catch (error) {
    next(error);
  }
};

export const getAdminStudentBonafide = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const { purpose } = req.query;
    await generateBonafideCertificatePdf(student, purpose || 'Academic Verification', res);
  } catch (error) {
    next(error);
  }
};

export const getAdminStudentCharacter = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    await generateCharacterCertificatePdf(student, res);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * FACULTY MANAGEMENT
 * ==========================================
 */
export const getFacultyList = async (req, res, next) => {
  try {
    const { department, search, status } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { employeeId: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const faculties = await Faculty.find(filter).select('-passwordHash').sort({ name: 1 }).lean();
    return sendSuccess(res, 'Faculty list fetched', faculties);
  } catch (error) {
    next(error);
  }
};

export const getFacultyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findById(id).select('-passwordHash').lean();
    if (!faculty) return sendError(res, 'Faculty member not found', 404);
    return sendSuccess(res, 'Faculty details fetched', faculty);
  } catch (error) {
    next(error);
  }
};

export const createFaculty = async (req, res, next) => {
  try {
    const {
      employeeId,
      name,
      parentName,
      email,
      mobile,
      password,
      department,
      designation,
      course,
      branch,
      qualification,
      joiningDate,
      dateOfBirth,
      gender,
      address,
      subjects,
      assignedSubjects,
      assignedClasses,
      profilePhoto,
      status
    } = req.body;

    if (!employeeId || !name || !email || !mobile || !password || !department) {
      return sendError(res, 'Please provide employeeId, name, email, mobile, password, and department', 400);
    }

    const existingEmp = await Faculty.findOne({
      $or: [{ employeeId: employeeId.trim().toUpperCase() }, { email: email.trim().toLowerCase() }]
    });
    if (existingEmp) {
      return sendError(res, 'Faculty with this Employee ID or Email already exists', 400);
    }

    if (profilePhoto && !isValidPhotoDataUrl(profilePhoto)) {
      return sendError(res, 'Invalid profile photo format or size exceeds 5MB', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const faculty = new Faculty({
      employeeId: employeeId.trim().toUpperCase(),
      name: name.trim(),
      parentName: parentName ? parentName.trim() : '',
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      passwordHash,
      department: department.trim(),
      designation: designation ? designation.trim() : 'Assistant Professor',
      course: course ? course.trim() : '',
      branch: branch ? branch.trim() : '',
      qualification: qualification ? qualification.trim() : '',
      joiningDate: joiningDate ? joiningDate.trim() : '',
      dateOfBirth: dateOfBirth ? dateOfBirth.trim() : '',
      gender: gender ? gender.trim() : '',
      address: address ? address.trim() : '',
      subjects: Array.isArray(subjects) ? subjects : Array.isArray(assignedSubjects) ? assignedSubjects : [],
      assignedSubjects: Array.isArray(assignedSubjects) ? assignedSubjects : Array.isArray(subjects) ? subjects : [],
      assignedClasses: Array.isArray(assignedClasses) ? assignedClasses : [],
      profilePhoto: profilePhoto || null,
      emailVerified: true,
      status: status || 'active'
    });

    await faculty.save();
    const result = faculty.toObject();
    delete result.passwordHash;

    return sendSuccess(res, 'Faculty member registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      parentName,
      email,
      mobile,
      department,
      designation,
      course,
      branch,
      qualification,
      joiningDate,
      dateOfBirth,
      gender,
      address,
      subjects,
      assignedSubjects,
      assignedClasses,
      status,
      emailVerified,
      profilePhoto,
      password
    } = req.body;

    const faculty = await Faculty.findById(id);
    if (!faculty) return sendError(res, 'Faculty member not found', 404);

    if (name) faculty.name = name.trim();
    if (parentName !== undefined) faculty.parentName = parentName ? parentName.trim() : '';
    if (email) faculty.email = email.trim().toLowerCase();
    if (mobile) faculty.mobile = mobile.trim();
    if (department) faculty.department = department.trim();
    if (designation) faculty.designation = designation.trim();
    if (course !== undefined) faculty.course = course ? course.trim() : '';
    if (branch !== undefined) faculty.branch = branch ? branch.trim() : '';
    if (qualification !== undefined) faculty.qualification = qualification ? qualification.trim() : '';
    if (joiningDate !== undefined) faculty.joiningDate = joiningDate ? joiningDate.trim() : '';
    if (dateOfBirth !== undefined) faculty.dateOfBirth = dateOfBirth ? dateOfBirth.trim() : '';
    if (gender !== undefined) faculty.gender = gender ? gender.trim() : '';
    if (address !== undefined) faculty.address = address ? address.trim() : '';
    if (subjects !== undefined) {
      faculty.subjects = subjects;
      faculty.assignedSubjects = subjects;
    }
    if (assignedSubjects !== undefined) {
      faculty.assignedSubjects = assignedSubjects;
      faculty.subjects = assignedSubjects;
    }
    if (assignedClasses !== undefined) faculty.assignedClasses = assignedClasses;
    if (status) faculty.status = status;
    if (emailVerified !== undefined) faculty.emailVerified = !!emailVerified;
    if (profilePhoto !== undefined) {
      if (profilePhoto && !isValidPhotoDataUrl(profilePhoto)) {
        return sendError(res, 'Invalid profile photo format or size exceeds 5MB', 400);
      }
      faculty.profilePhoto = profilePhoto;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      faculty.passwordHash = await bcrypt.hash(password, salt);
    }

    await faculty.save();
    const result = faculty.toObject();
    delete result.passwordHash;

    return sendSuccess(res, 'Faculty updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const toggleFacultyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findById(id);
    if (!faculty) return sendError(res, 'Faculty member not found', 404);

    faculty.status = faculty.status === 'active' ? 'deactivated' : 'active';
    await faculty.save();

    return sendSuccess(
      res,
      `Faculty account ${faculty.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      { _id: faculty._id, status: faculty.status }
    );
  } catch (error) {
    next(error);
  }
};

export const deleteFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findByIdAndDelete(id);
    if (!faculty) return sendError(res, 'Faculty member not found', 404);
    return sendSuccess(res, 'Faculty member removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * COURSES & SUBJECTS MANAGEMENT
 * ==========================================
 */
export const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ courseName: 1, name: 1 }).lean();
    const formatted = courses.map((c) => ({
      ...c,
      name: c.name || c.courseName,
      courseName: c.courseName || c.name
    }));
    return sendSuccess(res, 'Courses fetched', formatted);
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { courseCode, name, courseName, durationYears, totalSemesters, branches, department } = req.body;
    const finalCourseName = (courseName || name || '').trim();
    if (!courseCode || !finalCourseName) {
      return sendError(res, 'Course Code and Course Name are required', 400);
    }

    const existing = await Course.findOne({ courseCode: courseCode.trim().toUpperCase() });
    if (existing) return sendError(res, 'Course code already exists', 400);

    const course = new Course({
      courseCode: courseCode.trim().toUpperCase(),
      courseName: finalCourseName,
      name: finalCourseName,
      durationYears: durationYears || 4,
      totalSemesters: totalSemesters || 8,
      branches: Array.isArray(branches) ? branches : [],
      department: department ? department.trim() : 'Engineering'
    });

    await course.save();
    return sendSuccess(res, 'Course created successfully', course, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, courseName, durationYears, totalSemesters, branches, department, status } = req.body;

    const course = await Course.findById(id);
    if (!course) return sendError(res, 'Course not found', 404);

    const finalCourseName = (courseName || name || '').trim();
    if (finalCourseName) {
      course.courseName = finalCourseName;
      course.name = finalCourseName;
    }
    if (durationYears !== undefined) course.durationYears = durationYears;
    if (totalSemesters !== undefined) course.totalSemesters = totalSemesters;
    if (branches !== undefined) course.branches = branches;
    if (department) course.department = department.trim();
    if (status) course.status = status;

    await course.save();
    return sendSuccess(res, 'Course updated successfully', course);
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    if (!course) return sendError(res, 'Course not found', 404);
    return sendSuccess(res, 'Course deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getSubjects = async (req, res, next) => {
  try {
    const { course, branch, semester } = req.query;
    const filter = {};
    if (course) filter.course = course;
    if (branch) filter.branch = branch;
    if (semester) filter.semester = semester;

    const subjects = await Subject.find(filter).sort({ subjectCode: 1 }).lean();
    const formatted = subjects.map((s) => ({
      ...s,
      name: s.name || s.subjectName,
      subjectName: s.subjectName || s.name
    }));
    return sendSuccess(res, 'Subjects fetched', formatted);
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { subjectCode, name, subjectName, course, branch, semester, credits, type } = req.body;
    const finalSubjectName = (subjectName || name || '').trim();
    if (!subjectCode || !finalSubjectName || !course || !semester) {
      return sendError(res, 'Subject Code, Name, Course, and Semester are required', 400);
    }

    const existing = await Subject.findOne({
      subjectCode: subjectCode.trim().toUpperCase(),
      course: course.trim(),
      semester: semester.toString().trim()
    });
    if (existing) return sendError(res, 'Subject code already registered for this course & semester', 400);

    const subject = new Subject({
      subjectCode: subjectCode.trim().toUpperCase(),
      subjectName: finalSubjectName,
      name: finalSubjectName,
      course: course.trim(),
      branch: branch ? branch.trim() : '',
      semester: semester.toString().trim(),
      credits: credits !== undefined ? Number(credits) : 4,
      type: type || 'THEORY'
    });

    await subject.save();
    return sendSuccess(res, 'Subject registered successfully', subject, 201);
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, subjectName, credits, type, status } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) return sendError(res, 'Subject not found', 404);

    const finalSubjectName = (subjectName || name || '').trim();
    if (finalSubjectName) {
      subject.subjectName = finalSubjectName;
      subject.name = finalSubjectName;
    }
    if (credits !== undefined) subject.credits = Number(credits);
    if (type) subject.type = type;
    if (status) subject.status = status;

    await subject.save();
    return sendSuccess(res, 'Subject updated successfully', subject);
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) return sendError(res, 'Subject not found', 404);
    return sendSuccess(res, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * TIMETABLE MANAGEMENT
 * ==========================================
 */
export const getAdminTimetable = async (req, res, next) => {
  try {
    const { course, branch, semester, section, day } = req.query;
    const filter = {};
    if (course) filter.course = course;
    if (branch) filter.branch = branch;
    if (semester) filter.semester = semester;
    if (section) filter.section = section;
    if (day) filter.day = day;

    const timetable = await Timetable.find(filter).sort({ day: 1, timeSlot: 1 }).lean();
    return sendSuccess(res, 'Timetable fetched', timetable);
  } catch (error) {
    next(error);
  }
};

export const createTimetableSlot = async (req, res, next) => {
  try {
    const { day, timeSlot, course, branch, semester, section, subject, subjectCode, room, facultyId, facultyName } = req.body;

    if (!day || !timeSlot || !course || !semester || !subject) {
      return sendError(res, 'Day, Time Slot, Course, Semester, and Subject are required', 400);
    }

    const slot = new Timetable({
      day,
      timeSlot: timeSlot.trim(),
      course: course.trim(),
      branch: branch ? branch.trim() : '',
      semester: semester.toString().trim(),
      section: section ? section.trim() : 'A',
      subject: subject.trim(),
      subjectCode: subjectCode ? subjectCode.trim().toUpperCase() : '',
      room: room ? room.trim() : 'LH-101',
      facultyId: facultyId || null,
      facultyName: facultyName ? facultyName.trim() : ''
    });

    await slot.save();
    return sendSuccess(res, 'Timetable slot created successfully', slot, 201);
  } catch (error) {
    next(error);
  }
};

export const updateTimetableSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slot = await Timetable.findByIdAndUpdate(id, req.body, { new: true });
    if (!slot) return sendError(res, 'Timetable slot not found', 404);
    return sendSuccess(res, 'Timetable slot updated', slot);
  } catch (error) {
    next(error);
  }
};

export const deleteTimetableSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slot = await Timetable.findByIdAndDelete(id);
    if (!slot) return sendError(res, 'Timetable slot not found', 404);
    return sendSuccess(res, 'Timetable slot deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * EXAM SCHEDULE MANAGEMENT
 * ==========================================
 */
export const getAdminExams = async (req, res, next) => {
  try {
    const { course, semester, status } = req.query;
    const filter = {};
    if (course) filter.course = course;
    if (semester) filter.semester = semester;
    if (status) filter.status = status;

    const exams = await Exam.find(filter).sort({ examDate: 1 }).lean();
    return sendSuccess(res, 'Exam schedules fetched', exams);
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req, res, next) => {
  try {
    const {
      examName,
      academicYear,
      course,
      branch,
      semester,
      section,
      subject,
      subjectCode,
      examDate,
      startTime,
      endTime,
      room,
      maxMarks,
      passingMarks,
      type,
      instructions
    } = req.body;

    if (!examName || !course || !semester || !subject || !examDate) {
      return sendError(res, 'Exam Name, Course, Semester, Subject, and Exam Date are required', 400);
    }

    const exam = new Exam({
      examName: examName.trim(),
      academicYear: academicYear || '2024-2025',
      course: course.trim(),
      branch: branch ? branch.trim() : '',
      semester: semester.toString().trim(),
      section: section || 'All',
      subject: subject.trim(),
      subjectCode: subjectCode ? subjectCode.trim().toUpperCase() : '',
      examDate: new Date(examDate),
      startTime: startTime || '10:00 AM',
      endTime: endTime || '01:00 PM',
      room: room || 'Examination Hall',
      maxMarks: maxMarks || 100,
      passingMarks: passingMarks || 40,
      type: type || 'END_TERM',
      instructions: instructions || 'Carry official Student ID & Admit Card. No electronics permitted.'
    });

    await exam.save();
    return sendSuccess(res, 'Exam schedule created successfully', exam, 201);
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByIdAndUpdate(id, req.body, { new: true });
    if (!exam) return sendError(res, 'Exam schedule not found', 404);
    return sendSuccess(res, 'Exam schedule updated', exam);
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) return sendError(res, 'Exam schedule not found', 404);
    return sendSuccess(res, 'Exam schedule deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * RESULTS / MARKS MANAGEMENT
 * ==========================================
 */
export const getAdminResults = async (req, res, next) => {
  try {
    const { studentId, course, semester } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (semester) filter.semester = semester;

    let query = Result.find(filter).populate('studentId', 'fullName universityRollNumber course branch semester');
    const results = await query.sort({ createdAt: -1 }).lean();

    return sendSuccess(res, 'Results fetched', results);
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateResult = async (req, res, next) => {
  try {
    const { studentId, semester, academicYear, marks } = req.body;
    if (!studentId || !semester || !Array.isArray(marks)) {
      return sendError(res, 'studentId, semester, and marks array are required', 400);
    }

    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    let totalPoints = 0;
    let totalCredits = 0;
    const backPapers = [];

    const computedMarks = marks.map((m) => {
      const internal = Number(m.internalMarks || 0);
      const practical = Number(m.practicalMarks || 0);
      const sessional = Number(m.sessionalMarks || 0);
      const external = Number(m.externalMarks || 0);
      const total = internal + practical + sessional + external;
      const max = Number(m.maxMarks || 100);
      const pct = (total / max) * 100;

      let grade = 'F';
      let gradePoint = 0;
      let status = 'FAIL';

      if (pct >= 90) { grade = 'O'; gradePoint = 10; status = 'PASS'; }
      else if (pct >= 80) { grade = 'A+'; gradePoint = 9; status = 'PASS'; }
      else if (pct >= 70) { grade = 'A'; gradePoint = 8; status = 'PASS'; }
      else if (pct >= 60) { grade = 'B+'; gradePoint = 7; status = 'PASS'; }
      else if (pct >= 50) { grade = 'B'; gradePoint = 6; status = 'PASS'; }
      else if (pct >= 40) { grade = 'C'; gradePoint = 5; status = 'PASS'; }
      else if (pct >= 35) { grade = 'P'; gradePoint = 4; status = 'PASS'; }
      else {
        grade = 'F'; gradePoint = 0; status = 'FAIL';
        backPapers.push(m.subjectCode || m.subjectName);
      }

      const credits = Number(m.credits || 4);
      totalCredits += credits;
      totalPoints += gradePoint * credits;

      return {
        subjectCode: m.subjectCode,
        subjectName: m.subjectName,
        internalMarks: internal,
        sessionalMarks: sessional,
        practicalMarks: practical,
        externalMarks: external,
        totalMarks: total,
        maxMarks: max,
        grade,
        gradePoint,
        credits,
        status
      };
    });

    const sgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;

    let resultRecord = await Result.findOne({ studentId, semester: semester.toString().trim() });
    if (!resultRecord) {
      resultRecord = new Result({
        studentId,
        semester: semester.toString().trim(),
        academicYear: academicYear || student.academicYear || '2024-2025',
        marks: computedMarks,
        totalCredits,
        sgpa,
        cgpa: sgpa,
        backPapers,
        status: backPapers.length === 0 ? 'PASS' : 'BACK_PAPER'
      });
    } else {
      resultRecord.marks = computedMarks;
      resultRecord.totalCredits = totalCredits;
      resultRecord.sgpa = sgpa;
      resultRecord.cgpa = sgpa;
      resultRecord.backPapers = backPapers;
      resultRecord.status = backPapers.length === 0 ? 'PASS' : 'BACK_PAPER';
    }

    await resultRecord.save();
    return sendSuccess(res, 'Student semester result recorded successfully', resultRecord);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * NOTICES MANAGEMENT
 * ==========================================
 */
export const getAdminNotices = async (req, res, next) => {
  try {
    const { category, targetAudience } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (targetAudience) filter.targetAudience = targetAudience;

    const notices = await Notice.find(filter).sort({ date: -1 }).lean();
    return sendSuccess(res, 'Notices fetched', notices);
  } catch (error) {
    next(error);
  }
};

export const createNotice = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      attachment,
      attachmentName,
      targetAudience,
      targetCourse,
      targetBranch,
      targetSemester,
      targetSection,
      expiresAt
    } = req.body;

    if (!title || !description) {
      return sendError(res, 'Notice title and description are required', 400);
    }

    const notice = new Notice({
      title: title.trim(),
      description: description.trim(),
      category: category || 'GENERAL',
      priority: priority || 'NORMAL',
      attachment: attachment || '',
      attachmentName: attachmentName || '',
      targetAudience: targetAudience || 'ALL',
      targetCourse: targetCourse || '',
      targetBranch: targetBranch || '',
      targetSemester: targetSemester || '',
      targetSection: targetSection || '',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      postedBy: {
        name: req.user.name || 'Administration',
        role: 'ADMIN'
      }
    });

    await notice.save();
    return sendSuccess(res, 'Notice published successfully', notice, 201);
  } catch (error) {
    next(error);
  }
};

export const updateNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findByIdAndUpdate(id, req.body, { new: true });
    if (!notice) return sendError(res, 'Notice not found', 404);
    return sendSuccess(res, 'Notice updated successfully', notice);
  } catch (error) {
    next(error);
  }
};

export const deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) return sendError(res, 'Notice not found', 404);
    return sendSuccess(res, 'Notice deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * COMPLAINTS DESK MANAGEMENT
 * ==========================================
 */
export const getAdminComplaints = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate('studentId', 'fullName universityRollNumber course semester mobile email')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Complaints fetched', complaints);
  } catch (error) {
    next(error);
  }
};

export const respondToComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminResponse, status, assignedTo } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) return sendError(res, 'Complaint ticket not found', 404);

    if (adminResponse) complaint.adminResponse = adminResponse.trim();
    if (assignedTo) complaint.assignedTo = assignedTo.trim();
    if (status) {
      complaint.status = status;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        complaint.resolvedAt = new Date();
      }
    }

    await complaint.save();
    return sendSuccess(res, 'Complaint response updated successfully', complaint);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * HOSTEL MANAGEMENT
 * ==========================================
 */
export const getHostelRooms = async (req, res, next) => {
  try {
    const { hostelName, block, status } = req.query;
    const filter = {};
    if (hostelName) filter.hostelName = hostelName;
    if (block) filter.block = block;
    if (status) filter.status = status;

    const rooms = await Hostel.find(filter)
      .populate('occupantStudentId', 'fullName universityRollNumber course semester mobile')
      .sort({ hostelName: 1, roomNumber: 1, bedNumber: 1 })
      .lean();

    return sendSuccess(res, 'Hostel rooms fetched', rooms);
  } catch (error) {
    next(error);
  }
};

export const createHostelRoom = async (req, res, next) => {
  try {
    const { hostelName, block, floor, roomNumber, bedNumber, hostelFee, wardenName, wardenContact } = req.body;
    if (!hostelName || !block || !roomNumber || !bedNumber) {
      return sendError(res, 'Hostel Name, Block, Room Number, and Bed Number are required', 400);
    }

    const existing = await Hostel.findOne({
      hostelName: hostelName.trim(),
      block: block.trim(),
      roomNumber: roomNumber.trim(),
      bedNumber: bedNumber.trim()
    });
    if (existing) return sendError(res, 'This bed allocation entry already exists in the system', 400);

    const room = new Hostel({
      hostelName: hostelName.trim(),
      block: block.trim(),
      floor: floor ? floor.trim() : '1st',
      roomNumber: roomNumber.trim(),
      bedNumber: bedNumber.trim(),
      hostelFee: hostelFee || 45000,
      wardenName: wardenName || 'Hostel Superintendent',
      wardenContact: wardenContact || '+91 9876543210',
      status: 'AVAILABLE'
    });

    await room.save();
    return sendSuccess(res, 'Hostel bed entry created successfully', room, 201);
  } catch (error) {
    next(error);
  }
};

export const assignHostelBed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentId, action } = req.body; // action: 'ASSIGN' or 'VACATE'

    const room = await Hostel.findById(id);
    if (!room) return sendError(res, 'Hostel room entry not found', 404);

    if (action === 'VACATE') {
      if (room.occupantStudentId) {
        await Student.findByIdAndUpdate(room.occupantStudentId, {
          'hostel.opted': false,
          'hostel.roomNumber': ''
        });
      }
      room.occupantStudentId = null;
      room.occupantName = '';
      room.occupantRoll = '';
      room.status = 'AVAILABLE';
      await room.save();
      return sendSuccess(res, 'Hostel bed vacated successfully', room);
    }

    if (!studentId) return sendError(res, 'studentId is required to assign', 400);

    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    room.occupantStudentId = student._id;
    room.occupantName = student.fullName;
    room.occupantRoll = student.universityRollNumber;
    room.status = 'OCCUPIED';
    await room.save();

    student.hostel = {
      opted: true,
      hostelName: room.hostelName,
      roomNumber: `${room.roomNumber}-${room.bedNumber}`,
      bedNumber: room.bedNumber
    };
    await student.save();

    return sendSuccess(res, 'Hostel bed assigned to student', room);
  } catch (error) {
    next(error);
  }
};

export const deleteHostelRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Hostel.findByIdAndDelete(id);
    if (!room) return sendError(res, 'Hostel entry not found', 404);
    return sendSuccess(res, 'Hostel room entry removed');
  } catch (error) {
    next(error);
  }
};

export const getHostelOutingRequests = async (req, res, next) => {
  try {
    const rooms = await Hostel.find({ 'outingRequests.0': { $exists: true } }).lean();
    const allRequests = [];
    rooms.forEach((r) => {
      (r.outingRequests || []).forEach((out) => {
        allRequests.push({
          ...out,
          hostelName: r.hostelName,
          roomNumber: r.roomNumber,
          bedNumber: r.bedNumber,
          hostelId: r._id
        });
      });
    });

    return sendSuccess(res, 'Outing requests fetched', allRequests);
  } catch (error) {
    next(error);
  }
};

export const updateOutingRequest = async (req, res, next) => {
  try {
    const { hostelId, outingId } = req.params;
    const { status, wardenRemarks } = req.body;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return sendError(res, 'Hostel record not found', 404);

    const outing = hostel.outingRequests.id(outingId);
    if (!outing) return sendError(res, 'Outing request not found', 404);

    if (status) outing.status = status;
    if (wardenRemarks) outing.wardenRemarks = wardenRemarks;

    await hostel.save();
    return sendSuccess(res, 'Outing request updated', outing);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * TRANSPORT MANAGEMENT
 * ==========================================
 */
export const getTransportBuses = async (req, res, next) => {
  try {
    const buses = await Transport.find().sort({ busNumber: 1 }).lean();
    return sendSuccess(res, 'Transport buses fetched', buses);
  } catch (error) {
    next(error);
  }
};

export const createTransportBus = async (req, res, next) => {
  try {
    const { busNumber, routeName, driverName, driverContact, transportFee, stops } = req.body;
    if (!busNumber || !routeName || !driverName || !driverContact) {
      return sendError(res, 'Bus number, route name, driver name, and driver contact are required', 400);
    }

    const existing = await Transport.findOne({ busNumber: busNumber.trim().toUpperCase() });
    if (existing) return sendError(res, 'Bus with this number already exists', 400);

    const bus = new Transport({
      busNumber: busNumber.trim().toUpperCase(),
      routeName: routeName.trim(),
      driverName: driverName.trim(),
      driverContact: driverContact.trim(),
      transportFee: transportFee || 18000,
      stops: Array.isArray(stops) ? stops : []
    });

    await bus.save();
    return sendSuccess(res, 'Transport bus created successfully', bus, 201);
  } catch (error) {
    next(error);
  }
};

export const updateTransportBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bus = await Transport.findByIdAndUpdate(id, req.body, { new: true });
    if (!bus) return sendError(res, 'Bus not found', 404);
    return sendSuccess(res, 'Bus details updated', bus);
  } catch (error) {
    next(error);
  }
};

export const assignTransportStudent = async (req, res, next) => {
  try {
    const { id } = req.params; // busId
    const { studentId, stopName, action } = req.body; // 'ASSIGN' or 'REMOVE'

    const bus = await Transport.findById(id);
    if (!bus) return sendError(res, 'Bus not found', 404);

    if (action === 'REMOVE') {
      bus.assignedStudents = bus.assignedStudents.filter(
        (s) => s.studentId && s.studentId.toString() !== studentId
      );
      await bus.save();
      await Student.findByIdAndUpdate(studentId, {
        'transport.opted': false,
        'transport.routeNumber': '',
        'transport.pickupPoint': ''
      });
      return sendSuccess(res, 'Student removed from transport route', bus);
    }

    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const feeSummary = await calculateStudentFees(studentId);

    bus.assignedStudents.push({
      studentId: student._id,
      studentName: student.fullName,
      rollNumber: student.universityRollNumber,
      stopName: stopName || 'Campus Main Gate',
      feeStatus: feeSummary.pendingAmount === 0 ? 'PAID' : 'PENDING'
    });

    await bus.save();

    student.transport = {
      opted: true,
      routeNumber: bus.busNumber,
      pickupPoint: stopName || 'Campus Main Gate'
    };
    await student.save();

    return sendSuccess(res, 'Student assigned to bus route', bus);
  } catch (error) {
    next(error);
  }
};

export const deleteTransportBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bus = await Transport.findByIdAndDelete(id);
    if (!bus) return sendError(res, 'Bus not found', 404);
    return sendSuccess(res, 'Bus removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * STUDENT DOCUMENTS VERIFICATION
 * ==========================================
 */
export const getAdminStudentDocuments = async (req, res, next) => {
  try {
    const { studentId, status } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const docs = await StudentDocument.find(filter)
      .populate('studentId', 'fullName universityRollNumber course semester')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Student documents fetched', docs);
  } catch (error) {
    next(error);
  }
};

export const verifyStudentDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'VERIFIED' or 'REJECTED'

    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
      return sendError(res, 'Status must be VERIFIED, REJECTED, or PENDING', 400);
    }

    const doc = await StudentDocument.findById(id);
    if (!doc) return sendError(res, 'Document not found', 404);

    doc.status = status;
    doc.verifiedBy = req.user.name || 'Academic Registrar';
    await doc.save();

    return sendSuccess(res, `Document status updated to ${status}`, doc);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * WARDEN MANAGEMENT (ADMIN)
 * ==========================================
 */
export const getAdminWardens = async (req, res, next) => {
  try {
    const wardens = await Warden.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 'Wardens fetched successfully', wardens);
  } catch (error) {
    next(error);
  }
};

export const updateAdminWardenStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const warden = await Warden.findByIdAndUpdate(id, { status }, { new: true });
    if (!warden) return sendError(res, 'Warden not found', 404);
    return sendSuccess(res, `Warden status updated to ${status}`, warden);
  } catch (error) {
    next(error);
  }
};

export const assignAdminWardenHostel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hostelId, hostelAssigned } = req.body;
    const warden = await Warden.findById(id);
    if (!warden) return sendError(res, 'Warden not found', 404);

    if (hostelId) warden.hostelId = hostelId;
    if (hostelAssigned) warden.hostelAssigned = hostelAssigned.trim();

    await warden.save();

    if (hostelId) {
      await Hostel.findByIdAndUpdate(hostelId, {
        wardenId: warden._id,
        wardenName: warden.fullName,
        wardenContact: warden.mobile
      });
    }

    return sendSuccess(res, 'Hostel assigned to warden successfully', warden);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * PAYMENT QR & UPI SETTINGS (ADMIN)
 * ==========================================
 */
export const getAdminPaymentSettings = async (req, res, next) => {
  try {
    let settings = await PaymentSetting.findOne({ key: 'DEFAULT' }).lean();
    if (!settings) {
      const upiUri = 'upi://pay?pa=jbitdehradun@upi&pn=JB%20Institute%20of%20Technology&cu=INR';
      const defaultQrDataUrl = await QRCode.toDataURL(upiUri, { width: 360, margin: 2 });
      settings = await PaymentSetting.create({
        key: 'DEFAULT',
        qrCode: defaultQrDataUrl,
        upiId: 'jbitdehradun@upi',
        paymentName: 'JB Institute of Technology',
        paymentInstructions: '1. Scan this QR code using Google Pay, PhonePe, Paytm or BHIM.\n2. Verify beneficiary: JB Institute of Technology.\n3. Complete the payment and note down your 12-digit UTR/Txn Number.\n4. Upload the screenshot of your payment receipt for administrative verification.',
        updatedBy: 'System Auto-Config'
      });
    }
    return sendSuccess(res, 'Payment settings retrieved successfully', settings);
  } catch (error) {
    next(error);
  }
};

export const updateAdminPaymentSettings = async (req, res, next) => {
  try {
    const { qrCode, upiId, paymentName, paymentInstructions } = req.body;

    // Validate QR code format & size if supplied
    if (qrCode) {
      if (typeof qrCode !== 'string' || !qrCode.startsWith('data:image/')) {
        return sendError(res, 'Invalid QR code image format. Must be PNG or JPG/JPEG image.', 400);
      }
      if (qrCode.length > 7000000) {
        return sendError(res, 'QR Code image size exceeds 5MB limit. Please upload a smaller image file.', 400);
      }
    }

    let settings = await PaymentSetting.findOne({ key: 'DEFAULT' });
    if (!settings) {
      settings = new PaymentSetting({ key: 'DEFAULT' });
    }

    if (qrCode) settings.qrCode = qrCode;
    if (upiId) settings.upiId = upiId.trim();
    if (paymentName) settings.paymentName = paymentName.trim();
    if (paymentInstructions !== undefined) settings.paymentInstructions = paymentInstructions.trim();
    settings.updatedBy = req.user.name || 'Admin';

    await settings.save();
    return sendSuccess(res, 'Payment QR and UPI settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * PAYMENT VERIFICATION & APPROVAL (ADMIN)
 * ==========================================
 */
export const getPendingPaymentsAdmin = async (req, res, next) => {
  try {
    const pendingPayments = await Payment.find({ status: 'PENDING' })
      .populate('studentId', 'fullName universityRollNumber collegeRegistrationNumber course semester email mobile')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Pending payments retrieved successfully', pendingPayments);
  } catch (error) {
    next(error);
  }
};

export const approvePaymentAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) return sendError(res, 'Payment record not found', 404);

    if (payment.status === 'SUCCESS') {
      return sendError(res, 'Payment is already approved and processed', 400);
    }

    const student = await Student.findById(payment.studentId);
    if (!student) return sendError(res, 'Associated student account not found', 404);

    // 1. Mark Payment SUCCESS
    payment.status = 'SUCCESS';
    payment.verifiedBy = req.user.name || 'System Admin';
    payment.verificationDate = new Date();
    await payment.save();

    let allocationResult = null;

    // 2. Handle TRANSPORT Allocation
    if (payment.allocationType === 'TRANSPORT') {
      const application = (payment.applicationId ? await TransportApplication.findById(payment.applicationId) : null) ||
        await TransportApplication.findOne({ studentId: student._id }).sort({ createdAt: -1 });

      if (application) {
        const bus = await Transport.findById(application.busId || payment.busId);
        if (bus) {
          const activeAllocations = await TransportAllocation.find({ busId: bus._id, status: 'ACTIVE' }).select('seatNumber').lean();
          const takenSeats = new Set(activeAllocations.map((a) => Number(a.seatNumber)));
          (bus.assignedStudents || []).forEach((st) => {
            if (st.seatNumber) takenSeats.add(Number(st.seatNumber));
          });

          const totalSeats = bus.totalSeats || 40;
          let candidateSeat = null;

          // Prefer user's selected seat if available
          const desiredSeat = payment.selectedSeatNumber || application.selectedSeatNumber;
          if (desiredSeat && !takenSeats.has(Number(desiredSeat)) && Number(desiredSeat) <= totalSeats) {
            candidateSeat = Number(desiredSeat);
          } else {
            for (let s = 1; s <= totalSeats; s++) {
              if (!takenSeats.has(s)) {
                candidateSeat = s;
                break;
              }
            }
          }

          if (candidateSeat !== null && bus.availableSeats > 0) {
            // Atomically lock seat
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
              const allocation = await TransportAllocation.create({
                studentId: student._id,
                studentName: student.fullName,
                rollNumber: student.universityRollNumber,
                busId: bus._id,
                applicationId: application._id,
                busNumber: bus.busNumber,
                routeName: bus.routeName,
                stopName: application.stopName,
                seatNumber: candidateSeat,
                allocationDate: new Date(),
                academicYear: application.academicYear || '2024-2025',
                paymentReference: payment.transactionId,
                receiptNumber: payment.receiptNumber,
                status: 'ACTIVE'
              });

              application.status = 'ALLOCATED';
              application.allocatedSeatNumber = candidateSeat;
              application.paymentStatus = 'SUCCESS';
              application.paymentDate = new Date();
              await application.save();

              await Student.findByIdAndUpdate(student._id, {
                transport: {
                  busNumber: bus.busNumber,
                  routeName: bus.routeName,
                  stopName: application.stopName,
                  status: 'Subscribed'
                }
              });

              allocationResult = { type: 'TRANSPORT', seatNumber: candidateSeat, busNumber: bus.busNumber };

              await Notification.create({
                recipientId: student._id,
                recipientRole: 'STUDENT',
                title: '🚌 Bus Seat Confirmed & Approved!',
                message: `Payment verified! Seat #${candidateSeat} on Bus ${bus.busNumber} (${application.stopName} to JBIT Campus) has been confirmed. Download your transport card now!`,
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
            }
          } else {
            application.status = 'WAITLISTED';
            application.remarks = 'Payment verified. All seats currently occupied on this bus, placed on priority waitlist.';
            await application.save();
          }
        }
      }
    }

    // 3. Handle HOSTEL Allocation
    if (payment.allocationType === 'HOSTEL') {
      const application = (payment.applicationId ? await HostelApplication.findById(payment.applicationId) : null) ||
        await HostelApplication.findOne({ studentId: student._id }).sort({ createdAt: -1 });

      if (application) {
        let allocatedBed = await HostelBed.findOneAndUpdate(
          { hostelId: application.hostelId, status: 'AVAILABLE' },
          { $set: { status: 'OCCUPIED', occupantStudentId: student._id } },
          { new: true }
        );

        if (allocatedBed) {
          const allocation = await HostelAllocation.create({
            studentId: student._id,
            studentName: student.fullName,
            rollNumber: student.universityRollNumber,
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
            paymentReference: payment.transactionId,
            receiptNumber: payment.receiptNumber,
            status: 'ACTIVE'
          });

          allocatedBed.allocationId = allocation._id;
          await allocatedBed.save();

          application.status = 'ALLOCATED';
          application.allocatedBedId = allocatedBed._id;
          application.paymentStatus = 'SUCCESS';
          application.paymentDate = new Date();
          await application.save();

          await Student.findByIdAndUpdate(student._id, {
            hostel: {
              hostelName: allocatedBed.hostelName,
              roomNumber: allocatedBed.roomNumber,
              bedNumber: allocatedBed.bedNumber,
              status: 'Allocated'
            }
          });

          const occupiedCount = await HostelBed.countDocuments({ hostelId: allocatedBed.hostelId, status: 'OCCUPIED' });
          const availableCount = await HostelBed.countDocuments({ hostelId: allocatedBed.hostelId, status: 'AVAILABLE' });
          await Hostel.findByIdAndUpdate(allocatedBed.hostelId, {
            occupiedBeds: occupiedCount,
            availableBeds: availableCount
          });

          allocationResult = { type: 'HOSTEL', roomNumber: allocatedBed.roomNumber, bedNumber: allocatedBed.bedNumber, hostelName: allocatedBed.hostelName };

          await Notification.create({
            recipientId: student._id,
            recipientRole: 'STUDENT',
            title: '🎉 Hostel Bed Verified & Allocated!',
            message: `Payment verified! You have been allocated ${allocatedBed.hostelName}, Room ${allocatedBed.roomNumber}, Bed ${allocatedBed.bedNumber}. Download your Allocation Card now!`,
            type: 'HOSTEL_ALLOCATION',
            link: '/hostel'
          });

          if (student.email) {
            sendHostelAllocationEmail({
              email: student.email,
              studentName: student.fullName,
              allocation
            }).catch((err) => console.error('Non-fatal hostel email error:', err.message));
          }
        } else {
          application.status = 'WAITLISTED';
          application.remarks = 'Payment verified. All beds occupied, placed on waitlist.';
          await application.save();
        }
      }
    }

    // 4. Handle General FEE Ledger Recalculation
    if (payment.allocationType === 'FEE') {
      await calculateStudentFees(student._id);
    }

    return sendSuccess(res, 'Payment successfully approved and allocation completed!', {
      payment,
      allocationResult
    });
  } catch (error) {
    next(error);
  }
};

export const rejectPaymentAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Payment verification failed: Invalid transaction reference or screenshot mismatch.' } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) return sendError(res, 'Payment record not found', 404);

    payment.status = 'REJECTED';
    payment.rejectionReason = reason.trim();
    payment.verifiedBy = req.user.name || 'Admin';
    payment.verificationDate = new Date();
    await payment.save();

    if (payment.allocationType === 'TRANSPORT' && payment.applicationId) {
      await TransportApplication.findByIdAndUpdate(payment.applicationId, {
        status: 'PAYMENT_REJECTED',
        paymentStatus: 'REJECTED',
        rejectionReason: reason.trim()
      });
    }

    if (payment.allocationType === 'HOSTEL' && payment.applicationId) {
      await HostelApplication.findByIdAndUpdate(payment.applicationId, {
        status: 'PAYMENT_REJECTED',
        paymentStatus: 'REJECTED',
        rejectionReason: reason.trim()
      });
    }

    await Notification.create({
      recipientId: payment.studentId,
      recipientRole: 'STUDENT',
      title: '❌ Payment Rejected by Administration',
      message: `Your payment of ₹${payment.amount} (${payment.purpose}) was rejected. Reason: ${reason.trim()}`,
      type: 'PAYMENT',
      link: payment.allocationType === 'TRANSPORT' ? '/transport' : payment.allocationType === 'HOSTEL' ? '/hostel' : '/fees'
    });

    return sendSuccess(res, 'Payment has been rejected.', payment);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * CONFIGURABLE DEHRADUN BUS STOPS (ADMIN)
 * ==========================================
 */
export const getAdminBusStops = async (req, res, next) => {
  try {
    const stops = await BusStop.find().sort({ isCampus: -1, stopName: 1 }).lean();
    return sendSuccess(res, 'Dehradun bus stops retrieved', stops);
  } catch (error) {
    next(error);
  }
};

export const createAdminBusStop = async (req, res, next) => {
  try {
    const { stopName, landmark, pickupTime, dropTime, estimatedFee, isCampus, isActive } = req.body;
    if (!stopName || !stopName.trim()) {
      return sendError(res, 'Bus stop name is required', 400);
    }

    const existing = await BusStop.findOne({ stopName: stopName.trim() });
    if (existing) {
      return sendError(res, 'A bus stop with this name already exists', 400);
    }

    const stop = await BusStop.create({
      stopName: stopName.trim(),
      landmark: landmark ? landmark.trim() : '',
      pickupTime: pickupTime ? pickupTime.trim() : '07:30 AM',
      dropTime: dropTime ? dropTime.trim() : '05:30 PM',
      estimatedFee: Number(estimatedFee) || 18000,
      isCampus: Boolean(isCampus),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    return sendSuccess(res, 'New bus stop created successfully', stop, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAdminBusStop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stop = await BusStop.findByIdAndUpdate(id, req.body, { new: true });
    if (!stop) return sendError(res, 'Bus stop not found', 404);
    return sendSuccess(res, 'Bus stop details updated', stop);
  } catch (error) {
    next(error);
  }
};

export const deleteAdminBusStop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stop = await BusStop.findByIdAndDelete(id);
    if (!stop) return sendError(res, 'Bus stop not found', 404);
    return sendSuccess(res, 'Bus stop removed successfully');
  } catch (error) {
    next(error);
  }
};


