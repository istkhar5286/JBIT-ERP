import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, User, GraduationCap, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { BRANDING } from '../../config/branding';
import { InstallAppButton } from '../../components/pwa/InstallAppButton';

export const Login = () => {
  const [activeRole, setActiveRole] = useState('STUDENT'); // 'STUDENT' | 'FACULTY' | 'ADMIN'
  const [formData, setFormData] = useState({
    identifier: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let credentials;
      if (activeRole === 'ADMIN') {
        credentials = { email: formData.email, password: formData.password };
      } else if (activeRole === 'FACULTY') {
        credentials = { identifier: formData.identifier, password: formData.password };
      } else {
        credentials = { identifier: formData.identifier, password: formData.password };
      }

      await login(activeRole, credentials);

      if (activeRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (activeRole === 'FACULTY') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Top Floating PWA Install Action */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30">
        <InstallAppButton variant="header" />
      </div>

      {/* College Campus Background Image with Subtle Readability Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transform scale-105 transition-transform duration-1000"
        style={{ backgroundImage: "url('/assets/campus-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/90 backdrop-blur-[3px] z-0" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-3">
          <img 
            src={BRANDING.LOGO} 
            alt={BRANDING.LOGO_ALT} 
            className="h-20 w-20 object-contain drop-shadow-2xl ring-2 ring-amber-400/30 rounded-full p-0.5 bg-slate-950/60"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white drop-shadow-md">
          {BRANDING.COLLEGE_NAME}
        </h1>
        <p className="mt-1 text-xs font-semibold text-amber-400/90 tracking-wide uppercase">
          College Enterprise Resource Planning Portal
        </p>
        <p className="mt-0.5 text-[11px] text-slate-300">
          {BRANDING.ADDRESS}
        </p>

        {/* Role Switcher Tabs */}
        <div className="mt-6 flex rounded-xl bg-slate-900/90 p-1.5 border border-slate-700/80 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => { setActiveRole('STUDENT'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
              activeRole === 'STUDENT'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            Student
          </button>
          <button
            type="button"
            onClick={() => { setActiveRole('FACULTY'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
              activeRole === 'FACULTY'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Faculty
          </button>
          <button
            type="button"
            onClick={() => { setActiveRole('ADMIN'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
              activeRole === 'ADMIN'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin
          </button>
        </div>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-2xl bg-white/95 backdrop-blur-xl px-6 py-8 shadow-2xl sm:px-10 border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              {activeRole === 'ADMIN'
                ? 'Administrative Access'
                : activeRole === 'FACULTY'
                ? 'Faculty Portal Sign In'
                : 'Student Portal Sign In'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your verified credentials to access your ERP dashboard
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeRole === 'STUDENT' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mobile / Email / Roll Number
                </label>
                <input
                  type="text"
                  name="identifier"
                  required
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="Enter email, mobile, or roll number"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
                />
              </div>
            ) : activeRole === 'FACULTY' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Employee ID / Official Email
                </label>
                <input
                  type="text"
                  name="identifier"
                  required
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="e.g. JBIT-FAC-101 or faculty@jbit.edu.in"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Administrator Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter administrator email address"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link
                  to={`/forgot-password?role=${activeRole.toLowerCase()}`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter account password"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In to {activeRole === 'ADMIN' ? 'Admin Panel' : activeRole === 'FACULTY' ? 'Faculty Desk' : 'Student Portal'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {activeRole === 'STUDENT' && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
              New student at JBIT?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500">
                Register with Email OTP
              </Link>
            </div>
          )}

          {activeRole === 'FACULTY' && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
              New faculty member at JBIT?{' '}
              <Link to="/faculty/register" className="font-bold text-indigo-600 hover:text-indigo-500 underline underline-offset-2">
                Faculty Registration
              </Link>
            </div>
          )}

          {/* Dedicated Warden Portal Access Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <Link
              to="/warden/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition-all"
            >
              <span>🔑 Access Dedicated Hostel Warden Portal &rarr;</span>
            </Link>
          </div>
        </div>

        {/* PWA Install Banner */}
        <div className="mt-4">
          <InstallAppButton variant="banner" />
        </div>

        {/* Security / Affiliation Footer */}
        <p className="mt-6 text-center text-[11px] text-slate-400/90 font-medium">
          &copy; {new Date().getFullYear()} {BRANDING.COLLEGE_NAME} &bull; All Rights Reserved
        </p>
      </div>
    </div>
  );
};
