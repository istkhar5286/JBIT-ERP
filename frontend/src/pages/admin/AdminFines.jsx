import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { AlertTriangle, Plus, Trash2, Edit2, Search, CheckCircle2, RefreshCw } from 'lucide-react';

export const AdminFines = () => {
  const [fines, setFines] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reason, setReason] = useState('Late Fee');
  const [amount, setAmount] = useState('500');

  const fetchFinesAndStudents = async () => {
    try {
      setLoading(true);
      const [finesRes, studentsRes] = await Promise.all([
        api.get('/admin/reports/fines'),
        api.get('/admin/students', { params: { limit: 100 } })
      ]);

      if (finesRes.data?.success) {
        setFines(finesRes.data.data.rows);
      }
      if (studentsRes.data?.success) {
        setStudents(studentsRes.data.data.students);
        if (studentsRes.data.data.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studentsRes.data.data.students[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load fines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinesAndStudents();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setReason('Late Fee');
    setAmount('500');
    setModalOpen(true);
  };

  const handleOpenEdit = (fine) => {
    setIsEditing(true);
    setEditingId(fine._id);
    setSelectedStudentId(fine.studentId?._id || fine.studentId);
    setReason(fine.reason);
    setAmount(fine.amount);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/admin/fines/${editingId}`, {
          reason,
          amount: Number(amount)
        });
      } else {
        await api.post('/admin/fines', {
          studentId: selectedStudentId,
          reason,
          amount: Number(amount)
        });
      }
      setModalOpen(false);
      fetchFinesAndStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving fine');
    }
  };

  const handleToggleStatus = async (fine) => {
    const nextStatus = fine.status === 'UNPAID' ? 'PAID' : 'UNPAID';
    try {
      await api.put(`/admin/fines/${fine._id}`, { status: nextStatus });
      fetchFinesAndStudents();
    } catch (err) {
      alert('Failed to update fine status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this fine record?')) {
      try {
        await api.delete(`/admin/fines/${id}`);
        fetchFinesAndStudents();
      } catch (err) {
        alert('Failed to delete fine');
      }
    }
  };

  const filteredFines = fines.filter((f) => {
    const student = f.studentId || {};
    const matchSearch =
      f.reason?.toLowerCase().includes(search.toLowerCase()) ||
      student.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      student.universityRollNumber?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Fine Management & Penalties</h1>
          <p className="text-xs text-slate-500 mt-1">
            Impose late fees, library charges, attendance fines, and track automated due updates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFinesAndStudents}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Impose New Fine
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, or fine category..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="UNPAID">Unpaid Only</option>
          <option value="PAID">Paid Only</option>
        </select>
      </div>

      {/* Fines Table */}
      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} height="h-12" />
          </div>
        ) : filteredFines.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No fines matching the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Fine Category / Reason</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Imposed Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFines.map((f) => {
                  const student = f.studentId || {};
                  return (
                    <tr key={f._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {student.fullName || 'Student'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-indigo-700 font-semibold">
                        {student.universityRollNumber || '-'}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {f.reason}
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-slate-900 text-sm">
                        {formatCurrency(f.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {formatDate(f.imposedDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => handleToggleStatus(f)} title="Click to toggle status">
                          <StatusBadge status={f.status} />
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(f)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            {f.status === 'UNPAID' ? 'Mark Paid' : 'Mark Unpaid'}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(f)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title="Edit Fine"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(f._id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete Fine"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add / Edit Fine Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Update Fine' : 'Impose Fine on Student'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {!isEditing && (
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Select Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none"
              >
                {students.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.fullName} ({st.universityRollNumber} - Sem {st.semester})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Fine Reason / Category *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none"
            >
              <option value="Late Fee">Late Fee</option>
              <option value="Library Fine">Library Fine</option>
              <option value="Attendance Fine">Attendance Fine</option>
              <option value="Examination Fine">Examination Fine</option>
              <option value="Other College Fine">Other College Fine</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Fine Amount (INR) *</label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-bold focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700"
            >
              {isEditing ? 'Save Changes' : 'Impose Fine'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
