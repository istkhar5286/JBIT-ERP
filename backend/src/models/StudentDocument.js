import mongoose from 'mongoose';

const studentDocumentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    documentType: {
      type: String,
      enum: ['ADMISSION', 'ID_PROOF', 'ACADEMIC_CERTIFICATE', 'MARKSHEET', 'PASSPORT_PHOTO', 'OTHER'],
      default: 'OTHER'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      default: 'application/pdf'
    },
    fileData: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'REJECTED'],
      default: 'VERIFIED'
    },
    verifiedBy: {
      type: String,
      default: 'Academic Registrar'
    }
  },
  { timestamps: true }
);

export const StudentDocument = mongoose.model('StudentDocument', studentDocumentSchema);
