import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    studentName: {
      type: String,
      default: ''
    },
    rollNumber: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['ACADEMIC', 'FEES', 'HOSTEL', 'TRANSPORT', 'INFRASTRUCTURE', 'LIBRARY', 'OTHER'],
      default: 'ACADEMIC'
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
    attachment: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['OPEN', 'PROCESSING', 'RESOLVED', 'CLOSED'],
      default: 'OPEN'
    },
    assignedTo: {
      type: String,
      default: 'Helpdesk'
    },
    adminResponse: {
      type: String,
      default: ''
    },
    resolvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);
