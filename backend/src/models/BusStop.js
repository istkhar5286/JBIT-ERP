import mongoose from 'mongoose';

const busStopSchema = new mongoose.Schema(
  {
    stopName: {
      type: String,
      required: [true, 'Bus stop name is required'],
      unique: true,
      trim: true
    },
    landmark: {
      type: String,
      trim: true,
      default: ''
    },
    pickupTime: {
      type: String,
      default: '07:30 AM',
      trim: true
    },
    dropTime: {
      type: String,
      default: '05:30 PM',
      trim: true
    },
    estimatedFee: {
      type: Number,
      default: 18000
    },
    isCampus: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const BusStop = mongoose.model('BusStop', busStopSchema);
