import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ScanAndPayModal from '../../components/common/ScanAndPayModal';
import {
  Home,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Receipt,
  CreditCard,
  Building2,
  Calendar,
  Send,
  MessageSquare,
  CalendarCheck,
  Bell,
  Phone,
  Shield,
  Loader2,
  X,
  Plus,
  RefreshCw,
  Sparkles,
  BedDouble,
  FileCheck,
  QrCode
} from 'lucide-react';

export const StudentHostel = () => {
  const [statusData, setStatusData] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, complaints, outings, notices, payments
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [pendingApp, setPendingApp] = useState(null);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI_QR');
  const [roomType, setRoomType] = useState('Double Sharing');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forms
  const [complaintForm, setComplaintForm] = useState({
    subject: '',
    category: 'ELECTRICAL',
    description: ''
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [outingForm, setOutingForm] = useState({
    departureDate: '',
    expectedReturnDate: '',
    reason: '',
    parentContact: '',
    leaveType: 'DAY_OUTING'
  });
  const [submittingOuting, setSubmittingOuting] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [statusRes, optionsRes] = await Promise.all([
        api.get('/hostel/my-status'),
        api.get('/hostel/options')
      ]);

      if (statusRes.data?.success) {
        setStatusData(statusRes.data.data);
      }
      if (optionsRes.data?.success) {
        setOptions(optionsRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hostel status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleOpenApply = (hostel) => {
    setSelectedHostel(hostel);
    setApplyModalOpen(true);
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!selectedHostel) return;

    try {
      setProcessingPayment(true);
      setError('');
      setSuccess('');

      // Step 1: Submit Application
      const applyRes = await api.post('/hostel/apply', {
        hostelId: selectedHostel._id,
        preferredBlock: selectedHostel.blocks?.[0] || 'Block A',
        preferredRoomType: roomType
      });

      const application = applyRes.data?.data;
      if (!application?._id) {
        throw new Error('Application could not be created');
      }

      setPendingApp(application);
      setApplyModalOpen(false);
      setQrModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit hostel application. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleQrPaymentSubmit = async ({ utrNumber, screenshotBase64 }) => {
    if (!pendingApp?._id) return;
    try {
      setProcessingPayment(true);
      setError('');
      setSuccess('');

      const res = await api.post('/hostel/submit-qr-payment', {
        applicationId: pendingApp._id,
        utrNumber,
        paymentScreenshot: screenshotBase64
      });

      if (res.data?.success) {
        setSuccess('Hostel payment submitted successfully! Status is PENDING admin verification. Your bed will be allocated upon approval.');
        setQrModalOpen(false);
        setPendingApp(null);
        await fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit hostel payment. Please verify your UTR and screenshot.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadAllocationCard = async (allocationId) => {
    try {
      const response = await api.get(`/hostel/allocation-card/${allocationId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hostel_Allocation_Card.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download allocation card.');
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const response = await api.get(`/hostel/receipt/${paymentId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hostel_Fee_Receipt.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download fee receipt.');
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      setSubmittingComplaint(true);
      setError('');
      setSuccess('');
      const res = await api.post('/hostel/complaints', complaintForm);
      if (res.data?.success) {
        setSuccess('Maintenance complaint logged successfully! Warden will review it shortly.');
        setComplaintForm({ subject: '', category: 'ELECTRICAL', description: '' });
        fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleSubmitOuting = async (e) => {
    e.preventDefault();
    try {
      setSubmittingOuting(true);
      setError('');
      setSuccess('');
      const res = await api.post('/hostel/outing', outingForm);
      if (res.data?.success) {
        setSuccess('Gate pass request submitted to Warden for review.');
        setOutingForm({
          departureDate: '',
          expectedReturnDate: '',
          reason: '',
          parentContact: '',
          leaveType: 'DAY_OUTING'
        });
        fetchStatus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit outing request');
    } finally {
      setSubmittingOuting(false);
    }
  };

  const isAllocated = statusData?.isAllocated;
  const allocation = statusData?.allocation;
  const application = statusData?.application;
  const complaints = statusData?.complaints || [];
  const outings = statusData?.outings || [];
  const notices = statusData?.notices || [];
  const payments = statusData?.payments || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold tracking-wider uppercase mb-2">
            <Building2 className="w-4 h-4" /> Campus Living Experience
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Hostel Accommodation Portal</h1>
          <p className="text-emerald-100/80 text-sm mt-1 max-w-xl">
            JB Institute of Technology provides secure, fully furnished on-campus residential facilities with 24/7 security, high-speed Wi-Fi, and nutritious mess food.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="self-start md:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition backdrop-blur-sm flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
          <p className="text-sm font-medium">Checking your hostel allocation & records...</p>
        </div>
      ) : isAllocated && allocation ? (
        /* =================== ALLOCATED RESIDENT VIEW =================== */
        <div className="space-y-6">
          {/* Active Bed Allocation Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Active Campus Resident
                </div>
                <h2 className="text-2xl md:text-3xl font-black">
                  {allocation.hostelName}
                </h2>
                <p className="text-emerald-100 text-sm">
                  Block: <span className="font-bold">{allocation.block}</span> · Floor: <span className="font-bold">{allocation.floor}</span>
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                    <span className="block text-[10px] uppercase font-bold text-emerald-200">Assigned Room</span>
                    <span className="text-xl font-black">Room {allocation.roomNumber}</span>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                    <span className="block text-[10px] uppercase font-bold text-emerald-200">Bed Number</span>
                    <span className="text-xl font-black">{allocation.bedNumber}</span>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                    <span className="block text-[10px] uppercase font-bold text-emerald-200">Academic Year</span>
                    <span className="text-xl font-black">{allocation.academicYear || '2024-2025'}</span>
                  </div>
                </div>
              </div>

              {/* PDF Actions */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                <button
                  onClick={() => handleDownloadAllocationCard(allocation._id)}
                  className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" /> Allocation Card (PDF)
                </button>

                {application?.paymentId && (
                  <button
                    onClick={() => handleDownloadReceipt(application.paymentId)}
                    className="px-5 py-3 bg-emerald-950/40 hover:bg-emerald-950/60 border border-white/20 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 text-sm backdrop-blur-md"
                  >
                    <Receipt className="w-4 h-4" /> Fee Receipt (PDF)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Hostel Guidelines & Warden
            </button>

            <button
              onClick={() => setActiveTab('notices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'notices'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" /> Notice Board ({notices.length})
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'complaints'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Grievances & Repairs ({complaints.length})
            </button>

            <button
              onClick={() => setActiveTab('outings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'outings'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" /> Gate Passes & Outings ({outings.length})
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> Payment Records
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" /> Hostel Incharge & Warden Desk
                </h3>
                <p className="text-xs text-slate-500">
                  For immediate assistance, maintenance emergency, medical support, or leave validation:
                </p>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Hostel Warden</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {allocation.wardenName || 'Campus Chief Warden'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Emergency Phone</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {allocation.wardenContact || '+91 9876543210'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Campus Security Control</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">24x7 Main Gate Gatehouse</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold block mb-1">Standard Mess & Entry Timings:</span>
                  <ul className="list-disc list-inside space-y-1 text-emerald-800 dark:text-emerald-300">
                    <li>Breakfast: 7:30 AM – 9:00 AM</li>
                    <li>Lunch: 12:30 PM – 2:00 PM</li>
                    <li>Dinner: 8:00 PM – 9:30 PM</li>
                    <li>Mandatory Evening Gate Closing: 8:00 PM (Strict)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Home className="w-5 h-5 text-emerald-600" /> Residential Guidelines
                </h3>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                  <p>1. <strong>Quiet Hours:</strong> Silence must be maintained in corridors and study rooms between 10:00 PM and 6:00 AM.</p>
                  <p>2. <strong>Gate Passes:</strong> Any outing beyond campus gates after 6:00 PM requires a verified gate pass approved by the Warden.</p>
                  <p>3. <strong>Electrical Appliances:</strong> High-wattage heaters or immersion rods are strictly forbidden for fire safety.</p>
                  <p>4. <strong>Room Cleanliness:</strong> Rooms are inspected periodically by the hostel committee. Please log maintenance requests for plumbing/electrical fixes promptly.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTICES */}
          {activeTab === 'notices' && (
            <div className="space-y-4">
              {notices.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No Active Notices</p>
                  <p className="text-xs text-slate-400">Hostel announcements from the warden will appear here.</p>
                </div>
              ) : (
                notices.map(n => (
                  <div key={n._id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {n.category || 'ANNOUNCEMENT'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{n.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{n.description}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" /> Log Maintenance Ticket
                </h3>
                <form onSubmit={handleSubmitComplaint} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Issue Category</label>
                    <select
                      value={complaintForm.category}
                      onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <option value="ELECTRICAL">Electrical (Fan, Light, Switch)</option>
                      <option value="PLUMBING">Plumbing (Tap, Shower, Flush)</option>
                      <option value="CLEANLINESS">Room / Washroom Cleanliness</option>
                      <option value="MESS_FOOD">Mess / Meal Quality</option>
                      <option value="INTERNET">Wi-Fi / Internet</option>
                      <option value="OTHER">Other Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Subject</label>
                    <input
                      type="text"
                      value={complaintForm.subject}
                      onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                      placeholder="e.g. Ceiling fan making loud noise"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                    <textarea
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                      placeholder="Please specify room details and problem..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingComplaint}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingComplaint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Submit Complaint
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Your Logged Tickets</h3>
                {complaints.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs">
                    No active maintenance tickets logged.
                  </div>
                ) : (
                  complaints.map(c => (
                    <div key={c._id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{c.subject}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                          c.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : c.status === 'PROCESSING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{c.description}</p>
                      {c.wardenRemarks && (
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-900 dark:text-blue-200">
                          <span className="font-bold block text-[10px] uppercase">Warden Action:</span>
                          {c.wardenRemarks}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: OUTINGS / GATE PASSES */}
          {activeTab === 'outings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-600" /> Apply for Gate Pass
                </h3>
                <form onSubmit={handleSubmitOuting} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Departure Time</label>
                    <input
                      type="datetime-local"
                      value={outingForm.departureDate}
                      onChange={(e) => setOutingForm({ ...outingForm, departureDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Expected Return</label>
                    <input
                      type="datetime-local"
                      value={outingForm.expectedReturnDate}
                      onChange={(e) => setOutingForm({ ...outingForm, expectedReturnDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Parent Contact</label>
                    <input
                      type="tel"
                      value={outingForm.parentContact}
                      onChange={(e) => setOutingForm({ ...outingForm, parentContact: e.target.value })}
                      placeholder="Parent's phone number"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Reason / Destination</label>
                    <textarea
                      value={outingForm.reason}
                      onChange={(e) => setOutingForm({ ...outingForm, reason: e.target.value })}
                      placeholder="e.g. Visiting market / Doctor appointment"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingOuting}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingOuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Request Gate Pass
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Your Gate Passes & Leaves</h3>
                {outings.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs">
                    No outing requests logged yet.
                  </div>
                ) : (
                  outings.map(o => (
                    <div key={o._id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {new Date(o.departureDate).toLocaleDateString('en-IN')} Outing
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                          o.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : o.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : o.status === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 italic">"{o.reason}"</p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-4">
                        <span>Dep: {new Date(o.departureDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>Exp Return: {new Date(o.expectedReturnDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {o.wardenRemarks && (
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-800 dark:text-emerald-200">
                          <span className="font-bold">Warden Note:</span> {o.wardenRemarks}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Hostel Fee Receipts</h3>
              {payments.length === 0 && !application?.paymentId ? (
                <p className="text-xs text-slate-400">No payment receipts found.</p>
              ) : (
                <div className="space-y-3">
                  {payments.map(p => (
                    <div key={p._id} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">Txn: {p.transactionId}</div>
                      </div>
                      <button
                        onClick={() => handleDownloadReceipt(p._id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF Receipt
                      </button>
                    </div>
                  ))}

                  {application?.paymentId && payments.length === 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          ₹{Number(application.paymentAmount || 45000).toLocaleString('en-IN')}
                        </span>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Receipt: {application.receiptNumber || 'RCPT-HST'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadReceipt(application.paymentId)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF Receipt
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* =================== NOT ALLOCATED / NEW APPLICATION VIEW =================== */
        <div className="space-y-8">
          {/* Status banner if pending verification */}
          {application && application.status === 'PENDING_VERIFICATION' && (
            <div className="p-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl flex items-start gap-4">
              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-full uppercase">
                    Pending Verification
                  </span>
                  <h3 className="font-bold text-base text-amber-900 dark:text-amber-100">
                    Hostel Payment Submitted for {application.hostelName}
                  </h3>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Your UPI / QR payment of ₹{Number(application.feeAmount || application.paymentAmount || 45000).toLocaleString('en-IN')} (UTR: <strong className="font-mono">{application.utrNumber || 'Submitted'}</strong>) has been received and is awaiting administrative verification.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Once verified and approved by the college accounts desk, your bed will be allocated and your official Allocation Card will be generated automatically.
                </p>
              </div>
            </div>
          )}

          {/* Status banner if payment was rejected */}
          {application && application.status === 'PAYMENT_REJECTED' && (
            <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-3xl flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-full uppercase">
                    Payment Rejected
                  </span>
                  <h3 className="font-bold text-base text-rose-900 dark:text-rose-100">
                    Payment Verification Rejected
                  </h3>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  <strong>Reason:</strong> {application.rejectionReason || 'Transaction reference or screenshot could not be verified by the accounts office.'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Please review the details and submit a new application with the correct transaction reference / screenshot.
                </p>
              </div>
            </div>
          )}

          {/* Status banner if pending / waitlisted */}
          {application && application.status === 'WAITLISTED' && (
            <div className="p-6 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-3xl flex items-start gap-4">
              <Clock className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-base text-purple-900 dark:text-purple-200">
                  Priority Waitlisted for {application.hostelName}
                </h3>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Your hostel fee payment (₹{application.paymentAmount}) is confirmed and secured. As soon as an occupant vacates or a new bed is activated, Warden will assign your room.
                </p>
              </div>
            </div>
          )}

          {/* Available Hostels Grid */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Available Hostel Options</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your preferred residential wing, review fees and amenities, and apply online.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {options.map(hostel => {
                const availBeds = hostel.availableBeds ?? 0;
                const isFull = availBeds <= 0;

                return (
                  <div
                    key={hostel._id}
                    className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between p-6 space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {hostel.hostelType} HOSTEL
                          </span>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {hostel.hostelName}
                          </h3>
                          <p className="text-xs text-slate-500">{hostel.building || 'Campus Residence Block'}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            ₹{Number(hostel.hostelFee || 45000).toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Per Academic Year</span>
                        </div>
                      </div>

                      {/* Fee Breakdown */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl text-xs space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Annual Fee Structure:</span>
                        <div className="grid grid-cols-2 gap-2 text-slate-500 dark:text-slate-400">
                          <div>• Room Rent: ₹{hostel.feeBreakdown?.roomFee || 20000}</div>
                          <div>• Mess / Dining: ₹{hostel.feeBreakdown?.messFee || 15000}</div>
                          <div>• Admission: ₹{hostel.feeBreakdown?.admissionFee || 5000}</div>
                          <div>• Security Deposit: ₹{hostel.feeBreakdown?.securityDeposit || 5000}</div>
                        </div>
                      </div>

                      {/* Facilities */}
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Amenities Included:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(hostel.facilities || ['High-Speed Wi-Fi', 'Mess', '24x7 Security', 'RO Purified Water']).map((fac, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-medium">
                              {fac}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Capacity Status */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500">
                          Warden: <strong className="text-slate-800 dark:text-slate-200">{hostel.wardenName}</strong>
                        </span>
                        <span className={`font-bold ${isFull ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {isFull ? 'No Vacant Beds (Waitlist Only)' : `${availBeds} Beds Available`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenApply(hostel)}
                      className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                        isFull
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      {isFull ? 'Apply for Waitlist & Reserve' : 'Apply & Pay Hostel Fee'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Payment & Application Modal */}
      {applyModalOpen && selectedHostel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <CreditCard className="w-5 h-5" />
                <span>Hostel Admission & Payment</span>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProceedToPayment} className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl space-y-1">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedHostel.hostelName} ({selectedHostel.hostelType})
                </h4>
                <p className="text-xs text-slate-500">
                  Annual All-inclusive Hostel Accommodation & Mess Fee
                </p>
                <div className="pt-2 text-2xl font-black text-emerald-600">
                  ₹{Number(selectedHostel.hostelFee || 45000).toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Select Room Preference
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Single Room">Single Room (AC / Attached)</option>
                  <option value="Double Sharing">Double Sharing (Standard)</option>
                  <option value="Triple Sharing">Triple Sharing (Economy)</option>
                </select>
              </div>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                <QrCode className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <strong className="block font-bold">Secure Official QR Payment:</strong>
                  In the next step, scan the official JBIT College UPI QR Code, enter your UTR reference, and upload payment receipt screenshot for verification.
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {processingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                  <QrCode className="w-4 h-4" />
                  Proceed to Scan & Pay ₹{Number(selectedHostel.hostelFee || 45000).toLocaleString('en-IN')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual UPI QR Scan & Pay Modal */}
      <ScanAndPayModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        amount={pendingApp?.feeAmount || selectedHostel?.hostelFee || 45000}
        purpose={`Hostel Fee - ${selectedHostel?.hostelName || 'Accommodation'} (${roomType})`}
        isSubmitting={processingPayment}
        onSubmit={handleQrPaymentSubmit}
      />
    </div>
  );
};
export default StudentHostel;
