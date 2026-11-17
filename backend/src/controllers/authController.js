import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Student } from '../models/Student.js';
import { Admin } from '../models/Admin.js';
import { Faculty } from '../models/Faculty.js';
import { Warden } from '../models/Warden.js';
import { Fee } from '../models/Fee.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { Otp } from '../models/Otp.js';
import { ENV } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  sendRegistrationOtpEmail,
  sendFacultyRegistrationOtpEmail,
  sendWardenRegistrationOtpEmail,
  sendPasswordResetOtpEmail
} from '../services/emailService.js';

// Helper to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN
  });
};

// Helper to validate Gmail format
const isValidGmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim());
};

// Helper to validate Base64 profile photo data URL (JPG/JPEG/PNG, max 5MB)
export const isValidPhotoDataUrl = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') return true; // optional
  const trimmed = dataUrl.trim();
  if (!trimmed) return true;
  const match = trimmed.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
  if (!match) return false;
  // Size estimate from base64 string length: (length * 3/4) / (1024 * 1024) <= 5 MB
  const approxBytes = (match[2].length * 3) / 4;
  return approxBytes <= 5 * 1024 * 1024;
};

// Helper to generate a secure 6-digit numeric OTP
const generateSecureOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Step 1: Initiate Student Registration with Gmail OTP Verification
 * POST /api/auth/student/register
 */
