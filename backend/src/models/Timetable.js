import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true
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
    subjectCode: {
      type: String,
      trim: true,
      default: ''
    },
    room: {
      type: String,
      default: 'LH-101',
      trim: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null
    },
    facultyName: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const Timetable = mongoose.model('Timetable', timetableSchema);
