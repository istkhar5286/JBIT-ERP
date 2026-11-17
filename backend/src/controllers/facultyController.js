import { Faculty } from '../models/Faculty.js';
import { Student } from '../models/Student.js';
import { Attendance } from '../models/Attendance.js';
import { AttendanceLog } from '../models/AttendanceLog.js';
import { Timetable } from '../models/Timetable.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { Result } from '../models/Result.js';
import { Notice } from '../models/Notice.js';
import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { isValidPhotoDataUrl } from './authController.js';

/**
 * Get Faculty Dashboard Overview
 * GET /api/faculty/dashboard
 */
export const getFacultyDashboard = async (req, res, next) => {
  try {
    const faculty = req.user;

    // 1. Today's Timetable
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[new Date().getDay()];

    const todaySchedule = await Timetable.find({
      $or: [{ facultyId: faculty._id }, { facultyName: faculty.name }],
      day: todayDay
    }).sort({ timeSlot: 1 }).lean();

    // 2. Recent Notices
    const notices = await Notice.find({
      targetAudience: { $in: ['ALL', 'FACULTY'] }
    }).sort({ date: -1 }).limit(5).lean();

    // 3. Assigned Classes & Subjects
    const assignedClasses = faculty.assignedClasses || [];
    const subjects = faculty.subjects || [];

    // 4. Study Materials uploaded
    const materialsCount = await StudyMaterial.countDocuments({
      'uploadedBy.id': faculty._id
    });

    // 5. Total unique students in assigned classes
    let studentCount = 0;
    if (assignedClasses.length > 0) {
      const classFilters = assignedClasses.map((c) => ({
        course: c.course,
        semester: c.semester,
        ...(c.branch ? { branch: c.branch } : {})
      }));
      studentCount = await Student.countDocuments({
        $or: classFilters,
        status: 'active'
      });
    }

    const totalWeeklySlots = await Timetable.countDocuments({
      $or: [{ facultyId: faculty._id }, { facultyName: faculty.name }]
    });

    const metrics = {
      assignedClassesCount: assignedClasses.length,
      totalSubjects: subjects.length,
      totalLectureSlots: totalWeeklySlots,
      uploadedMaterialsCount: materialsCount,
      studentCount
    };

    return sendSuccess(res, 'Faculty dashboard fetched successfully', {
      faculty,
      metrics,
      todayDay,
      todaySchedule,
      todayClasses: todaySchedule,
      assignedClasses,
      subjects,
      materialsCount,
      studentCount,
      notices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Faculty Profile
 * GET /api/faculty/profile
 */
export const getFacultyProfile = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.user._id).lean();
    if (!faculty) return sendError(res, 'Faculty profile not found', 404);
    return sendSuccess(res, 'Faculty profile fetched', faculty);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Faculty Profile (Photo & Mobile)
 * PUT /api/faculty/profile
 */
export const updateFacultyProfile = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.user._id);
    if (!faculty) return sendError(res, 'Faculty not found', 404);

    const { mobile, profilePhoto } = req.body;
    if (mobile) faculty.mobile = mobile.trim();
    if (profilePhoto !== undefined) {
      if (profilePhoto && !isValidPhotoDataUrl(profilePhoto)) {
        return sendError(res, 'Invalid photo format or file exceeds 5MB.', 400);
      }
      faculty.profilePhoto = profilePhoto;
    }

    await faculty.save();
    return sendSuccess(res, 'Faculty profile updated successfully', faculty);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Faculty Assigned Classes
 * GET /api/faculty/classes
 */
export const getFacultyClasses = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.user._id).lean();
    if (!faculty) return sendError(res, 'Faculty not found', 404);
    return sendSuccess(res, 'Assigned classes fetched', faculty.assignedClasses || []);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Assigned Classes and Students Roster
 * GET /api/faculty/students
 */
export const getAssignedStudents = async (req, res, next) => {
  try {
    const { course, semester, section, branch } = req.query;
    const filter = { status: 'active' };

    if (course) filter.course = course;
    if (semester) filter.semester = semester;
    if (section) filter.section = section;
    if (branch) filter.branch = branch;

    const students = await Student.find(filter)
      .select('fullName universityRollNumber admissionNumber course branch semester section email mobile profilePhoto')
      .sort({ universityRollNumber: 1 })
      .lean();

    return sendSuccess(res, 'Students roster fetched', students);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Faculty Timetable
 * GET /api/faculty/timetable
 */
export const getFacultyTimetable = async (req, res, next) => {
  try {
    const schedule = await Timetable.find({
      $or: [{ facultyId: req.user._id }, { facultyName: req.user.name }]
    }).sort({ day: 1, timeSlot: 1 }).lean();

    return sendSuccess(res, 'Faculty weekly timetable fetched', schedule);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Classroom Attendance
 * POST /api/faculty/attendance/mark
 */
export const markClassAttendance = async (req, res, next) => {
  try {
    const { course, branch, semester, section = 'A', subject, date = new Date(), records = [] } = req.body;

    if (!course || !semester || !subject || !records.length) {
      return sendError(res, 'Course, semester, subject, and student records are required.', 400);
    }

    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = records.length - presentCount;

    // 1. Create AttendanceLog session record
    const attendanceLog = await AttendanceLog.create({
      date: new Date(date),
      course,
      branch: branch || '',
      semester,
      section,
      subject,
      markedBy: {
        id: req.user._id,
        name: req.user.name,
        role: 'FACULTY'
      },
      totalStudents: records.length,
      presentCount,
      absentCount,
      records
    });

    // 2. Synchronize each student's cumulative Attendance document
    for (const item of records) {
      if (!item.studentId) continue;

      let att = await Attendance.findOne({
        studentId: item.studentId,
        subject: subject.trim()
      });

      if (!att) {
        att = new Attendance({
          studentId: item.studentId,
          subject: subject.trim(),
          totalClasses: 0,
          attendedClasses: 0
        });
      }

      att.totalClasses += 1;
      if (item.status === 'PRESENT') {
        att.attendedClasses += 1;
      }
      await att.save();

      // If attendance drops below 75%, trigger low-attendance warning notification
      if (att.percentage < 75 && att.totalClasses >= 5) {
        await Notification.create({
          recipientId: item.studentId,
          recipientRole: 'STUDENT',
          title: `Attendance Shortage Warning: ${subject}`,
          message: `Your attendance in ${subject} is currently ${att.percentage}%. Institutional guidelines require at least 75% for exam eligibility.`,
          type: 'ATTENDANCE_WARNING',
          link: '/attendance'
        });
      }
    }

    return sendSuccess(res, 'Classroom attendance registered successfully', attendanceLog, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Attendance History / Logs
 * GET /api/faculty/attendance/logs
 */
export const getAttendanceLogs = async (req, res, next) => {
  try {
    const { subject, course, semester } = req.query;
    const filter = { 'markedBy.id': req.user._id };

    if (subject) filter.subject = subject;
    if (course) filter.course = course;
    if (semester) filter.semester = semester;

    const logs = await AttendanceLog.find(filter).sort({ date: -1 }).limit(30).lean();
    return sendSuccess(res, 'Attendance logs fetched', logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Enter or Update Student Marks (Supports single student or array of students)
 * POST /api/faculty/marks or POST /api/faculty/marks/save
 */
export const saveStudentMarks = async (req, res, next) => {
  try {
    const {
      semester,
      academicYear = '2024-2025',
      subject,
      subjectName,
      subjectCode,
      course,
      branch = ''
    } = req.body;

    const finalSubjectName = (subjectName || subject || '').trim();
    const finalSubjectCode = (subjectCode || 'SUB-101').trim();

    if (!semester || !finalSubjectName) {
      return sendError(res, 'Semester and subject name are required.', 400);
    }

    // Build the list of student entries to process
    let entries = [];
    if (Array.isArray(req.body.students) && req.body.students.length > 0) {
      entries = req.body.students;
    } else if (req.body.studentId) {
      entries = [
        {
          studentId: req.body.studentId,
          internalMarks: req.body.internalMarks || 0,
          sessionalMarks: req.body.sessionalMarks || 0,
          practicalMarks: req.body.practicalMarks || 0,
          externalMarks: req.body.externalMarks || 0,
          credits: req.body.credits || 4
        }
      ];
    } else {
      return sendError(res, 'No students provided for marks recording.', 400);
    }

    const savedResults = [];

    for (const item of entries) {
      if (!item.studentId) continue;
      const student = await Student.findById(item.studentId);
      if (!student) continue;

      const studentCourse = course || student.course || 'B.Tech';
      const studentBranch = branch || student.branch || '';
      const studentSemester = semester.toString().trim();

      const internal = Number(item.internalMarks || 0);
      const sessional = Number(item.sessionalMarks || 0);
      const practical = Number(item.practicalMarks || 0);
      const external = Number(item.externalMarks || 0);
      const credits = Number(item.credits || 4);
      const totalMarks = internal + sessional + practical + external;

      let grade = 'F';
      let gradePoint = 0;
      let status = 'FAIL';

      if (totalMarks >= 90) { grade = 'A+'; gradePoint = 10; status = 'PASS'; }
      else if (totalMarks >= 80) { grade = 'A'; gradePoint = 9; status = 'PASS'; }
      else if (totalMarks >= 70) { grade = 'B+'; gradePoint = 8; status = 'PASS'; }
      else if (totalMarks >= 60) { grade = 'B'; gradePoint = 7; status = 'PASS'; }
      else if (totalMarks >= 50) { grade = 'C'; gradePoint = 6; status = 'PASS'; }
      else if (totalMarks >= 40) { grade = 'P'; gradePoint = 4; status = 'PASS'; }
      else { grade = 'F'; gradePoint = 0; status = 'FAIL'; }

      const subjectData = {
        subjectCode: finalSubjectCode,
        subjectName: finalSubjectName,
        internalMarks: internal,
        sessionalMarks: sessional,
        practicalMarks: practical,
        externalMarks: external,
        totalMarks,
        maxMarks: 100,
        grade,
        gradePoint,
        credits,
        status
      };

      let result = await Result.findOne({
        studentId: student._id,
        semester: studentSemester,
        academicYear
      });

      if (!result) {
        result = new Result({
          studentId: student._id,
          academicYear,
          course: studentCourse,
          branch: studentBranch,
          semester: studentSemester,
          subjects: [subjectData]
        });
      } else {
        const existingIdx = result.subjects.findIndex((s) => s.subjectCode === finalSubjectCode);
        if (existingIdx >= 0) {
          result.subjects[existingIdx] = subjectData;
        } else {
          result.subjects.push(subjectData);
        }
      }

      // Recalculate SGPA & CGPA
      let totalCreds = 0;
      let weightedPoints = 0;
      let hasFail = false;
      const backPapers = [];

      result.subjects.forEach((s) => {
        const cred = s.credits || 4;
        totalCreds += cred;
        weightedPoints += (s.gradePoint || 0) * cred;
        if (s.status === 'FAIL') {
          hasFail = true;
          backPapers.push({
            subjectCode: s.subjectCode,
            subjectName: s.subjectName,
            semester: studentSemester,
            attempt: 1,
            status: 'PENDING'
          });
        }
      });

      result.totalCredits = totalCreds;
      result.sgpa = totalCreds > 0 ? Math.round((weightedPoints / totalCreds) * 100) / 100 : 0;
      result.cgpa = result.sgpa; // Default to SGPA for current semester
      result.overallStatus = hasFail ? 'FAIL' : 'PASS';
      result.backPapers = backPapers;
      result.isPublished = true;

      await result.save();
      savedResults.push(result);
    }

    return sendSuccess(
      res,
      'Marks saved and results calculated successfully',
      savedResults.length === 1 ? savedResults[0] : savedResults
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Study Materials
 * GET /api/faculty/materials
 */
export const getFacultyMaterials = async (req, res, next) => {
  try {
    const materials = await StudyMaterial.find({
      'uploadedBy.id': req.user._id
    }).sort({ createdAt: -1 }).lean();

    return sendSuccess(res, 'Study materials fetched', materials);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Study Material or Assignment
 * POST /api/faculty/materials
 */
export const uploadStudyMaterial = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      course,
      branch,
      semester,
      section = 'All',
      subject,
      subjectCode,
      fileName,
      attachmentName,
      fileType,
      fileData,
      attachment,
      externalLink,
      dueDate
    } = req.body;

    if (!title || !course || !semester || !subject) {
      return sendError(res, 'Title, course, semester, and subject are required.', 400);
    }

    const finalFileName = fileName || attachmentName || (attachment ? 'Attachment' : '');
    const finalFileData = fileData || attachment || '';

    const material = await StudyMaterial.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      type: type || 'NOTES',
      course: course.trim(),
      branch: branch ? branch.trim() : '',
      semester: semester.toString().trim(),
      section: section || 'All',
      subject: subject.trim(),
      subjectCode: subjectCode ? subjectCode.trim() : '',
      fileName: finalFileName,
      fileType: fileType || 'application/pdf',
      fileData: finalFileData,
      attachment: finalFileData,
      attachmentName: finalFileName,
      externalLink: externalLink ? externalLink.trim() : '',
      dueDate: dueDate ? new Date(dueDate) : null,
      uploadedBy: {
        id: req.user._id,
        name: req.user.name || 'Faculty Member'
      }
    });

    return sendSuccess(res, 'Study material published successfully', material, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Study Material
 * DELETE /api/faculty/materials/:id
 */
export const deleteStudyMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findOneAndDelete({
      _id: req.params.id,
      'uploadedBy.id': req.user._id
    });

    if (!material) {
      return sendError(res, 'Material not found or unauthorized to delete', 404);
    }

    return sendSuccess(res, 'Material deleted successfully');
  } catch (error) {
    next(error);
  }
};
