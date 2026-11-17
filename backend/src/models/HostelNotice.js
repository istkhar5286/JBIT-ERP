import mongoose from 'mongoose';

const hostelNoticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Notice description is required'],
      trim: true
    },
    targetAudience: {
      type: String,
      enum: ['ALL_HOSTELS', 'SPECIFIC_HOSTEL', 'BLOCK_SPECIFIC', 'ROOM_GROUP'],
      default: 'ALL_HOSTELS'
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      default: null
    },
    hostelName: {
      type: String,
      default: ''
    },
    targetBlock: {
      type: String,
      default: ''
    },
    targetRoom: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['TIMINGS', 'MAINTENANCE', 'MESS', 'INSPECTION', 'ANNOUNCEMENT', 'GENERAL'],
      default: 'ANNOUNCEMENT'
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL'
    },
    postedBy: {
      name: { type: String, default: 'Hostel Warden' },
      role: { type: String, default: 'WARDEN' },
      wardenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warden', default: null }
    },
    attachment: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const HostelNotice = mongoose.model('HostelNotice', hostelNoticeSchema);
