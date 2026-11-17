import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Phone, Mail, GraduationCap, Lock, Camera, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const FacultyProfile = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    mobile: user?.mobile || '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/faculty/profile');
        if (res.data?.success) {
          setProfile(res.data.data);
          setProfilePhoto(res.data.data.profilePhoto || '');
          setFormData((prev) => ({
            ...prev,
            mobile: res.data.data.mobile || ''
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo size should be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
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
        setProfilePhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        mobile: formData.mobile,
        profilePhoto
      };
      if (formData.password) payload.password = formData.password;

      const res = await api.put('/faculty/profile', payload);
      if (res.data?.success) {
        setProfile(res.data.data);
        setSuccess('Faculty profile updated successfully!');
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <User className="h-6 w-6 text-indigo-600" />
          Faculty Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your academic designation, credentials, and update contact information.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Section */}
          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <div className="relative">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={profile?.name}
                  className="h-24 w-24 rounded-2xl object-cover ring-2 ring-indigo-500/30 p-0.5 bg-slate-50 shadow-md"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-3xl flex items-center justify-center ring-2 ring-indigo-500/30">
                  {profile?.name?.charAt(0) || 'F'}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all"
                title="Upload Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">{profile?.name}</h2>
              <p className="text-xs text-indigo-600 font-bold">{profile?.designation}</p>
              <p className="text-xs text-slate-500 mt-0.5">Department of {profile?.department}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                Emp ID: {profile?.employeeId}
              </span>
            </div>
          </div>

          {/* Read-Only Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Official Email</label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{profile?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Father's / Mother's Name</label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{profile?.parentName || 'Not Provided'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Qualification</label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{profile?.qualification || 'Not Specified'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Course & Branch</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <span>{profile?.course || 'B.Tech'} {profile?.branch ? `(${profile.branch})` : ''}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date of Birth & Gender</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <span>{profile?.dateOfBirth || 'N/A'} {profile?.gender ? `(${profile.gender})` : ''}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Joining Date</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <span>{profile?.joiningDate || 'Active Staff'}</span>
              </div>
            </div>
          </div>

          {profile?.address && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Registered Residence / Address</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <span>{profile.address}</span>
              </div>
            </div>
          )}

          {/* Editable Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Mobile Number</label>
              <div className="relative">
                <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-600" />
              <span>Change Account Password (Leave blank to keep unchanged)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">New Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile Updates</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
