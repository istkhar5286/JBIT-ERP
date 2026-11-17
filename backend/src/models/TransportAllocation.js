import mongoose from 'mongoose';

const transportAllocationSchema = new mongoose.Schema(
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
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transport',
      required: true
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportApplication',
      default: null
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
    seatNumber: {
      type: Number,
      required: true
    },
    allocationDate: {
      type: Date,
      default: Date.now
    },
    academicYear: {
      type: String,
      default: '2024-2025'
    },
    paymentReference: {
      type: String,
      default: ''
    },
    receiptNumber: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED'],
      default: 'ACTIVE',
      index: true
    },
    cancelledDate: {
      type: Date,
      default: null
    },
    cancelledReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure same seat on same bus is never allocated twice while active
transportAllocationSchema.index({ busId: 1, seatNumber: 1, status: 1 });

export const TransportAllocation = mongoose.model('TransportAllocation', transportAllocationSchema);
