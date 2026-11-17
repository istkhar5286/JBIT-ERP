import mongoose from 'mongoose';

const hostelComplaintSchema = new mongoose.Schema(
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
      default: null
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
    category: {
      type: String,
      enum: ['ROOM', 'BED', 'ELECTRICITY', 'WATER', 'CLEANLINESS', 'MAINTENANCE', 'MESS', 'OTHER'],
      default: 'MAINTENANCE'
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['OPEN', 'PROCESSING', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true
    },
    assignedWarden: {
      type: String,
      default: 'Hostel Warden'
    },
    wardenRemarks: {
      type: String,
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const HostelComplaint = mongoose.model('HostelComplaint', hostelComplaintSchema);
