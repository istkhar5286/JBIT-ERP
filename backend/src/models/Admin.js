import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      default: 'ADMIN',
      enum: ['ADMIN']
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    mobile: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const Admin = mongoose.model('Admin', adminSchema);
