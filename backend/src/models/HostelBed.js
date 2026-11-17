import mongoose from 'mongoose';

const hostelBedSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
      index: true
    },
    hostelName: {
      type: String,
      required: true,
      trim: true
    },
    building: {
      type: String,
      trim: true,
      default: 'Main Campus Wing'
    },
    block: {
      type: String,
      required: true,
      trim: true
    },
    floor: {
      type: String,
      required: true,
      trim: true
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    roomCapacity: {
      type: Number,
      default: 2,
      min: 1
    },
    roomType: {
      type: String,
      enum: ['Single Deluxe', 'Standard Double', 'Standard Triple', 'Four Sharing', 'AC Double'],
      default: 'Standard Double'
    },
    bedNumber: {
      type: String,
      required: true,
      trim: true
    },
    bedIdentifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE'],
      default: 'AVAILABLE',
      index: true
    },
    occupantStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
      index: true
    },
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostelAllocation',
      default: null
    },
    fee: {
      type: Number,
      default: 45000
    },
    wardenName: {
      type: String,
      default: 'Hostel Superintendent'
    },
    wardenContact: {
      type: String,
      default: '+91 9876543210'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast atomic lookups and duplicate prevention
hostelBedSchema.index({ hostelId: 1, block: 1, roomNumber: 1, bedNumber: 1 }, { unique: true });

export const HostelBed = mongoose.model('HostelBed', hostelBedSchema);
