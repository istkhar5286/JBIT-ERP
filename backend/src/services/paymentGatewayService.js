import { generateReceiptNumber, generateTransactionId } from '../utils/receiptNumberGenerator.js';
import { calculateStudentFees } from './feeService.js';
import { Payment } from '../models/Payment.js';

/**
 * Initiates an order / payment attempt
 */
export const createPaymentOrder = async ({ studentId, amount, paymentMethod = 'UPI' }) => {
  const currentFees = await calculateStudentFees(studentId);
  const transactionId = generateTransactionId('TXN');
  const receiptNumber = generateReceiptNumber();

  // Create PENDING record
  const payment = await Payment.create({
    studentId,
    amount: Number(amount),
    transactionId,
    receiptNumber,
    paymentMethod,
    status: 'PENDING',
    previousDue: currentFees.remainingDue,
    remainingDue: currentFees.remainingDue, // initial before success
    extraPayment: 0,
    gatewayDetails: {
      provider: 'MOCK_SANDBOX_GATEWAY',
      orderId: `ORDER_${Date.now()}`
    }
  });

  return {
    paymentId: payment._id,
    orderId: payment.gatewayDetails.orderId,
    transactionId: payment.transactionId,
    receiptNumber: payment.receiptNumber,
    amount: payment.amount,
    currency: 'INR',
    studentId,
    status: 'PENDING',
    previousDue: currentFees.remainingDue
  };
};

/**
 * Completes / verifies payment status in Sandbox or Real Gateway
 */
export const verifyAndProcessPayment = async ({
  paymentId,
  status = 'SUCCESS', // 'SUCCESS' | 'FAILED' | 'CANCELLED'
  gatewayResponse = {},
  paymentMethod = 'UPI'
}) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment record not found');
  }

  if (payment.status === 'SUCCESS') {
    return { payment, alreadyProcessed: true };
  }

  const numericStatus = status.toUpperCase();

  if (numericStatus !== 'SUCCESS') {
    payment.status = numericStatus;
    payment.gatewayDetails = {
      ...payment.gatewayDetails,
      ...gatewayResponse,
      failureReason: gatewayResponse.reason || 'Payment was cancelled or rejected by user/bank'
    };
    await payment.save();
    return { payment, alreadyProcessed: false };
  }

  // Recalculate financial snapshot
  // Total payable before this payment
  const currentFees = await calculateStudentFees(payment.studentId);
  const previousDue = currentFees.remainingDue;
  const payAmount = payment.amount;

  // New remaining due & extra payment
  const newTotalPaid = currentFees.totalPaid + payAmount;
  const newRemainingDue = Math.max(currentFees.totalPayable - newTotalPaid, 0);
  const newExtraPayment = Math.max(newTotalPaid - currentFees.totalPayable, 0);

  payment.status = 'SUCCESS';
  payment.paymentMethod = paymentMethod || payment.paymentMethod;
  payment.paymentDate = new Date();
  payment.previousDue = previousDue;
  payment.remainingDue = newRemainingDue;
  payment.extraPayment = newExtraPayment;
  payment.gatewayDetails = {
    ...payment.gatewayDetails,
    ...gatewayResponse,
    verifiedAt: new Date(),
    authCode: 'SANDBOX_AUTH_OK'
  };

  await payment.save();

  // Authoritatively recalculate student fees and update status ('CLEAR' if balance reaches 0)
  const authoritativeFees = await calculateStudentFees(payment.studentId);

  return {
    payment,
    alreadyProcessed: false,
    updatedFees: {
      previousDue,
      remainingDue: authoritativeFees.pendingAmount,
      pendingAmount: authoritativeFees.pendingAmount,
      extraPayment: authoritativeFees.extraPayment,
      totalPaid: authoritativeFees.totalPaid,
      status: authoritativeFees.status
    }
  };
};
