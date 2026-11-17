import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePwaInstall } from '../../context/PwaInstallContext';
import api from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  Smartphone,
  Download,
  Check
} from 'lucide-react';
import { InstallAppButton } from '../../components/pwa/InstallAppButton';

export const StudentProfile = () => {
  const { user, refreshUser } = useAuth();
  const { installApp, isStandalone, platform } = usePwaInstall();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [saving, setSaving] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    fatherName: user?.fatherName || '',
    mobile: user?.mobile || '',
    email: user?.email || ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/profile');
        if (res.data?.success) {
          setProfile(res.data.data);
          setProfilePhoto(res.data.data.profilePhoto || '');
          setFormData({
            fullName: res.data.data.fullName,
            fatherName: res.data.data.fatherName,
            mobile: res.data.data.mobile,
            email: res.data.data.email
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message) setMessage('');
    if (error) setError('');
  };

  const savePhoto = async (photoDataUrl) => {
    setSavingPhoto(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/student/profile', {
        ...formData,
        profilePhoto: photoDataUrl
      });
      if (res.data?.success) {
        setProfile(res.data.data);
        setMessage('Profile photo updated successfully!');
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile photo');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WEBP)');
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
        // Resize and optimize image for passport photo format
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
        // Fill white background so transparent PNGs do not produce black backgrounds
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Retain PNG or JPEG format with high quality
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputMime, 0.90);
        setProfilePhoto(dataUrl);
        savePhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await api.put('/student/profile', {
        ...formData,
        profilePhoto
      });
      if (res.data?.success) {
        setProfile(res.data.data);
        setMessage('Your profile has been successfully updated.');
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={2} height="h-64" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header with Photo Upload */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-soft border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="relative group">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={profile?.fullName || 'Profile'}
              className="h-24 w-24 rounded-2xl object-cover ring-2 ring-indigo-600 shadow-md"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-black text-3xl shadow-md">
              {profile?.fullName?.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Photo Upload Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={savingPhoto}
            className="absolute -bottom-2 -right-2 rounded-xl bg-slate-900 p-2 text-white shadow-lg ring-2 ring-white hover:bg-indigo-600 transition-all"
            title="Upload Profile Photo"
          >
            {savingPhoto ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{profile?.fullName}</h1>
              <p className="text-xs text-slate-500 mt-1">
                Roll Number: <span className="font-mono font-bold text-indigo-700">{profile?.universityRollNumber}</span> &bull; Registration: <span className="font-mono font-bold text-slate-700">{profile?.collegeRegistrationNumber}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all self-center sm:self-start"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Change Photo</span>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              Active Student
            </span>
            <span className="text-xs text-slate-400">Enrolled {profile?.academicYear}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Details (Immutable) */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Academic Registration</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase">Degree Program</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile?.course}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-bold text-slate-400 uppercase">Current Semester</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">Semester {profile?.semester}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase">Academic Session</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile?.academicYear}</p>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-400 uppercase">Father's Name</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile?.fatherName}</p>
            </div>
            <div>
              <p className="font-bold text-slate-400 uppercase">Registration ID</p>
              <p className="text-sm font-mono font-semibold text-slate-800 mt-0.5">{profile?.collegeRegistrationNumber}</p>
            </div>
          </div>
        </div>

        {/* Contact Information (Editable) */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Contact Particulars</h3>
          </div>

          {message && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* PWA Application & Device Settings Section (Requirement 8) */}
      <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">App & Device Installation</h3>
          </div>
          {isStandalone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <Check className="h-3 w-3" />
              Standalone App Active
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              JB Institute of Technology ERP (PWA)
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Install JBIT ERP directly to your home screen or desktop. Provides a clean, APK-like standalone window experience without browser URL bars or distractions.
            </p>
          </div>

          <button
            type="button"
            onClick={installApp}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 px-4 py-2.5 text-xs font-bold text-white shadow hover:from-indigo-700 hover:to-indigo-900 transition-all shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>{isStandalone ? 'App Installed' : 'Install App'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
