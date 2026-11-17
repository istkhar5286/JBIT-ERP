import express from 'express';
import {
  registerStudent,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  registerFaculty,
  verifyFacultyRegistrationOtp,
  resendFacultyRegistrationOtp,
  registerWarden,
  verifyWardenRegistrationOtp,
  resendWardenRegistrationOtp,
  loginStudent,
  loginAdmin,
  loginFaculty,
  loginWarden,
  updateAdminProfile,
  updateWardenProfile,
  getMe,
  requestForgotPasswordOtp,
  verifyAndResetPassword,
  resendForgotPasswordOtp,
  forgotPassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, requireWarden } from '../middleware/role.js';

const router = express.Router();

// Student Registration with Gmail OTP
router.post('/student/register', registerStudent);
router.post('/student/verify-otp', verifyRegistrationOtp);
router.post('/student/register/verify-otp', verifyRegistrationOtp);
router.post('/student/resend-otp', resendRegistrationOtp);
router.post('/student/register/resend-otp', resendRegistrationOtp);

// Faculty Registration with Gmail OTP
router.post('/faculty/register', registerFaculty);
router.post('/faculty/verify-otp', verifyFacultyRegistrationOtp);
router.post('/faculty/register/verify-otp', verifyFacultyRegistrationOtp);
router.post('/faculty/resend-otp', resendFacultyRegistrationOtp);
router.post('/faculty/register/resend-otp', resendFacultyRegistrationOtp);

// Warden Registration with Gmail OTP
router.post('/warden/register', registerWarden);
router.post('/warden/verify-otp', verifyWardenRegistrationOtp);
router.post('/warden/register/verify-otp', verifyWardenRegistrationOtp);
router.post('/warden/resend-otp', resendWardenRegistrationOtp);
router.post('/warden/register/resend-otp', resendWardenRegistrationOtp);

// Logins
router.post('/student/login', loginStudent);
router.post('/admin/login', loginAdmin);
router.post('/faculty/login', loginFaculty);
router.post('/warden/login', loginWarden);
router.get('/me', authenticate, getMe);
router.put('/admin/profile', authenticate, requireAdmin, updateAdminProfile);
router.put('/warden/profile', authenticate, requireWarden, updateWardenProfile);

// Forgot Password with OTP
router.post('/forgot-password/request-otp', requestForgotPasswordOtp);
router.post('/forgot-password/verify-and-reset', verifyAndResetPassword);
router.post('/forgot-password/verify-reset', verifyAndResetPassword);
router.post('/forgot-password/reset', verifyAndResetPassword);
router.post('/forgot-password/resend-otp', resendForgotPasswordOtp);
router.post('/forgot-password', forgotPassword);

// Development testing helper (only active in development)
if (process.env.NODE_ENV !== 'production') {
  const { lastSentOtpForTesting } = await import('../services/emailService.js');
  router.get('/dev/last-otp', (req, res) => {
    import('../services/emailService.js').then(({ lastSentOtpForTesting }) => {
      res.json({ success: true, data: lastSentOtpForTesting });
    });
  });
}

export default router;
