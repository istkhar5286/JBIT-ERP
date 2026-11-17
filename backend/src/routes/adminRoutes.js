import express from 'express';
import {
  getAdminDashboard,
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentFee,
  updateStudentFee,
  configureInstallments,
  applyWaiver,
  removeWaiver,
  getFeeCategorizedStudents,
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  sendFeeReminder,
  getAllPayments,
  recordPaymentRefund,
  getStudentAttendanceAdmin,
  addAttendance,
  updateAttendance,
  deleteAttendance,
  getStudentFinesAdmin,
  addFine,
  updateFine,
  deleteFine,
  getFeeReports,
  getPaymentReports,
  getFineReports,
  exportReportCsv,
  getAdminStudentAdmitCard,
  getAdminStudentClearance,
  getAdminStudentNoDues,
  getAdminStudentIdCard,
  getAdminStudentMarksheet,
  getAdminStudentBonafide,
  getAdminStudentCharacter,
  getFacultyList,
  getFacultyById,
  createFaculty,
  updateFaculty,
  toggleFacultyStatus,
  deleteFaculty,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getAdminTimetable,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
  getAdminExams,
  createExam,
  updateExam,
  deleteExam,
  getAdminResults,
  createOrUpdateResult,
  getAdminNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  getAdminComplaints,
  respondToComplaint,
  getHostelRooms,
  createHostelRoom,
  assignHostelBed,
  deleteHostelRoom,
  getHostelOutingRequests,
  updateOutingRequest,
  getTransportBuses,
  createTransportBus,
  updateTransportBus,
  assignTransportStudent,
  deleteTransportBus,
  getAdminStudentDocuments,
  verifyStudentDocument,
  getAdminWardens,
  updateAdminWardenStatus,
  assignAdminWardenHostel,
  getAdminPaymentSettings,
  updateAdminPaymentSettings,
  getPendingPaymentsAdmin,
  approvePaymentAdmin,
  rejectPaymentAdmin,
  getAdminBusStops,
  createAdminBusStop,
  updateAdminBusStop,
  deleteAdminBusStop
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';

const router = express.Router();

// Protect all admin routes with authentication and requireAdmin
router.use(authenticate, requireAdmin);

// Warden Management (Admin)
router.get('/wardens', getAdminWardens);
router.put('/wardens/:id/status', updateAdminWardenStatus);
router.put('/wardens/:id/assign', assignAdminWardenHostel);


// Dashboard
router.get('/dashboard', getAdminDashboard);

// Student Management
router.get('/students', getStudents);
router.post('/students', createStudent);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Student Document & Certificate Downloads
router.get('/students/:studentId/documents/admit-card', getAdminStudentAdmitCard);
router.get('/students/:studentId/documents/clearance-certificate', getAdminStudentClearance);
router.get('/students/:studentId/documents/no-dues-certificate', getAdminStudentNoDues);
router.get('/students/:studentId/documents/id-card', getAdminStudentIdCard);
router.get('/students/:studentId/documents/marksheet', getAdminStudentMarksheet);
router.get('/students/:studentId/documents/bonafide', getAdminStudentBonafide);
router.get('/students/:studentId/documents/character', getAdminStudentCharacter);

// Faculty Management
router.get('/faculty', getFacultyList);
router.post('/faculty', createFaculty);
router.get('/faculty/:id', getFacultyById);
router.put('/faculty/:id', updateFaculty);
router.put('/faculty/:id/status', toggleFacultyStatus);
router.delete('/faculty/:id', deleteFaculty);

// Courses & Subjects Management
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// Timetable Management
router.get('/timetable', getAdminTimetable);
router.post('/timetable', createTimetableSlot);
router.put('/timetable/:id', updateTimetableSlot);
router.delete('/timetable/:id', deleteTimetableSlot);

// Exams Schedule Management
router.get('/exams', getAdminExams);
router.post('/exams', createExam);
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);

// Results & Marks
router.get('/results', getAdminResults);
router.post('/results', createOrUpdateResult);

// Notices Management
router.get('/notices', getAdminNotices);
router.post('/notices', createNotice);
router.put('/notices/:id', updateNotice);
router.delete('/notices/:id', deleteNotice);

// Complaints Desk Management
router.get('/complaints', getAdminComplaints);
router.put('/complaints/:id/respond', respondToComplaint);

// Hostel Management
router.get('/hostel/rooms', getHostelRooms);
router.post('/hostel/rooms', createHostelRoom);
router.post('/hostel/rooms/:id/assign', assignHostelBed);
router.delete('/hostel/rooms/:id', deleteHostelRoom);
router.get('/hostel/outings', getHostelOutingRequests);
router.put('/hostel/outings/:hostelId/:outingId', updateOutingRequest);

// Transport Management
router.get('/transport/buses', getTransportBuses);
router.post('/transport/buses', createTransportBus);
router.put('/transport/buses/:id', updateTransportBus);
router.post('/transport/buses/:id/assign', assignTransportStudent);
router.delete('/transport/buses/:id', deleteTransportBus);

// Configurable Dehradun Bus Stops Management
router.get('/transport/stops', getAdminBusStops);
router.post('/transport/stops', createAdminBusStop);
router.put('/transport/stops/:id', updateAdminBusStop);
router.delete('/transport/stops/:id', deleteAdminBusStop);

// Student Uploaded Documents Verification
router.get('/documents', getAdminStudentDocuments);
router.put('/documents/:id/verify', verifyStudentDocument);

// Fee Management
router.get('/fees-by-status', getFeeCategorizedStudents);
router.get('/fees/:studentId', getStudentFee);
router.put('/fees/:studentId', updateStudentFee);
router.post('/fees/:studentId/installments', configureInstallments);
router.post('/fees/:studentId/waivers', applyWaiver);
router.delete('/fees/:studentId/waivers/:waiverId', removeWaiver);
router.post('/fees/reminders/send', sendFeeReminder);

// Master Fee Structures Templates
router.get('/fee-structures', getFeeStructures);
router.post('/fee-structures', createFeeStructure);
router.put('/fee-structures/:id', updateFeeStructure);
router.delete('/fee-structures/:id', deleteFeeStructure);

// Payment QR & UPI Settings Management
router.get('/payment-settings', getAdminPaymentSettings);
router.post('/payment-settings', updateAdminPaymentSettings);

// Payments, Verification & Refund Management
router.get('/payments', getAllPayments);
router.get('/payments/pending', getPendingPaymentsAdmin);
router.post('/payments/:id/approve', approvePaymentAdmin);
router.post('/payments/:id/reject', rejectPaymentAdmin);
router.post('/payments/:paymentId/refund', recordPaymentRefund);

// Attendance Management
router.get('/attendance/:studentId', getStudentAttendanceAdmin);
router.post('/attendance', addAttendance);
router.put('/attendance/:id', updateAttendance);
router.delete('/attendance/:id', deleteAttendance);

// Fine Management
router.get('/fines/:studentId', getStudentFinesAdmin);
router.post('/fines', addFine);
router.put('/fines/:id', updateFine);
router.delete('/fines/:id', deleteFine);

// Reports & Data Export
router.get('/reports/fees', getFeeReports);
router.get('/reports/payments', getPaymentReports);
router.get('/reports/fines', getFineReports);
router.get('/reports/export-csv', exportReportCsv);

export default router;
