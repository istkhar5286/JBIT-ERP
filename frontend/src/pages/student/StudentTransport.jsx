import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Bus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Receipt,
  CreditCard,
  MapPin,
  Phone,
  Shield,
  Loader2,
  X,
  Navigation,
  RefreshCw,
  Users,
  Check,
  ArrowRight,
  Compass,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { ScanAndPayModal } from '../../components/common/ScanAndPayModal';
import { formatCurrency } from '../../utils/formatters';

const MAIN_CAMPUS_ADDRESS = 'JB Institute of Technology, 23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197';

export const StudentTransport = () => {
  const [statusData, setStatusData] = useState(null);
  const [buses, setBuses] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Booking Flow State
  const [selectedStop, setSelectedStop] = useState('');
  const [direction, setDirection] = useState('ROUND_TRIP');
  const [selectedBusId, setSelectedBusId] = useState('');
  const [seatMap, setSeatMap] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState(null);
  const [applying, setApplying] = useState(false);
  const [createdApplication, setCreatedApplication] = useState(null);

  // Scan & Pay Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, optionsRes, stopsRes] = await Promise.all([
        api.get('/transport/my-status'),
        api.get('/transport/options'),
        api.get('/transport/stops')
      ]);

      if (statusRes.data?.success) {
        setStatusData(statusRes.data.data);
      }
      if (optionsRes.data?.success) {
        setBuses(optionsRes.data.data || []);
        if (optionsRes.data.data?.length > 0 && !selectedBusId) {
          setSelectedBusId(optionsRes.data.data[0]._id);
        }
      }
      if (stopsRes.data?.success) {
        const fetchedStops = stopsRes.data.data || [];
        setStops(fetchedStops);
        if (fetchedStops.length > 0 && !selectedStop) {
          // Default to first non-campus stop or first stop
          const defaultStop = fetchedStops.find(s => !s.isCampus) || fetchedStops[0];
          setSelectedStop(defaultStop.stopName);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transport details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch real-time seat inventory whenever selected bus changes
  useEffect(() => {
    if (!selectedBusId) return;

    const fetchSeats = async () => {
      try {
        setLoadingSeats(true);
        const res = await api.get(`/transport/bus/${selectedBusId}/seats`);
        if (res.data?.success) {
          setSeatMap(res.data.data.seats || []);
        }
      } catch (err) {
        console.error('Failed to load bus seat layout:', err);
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchSeats();
    setSelectedSeatNumber(null);
  }, [selectedBusId]);

  const activeBus = buses.find(b => b._id === selectedBusId) || buses[0];

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!activeBus) {
      setError('Please select a campus bus route.');
      return;
    }
    if (!selectedStop) {
      setError('Please select your designated pickup location / bus stop.');
      return;
    }

    try {
      setApplying(true);
      setError('');

      // Create or update transport booking application
      const applyRes = await api.post('/transport/apply', {
        busId: activeBus._id,
        stopName: selectedStop,
        destination: MAIN_CAMPUS_ADDRESS,
        direction,
        selectedSeatNumber: selectedSeatNumber || undefined
      });

      if (applyRes.data?.success) {
        const app = applyRes.data.data;
        setCreatedApplication(app);
        setPayModalOpen(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize transport booking.');
    } finally {
      setApplying(false);
    }
  };

  const handleSubmitQrPayment = async ({ utrNumber, paymentScreenshot }) => {
    const appId = createdApplication?._id || statusData?.application?._id;
    if (!appId) {
      setError('No active booking application found. Please try again.');
      return;
    }

    try {
      setSubmittingPayment(true);
      setError('');

      const res = await api.post('/transport/submit-qr-payment', {
        applicationId: appId,
        utrNumber,
        paymentScreenshot
      });

      if (res.data?.success) {
        setPayModalOpen(false);
        setSuccess('Payment details submitted successfully! Your booking is now PENDING administrative verification.');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment details.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDownloadCard = async (allocationId) => {
    try {
      const response = await api.get(`/transport/allocation-card/${allocationId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `JBIT_Transport_Pass_${allocationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download transport pass.');
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const response = await api.get(`/transport/receipt/${paymentId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Transport_Fee_Receipt_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download payment receipt.');
    }
  };

  const isAllocated = statusData?.isAllocated;
  const allocation = statusData?.allocation;
  const application = statusData?.application;
  const isPendingVerification = application?.status === 'PENDING_VERIFICATION';
  const isRejected = application?.status === 'REJECTED' || application?.status === 'PAYMENT_REJECTED';

  return (
    <div className="space-y-6">
      {/* Institutional Commute Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold tracking-wider uppercase">
              <Bus className="w-4 h-4" /> JB Institute of Technology Commute Network
            </div>
            <h1 className="text-2xl md:text-3xl font-black">Campus Transport &amp; Bus Booking</h1>
            <p className="text-blue-100/90 text-xs md:text-sm max-w-2xl leading-relaxed">
              Serving the greater Dehradun valley, Premnagar, Chakrata Road, and surrounding districts directly to the JBIT Main Campus.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-blue-200">
              <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>
                <strong>Main Campus:</strong> 23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197
              </span>
            </div>
          </div>

          <button
            onClick={fetchData}
            className="self-start md:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition backdrop-blur-sm flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-xs shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Checking your campus transport subscription...</p>
        </div>
      ) : isAllocated && allocation ? (
        /* ========================================================================= */
        /* 1. ACTIVE ALLOCATED BUS PASS                                              */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Active Bus Pass &bull; Verified
                </div>
                <h2 className="text-2xl md:text-3xl font-black">
                  Bus {allocation.busNumber} &mdash; {allocation.routeName}
                </h2>
                <div className="space-y-1 text-xs text-blue-100">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                    Designated Boarding Stop: <strong className="text-white">{allocation.stopName}</strong>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-blue-300 shrink-0" />
                    Destination: <strong className="text-white">JBIT Main Campus (Shankarpur)</strong>
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                    <span className="block text-[10px] uppercase font-bold text-blue-200">Allocated Seat</span>
                    <span className="text-xl font-black text-amber-300">Seat #{allocation.seatNumber}</span>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                    <span className="block text-[10px] uppercase font-bold text-blue-200">Driver Incharge</span>
                    <span className="text-sm font-bold block mt-1">{allocation.driverName || 'Campus Fleet Driver'}</span>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                    <span className="block text-[10px] uppercase font-bold text-blue-200">Driver Mobile</span>
                    <span className="text-sm font-bold flex items-center gap-1 mt-1 text-blue-100">
                      <Phone className="w-3.5 h-3.5" /> {allocation.driverContact || '+91 9897001122'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                <button
                  onClick={() => handleDownloadCard(allocation._id)}
                  className="px-5 py-3 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
                >
                  <Download className="w-4 h-4" /> Download Bus Pass (PDF)
                </button>

                {application?.paymentId && (
                  <button
                    onClick={() => handleDownloadReceipt(application.paymentId)}
                    className="px-5 py-3 bg-blue-950/40 hover:bg-blue-950/60 border border-white/20 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 text-xs backdrop-blur-md"
                  >
                    <Receipt className="w-4 h-4" /> Fee Receipt (PDF)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Commute Guidelines & Helpline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" /> Commuter Transit Rules
              </h3>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <p>1. <strong>Boarding Time:</strong> Please arrive at your selected stop 10 minutes prior to pickup time.</p>
                <p>2. <strong>Pass Verification:</strong> Present your official PDF Bus Pass or JBIT ID Card to the bus conductor upon boarding.</p>
                <p>3. <strong>Seat Discipline:</strong> Strictly occupy assigned Seat #{allocation.seatNumber}. Changing seats or reserving seats for others is not permitted.</p>
                <p>4. <strong>Direct Transit:</strong> Buses follow designated Dehradun highway routes directly to the Shankarpur campus.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" /> Fleet Control Desk
              </h3>
              <p className="text-xs text-slate-500">
                Contact the Transport Office for delays, route modifications, or lost property:
              </p>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fleet Supervisor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Sh. Rajesh Sharma</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Direct Helpline</span>
                  <span className="font-bold text-blue-600">+91 (0135) 2698741</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Emergency Mobile</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">+91 9897002233</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. BUS BOOKING & ROUTE SELECTION WORKFLOW                                  */
        /* ========================================================================= */
        <div className="space-y-8">
          {/* Pending Verification Banner */}
          {isPendingVerification && (
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-300 dark:border-amber-800 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-amber-900 dark:text-amber-200">
                      Payment Submitted &bull; Pending Verification
                    </h3>
                    <span className="px-3 py-1 bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 rounded-full text-xs font-bold">
                      PENDING ADMIN APPROVAL
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Your transport fee payment of <strong>{formatCurrency(application.feeAmount)}</strong> with Transaction/UTR Number{' '}
                    <strong className="font-mono">{application.utrNumber || application.transactionId}</strong> has been received. Administration is verifying the settlement against bank records.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <span>Bus: <strong>{application.busNumber}</strong></span>
                    <span>Pickup Stop: <strong>{application.stopName}</strong></span>
                    {application.selectedSeatNumber && (
                      <span>Requested Seat: <strong className="text-amber-700 dark:text-amber-400">Seat #{application.selectedSeatNumber}</strong></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Rejected Banner */}
          {isRejected && (
            <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-3xl shadow-sm flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="font-extrabold text-base text-rose-900 dark:text-rose-200">
                  Payment Verification Rejected
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  {application.rejectionReason || 'The submitted UTR number or screenshot could not be validated with bank settlement records.'}
                </p>
                <button
                  onClick={() => setPayModalOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-Submit Payment Details
                </button>
              </div>
            </div>
          )}

          {/* Booking Configurator Form */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-soft p-6 md:p-8 space-y-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <Compass className="w-3.5 h-3.5" /> Bus Booking / Transport
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Book Campus Bus Seat
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your pickup boarding stop from our Dehradun commute points, pick your bus, reserve your seat, and complete Scan &amp; Pay.
              </p>
            </div>

            <form onSubmit={handleProceedToPayment} className="space-y-8">
              {/* Step 1 & 2: Pickup Stop & Route / Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Pickup Location / Bus Stop */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    1. Pickup Location / Bus Stop <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 pointer-events-none" />
                    <select
                      value={selectedStop}
                      onChange={(e) => setSelectedStop(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs md:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition appearance-none cursor-pointer"
                    >
                      {stops.map((st) => (
                        <option key={st._id || st.stopName} value={st.stopName}>
                          {st.stopName} {st.isCampus ? '(Main Campus)' : ''} {st.pickupTime ? `— Pickup: ${st.pickupTime}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Selectable list of major Dehradun commute stops. Admin configurable.
                  </p>
                </div>

                {/* 2. Destination / Route Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    2. Destination / Commute Route <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ROUND_TRIP', label: 'Two-Way (Round Trip)', sub: 'Both Ways' },
                      { id: 'TO_CAMPUS', label: 'To JBIT Campus', sub: 'Morning Boarding' },
                      { id: 'FROM_CAMPUS', label: 'From JBIT Campus', sub: 'Evening Return' }
                    ].map((rt) => (
                      <button
                        key={rt.id}
                        type="button"
                        onClick={() => setDirection(rt.id)}
                        className={`p-2.5 rounded-2xl border text-center transition ${
                          direction === rt.id
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="block text-xs font-bold">{rt.label}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{rt.sub}</span>
                      </button>
                    ))}
                  </div>

                  {/* Destination Campus Address Display */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                      Campus Destination Point:
                    </span>
                    {MAIN_CAMPUS_ADDRESS}
                  </div>
                </div>
              </div>

              {/* Step 3: Bus Fleet Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  3. Select Bus Fleet
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buses.map((bus) => {
                    const isSelected = selectedBusId === bus._id;
                    const avail = bus.availableSeats ?? 0;
                    const isFull = avail <= 0;

                    return (
                      <div
                        key={bus._id}
                        onClick={() => setSelectedBusId(bus._id)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition relative ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-lg bg-indigo-600 text-white">
                                Bus {bus.busNumber}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                {bus.routeName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                              <span>Driver: <strong>{bus.driverName || 'Driver Incharge'}</strong></span>
                              <span className="mx-2">&bull;</span>
                              <span>Mobile: <strong>{bus.driverContact || '+91 9897001122'}</strong></span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                              {formatCurrency(bus.transportFee || 18000)}
                            </span>
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Annual Fee</span>
                          </div>
                        </div>

                        {/* Capacity / Available status */}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            Total Capacity: <strong>{bus.totalSeats} seats</strong>
                          </span>
                          <span
                            className={`font-bold ${
                              isFull ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isFull ? 'No seats available (Waitlist)' : `${avail} Seats Available`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Available Seat Selector */}
              {activeBus && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        4. View &amp; Select Available Seat &mdash; Bus {activeBus.busNumber}
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Select your preferred seat. Occupied seats are locked and cannot be selected.
                      </span>
                    </div>

                    {/* Seat Legend */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-500"></span>
                        <span className="text-slate-600 dark:text-slate-300 text-[11px]">Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-indigo-600 border border-indigo-700"></span>
                        <span className="text-slate-600 dark:text-slate-300 text-[11px]">Selected</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300 opacity-60"></span>
                        <span className="text-slate-400 text-[11px]">Occupied</span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Map Visual Layout */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-700">
                    {loadingSeats ? (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                        <span className="text-xs">Checking real-time seat status...</span>
                      </div>
                    ) : seatMap.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Loading seat configuration for Bus {activeBus.busNumber}...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Driver Cabin Row */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                          <span className="font-bold text-slate-600 dark:text-slate-300">Front / Entry Door</span>
                          <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                            Driver Cabin
                          </span>
                        </div>

                        {/* Seat Grid: 4 seats per row (2 - Aisle - 2) */}
                        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-2 sm:gap-3 max-w-xl mx-auto">
                          {seatMap.map((seat) => {
                            const isSelected = selectedSeatNumber === seat.seatNumber;
                            const isOccupied = seat.isOccupied;

                            return (
                              <button
                                key={seat.seatNumber}
                                type="button"
                                disabled={isOccupied}
                                onClick={() => setSelectedSeatNumber(isSelected ? null : seat.seatNumber)}
                                title={
                                  isOccupied
                                    ? `Seat #${seat.seatNumber} (Occupied)`
                                    : `Seat #${seat.seatNumber} (Available - Click to select)`
                                }
                                className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                                    : isOccupied
                                    ? 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-300 dark:text-rose-700 cursor-not-allowed opacity-60'
                                    : 'bg-white dark:bg-slate-800 border-2 border-emerald-400/80 text-emerald-800 dark:text-emerald-300 hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer shadow-xs'
                                }`}
                              >
                                <span>#{seat.seatNumber}</span>
                                <span className="text-[9px] uppercase tracking-tighter">
                                  {isSelected ? 'SELECTED' : isOccupied ? 'TAKEN' : 'AVAILABLE'}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Capacity Alert if full */}
                        {activeBus.availableSeats <= 0 && (
                          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>
                              <strong>No seats available</strong> on this bus. Proceeding will add your application to the priority waitlist.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Transport Fee & Proceed Checkout Bar */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                    5. Booking Confirmation Summary
                  </span>
                  <div className="text-sm font-bold flex flex-wrap items-center gap-2">
                    <span>Route: <strong>{selectedStop || 'Pickup Stop'} &rarr; JBIT Main Campus</strong></span>
                    <span>&bull;</span>
                    <span>Bus: <strong>{activeBus?.busNumber}</strong></span>
                    {selectedSeatNumber && (
                      <>
                        <span>&bull;</span>
                        <span className="text-amber-300">Seat: <strong>Seat #{selectedSeatNumber}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-300 block uppercase">Transport Fee</span>
                    <span className="text-2xl font-black text-amber-300">
                      {formatCurrency(activeBus?.transportFee || 18000)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={applying || !activeBus}
                    className="px-6 py-3 rounded-xl font-extrabold text-xs bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {applying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <span>Proceed to Payment</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Integrated Scan & Pay Modal */}
      <ScanAndPayModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        amount={createdApplication?.feeAmount || activeBus?.transportFee || 18000}
        purpose={`Transport Fee - Bus ${createdApplication?.busNumber || activeBus?.busNumber} (${selectedStop} to JBIT Campus)`}
        extraDetails={selectedSeatNumber ? `Reserved: Seat #${selectedSeatNumber}` : null}
        onSubmitPayment={handleSubmitQrPayment}
        submitting={submittingPayment}
      />
    </div>
  );
};

export default StudentTransport;
