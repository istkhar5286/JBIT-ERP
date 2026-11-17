import express from 'express';
import {
  getWardenDashboardStats,
  getHostels,
  createOrUpdateHostel,
  getBeds,
  createBed,
  updateBedStatus,
  deleteBed,
  getApplications,
  processApplication,
  getAllocations,
  vacateStudentAllocation,
  getHostelPayments,
  getComplaints,
  updateComplaint,
  getOutings,
  updateOuting,
  getNotices,
  createNotice,
  deleteNotice,
  getOccupancyReport
} from '../controllers/wardenController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWardenOrAdmin } from '../middleware/role.js';

const router = express.Router();

// All warden routes require authentication and WARDEN or ADMIN role
router.use(authenticate, requireWardenOrAdmin);

// 1. Dashboard
router.get('/dashboard', getWardenDashboardStats);

// 2. Hostel Buildings & Structure
router.get('/hostels', getHostels);
router.post('/hostels', createOrUpdateHostel);

// 3. Beds Inventory & Status
router.get('/beds', getBeds);
router.post('/beds', createBed);
router.put('/beds/:id/status', updateBedStatus);
router.delete('/beds/:id', deleteBed);

// 4. Applications & Processing
router.get('/applications', getApplications);
router.post('/applications/:id/process', processApplication);

// 5. Active & Historical Allocations
router.get('/allocations', getAllocations);
router.post('/allocations/:id/vacate', vacateStudentAllocation);

// 6. Payments
router.get('/payments', getHostelPayments);

// 7. Complaints
router.get('/complaints', getComplaints);
router.put('/complaints/:id', updateComplaint);

// 8. Outing / Gate Passes
router.get('/outings', getOutings);
router.put('/outings/:id', updateOuting);

// 9. Hostel Notices
router.get('/notices', getNotices);
router.post('/notices', createNotice);
router.delete('/notices/:id', deleteNotice);

// 10. Occupancy Reports
router.get('/reports/occupancy', getOccupancyReport);

export default router;
