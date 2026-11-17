import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ['REGISTRATION', 'PASSWORD_RESET'],
      required: true
    },
    role: {
      type: String,
      enum: ['STUDENT', 'ADMIN', 'FACULTY', 'WARDEN'],
      default: 'STUDENT'
    },
    attempts: {
      type: Number,
      default: 0
    },
    resendCount: {
      type: Number,
      default: 0
    },
    registrationData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const Otp = mongoose.model('Otp', otpSchema);
