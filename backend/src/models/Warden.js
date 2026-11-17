import mongoose from 'mongoose';

const wardenSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    employeeId: {
      type: String,
      required: [true, 'Warden Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    dateOfBirth: {
      type: String,
      trim: true,
      default: ''
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: ''
    },
    qualification: {
      type: String,
      trim: true,
      default: ''
    },
    designation: {
      type: String,
      trim: true,
      default: 'Hostel Warden'
    },
    hostelAssigned: {
      type: String,
      trim: true,
      default: ''
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      default: null
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deactivated', 'pending_verification'],
      default: 'active'
    },
    role: {
      type: String,
      default: 'WARDEN',
      enum: ['WARDEN']
    }
  },
  {
    timestamps: true
  }
);

wardenSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const Warden = mongoose.model('Warden', wardenSchema);
