import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true
    },
    academicYear: {
      type: String,
      required: true,
      default: '2024-2025'
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
      default: 'All'
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    subjectCode: {
      type: String,
      trim: true,
      default: ''
    },
    examDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      default: '10:00 AM'
    },
    endTime: {
      type: String,
      required: true,
      default: '01:00 PM'
    },
    room: {
      type: String,
      default: 'Exam Hall A',
      trim: true
    },
    instructions: {
      type: String,
      default: 'Carry printed admit card and college ID card. Electronic devices prohibited.'
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED'
    }
  },
  { timestamps: true }
);

export const Exam = mongoose.model('Exam', examSchema);
