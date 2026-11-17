import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Home, Plus, User, Phone, CheckCircle2, XCircle, AlertCircle, Loader2, Trash2, X } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const AdminHostel = () => {
  const [activeTab, setActiveTab] = useState('ROOMS'); // 'ROOMS' | 'OUTINGS'
  const [rooms, setRooms] = useState([]);
  const [outings, setOutings] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Room Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [roomForm, setRoomForm] = useState({
    hostelName: 'Mandakini Boys Hostel',
    block: 'A Block',
    floor: '1st',
    roomNumber: '101',
    bedNumber: 'A',
    hostelFee: 45000,
    wardenName: 'Dr. S. K. Verma',
    wardenContact: '+91 9876543210'
  });

  // Assign Bed Modal
  const [assignModal, setAssignModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, oRes, sRes] = await Promise.all([
        api.get('/admin/hostel/rooms'),
        api.get('/admin/hostel/outings'),
        api.get('/admin/students')
      ]);
      if (rRes.data?.success) setRooms(rRes.data.data || []);
      if (oRes.data?.success) setOutings(oRes.data.data || []);
      if (sRes.data?.success) setStudents(sRes.data.data?.students || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hostel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/admin/hostel/rooms', roomForm);
      if (res.data?.success) {
        setSuccess('Hostel bed allocation slot created');
        setShowAddModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room entry');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignBed = async (e) => {
    e.preventDefault();
    if (!selectedRoomId || !selectedStudentId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post(`/admin/hostel/rooms/${selectedRoomId}/assign`, {
        studentId: selectedStudentId,
        action: 'ASSIGN'
      });
      if (res.data?.success) {
        setSuccess('Student assigned to hostel room');
        setAssignModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign student');
    } finally {
      setSaving(false);
    }
  };

  const handleVacateBed = async (roomId) => {
    if (!window.confirm('Vacate this student from the hostel room?')) return;
    try {
      const res = await api.post(`/admin/hostel/rooms/${roomId}/assign`, { action: 'VACATE' });
      if (res.data?.success) {
        setSuccess('Bed vacated and set to available');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to vacate');
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Delete this bed allocation slot?')) return;
    try {
      const res = await api.delete(`/admin/hostel/rooms/${id}`);
      if (res.data?.success) {
        setRooms((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleUpdateOuting = async (hostelId, outingId, status) => {
    try {
      const res = await api.put(`/admin/hostel/outings/${hostelId}/${outingId}`, {
        status,
        wardenRemarks: status === 'APPROVED' ? 'Approved by warden' : 'Declined'
      });
      if (res.data?.success) {
        setSuccess(`Outing request marked as ${status}`);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update outing status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const occupiedCount = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const availableCount = rooms.filter((r) => r.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Home className="h-6 w-6 text-indigo-600" />
            Hostel & Residential Accommodation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage residential rooms, student bed allotments, and verify student gate passes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setShowAddModal(true); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Bed Allocation Slot</span>
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

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Beds</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{rooms.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-emerald-600 uppercase">Occupied Beds</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{occupiedCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-indigo-600 uppercase">Available Beds</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{availableCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('ROOMS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ROOMS' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rooms & Bed Allocations ({rooms.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('OUTINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'OUTINGS' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Outing & Gate Passes ({outings.length})
        </button>
      </div>

      {activeTab === 'ROOMS' ? (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Hostel & Block</th>
                  <th className="py-3 px-4">Room & Bed</th>
                  <th className="py-3 px-4">Occupant Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Warden</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {r.hostelName} ({r.block})
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      Room {r.roomNumber} - Bed {r.bedNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {r.occupantName || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {r.occupantRoll || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {r.wardenName}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === 'OCCUPIED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'AVAILABLE' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoomId(r._id);
                              setSelectedStudentId(students[0]?._id || '');
                              setAssignModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px]"
                          >
                            Assign Student
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleVacateBed(r._id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px]"
                          >
                            Vacate Bed
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(r._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
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
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Room Details</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No outing requests pending or submitted.
                    </td>
                  </tr>
                ) : (
                  outings.map((out, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{out.studentName}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {out.hostelName} &bull; Room {out.roomNumber}-{out.bedNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{out.reason}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(out.departureDate).toLocaleDateString('en-IN')} - {new Date(out.returnDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          out.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : out.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {out.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {out.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateOuting(out.hostelId, out._id, 'APPROVED')}
                              className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateOuting(out.hostelId, out._id, 'REJECTED')}
                              className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px]"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">Create Bed Allocation Slot</h2>
            <p className="text-xs text-slate-500 mb-4">Register new room bed in JBIT campus hostel block.</p>

            <form onSubmit={handleCreateRoom} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Hostel Name</label>
                <input
                  type="text"
                  required
                  value={roomForm.hostelName}
                  onChange={(e) => setRoomForm({ ...roomForm, hostelName: e.target.value })}
                  placeholder="e.g. Mandakini Boys Hostel"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Block</label>
                  <input
                    type="text"
                    required
                    value={roomForm.block}
                    onChange={(e) => setRoomForm({ ...roomForm, block: e.target.value })}
                    placeholder="A Block"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Floor</label>
                  <input
                    type="text"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                    placeholder="1st"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    placeholder="101"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Bed Letter/Number</label>
                  <input
                    type="text"
                    required
                    value={roomForm.bedNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, bedNumber: e.target.value.toUpperCase() })}
                    placeholder="A"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Warden Name</label>
                  <input
                    type="text"
                    value={roomForm.wardenName}
                    onChange={(e) => setRoomForm({ ...roomForm, wardenName: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Warden Contact</label>
                  <input
                    type="text"
                    value={roomForm.wardenContact}
                    onChange={(e) => setRoomForm({ ...roomForm, wardenContact: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  <span>Save Bed Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Bed Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">Assign Student to Bed</h2>
            <p className="text-xs text-slate-500 mb-4">Select student from directory to assign occupancy.</p>

            <form onSubmit={handleAssignBed} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                >
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.fullName} ({st.universityRollNumber} - {st.course})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModal(false)}
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
                  <span>Assign Bed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
