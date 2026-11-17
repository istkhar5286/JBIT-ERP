import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedInitialDataIfEmpty } from './src/seed/seedData.js';
import { lastSentOtpForTesting } from './src/services/emailService.js';
import { Student } from './src/models/Student.js';
import { Fee } from './src/models/Fee.js';
import http from 'http';

// Minimal 1x1 valid JPEG
const SAMPLE_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

// Minimal 1x1 valid PNG (red pixel)
const SAMPLE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const runTests = async () => {
  console.log('🏛️ Running Automated Admit Card Profile Photo Integration Tests...\n');

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
    // 1. Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jbinstitute.erp@gmail.com', password: 'jbit@123' })
    });
    const adminAuth = await adminLoginRes.json();
    assert(adminAuth.success && adminAuth.data?.token, 'Admin login succeeded');
    const adminToken = adminAuth.data.token;

    // 2. Student Registration & OTP Verification
    const studentRoll = `JBIT_PHOTO_${Date.now()}`;
    const studentEmail = `student_photo_${Date.now()}@gmail.com`;

    const regRes = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Aryan Sharma',
        fatherName: 'Ramesh Sharma',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: studentEmail,
        universityRollNumber: studentRoll,
        collegeRegistrationNumber: `REG_${studentRoll}`,
        course: 'B.Tech Computer Science & Engineering',
        semester: '1',
        academicYear: '2024-2025',
        password: 'Password@123',
        confirmPassword: 'Password@123'
      })
    });
    const regData = await regRes.json();
    assert(regData.success, 'Student registration initiated');

    const otp = lastSentOtpForTesting.otp;
    assert(otp, `Captured registration OTP: ${otp}`);

    const verifyRes = await fetch(`${BASE_URL}/auth/student/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, otp })
    });
    const verifyData = await verifyRes.json();
    assert(verifyData.success && verifyData.data?.token, 'Registration verified successfully with JWT token');
    const studentToken = verifyData.data.token;
    const studentId = verifyData.data.user._id;

    // 3. Clear Fees so Admit Card is unlocked
    const feesDashRes = await fetch(`${BASE_URL}/student/fees`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const feesDash = await feesDashRes.json();
    const currentPending = feesDash.data.summary.pendingAmount;

    const createPayRes = await fetch(`${BASE_URL}/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ amount: currentPending, paymentMethod: 'UPI' })
    });
    const createPay = await createPayRes.json();

    const verifyPayRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        paymentId: createPay.data.paymentId,
        status: 'SUCCESS',
        paymentMethod: 'UPI',
        gatewayResponse: { reference: 'UPI_SUCCESS_AUTH' }
      })
    });
    const verifyPay = await verifyPayRes.json();
    assert(verifyPay.data.updatedFees.remainingDue === 0 && verifyPay.data.updatedFees.status === 'CLEAR', 'Fees cleared via payment');

    const eligRes = await fetch(`${BASE_URL}/student/documents/eligibility`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const eligData = await eligRes.json();
    assert(eligData.data.canDownloadAdmitCard === true, 'Student fees cleared: Admit Card is UNLOCKED');

    // TEST 1: Download Admit Card without profile photo (Placeholder fallback)
    console.log('\n--- Test 1: Admit Card without photo (Placeholder) ---');
    const resNoPhoto = await fetch(`${BASE_URL}/student/documents/admit-card`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resNoPhoto.status === 200, 'HTTP 200 on Admit Card download without photo');
    const bufNoPhoto = Buffer.from(await resNoPhoto.arrayBuffer());
    assert(bufNoPhoto.length > 1000, `PDF generated cleanly with placeholder (Size: ${bufNoPhoto.length} bytes)`);
    assert(bufNoPhoto.indexOf('%PDF-') === 0, 'Valid PDF header');

    // TEST 2: Upload JPEG profile photo & Download Admit Card
    console.log('\n--- Test 2: Upload JPEG photo and embed in Admit Card ---');
    const jpegDataUrl = `data:image/jpeg;base64,${SAMPLE_JPEG_BASE64}`;
    const updateJpegRes = await fetch(`${BASE_URL}/student/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        fullName: 'Aryan Sharma',
        fatherName: 'Ramesh Sharma',
        profilePhoto: jpegDataUrl
      })
    });
    const updateJpegData = await updateJpegRes.json();
    assert(updateJpegData.success && updateJpegData.data.profilePhoto === jpegDataUrl, 'Student profile photo saved with JPEG data URL');

    const resJpeg = await fetch(`${BASE_URL}/student/documents/admit-card`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resJpeg.status === 200, 'HTTP 200 on Admit Card download with JPEG photo');
    assert(resJpeg.headers.get('content-type')?.includes('application/pdf'), 'Content-Type is application/pdf');
    assert(resJpeg.headers.get('cache-control')?.includes('no-cache'), 'Cache-Control header prevents stale caching');
    const bufJpeg = Buffer.from(await resJpeg.arrayBuffer());
    assert(bufJpeg.length > 1000, `PDF with JPEG photo generated (Size: ${bufJpeg.length} bytes)`);

    // Verify JPEG image data is actually embedded in the PDF
    const pdfJpegText = bufJpeg.toString('binary');
    const hasImageSubtype = pdfJpegText.includes('/Subtype /Image') || pdfJpegText.includes('/Subtype/Image');
    assert(hasImageSubtype, 'PDF contains embedded image (/Subtype /Image XObject)');

    // TEST 3: Upload PNG profile photo & Download Admit Card
    console.log('\n--- Test 3: Upload PNG photo and embed in Admit Card ---');
    const pngDataUrl = `data:image/png;base64,${SAMPLE_PNG_BASE64}`;
    const updatePngRes = await fetch(`${BASE_URL}/student/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        fullName: 'Aryan Sharma',
        fatherName: 'Ramesh Sharma',
        profilePhoto: pngDataUrl
      })
    });
    const updatePngData = await updatePngRes.json();
    assert(updatePngData.success && updatePngData.data.profilePhoto === pngDataUrl, 'Student profile photo updated with PNG data URL');

    const resPng = await fetch(`${BASE_URL}/student/documents/admit-card`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resPng.status === 200, 'HTTP 200 on Admit Card download with PNG photo');
    const bufPng = Buffer.from(await resPng.arrayBuffer());
    assert(bufPng.length > 1000, `PDF with PNG photo generated (Size: ${bufPng.length} bytes)`);
    const pdfPngText = bufPng.toString('binary');
    assert(pdfPngText.includes('/Subtype /Image') || pdfPngText.includes('/Subtype/Image'), 'PDF contains embedded PNG image XObject');

    // TEST 4: Page refresh simulation (fetch /auth/me and verify photo persistence)
    console.log('\n--- Test 4: Verify persistence after simulated refresh ---');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const meData = await meRes.json();
    assert(meData.data.user.profilePhoto === pngDataUrl, 'Current user /auth/me returns latest uploaded profile photo');

    // TEST 5: Admin downloading the student's admit card with photo
    console.log('\n--- Test 5: Admin downloading student Admit Card with embedded photo ---');
    const adminAdmitRes = await fetch(`${BASE_URL}/admin/students/${studentId}/documents/admit-card`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminAdmitRes.status === 200, 'Admin can download student Admit Card');
    const adminAdmitBuf = Buffer.from(await adminAdmitRes.arrayBuffer());
    assert(adminAdmitBuf.length > 1000, `Admin downloaded Admit Card containing student photo (Size: ${adminAdmitBuf.length} bytes)`);

    // TEST 6: Reset photo to empty string and verify graceful placeholder
    console.log('\n--- Test 6: Reset photo to empty string ---');
    await fetch(`${BASE_URL}/student/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        fullName: 'Aryan Sharma',
        fatherName: 'Ramesh Sharma',
        profilePhoto: ''
      })
    });
    const resReset = await fetch(`${BASE_URL}/student/documents/admit-card`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resReset.status === 200, 'Admit card downloads successfully when photo is reset to empty');

    console.log('\n🎉 ALL ADMIT CARD PROFILE PHOTO INTEGRATION TESTS PASSED!\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test error:', err);
    server.close();
    process.exit(1);
  }
};

runTests();
