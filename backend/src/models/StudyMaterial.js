import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: ['NOTES', 'ASSIGNMENT', 'SYLLABUS', 'REFERENCE'],
      default: 'NOTES'
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
    section: {
      type: String,
      default: 'All'
    },
    subject: {
      type: String,
      required: true
    },
    subjectCode: {
      type: String,
      default: ''
    },
    fileName: {
      type: String,
      default: ''
    },
    fileType: {
      type: String,
      default: 'application/pdf'
    },
    fileData: {
      type: String,
      default: ''
    },
    attachment: {
      type: String,
      default: ''
    },
    attachmentName: {
      type: String,
      default: ''
    },
    externalLink: {
      type: String,
      default: ''
    },
    dueDate: {
      type: Date
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    uploadedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
      name: { type: String, default: 'Faculty' }
    }
  },
  { timestamps: true }
);

studyMaterialSchema.pre('validate', function (next) {
  if (this.uploadedBy?.id && !this.facultyId) {
    this.facultyId = this.uploadedBy.id;
  }
  if (this.facultyId && !this.uploadedBy?.id) {
    if (!this.uploadedBy) this.uploadedBy = {};
    this.uploadedBy.id = this.facultyId;
  }
  next();
});

export const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
