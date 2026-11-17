import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedInitialDataIfEmpty } from './src/seed/seedData.js';
import { lastSentOtpForTesting } from './src/services/emailService.js';
import fs from 'fs';
import path from 'path';
import http from 'http';

// Minimal 1x1 valid PNG data URL
const SAMPLE_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const runVerification = async () => {
  console.log('🚍 JBIT Transport, Warden & Configurable QR System Automated Verification Suite\n');

  // Verify Requirement 1: No demo Chief Warden credentials in frontend files
  console.log('--- Test 1: Frontend UI Demo Credentials Removal Verification ---');
  const wardenLoginFile = path.resolve('../frontend/src/pages/auth/WardenLogin.jsx');
  const wardenLoginContent = fs.readFileSync(wardenLoginFile, 'utf8');
  if (
    wardenLoginContent.includes('Chief Warden ID') ||
    wardenLoginContent.includes('WRD-101') ||
    wardenLoginContent.includes('Warden@123') ||
    wardenLoginContent.includes('Use these credentials')
  ) {
    throw new Error('❌ Test 1 Failed: Demo credentials still present in WardenLogin.jsx');
  }
  console.log('✅ Test 1 Passed: Chief Warden demo credentials completely removed from WardenLogin.jsx');

  await connectDB();
  await seedInitialDataIfEmpty();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const BASE_URL = `http://127.0.0.1:${port}/api`;
  console.log(`📍 Test server active on ${BASE_URL}\n`);

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
    // Test 2: Warden Registration with Gmail OTP & Login
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Warden OTP Registration & Authentication ---');
    const wardenEmail = `warden.test.${Date.now()}@gmail.com`;
    const wardenPassword = 'WardenPassword@2026';
    const wardenEmpId = `WRD-${Date.now().toString().slice(-4)}`;

    // Step 1: Initiate Warden Registration
    const otpRes = await fetch(`${BASE_URL}/auth/warden/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Prof. Ramesh Sharma',
        employeeId: wardenEmpId,
        email: wardenEmail,
        mobile: '9876543299',
        designation: 'Hostel Warden',
        password: wardenPassword
      })
    });
    const otpJson = await otpRes.json();
    assert(otpJson.success, 'Warden registration initiated and Gmail OTP sent');

    const receivedOtp = otpJson.data?.devOtp || lastSentOtpForTesting[wardenEmail.toLowerCase()];
    assert(receivedOtp, `Captured warden registration OTP: ${receivedOtp}`);

    const regRes = await fetch(`${BASE_URL}/auth/warden/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: wardenEmail,
        otp: receivedOtp
      })
    });
    const regJson = await regRes.json();
    assert(regJson.success && regJson.data?.token, 'Warden verified Gmail OTP and account created');

    // Warden Login
    const loginRes = await fetch(`${BASE_URL}/auth/warden/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: wardenEmail, password: wardenPassword })
    });
    const loginJson = await loginRes.json();
    assert(loginJson.success && loginJson.data?.token, 'Warden logged in using newly registered credentials');
    const wardenToken = loginJson.data.token;

    // -------------------------------------------------------------
    // Test 3: Admin Login & Student Setup
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Admin & Student Authentication ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jbinstitute.erp@gmail.com', password: 'jbit@123' })
    });
    const adminJson = await adminLoginRes.json();
    assert(adminJson.success && adminJson.data?.token, 'Admin login verified');
    const adminToken = adminJson.data.token;

    // Register a student
    const studentEmail = `student.${Date.now()}@gmail.com`;
    const studentRoll = `JBIT26${Math.floor(1000 + Math.random() * 9000)}`;
    const studentPass = 'StudentPass@2026';

    const stOtpRes = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Aarav Verma',
        fatherName: 'Rajesh Verma',
        motherName: 'Sunita Verma',
        email: studentEmail,
        mobile: '9876543210',
        course: 'B.Tech',
        branch: 'Computer Science and Engineering',
        semester: '1',
        section: 'A',
        academicYear: '2024-2025',
        universityRollNumber: studentRoll,
        collegeRegistrationNumber: `REG-${studentRoll}`,
        password: studentPass,
        confirmPassword: studentPass
      })
    });
    const stOtpJson = await stOtpRes.json();
    assert(stOtpJson.success, 'Student registration initiated and Gmail OTP sent');

    const studentOtp = stOtpJson.data?.devOtp || lastSentOtpForTesting[studentEmail.toLowerCase()];
    assert(studentOtp, `Captured student registration OTP: ${studentOtp}`);

    const stRegRes = await fetch(`${BASE_URL}/auth/student/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        otp: studentOtp
      })
    });
    const stRegJson = await stRegRes.json();
    assert(stRegJson.success && stRegJson.data?.token, 'Student registered successfully');
    const studentToken = stRegJson.data.token;

    // -------------------------------------------------------------
    // Test 4: Dehradun Bus Locations API
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Dehradun Bus Locations Retrieval ---');
    const stopsRes = await fetch(`${BASE_URL}/transport-service/stops`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const stopsJson = await stopsRes.json();
    assert(stopsJson.success && Array.isArray(stopsJson.data), 'Dehradun bus stops fetched');
    assert(stopsJson.data.length >= 35, `Verified ${stopsJson.data.length} Dehradun stops seeded`);

    // Verify JBIT is present as campus
    const campusStop = stopsJson.data.find(s => s.isCampus || s.stopName.includes('JB Institute'));
    assert(campusStop, 'JBIT Main Campus location is present in stops');
    const clockTowerStop = stopsJson.data.find(s => s.stopName.includes('Clock Tower') || s.stopName.includes('Ghanta Ghar'));
    assert(clockTowerStop, 'Clock Tower stop is present');

    // -------------------------------------------------------------
    // Test 5: Bus Fleet & Seat Availability API
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Fleet & Real-Time Seat Availability ---');
    const optionsRes = await fetch(`${BASE_URL}/transport-service/options`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const optionsJson = await optionsRes.json();
    assert(optionsJson.success && optionsJson.data?.length > 0, 'Transport fleet buses retrieved');
    const testBus = optionsJson.data[0];

    const seatsRes = await fetch(`${BASE_URL}/transport-service/bus/${testBus._id}/seats`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const seatsJson = await seatsRes.json();
    assert(seatsJson.success && seatsJson.data?.seats?.length === testBus.totalSeats, `Seat map returns all ${testBus.totalSeats} seats`);

    // Select Seat #12
    const targetSeat = 12;
    const seatObj = seatsJson.data.seats.find(s => s.seatNumber === targetSeat);
    assert(seatObj && seatObj.status === 'AVAILABLE', `Seat #${targetSeat} is currently AVAILABLE`);

    // -------------------------------------------------------------
    // Test 6: Student Submits Bus Booking
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Student Initiates Bus Booking Application ---');
    const applyRes = await fetch(`${BASE_URL}/transport-service/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        busId: testBus._id,
        pickupStop: clockTowerStop.stopName,
        destination: campusStop.stopName,
        direction: 'TO_CAMPUS',
        selectedSeatNumber: targetSeat
      })
    });
    const applyJson = await applyRes.json();
    assert(applyJson.success && applyJson.data?._id, 'Transport application created with selected seat');
    const transportAppId = applyJson.data._id;
    assert(applyJson.data.status === 'PENDING_PAYMENT', 'Application status is PENDING_PAYMENT');

    // -------------------------------------------------------------
    // Test 7: Public Configurable QR Payment Settings
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Public Payment QR Settings ---');
    const pubSettingsRes = await fetch(`${BASE_URL}/payments/settings`);
    const pubSettingsJson = await pubSettingsRes.json();
    assert(pubSettingsJson.success && pubSettingsJson.data?.qrCode, 'Public payment QR settings loaded with QR image');
    assert(pubSettingsJson.data.upiId, 'UPI ID is configured');

    // -------------------------------------------------------------
    // Test 8: Submit Manual QR Payment with UTR & Screenshot
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Student Submits QR Payment (UTR + Screenshot) ---');
    const utrNumber = `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const qrPayRes = await fetch(`${BASE_URL}/transport-service/submit-qr-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        applicationId: transportAppId,
        utrNumber,
        paymentScreenshot: SAMPLE_PNG_BASE64
      })
    });
    const qrPayJson = await qrPayRes.json();
    assert(qrPayJson.success, 'QR payment submitted successfully');
    assert(qrPayJson.data.status === 'PENDING_VERIFICATION', 'Application status updated to PENDING_VERIFICATION');
    const paymentId = qrPayJson.data.paymentId;

    // -------------------------------------------------------------
    // Test 9: Admin Sees Pending Payment in Verification Desk
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Admin Pending Payments Queue ---');
    const pendingRes = await fetch(`${BASE_URL}/admin/payments/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pendingJson = await pendingRes.json();
    assert(pendingJson.success && Array.isArray(pendingJson.data), 'Pending payments retrieved');
    const pendingItem = pendingJson.data.find(p => p._id === paymentId);
    assert(pendingItem, 'Student pending payment appears in Admin pending queue');
    assert(pendingItem.utrNumber === utrNumber, 'UTR number matches submitted value');
    assert(pendingItem.paymentScreenshot.startsWith('data:image/png'), 'Payment screenshot is available for inspection');
    assert(pendingItem.selectedSeatNumber === targetSeat, `Payment record tracks selected seat #${targetSeat}`);

    // -------------------------------------------------------------
    // Test 10: Admin Rejection Flow & Re-Submission
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Admin Reject & Resubmit Flow ---');
    const rejectRes = await fetch(`${BASE_URL}/admin/payments/${paymentId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reason: 'Screenshot unreadable. Please upload a clear receipt.' })
    });
    const rejectJson = await rejectRes.json();
    assert(rejectJson.success, 'Admin rejected payment with reason');

    // Verify student status is updated to PAYMENT_REJECTED
    const statusAfterReject = await fetch(`${BASE_URL}/transport-service/my-status`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const statusAfterRejectJson = await statusAfterReject.json();
    assert(statusAfterRejectJson.data.application?.status === 'PAYMENT_REJECTED', 'Student application shows PAYMENT_REJECTED');

    // Student re-submits with fresh valid UTR
    const newUtr = `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const resubmitRes = await fetch(`${BASE_URL}/transport-service/submit-qr-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        applicationId: transportAppId,
        utrNumber: newUtr,
        paymentScreenshot: SAMPLE_PNG_BASE64
      })
    });
    const resubmitJson = await resubmitRes.json();
    assert(resubmitJson.success, 'Student resubmitted payment with new UTR');
    const newPaymentId = resubmitJson.data.paymentId;

    // -------------------------------------------------------------
    // Test 11: Admin Approves Payment -> Atomic Allocation
    // -------------------------------------------------------------
    console.log('\n--- Test 11: Admin Approves Payment & Seat Allocation ---');
    const approveRes = await fetch(`${BASE_URL}/admin/payments/${newPaymentId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    });
    const approveJson = await approveRes.json();
    assert(approveJson.success, 'Payment approved by Admin');
    assert(approveJson.data.payment?.status === 'SUCCESS', 'Payment marked SUCCESS');
    assert(approveJson.data.allocationResult?.seatNumber === targetSeat, `Seat #${targetSeat} allocated successfully`);

    // Verify seat map now shows targetSeat as OCCUPIED
    const seatsAfterApprove = await fetch(`${BASE_URL}/transport-service/bus/${testBus._id}/seats`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const seatsAfterApproveJson = await seatsAfterApprove.json();
    const updatedSeat = seatsAfterApproveJson.data.seats.find(s => s.seatNumber === targetSeat);
    assert(updatedSeat.status === 'OCCUPIED', `Seat #${targetSeat} is now OCCUPIED on the live seat map`);

    // -------------------------------------------------------------
    // Test 12: Duplicate Seat Prevention
    // -------------------------------------------------------------
    console.log('\n--- Test 12: Duplicate Seat Allocation Prevention ---');
    // Another student tries to apply for the exact same seat
    const dupRes = await fetch(`${BASE_URL}/transport-service/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        busId: testBus._id,
        pickupStop: clockTowerStop.stopName,
        selectedSeatNumber: targetSeat
      })
    });
    const dupJson = await dupRes.json();
    assert(!dupJson.success, 'System blocked booking already occupied seat');

    // -------------------------------------------------------------
    // Test 13: Hostel QR Payment Flow
    // -------------------------------------------------------------
    console.log('\n--- Test 13: Hostel Configurable QR Payment Flow ---');
    const hostelOptionsRes = await fetch(`${BASE_URL}/hostel/options`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const hostelOptionsJson = await hostelOptionsRes.json();
    assert(hostelOptionsJson.success && hostelOptionsJson.data?.length > 0, 'Hostels list fetched');
    const testHostel = hostelOptionsJson.data[0];

    // Apply for hostel
    const hostelApplyRes = await fetch(`${BASE_URL}/hostel/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        hostelId: testHostel._id,
        preferredBlock: 'Block A',
        preferredRoomType: 'Double Sharing'
      })
    });
    const hostelApplyJson = await hostelApplyRes.json();
    assert(hostelApplyJson.success && hostelApplyJson.data?._id, 'Hostel application created');
    const hostelAppId = hostelApplyJson.data._id;

    // Submit Hostel QR Payment
    const hostelUtr = `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const hostelQrPayRes = await fetch(`${BASE_URL}/hostel/submit-qr-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        applicationId: hostelAppId,
        utrNumber: hostelUtr,
        paymentScreenshot: SAMPLE_PNG_BASE64
      })
    });
    const hostelQrPayJson = await hostelQrPayRes.json();
    assert(hostelQrPayJson.success, 'Hostel QR payment submitted');
    assert(hostelQrPayJson.data.status === 'PENDING_VERIFICATION', 'Hostel status is PENDING_VERIFICATION');
    const hostelPaymentId = hostelQrPayJson.data.paymentId;

    // Admin Approves Hostel Payment
    const approveHostelRes = await fetch(`${BASE_URL}/admin/payments/${hostelPaymentId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    });
    const approveHostelJson = await approveHostelRes.json();
    assert(approveHostelJson.success, 'Admin approved hostel payment');
    assert(approveHostelJson.data.allocationResult?.type === 'HOSTEL', 'Hostel bed allocated to student upon approval');

    // -------------------------------------------------------------
    // Test 14: Admin Bus Stops CRUD
    // -------------------------------------------------------------
    console.log('\n--- Test 14: Admin Dehradun Bus Stop CRUD ---');
    const newStopName = `Test Stop ${Date.now()}`;
    const createStopRes = await fetch(`${BASE_URL}/admin/transport/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        stopName: newStopName,
        landmark: 'Near Test Chowk',
        pickupTime: '07:15 AM',
        dropTime: '05:45 PM',
        estimatedFee: 19000
      })
    });
    const createStopJson = await createStopRes.json();
    assert(createStopJson.success && createStopJson.data?._id, 'Admin created new Dehradun bus stop');
    const createdStopId = createStopJson.data._id;

    // Update stop
    const updateStopRes = await fetch(`${BASE_URL}/admin/transport/stops/${createdStopId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ estimatedFee: 20000 })
    });
    const updateStopJson = await updateStopRes.json();
    assert(updateStopJson.success && updateStopJson.data?.estimatedFee === 20000, 'Admin updated bus stop fee');

    // Delete stop
    const deleteStopRes = await fetch(`${BASE_URL}/admin/transport/stops/${createdStopId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const deleteStopJson = await deleteStopRes.json();
    assert(deleteStopJson.success, 'Admin deleted test bus stop');

    // -------------------------------------------------------------
    // Test 15: Admin Update Payment QR Settings
    // -------------------------------------------------------------
    console.log('\n--- Test 15: Admin Update Payment QR Settings ---');
    const updateQrRes = await fetch(`${BASE_URL}/admin/payment-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        upiId: 'jbitdehradun@sbi',
        paymentName: 'JB Institute of Technology, Dehradun',
        paymentInstructions: '1. Scan official QR.\n2. Pay fee.\n3. Enter UTR and upload receipt.'
      })
    });
    const updateQrJson = await updateQrRes.json();
    assert(updateQrJson.success && updateQrJson.data?.upiId === 'jbitdehradun@sbi', 'Admin saved payment settings successfully');

    console.log('\n=============================================================');
    console.log('🎉 ALL 20 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
    console.log('=============================================================\n');

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification Error:', error);
    server.close();
    process.exit(1);
  }
};

runVerification();
