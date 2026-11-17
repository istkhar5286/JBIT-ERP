import mongoose from 'mongoose';

const transportApplicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    studentRoll: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    studentMobile: {
      type: String,
      required: true,
      trim: true
    },
    course: {
      type: String,
      default: ''
    },
    semester: {
      type: String,
      default: ''
    },
    academicYear: {
      type: String,
      default: '2024-2025'
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transport',
      required: true
    },
    busNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    routeName: {
      type: String,
      required: true,
      trim: true
    },
    stopName: {
      type: String,
      required: true,
      trim: true
    },
    destination: {
      type: String,
      default: 'JB Institute of Technology, 23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197',
      trim: true
    },
    direction: {
      type: String,
      enum: ['TO_CAMPUS', 'FROM_CAMPUS', 'ROUND_TRIP'],
      default: 'ROUND_TRIP'
    },
    selectedSeatNumber: {
      type: Number,
      default: null
    },
    feeAmount: {
      type: Number,
      required: true,
      min: 1
    },
    paymentStatus: {
      type: String,
      enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REJECTED', 'REFUNDED'],
      default: 'PENDING'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    transactionId: {
      type: String,
      default: ''
    },
    utrNumber: {
      type: String,
      default: ''
    },
    paymentScreenshot: {
      type: String,
      default: ''
    },
    receiptNumber: {
      type: String,
      default: ''
    },
    paymentDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'PENDING_VERIFICATION',
        'PAYMENT_SUCCESSFUL',
        'ALLOCATED',
        'WAITLISTED',
        'REJECTED',
        'PAYMENT_REJECTED',
        'CANCELLED'
      ],
      default: 'PENDING_PAYMENT',
      index: true
    },
    allocatedSeatNumber: {
      type: Number,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const TransportApplication = mongoose.model('TransportApplication', transportApplicationSchema);
