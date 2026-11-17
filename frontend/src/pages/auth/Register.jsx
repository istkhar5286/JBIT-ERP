import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { GraduationCap, ArrowRight, Loader2, AlertCircle, CheckCircle2, Mail, Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { BRANDING } from '../../config/branding';
import { InstallAppButton } from '../../components/pwa/InstallAppButton';

export const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    mobile: '',
    email: '',
    universityRollNumber: '',
    collegeRegistrationNumber: '',
    course: 'B.Tech Computer Science & Engineering',
    semester: '1',
    academicYear: '2024-2025',
    password: '',
    confirmPassword: ''
  });

  // Step 1 = Form, Step 2 = OTP Verification
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(600); // 10 mins
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { setAuthSession } = useAuth();
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleInitiateRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Require valid Gmail address
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(formData.email.trim())) {
      setError('A valid Gmail address (@gmail.com) is strictly required for student verification.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/student/register', formData);
      if (res.data?.success) {
        setStep(2);
        setCooldown(60);
        setExpirySeconds(600);
        setSuccessMsg(res.data.message || 'OTP sent to your Gmail address!');
      }
    } catch (err) {
      console.error('Registration initiate error:', err);
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your Gmail.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/student/verify-otp', {
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim()
      });

      if (res.data?.success) {
        const { token, role, user } = res.data.data;
        setAuthSession(token, role, user);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const res = await api.post('/auth/student/resend-otp', {
        email: formData.email.trim().toLowerCase()
      });

      if (res.data?.success) {
        setCooldown(60);
        setExpirySeconds(600);
        setSuccessMsg('A new OTP has been sent to your Gmail address.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
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
    <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col justify-center">
      {/* Top Floating PWA Install Action */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30">
        <InstallAppButton variant="header" />
      </div>

      {/* Campus Background with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transform scale-105"
        style={{ backgroundImage: "url('/assets/campus-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/90 backdrop-blur-[3px] z-0" />

      <div className="max-w-2xl w-full mx-auto relative z-10">
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
            Student Registration Portal &bull; Gmail OTP Verification
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Registration Form */
            <form onSubmit={handleInitiateRegistration} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Father's Name *
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    required
                    value={formData.fatherName}
                    onChange={handleChange}
                    placeholder="e.g. Rajendra Sharma"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Email (Gmail Required) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Gmail Address * <span className="text-indigo-600 font-normal">(@gmail.com)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@gmail.com"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* University Roll Number */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    University Roll Number * (Unique)
                  </label>
                  <input
                    type="text"
                    name="universityRollNumber"
                    required
                    value={formData.universityRollNumber}
                    onChange={handleChange}
                    placeholder="e.g. 24BCSE0501"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* College Registration Number */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    College Registration No * (Unique)
                  </label>
                  <input
                    type="text"
                    name="collegeRegistrationNumber"
                    required
                    value={formData.collegeRegistrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. REG20240501"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Course */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Course / Program *
                  </label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="B.Tech Computer Science & Engineering">B.Tech Computer Science & Engineering</option>
                    <option value="B.Tech Information Technology">B.Tech Information Technology</option>
                    <option value="B.Tech Mechanical Engineering">B.Tech Mechanical Engineering</option>
                    <option value="B.Tech Electronics & Communication">B.Tech Electronics & Communication</option>
                    <option value="Bachelor of Computer Applications (BCA)">Bachelor of Computer Applications (BCA)</option>
                    <option value="Master of Business Administration (MBA)">Master of Business Administration (MBA)</option>
                  </select>
                </div>

                {/* Semester & Academic Year */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Semester *
                    </label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s.toString()}>Sem {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Academic Year *
                    </label>
                    <input
                      type="text"
                      name="academicYear"
                      required
                      value={formData.academicYear}
                      onChange={handleChange}
                      placeholder="2024-2025"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 focus:outline-none transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Gmail Verification Code...
                    </>
                  ) : (
                    <>
                      <span>Proceed to Gmail OTP Verification</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Gmail OTP Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-4 text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white mb-2 shadow">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Check Your Gmail Inbox</h3>
                <p className="text-xs text-slate-600 mt-1">
                  We sent a 6-digit OTP code to: <strong className="text-indigo-900 font-mono">{formData.email}</strong>
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Code expires in: <strong className="text-slate-800 font-mono">{formatTime(expirySeconds)}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 text-center mb-2">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                  className="w-full max-w-xs mx-auto block text-center rounded-xl border-2 border-indigo-300 py-3 text-2xl font-mono font-black tracking-widest text-slate-900 placeholder:text-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6 || expirySeconds === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying & Activating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm OTP & Complete Registration</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Edit Details
                  </button>

                  <button
                    type="button"
                    disabled={cooldown > 0 || resending}
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-600 border-t pt-4">
            Already registered with College ERP?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500">
              Sign In to Your Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
