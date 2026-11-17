import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Home, Lock, ArrowRight, Loader2, AlertCircle, KeyRound, UserCheck } from 'lucide-react';
import { BRANDING } from '../../config/branding';
import { InstallAppButton } from '../../components/pwa/InstallAppButton';

export const WardenLogin = () => {
  const [formData, setFormData] = useState({
    identifier: '',
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
      await login('WARDEN', {
        identifier: formData.identifier,
        password: formData.password
      });

      navigate('/warden/dashboard');
    } catch (err) {
      console.error('Warden login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
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
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transform scale-105"
        style={{ backgroundImage: "url('/assets/campus-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/85 to-slate-950/95 backdrop-blur-[3px] z-0" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-3">
          <img 
            src={BRANDING.LOGO} 
            alt={BRANDING.LOGO_ALT} 
            className="h-20 w-20 object-contain drop-shadow-2xl ring-2 ring-teal-500/40 rounded-full p-0.5 bg-slate-950/60"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white drop-shadow-md">
          {BRANDING.COLLEGE_NAME}
        </h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold tracking-wide uppercase">
          <Home className="h-3.5 w-3.5" />
          <span>Hostel Administration &amp; Warden Desk</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-300">
          {BRANDING.ADDRESS}
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-2xl bg-white/95 backdrop-blur-xl px-6 py-8 shadow-2xl sm:px-10 border border-slate-200">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-teal-600" />
              <span>Warden Portal Sign In</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered Gmail or Warden Employee ID to manage campus hostels.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-rose-50 p-3.5 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-700 font-semibold animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="identifier"
                  required
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="Enter your registered email address"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating Warden...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Warden Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
            <div>
              <span className="text-xs text-slate-500">New Hostel Warden? </span>
              <Link
                to="/warden/register"
                className="text-xs font-black text-teal-700 hover:text-teal-800 hover:underline"
              >
                Warden Registration
              </Link>
            </div>

            <div>
              <Link
                to="/login"
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"
              >
                <span>&larr; Return to Student, Faculty &amp; Admin Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
