import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
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
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    designation: {
      type: String,
      default: 'Assistant Professor',
      trim: true
    },
    parentName: {
      type: String,
      trim: true,
      default: ''
    },
    dateOfBirth: {
      type: String,
      trim: true,
      default: ''
    },
    gender: {
      type: String,
      trim: true,
      default: ''
    },
    course: {
      type: String,
      trim: true,
      default: ''
    },
    branch: {
      type: String,
      trim: true,
      default: ''
    },
    qualification: {
      type: String,
      trim: true,
      default: ''
    },
    joiningDate: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    subjects: [
      {
        type: String,
        trim: true
      }
    ],
    assignedSubjects: [
      {
        type: String,
        trim: true
      }
    ],
    assignedClasses: [
      {
        course: { type: String, trim: true },
        branch: { type: String, trim: true },
        semester: { type: String, trim: true },
        section: { type: String, trim: true, default: 'A' },
        subject: { type: String, trim: true }
      }
    ],
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
      default: 'FACULTY',
      enum: ['FACULTY']
    }
  },
  {
    timestamps: true
  }
);

// Keep subjects and assignedSubjects in sync
facultySchema.pre('save', function (next) {
  if (this.assignedSubjects && this.assignedSubjects.length > 0 && (!this.subjects || this.subjects.length === 0)) {
    this.subjects = [...this.assignedSubjects];
  } else if (this.subjects && this.subjects.length > 0 && (!this.assignedSubjects || this.assignedSubjects.length === 0)) {
    this.assignedSubjects = [...this.subjects];
  }
  next();
});

facultySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const Faculty = mongoose.model('Faculty', facultySchema);
