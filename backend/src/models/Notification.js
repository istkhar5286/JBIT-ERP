import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    recipientRole: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'ADMIN', 'WARDEN'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'FEE_DUE',
        'FEE_OVERDUE',
        'PAYMENT_SUCCESS',
        'PAYMENT',
        'EXAM',
        'RESULT',
        'NOTICE',
        'ASSIGNMENT',
        'ATTENDANCE_WARNING',
        'HOSTEL_APPLICATION',
        'HOSTEL_ALLOCATION',
        'HOSTEL_VACATED',
        'HOSTEL_COMPLAINT',
        'HOSTEL_OUTING',
        'TRANSPORT_APPLICATION',
        'TRANSPORT_ALLOCATION',
        'SYSTEM'
      ],
      default: 'SYSTEM'
    },
    link: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
