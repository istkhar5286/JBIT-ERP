import express from 'express';
import {
  getHostelOptions,
  getMyHostelStatus,
  applyHostel,
  submitHostelQrPayment,
  verifyPaymentAndAllocate,
  getHostelReceiptPdf,
  getHostelAllocationCardPdf,
  submitComplaint,
  submitOutingRequest,
  getHostelNotices
} from '../controllers/hostelController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Publicly authenticated (Student, Warden, Admin)
router.use(authenticate);

// 1. Browse options & check student status
router.get('/options', getHostelOptions);
router.get('/my-status', getMyHostelStatus);

// 2. Application & Allocation
router.post('/apply', applyHostel);
router.post('/submit-qr-payment', submitHostelQrPayment);
router.post('/verify-payment-and-allocate', verifyPaymentAndAllocate);

// 3. PDF Downloads
router.get('/receipt/:paymentId/pdf', getHostelReceiptPdf);
router.get('/allocation-card/:allocationId/pdf', getHostelAllocationCardPdf);

// 4. Complaints & Outings
router.post('/complaints', submitComplaint);
router.post('/outing', submitOutingRequest);

// 5. Notices
router.get('/notices', getHostelNotices);

export default router;
