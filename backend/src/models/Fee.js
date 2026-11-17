import mongoose from 'mongoose';

const waiverSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['SCHOLARSHIP', 'DISCOUNT', 'WAIVER'],
    required: true,
    default: 'SCHOLARSHIP'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Waiver amount cannot be negative']
  },
  reason: {
    type: String,
    trim: true,
    default: 'Merit-based scholarship'
  },
  approvedBy: {
    type: String,
    trim: true,
    default: 'JBIT Administration'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  }
});

const installmentSchema = new mongoose.Schema({
  installmentNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'Installment'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFine: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['UPCOMING', 'DUE', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'],
    default: 'UPCOMING'
  }
});

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true
    },
    // Itemized Fees
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
    // Backward-compatible field mapping to tuition + core academic components
    academicFee: {
      type: Number,
      default: 0,
      min: [0, 'Academic fee cannot be negative']
    },
    // Late fine rule applied to this student's installments
    lateFineRule: {
      type: {
        type: String,
        enum: ['FIXED', 'PER_DAY', 'NONE'],
        default: 'PER_DAY'
      },
      amount: {
        type: Number,
        default: 50,
        min: 0
      },
      graceDays: {
        type: Number,
        default: 5,
        min: 0
      }
    },
    // Scholarships, discounts, fee waivers
    waivers: [waiverSchema],

    // Installments
    installments: [installmentSchema],

    // Aggregates & Balances
    baseTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    waiverTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    lateFineTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPayable: {
      type: Number,
      default: 0,
      min: [0, 'Total payable cannot be negative']
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: [0, 'Total paid cannot be negative']
    },
    totalRefunded: {
      type: Number,
      default: 0,
      min: [0, 'Total refunded cannot be negative']
    },
    netPaid: {
      type: Number,
      default: 0,
      min: [0, 'Net paid cannot be negative']
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Pending amount cannot be negative']
    },
    status: {
      type: String,
      enum: ['CLEAR', 'PARTIAL', 'PENDING', 'OVERDUE'],
      default: 'CLEAR',
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Fee = mongoose.model('Fee', feeSchema);
