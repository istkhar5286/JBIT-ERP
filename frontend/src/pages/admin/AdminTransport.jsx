import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Bus,
  Plus,
  User,
  Phone,
  MapPin,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Navigation,
  Clock,
  DollarSign,
  Building,
  RefreshCw
} from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const AdminTransport = () => {
  const [activeTab, setActiveTab] = useState('routes'); // 'routes' | 'stops'

  // Route / Fleet State
  const [buses, setBuses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add/Edit Bus Modal
  const [showBusModal, setShowBusModal] = useState(false);
  const [editingBusId, setEditingBusId] = useState(null);
  const [busForm, setBusForm] = useState({
    busNumber: '',
    routeName: '',
    driverName: '',
    driverContact: '',
    transportFee: 18000,
    stopsText: 'Clock Tower (07:15 AM), Ballupur Chowk (07:30 AM), Prem Nagar (07:45 AM), JBIT Campus (08:15 AM)'
  });

  // Assign Student Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignStopName, setAssignStopName] = useState('Prem Nagar');

  // Dehradun Stops State
  const [stops, setStops] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [stopSearch, setStopSearch] = useState('');
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingStopId, setEditingStopId] = useState(null);
  const [stopForm, setStopForm] = useState({
    stopName: '',
    landmark: '',
    pickupTime: '07:30 AM',
    dropTime: '05:30 PM',
    estimatedFee: 18000,
    isCampus: false,
    isActive: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, sRes] = await Promise.all([
        api.get('/admin/transport/buses'),
        api.get('/admin/students')
      ]);
      if (bRes.data?.success) setBuses(bRes.data.data || []);
      if (sRes.data?.success) setStudents(sRes.data.data?.students || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transport buses');
    } finally {
      setLoading(false);
    }
  };

  const fetchStops = async () => {
    try {
      setLoadingStops(true);
      const res = await api.get('/admin/transport/stops');
      if (res.data?.success) {
        setStops(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Dehradun bus stops');
    } finally {
      setLoadingStops(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStops();
  }, []);

  const handleSaveBus = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const stopsArray = busForm.stopsText
        .split(',')
        .map((s) => {
          const trimmed = s.trim();
          const match = trimmed.match(/^(.*?)\s*\((.*?)\)$/);
          if (match) {
            return { stopName: match[1].trim(), pickupTime: match[2].trim(), dropTime: '05:30 PM' };
          }
          return { stopName: trimmed, pickupTime: '07:30 AM', dropTime: '05:30 PM' };
        })
        .filter(Boolean);

      const payload = {
        busNumber: busForm.busNumber.toUpperCase(),
        routeName: busForm.routeName,
        driverName: busForm.driverName,
        driverContact: busForm.driverContact,
        transportFee: busForm.transportFee,
        stops: stopsArray
      };

      if (editingBusId) {
        const res = await api.put(`/admin/transport/buses/${editingBusId}`, payload);
        if (res.data?.success) {
          setSuccess('Bus details updated successfully');
          setShowBusModal(false);
          fetchData();
        }
      } else {
        const res = await api.post('/admin/transport/buses', payload);
        if (res.data?.success) {
          setSuccess('New transport bus route registered');
          setShowBusModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm('Delete this bus route entry?')) return;
    try {
      const res = await api.delete(`/admin/transport/buses/${id}`);
      if (res.data?.success) {
        setBuses((prev) => prev.filter((b) => b._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    if (!selectedBusId || !assignStudentId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post(`/admin/transport/buses/${selectedBusId}/assign`, {
        studentId: assignStudentId,
        stopName: assignStopName,
        action: 'ASSIGN'
      });
      if (res.data?.success) {
        setSuccess('Student added to bus passenger manifest');
        setShowAssignModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign student to route');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async (busId, studentId) => {
    if (!window.confirm('Remove student from bus route?')) return;
    try {
      const res = await api.post(`/admin/transport/buses/${busId}/assign`, {
        studentId,
        action: 'REMOVE'
      });
      if (res.data?.success) {
        setSuccess('Student removed from route manifest');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove');
    }
  };

  // Save / Update Bus Stop
  const handleSaveStop = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingStopId) {
        const res = await api.put(`/admin/transport/stops/${editingStopId}`, stopForm);
        if (res.data?.success) {
          setSuccess('Bus stop updated successfully');
          setShowStopModal(false);
          fetchStops();
        }
      } else {
        const res = await api.post('/admin/transport/stops', stopForm);
        if (res.data?.success) {
          setSuccess('New Dehradun bus stop registered');
          setShowStopModal(false);
          fetchStops();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bus stop');
    } finally {
      setSaving(false);
    }
  };

  // Delete Bus Stop
  const handleDeleteStop = async (id) => {
    if (!window.confirm('Are you sure you want to remove this bus stop?')) return;
    try {
      const res = await api.delete(`/admin/transport/stops/${id}`);
      if (res.data?.success) {
        setStops((prev) => prev.filter((s) => s._id !== id));
        setSuccess('Bus stop removed successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete stop');
    }
  };

  const filteredStops = stops.filter(
    (s) =>
      s.stopName?.toLowerCase().includes(stopSearch.toLowerCase()) ||
      s.landmark?.toLowerCase().includes(stopSearch.toLowerCase())
  );

  if (loading && stops.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-soft border border-slate-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Institutional Bus & Transport Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage college fleet vehicles, configurable Dehradun pickup stops, driver details, and student subscriptions.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'routes'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            Fleet & Routes ({buses.length})
          </button>

          <button
            onClick={() => setActiveTab('stops')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'stops'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            Dehradun Stops ({stops.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 1: FLEET & ROUTES */}
      {/* ==================================================== */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Configured institutional buses running along major Dehradun arterial corridors.</p>
            <button
              type="button"
              onClick={() => {
                setEditingBusId(null);
                setBusForm({
                  busNumber: '',
                  routeName: '',
                  driverName: '',
                  driverContact: '',
                  transportFee: 18000,
                  stopsText: 'Clock Tower (07:15 AM), Ballupur Chowk (07:30 AM), Prem Nagar (07:45 AM), JBIT Campus (08:15 AM)'
                });
                setShowBusModal(true);
                setError('');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Transport Route</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {buses.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                No transport routes configured. Click 'Add Transport Route' above.
              </div>
            ) : (
              buses.map((bus) => (
                <div
                  key={bus._id}
                  className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-black">
                        {bus.busNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {bus.assignedStudents?.length || 0} Subscribed Students
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white">{bus.routeName}</h3>

                    <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 font-medium">Driver</span>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">{bus.driverName}</p>
                      </div>
                      <a
                        href={`tel:${bus.driverContact}`}
                        className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{bus.driverContact}</span>
                      </a>
                    </div>

                    {/* Stops list */}
                    <div className="mt-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stops & Timings:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(bus.stops || []).map((st, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                            {st.stopName} ({st.pickupTime})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Subscribed students list */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Passenger Manifest</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBusId(bus._id);
                            setAssignStudentId(students[0]?._id || '');
                            setShowAssignModal(true);
                          }}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Assign Student</span>
                        </button>
                      </div>

                      {(bus.assignedStudents || []).length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-1">No students registered on this bus.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {bus.assignedStudents.map((st, idx) => (
                            <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-[11px] flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">{st.studentName}</span>{' '}
                                <span className="text-slate-400 font-mono">({st.rollNumber})</span> &bull;{' '}
                                <span className="text-indigo-600 font-semibold">{st.stopName}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveStudent(bus._id, st.studentId)}
                                className="text-rose-500 hover:text-rose-700 font-bold text-[10px] px-1.5 py-0.5"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBusId(bus._id);
                        setBusForm({
                          busNumber: bus.busNumber,
                          routeName: bus.routeName,
                          driverName: bus.driverName,
                          driverContact: bus.driverContact,
                          transportFee: bus.transportFee,
                          stopsText: (bus.stops || []).map((s) => `${s.stopName} (${s.pickupTime})`).join(', ')
                        });
                        setShowBusModal(true);
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit Route"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBus(bus._id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Route"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: CONFIGURABLE DEHRADUN BUS STOPS */}
      {/* ==================================================== */}
      {activeTab === 'stops' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={stopSearch}
                onChange={(e) => setStopSearch(e.target.value)}
                placeholder="Search Dehradun stop or landmark..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <button
              onClick={() => {
                setEditingStopId(null);
                setStopForm({
                  stopName: '',
                  landmark: '',
                  pickupTime: '07:30 AM',
                  dropTime: '05:30 PM',
                  estimatedFee: 18000,
                  isCampus: false,
                  isActive: true
                });
                setShowStopModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Bus Stop</span>
            </button>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-800 shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden">
            {loadingStops ? (
              <div className="py-20 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                <p className="text-xs">Loading Dehradun bus stops...</p>
              </div>
            ) : filteredStops.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No stops found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3.5">Stop Name</th>
                      <th className="px-4 py-3.5">Landmark / Area</th>
                      <th className="px-4 py-3.5">Morning Pickup</th>
                      <th className="px-4 py-3.5">Evening Drop</th>
                      <th className="px-4 py-3.5">Est. Annual Fee</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {filteredStops.map((stop) => (
                      <tr key={stop._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <MapPin className={`w-3.5 h-3.5 ${stop.isCampus ? 'text-emerald-500' : 'text-rose-500'}`} />
                            {stop.stopName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {stop.landmark || '-'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                          {stop.pickupTime || '07:30 AM'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                          {stop.dropTime || '05:30 PM'}
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                          ₹{Number(stop.estimatedFee || 18000).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5">
                          {stop.isCampus ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Main Campus
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                              Dehradun Route
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingStopId(stop._id);
                                setStopForm({
                                  stopName: stop.stopName,
                                  landmark: stop.landmark || '',
                                  pickupTime: stop.pickupTime || '07:30 AM',
                                  dropTime: stop.dropTime || '05:30 PM',
                                  estimatedFee: stop.estimatedFee || 18000,
                                  isCampus: Boolean(stop.isCampus),
                                  isActive: stop.isActive !== undefined ? Boolean(stop.isActive) : true
                                });
                                setShowStopModal(true);
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Edit Stop"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!stop.isCampus && (
                              <button
                                onClick={() => handleDeleteStop(stop._id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Stop"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Bus Modal */}
      {showBusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-black text-slate-900 dark:text-white mb-1">
              {editingBusId ? 'Edit Transport Route' : 'Add Transport Route'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">Register college transport route and schedule.</p>

            <form onSubmit={handleSaveBus} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">Bus Number</label>
                  <input
                    type="text"
                    required
                    value={busForm.busNumber}
                    onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value.toUpperCase() })}
                    placeholder="UK-07-PA-1234"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs font-mono uppercase focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">Annual Fee (₹)</label>
                  <input
                    type="number"
                    value={busForm.transportFee}
                    onChange={(e) => setBusForm({ ...busForm, transportFee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">Route Name</label>
                <input
                  type="text"
                  required
                  value={busForm.routeName}
                  onChange={(e) => setBusForm({ ...busForm, routeName: e.target.value })}
                  placeholder="e.g. Dehradun City Center Express"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">Driver Name</label>
                  <input
                    type="text"
                    required
                    value={busForm.driverName}
                    onChange={(e) => setBusForm({ ...busForm, driverName: e.target.value })}
                    placeholder="Mr. Suresh Singh"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">Driver Contact</label>
                  <input
                    type="text"
                    required
                    value={busForm.driverContact}
                    onChange={(e) => setBusForm({ ...busForm, driverContact: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">Stops & Timings (Comma Separated)</label>
                <textarea
                  rows={2}
                  value={busForm.stopsText}
                  onChange={(e) => setBusForm({ ...busForm, stopsText: e.target.value })}
                  placeholder="Stop 1 (07:15 AM), Stop 2 (07:30 AM)..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowBusModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Route</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Dehradun Stop Modal */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-black text-slate-900 dark:text-white mb-1">
              {editingStopId ? 'Edit Dehradun Bus Stop' : 'Add New Dehradun Bus Stop'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">Add or update configurable pickup stop location.</p>

            <form onSubmit={handleSaveStop} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Stop Name *
                </label>
                <input
                  type="text"
                  required
                  value={stopForm.stopName}
                  onChange={(e) => setStopForm({ ...stopForm, stopName: e.target.value })}
                  placeholder="e.g. Prem Nagar, Ballupur, ISBT..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Landmark / Reference
                </label>
                <input
                  type="text"
                  value={stopForm.landmark}
                  onChange={(e) => setStopForm({ ...stopForm, landmark: e.target.value })}
                  placeholder="e.g. Near Main Market / Flyover"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Pickup Time
                  </label>
                  <input
                    type="text"
                    value={stopForm.pickupTime}
                    onChange={(e) => setStopForm({ ...stopForm, pickupTime: e.target.value })}
                    placeholder="07:30 AM"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Drop Time
                  </label>
                  <input
                    type="text"
                    value={stopForm.dropTime}
                    onChange={(e) => setStopForm({ ...stopForm, dropTime: e.target.value })}
                    placeholder="05:30 PM"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Estimated Annual Fee (₹)
                </label>
                <input
                  type="number"
                  value={stopForm.estimatedFee}
                  onChange={(e) => setStopForm({ ...stopForm, estimatedFee: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCampusCheck"
                  checked={stopForm.isCampus}
                  onChange={(e) => setStopForm({ ...stopForm, isCampus: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isCampusCheck" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  Mark as Main Campus Destination (JBIT)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowStopModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Stop</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Student Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-black text-slate-900 dark:text-white mb-1">Assign Student to Bus Route</h2>
            <p className="text-xs text-slate-500 mb-4">Add student to bus passenger manifest.</p>

            <form onSubmit={handleAssignStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">Select Student</label>
                <select
                  value={assignStudentId}
                  onChange={(e) => setAssignStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                >
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.fullName} ({st.universityRollNumber} - {st.course})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">Designated Pickup Stop</label>
                <input
                  type="text"
                  required
                  value={assignStopName}
                  onChange={(e) => setAssignStopName(e.target.value)}
                  placeholder="e.g. Ballupur Chowk"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransport;
