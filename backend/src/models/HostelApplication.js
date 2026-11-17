import mongoose from 'mongoose';

const hostelApplicationSchema = new mongoose.Schema(
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
    gender: {
      type: String,
      default: ''
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
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true
    },
    hostelName: {
      type: String,
      required: true,
      trim: true
    },
    preferredBlock: {
      type: String,
      default: ''
    },
    preferredRoomType: {
      type: String,
      default: 'Standard Double'
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
        'PENDING_ALLOCATION',
        'ALLOCATED',
        'WAITLISTED',
        'REJECTED',
        'PAYMENT_REJECTED',
        'CANCELLED',
        'COMPLETED'
      ],
      default: 'PENDING_PAYMENT',
      index: true
    },
    allocatedBedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostelBed',
      default: null
    },
    allocationDetails: {
      hostelName: { type: String, default: '' },
      block: { type: String, default: '' },
      floor: { type: String, default: '' },
      roomNumber: { type: String, default: '' },
      bedNumber: { type: String, default: '' },
      allocatedAt: { type: Date, default: null }
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

export const HostelApplication = mongoose.model('HostelApplication', hostelApplicationSchema);
