import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      default: 'THEORY'
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      default: 4,
      min: 1
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
    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null
    },
    assignedFacultyName: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

subjectSchema.pre('validate', function (next) {
  if (!this.subjectName && this.name) {
    this.subjectName = this.name;
  }
  if (!this.name && this.subjectName) {
    this.name = this.subjectName;
  }
  next();
});

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    durationYears: {
      type: Number,
      default: 4
    },
    totalSemesters: {
      type: Number,
      default: 8
    },
    department: {
      type: String,
      default: 'Engineering'
    },
    branches: [
      {
        branchName: { type: String, trim: true },
        branchCode: { type: String, trim: true, uppercase: true },
        semesters: [{ type: String }],
        sections: [{ type: String, default: 'A' }]
      }
    ]
  },
  { timestamps: true }
);

courseSchema.pre('validate', function (next) {
  if (!this.courseName && this.name) {
    this.courseName = this.name;
  }
  if (!this.name && this.courseName) {
    this.name = this.courseName;
  }
  next();
});

export const Subject = mongoose.model('Subject', subjectSchema);
export const Course = mongoose.model('Course', courseSchema);
