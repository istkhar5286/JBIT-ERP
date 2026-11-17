import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatCard } from '../../components/common/StatCard';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  User,
  CreditCard,
  History,
  CalendarCheck,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Receipt,
  Download,
  Edit2,
  RefreshCw,
  Calculator,
  Loader2
} from 'lucide-react';

export const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('fees'); // 'profile' | 'fees' | 'payments' | 'attendance' | 'fines'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Fee Edit State
  const [academicFeeInput, setAcademicFeeInput] = useState('');
  const [otherChargesInput, setOtherChargesInput] = useState('');
  const [savingFee, setSavingFee] = useState(false);
  const [feeMessage, setFeeMessage] = useState('');

  // Attendance Add Modal State
  const [attModalOpen, setAttModalOpen] = useState(false);
  const [attSubject, setAttSubject] = useState('');
  const [attTotal, setAttTotal] = useState('40');
  const [attAttended, setAttAttended] = useState('35');

  // Fine Add Modal State
  const [fineModalOpen, setFineModalOpen] = useState(false);
  const [fineReason, setFineReason] = useState('Late Fee');
  const [fineAmount, setFineAmount] = useState('500');

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/students/${id}`);
      if (res.data?.success) {
        setData(res.data.data);
        setAcademicFeeInput(res.data.data.feeConfig?.academicFee?.toString() || '0');
        setOtherChargesInput(res.data.data.feeConfig?.otherCharges?.toString() || '0');
      }
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const handleUpdateFees = async (e) => {
    e.preventDefault();
    setSavingFee(true);
    setFeeMessage('');
    try {
      const res = await api.put(`/admin/fees/${id}`, {
        academicFee: Number(academicFeeInput),
        otherCharges: Number(otherChargesInput)
      });
      if (res.data?.success) {
        setFeeMessage('Fee structure updated and recalculations updated in real-time!');
        fetchStudentData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update fee');
    } finally {
      setSavingFee(false);
    }
  };

  const handleAddAttendance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/attendance', {
        studentId: id,
        subject: attSubject,
        totalClasses: Number(attTotal),
        attendedClasses: Number(attAttended)
      });
      setAttModalOpen(false);
      setAttSubject('');
      fetchStudentData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add attendance');
    }
  };

  const handleDeleteAttendance = async (attId) => {
    if (window.confirm('Delete this attendance record?')) {
      try {
        await api.delete(`/admin/attendance/${attId}`);
        fetchStudentData();
      } catch (err) {
        alert('Failed to delete attendance record');
      }
    }
  };

  const handleAddFine = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/fines', {
        studentId: id,
        reason: fineReason,
        amount: Number(fineAmount)
      });
      setFineModalOpen(false);
      fetchStudentData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add fine');
    }
  };

  const handleToggleFineStatus = async (fine) => {
    const nextStatus = fine.status === 'UNPAID' ? 'PAID' : 'UNPAID';
    try {
      await api.put(`/admin/fines/${fine._id}`, { status: nextStatus });
      fetchStudentData();
    } catch (err) {
      alert('Failed to update fine status');
    }
  };

  const handleDeleteFine = async (fineId) => {
    if (window.confirm('Delete this fine record?')) {
      try {
        await api.delete(`/admin/fines/${fineId}`);
        fetchStudentData();
      } catch (err) {
        alert('Failed to delete fine');
      }
    }
  };

  if (loading) {
    return <LoadingSkeleton count={3} height="h-36" />;
  }

  const { student, feeSummary = {}, payments = [], fines = [], attendance = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/students')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students Directory
        </button>
        <button
          onClick={fetchStudentData}
          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Student Profile Header Card */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-soft border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-md">
            {student?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{student?.fullName}</h1>
              <StatusBadge status={student?.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Roll No: <span className="font-mono font-bold text-indigo-700">{student?.universityRollNumber}</span> &bull; Reg: <span className="font-mono text-slate-700">{student?.collegeRegistrationNumber}</span> &bull; {student?.course} (Sem {student?.semester})
            </p>
          </div>
        </div>

        {/* Financial Quick Status */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-right">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Paid</p>
            <p className="text-lg font-black text-emerald-700">{formatCurrency(feeSummary.totalPaid)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3 border border-rose-100 text-right">
            <p className="text-[10px] font-bold uppercase text-rose-600">Remaining Due</p>
            <p className="text-lg font-black text-rose-700">{formatCurrency(feeSummary.remainingDue)}</p>
          </div>
        </div>
      </div>

      {/* 360 Degree Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'fees', label: 'Fee Management & Calculation', icon: CreditCard },
          { id: 'payments', label: `Payments Ledger (${payments.length})`, icon: History },
          { id: 'attendance', label: `Attendance (${attendance.length})`, icon: CalendarCheck },
          { id: 'fines', label: `Fines & Penalties (${fines.length})`, icon: AlertTriangle },
          { id: 'profile', label: 'Personal & Academic Profile', icon: User }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Fee Structure & Management */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Real-time KPI summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard title="Academic Fee" value={formatCurrency(feeSummary.academicFee)} color="indigo" />
            <StatCard title="Other Charges" value={formatCurrency(feeSummary.otherCharges)} color="indigo" />
            <StatCard title="Unpaid Fines" value={formatCurrency(feeSummary.unpaidFineTotal)} color="amber" />
            <StatCard title="Total Payable" value={formatCurrency(feeSummary.totalPayable)} color="purple" />
            <StatCard title="Total Paid" value={formatCurrency(feeSummary.totalPaid)} color="emerald" />
            <StatCard title="Remaining Due" value={formatCurrency(feeSummary.remainingDue)} color="rose" />
          </div>

          {/* Admin Fee Setter Form */}
          <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Set Student Fee Structure</h3>
              <p className="text-xs text-slate-500">
                Updating Academic Fee or Other Charges automatically recomputes Remaining Due and Extra Payments in real time.
              </p>
            </div>

            {feeMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{feeMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateFees} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Total Academic Tuition Fee (INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={academicFeeInput}
                    onChange={(e) => setAcademicFeeInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-semibold focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Other Institutional Charges (INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={otherChargesInput}
                    onChange={(e) => setOtherChargesInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-semibold focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time live simulation preview */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700">Projected Total Payable: </span>
                  <span className="font-extrabold text-indigo-700 text-sm">
                    {formatCurrency(Number(academicFeeInput || 0) + Number(otherChargesInput || 0) + feeSummary.unpaidFineTotal)}
                  </span>
                  <span className="text-slate-400 ml-2">
                    (Fee + Other + ₹{feeSummary.unpaidFineTotal} unpaid fine)
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Projected Due: </span>
                  <span className="font-extrabold text-rose-600 text-sm">
                    {formatCurrency(Math.max((Number(academicFeeInput || 0) + Number(otherChargesInput || 0) + feeSummary.unpaidFineTotal) - feeSummary.totalPaid, 0))}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingFee}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingFee ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Recalculate Fees'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Payments Ledger */}
      {activeTab === 'payments' && (
        <div className="rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Student Payments Ledger</h3>
            <p className="text-xs text-slate-500">Every transaction made by {student?.fullName}</p>
          </div>

          <div className="overflow-x-auto">
            {payments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No payment transactions recorded for this student.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Remaining Due</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{p.transactionId}</td>
                      <td className="px-4 py-3 font-extrabold text-slate-900 text-sm">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(p.paymentDate || p.createdAt)}</td>
                      <td className="px-4 py-3 font-bold text-indigo-700">{p.paymentMethod}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(p.remainingDue)}</td>
                      <td className="px-4 py-3 text-right">
                        {p.status === 'SUCCESS' ? (
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            View
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Attendance Management */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Subject Attendance Records</h3>
            <button
              onClick={() => setAttModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Subject Attendance
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attendance.map((att) => (
              <div key={att._id} className="rounded-2xl bg-white p-5 shadow-soft border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 text-sm">{att.subject}</h4>
                  <button
                    onClick={() => handleDeleteAttendance(att._id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="Delete Record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Attendance %:</span>
                    <span className={`font-bold ${att.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {att.percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Classes Attended:</span>
                    <span className="font-bold text-slate-800">{att.attendedClasses} / {att.totalClasses}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Fines Management */}
      {activeTab === 'fines' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Student Fines & Penalties</h3>
              <p className="text-xs text-slate-500">Unpaid fines directly increment the student's Total Payable fee</p>
            </div>
            <button
              onClick={() => setFineModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" />
              Impose New Fine
            </button>
          </div>

          <div className="rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              {fines.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No fines on record for this student.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Date Imposed</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fines.map((f) => (
                      <tr key={f._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{f.reason}</td>
                        <td className="px-4 py-3.5 font-extrabold text-slate-900 text-sm">{formatCurrency(f.amount)}</td>
                        <td className="px-4 py-3.5 text-slate-600">{formatDate(f.imposedDate)}</td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => handleToggleFineStatus(f)} title="Click to toggle Paid/Unpaid">
                            <StatusBadge status={f.status} />
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleFineStatus(f)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                            >
                              {f.status === 'UNPAID' ? 'Mark Paid' : 'Mark Unpaid'}
                            </button>
                            <button
                              onClick={() => handleDeleteFine(f._id)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Profile Info */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">Complete Student Records</h3>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-bold text-slate-400 uppercase">Student Name</p>
                <p className="text-sm font-semibold text-slate-900">{student?.fullName}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase">Father's Name</p>
                <p className="text-sm font-semibold text-slate-900">{student?.fatherName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-bold text-slate-400 uppercase">Contact Mobile</p>
                <p className="text-sm text-slate-800">{student?.mobile}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase">Student Email</p>
                <p className="text-sm text-slate-800">{student?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-bold text-slate-400 uppercase">University Roll Number</p>
                <p className="text-sm font-mono font-bold text-indigo-700">{student?.universityRollNumber}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase">Registration Number</p>
                <p className="text-sm font-mono font-bold text-slate-800">{student?.collegeRegistrationNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-bold text-slate-400 uppercase">Course & Branch</p>
                <p className="text-sm text-slate-800">{student?.course}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase">Semester / Academic Year</p>
                <p className="text-sm text-slate-800">Sem {student?.semester} ({student?.academicYear})</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Attendance Modal */}
      <Modal isOpen={attModalOpen} onClose={() => setAttModalOpen(false)} title="Add Subject Attendance" maxWidth="max-w-md">
        <form onSubmit={handleAddAttendance} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Subject Name *</label>
            <input
              type="text"
              required
              value={attSubject}
              onChange={(e) => setAttSubject(e.target.value)}
              placeholder="e.g. Distributed Computing"
              className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Total Classes</label>
              <input
                type="number"
                min="1"
                required
                value={attTotal}
                onChange={(e) => setAttTotal(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Attended Classes</label>
              <input
                type="number"
                min="0"
                required
                value={attAttended}
                onChange={(e) => setAttAttended(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setAttModalOpen(false)} className="rounded-xl border px-3 py-1.5">Cancel</button>
            <button type="submit" className="rounded-xl bg-indigo-600 text-white px-4 py-1.5 font-bold">Save</button>
          </div>
        </form>
      </Modal>

      {/* Add Fine Modal */}
      <Modal isOpen={fineModalOpen} onClose={() => setFineModalOpen(false)} title="Impose Disciplinary Fine" maxWidth="max-w-md">
        <form onSubmit={handleAddFine} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Fine Category *</label>
            <select
              value={fineReason}
              onChange={(e) => setFineReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
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
              value={fineAmount}
              onChange={(e) => setFineAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setFineModalOpen(false)} className="rounded-xl border px-3 py-1.5">Cancel</button>
            <button type="submit" className="rounded-xl bg-amber-600 text-white px-4 py-1.5 font-bold">Impose Fine</button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          payment={selectedReceipt}
          student={student}
        />
      )}
    </div>
  );
};
