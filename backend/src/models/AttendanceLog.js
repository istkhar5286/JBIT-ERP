import mongoose from 'mongoose';

const attendanceRecordEntrySchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT'],
    default: 'PRESENT'
  },
  remarks: {
    type: String,
    default: ''
  }
});

const attendanceLogSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    course: {
      type: String,
      required: true,
      trim: true
    },
    branch: {
      type: String,
      trim: true,
      default: ''
    },
    semester: {
      type: String,
      required: true,
      trim: true
    },
    section: {
      type: String,
      trim: true,
      default: 'A'
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    markedBy: {
      id: { type: mongoose.Schema.Types.ObjectId },
      name: { type: String, default: 'Authorized Faculty' },
      role: { type: String, enum: ['FACULTY', 'ADMIN'], default: 'FACULTY' }
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    presentCount: {
      type: Number,
      default: 0
    },
    absentCount: {
      type: Number,
      default: 0
    },
    records: [attendanceRecordEntrySchema]
  },
  { timestamps: true }
);

export const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema);
