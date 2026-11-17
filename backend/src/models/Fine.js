import mongoose from 'mongoose';

const fineSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    reason: {
      type: String,
      required: [true, 'Fine reason is required'],
      enum: [
        'Late Fee',
        'Library Fine',
        'Attendance Fine',
        'Examination Fine',
        'Other College Fine'
      ],
      default: 'Other College Fine'
    },
    amount: {
      type: Number,
      required: [true, 'Fine amount is required'],
      min: [1, 'Fine amount must be greater than 0']
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PAID'],
      default: 'UNPAID'
    },
    imposedDate: {
      type: Date,
      default: Date.now
    },
    paidDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Fine = mongoose.model('Fine', fineSchema);
