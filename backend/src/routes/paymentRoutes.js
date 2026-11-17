import express from 'express';
import {
  getPublicPaymentSettings,
  submitManualQrPayment,
  initiatePayment,
  verifyPayment,
  getPaymentDetails,
  getPaymentReceiptPdf
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public Payment QR Settings (for student Scan & Pay modal)
router.get('/settings', getPublicPaymentSettings);

// Authenticated routes
router.use(authenticate);

router.post('/submit-manual-qr', submitManualQrPayment);
router.post('/create', initiatePayment);
router.post('/verify', verifyPayment);
router.get('/:id', getPaymentDetails);
router.get('/:id/receipt', getPaymentReceiptPdf);

export default router;
