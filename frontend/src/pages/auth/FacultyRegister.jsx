import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  GraduationCap,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Clock,
  RefreshCw,
  ArrowLeft,
  Camera,
  User,
  Shield,
  Briefcase
} from 'lucide-react';
import { BRANDING } from '../../config/branding';
import { InstallAppButton } from '../../components/pwa/InstallAppButton';

export const FacultyRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    parentName: '',
    employeeId: '',
    email: '',
    mobile: '',
    dateOfBirth: '',
    gender: 'Male',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    course: 'B.Tech',
    branch: 'Computer Science & Engineering',
    qualification: 'M.Tech / Ph.D.',
    joiningDate: new Date().toISOString().split('T')[0],
    address: '',
    profilePhoto: '',
    password: '',
    confirmPassword: ''
  });

  // Step 1 = Details Form, Step 2 = Gmail OTP Verification
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(600); // 10 mins
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const fileInputRef = useRef(null);
  const { setAuthSession } = useAuth();
  const navigate = useNavigate();

  // Cooldown timer
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      setError('Profile photo must be a JPG, JPEG, or PNG image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 360;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
        setFormData((prev) => ({ ...prev, profilePhoto: dataUrl }));
        setError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleInitiateRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validations
    if (!formData.name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.employeeId.trim()) {
      setError('Employee ID is required.');
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please provide a valid email / Gmail address.');
      return;
    }
    if (formData.mobile.trim().length < 10) {
      setError('Mobile number must be at least 10 digits.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/faculty/register', formData);
      if (res.data?.success) {
        setStep(2);
        setCooldown(60);
        setExpirySeconds(600);
        setSuccessMsg(res.data.message || 'OTP sent to your email address!');
      }
    } catch (err) {
      console.error('Faculty registration error:', err);
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
      setError('Please enter the 6-digit OTP verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/faculty/verify-otp', {
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim()
      });

      if (res.data?.success) {
        const { token, role, user } = res.data.data;
        setAuthSession(token, role, user);
        navigate('/faculty/dashboard');
      }
    } catch (err) {
      console.error('Faculty OTP verification error:', err);
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
      const res = await api.post('/auth/faculty/resend-otp', {
        email: formData.email.trim().toLowerCase()
      });

      if (res.data?.success) {
        setCooldown(60);
        setExpirySeconds(600);
        setSuccessMsg('A new OTP has been sent to your email address.');
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

      <div className="max-w-3xl w-full mx-auto relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <img
              src={BRANDING.LOGO}
              alt={BRANDING.LOGO_ALT}
              className="h-16 w-16 object-contain drop-shadow-xl ring-2 ring-amber-400/30 rounded-full p-0.5 bg-slate-950/60"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            {BRANDING.COLLEGE_NAME}
          </h1>
          <p className="text-xs font-semibold text-amber-400/90 tracking-wide uppercase mt-0.5">
            Faculty Onboarding Portal &bull; Gmail OTP Verification
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {BRANDING.ADDRESS}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
          <div className="mb-6 flex items-center justify-between border-b pb-4 border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                {step === 1 ? 'Faculty Member Registration' : 'Verify Email Address'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 1
                  ? 'Fill out official faculty credentials to register your institutional profile'
                  : 'Enter the 6-digit OTP code sent to your official email'}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
              Step {step} of 2
            </span>
          </div>

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
              {/* Profile Photo Upload */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-2">
                <div className="relative shrink-0">
                  {formData.profilePhoto ? (
                    <img
                      src={formData.profilePhoto}
                      alt="Preview"
                      className="h-16 w-16 rounded-xl object-cover border border-indigo-300 shadow-sm"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xl flex items-center justify-center">
                      {formData.name ? formData.name.charAt(0) : 'F'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 transition-all"
                    title="Upload passport photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Faculty Passport Photo (Optional)</p>
                  <p className="text-[11px] text-slate-500">
                    JPG, JPEG, or PNG, max 5MB. Clear front-facing headshot.
                  </p>
                  {formData.profilePhoto && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, profilePhoto: '' }))}
                      className="text-[10px] font-bold text-rose-600 hover:underline mt-1"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Father's / Mother's Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Father's / Mother's Name *
                  </label>
                  <input
                    type="text"
                    name="parentName"
                    required
                    value={formData.parentName}
                    onChange={handleChange}
                    placeholder="e.g. Om Prakash Sharma"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Employee ID * (Unique)
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                    placeholder="e.g. JBIT-FAC-105"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Faculty Email */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Official Email / Gmail * <span className="text-indigo-600 font-normal">(@gmail.com)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="faculty@jbit.edu.in or gmail"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Mobile Number */}
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
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Date of Birth & Gender */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Applied Sciences">Applied Sciences</option>
                    <option value="Management Studies">Management Studies</option>
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Designation *
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Head of Department">Head of Department (HOD)</option>
                    <option value="Lecturer">Lecturer</option>
                  </select>
                </div>

                {/* Course / Branch */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Course / Branch
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Qualification *
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    required
                    value={formData.qualification}
                    onChange={handleChange}
                    placeholder="e.g. Ph.D. / M.Tech / M.Sc."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Address / Residence
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street, City, State"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
                  />
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
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
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
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 focus:outline-none transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    <>
                      <span>Send OTP & Proceed to Verification</span>
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
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white mb-2 shadow">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Check Your Gmail / Official Email</h3>
                <p className="text-xs text-slate-600 mt-1">
                  We sent a 6-digit verification code to:{' '}
                  <strong className="text-indigo-900 font-mono">{formData.email}</strong>
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>
                    Code expires in: <strong className="text-slate-800 font-mono">{formatTime(expirySeconds)}</strong>
                  </span>
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
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying & Activating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm OTP & Complete Faculty Registration</span>
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
            Already registered with JBIT Faculty Portal?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500">
              Sign In to Faculty Desk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
