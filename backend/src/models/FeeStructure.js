import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
      default: 'General'
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2024-2025'
    },
    // Itemized Fee Components
    tuitionFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Tuition fee cannot be negative']
    },
    examinationFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Examination fee cannot be negative']
    },
    registrationFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Registration fee cannot be negative']
    },
    libraryFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Library fee cannot be negative']
    },
    laboratoryFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Laboratory fee cannot be negative']
    },
    hostelFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Hostel fee cannot be negative']
    },
    transportFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Transport fee cannot be negative']
    },
    otherCharges: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Other charges cannot be negative']
    },
    // Configurable Automatic Late Fine Rule
    lateFineRule: {
      type: {
        type: String,
        enum: ['FIXED', 'PER_DAY', 'NONE'],
        default: 'PER_DAY'
      },
      amount: {
        type: Number,
        default: 50, // e.g. ₹50 per day or ₹500 fixed
        min: 0
      },
      graceDays: {
        type: Number,
        default: 5,
        min: 0
      }
    },
    // Template Installment Schedules
    installments: [
      {
        installmentNumber: { type: Number, required: true },
        title: { type: String, required: true },
        percentage: { type: Number, required: true }, // e.g. 60% term 1, 40% term 2
        dueDate: { type: Date, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

feeStructureSchema.index(
  { course: 1, branch: 1, semester: 1, academicYear: 1 },
  { unique: true }
);

export const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
