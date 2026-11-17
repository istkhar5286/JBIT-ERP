import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calculator,
  ArrowRight,
  RefreshCw,
  Loader2,
  Users,
  Wallet,
  ExternalLink,
  SlidersHorizontal,
  Plus,
  Trash2,
  Send,
  Calendar,
  Layers,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';

export const AdminFees = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial tab from query param ?tab=clear | ?tab=pending | ?tab=overdue | ?tab=config | ?tab=structures
  const searchParams = new URLSearchParams(location.search);
  const paramTab = searchParams.get('tab')?.toUpperCase();
  const initialTab = ['CLEAR', 'PENDING', 'OVERDUE', 'CONFIG', 'STRUCTURES', 'REFUNDS'].includes(paramTab)
    ? paramTab
    : 'PENDING';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Detailed student fee record
  const [studentFeeDetails, setStudentFeeDetails] = useState(null);
  const [loadingFeeDetails, setLoadingFeeDetails] = useState(false);

  // Fee Form State (Itemized breakdown)
  const [tuitionFee, setTuitionFee] = useState(0);
  const [examFee, setExamFee] = useState(0);
  const [registrationFee, setRegistrationFee] = useState(0);
  const [libraryFee, setLibraryFee] = useState(0);
  const [labFee, setLabFee] = useState(0);
  const [hostelFee, setHostelFee] = useState(0);
  const [transportFee, setTransportFee] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [lateFineRule, setLateFineRule] = useState({
    enabled: false,
    fineType: 'FIXED',
    amount: 100,
    gracePeriodDays: 7
  });

  // Waiver / Scholarship form state
  const [waiverTitle, setWaiverTitle] = useState('');
  const [waiverAmount, setWaiverAmount] = useState('');
  const [waiverReason, setWaiverReason] = useState('');
  const [applyingWaiver, setApplyingWaiver] = useState(false);

  // Installment configuration form state
  const [installmentCount, setInstallmentCount] = useState(2);
  const [configuringInstallments, setConfiguringInstallments] = useState(false);

  // Reminder form state
  const [reminderType, setReminderType] = useState('DUE');
  const [customReminderNote, setCustomReminderNote] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState('');

  // Master Fee Structures state
  const [feeStructures, setFeeStructures] = useState([]);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [newStructure, setNewStructure] = useState({
    course: 'B.Tech',
    branch: 'Computer Science and Engineering',
    semester: 1,
    academicYear: '2024-2025',
    tuitionFee: 45000,
    examFee: 3000,
    registrationFee: 2000,
    libraryFee: 1500,
    labFee: 2500,
    hostelFee: 0,
    transportFee: 0,
    otherCharges: 1000
  });
  const [creatingStructure, setCreatingStructure] = useState(false);

  // Refund recording state
  const [refundSearch, setRefundSearch] = useState('');
  const [refundPayments, setRefundPayments] = useState([]);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [recordingRefund, setRecordingRefund] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students', { params: { limit: 200 } });
      if (res.data?.success) {
        const studentList = res.data.data.students || [];
        setStudents(studentList);
        if (studentList.length > 0 && !selectedStudent) {
          selectStudentForEditing(studentList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      setLoadingStructures(true);
      const res = await api.get('/admin/fee-structures');
      if (res.data?.success) {
        setFeeStructures(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load fee structures:', err);
    } finally {
      setLoadingStructures(false);
    }
  };

  const loadStudentFeeDetails = async (studentId) => {
    try {
      setLoadingFeeDetails(true);
      const res = await api.get(`/admin/fees/${studentId}`);
      if (res.data?.success) {
        const feeData = res.data.data.fee;
        const summary = res.data.data.summary;
        setStudentFeeDetails(res.data.data);

        // Populate form fields
        setTuitionFee(feeData.tuitionFee || 0);
        setExamFee(feeData.examFee || 0);
        setRegistrationFee(feeData.registrationFee || 0);
        setLibraryFee(feeData.libraryFee || 0);
        setLabFee(feeData.labFee || 0);
        setHostelFee(feeData.hostelFee || 0);
        setTransportFee(feeData.transportFee || 0);
        setOtherCharges(feeData.otherCharges || 0);
        if (feeData.lateFineRule) {
          setLateFineRule({
            enabled: !!feeData.lateFineRule.enabled,
            fineType: feeData.lateFineRule.fineType || 'FIXED',
            amount: feeData.lateFineRule.amount || 100,
            gracePeriodDays: feeData.lateFineRule.gracePeriodDays || 7
          });
        }
      }
    } catch (err) {
      console.error('Failed to load student fee details:', err);
    } finally {
      setLoadingFeeDetails(false);
    }
  };

  const selectStudentForEditing = (st) => {
    setSelectedStudent(st);
    setSuccessMessage('');
    setErrorMessage('');
    setReminderSuccess('');
    loadStudentFeeDetails(st._id);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (activeTab === 'STRUCTURES') {
      fetchFeeStructures();
    } else if (activeTab === 'REFUNDS') {
      fetchRefundPayments();
    }
  }, [activeTab]);

  const handleSaveFees = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await api.put(`/admin/fees/${selectedStudent._id}`, {
        tuitionFee: Number(tuitionFee),
        examFee: Number(examFee),
        registrationFee: Number(registrationFee),
        libraryFee: Number(libraryFee),
        labFee: Number(labFee),
        hostelFee: Number(hostelFee),
        transportFee: Number(transportFee),
        otherCharges: Number(otherCharges),
        lateFineRule
      });

      if (res.data?.success) {
        setSuccessMessage('Fee components and late fine rules saved! Financial balance recalculated.');
        await loadStudentFeeDetails(selectedStudent._id);
        fetchStudents();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update fee');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyWaiver = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !waiverAmount || !waiverTitle) return;
    setApplyingWaiver(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await api.post(`/admin/fees/${selectedStudent._id}/waivers`, {
        title: waiverTitle,
        amount: Number(waiverAmount),
        reason: waiverReason
      });

      if (res.data?.success) {
        setSuccessMessage(`Scholarship / Waiver "${waiverTitle}" applied successfully!`);
        setWaiverTitle('');
        setWaiverAmount('');
        setWaiverReason('');
        await loadStudentFeeDetails(selectedStudent._id);
        fetchStudents();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to apply waiver');
    } finally {
      setApplyingWaiver(false);
    }
  };

  const handleRemoveWaiver = async (waiverId) => {
    if (!selectedStudent || !window.confirm('Are you sure you want to remove this scholarship/waiver?')) return;
    try {
      const res = await api.delete(`/admin/fees/${selectedStudent._id}/waivers/${waiverId}`);
      if (res.data?.success) {
        setSuccessMessage('Waiver removed successfully.');
        await loadStudentFeeDetails(selectedStudent._id);
        fetchStudents();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to remove waiver');
    }
  };

  const handleGenerateInstallments = async () => {
    if (!selectedStudent) return;
    setConfiguringInstallments(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const count = Number(installmentCount);
      const totalBase =
        Number(tuitionFee) +
        Number(examFee) +
        Number(registrationFee) +
        Number(libraryFee) +
        Number(labFee) +
        Number(hostelFee) +
        Number(transportFee) +
        Number(otherCharges);

      const perInst = Math.round(totalBase / count);
      const now = new Date();
      const installmentsPayload = [];

      for (let i = 1; i <= count; i++) {
        const dueDate = new Date(now);
        dueDate.setMonth(dueDate.getMonth() + (i - 1) * 2);
        installmentsPayload.push({
          installmentNumber: i,
          title: `Installment ${i} of ${count}`,
          amount: i === count ? totalBase - perInst * (count - 1) : perInst,
          dueDate: dueDate.toISOString().slice(0, 10)
        });
      }

      const res = await api.post(`/admin/fees/${selectedStudent._id}/installments`, {
        installments: installmentsPayload
      });

      if (res.data?.success) {
        setSuccessMessage(`Configured ${count} installment schedule successfully!`);
        await loadStudentFeeDetails(selectedStudent._id);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to configure installments');
    } finally {
      setConfiguringInstallments(false);
    }
  };

  const handleSendReminder = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSendingReminder(true);
    setReminderSuccess('');

    try {
      const res = await api.post('/admin/fees/reminders/send', {
        studentId: selectedStudent._id,
        reminderType,
        customNote: customReminderNote
      });

      if (res.data?.success) {
        setReminderSuccess(`Reminder email sent successfully to ${selectedStudent.email}!`);
        setCustomReminderNote('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    setCreatingStructure(true);
    try {
      const res = await api.post('/admin/fee-structures', newStructure);
      if (res.data?.success) {
        alert('Master fee structure template created successfully!');
        fetchFeeStructures();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create fee structure');
    } finally {
      setCreatingStructure(false);
    }
  };

  const handleDeleteStructure = async (id) => {
    if (!window.confirm('Delete this fee structure template?')) return;
    try {
      await api.delete(`/admin/fee-structures/${id}`);
      fetchFeeStructures();
    } catch (err) {
      alert('Failed to delete structure');
    }
  };

  const fetchRefundPayments = async () => {
    try {
      const res = await api.get('/admin/payments', { params: { status: 'SUCCESS', limit: 50 } });
      if (res.data?.success) {
        setRefundPayments(res.data.data.payments);
      }
    } catch (err) {
      console.error('Failed to load payments for refund:', err);
    }
  };

  const handleRecordRefund = async (e) => {
    e.preventDefault();
    if (!selectedPaymentForRefund || !refundAmount || !refundReason) return;
    setRecordingRefund(true);

    try {
      const res = await api.post(`/admin/payments/${selectedPaymentForRefund._id}/refund`, {
        refundAmount: Number(refundAmount),
        reason: refundReason
      });

      if (res.data?.success) {
        alert(`Refund of ₹${refundAmount} recorded successfully! Fee balance updated.`);
        setSelectedPaymentForRefund(null);
        setRefundAmount('');
        setRefundReason('');
        fetchRefundPayments();
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record refund');
    } finally {
      setRecordingRefund(false);
    }
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !search ||
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.universityRollNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.mobileNumber?.includes(search);

    const matchesCourse = !courseFilter || s.course === courseFilter;
    const matchesSem = !semesterFilter || s.semester === Number(semesterFilter);

    return matchesSearch && matchesCourse && matchesSem;
  });

  const pendingStudents = filteredStudents.filter(
    (s) => s.feeSummary?.status === 'PENDING' || s.feeSummary?.status === 'PARTIAL' || s.feeSummary?.remainingDue > 0
  );

  const overdueStudents = filteredStudents.filter(
    (s) => s.feeSummary?.status === 'OVERDUE' || (s.feeSummary?.remainingDue > 0 && s.feeSummary?.totalLateFines > 0)
  );

  const clearStudents = filteredStudents.filter(
    (s) => s.feeSummary?.status === 'CLEAR' || s.feeSummary?.remainingDue === 0
  );

  // Compute preview calculations
  const totalComponents =
    Number(tuitionFee) +
    Number(examFee) +
    Number(registrationFee) +
    Number(libraryFee) +
    Number(labFee) +
    Number(hostelFee) +
    Number(transportFee) +
    Number(otherCharges);

  const existingWaiversTotal = (studentFeeDetails?.fee?.waivers || []).reduce((acc, w) => acc + (w.amount || 0), 0);
  const existingLateFine = studentFeeDetails?.summary?.totalLateFines || 0;
  const existingPaid = studentFeeDetails?.summary?.totalPaid || 0;
  const previewPayable = totalComponents + existingLateFine - existingWaiversTotal;
  const previewRemaining = Math.max(0, previewPayable - existingPaid);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Institutional Fee Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            JB Institute of Technology &bull; Tuition breakdown, installment schedules, scholarships, waivers & refunds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStudents();
              if (selectedStudent) loadStudentFeeDetails(selectedStudent._id);
            }}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'PENDING'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <span>Pending Fees</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
            {pendingStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('OVERDUE')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'OVERDUE'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Overdue Fees</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'OVERDUE' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'}`}>
            {overdueStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CLEAR')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'CLEAR'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Clear Fees</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'CLEAR' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            {clearStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONFIG')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'CONFIG'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Student Fee & Installment Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('STRUCTURES')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'STRUCTURES'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Master Course Structures</span>
        </button>

        <button
          onClick={() => setActiveTab('REFUNDS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'REFUNDS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Refunds & Adjustments</span>
        </button>
      </div>

      {/* FILTER BAR FOR CATEGORIZED LISTS */}
      {['PENDING', 'OVERDUE', 'CLEAR'].includes(activeTab) && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-soft">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Roll, Email, Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="">All Courses</option>
            <option value="B.Tech">B.Tech</option>
            <option value="BCA">BCA</option>
            <option value="MCA">MCA</option>
            <option value="BBA">BBA</option>
            <option value="Diploma">Diploma</option>
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      )}

      {/* TAB 1: PENDING / OVERDUE / CLEAR LISTS */}
      {['PENDING', 'OVERDUE', 'CLEAR'].includes(activeTab) && (
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {activeTab === 'PENDING' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                {activeTab === 'OVERDUE' && <AlertTriangle className="h-5 w-5 text-rose-500" />}
                {activeTab === 'CLEAR' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                <span>
                  {activeTab === 'PENDING' && 'Students with Pending Balances'}
                  {activeTab === 'OVERDUE' && 'Students with Overdue Balances & Late Fines'}
                  {activeTab === 'CLEAR' && 'Students with Fully Cleared Fees (Outstanding = ₹0)'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Authoritative financial status calculated with base fees, late fines and scholarships
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <LoadingSkeleton count={5} height="h-12" />
            ) : (activeTab === 'PENDING' ? pendingStudents : activeTab === 'OVERDUE' ? overdueStudents : clearStudents).length === 0 ? (
              <div className="py-14 text-center text-xs text-slate-400">
                No students found in this category.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-3">Student Name</th>
                    <th className="px-3 py-3">Roll Number</th>
                    <th className="px-3 py-3">Course / Sem</th>
                    <th className="px-3 py-3">Total Payable</th>
                    <th className="px-3 py-3">Total Paid</th>
                    <th className="px-3 py-3">Scholarship</th>
                    <th className="px-3 py-3">Late Fine</th>
                    <th className="px-3 py-3">Pending Due</th>
                    <th className="px-3 py-3">Fee Status</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeTab === 'PENDING' ? pendingStudents : activeTab === 'OVERDUE' ? overdueStudents : clearStudents).map((st) => (
                    <tr key={st._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3 font-bold text-slate-900">{st.fullName}</td>
                      <td className="px-3 py-3 font-mono font-bold text-indigo-700">{st.universityRollNumber}</td>
                      <td className="px-3 py-3 text-slate-600">{st.course} (Sem {st.semester})</td>
                      <td className="px-3 py-3 font-bold text-slate-800">{formatCurrency(st.feeSummary?.totalPayable)}</td>
                      <td className="px-3 py-3 font-bold text-emerald-700">{formatCurrency(st.feeSummary?.totalPaid)}</td>
                      <td className="px-3 py-3 text-sky-700 font-semibold">{formatCurrency(st.feeSummary?.waiverTotal || 0)}</td>
                      <td className="px-3 py-3 text-amber-700 font-semibold">{formatCurrency(st.feeSummary?.totalLateFines || 0)}</td>
                      <td className="px-3 py-3 font-black text-sm">
                        <span className={st.feeSummary?.remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {formatCurrency(st.feeSummary?.remainingDue || 0)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase border ${
                            st.feeSummary?.status === 'CLEAR'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : st.feeSummary?.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {st.feeSummary?.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              selectStudentForEditing(st);
                              setActiveTab('CONFIG');
                            }}
                            className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => navigate(`/admin/students/${st._id}`)}
                            className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                            title="360 Student Profile"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
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
      )}

      {/* TAB 2: STUDENT FEE & INSTALLMENT CONFIGURATION */}
      {activeTab === 'CONFIG' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student Selector List */}
          <div className="rounded-2xl bg-white p-5 shadow-soft border border-slate-100 flex flex-col h-[760px]">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {loading ? (
                <LoadingSkeleton count={6} height="h-16" />
              ) : filteredStudents.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">No students found.</p>
              ) : (
                filteredStudents.map((st) => (
                  <button
                    key={st._id}
                    onClick={() => selectStudentForEditing(st)}
                    className={`w-full text-left rounded-xl p-3 border transition-all text-xs ${
                      selectedStudent?._id === st._id
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{st.fullName}</p>
                        <p className="font-mono text-[11px] text-slate-500">{st.universityRollNumber}</p>
                      </div>
                      <span className={`font-black text-[11px] ${st.feeSummary?.remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        Due: {formatCurrency(st.feeSummary?.remainingDue)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">{st.course} &bull; Sem {st.semester}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Full Student Fee Editor */}
          <div className="lg:col-span-2 space-y-6">
            {selectedStudent ? (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedStudent.fullName} &bull; Fee Breakdown & Financial Control
                      </h3>
                      <p className="text-xs text-slate-500">
                        Roll: <span className="font-mono font-bold text-indigo-700">{selectedStudent.universityRollNumber}</span> &bull; {selectedStudent.course} (Sem {selectedStudent.semester}) &bull; {selectedStudent.email}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/students/${selectedStudent._id}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>360° Profile</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {successMessage && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 font-medium">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Real-time Dynamic Financial Simulation Card */}
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                      <Calculator className="h-4 w-4 text-indigo-600" />
                      <span>Dynamic Balance Sheet (Real-time Formula Preview)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                      <div className="rounded-xl bg-white p-3 border border-indigo-100">
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Base Itemized Fees</p>
                        <p className="text-base font-black text-indigo-900 mt-0.5">{formatCurrency(totalComponents)}</p>
                        <p className="text-[10px] text-slate-400">Sum of 8 components</p>
                      </div>

                      <div className="rounded-xl bg-white p-3 border border-indigo-100">
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Scholarships / Waivers</p>
                        <p className="text-base font-black text-sky-700 mt-0.5">-{formatCurrency(existingWaiversTotal)}</p>
                        <p className="text-[10px] text-slate-400">Deducted from payable</p>
                      </div>

                      <div className="rounded-xl bg-white p-3 border border-indigo-100">
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Total Late Fines</p>
                        <p className="text-base font-black text-amber-700 mt-0.5">+{formatCurrency(existingLateFine)}</p>
                        <p className="text-[10px] text-slate-400">Computed overdue</p>
                      </div>

                      <div className="rounded-xl bg-white p-3 border border-indigo-100">
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Remaining Balance Due</p>
                        <p className="text-base font-black text-rose-600 mt-0.5">{formatCurrency(previewRemaining)}</p>
                        <p className="text-[10px] text-slate-400">After ₹{existingPaid} paid</p>
                      </div>
                    </div>
                  </div>

                  {/* Itemized Fee Breakdown Form */}
                  <form onSubmit={handleSaveFees} className="space-y-6">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Itemized Fee Structure Components (INR)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tuition Fee</label>
                        <input
                          type="number"
                          min="0"
                          value={tuitionFee}
                          onChange={(e) => setTuitionFee(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Exam Fee</label>
                        <input
                          type="number"
                          min="0"
                          value={examFee}
                          onChange={(e) => setExamFee(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Registration Fee</label>
                        <input
                          type="number"
                          min="0"
                          value={registrationFee}
                          onChange={(e) => setRegistrationFee(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Library Fee</label>
                        <input
                          type="number"
                          min="0"
                          value={libraryFee}
                          onChange={(e) => setLibraryFee(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Lab / Workshop Fee</label>
                        <input
                          type="number"
                          min="0"
                          value={labFee}
                          onChange={(e) => setLabFee(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Hostel Fee</label>
                        <input
                          type="number"
                          min="0"
                          value={hostelFee}
                          onChange={(e) => setHostelFee(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Transport Fee</label>
                        <input
                          type="number"
                          min="0"
                          value={transportFee}
                          onChange={(e) => setTransportFee(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Other Charges</label>
                        <input
                          type="number"
                          min="0"
                          value={otherCharges}
                          onChange={(e) => setOtherCharges(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Late Fine Rule Box */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Automatic Late Fine Configuration
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={lateFineRule.enabled}
                            onChange={(e) => setLateFineRule({ ...lateFineRule, enabled: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          Enable Late Fine Rule
                        </label>
                      </div>

                      {lateFineRule.enabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rule Type</label>
                            <select
                              value={lateFineRule.fineType}
                              onChange={(e) => setLateFineRule({ ...lateFineRule, fineType: e.target.value })}
                              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                            >
                              <option value="FIXED">Fixed Amount</option>
                              <option value="PER_DAY">Per Day Overdue</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fine Amount (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={lateFineRule.amount}
                              onChange={(e) => setLateFineRule({ ...lateFineRule, amount: Number(e.target.value) })}
                              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Grace Period (Days)</label>
                            <input
                              type="number"
                              min="0"
                              value={lateFineRule.gracePeriodDays}
                              onChange={(e) => setLateFineRule({ ...lateFineRule, gracePeriodDays: Number(e.target.value) })}
                              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving Components & Recalculating...
                        </>
                      ) : (
                        'Save Fee Structure & Recalculate Balance'
                      )}
                    </button>
                  </form>
                </div>

                {/* Section: Installments Management */}
                <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        Installment Payment Schedule
                      </h4>
                      <p className="text-xs text-slate-500">
                        Configured installment portions, due dates, paid tracking & auto-status
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(Number(e.target.value))}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
                      >
                        <option value={2}>2 Installments</option>
                        <option value={3}>3 Installments</option>
                        <option value={4}>4 Installments</option>
                      </select>
                      <button
                        onClick={handleGenerateInstallments}
                        disabled={configuringInstallments}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
                      >
                        {configuringInstallments ? 'Generating...' : 'Auto-Generate Schedule'}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {(studentFeeDetails?.fee?.installments || []).length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        No installments configured yet. Click "Auto-Generate Schedule" above to divide the fee.
                      </p>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Installment Title</th>
                            <th className="px-3 py-2">Due Date</th>
                            <th className="px-3 py-2">Amount</th>
                            <th className="px-3 py-2">Paid</th>
                            <th className="px-3 py-2">Remaining</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentFeeDetails.fee.installments.map((inst, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2.5 font-bold text-slate-700">{inst.installmentNumber}</td>
                              <td className="px-3 py-2.5 font-bold text-slate-900">{inst.title}</td>
                              <td className="px-3 py-2.5 text-slate-600">{formatDate(inst.dueDate)}</td>
                              <td className="px-3 py-2.5 font-bold text-slate-800">{formatCurrency(inst.amount)}</td>
                              <td className="px-3 py-2.5 font-bold text-emerald-700">{formatCurrency(inst.paidAmount || 0)}</td>
                              <td className="px-3 py-2.5 font-bold text-rose-600">{formatCurrency(inst.remainingAmount || (inst.amount - (inst.paidAmount || 0)))}</td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    inst.status === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : inst.status === 'OVERDUE'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {inst.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Section: Scholarships & Waivers */}
                <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        Scholarships & Fee Waivers
                      </h4>
                      <p className="text-xs text-slate-500">
                        Direct discounts reducing total payable fee balance
                      </p>
                    </div>
                  </div>

                  {/* Existing Waivers List */}
                  <div className="space-y-2">
                    {(studentFeeDetails?.fee?.waivers || []).length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">No scholarships or waivers applied yet.</p>
                    ) : (
                      studentFeeDetails.fee.waivers.map((w) => (
                        <div
                          key={w._id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{w.title}</p>
                            <p className="text-[11px] text-slate-500">{w.reason || 'Institutional scholarship'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-emerald-700">
                              -{formatCurrency(w.amount)}
                            </span>
                            <button
                              onClick={() => handleRemoveWaiver(w._id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove Waiver"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Waiver Form */}
                  <form onSubmit={handleApplyWaiver} className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Scholarship Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Merit Scholarship"
                        value={waiverTitle}
                        onChange={(e) => setWaiverTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Amount in INR"
                        value={waiverAmount}
                        onChange={(e) => setWaiverAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Reason / Note</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Approval note"
                          value={waiverReason}
                          onChange={(e) => setWaiverReason(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={applyingWaiver}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0"
                        >
                          {applyingWaiver ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Section: Dispatch Fee Reminder */}
                <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Send className="h-4 w-4 text-indigo-600" />
                        Send Fee Reminder Notice via Gmail SMTP
                      </h4>
                      <p className="text-xs text-slate-500">
                        Dispatches institutional notification email to {selectedStudent.email}
                      </p>
                    </div>
                  </div>

                  {reminderSuccess && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{reminderSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendReminder} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Reminder Category</label>
                      <select
                        value={reminderType}
                        onChange={(e) => setReminderType(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      >
                        <option value="DUE">Due Date Approaching</option>
                        <option value="OVERDUE">Overdue Fee Notice</option>
                        <option value="UPCOMING">Upcoming Semester Fee</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Message / Advisory</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Kindly clear prior to semester exam admit card generation."
                          value={customReminderNote}
                          onChange={(e) => setCustomReminderNote(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={sendingReminder}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0"
                        >
                          {sendingReminder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          <span>Send Email</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-16 text-center text-xs text-slate-400 border border-slate-100">
                Select a student from the list to view and manage their fees.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MASTER FEE STRUCTURES TEMPLATES */}
      {activeTab === 'STRUCTURES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Structure Form */}
          <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              Create Master Fee Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Pre-defined fee schedule template for automated assignment to courses & semesters
            </p>

            <form onSubmit={handleCreateStructure} className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course *</label>
                <select
                  value={newStructure.course}
                  onChange={(e) => setNewStructure({ ...newStructure, course: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                >
                  <option value="B.Tech">B.Tech</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="BBA">BBA</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch *</label>
                <input
                  type="text"
                  required
                  value={newStructure.branch}
                  onChange={(e) => setNewStructure({ ...newStructure, branch: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester *</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    required
                    value={newStructure.semester}
                    onChange={(e) => setNewStructure({ ...newStructure, semester: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={newStructure.academicYear}
                    onChange={(e) => setNewStructure({ ...newStructure, academicYear: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Tuition Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStructure.tuitionFee}
                    onChange={(e) => setNewStructure({ ...newStructure, tuitionFee: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Exam Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStructure.examFee}
                    onChange={(e) => setNewStructure({ ...newStructure, examFee: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Registration (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStructure.registrationFee}
                    onChange={(e) => setNewStructure({ ...newStructure, registrationFee: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Library Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStructure.libraryFee}
                    onChange={(e) => setNewStructure({ ...newStructure, libraryFee: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Lab Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStructure.labFee}
                    onChange={(e) => setNewStructure({ ...newStructure, labFee: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Other Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStructure.otherCharges}
                    onChange={(e) => setNewStructure({ ...newStructure, otherCharges: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingStructure}
                className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                {creatingStructure ? 'Saving Template...' : 'Save Template'}
              </button>
            </form>
          </div>

          {/* Existing Structures Table */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-soft border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Active Fee Structure Schedules
            </h3>

            <div className="overflow-x-auto">
              {loadingStructures ? (
                <LoadingSkeleton count={4} height="h-12" />
              ) : feeStructures.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No master fee structures created yet.
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-3">Course / Branch</th>
                      <th className="px-3 py-3">Sem</th>
                      <th className="px-3 py-3">Year</th>
                      <th className="px-3 py-3">Tuition</th>
                      <th className="px-3 py-3">Exam / Lab / Reg</th>
                      <th className="px-3 py-3">Total Template</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {feeStructures.map((fs) => {
                      const total =
                        (fs.tuitionFee || 0) +
                        (fs.examFee || 0) +
                        (fs.registrationFee || 0) +
                        (fs.libraryFee || 0) +
                        (fs.labFee || 0) +
                        (fs.hostelFee || 0) +
                        (fs.transportFee || 0) +
                        (fs.otherCharges || 0);

                      return (
                        <tr key={fs._id} className="hover:bg-slate-50/80">
                          <td className="px-3 py-3">
                            <p className="font-bold text-slate-900">{fs.course}</p>
                            <p className="text-[11px] text-slate-500">{fs.branch}</p>
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-700">Sem {fs.semester}</td>
                          <td className="px-3 py-3 text-slate-600">{fs.academicYear}</td>
                          <td className="px-3 py-3 font-semibold text-slate-800">{formatCurrency(fs.tuitionFee)}</td>
                          <td className="px-3 py-3 text-slate-600">
                            {formatCurrency((fs.examFee || 0) + (fs.labFee || 0) + (fs.registrationFee || 0))}
                          </td>
                          <td className="px-3 py-3 font-black text-indigo-700">{formatCurrency(total)}</td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => handleDeleteStructure(fs._id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Template"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REFUNDS MANAGEMENT */}
      {activeTab === 'REFUNDS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Refund Execution Form */}
          <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-rose-600" />
              Record Institutional Refund
            </h3>
            <p className="text-xs text-slate-500">
              Record verified refund against a transaction. This dynamically updates student's total refunded & remaining due balance.
            </p>

            {selectedPaymentForRefund ? (
              <form onSubmit={handleRecordRefund} className="space-y-4 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-900">
                    Receipt: {selectedPaymentForRefund.receiptNumber}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Student: {selectedPaymentForRefund.studentId?.fullName} ({selectedPaymentForRefund.studentId?.universityRollNumber})
                  </p>
                  <p className="font-black text-emerald-700 text-sm mt-1">
                    Original Amount: {formatCurrency(selectedPaymentForRefund.amount)}
                  </p>
                  {selectedPaymentForRefund.totalRefunded > 0 && (
                    <p className="text-rose-600 font-bold text-[11px]">
                      Already Refunded: {formatCurrency(selectedPaymentForRefund.totalRefunded)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Refund Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedPaymentForRefund.amount - (selectedPaymentForRefund.totalRefunded || 0)}
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-rose-700 focus:border-rose-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Refund *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Overpayment adjustment / Course withdrawal approval"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentForRefund(null)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordingRefund}
                    className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  >
                    {recordingRefund ? 'Recording...' : 'Authorize Refund'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                Select a payment transaction from the table on the right to initiate a refund.
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-soft border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              Recent Reconciled Collections
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-3">Receipt No</th>
                    <th className="px-3 py-3">Student Name</th>
                    <th className="px-3 py-3">Roll No</th>
                    <th className="px-3 py-3">Paid Amount</th>
                    <th className="px-3 py-3">Refunded</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refundPayments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-3 font-mono font-bold text-indigo-700">{p.receiptNumber}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{p.studentId?.fullName || '-'}</td>
                      <td className="px-3 py-3 font-mono text-slate-600">{p.studentId?.universityRollNumber || '-'}</td>
                      <td className="px-3 py-3 font-bold text-emerald-700">{formatCurrency(p.amount)}</td>
                      <td className="px-3 py-3 font-bold text-rose-600">
                        {p.totalRefunded > 0 ? formatCurrency(p.totalRefunded) : '₹0'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedPaymentForRefund(p);
                            setRefundAmount(String(p.amount - (p.totalRefunded || 0)));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                        >
                          Refund
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
