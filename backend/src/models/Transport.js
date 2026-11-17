import mongoose from 'mongoose';

const transportSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    routeName: {
      type: String,
      required: true,
      trim: true
    },
    driverName: {
      type: String,
      required: true,
      trim: true
    },
    driverContact: {
      type: String,
      required: true,
      trim: true
    },
    totalSeats: {
      type: Number,
      default: 40,
      min: 1
    },
    occupiedSeats: {
      type: Number,
      default: 0,
      min: 0
    },
    availableSeats: {
      type: Number,
      default: 40,
      min: 0
    },
    transportFee: {
      type: Number,
      default: 18000
    },
    academicYear: {
      type: String,
      default: '2024-2025'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    stops: [
      {
        stopName: { type: String, required: true },
        pickupTime: { type: String, default: '07:30 AM' },
        dropTime: { type: String, default: '05:30 PM' },
        stopFee: { type: Number, default: 18000 }
      }
    ],
    assignedStudents: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        studentName: { type: String },
        rollNumber: { type: String },
        stopName: { type: String },
        seatNumber: { type: Number, default: 1 },
        feeStatus: { type: String, default: 'PAID' },
        allocationDate: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Transport = mongoose.model('Transport', transportSchema);
export const Bus = Transport; // Alias for compatibility with prompt naming
