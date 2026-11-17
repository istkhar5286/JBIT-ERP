import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
  GraduationCap,
  Plus,
  Search,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Camera,
  X,
  Eye,
  Check,
  Ban,
  User,
  BookOpen,
  Calendar,
  Layers,
  MapPin,
  CalendarCheck
} from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const AdminFaculty = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingFaculty, setViewingFaculty] = useState(null);

  const fileInputRef = useRef(null);

  // Form state for Add/Edit Faculty
  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    parentName: '',
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
    status: 'active',
    password: '',
    profilePhoto: '',
    subjectsText: 'Data Structures, Operating Systems',
    assignedClasses: [
      {
        course: 'B.Tech Computer Science & Engineering',
        branch: 'CSE',
        semester: '3',
        section: 'A',
        subject: 'Data Structures'
      }
    ]
  });

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/faculty', {
        params: {
          search,
          department: departmentFilter,
          status: statusFilter
        }
      });
      if (res.data?.success) {
        setFacultyList(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load faculty directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [departmentFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFaculty();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
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
        setForm((prev) => ({ ...prev, profilePhoto: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      employeeId: '',
      name: '',
      parentName: '',
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
      status: 'active',
      password: '',
      profilePhoto: '',
      subjectsText: 'Data Structures, Operating Systems',
      assignedClasses: [
        {
          course: 'B.Tech Computer Science & Engineering',
          branch: 'CSE',
          semester: '3',
          section: 'A',
          subject: 'Data Structures'
        }
      ]
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleOpenEdit = (fac) => {
    setEditingId(fac._id);
    const classes = Array.isArray(fac.assignedClasses) && fac.assignedClasses.length > 0
      ? fac.assignedClasses.map((c) => ({
          course: c.course || 'B.Tech Computer Science & Engineering',
          branch: c.branch || 'CSE',
          semester: c.semester || '1',
          section: c.section || 'A',
          subject: c.subject || ''
        }))
      : [];

    setForm({
      employeeId: fac.employeeId || '',
      name: fac.name || '',
      parentName: fac.parentName || '',
      email: fac.email || '',
      mobile: fac.mobile || '',
      dateOfBirth: fac.dateOfBirth || '',
      gender: fac.gender || 'Male',
      department: fac.department || 'Computer Science & Engineering',
      designation: fac.designation || 'Assistant Professor',
      course: fac.course || 'B.Tech',
      branch: fac.branch || 'Computer Science & Engineering',
      qualification: fac.qualification || '',
      joiningDate: fac.joiningDate || '',
      address: fac.address || '',
      status: fac.status || 'active',
      password: '',
      profilePhoto: fac.profilePhoto || '',
      subjectsText: (fac.subjects || fac.assignedSubjects || []).join(', '),
      assignedClasses: classes
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleAddClassRow = () => {
    setForm((prev) => ({
      ...prev,
      assignedClasses: [
        ...prev.assignedClasses,
        {
          course: 'B.Tech Computer Science & Engineering',
          branch: 'CSE',
          semester: '1',
          section: 'A',
          subject: ''
        }
      ]
    }));
  };

  const handleRemoveClassRow = (idx) => {
    setForm((prev) => ({
      ...prev,
      assignedClasses: prev.assignedClasses.filter((_, i) => i !== idx)
    }));
  };

  const handleClassRowChange = (idx, field, val) => {
    setForm((prev) => {
      const updated = [...prev.assignedClasses];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, assignedClasses: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const subjectsArray = form.subjectsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const validClasses = form.assignedClasses.filter((c) => c.subject && c.subject.trim());

      const payload = {
        employeeId: form.employeeId,
        name: form.name,
        parentName: form.parentName,
        email: form.email,
        mobile: form.mobile,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        department: form.department,
        designation: form.designation,
        course: form.course,
        branch: form.branch,
        qualification: form.qualification,
        joiningDate: form.joiningDate,
        address: form.address,
        status: form.status,
        subjects: subjectsArray,
        assignedSubjects: subjectsArray,
        assignedClasses: validClasses,
        profilePhoto: form.profilePhoto
      };
      if (form.password) payload.password = form.password;

      if (editingId) {
        const res = await api.put(`/admin/faculty/${editingId}`, payload);
        if (res.data?.success) {
          setSuccess('Faculty member details & class assignments updated successfully!');
          setShowModal(false);
          fetchFaculty();
        }
      } else {
        if (!form.password) {
          setError('Password is required for new faculty registration');
          setSaving(false);
          return;
        }
        const res = await api.post('/admin/faculty', payload);
        if (res.data?.success) {
          setSuccess('New faculty member registered successfully!');
          setShowModal(false);
          fetchFaculty();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (fac) => {
    const nextStatus = fac.status === 'active' ? 'deactivated' : 'active';
    const confirmMsg = fac.status === 'active'
      ? `Are you sure you want to deactivate ${fac.name}? They will be unable to log in.`
      : `Activate faculty account for ${fac.name}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoadingId(fac._id);
      const res = await api.put(`/admin/faculty/${fac._id}/status`);
      if (res.data?.success) {
        setFacultyList((prev) =>
          prev.map((item) => (item._id === fac._id ? { ...item, status: nextStatus } : item))
        );
        setSuccess(`Faculty member account ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Status toggle failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to completely remove this faculty record?')) return;
    try {
      const res = await api.delete(`/admin/faculty/${id}`);
      if (res.data?.success) {
        setFacultyList((prev) => prev.filter((f) => f._id !== id));
        setSuccess('Faculty record removed successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="h-6 w-6 text-indigo-600" />
            Faculty Management &amp; Assignments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View directory, manage account activation, allocate teaching departments, subjects, and classroom rosters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Faculty</span>
        </button>
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

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Employee ID, Name, Email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600 bg-white"
          >
            <option value="">All Departments</option>
            <option value="Computer Science & Engineering">Computer Science & Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Electronics & Communication">Electronics & Communication</option>
            <option value="Applied Sciences">Applied Sciences</option>
            <option value="Management Studies">Management Studies</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="deactivated">Deactivated Accounts</option>
          </select>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : facultyList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No faculty members found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Department &amp; Designation</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Assigned Academic</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultyList.map((fac) => (
                  <tr key={fac._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {fac.profilePhoto ? (
                          <img
                            src={fac.profilePhoto}
                            alt={fac.name}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs">
                            {fac.name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">{fac.name}</span>
                          <span className="text-[11px] text-slate-400">{fac.qualification || 'Faculty'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {fac.employeeId}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{fac.designation}</p>
                      <p className="text-[11px] text-slate-400">{fac.department}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" /> {fac.mobile}
                      </p>
                      <p className="flex items-center gap-1 text-slate-400">
                        <Mail className="h-3 w-3 text-slate-400" /> {fac.email}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          fac.emailVerified !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {fac.emailVerified !== false ? 'OTP Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          fac.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {fac.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-slate-700">
                          {(fac.subjects || fac.assignedSubjects || []).length} Subjects
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(fac.assignedClasses || []).length} Classes
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Status Toggle Button */}
                        <button
                          type="button"
                          disabled={actionLoadingId === fac._id}
                          onClick={() => handleToggleStatus(fac)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                            fac.status === 'active'
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={fac.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {fac.status === 'active' ? (
                            <>
                              <Ban className="h-3 w-3" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>

                        {/* View Profile Button */}
                        <button
                          type="button"
                          onClick={() => setViewingFaculty(fac)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                          title="View Full Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(fac)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Edit Information & Assignments"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(fac._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                          title="Delete Faculty Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW FACULTY PROFILE MODAL */}
      {viewingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-black text-slate-900">Faculty Institutional Profile</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingFaculty(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              {viewingFaculty.profilePhoto ? (
                <img
                  src={viewingFaculty.profilePhoto}
                  alt={viewingFaculty.name}
                  className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-indigo-100 text-indigo-700 font-black text-2xl flex items-center justify-center">
                  {viewingFaculty.name?.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-base font-black text-slate-900">{viewingFaculty.name}</h3>
                <p className="text-xs text-indigo-600 font-bold">{viewingFaculty.designation}</p>
                <p className="text-xs text-slate-500">Department of {viewingFaculty.department}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    ID: {viewingFaculty.employeeId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      viewingFaculty.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {viewingFaculty.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Father's / Mother's Name</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{viewingFaculty.parentName || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Official Email</span>
                <span className="font-bold text-slate-800 mt-0.5 block truncate">{viewingFaculty.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Mobile Number</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{viewingFaculty.mobile}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Qualification</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{viewingFaculty.qualification || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Joining Date</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{viewingFaculty.joiningDate || 'Staff'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">DOB / Gender</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{viewingFaculty.dateOfBirth || 'N/A'} ({viewingFaculty.gender || 'N/A'})</span>
              </div>
            </div>

            {viewingFaculty.address && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-4">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Residential Address</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">{viewingFaculty.address}</span>
              </div>
            )}

            {/* Assigned Classes */}
            <div className="mb-4">
              <h4 className="text-xs font-black uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600" />
                <span>Assigned Classes ({(viewingFaculty.assignedClasses || []).length})</span>
              </h4>
              {(viewingFaculty.assignedClasses || []).length === 0 ? (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl">No classes assigned yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {viewingFaculty.assignedClasses.map((cls, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{cls.course}</span>
                        <span className="text-slate-500 ml-1.5">
                          Sem {cls.semester} {cls.branch ? `(${cls.branch})` : ''} - Sec {cls.section || 'A'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                        {cls.subject || 'Allotted'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Subjects */}
            <div>
              <h4 className="text-xs font-black uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <span>Teaching Subjects</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(viewingFaculty.subjects || viewingFaculty.assignedSubjects || []).length === 0 ? (
                  <p className="text-xs text-slate-400">No subjects listed.</p>
                ) : (
                  (viewingFaculty.subjects || viewingFaculty.assignedSubjects || []).map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => setViewingFaculty(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FACULTY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {editingId ? 'Edit Faculty & Academic Assignments' : 'Register New Faculty Member'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Administer credentials, personal details, departments, and course allocations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="relative shrink-0">
                  {form.profilePhoto ? (
                    <img
                      src={form.profilePhoto}
                      alt="Preview"
                      className="h-16 w-16 rounded-xl object-cover border border-indigo-200 shadow-sm"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-xl">
                      {form.name ? form.name.charAt(0) : 'F'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-indigo-600 text-white shadow"
                    title="Upload Photo"
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
                  <p className="text-xs font-bold text-slate-800">Faculty Passport Photo</p>
                  <p className="text-[11px] text-slate-500">Square passport photo, max 5MB (JPG, JPEG, PNG)</p>
                </div>
              </div>

              {/* Personal & Official Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value.toUpperCase() })}
                    placeholder="e.g. JBIT-FAC-102"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Father's / Mother's Name</label>
                  <input
                    type="text"
                    value={form.parentName}
                    onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                    placeholder="e.g. Om Prakash Kumar"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="faculty@jbit.edu.in"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Account Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600 bg-white"
                  >
                    <option value="active">Active (Can Login)</option>
                    <option value="deactivated">Deactivated (Login Blocked)</option>
                  </select>
                </div>
              </div>

              {/* Academic & Department Allocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Department *</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600 bg-white"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Applied Sciences">Applied Sciences</option>
                    <option value="Management Studies">Management Studies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="e.g. Assistant Professor / HOD"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Course / Branch</label>
                  <input
                    type="text"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    placeholder="e.g. Ph.D. / M.Tech"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Password {editingId && '(Leave blank to retain current)'}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId ? 'Enter new password to change' : 'Account login password'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* Assigned Subjects */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Teaching Subjects (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={form.subjectsText}
                  onChange={(e) => setForm({ ...form, subjectsText: e.target.value })}
                  placeholder="Data Structures, Algorithms, Computer Networks"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Subjects faculty is authorized to teach and enter marks for.
                </p>
              </div>

              {/* Structured Class Allocations */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-800">
                      Assigned Class Rosters &amp; Batches
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Allocate Course, Branch, Semester, Section, and Subject for each class.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddClassRow}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Class</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {form.assignedClasses.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-xs"
                    >
                      <input
                        type="text"
                        placeholder="Course (e.g. B.Tech)"
                        value={row.course}
                        onChange={(e) => handleClassRowChange(idx, 'course', e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Branch (e.g. CSE)"
                        value={row.branch}
                        onChange={(e) => handleClassRowChange(idx, 'branch', e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-1">
                        <select
                          value={row.semester}
                          onChange={(e) => handleClassRowChange(idx, 'semester', e.target.value)}
                          className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={s.toString()}>Sem {s}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Sec"
                          value={row.section}
                          onChange={(e) => handleClassRowChange(idx, 'section', e.target.value)}
                          className="p-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Subject Name"
                        value={row.subject}
                        onChange={(e) => handleClassRowChange(idx, 'subject', e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveClassRow(idx)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold text-center"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingId ? 'Save Changes & Assignments' : 'Register Faculty'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
