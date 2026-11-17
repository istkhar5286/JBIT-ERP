import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GraduationCap, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Mail, KeyRound, Clock, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { BRANDING } from '../../config/branding';

export const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const paramRole = (searchParams.get('role') || 'STUDENT').toUpperCase();
  const initialRole = ['STUDENT', 'FACULTY', 'ADMIN'].includes(paramRole) ? paramRole : 'STUDENT';

  // Step 1 = Request Reset Code, Step 2 = Enter Code & Set New Password, Step 3 = Success
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(600);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Cooldown countdown timer
  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  // Expiry countdown timer during step 2
  useEffect(() => {
    let timer = null;
    if (step === 2 && expirySeconds > 0) {
      timer = setInterval(() => {
        setExpirySeconds((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, expirySeconds]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/request-otp', {
        email: email.trim().toLowerCase(),
        role
      });

      if (res.data?.success) {
        setStep(2);
        setCooldown(60);
        setExpirySeconds(600);
        setMessage(res.data.message || 'If an account exists with this email, a reset code was sent.');
      }
    } catch (err) {
      console.error('Request OTP error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit reset code sent to your email.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/verify-and-reset', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
        role
      });

      if (res.data?.success) {
        setStep(3);
        setMessage(res.data.message || 'Password has been reset successfully!');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setError('');
    setMessage('');
    setResending(true);

    try {
      const res = await api.post('/auth/forgot-password/resend-otp', {
        email: email.trim().toLowerCase(),
        role
      });

      if (res.data?.success) {
        setCooldown(60);
        setExpirySeconds(600);
        setMessage('If an account exists with this email, a new code has been sent.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend reset code.');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center overflow-hidden">
      {/* Campus Background with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transform scale-105"
        style={{ backgroundImage: "url('/assets/campus-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/90 backdrop-blur-[3px] z-0" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <img 
              src={BRANDING.LOGO} 
              alt={BRANDING.LOGO_ALT} 
              className="h-16 w-16 object-contain drop-shadow-xl ring-2 ring-amber-400/30 rounded-full p-0.5 bg-slate-950/60"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            JB Institute of Technology
          </h1>
          <p className="text-xs font-semibold text-amber-400/90 tracking-wide uppercase mt-0.5">
            Password Recovery & Account Verification
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
          {message && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            /* STEP 1: Enter Registered Email */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Account Type
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty Member</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Registered Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'ADMIN' ? 'admin@college.edu' : role === 'FACULTY' ? 'faculty@jbit.edu.in' : 'student@gmail.com'}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  We will send a 6-digit verification code to your registered Gmail address.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Reset Code...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Send Password Reset OTP</span>
                  </>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            /* STEP 2: Enter OTP & Set New Password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-center text-xs text-slate-600">
                <p>
                  A reset code was dispatched to: <strong className="text-slate-900 font-mono">{email}</strong>
                </p>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-amber-700 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Expires in: <strong className="font-mono">{formatTime(expirySeconds)}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                  className="w-full text-center rounded-xl border-2 border-indigo-300 py-2.5 text-xl font-mono font-black tracking-widest text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Verify OTP & Save New Password</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="font-bold text-slate-500 hover:text-slate-700"
                  >
                    Change Email
                  </button>

                  <button
                    type="button"
                    disabled={cooldown > 0 || resending}
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 disabled:text-slate-400"
                  >
                    <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 3 && (
            /* STEP 3: Success Screen */
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">Password Updated Successfully!</h3>
              <p className="text-xs text-slate-600">
                Your account password has been securely updated. You can now proceed to login with your new credentials.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
                >
                  <span>Go to Login Page</span>
                </Link>
              </div>
            </div>
          )}

          {step !== 3 && (
            <div className="mt-6 text-center border-t pt-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
