import QRCode from 'qrcode';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { PaymentSetting } from '../models/PaymentSetting.js';
import { createPaymentOrder, verifyAndProcessPayment } from '../services/paymentGatewayService.js';
import { generateReceiptPdf } from '../services/documentPdfService.js';
import { calculateStudentFees } from '../services/feeService.js';
import { sendPaymentConfirmationEmail } from '../services/emailService.js';
import { generateReceiptNumber } from '../utils/receiptNumberGenerator.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Get Public Payment Settings (QR Code, UPI ID, Beneficiary Name)
 * GET /api/payments/settings
 */
export const getPublicPaymentSettings = async (req, res, next) => {
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
    return sendSuccess(res, 'Payment QR and UPI settings retrieved', {
      qrCode: settings.qrCode,
      upiId: settings.upiId,
      paymentName: settings.paymentName,
      paymentInstructions: settings.paymentInstructions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student Manual QR Code Payment Submission
 * POST /api/payments/submit-manual-qr
 */
export const submitManualQrPayment = async (req, res, next) => {
  try {
    const student = req.user;
    const {
      amount,
      purpose = 'Academic Fee',
      utrNumber,
      paymentScreenshot,
      allocationType = 'FEE',
      applicationId = null
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return sendError(res, 'Valid payment amount is required', 400);
    }
    if (!utrNumber || utrNumber.trim().length < 6) {
      return sendError(res, 'Please provide a valid 12-digit UPI / UTR Transaction ID (min 6 digits)', 400);
    }
    if (!paymentScreenshot) {
      return sendError(res, 'Payment screenshot is required', 400);
    }
    if (typeof paymentScreenshot !== 'string' || !paymentScreenshot.startsWith('data:image/')) {
      return sendError(res, 'Invalid image format. Please upload PNG or JPG/JPEG screenshot.', 400);
    }
    if (paymentScreenshot.length > 7000000) {
      return sendError(res, 'Screenshot file size exceeds 5MB limit. Please upload a smaller image.', 400);
    }

    const cleanUtr = utrNumber.trim().toUpperCase();
    const uniqueTxn = `TXN_UPI_${cleanUtr}_${Date.now()}`;
    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create({
      studentId: student._id,
      amount: Number(amount),
      transactionId: uniqueTxn,
      receiptNumber,
      paymentMethod: 'UPI',
      status: 'PENDING',
      purpose: purpose.trim(),
      utrNumber: cleanUtr,
      paymentScreenshot,
      allocationType,
      applicationId,
      paymentDate: new Date(),
      previousDue: Number(amount),
      remainingDue: Number(amount)
    });

    return sendSuccess(res, 'Payment details submitted successfully! Awaiting administrative verification.', {
      payment,
      status: 'PENDING'
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate a payment order
 * POST /api/payments/create
 */
export const initiatePayment = async (req, res, next) => {
  try {
    const studentId = req.role === 'ADMIN' ? req.body.studentId : req.user._id;
    const { amount, paymentMethod = 'UPI' } = req.body;

    if (!amount || Number(amount) <= 0) {
      return sendError(res, 'Please enter a valid payment amount greater than 0', 400);
    }

    const order = await createPaymentOrder({
      studentId,
      amount: Number(amount),
      paymentMethod
    });

    return sendSuccess(res, 'Payment session initialized', order, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Complete & Verify Payment (Mock Sandbox or Gateway Webhook)
 * POST /api/payments/verify
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, status = 'SUCCESS', paymentMethod, gatewayResponse } = req.body;

    if (!paymentId) {
      return sendError(res, 'Payment ID is required for verification', 400);
    }

    const result = await verifyAndProcessPayment({
      paymentId,
      status,
      paymentMethod,
      gatewayResponse
    });

    // If payment was newly confirmed as SUCCESS, trigger async confirmation email
    if (result.payment.status === 'SUCCESS' && !result.alreadyProcessed) {
      try {
        const student = await Student.findById(result.payment.studentId);
        if (student && student.email) {
          sendPaymentConfirmationEmail({
            email: student.email,
            studentName: student.fullName,
            payment: result.payment,
            remainingDue: result.updatedFees?.remainingDue ?? 0
          }).catch((err) => {
            console.error('[PaymentController] Non-fatal payment confirmation email error:', err.message);
          });
        }
      } catch (err) {
        console.error('[PaymentController] Non-fatal student lookup error:', err.message);
      }
    }

    return sendSuccess(res, `Payment status updated to ${status}`, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Payment Details
 * GET /api/payments/:id
 */
export const getPaymentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate(
      'studentId',
      'fullName universityRollNumber collegeRegistrationNumber course semester fatherName email mobile'
    );

    if (!payment) {
      return sendError(res, 'Payment record not found', 404);
    }

    // Role check: student can only view their own payment
    if (req.role === 'STUDENT' && payment.studentId._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Unauthorized to view this transaction record', 403);
    }

    return sendSuccess(res, 'Payment details retrieved', payment);
  } catch (error) {
    next(error);
  }
};

/**
 * Stream / Download PDF Receipt
 * GET /api/payments/:id/receipt
 */
export const getPaymentReceiptPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return sendError(res, 'Receipt not found for this transaction ID', 404);
    }

    // Role check: student can only download their own receipt
    if (req.role === 'STUDENT' && payment.studentId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Unauthorized to download this receipt', 403);
    }

    if (payment.status !== 'SUCCESS') {
      return sendError(res, 'Receipt can only be generated for successful payments', 400);
    }

    const student = await Student.findById(payment.studentId);
    if (!student) {
      return sendError(res, 'Associated student account not found', 404);
    }

    const feeSummary = await calculateStudentFees(student._id);
    generateReceiptPdf(payment, student, feeSummary, res);
  } catch (error) {
    next(error);
  }
};
