import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    totalClasses: {
      type: Number,
      required: [true, 'Total classes is required'],
      min: [0, 'Total classes cannot be negative']
    },
    attendedClasses: {
      type: Number,
      required: [true, 'Attended classes is required'],
      min: [0, 'Attended classes cannot be negative']
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Calculate percentage before saving
attendanceSchema.pre('save', function (next) {
  if (this.totalClasses > 0) {
    this.percentage = Math.round(((this.attendedClasses / this.totalClasses) * 100) * 100) / 100;
  } else {
    this.percentage = 0;
  }
  next();
});

export const Attendance = mongoose.model('Attendance', attendanceSchema);
