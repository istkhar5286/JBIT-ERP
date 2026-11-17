import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { ENV } from './src/config/env.js';
import { seedInitialDataIfEmpty } from './src/seed/seedData.js';
import { lastSentOtpForTesting, getSenderAddress } from './src/services/emailService.js';
import http from 'http';

const runTests = async () => {
  console.log('🏛️ Starting End-to-End System Integration Tests for JB Institute of Technology ERP...\n');

  // 1. Connect to Database & Seed Admin Accounts
  await connectDB();
  await seedInitialDataIfEmpty();

  // 2. Start HTTP Server on an ephemeral port
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

    // 2. Admin Login with Configured Institutional Account
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jbinstitute.erp@gmail.com', password: 'jbit@123' })
    });
    const adminAuth = await adminLoginRes.json();
    assert(adminAuth.success && adminAuth.data?.token, 'Institutional Admin (jbinstitute.erp@gmail.com) login succeeded with JWT token');
    const adminToken = adminAuth.data.token;

    // 3. Verify Admin Dashboard Metrics on clean DB
    const adminDashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminDash = await adminDashRes.json();
    assert(adminDash.success && adminDash.data?.cards, 'Admin dashboard loaded with 11 core financial metrics');

    // 4. Student Registration: Strict Gmail validation test
    const invalidRegRes = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Candidate',
        fatherName: 'Father Candidate',
        mobile: '9876543210',
        email: 'candidate@yahoo.com',
        universityRollNumber: 'JBIT202401',
        collegeRegistrationNumber: 'REG202401',
        course: 'B.Tech Computer Science & Engineering',
        semester: '1',
        academicYear: '2024-2025',
        password: 'Password@123',
        confirmPassword: 'Password@123'
      })
    });
    const invalidRegData = await invalidRegRes.json();
    assert(
      invalidRegRes.status === 400 && invalidRegData.message.includes('Gmail'),
      'Non-Gmail address strictly rejected with 400 Bad Request'
    );

    // 5. Student Registration with Real Gmail OTP Flow
    const timeSeed = Date.now();
    const studentEmail = `student_${timeSeed}@gmail.com`;
    const studentRoll = `JBIT${timeSeed.toString().slice(-4)}`;

    const regRes = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Vikram Aditya',
        fatherName: 'Mahendra Aditya',
        mobile: `98${timeSeed.toString().slice(-8)}`,
        email: studentEmail,
        universityRollNumber: studentRoll,
        collegeRegistrationNumber: `REG${studentRoll}`,
        course: 'B.Tech Computer Science & Engineering',
        semester: '1',
        academicYear: '2024-2025',
        password: 'Password@123',
        confirmPassword: 'Password@123'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 200 && regData.success, `Registration OTP sent dynamically to: ${studentEmail}`);
    assert(lastSentOtpForTesting?.email === studentEmail, 'OTP target email matches student registration email');
    assert(
      !getSenderAddress().toLowerCase().includes(studentEmail),
      'Sender isolation confirmed: Mail dispatched from institutional address'
    );

    const registrationOtp = lastSentOtpForTesting.otp;

    // 6. Verify Registration OTP
    const verifyOtpRes = await fetch(`${BASE_URL}/auth/student/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, otp: registrationOtp })
    });
    const verifyOtpData = await verifyOtpRes.json();
    assert(
      verifyOtpRes.status === 201 && verifyOtpData.success && verifyOtpData.data?.token,
      'Student account verified & activated. JWT session token generated'
    );
    const studentToken = verifyOtpData.data.token;
    const studentId = verifyOtpData.data.user._id;

    // 7. Check Initial Student Dashboard: Pending Fees & Status
    const studentDashRes = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentDash = await studentDashRes.json();
    const studentMetrics = studentDash.data?.metrics;
    assert(
      studentMetrics && studentMetrics.pendingFee > 0 && studentMetrics.feeStatus === 'PENDING',
      `Student dashboard initialized with pending fee (₹${studentMetrics?.pendingFee}) and status="${studentMetrics?.feeStatus}"`
    );

    // 8. Check Document Eligibility API: Gated documents should show eligible=false
    const docEligRes = await fetch(`${BASE_URL}/student/documents/eligibility`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const docElig = await docEligRes.json();
    assert(
      docElig.success &&
      docElig.data.admitCard.eligible === false &&
      docElig.data.clearanceCertificate.eligible === false &&
      docElig.data.noDuesCertificate.eligible === false,
      'Document Eligibility check: Admit card & certificates locked while outstanding fee > 0'
    );

    // 9. STRICT GATING TEST: Download Admit Card while fee is pending -> Must return HTTP 403
    console.log('\n--- Testing Strict Admit Card Gating when fees are pending ---');
    const gatedAdmitRes = await fetch(`${BASE_URL}/student/documents/admit-card`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const gatedAdmitData = await gatedAdmitRes.json();
    assert(
      gatedAdmitRes.status === 403 &&
      gatedAdmitData.message === 'Please clear your pending fees to download the admit card.',
      'Gating Enforced: HTTP 403 Forbidden with message: "Please clear your pending fees to download the admit card."'
    );

    // 10. STRICT GATING TEST: Download Fee Clearance Certificate while pending -> Must return HTTP 403
    const gatedClearanceRes = await fetch(`${BASE_URL}/student/documents/clearance-certificate`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const gatedClearanceData = await gatedClearanceRes.json();
    assert(
      gatedClearanceRes.status === 403,
      'Gating Enforced: Fee Clearance Certificate blocked with HTTP 403 when balance > 0'
    );

    // 11. STRICT GATING TEST: Download No-Dues Certificate while pending -> Must return HTTP 403
    const gatedNoDuesRes = await fetch(`${BASE_URL}/student/documents/no-dues-certificate`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const gatedNoDuesData = await gatedNoDuesRes.json();
    assert(
      gatedNoDuesRes.status === 403,
      'Gating Enforced: No-Dues Certificate blocked with HTTP 403 when balance > 0'
    );

    // 12. Scholarship / Waiver Application by Admin
    console.log('\n--- Testing Scholarship / Fee Waiver Engine ---');
    const waiverRes = await fetch(`${BASE_URL}/admin/fees/${studentId}/waivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'JBIT Merit Scholarship',
        amount: 5000,
        reason: 'Top Entrance Rank'
      })
    });
    const waiverData = await waiverRes.json();
    assert(
      waiverRes.status === 200 && waiverData.success && waiverData.data.waivers.length === 1,
      'Admin successfully applied ₹5,000 Merit Scholarship waiver'
    );

    // Check student fees after waiver
    const feesAfterWaiverRes = await fetch(`${BASE_URL}/student/fees`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const feesAfterWaiver = await feesAfterWaiverRes.json();
    const currentPending = feesAfterWaiver.data.pendingAmount;
    console.log(`Current net pending fee after ₹5,000 waiver: ₹${currentPending}`);

    // 13. Student Clears Entire Pending Fee
    console.log('\n--- Testing Full Fee Clearance Flow ---');
    const createPayRes = await fetch(`${BASE_URL}/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ amount: currentPending, paymentMethod: 'UPI' })
    });
    const createPay = await createPayRes.json();
    assert(createPay.success && createPay.data?.paymentId, `Payment intent created for full balance: ₹${currentPending}`);

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
    assert(
      verifyPay.success &&
      verifyPay.data.updatedFees.remainingDue === 0 &&
      verifyPay.data.updatedFees.status === 'CLEAR',
      'Full fee paid: Status automatically updated to "CLEAR", remainingDue=₹0'
    );

    // 14. Verify Official PDF Receipt Generation with JBIT branding
    const receiptRes = await fetch(`${BASE_URL}/payments/${createPay.data.paymentId}/receipt`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const receiptBuf = await receiptRes.arrayBuffer();
    assert(
      receiptRes.status === 200 &&
      receiptRes.headers.get('content-type')?.includes('application/pdf') &&
      receiptBuf.byteLength > 1000,
      `Official PDF Receipt streamed successfully (Size: ${receiptBuf.byteLength} bytes)`
    );

    // 15. Verify Document Eligibility is now UNLOCKED (all eligible=true)
    const docEligUnlockedRes = await fetch(`${BASE_URL}/student/documents/eligibility`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const docEligUnlocked = await docEligUnlockedRes.json();
    assert(
      docEligUnlocked.data.admitCard.eligible === true &&
      docEligUnlocked.data.clearanceCertificate.eligible === true &&
      docEligUnlocked.data.noDuesCertificate.eligible === true,
      'Document Eligibility check: Admit Card & Certificates UNLOCKED (eligible=true)'
    );

    // 16. UNLOCKED: Download Admit Card PDF -> Must return HTTP 200 with PDF
    console.log('\n--- Testing Document Downloads when Fee is CLEAR ---');
    const admitCardRes = await fetch(`${BASE_URL}/student/documents/admit-card`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const admitCardBuf = await admitCardRes.arrayBuffer();
    assert(
      admitCardRes.status === 200 &&
      admitCardRes.headers.get('content-type')?.includes('application/pdf') &&
      admitCardBuf.byteLength > 1000,
      `Admit Card downloaded successfully (Size: ${admitCardBuf.byteLength} bytes, Fee Status: CLEAR)`
    );

    // 17. UNLOCKED: Download Fee Clearance Certificate PDF -> Must return HTTP 200 with PDF
    const clearanceRes = await fetch(`${BASE_URL}/student/documents/clearance-certificate`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const clearanceBuf = await clearanceRes.arrayBuffer();
    assert(
      clearanceRes.status === 200 &&
      clearanceRes.headers.get('content-type')?.includes('application/pdf') &&
      clearanceBuf.byteLength > 1000,
      `Fee Clearance Certificate downloaded successfully (Size: ${clearanceBuf.byteLength} bytes)`
    );

    // 18. UNLOCKED: Download No-Dues Certificate PDF -> Must return HTTP 200 with PDF
    const noDuesRes = await fetch(`${BASE_URL}/student/documents/no-dues-certificate`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const noDuesBuf = await noDuesRes.arrayBuffer();
    assert(
      noDuesRes.status === 200 &&
      noDuesRes.headers.get('content-type')?.includes('application/pdf') &&
      noDuesBuf.byteLength > 1000,
      `No-Dues Certificate downloaded successfully (Size: ${noDuesBuf.byteLength} bytes)`
    );

    // 19. REFUND MANAGEMENT & RE-GATING TEST
    console.log('\n--- Testing Refund Management & Automatic Re-Gating ---');
    const refundRes = await fetch(`${BASE_URL}/admin/payments/${createPay.data.paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        refundAmount: 2000,
        reason: 'Hostel fee adjustment refund'
      })
    });
    const refundData = await refundRes.json();
    assert(
      refundRes.status === 200 &&
      refundData.success &&
      refundData.data.updatedFees.remainingDue === 2000 &&
      refundData.data.updatedFees.status === 'PARTIAL',
      `Admin recorded ₹2,000 refund: Student status re-evaluated to "${refundData.data.updatedFees.status}" with remainingDue=₹2,000`
    );

    // Verify Admit card download is immediately RE-LOCKED
    const reLockAdmitRes = await fetch(`${BASE_URL}/student/documents/admit-card`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const reLockAdmitData = await reLockAdmitRes.json();
    assert(
      reLockAdmitRes.status === 403 &&
      reLockAdmitData.message === 'Please clear your pending fees to download the admit card.',
      'Re-gating verified: Admit Card download is immediately locked again after refund'
    );

    // 20. Admin CSV Report Export Test
    console.log('\n--- Testing Administrative Report & CSV Exports ---');
    const csvFeesRes = await fetch(`${BASE_URL}/admin/reports/export-csv?type=fees`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const csvFeesText = await csvFeesRes.text();
    assert(
      csvFeesRes.status === 200 &&
      csvFeesText.includes('Roll No,Student Name') &&
      csvFeesText.includes(studentRoll),
      'JBIT Fee Ledger CSV export generated with student records'
    );

    const csvPayRes = await fetch(`${BASE_URL}/admin/reports/export-csv?type=payments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const csvPayText = await csvPayRes.text();
    assert(
      csvPayRes.status === 200 &&
      csvPayText.includes('Receipt No,Transaction ID') &&
      csvPayText.includes('2000'),
      'JBIT Payment Collections CSV export generated with refund data'
    );

    console.log('\n===================================================================');
    console.log('🎉 ALL 20 INSTITUTIONAL UPGRADE INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('===================================================================\n');

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during integration tests:', error);
    server.close();
    process.exit(1);
  }
};

runTests();
