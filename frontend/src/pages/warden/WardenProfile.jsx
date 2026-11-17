import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Camera,
  Loader2,
  Save,
  Briefcase,
  GraduationCap,
  MapPin,
  X
} from 'lucide-react';

export const WardenProfile = () => {
  const { user, token, setAuthSession, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    mobile: user?.mobile || '',
    qualification: user?.qualification || '',
    designation: user?.designation || 'Hostel Warden',
    address: user?.address || '',
    profilePhoto: user?.profilePhoto || ''
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError('Please select a JPG or PNG image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, profilePhoto: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await api.put('/auth/warden/profile', form);
      if (res.data?.success) {
        setSuccess('Profile updated successfully!');
        setEditing(false);
        if (setAuthSession && token) {
          setAuthSession(token, 'WARDEN', res.data.data);
        } else if (refreshUser) {
          await refreshUser();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold tracking-wider uppercase mb-1">
            <Shield className="w-4 h-4" /> Official Credentials
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Warden Profile & Desk Settings</h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Manage your personal profile, contact information, and institutional credentials.
          </p>
        </div>

        <button
          onClick={() => setEditing(!editing)}
          className="self-start md:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition backdrop-blur-sm"
        >
          {editing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Avatar and Primary Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-700">
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-800 dark:text-emerald-200 text-3xl font-black shadow-md">
                {form.profilePhoto || user?.profilePhoto ? (
                  <img
                    src={form.profilePhoto || user?.profilePhoto}
                    alt={user?.fullName || 'Warden'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.fullName?.charAt(0) || 'W'
                )}
              </div>

              {editing && (
                <label className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase">Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.fullName || 'Hostel Warden'}
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Active Warden
                </span>
              </div>

              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Employee ID: {user?.employeeId || 'WRD-101'}
              </p>

              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
                <Building2 className="w-3.5 h-3.5" />
                {user?.hostelAssigned ? `Assigned to: ${user.hostelAssigned}` : 'Hostel Resident Desk - JB Institute of Technology'}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Email Address (Institutional / Verified)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Contact Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  disabled={!editing}
                  placeholder="+91 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Qualification
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  disabled={!editing}
                  placeholder="e.g. M.A., B.Ed, M.Sc"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Designation
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  disabled={!editing}
                  placeholder="e.g. Chief Hostel Warden"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Residential Address / Campus Quarter
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  disabled={!editing}
                  placeholder="Campus Staff Quarters, JBIT Campus, Shankarpur, Dehradun..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {editing && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    mobile: user?.mobile || '',
                    qualification: user?.qualification || '',
                    designation: user?.designation || 'Hostel Warden',
                    address: user?.address || '',
                    profilePhoto: user?.profilePhoto || ''
                  });
                  setEditing(false);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
export default WardenProfile;
