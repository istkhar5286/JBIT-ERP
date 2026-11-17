import app from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { seedInitialDataIfEmpty } from './src/seed/seedData.js';
import { lastSentOtpForTesting } from './src/services/emailService.js';
import { Faculty } from './src/models/Faculty.js';
import http from 'http';

const runFacultyTests = async () => {
  console.log('🏛️ Starting End-to-End System Tests for Faculty Registration & Login...\n');

  await connectDB();
  await seedInitialDataIfEmpty();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const BASE_URL = `http://127.0.0.1:${port}/api`;
  console.log(`📍 Test server running on ${BASE_URL}\n`);

  const assert = (condition, message) => {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      server.close();
      process.exit(1);
    }
    console.log(`✅ PASSED: ${message}`);
  };

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert(health.success === true, 'Health check returns success');

    // 2. Faculty Registration - Missing fields validation
    const missingRes = await fetch(`${BASE_URL}/auth/faculty/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Prof Sharma' })
    });
    const missingData = await missingRes.json();
    assert(missingRes.status === 400, 'Missing fields rejected with 400 Bad Request');

    // 3. Faculty Registration - Invalid email format
    const invalidEmailRes = await fetch(`${BASE_URL}/auth/faculty/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Alok Verma',
        parentName: 'R. K. Verma',
        employeeId: 'JBIT-FAC-999',
        email: 'invalid-email-address',
        mobile: '9876543210',
        department: 'Computer Science & Engineering',
        password: 'Password@123',
        confirmPassword: 'Password@123'
      })
    });
    assert(invalidEmailRes.status === 400, 'Invalid email format rejected with 400 Bad Request');

    // 4. Faculty Registration - Password mismatch
    const mismatchRes = await fetch(`${BASE_URL}/auth/faculty/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Alok Verma',
        parentName: 'R. K. Verma',
        employeeId: 'JBIT-FAC-999',
        email: 'alok.verma@gmail.com',
        mobile: '9876543210',
        department: 'Computer Science & Engineering',
        password: 'Password@123',
        confirmPassword: 'DifferentPassword'
      })
    });
    assert(mismatchRes.status === 400, 'Password mismatch rejected with 400 Bad Request');

    // 5. Valid Faculty Registration - Dispatch OTP
    const timeSeed = Date.now();
    const facultyEmail = `faculty_${timeSeed}@gmail.com`;
    const facultyEmpId = `JBIT-FAC-${timeSeed.toString().slice(-4)}`;

    const regRes = await fetch(`${BASE_URL}/auth/faculty/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Rajesh Sharma',
        parentName: 'Om Prakash Sharma',
        employeeId: facultyEmpId,
        email: facultyEmail,
        mobile: '9876543210',
        dateOfBirth: '1985-05-15',
        gender: 'Male',
        department: 'Computer Science & Engineering',
        designation: 'Associate Professor',
        course: 'B.Tech',
        branch: 'Computer Science & Engineering',
        qualification: 'Ph.D. in Computer Science',
        joiningDate: '2020-07-01',
        address: '23 Milestone Chakrata Road, Dehradun',
        password: 'FacultySecret@123',
        confirmPassword: 'FacultySecret@123'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 200 && regData.success, 'Faculty registration initiated and OTP dispatched');

    // Verify OTP was recorded internally
    const sentOtp = lastSentOtpForTesting[facultyEmail] || lastSentOtpForTesting.otp;
    assert(sentOtp && sentOtp.length === 6, 'A 6-digit verification OTP was generated for faculty email');

    // 6. Resend Cooldown verification
    const immediateResend = await fetch(`${BASE_URL}/auth/faculty/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: facultyEmail })
    });
    assert(immediateResend.status === 429, 'Immediate OTP resend blocked by 60s cooldown (429 Too Many Requests)');

    // 7. Invalid OTP verification test
    const wrongOtpRes = await fetch(`${BASE_URL}/auth/faculty/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: facultyEmail, otp: '000000' })
    });
    assert(wrongOtpRes.status === 400, 'Invalid OTP strictly rejected with 400 Bad Request');

    // 8. Successful OTP Verification -> Account Activation
    const verifyRes = await fetch(`${BASE_URL}/auth/faculty/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: facultyEmail, otp: sentOtp })
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 201 && verifyData.success, 'OTP verification succeeded and Faculty account activated');
    assert(verifyData.data?.token && verifyData.data?.role === 'FACULTY', 'Received authenticated JWT token with role FACULTY');
    const facultyToken = verifyData.data.token;
    const facultyId = verifyData.data.user._id;

    // Verify DB record status and verification
    const createdFaculty = await Faculty.findById(facultyId);
    assert(
      createdFaculty.emailVerified === true && createdFaculty.status === 'active',
      'Faculty account in DB has emailVerified: true and status: active'
    );

    // 9. Faculty Login with Email
    const loginEmailRes = await fetch(`${BASE_URL}/auth/faculty/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: facultyEmail, password: 'FacultySecret@123' })
    });
    const loginEmailData = await loginEmailRes.json();
    assert(loginEmailRes.status === 200 && loginEmailData.data?.token, 'Faculty login with registered Email succeeded');

    // 10. Faculty Login with Employee ID
    const loginEmpRes = await fetch(`${BASE_URL}/auth/faculty/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: facultyEmpId, password: 'FacultySecret@123' })
    });
    const loginEmpData = await loginEmpRes.json();
    assert(loginEmpRes.status === 200 && loginEmpData.data?.token, 'Faculty login with Employee ID succeeded');

    // 11. Faculty Dashboard Endpoint
    const dashRes = await fetch(`${BASE_URL}/faculty/dashboard`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200 && dashData.data?.faculty, 'Faculty Dashboard loaded with profile and metrics');

    // 12. Faculty Profile & Photo update
    const samplePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const updateProfileRes = await fetch(`${BASE_URL}/faculty/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`
      },
      body: JSON.stringify({
        mobile: '9899887766',
        profilePhoto: samplePhoto
      })
    });
    const updateProfileData = await updateProfileRes.json();
    assert(
      updateProfileRes.status === 200 && updateProfileData.data?.profilePhoto === samplePhoto,
      'Faculty profile photo and mobile updated and persisted'
    );

    // 13. Forgot Password Flow for Faculty
    const forgotReqRes = await fetch(`${BASE_URL}/auth/forgot-password/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: facultyEmail, role: 'FACULTY' })
    });
    assert(forgotReqRes.status === 200, 'Faculty forgot password request OTP succeeded');
    const resetOtp = lastSentOtpForTesting[facultyEmail] || lastSentOtpForTesting.otp;

    const resetRes = await fetch(`${BASE_URL}/auth/forgot-password/verify-and-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: facultyEmail,
        otp: resetOtp,
        newPassword: 'NewFacultyPassword@456',
        role: 'FACULTY'
      })
    });
    assert(resetRes.status === 200, 'Faculty password reset with OTP succeeded');

    // Login with new password
    const newLoginRes = await fetch(`${BASE_URL}/auth/faculty/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: facultyEmail, password: 'NewFacultyPassword@456' })
    });
    assert(newLoginRes.status === 200, 'Faculty successfully authenticated using newly reset password');

    // 14. Admin Faculty Management
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jbinstitute.erp@gmail.com', password: 'jbit@123' })
    });
    const adminAuth = await adminLoginRes.json();
    const adminToken = adminAuth.data.token;

    // Get faculty list
    const adminFacListRes = await fetch(`${BASE_URL}/admin/faculty?search=${facultyEmpId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminFacList = await adminFacListRes.json();
    assert(
      adminFacList.success && adminFacList.data?.length > 0,
      'Admin successfully queried and found newly registered Faculty in directory'
    );

    // Admin assign classes and subjects to Faculty
    const assignRes = await fetch(`${BASE_URL}/admin/faculty/${facultyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        subjects: ['Artificial Intelligence', 'Machine Learning'],
        assignedClasses: [
          {
            course: 'B.Tech Computer Science & Engineering',
            branch: 'CSE',
            semester: '6',
            section: 'A',
            subject: 'Artificial Intelligence'
          }
        ]
      })
    });
    const assignData = await assignRes.json();
    assert(
      assignRes.status === 200 && assignData.data?.assignedClasses?.length === 1,
      'Admin assigned subjects and classes to Faculty successfully'
    );

    // 15. Admin Toggle Faculty Deactivate / Reactivate
    const toggleRes = await fetch(`${BASE_URL}/admin/faculty/${facultyId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const toggleData = await toggleRes.json();
    assert(toggleRes.status === 200 && toggleData.data?.status === 'deactivated', 'Admin deactivated Faculty account');

    // Attempt login while deactivated -> must fail with 403
    const deactLoginRes = await fetch(`${BASE_URL}/auth/faculty/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: facultyEmail, password: 'NewFacultyPassword@456' })
    });
    assert(deactLoginRes.status === 403, 'Deactivated Faculty account login strictly rejected with 403 Forbidden');

    // Admin Reactivate Faculty
    const reactivateRes = await fetch(`${BASE_URL}/admin/faculty/${facultyId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(reactivateRes.status === 200, 'Admin reactivated Faculty account');

    // 16. Security Authorization Check: Faculty cannot access Admin APIs
    const unauthorizedRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    assert(unauthorizedRes.status === 403, 'Faculty attempting to access Admin endpoint strictly blocked with 403 Forbidden');

    console.log('\n======================================================');
    console.log('🎉 ALL BACKEND FACULTY TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test execution exception:', err);
    server.close();
    process.exit(1);
  } finally {
    server.close();
    await disconnectDB();
  }
};

runFacultyTests();
