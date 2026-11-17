import mongoose from 'mongoose';

const refundRecordSchema = new mongoose.Schema({
  refundAmount: {
    type: Number,
    required: [true, 'Refund amount is required'],
    min: [1, 'Refund amount must be greater than 0']
  },
  refundDate: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    required: [true, 'Refund reason is required'],
    trim: true
  },
  referenceNumber: {
    type: String,
    required: true,
    trim: true
  },
  approvedBy: {
    type: String,
    default: 'JBIT Accounts Office'
  }
});

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be greater than 0']
    },
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'CARD', 'NETBANKING', 'CASH', 'DEMAND_DRAFT'],
      default: 'UPI'
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED'],
      default: 'PENDING'
    },
    purpose: {
      type: String,
      default: 'Academic Fee',
      trim: true
    },
    utrNumber: {
      type: String,
      trim: true,
      default: ''
    },
    paymentScreenshot: {
      type: String, // Base64 data URI string
      default: ''
    },
    allocationType: {
      type: String,
      enum: ['TRANSPORT', 'HOSTEL', 'FEE', 'OTHER'],
      default: 'FEE'
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    selectedSeatNumber: {
      type: Number,
      default: null
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transport',
      default: null
    },
    stopName: {
      type: String,
      default: ''
    },
    verifiedBy: {
      type: String,
      default: ''
    },
    verificationDate: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    previousDue: {
      type: Number,
      default: 0
    },
    remainingDue: {
      type: Number,
      default: 0
    },
    extraPayment: {
      type: Number,
      default: 0
    },
    gatewayDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Refund Management
    refunds: [refundRecordSchema],
    refundStatus: {
      type: String,
      enum: ['NONE', 'PARTIAL', 'FULL'],
      default: 'NONE'
    },
    totalRefunded: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);
