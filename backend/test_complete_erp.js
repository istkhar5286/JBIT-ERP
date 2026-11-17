import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedInitialDataIfEmpty } from './src/seed/seedData.js';
import { lastSentOtpForTesting } from './src/services/emailService.js';
import http from 'http';

// Minimal 1x1 valid PNG
const SAMPLE_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const runCompleteErpTests = async () => {
  console.log('🏛️ Starting End-to-End JBIT College ERP Comprehensive Integration Tests...\n');

  await connectDB();
  await seedInitialDataIfEmpty();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const BASE_URL = `http://127.0.0.1:${port}/api`;
  console.log(`📍 Test server listening on ${BASE_URL}\n`);

  const assert = (condition, message) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${message}`);
      server.close();
      process.exit(1);
    }
    console.log(`✅ ${message}`);
  };

  try {
    // -------------------------------------------------------------
    // 1. ADMIN AUTHENTICATION
    // -------------------------------------------------------------
    console.log('\n--- 1. Admin Authentication ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jbinstitute.erp@gmail.com', password: 'jbit@123' })
    });
    const adminAuth = await adminLoginRes.json();
    assert(adminAuth.success && adminAuth.data?.token, 'Admin login succeeded');
    const adminToken = adminAuth.data.token;

    // -------------------------------------------------------------
    // 2. ADMIN CRUD: FACULTY, COURSES, SUBJECTS, TIMETABLE, EXAMS
    // -------------------------------------------------------------
    console.log('\n--- 2. Admin Management Modules ---');

    // Create Faculty
    const facEmpId = `JBIT-FAC-${Date.now()}`;
    const createFacultyRes = await fetch(`${BASE_URL}/admin/faculty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        employeeId: facEmpId,
        name: 'Dr. Vivek Sharma',
        email: `vivek_${Date.now()}@jbit.edu.in`,
        mobile: '9876543210',
        password: 'faculty@password',
        department: 'Computer Science & Engineering',
        designation: 'Associate Professor',
        subjects: ['Data Structures', 'Design & Analysis of Algorithms'],
        assignedClasses: [
          { course: 'B.Tech Computer Science & Engineering', semester: '3', section: 'A', subject: 'Data Structures' }
        ]
      })
    });
    const createFacJson = await createFacultyRes.json();
    assert(createFacJson.success && createFacJson.data?._id, 'Admin successfully created faculty member');
    const facultyId = createFacJson.data._id;

    // Create Course
    const courseCode = `BTECH_IT_${Date.now()}`;
    const createCourseRes = await fetch(`${BASE_URL}/admin/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        courseCode,
        name: 'B.Tech Information Technology',
        durationYears: 4,
        totalSemesters: 8,
        department: 'Engineering'
      })
    });
    const createCourseJson = await createCourseRes.json();
    assert(createCourseJson.success, 'Admin created degree course');

    // Create Subject
    const subCode = `IT-${Math.floor(100 + Math.random() * 900)}`;
    const createSubRes = await fetch(`${BASE_URL}/admin/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        subjectCode: subCode,
        name: 'Web Engineering & Architecture',
        course: 'B.Tech Information Technology',
        branch: 'IT',
        semester: '3',
        credits: 4,
        type: 'THEORY'
      })
    });
    const createSubJson = await createSubRes.json();
    assert(createSubJson.success, 'Admin registered curriculum subject');

    // Create Timetable Slot
    const createSlotRes = await fetch(`${BASE_URL}/admin/timetable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        day: 'Monday',
        timeSlot: '10:00 AM - 11:00 AM',
        course: 'B.Tech Computer Science & Engineering',
        branch: 'CSE',
        semester: '3',
        section: 'A',
        subject: 'Data Structures',
        subjectCode: 'CS-301',
        room: 'LH-102',
        facultyId,
        facultyName: 'Dr. Vivek Sharma'
      })
    });
    const createSlotJson = await createSlotRes.json();
    assert(createSlotJson.success, 'Admin scheduled timetable lecture slot');

    // Create Exam Schedule
    const createExamRes = await fetch(`${BASE_URL}/admin/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        examName: 'Mid-Term Sessional Examination',
        academicYear: '2024-2025',
        course: 'B.Tech Computer Science & Engineering',
        semester: '3',
        subject: 'Data Structures',
        subjectCode: 'CS-301',
        examDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        room: 'Exam Hall A',
        maxMarks: 50,
        passingMarks: 20
      })
    });
    const createExamJson = await createExamRes.json();
    assert(createExamJson.success, 'Admin created university exam schedule');

    // Create Campus Notice
    const createNoticeRes = await fetch(`${BASE_URL}/admin/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Mid-Semester Examinations Commencement Notice',
        description: 'All students are requested to clear fee dues to obtain examination admit cards.',
        category: 'EXAMINATION',
        priority: 'HIGH',
        targetAudience: 'ALL'
      })
    });
    const createNoticeJson = await createNoticeRes.json();
    assert(createNoticeJson.success, 'Admin published campus notice');

    // Create Hostel Room
    const createHostelRes = await fetch(`${BASE_URL}/admin/hostel/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        hostelName: 'Mandakini Boys Hostel',
        block: 'B Block',
        floor: '2nd',
        roomNumber: `R-${Math.floor(100 + Math.random() * 900)}`,
        bedNumber: 'A',
        hostelFee: 45000
      })
    });
    const createHostelJson = await createHostelRes.json();
    assert(createHostelJson.success, 'Admin created hostel room entry');

    // Create Transport Bus
    const createBusRes = await fetch(`${BASE_URL}/admin/transport/buses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        busNumber: `UK07-${Math.floor(1000 + Math.random() * 9000)}`,
        routeName: 'Rishikesh Express',
        driverName: 'Mr. Baljit Singh',
        driverContact: '+91 9876501234',
        transportFee: 18000,
        stops: [{ stopName: 'Natraj Chowk', pickupTime: '07:15 AM', dropTime: '05:45 PM' }]
      })
    });
    const createBusJson = await createBusRes.json();
    assert(createBusJson.success, 'Admin configured transport bus route');

    // -------------------------------------------------------------
    // 3. FACULTY PORTAL FLOW
    // -------------------------------------------------------------
    console.log('\n--- 3. Faculty Authentication & Portal ---');

    // Faculty Login
    const facLoginRes = await fetch(`${BASE_URL}/auth/faculty/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: facEmpId,
        password: 'faculty@password'
      })
    });
    const facLoginJson = await facLoginRes.json();
    assert(facLoginJson.success && facLoginJson.data?.token, 'Faculty logged in successfully');
    const facultyToken = facLoginJson.data.token;

    // Faculty Dashboard
    const facDashRes = await fetch(`${BASE_URL}/faculty/dashboard`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const facDashJson = await facDashRes.json();
    assert(facDashJson.success && facDashJson.data?.metrics, 'Faculty dashboard metrics fetched');

    // Faculty Classes
    const facClassesRes = await fetch(`${BASE_URL}/faculty/classes`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const facClassesJson = await facClassesRes.json();
    assert(facClassesJson.success, 'Faculty assigned classes retrieved');

    // Faculty Timetable
    const facTimetableRes = await fetch(`${BASE_URL}/faculty/timetable`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const facTimetableJson = await facTimetableRes.json();
    assert(facTimetableJson.success && facTimetableJson.data.length > 0, 'Faculty timetable includes assigned lecture slot');

    // Faculty Upload Study Material
    const uploadMatRes = await fetch(`${BASE_URL}/faculty/study-materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`
      },
      body: JSON.stringify({
        title: 'Binary Trees & Graphs Complete Notes',
        description: 'Comprehensive traversal algorithms with solved university questions.',
        subject: 'Data Structures',
        course: 'B.Tech Computer Science & Engineering',
        semester: '3',
        type: 'NOTES'
      })
    });
    const uploadMatJson = await uploadMatRes.json();
    assert(uploadMatJson.success, 'Faculty published lecture study material');

    // -------------------------------------------------------------
    // 4. STUDENT REGISTRATION, ENROLLMENT & CREDENTIALS
    // -------------------------------------------------------------
    console.log('\n--- 4. Student Flow & Certificate Suite ---');

    const studentRoll = `JBIT_ERP_${Date.now()}`;
    const studentEmail = `student_erp_${Date.now()}@gmail.com`;

    // Registration with photo
    const regRes = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Kavita Rawat',
        fatherName: 'Surendra Rawat',
        motherName: 'Sunita Rawat',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: studentEmail,
        universityRollNumber: studentRoll,
        collegeRegistrationNumber: `REG_${Date.now()}`,
        course: 'B.Tech Computer Science & Engineering',
        branch: 'CSE',
        semester: '3',
        section: 'A',
        academicYear: '2024-2025',
        password: 'password123',
        confirmPassword: 'password123',
        profilePhoto: SAMPLE_PNG_BASE64
      })
    });
    const regJson = await regRes.json();
    assert(regJson.success, 'Student initiated registration with passport photo');

    const otp = lastSentOtpForTesting[studentEmail.toLowerCase()];
    assert(otp, `Captured registration OTP: ${otp}`);

    const verifyOtpRes = await fetch(`${BASE_URL}/auth/student/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, otp })
    });
    const verifyJson = await verifyOtpRes.json();
    assert(verifyJson.success && verifyJson.data?.token, 'Student registration verified');
    const studentToken = verifyJson.data.token;
    const studentId = verifyJson.data.user._id;

    // Faculty marks attendance for this student
    const markAttRes = await fetch(`${BASE_URL}/faculty/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`
      },
      body: JSON.stringify({
        course: 'B.Tech Computer Science & Engineering',
        branch: 'CSE',
        semester: '3',
        section: 'A',
        subject: 'Data Structures',
        date: new Date().toISOString().split('T')[0],
        records: [{ studentId, status: 'PRESENT' }],
        remarks: 'Unit 1 Introduction'
      })
    });
    const markAttJson = await markAttRes.json();
    assert(markAttJson.success, 'Faculty recorded session attendance for registered student');

    // Faculty submits marks for this student
    const markMarksRes = await fetch(`${BASE_URL}/faculty/marks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`
      },
      body: JSON.stringify({
        semester: '3',
        academicYear: '2024-2025',
        subject: 'Data Structures',
        subjectCode: 'CS-301',
        students: [
          {
            studentId,
            internalMarks: 22,
            sessionalMarks: 23,
            practicalMarks: 18,
            externalMarks: 25,
            maxMarks: 100,
            credits: 4
          }
        ]
      })
    });
    const markMarksJson = await markMarksRes.json();
    assert(markMarksJson.success, 'Faculty recorded student marks with SGPA calculation');

    // Student fetches Timetable
    const stTimetableRes = await fetch(`${BASE_URL}/student/timetable`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const stTimetableJson = await stTimetableRes.json();
    assert(stTimetableJson.success && stTimetableJson.data.length > 0, 'Student retrieved weekly timetable');

    // Student fetches Results
    const stResultsRes = await fetch(`${BASE_URL}/student/results`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const stResultsJson = await stResultsRes.json();
    assert(stResultsJson.success && stResultsJson.data.length > 0, 'Student retrieved semester grade sheet');

    // Student fetches Study Materials
    const stMatRes = await fetch(`${BASE_URL}/student/study-materials`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const stMatJson = await stMatRes.json();
    assert(stMatJson.success && stMatJson.data.length > 0, 'Student retrieved published study notes');

    // Student files Grievance Complaint
    const stComplaintRes = await fetch(`${BASE_URL}/student/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        category: 'ACADEMIC',
        subject: 'Inquiry on Practical Lab Timings',
        description: 'Requesting confirmation on upcoming algorithm laboratory timings.'
      })
    });
    const stComplaintJson = await stComplaintRes.json();
    assert(stComplaintJson.success, 'Student filed grievance ticket');

    // Student downloads ID Card PDF (with embedded photo and QR code)
    const idCardRes = await fetch(`${BASE_URL}/student/documents/id-card`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(idCardRes.status === 200, 'Student ID Card PDF endpoint returned HTTP 200');
    const idCardBuf = Buffer.from(await idCardRes.arrayBuffer());
    assert(idCardBuf.toString('utf8', 0, 4) === '%PDF', 'ID Card is a valid PDF');
    assert(idCardBuf.length > 10000, `Student ID Card generated successfully (Size: ${idCardBuf.length} bytes)`);

    // Student downloads Marksheet PDF
    const marksheetRes = await fetch(`${BASE_URL}/student/documents/marksheet?semester=3`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(marksheetRes.status === 200, 'Semester Marksheet PDF endpoint returned HTTP 200');
    const marksheetBuf = Buffer.from(await marksheetRes.arrayBuffer());
    assert(marksheetBuf.toString('utf8', 0, 4) === '%PDF', 'Marksheet is a valid PDF');
    assert(marksheetBuf.length > 10000, `Semester Marksheet generated successfully (Size: ${marksheetBuf.length} bytes)`);

    // Student downloads Bonafide Certificate PDF
    const bonafideRes = await fetch(`${BASE_URL}/student/documents/bonafide?purpose=Passport%20Application`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(bonafideRes.status === 200, 'Bonafide Certificate PDF endpoint returned HTTP 200');
    const bonafideBuf = Buffer.from(await bonafideRes.arrayBuffer());
    assert(bonafideBuf.toString('utf8', 0, 4) === '%PDF', 'Bonafide Certificate is a valid PDF');

    // Student downloads Character Certificate PDF
    const characterRes = await fetch(`${BASE_URL}/student/documents/character`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(characterRes.status === 200, 'Character Certificate PDF endpoint returned HTTP 200');
    const characterBuf = Buffer.from(await characterRes.arrayBuffer());
    assert(characterBuf.toString('utf8', 0, 4) === '%PDF', 'Character Certificate is a valid PDF');

    // -------------------------------------------------------------
    // 5. ADMIN DASHBOARD & ANALYTICS VERIFICATION (ZERO DEMO DATA)
    // -------------------------------------------------------------
    console.log('\n--- 5. Admin Dashboard Verification ---');
    const adminDashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminDashJson = await adminDashRes.json();
    assert(adminDashJson.success, 'Admin dashboard retrieved');
    const dCards = adminDashJson.data.cards;
    assert(dCards.totalStudents > 0, `Live totalStudents from DB: ${dCards.totalStudents}`);
    assert(dCards.totalFaculty > 0, `Live totalFaculty from DB: ${dCards.totalFaculty}`);
    assert(dCards.upcomingExamsCount > 0, `Live upcomingExamsCount from DB: ${dCards.upcomingExamsCount}`);
    assert(dCards.pendingComplaintsCount > 0, `Live pendingComplaintsCount from DB: ${dCards.pendingComplaintsCount}`);

    console.log('\n🎉 ALL END-TO-END INTEGRATION TESTS PASSED PERFECTLY!\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Exception during integration tests:', err);
    server.close();
    process.exit(1);
  }
};

runCompleteErpTests();
