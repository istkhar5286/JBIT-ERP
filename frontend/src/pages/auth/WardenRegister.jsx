import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Home, Mail, Lock, Phone, User, Calendar, Award, MapPin, UploadCloud, ArrowRight, Loader2, AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const WardenRegister = () => {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    mobile: '',
    dateOfBirth: '',
    gender: 'Male',
    qualification: '',
    designation: 'Hostel Warden',
    hostelAssigned: 'Mandakini Boys Hostel',
    address: '',
    password: '',
    confirmPassword: '',
    profilePhoto: ''
  });

  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // OTP Verification Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);

  // Cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      setError('Please select a valid JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setFormData((prev) => ({ ...prev, profilePhoto: reader.result }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleInitiateRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/warden/register', formData);
      if (res.data?.success) {
        setSuccess('Verification OTP sent to your email address!');
        setOtpModalOpen(true);
        setResendCooldown(60);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.trim().length !== 6) {
      setOtpError('Please enter the full 6-digit verification code.');
      return;
    }

    setOtpError('');
    setVerifyingOtp(true);

    try {
      const res = await api.post('/auth/warden/verify-otp', {
        email: formData.email,
        otp: otpValue.trim()
      });

      if (res.data?.success) {
        const { token, role, user } = res.data.data;
        if (setAuthSession) {
          setAuthSession(token, role, user);
        }
        navigate('/warden/dashboard');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setResendingOtp(true);
    setOtpError('');

    try {
      const res = await api.post('/auth/warden/resend-otp', { email: formData.email });
      if (res.data?.success) {
        setResendCooldown(60);
        setOtpError('');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResendingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
        style={{ backgroundImage: "url('/assets/campus-bg.jpg')" }}
      />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img 
              src={BRANDING.LOGO} 
              alt={BRANDING.LOGO_ALT} 
              className="h-16 w-16 object-contain rounded-full ring-2 ring-teal-400 p-0.5 bg-slate-950"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wide">
            {BRANDING.COLLEGE_NAME}
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold uppercase tracking-wider">
            <Home className="h-3.5 w-3.5" />
            <span>Hostel Warden Official Registration</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Register as an authorized hostel warden with two-step Gmail OTP verification.
          </p>
        </div>

        {/* Registration Card */}
        <div className="rounded-2xl bg-white p-6 sm:p-10 shadow-2xl border border-slate-200">
          {error && (
            <div className="mb-6 rounded-xl bg-rose-50 p-4 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleInitiateRegistration} className="space-y-6">
            {/* Profile Photo Preview / Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-teal-500/40 bg-white flex items-center justify-center shrink-0 shadow-sm">
                {photoPreview ? (
                  <img src={photoPreview} alt="Warden Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Warden Profile Photograph
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Upload a recent professional photo (JPG/PNG under 5MB).
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Dr. S. K. Verma"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Employee / Warden ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. WRD-102"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Gmail / Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. skverma.warden@gmail.com"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
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
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Qualification
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="e.g. M.Tech / M.Sc / Ph.D."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g. Hostel Warden / Chief Warden"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Hostel Assigned
                </label>
                <select
                  name="hostelAssigned"
                  value={formData.hostelAssigned}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                >
                  <option value="Mandakini Boys Hostel">Mandakini Boys Hostel</option>
                  <option value="Bhagirathi Girls Hostel">Bhagirathi Girls Hostel</option>
                  <option value="All Hostels">Campus Wide / All Hostels</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Campus Address / Quarters
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Staff Quarters Type-B, JBIT"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending Verification OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Gmail Verification OTP</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">Already registered as Warden? </span>
            <Link
              to="/warden/login"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
            >
              Sign In to Warden Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 2-Step OTP Verification Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
            <button
              onClick={() => setOtpModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-black text-slate-900">Verify Your Gmail Address</h2>
              <p className="text-xs text-slate-500 mt-1">
                A 6-digit verification code has been dispatched to:
              </p>
              <p className="text-xs font-bold text-teal-700 font-mono mt-0.5">{formData.email}</p>
            </div>

            {otpError && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 text-center mb-2">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center text-2xl font-mono tracking-widest font-black rounded-xl border border-slate-300 p-3 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              <button
                type="submit"
                disabled={verifyingOtp || otpValue.length !== 6}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 shadow-md shadow-teal-600/30 disabled:opacity-50 transition-all"
              >
                {verifyingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying OTP &amp; Activating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verify Code &amp; Create Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-slate-400">
                  Resend code in <span className="font-bold text-teal-600">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendingOtp}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${resendingOtp ? 'animate-spin' : ''}`} />
                  <span>Resend Verification OTP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