export const registerStudent = async (req, res, next) => {
  try {
    const {
      fullName,
      fatherName,
      motherName = '',
      mobile,
      email,
      universityRollNumber,
      collegeRegistrationNumber,
      admissionNumber = '',
      dateOfBirth = '',
      gender = '',
      course,
      branch = '',
      semester,
      section = 'A',
      academicYear,
      category = 'General',
      address = '',
      city = '',
      state = '',
      pincode = '',
      guardianContact = '',
      profilePhoto = '',
      password,
      confirmPassword
    } = req.body;

    // Required fields validation
    if (
      !fullName ||
      !fatherName ||
      !mobile ||
      !email ||
      !universityRollNumber ||
      !course ||
      !semester ||
      !academicYear ||
      !password
    ) {
      return sendError(res, 'Full Name, Father Name, Mobile, Email, Roll Number, Course, Semester, Academic Year, and Password are required.', 400);
    }

    const regNumber = collegeRegistrationNumber || admissionNumber || universityRollNumber;
    const admNumber = admissionNumber || collegeRegistrationNumber || universityRollNumber;

    // Gmail address requirement
    if (!isValidGmail(email)) {
      return sendError(res, 'A valid Gmail address (@gmail.com) is required for student registration.', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', 400);
    }

    if (confirmPassword && password !== confirmPassword) {
      return sendError(res, 'Passwords do not match.', 400);
    }

    if (profilePhoto && !isValidPhotoDataUrl(profilePhoto)) {
      return sendError(res, 'Profile photo must be a valid JPEG or PNG image under 5MB.', 400);
    }

    // Check duplicate roll number or registration number in Student collection
    const existingRoll = await Student.findOne({
      universityRollNumber: universityRollNumber.trim().toUpperCase()
    });
    if (existingRoll) {
      return sendError(res, 'University Roll Number is already registered.', 400);
    }

    const existingReg = await Student.findOne({
      collegeRegistrationNumber: regNumber.trim().toUpperCase()
    });
    if (existingReg) {
      return sendError(res, 'College Registration Number is already registered.', 400);
    }

    const existingEmail = await Student.findOne({
      email: email.trim().toLowerCase()
    });
    if (existingEmail) {
      return sendError(res, 'Email address is already in use.', 400);
    }

    const existingMobile = await Student.findOne({
      mobile: mobile.trim()
    });
    if (existingMobile) {
      return sendError(res, 'Mobile number is already registered.', 400);
    }

    // Generate secure 6-digit OTP
    const rawOtp = generateSecureOtp();

    // Hash OTP and Password for secure database storage
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);
    const passwordHash = await bcrypt.hash(password, salt);

    const cleanEmail = email.trim().toLowerCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Remove any previous pending registration OTP for this email
    await Otp.deleteMany({ email: cleanEmail, purpose: 'REGISTRATION' });

    // Store pending registration payload securely in Otp collection
    await Otp.create({
      email: cleanEmail,
      otpHash,
      purpose: 'REGISTRATION',
      role: 'STUDENT',
      registrationData: {
        fullName: fullName.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        mobile: mobile.trim(),
        email: cleanEmail,
        universityRollNumber: universityRollNumber.trim().toUpperCase(),
        collegeRegistrationNumber: regNumber.trim().toUpperCase(),
        admissionNumber: admNumber.trim().toUpperCase(),
        dateOfBirth: dateOfBirth.trim(),
        gender: gender.trim(),
        course: course.trim(),
        branch: branch.trim(),
        semester: semester.toString().trim(),
        section: section.trim() || 'A',
        academicYear: academicYear.trim(),
        category: category.trim() || 'General',
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        guardianContact: guardianContact.trim(),
        profilePhoto: profilePhoto || '',
        passwordHash
      },
      expiresAt,
      lastSentAt: new Date()
    });

    // Send verification code via Email Service
    await sendRegistrationOtpEmail(cleanEmail, rawOtp, fullName.trim());

    return sendSuccess(
      res,
      'Verification OTP has been sent to your Gmail address. Please verify to activate your account.',
      {
        email: cleanEmail,
        expiresInSeconds: 600,
        cooldownSeconds: 60,
        ...(ENV.NODE_ENV !== 'production' ? { devOtp: rawOtp } : {})
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2: Verify Registration OTP & Complete Account Creation
 * POST /api/auth/student/verify-otp
 */
export const verifyRegistrationOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(res, 'Email and verification OTP are required.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Find pending registration OTP
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: 'REGISTRATION'
    });

    if (!otpRecord) {
      return sendError(res, 'No pending registration found for this email address. Please register again.', 404);
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 'Verification OTP has expired. Please request a new OTP.', 400);
    }

    // Verify OTP using bcrypt
    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);
    if (!isMatch) {
      return sendError(res, 'Invalid verification code. Please check your Gmail and try again.', 400);
    }

    const regData = otpRecord.registrationData;
    if (!regData) {
      return sendError(res, 'Registration payload is missing. Please initiate registration again.', 400);
    }

    // Verify uniqueness once again before creating student
    const duplicateCheck = await Student.findOne({
      $or: [
        { email: cleanEmail },
        { universityRollNumber: regData.universityRollNumber },
        { collegeRegistrationNumber: regData.collegeRegistrationNumber },
        { mobile: regData.mobile }
      ]
    });

    if (duplicateCheck) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 'An account with these details was already created.', 400);
    }

    // Create verified student with all registration details
    const student = await Student.create({
      fullName: regData.fullName,
      fatherName: regData.fatherName,
      motherName: regData.motherName || '',
      mobile: regData.mobile,
      email: cleanEmail,
      universityRollNumber: regData.universityRollNumber,
      collegeRegistrationNumber: regData.collegeRegistrationNumber,
      admissionNumber: regData.admissionNumber || regData.collegeRegistrationNumber,
      dateOfBirth: regData.dateOfBirth || '',
      gender: regData.gender || '',
      course: regData.course,
      branch: regData.branch || '',
      semester: regData.semester,
      section: regData.section || 'A',
      academicYear: regData.academicYear,
      category: regData.category || 'General',
      address: regData.address || '',
      city: regData.city || '',
      state: regData.state || '',
      pincode: regData.pincode || '',
      guardianContact: regData.guardianContact || '',
      profilePhoto: regData.profilePhoto || '',
      passwordHash: regData.passwordHash,
      status: 'active',
      isVerified: true
    });

    // Assign fee schedule from institutional course template or default JBIT fee structure
    let structure = await FeeStructure.findOne({
      course: regData.course,
      semester: String(regData.semester)
    });
    if (!structure) {
      structure = await FeeStructure.findOne({ course: regData.course });
    }

    const tuitionFee = structure?.tuitionFee ?? 45000;
    const examinationFee = structure?.examinationFee ?? 5000;
    const registrationFee = structure?.registrationFee ?? 2500;
    const libraryFee = structure?.libraryFee ?? 2500;
    const laboratoryFee = structure?.laboratoryFee ?? 5000;
    const hostelFee = structure?.hostelFee ?? 0;
    const transportFee = structure?.transportFee ?? 0;
    const otherCharges = structure?.otherCharges ?? 2500;
    const academicFee = tuitionFee + examinationFee + registrationFee + libraryFee + laboratoryFee;
    const totalPayable = academicFee + hostelFee + transportFee + otherCharges;

    const term1Amt = Math.round(totalPayable * 0.6);
    const term2Amt = totalPayable - term1Amt;
    const now = new Date();
    const installments = [
      {
        installmentNumber: 1,
        title: 'Installment 1 - Term 1 Academic Fee',
        amount: term1Amt,
        dueDate: new Date(now.getTime() + 30 * 86400000),
        paidAmount: 0,
        remainingAmount: term1Amt,
        lateFine: 0,
        status: 'UPCOMING'
      },
      {
        installmentNumber: 2,
        title: 'Installment 2 - Term 2 & Lab/Exam Fee',
        amount: term2Amt,
        dueDate: new Date(now.getTime() + 90 * 86400000),
        paidAmount: 0,
        remainingAmount: term2Amt,
        lateFine: 0,
        status: 'UPCOMING'
      }
    ];

    await Fee.create({
      studentId: student._id,
      tuitionFee,
      examinationFee,
      registrationFee,
      libraryFee,
      laboratoryFee,
      hostelFee,
      transportFee,
      otherCharges,
      academicFee,
      baseTotal: totalPayable,
      totalPayable,
      totalPaid: 0,
      totalRefunded: 0,
      netPaid: 0,
      pendingAmount: totalPayable,
      status: totalPayable > 0 ? 'PENDING' : 'CLEAR',
      installments,
      lateFineRule: structure?.lateFineRule || {
        type: 'PER_DAY',
        amount: 50,
        graceDays: 5
      }
    });

    // Clean up OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    const token = generateToken(student._id, 'STUDENT');

    return sendSuccess(
      res,
      'Email successfully verified and student profile created! Welcome to JB Institute of Technology.',
      {
        token,
        role: 'STUDENT',
        user: student
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Resend Student Registration OTP with 60s cooldown
 * POST /api/auth/student/resend-otp
 */
export const resendRegistrationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Email is required to resend OTP.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: 'REGISTRATION'
    });

    if (!otpRecord) {
      return sendError(res, 'No pending registration found for this email address. Please register again.', 404);
    }

    // Enforce 60-second cooldown
    const COOLDOWN_MS = 60 * 1000;
    const timeSinceLastSent = Date.now() - new Date(otpRecord.lastSentAt).getTime();
    if (timeSinceLastSent < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastSent) / 1000);
      return sendError(res, `Please wait ${waitSeconds} seconds before requesting a new OTP.`, 429);
    }

    // Generate new OTP & update record
    const rawOtp = generateSecureOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    otpRecord.otpHash = otpHash;
    otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    otpRecord.lastSentAt = new Date();
    await otpRecord.save();

    await sendRegistrationOtpEmail(cleanEmail, rawOtp, otpRecord.registrationData?.fullName || 'Student');

    return sendSuccess(res, 'A new verification OTP has been sent to your Gmail address.', {
      email: cleanEmail,
      expiresInSeconds: 600,
      cooldownSeconds: 60
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 1: Initiate Faculty Registration with Gmail OTP Verification
 * POST /api/auth/faculty/register
 */
export const registerFaculty = async (req, res, next) => {
  try {
    const {
      name,
      fullName,
      parentName = '',
      fatherName = '',
      motherName = '',
      employeeId,
      email,
      mobile,
      dateOfBirth = '',
      gender = '',
      department,
      designation = 'Assistant Professor',
      course = '',
      branch = '',
      qualification = '',
      joiningDate = '',
      address = '',
      profilePhoto = '',
      password,
      confirmPassword
    } = req.body;

    const facultyName = (name || fullName || '').trim();
    const finalParentName = (parentName || fatherName || motherName || '').trim();
    const cleanEmpId = (employeeId || '').trim().toUpperCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanMobile = (mobile || '').trim();

    // Required fields validation
    if (!facultyName || !cleanEmpId || !cleanEmail || !cleanMobile || !department || !password) {
      return sendError(
        res,
        'Full Name, Employee ID, Email, Mobile Number, Department, and Password are required.',
        400
      );
    }

    // Email address requirement
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return sendError(res, 'A valid email address is required for faculty registration.', 400);
    }

    if (cleanMobile.length < 10) {
      return sendError(res, 'Mobile number must be at least 10 digits.', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', 400);
    }

    if (confirmPassword && password !== confirmPassword) {
      return sendError(res, 'Passwords do not match.', 400);
    }

    if (profilePhoto && !isValidPhotoDataUrl(profilePhoto)) {
      return sendError(res, 'Profile photo must be a valid JPEG or PNG image under 5MB.', 400);
    }

    // Check duplicate employee ID or email in Faculty collection
    const existingEmp = await Faculty.findOne({ employeeId: cleanEmpId });
    if (existingEmp) {
      return sendError(res, 'Employee ID is already registered.', 400);
    }

    const existingEmail = await Faculty.findOne({ email: cleanEmail });
    if (existingEmail) {
      return sendError(res, 'Faculty email address is already in use.', 400);
    }

    // Generate secure 6-digit random OTP
    const rawOtp = generateSecureOtp();

    // Hash OTP and password securely
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);
    const passwordHash = await bcrypt.hash(password, salt);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Delete any pending registration OTP for this email and role
    await Otp.deleteMany({ email: cleanEmail, purpose: 'REGISTRATION', role: 'FACULTY' });

    // Store pending faculty registration in Otp collection
    await Otp.create({
      email: cleanEmail,
      otpHash,
      purpose: 'REGISTRATION',
      role: 'FACULTY',
      attempts: 0,
      resendCount: 0,
      registrationData: {
        name: facultyName,
        parentName: finalParentName,
        employeeId: cleanEmpId,
        email: cleanEmail,
        mobile: cleanMobile,
        dateOfBirth: dateOfBirth ? dateOfBirth.trim() : '',
        gender: gender ? gender.trim() : '',
        department: department.trim(),
        designation: designation ? designation.trim() : 'Assistant Professor',
        course: course ? course.trim() : '',
        branch: branch ? branch.trim() : '',
        qualification: qualification ? qualification.trim() : '',
        joiningDate: joiningDate ? joiningDate.trim() : '',
        address: address ? address.trim() : '',
        profilePhoto: profilePhoto || '',
        passwordHash
      },
      expiresAt,
      lastSentAt: new Date()
    });

    // Send verification email via Nodemailer email service
    await sendFacultyRegistrationOtpEmail(cleanEmail, rawOtp, facultyName);

    return sendSuccess(
      res,
      'Verification OTP has been sent to your email address. Please verify to activate your Faculty account.',
      {
        email: cleanEmail,
        expiresInSeconds: 600,
        cooldownSeconds: 60
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2: Verify Faculty Registration OTP & Complete Account Creation
 * POST /api/auth/faculty/verify-otp
 */
export const verifyFacultyRegistrationOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(res, 'Email and verification OTP are required.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Find pending registration OTP
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: 'REGISTRATION',
      role: 'FACULTY'
    });

    if (!otpRecord) {
      return sendError(res, 'No pending registration found for this email address. Please register again.', 404);
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 'Verification OTP has expired. Please request a new OTP.', 400);
    }

    // Check attempt limit
    if ((otpRecord.attempts || 0) >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 'Maximum verification attempts exceeded. Please register again.', 400);
    }

    // Verify OTP using bcrypt
    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      await otpRecord.save();
      const remainingAttempts = 5 - otpRecord.attempts;
      return sendError(
        res,
        `Invalid verification code. Please check your email and try again. (${remainingAttempts} attempts remaining)`,
        400
      );
    }

    const regData = otpRecord.registrationData;
    if (!regData) {
      return sendError(res, 'Registration payload is missing. Please initiate registration again.', 400);
    }

    // Double-check uniqueness before creating Faculty
    const duplicate = await Faculty.findOne({
      $or: [{ email: cleanEmail }, { employeeId: regData.employeeId }]
    });

    if (duplicate) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 'A Faculty account with this Email or Employee ID already exists.', 400);
    }

    // Create verified, active Faculty account
    const faculty = await Faculty.create({
      name: regData.name,
      parentName: regData.parentName || '',
      employeeId: regData.employeeId,
      email: cleanEmail,
      mobile: regData.mobile,
      dateOfBirth: regData.dateOfBirth || '',
      gender: regData.gender || '',
      department: regData.department,
      designation: regData.designation || 'Assistant Professor',
      course: regData.course || '',
      branch: regData.branch || '',
      qualification: regData.qualification || '',
      joiningDate: regData.joiningDate || '',
      address: regData.address || '',
      profilePhoto: regData.profilePhoto || '',
      passwordHash: regData.passwordHash,
      emailVerified: true,
      status: 'active',
      role: 'FACULTY',
      subjects: [],
      assignedSubjects: [],
      assignedClasses: []
    });

    // Clean up OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    // Generate authenticated token
    const token = generateToken(faculty._id, 'FACULTY');

    return sendSuccess(
      res,
      'Email successfully verified and Faculty profile activated! Welcome to JB Institute of Technology.',
      {
        token,
        role: 'FACULTY',
        user: faculty
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Resend Faculty Registration OTP with 60s cooldown and max resend limit
 * POST /api/auth/faculty/resend-otp
 */
export const resendFacultyRegistrationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Email is required to resend OTP.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: 'REGISTRATION',
      role: 'FACULTY'
    });

    if (!otpRecord) {
      return sendError(res, 'No pending registration found for this email address. Please register again.', 404);
    }

    // Enforce 60-second cooldown
    const COOLDOWN_MS = 60 * 1000;
    const timeSinceLastSent = Date.now() - new Date(otpRecord.lastSentAt).getTime();
    if (timeSinceLastSent < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastSent) / 1000);
      return sendError(res, `Please wait ${waitSeconds} seconds before requesting a new OTP.`, 429);
    }

    // Enforce max resend limit (max 5 resends)
    if ((otpRecord.resendCount || 0) >= 5) {
      return sendError(res, 'Maximum OTP resend limit reached. Please re-enter your details to register.', 429);
    }

    // Generate new OTP & update record
    const rawOtp = generateSecureOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    otpRecord.otpHash = otpHash;
    otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    otpRecord.lastSentAt = new Date();
    otpRecord.attempts = 0; // reset attempts on new OTP
    otpRecord.resendCount = (otpRecord.resendCount || 0) + 1;
    await otpRecord.save();

    await sendFacultyRegistrationOtpEmail(
      cleanEmail,
      rawOtp,
      otpRecord.registrationData?.name || 'Faculty Member'
    );

    return sendSuccess(res, 'A new verification OTP has been sent to your email address.', {
      email: cleanEmail,
      expiresInSeconds: 600,
      cooldownSeconds: 60
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student Login
 * POST /api/auth/student/login
 */
export const loginStudent = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return sendError(res, 'Mobile/Email and password are required.', 400);
    }

    const cleanIdentifier = identifier.trim();

    // Query either email, mobile, or roll number
    const student = await Student.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { mobile: cleanIdentifier },
        { universityRollNumber: cleanIdentifier.toUpperCase() }
      ]
    });

    if (!student) {
      return sendError(res, 'Invalid credentials. Please verify your email/mobile and password.', 401);
    }

    if (student.status !== 'active') {
      return sendError(res, 'Your student account is inactive. Please contact administration.', 403);
    }

    const isMatch = await bcrypt.compare(password, student.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials. Please verify your password.', 401);
    }

    const token = generateToken(student._id, 'STUDENT');

    return sendSuccess(res, 'Login successful.', {
      token,
      role: 'STUDENT',
      user: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Login
 * POST /api/auth/admin/login
 */
export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', 400);
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (!admin) {
      return sendError(res, 'Admin account not found with this email.', 401);
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid password.', 401);
    }

    const token = generateToken(admin._id, 'ADMIN');

    return sendSuccess(res, 'Admin authenticated successfully.', {
      token,
      role: 'ADMIN',
      user: admin
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Faculty Login
 * POST /api/auth/faculty/login
 */
export const loginFaculty = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return sendError(res, 'Email or Employee ID and password are required.', 400);
    }

    const cleanIdentifier = identifier.trim();

    const faculty = await Faculty.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { employeeId: cleanIdentifier.toUpperCase() }
      ]
    });

    if (!faculty) {
      return sendError(res, 'Invalid credentials. Faculty account not found.', 401);
    }

    if (faculty.emailVerified === false) {
      return sendError(res, 'Your Faculty account email has not been verified. Please complete OTP verification.', 403);
    }

    if (faculty.status !== 'active') {
      return sendError(res, 'Your Faculty account is deactivated or inactive. Please contact administration.', 403);
    }

    const isMatch = await bcrypt.compare(password, faculty.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials. Incorrect password.', 401);
    }

    const token = generateToken(faculty._id, 'FACULTY');

    return sendSuccess(res, 'Faculty authenticated successfully.', {
      token,
      role: 'FACULTY',
      user: faculty
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  return sendSuccess(res, 'Current user profile fetched.', {
    role: req.role,
    user: req.user
  });
};

/**
 * Update Admin Profile & Photo
 * PUT /api/auth/admin/profile
 */
export const updateAdminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user._id);
    if (!admin) return sendError(res, 'Admin account not found.', 404);

    const { name, mobile, profilePhoto } = req.body;
    if (name) admin.name = name.trim();
    if (mobile !== undefined) admin.mobile = mobile.trim();
    if (profilePhoto !== undefined) {
      if (profilePhoto && !isValidPhotoDataUrl(profilePhoto)) {
        return sendError(res, 'Invalid image format or image exceeds 5MB.', 400);
      }
      admin.profilePhoto = profilePhoto;
    }

    await admin.save();
    return sendSuccess(res, 'Admin profile updated successfully.', admin);
  } catch (error) {
    next(error);
  }
};

