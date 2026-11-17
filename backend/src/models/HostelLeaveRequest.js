import mongoose from 'mongoose';

const hostelLeaveRequestSchema = new mongoose.Schema(
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
    hostelName: {
      type: String,
      default: ''
    },
    roomNumber: {
      type: String,
      default: ''
    },
    bedNumber: {
      type: String,
      default: ''
    },
    mobile: {
      type: String,
      default: ''
    },
    parentContact: {
      type: String,
      default: ''
    },
    departureDate: {
      type: Date,
      required: [true, 'Departure date and time are required']
    },
    expectedReturnDate: {
      type: Date,
      required: [true, 'Expected return date and time are required']
    },
    actualReturnDate: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      required: [true, 'Reason for outing/leave is required'],
      trim: true
    },
    destination: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING',
      index: true
    },
    wardenRemarks: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: String,
      default: ''
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const HostelLeaveRequest = mongoose.model('HostelLeaveRequest', hostelLeaveRequestSchema);
