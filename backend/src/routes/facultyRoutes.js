import express from 'express';
import {
  getFacultyDashboard,
  getFacultyProfile,
  updateFacultyProfile,
  getFacultyClasses,
  getAssignedStudents,
  getFacultyTimetable,
  markClassAttendance,
  getAttendanceLogs,
  saveStudentMarks,
  getFacultyMaterials,
  uploadStudyMaterial,
  deleteStudyMaterial
} from '../controllers/facultyController.js';
import { authenticate } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/role.js';

const router = express.Router();

// Protect all faculty endpoints
router.use(authenticate, requireFaculty);

// Dashboard & Profile
router.get('/dashboard', getFacultyDashboard);
router.get('/profile', getFacultyProfile);
router.put('/profile', updateFacultyProfile);

// Academic & Class Rosters
router.get('/classes', getFacultyClasses);
router.get('/students', getAssignedStudents);
router.get('/timetable', getFacultyTimetable);

// Attendance Management
router.post('/attendance', markClassAttendance);
router.post('/attendance/mark', markClassAttendance);
router.get('/attendance/logs', getAttendanceLogs);

// Marks Entry & Evaluation
router.post('/marks', saveStudentMarks);
router.post('/marks/save', saveStudentMarks);

// Study Materials & Assignments
router.get('/materials', getFacultyMaterials);
router.post('/materials', uploadStudyMaterial);
router.delete('/materials/:id', deleteStudyMaterial);
router.get('/study-materials', getFacultyMaterials);
router.post('/study-materials', uploadStudyMaterial);
router.delete('/study-materials/:id', deleteStudyMaterial);

export default router;