/**
 * Step 1 of Forgot Password: Request Password Reset OTP
 * POST /api/auth/forgot-password/request-otp
 */
export const requestForgotPasswordOtp = async (req, res, next) => {
  try {
    const { email, role = 'STUDENT' } = req.body;

    if (!email) {
      return sendError(res, 'Email address is required.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const roleUpper = role.toUpperCase();
    const cleanRole = roleUpper === 'ADMIN' ? 'ADMIN' : roleUpper === 'FACULTY' ? 'FACULTY' : 'STUDENT';

    let userFound = null;
    if (cleanRole === 'ADMIN') {
      userFound = await Admin.findOne({ email: cleanEmail });
    } else if (cleanRole === 'FACULTY') {
      userFound = await Faculty.findOne({ email: cleanEmail });
    } else {
      userFound = await Student.findOne({ email: cleanEmail });
    }

    // Only generate and send OTP if user exists in database
    if (userFound) {
      const rawOtp = generateSecureOtp();
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(rawOtp, salt);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Clear previous reset OTPs for this email
      await Otp.deleteMany({ email: cleanEmail, purpose: 'PASSWORD_RESET' });

      await Otp.create({
        email: cleanEmail,
        otpHash,
        purpose: 'PASSWORD_RESET',
        role: cleanRole,
        expiresAt,
        lastSentAt: new Date()
      });

      const recipientName = userFound.name || userFound.fullName || 'User';
      await sendPasswordResetOtpEmail(cleanEmail, rawOtp, recipientName);
    }

    return sendSuccess(
      res,
      'If an account exists with this email address, a password reset code has been sent to your Gmail.',
      {
        email: cleanEmail,
        expiresInSeconds: 600,
        cooldownSeconds: 60
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2 of Forgot Password: Verify OTP & Reset Password
 * POST /api/auth/forgot-password/verify-and-reset
 */
export const verifyAndResetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, role = 'STUDENT' } = req.body;

    if (!email || !otp || !newPassword) {
      return sendError(res, 'Email, verification code, and new password are required.', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();
    const roleUpper = role.toUpperCase();
    const cleanRole = roleUpper === 'ADMIN' ? 'ADMIN' : roleUpper === 'FACULTY' ? 'FACULTY' : 'STUDENT';

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: 'PASSWORD_RESET'
    });

    if (!otpRecord) {
      return sendError(res, 'Invalid or expired password reset code. Please request a new code.', 400);
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 'Password reset code has expired. Please request a new code.', 400);
    }

    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);
    if (!isMatch) {
      return sendError(res, 'Invalid password reset code. Please check your Gmail and try again.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    if (cleanRole === 'ADMIN') {
      const admin = await Admin.findOne({ email: cleanEmail });
      if (!admin) return sendError(res, 'Admin account not found.', 404);
      admin.passwordHash = passwordHash;
      await admin.save();
    } else if (cleanRole === 'FACULTY') {
      const faculty = await Faculty.findOne({ email: cleanEmail });
      if (!faculty) return sendError(res, 'Faculty account not found.', 404);
      faculty.passwordHash = passwordHash;
      await faculty.save();
    } else {
      const student = await Student.findOne({ email: cleanEmail });
      if (!student) return sendError(res, 'Student account not found.', 404);
      student.passwordHash = passwordHash;
      await student.save();
    }

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    return sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

/**
 * Resend Password Reset OTP with 60s cooldown
 * POST /api/auth/forgot-password/resend-otp
 */
export const resendForgotPasswordOtp = async (req, res, next) => {
  try {
    const { email, role = 'STUDENT' } = req.body;

    if (!email) {
      return sendError(res, 'Email address is required.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const roleUpper = role.toUpperCase();
    const cleanRole = roleUpper === 'ADMIN' ? 'ADMIN' : roleUpper === 'FACULTY' ? 'FACULTY' : 'STUDENT';

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: 'PASSWORD_RESET'
    });

    if (otpRecord) {
      const COOLDOWN_MS = 60 * 1000;
      const timeSinceLastSent = Date.now() - new Date(otpRecord.lastSentAt).getTime();
      if (timeSinceLastSent < COOLDOWN_MS) {
        const waitSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastSent) / 1000);
        return sendError(res, `Please wait ${waitSeconds} seconds before requesting a new OTP.`, 429);
      }

      const rawOtp = generateSecureOtp();
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(rawOtp, salt);

      otpRecord.otpHash = otpHash;
      otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      otpRecord.lastSentAt = new Date();
      await otpRecord.save();

      let userFound = null;
      if (cleanRole === 'ADMIN') {
        userFound = await Admin.findOne({ email: cleanEmail });
      } else if (cleanRole === 'FACULTY') {
        userFound = await Faculty.findOne({ email: cleanEmail });
      } else {
        userFound = await Student.findOne({ email: cleanEmail });
      }

      await sendPasswordResetOtpEmail(cleanEmail, rawOtp, userFound?.name || userFound?.fullName || 'User');
    }

    return sendSuccess(res, 'If an account exists with this email address, a new code has been sent to your Gmail.', {
      email: cleanEmail,
      expiresInSeconds: 600,
      cooldownSeconds: 60
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Universal Forgot Password Handler (supports both 2-step OTP verification and direct fallback)
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  // If OTP is provided, perform verify and reset
  if (req.body.otp) {
    return verifyAndResetPassword(req, res, next);
  }
  // If no OTP, treat as request for OTP
  return requestForgotPasswordOtp(req, res, next);
};

/**
 * ==================================================
 * WARDEN AUTHENTICATION & REGISTRATION
 * ==================================================
 */

/**
 * Initiate Warden Registration with Gmail OTP
 * POST /api/auth/warden/register
 */
export const registerWarden = async (req, res, next) => {
  try {
    const {
      fullName,
      name,
      employeeId,
      wardenId,
      email,
      mobile,
      dateOfBirth = '',
      gender = '',
      qualification = '',
      designation = 'Hostel Warden',
      hostelAssigned = '',
      address = '',
      password,
      confirmPassword,
      profilePhoto = ''
    } = req.body;

    const wardenName = (fullName || name || '').trim();
    const cleanEmpId = (employeeId || wardenId || '').trim().toUpperCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanMobile = (mobile || '').trim();

    // Required fields validation
    if (!wardenName || !cleanEmpId || !cleanEmail || !cleanMobile || !password) {
      return sendError(
        res,
        'Full Name, Employee/Warden ID, Email, Mobile Number, and Password are required.',
        400
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return sendError(res, 'A valid email address is required for warden registration.', 400);
    }

    if (cleanMobile.length < 10) {
      return sendError(res, 'Mobile number must be at least 10 digits.', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', 400);
    }

    if (confirmPassword && password !== confirmPassword) {
      return sendError(res, 'Passwords do not match.', 400);
    }

    if (profilePhoto && !isValidPhotoDataUrl(profilePhoto)) {
      return sendError(res, 'Profile photo must be a valid JPEG or PNG image under 5MB.', 400);
    }

    // Check unique employee ID or email
    const existingWardenId = await Warden.findOne({ employeeId: cleanEmpId });
    if (existingWardenId) {
      return sendError(res, 'Employee/Warden ID is already registered.', 400);
    }

    const existingWardenEmail = await Warden.findOne({ email: cleanEmail });
    if (existingWardenEmail) {
      return sendError(res, 'Email address is already registered to another warden account.', 400);
    }

    // Generate secure 6-digit OTP
    const rawOtp = generateSecureOtp();

    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);
    const passwordHash = await bcrypt.hash(password, salt);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any pending registration OTP for this email and role
    await Otp.deleteMany({ email: cleanEmail, purpose: 'REGISTRATION', role: 'WARDEN' });

    // Store in Otp collection
    await Otp.create({
      email: cleanEmail,
      otpHash,
      purpose: 'REGISTRATION',
      role: 'WARDEN',
      attempts: 0,
      resendCount: 0,
      registrationData: {
        fullName: wardenName,
        employeeId: cleanEmpId,
        email: cleanEmail,
        mobile: cleanMobile,
        dateOfBirth: dateOfBirth ? dateOfBirth.trim() : '',
        gender: gender ? gender.trim() : '',
        qualification: qualification ? qualification.trim() : '',
        designation: designation ? designation.trim() : 'Hostel Warden',
        hostelAssigned: hostelAssigned ? hostelAssigned.trim() : '',
        address: address ? address.trim() : '',
        profilePhoto: profilePhoto || '',
        passwordHash
      },
      expiresAt,
      lastSentAt: new Date()
    });

    // Send Gmail OTP
    await sendWardenRegistrationOtpEmail(cleanEmail, rawOtp, wardenName);

    return sendSuccess(
      res,
      'Verification OTP has been sent to your email address. Please enter the OTP to activate your Warden account.',
      {
        email: cleanEmail,
        expiresInSeconds: 600,
        cooldownSeconds: 60,
        ...(ENV.NODE_ENV !== 'production' ? { devOtp: rawOtp } : {})
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2: Verify Warden Registration OTP & Create Account
 * POST /api/auth/warden/verify-otp
 */
export const verifyWardenRegistrationOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(res, 'Email and verification OTP are required.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: 'REGISTRATION',
      role: 'WARDEN'
    });

    if (!otpRecord) {
      return sendError(res, 'No pending registration found for this email address. Please register again.', 404);
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 'Verification OTP has expired. Please request a new OTP.', 400);
    }

    if ((otpRecord.attempts || 0) >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 'Maximum verification attempts exceeded. Please register again.', 400);
    }

    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      await otpRecord.save();
      const remainingAttempts = 5 - otpRecord.attempts;
      return sendError(
        res,
        `Invalid verification code. (${remainingAttempts} attempts remaining)`,
        400
      );
    }

    const regData = otpRecord.registrationData;
    if (!regData) {
      return sendError(res, 'Registration payload is missing. Please initiate registration again.', 400);
    }

    // Double-check uniqueness
    const duplicate = await Warden.findOne({
      $or: [{ email: cleanEmail }, { employeeId: regData.employeeId }]
    });

    if (duplicate) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 'A Warden account with this Email or Employee ID already exists.', 400);
    }

    // Create verified, active Warden account
    const warden = await Warden.create({
      fullName: regData.fullName,
      employeeId: regData.employeeId,
      email: cleanEmail,
      mobile: regData.mobile,
      dateOfBirth: regData.dateOfBirth || '',
      gender: regData.gender || '',
      qualification: regData.qualification || '',
      designation: regData.designation || 'Hostel Warden',
      hostelAssigned: regData.hostelAssigned || '',
      address: regData.address || '',
      profilePhoto: regData.profilePhoto || '',
      passwordHash: regData.passwordHash,
      emailVerified: true,
      status: 'active',
      role: 'WARDEN'
    });

    await Otp.deleteOne({ _id: otpRecord._id });

    const token = generateToken(warden._id, 'WARDEN');

    return sendSuccess(
      res,
      'Email successfully verified and Warden account activated! Welcome to JB Institute of Technology Hostel Management.',
      {
        token,
        role: 'WARDEN',
        user: warden
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Resend Warden Registration OTP
 * POST /api/auth/warden/resend-otp
 */
export const resendWardenRegistrationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Email is required to resend OTP.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: 'REGISTRATION',
      role: 'WARDEN'
    });

    if (!otpRecord) {
      return sendError(res, 'No pending registration found for this email address. Please register again.', 404);
    }

    const COOLDOWN_MS = 60 * 1000;
    const timeSinceLastSent = Date.now() - new Date(otpRecord.lastSentAt).getTime();
    if (timeSinceLastSent < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastSent) / 1000);
      return sendError(res, `Please wait ${waitSeconds} seconds before requesting a new OTP.`, 429);
    }

    if ((otpRecord.resendCount || 0) >= 5) {
      return sendError(res, 'Maximum OTP resend limit reached. Please re-enter your details to register.', 429);
    }

    const rawOtp = generateSecureOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    otpRecord.otpHash = otpHash;
    otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    otpRecord.lastSentAt = new Date();
    otpRecord.attempts = 0;
    otpRecord.resendCount = (otpRecord.resendCount || 0) + 1;
    await otpRecord.save();

    await sendWardenRegistrationOtpEmail(
      cleanEmail,
      rawOtp,
      otpRecord.registrationData?.fullName || 'Hostel Warden'
    );

    return sendSuccess(res, 'A new verification OTP has been sent to your email address.', {
      email: cleanEmail,
      expiresInSeconds: 600,
      cooldownSeconds: 60
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Warden Login
 * POST /api/auth/warden/login
 */
export const loginWarden = async (req, res, next) => {
  try {
    const { identifier, email, employeeId, wardenId, password } = req.body;

    const idInput = (identifier || email || employeeId || wardenId || '').trim();

    if (!idInput || !password) {
      return sendError(res, 'Registered Email or Warden ID and password are required.', 400);
    }

    const warden = await Warden.findOne({
      $or: [
        { email: idInput.toLowerCase() },
        { employeeId: idInput.toUpperCase() }
      ]
    });

    if (!warden) {
      return sendError(res, 'Invalid credentials. Warden account not found.', 401);
    }

    if (warden.emailVerified === false) {
      return sendError(res, 'Your Warden account email has not been verified. Please complete OTP verification.', 403);
    }

    if (warden.status !== 'active') {
      return sendError(res, 'Your Warden account is deactivated or inactive. Please contact administration.', 403);
    }

    const isMatch = await bcrypt.compare(password, warden.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials. Incorrect password.', 401);
    }

    const token = generateToken(warden._id, 'WARDEN');

    return sendSuccess(res, 'Warden authenticated successfully.', {
      token,
      role: 'WARDEN',
      user: warden
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Warden Profile & Photo
 * PUT /api/warden/profile
 */
export const updateWardenProfile = async (req, res, next) => {
  try {
    const warden = await Warden.findById(req.user._id);
    if (!warden) return sendError(res, 'Warden account not found.', 404);

    const { mobile, address, qualification, designation, profilePhoto } = req.body;

    if (mobile) warden.mobile = mobile.trim();
    if (address !== undefined) warden.address = address.trim();
    if (qualification !== undefined) warden.qualification = qualification.trim();
    if (designation !== undefined) warden.designation = designation.trim();

    if (profilePhoto !== undefined) {
      if (profilePhoto && !isValidPhotoDataUrl(profilePhoto)) {
        return sendError(res, 'Profile photo must be a valid JPEG or PNG image under 5MB.', 400);
      }
      warden.profilePhoto = profilePhoto;
    }

    await warden.save();

    return sendSuccess(res, 'Warden profile updated successfully', warden);
  } catch (error) {
    next(error);
  }
};

