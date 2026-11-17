import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Notice content is required'],
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['ACADEMIC', 'EXAMINATION', 'FEES', 'EVENTS', 'HOLIDAYS', 'GENERAL'],
      default: 'GENERAL'
    },
    priority: {
      type: String,
      enum: ['HIGH', 'NORMAL', 'LOW'],
      default: 'NORMAL'
    },
    attachment: {
      type: String,
      default: ''
    },
    attachmentName: {
      type: String,
      default: ''
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'FACULTY', 'COURSE_SPECIFIC'],
      default: 'ALL'
    },
    targetCourse: {
      type: String,
      default: ''
    },
    targetBranch: {
      type: String,
      default: ''
    },
    targetSemester: {
      type: String,
      default: ''
    },
    targetSection: {
      type: String,
      default: ''
    },
    postedBy: {
      name: { type: String, default: 'Administration' },
      role: { type: String, default: 'ADMIN' }
    }
  },
  { timestamps: true }
);

export const Notice = mongoose.model('Notice', noticeSchema);
