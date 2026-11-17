import express from 'express';
import {
  getStudentDashboard,
  getStudentProfile,
  updateStudentProfile,
  getStudentFees,
  getStudentPayments,
  getStudentAttendance,
  getStudentFines,
  getStudentDocumentEligibility,
  downloadAdmitCard,
  downloadFeeClearanceCertificate,
  downloadNoDuesCertificate,
  getStudentTimetable,
  getStudentResults,
  downloadStudentMarksheet,
  downloadStudentIdCard,
  downloadBonafideCertificate,
  downloadCharacterCertificate,
  getStudentStudyMaterials,
  getStudentNotices,
  getStudentComplaints,
  createStudentComplaint,
  getStudentHostelTransport,
  requestHostelOuting,
  getStudentDocuments,
  uploadStudentDocument,
  deleteStudentDocument
} from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireStudent } from '../middleware/role.js';

const router = express.Router();

// All student routes require JWT and STUDENT role
router.use(authenticate, requireStudent);

router.get('/dashboard', getStudentDashboard);
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);
router.get('/fees', getStudentFees);
router.get('/payments', getStudentPayments);
router.get('/attendance', getStudentAttendance);
router.get('/fines', getStudentFines);

// Timetable & Academics
router.get('/timetable', getStudentTimetable);
router.get('/results', getStudentResults);
router.get('/study-materials', getStudentStudyMaterials);

// Notices & Support
router.get('/notices', getStudentNotices);
router.get('/complaints', getStudentComplaints);
router.post('/complaints', createStudentComplaint);

// Hostel & Transport
router.get('/hostel-transport', getStudentHostelTransport);
router.post('/hostel/outing', requestHostelOuting);

// Student Uploaded Documents Repository
router.get('/documents', getStudentDocuments);
router.post('/documents', uploadStudentDocument);
router.delete('/documents/:id', deleteStudentDocument);

// Document Eligibility & Certificates
router.get('/documents/eligibility', getStudentDocumentEligibility);
router.get('/documents/admit-card', downloadAdmitCard);
router.get('/documents/clearance-certificate', downloadFeeClearanceCertificate);
router.get('/documents/no-dues-certificate', downloadNoDuesCertificate);
router.get('/documents/id-card', downloadStudentIdCard);
router.get('/documents/marksheet', downloadStudentMarksheet);
router.get('/documents/bonafide', downloadBonafideCertificate);
router.get('/documents/character', downloadCharacterCertificate);

export default router;
