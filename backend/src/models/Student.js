import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true
    },
    motherName: {
      type: String,
      trim: true,
      default: ''
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    universityRollNumber: {
      type: String,
      required: [true, 'University Roll Number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    collegeRegistrationNumber: {
      type: String,
      required: [true, 'College Registration Number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    admissionNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
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
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true
    },
    branch: {
      type: String,
      trim: true,
      default: ''
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true
    },
    section: {
      type: String,
      trim: true,
      default: 'A'
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true
    },
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    pincode: {
      type: String,
      trim: true,
      default: ''
    },
    guardianContact: {
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
    hostel: {
      hostelName: { type: String, default: '' },
      roomNumber: { type: String, default: '' },
      bedNumber: { type: String, default: '' },
      status: { type: String, default: 'Not Enrolled' }
    },
    transport: {
      busNumber: { type: String, default: '' },
      routeName: { type: String, default: '' },
      stopName: { type: String, default: '' },
      status: { type: String, default: 'Not Enrolled' }
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    isVerified: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Method to sanitize sensitive fields when returning JSON
studentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const Student = mongoose.model('Student', studentSchema);
