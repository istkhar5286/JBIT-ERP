import mongoose from 'mongoose';

const hostelAllocationSchema = new mongoose.Schema(
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
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostelBed',
      required: true
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostelApplication',
      default: null
    },
    block: {
      type: String,
      required: true,
      trim: true
    },
    floor: {
      type: String,
      required: true,
      trim: true
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    bedNumber: {
      type: String,
      required: true,
      trim: true
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
      enum: ['ACTIVE', 'VACATED', 'TRANSFERRED'],
      default: 'ACTIVE',
      index: true
    },
    vacatedDate: {
      type: Date,
      default: null
    },
    vacateReason: {
      type: String,
      default: ''
    },
    vacatedBy: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const HostelAllocation = mongoose.model('HostelAllocation', hostelAllocationSchema);
