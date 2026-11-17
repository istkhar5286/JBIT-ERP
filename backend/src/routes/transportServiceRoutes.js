import express from 'express';
import {
  getDehradunStops,
  getBusSeatAvailability,
  getTransportOptions,
  getMyTransportStatus,
  applyTransport,
  submitTransportQrPayment,
  verifyPaymentAndAllocateTransport,
  getTransportReceiptPdf,
  getTransportAllocationCardPdf
} from '../controllers/transportServiceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// 1. Configurable Stops & Seat Availability
router.get('/stops', getDehradunStops);
router.get('/bus/:busId/seats', getBusSeatAvailability);

// 2. Options & status
router.get('/options', getTransportOptions);
router.get('/my-status', getMyTransportStatus);

// 3. Application & Payment Allocation
router.post('/apply', applyTransport);
router.post('/submit-qr-payment', submitTransportQrPayment);
router.post('/verify-payment-and-allocate', verifyPaymentAndAllocateTransport);

// 3. PDF Downloads
router.get('/receipt/:paymentId/pdf', getTransportReceiptPdf);
router.get('/allocation-card/:allocationId/pdf', getTransportAllocationCardPdf);

export default router;
