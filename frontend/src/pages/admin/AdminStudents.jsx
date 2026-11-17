import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  RefreshCw
} from 'lucide-react';

export const AdminStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Add / Edit Form State
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
    academicFee: 65000,
    otherCharges: 5000,
    status: 'active'
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        course: courseFilter,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit
      };
      const res = await api.get('/admin/students', { params });
      if (res.data?.success) {
        setStudents(res.data.data.students);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [courseFilter, statusFilter, pagination.page]);

  // Debounced search trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleOpenAddModal = () => {
    setFormData({
      fullName: '',
      fatherName: '',
      mobile: '',
      email: '',
      universityRollNumber: '',
      collegeRegistrationNumber: '',
      course: 'B.Tech Computer Science & Engineering',
      semester: '1',
      academicYear: '2024-2025',
      academicFee: 65000,
      otherCharges: 5000,
      status: 'active'
    });
    setModalError('');
    setAddModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      fullName: student.fullName,
      fatherName: student.fatherName,
      mobile: student.mobile,
      email: student.email,
      universityRollNumber: student.universityRollNumber,
      collegeRegistrationNumber: student.collegeRegistrationNumber,
      course: student.course,
      semester: student.semester,
      academicYear: student.academicYear,
      status: student.status
    });
    setModalError('');
    setEditModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const res = await api.post('/admin/students', formData);
      if (res.data?.success) {
        setAddModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create student');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const res = await api.put(`/admin/students/${selectedStudent._id}`, formData);
      if (res.data?.success) {
        setEditModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update student');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/students/${student._id}`, { status: newStatus });
      fetchStudents();
    } catch (err) {
      alert('Failed to update student status');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete student ${name}? All associated fee and payment records will also be removed.`)) {
      try {
        await api.delete(`/admin/students/${id}`);
        fetchStudents();
      } catch (err) {
        alert('Failed to delete student');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Student Directory & Enrollment</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student registrations, fee structures, academic status and profiles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStudents}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Student
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Roll Number, Registration No, or Mobile..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="">All Courses</option>
            <option value="B.Tech Computer Science & Engineering">B.Tech CSE</option>
            <option value="B.Tech Mechanical Engineering">B.Tech ME</option>
            <option value="Bachelor of Computer Applications (BCA)">BCA</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} height="h-12" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Course & Sem</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Total Due</th>
                  <th className="px-4 py-3">Total Paid</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const fees = st.feeSummary || {};
                  return (
                    <tr key={st._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{st.fullName}</p>
                        <p className="text-[10px] text-slate-400">Father: {st.fatherName}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold text-indigo-700">{st.universityRollNumber}</p>
                        <p className="font-mono text-[10px] text-slate-400">{st.collegeRegistrationNumber}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800 line-clamp-1">{st.course}</p>
                        <p className="text-[10px] text-slate-500">Sem {st.semester} &bull; {st.academicYear}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-slate-800 font-medium">{st.mobile}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{st.email}</p>
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-rose-600">
                        {formatCurrency(fees.remainingDue)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700">
                        {formatCurrency(fees.totalPaid)}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleStatus(st)}
                          title="Click to toggle active/inactive"
                        >
                          <StatusBadge status={st.status} />
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/students/${st._id}`)}
                            className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50"
                            title="View 360° Profile & Fees"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(st)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                            title="Edit Student"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(st._id, st.fullName)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Student to College ERP"
        maxWidth="max-w-2xl"
      >
        {modalError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Father's Name *</label>
              <input
                type="text"
                required
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Roll Number *</label>
              <input
                type="text"
                required
                value={formData.universityRollNumber}
                onChange={(e) => setFormData({ ...formData, universityRollNumber: e.target.value })}
                placeholder="24BCSE..."
                className="w-full rounded-xl border border-slate-300 p-2 text-sm font-mono uppercase focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Registration No *</label>
              <input
                type="text"
                required
                value={formData.collegeRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, collegeRegistrationNumber: e.target.value })}
                placeholder="REG2024..."
                className="w-full rounded-xl border border-slate-300 p-2 text-sm font-mono uppercase focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Course *</label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Semester</label>
                <input
                  type="text"
                  required
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Year</label>
                <input
                  type="text"
                  required
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Fee Setup Inputs */}
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Academic Fee (INR)</label>
              <input
                type="number"
                value={formData.academicFee}
                onChange={(e) => setFormData({ ...formData, academicFee: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Other Charges (INR)</label>
              <input
                type="number"
                value={formData.otherCharges}
                onChange={(e) => setFormData({ ...formData, otherCharges: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {modalLoading ? 'Saving...' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Student: ${selectedStudent?.fullName}`}
        maxWidth="max-w-xl"
      >
        {modalError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Father's Name</label>
              <input
                type="text"
                required
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Mobile</label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Course</label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Semester</label>
                <input
                  type="text"
                  required
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {modalLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
