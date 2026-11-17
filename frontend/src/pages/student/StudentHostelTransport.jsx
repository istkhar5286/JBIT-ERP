import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Home, Bus, Phone, Calendar, Clock, Plus, Loader2, AlertCircle, CheckCircle2, MapPin, User } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const StudentHostelTransport = () => {
  const [data, setData] = useState({ hostel: null, outingRequests: [], transport: null });
  const [loading, setLoading] = useState(true);
  const [savingOuting, setSavingOuting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOutingModal, setShowOutingModal] = useState(false);

  const [outingForm, setOutingForm] = useState({
    reason: '',
    departureDate: '',
    returnDate: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/hostel-transport');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load facility data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestOuting = async (e) => {
    e.preventDefault();
    setSavingOuting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/student/hostel/outing', outingForm);
      if (res.data?.success) {
        setSuccess('Hostel gate pass / outing request submitted to warden!');
        setShowOutingModal(false);
        setOutingForm({ reason: '', departureDate: '', returnDate: '' });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit outing request');
    } finally {
      setSavingOuting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const { hostel, outingRequests, transport } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Home className="h-6 w-6 text-indigo-600" />
          Campus Residential & Transport Facilities
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review your hostel room allocation, gate passes, bus route timetable, and driver contacts.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hostel Allocation Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Hostel Allocation</h2>
                  <p className="text-xs text-slate-500">Campus Boarding & Resident Desk</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                hostel ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {hostel ? 'Allocated' : 'Day Scholar'}
              </span>
            </div>

            {hostel ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Hostel Name</span>
                    <p className="font-bold text-slate-900 mt-0.5">{hostel.hostelName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Block & Floor</span>
                    <p className="font-bold text-slate-900 mt-0.5">{hostel.block} &bull; Floor {hostel.floor}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Room Number</span>
                    <p className="font-bold text-slate-900 mt-0.5">Room {hostel.roomNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Bed Allotted</span>
                    <p className="font-bold text-indigo-600 mt-0.5">Bed {hostel.bedNumber}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-medium">Warden In-Charge</span>
                    <p className="font-bold text-slate-900 mt-0.5">{hostel.wardenName}</p>
                  </div>
                  <a
                    href={`tel:${hostel.wardenContact}`}
                    className="flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{hostel.wardenContact}</span>
                  </a>
                </div>

                {/* Outing requests section */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-900">Gate Passes / Outing Requests</h3>
                    <button
                      type="button"
                      onClick={() => setShowOutingModal(true)}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Request Gate Pass</span>
                    </button>
                  </div>

                  {outingRequests.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-3 text-center">No active or previous outing requests.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {outingRequests.map((out) => (
                        <div key={out._id} className="p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{out.reason}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(out.departureDate).toLocaleDateString('en-IN')} to {new Date(out.returnDate).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            out.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : out.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {out.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Home className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">Hostel facility not opted</p>
                <p className="text-[11px] text-slate-400 mt-0.5">To apply for hostel room allocation, visit the campus accounts office.</p>
              </div>
            )}
          </div>
        </div>

        {/* Transport Allocation Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Bus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">College Transport</h2>
                  <p className="text-xs text-slate-500">Official Daily Bus Service</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                transport ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {transport ? 'Subscribed' : 'Not Subscribed'}
              </span>
            </div>

            {transport ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Bus Number</span>
                    <p className="font-bold text-slate-900 mt-0.5 font-mono">{transport.busNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Route Name</span>
                    <p className="font-bold text-slate-900 mt-0.5">{transport.routeName}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium">Your Designated Stop</span>
                    <p className="font-bold text-indigo-600 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{transport.stopName}</span>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-medium">Driver In-Charge</span>
                    <p className="font-bold text-slate-900 mt-0.5">{transport.driverName}</p>
                  </div>
                  <a
                    href={`tel:${transport.driverContact}`}
                    className="flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{transport.driverContact}</span>
                  </a>
                </div>

                {/* Route stops timetable */}
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 mb-2">Route Stops & Timings</h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {(transport.stops || []).map((st, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50 text-[11px] flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{st.stopName}</span>
                        <span className="text-slate-500 font-mono">
                          Pickup: {st.pickupTime} &bull; Drop: {st.dropTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Bus className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">College transport not opted</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Contact the administrative transport department to register for campus bus routes.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outing Request Modal */}
      {showOutingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">Request Hostel Gate Pass</h2>
            <p className="text-xs text-slate-500 mb-4">Requests require verification by hostel warden before campus exit.</p>

            <form onSubmit={handleRequestOuting} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Reason for Outing / Leave</label>
                <input
                  type="text"
                  required
                  value={outingForm.reason}
                  onChange={(e) => setOutingForm({ ...outingForm, reason: e.target.value })}
                  placeholder="e.g. Visiting home / Medical appointment"
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Departure Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={outingForm.departureDate}
                  onChange={(e) => setOutingForm({ ...outingForm, departureDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Expected Return Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={outingForm.returnDate}
                  onChange={(e) => setOutingForm({ ...outingForm, returnDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOutingModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOuting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {savingOuting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Submit Gate Pass</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
