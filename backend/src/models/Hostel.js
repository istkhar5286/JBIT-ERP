import mongoose from 'mongoose';

const outingRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, default: '' },
    reason: { type: String, required: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    wardenRemarks: { type: String, default: '' }
  },
  { timestamps: true }
);

const hostelSchema = new mongoose.Schema(
  {
    hostelName: {
      type: String,
      required: true,
      trim: true
    },
    hostelType: {
      type: String,
      enum: ['BOYS', 'GIRLS', 'CO-ED'],
      default: 'BOYS'
    },
    building: {
      type: String,
      trim: true,
      default: 'Main Campus Wing'
    },
    wardenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warden',
      default: null
    },
    wardenName: {
      type: String,
      default: 'Dr. S. K. Verma'
    },
    wardenContact: {
      type: String,
      default: '+91 9876543210'
    },
    hostelFee: {
      type: Number,
      default: 45000
    },
    feeBreakdown: {
      admissionFee: { type: Number, default: 5000 },
      roomFee: { type: Number, default: 20000 },
      messFee: { type: Number, default: 15000 },
      securityDeposit: { type: Number, default: 5000 },
      otherCharges: { type: Number, default: 0 }
    },
    blocks: {
      type: [String],
      default: ['Block A', 'Block B']
    },
    floors: {
      type: [String],
      default: ['Ground Floor', '1st Floor', '2nd Floor']
    },
    totalRooms: {
      type: Number,
      default: 0
    },
    totalBeds: {
      type: Number,
      default: 0
    },
    occupiedBeds: {
      type: Number,
      default: 0
    },
    availableBeds: {
      type: Number,
      default: 0
    },
    facilities: {
      type: [String],
      default: ['Wi-Fi Campus', 'Nutritious Mess', '24x7 Power Backup', 'RO Purified Water', 'Gymnasium', 'Sports Ground']
    },
    description: {
      type: String,
      default: 'JB Institute of Technology On-Campus Residential Hostel Facility with modern amenities and 24x7 security surveillance.'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    // Compatibility fields for legacy queries
    block: { type: String, trim: true, default: 'Block A' },
    floor: { type: String, trim: true, default: '1st Floor' },
    roomNumber: { type: String, trim: true, default: '' },
    bedNumber: { type: String, trim: true, default: '' },
    occupantStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    occupantName: { type: String, default: '' },
    occupantRoll: { type: String, default: '' },
    outingRequests: [outingRequestSchema]
  },
  { timestamps: true }
);

export const Hostel = mongoose.model('Hostel', hostelSchema);
