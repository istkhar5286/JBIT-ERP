import mongoose from 'mongoose';

const subjectMarkSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  internalMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  sessionalMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  practicalMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  externalMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  totalMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  grade: {
    type: String,
    default: 'P'
  },
  gradePoint: {
    type: Number,
    default: 4
  },
  credits: {
    type: Number,
    default: 4
  },
  status: {
    type: String,
    enum: ['PASS', 'FAIL'],
    default: 'PASS'
  }
});

const backPaperSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  semester: { type: String, required: true },
  attempt: { type: Number, default: 1 },
  status: { type: String, enum: ['PENDING', 'CLEARED'], default: 'PENDING' },
  clearedDate: { type: Date }
});

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    academicYear: {
      type: String,
      required: true,
      default: '2024-2025'
    },
    course: {
      type: String,
      required: true
    },
    branch: {
      type: String,
      default: ''
    },
    semester: {
      type: String,
      required: true
    },
    subjects: [subjectMarkSchema],
    totalCredits: {
      type: Number,
      default: 0
    },
    totalMarksObtained: {
      type: Number,
      default: 0
    },
    totalMaxMarks: {
      type: Number,
      default: 0
    },
    sgpa: {
      type: Number,
      default: 0
    },
    cgpa: {
      type: Number,
      default: 0
    },
    overallStatus: {
      type: String,
      enum: ['PASS', 'FAIL', 'WITHHELD'],
      default: 'PASS'
    },
    backPapers: [backPaperSchema],
    isPublished: {
      type: Boolean,
      default: true
    },
    publishedDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const Result = mongoose.model('Result', resultSchema);
