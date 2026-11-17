import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Layers,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Loader2,
  X,
  User,
  Building2,
  Trash2,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

export const WardenBeds = () => {
  const [beds, setBeds] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterHostel, setFilterHostel] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    hostelId: '',
    block: 'Block A',
    floor: '1st Floor',
    roomNumber: '',
    roomType: 'DOUBLE',
    bedNumber: 'Bed-1'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bedsRes, hostelsRes] = await Promise.all([
        api.get('/warden/beds'),
        api.get('/warden/hostels')
      ]);

      if (bedsRes.data?.success) {
        setBeds(bedsRes.data.data || []);
      }
      if (hostelsRes.data?.success) {
        setHostels(hostelsRes.data.data || []);
        if (hostelsRes.data.data.length > 0 && !form.hostelId) {
          setForm(prev => ({ ...prev, hostelId: hostelsRes.data.data[0]._id }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch beds data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBed = async (e) => {
    e.preventDefault();
    if (!form.hostelId || !form.roomNumber.trim() || !form.bedNumber.trim()) {
      setError('Please fill in all mandatory bed fields.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await api.post('/warden/beds', form);
      if (res.data?.success) {
        setSuccess(`Bed ${res.data.data?.bedIdentifier || ''} created successfully!`);
        setModalOpen(false);
        setForm({
          hostelId: hostels[0]?._id || '',
          block: 'Block A',
          floor: '1st Floor',
          roomNumber: '',
          roomType: 'DOUBLE',
          bedNumber: 'Bed-1'
        });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bed');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (bedId, newStatus) => {
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/warden/beds/${bedId}/status`, { status: newStatus });
      if (res.data?.success) {
        setSuccess('Bed status updated successfully');
        setBeds(prev => prev.map(b => (b._id === bedId ? res.data.data : b)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bed status');
    }
  };

  const handleDeleteBed = async (bedId, bedIdentifier) => {
    if (!window.confirm(`Are you sure you want to delete bed ${bedIdentifier}?`)) return;
    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/warden/beds/${bedId}`);
      if (res.data?.success) {
        setSuccess('Bed deleted successfully');
        setBeds(prev => prev.filter(b => b._id !== bedId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete bed');
    }
  };

  // Filtered beds
  const filteredBeds = beds.filter(bed => {
    if (filterHostel !== 'ALL') {
      const hId = bed.hostelId?._id || bed.hostelId;
      if (hId !== filterHostel) return false;
    }
    if (filterStatus !== 'ALL' && bed.status !== filterStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const identifier = (bed.bedIdentifier || '').toLowerCase();
      const room = (bed.roomNumber || '').toLowerCase();
      const studentName = (bed.occupantStudentId?.fullName || '').toLowerCase();
      const rollNo = (bed.occupantStudentId?.rollNumber || '').toLowerCase();
      return identifier.includes(q) || room.includes(q) || studentName.includes(q) || rollNo.includes(q);
    }
    return true;
  });

  const totalCount = beds.length;
  const availableCount = beds.filter(b => b.status === 'AVAILABLE').length;
  const occupiedCount = beds.filter(b => b.status === 'OCCUPIED').length;
  const maintenanceCount = beds.filter(b => b.status === 'MAINTENANCE').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-200 text-sm font-semibold tracking-wider uppercase mb-1">
            <Layers className="w-4 h-4" /> Real-time Bed Inventory
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Hostel Bed Master & Occupancy</h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Track bed allocations, room capacities, maintenance states, and current student occupants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-1.5 text-sm font-medium backdrop-blur-sm"
            title="Refresh bed data"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Bed
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Beds</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Available</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{availableCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-rose-200 dark:border-rose-800/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">Occupied</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{occupiedCount}</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400">
            <User className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-800/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Maintenance</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{maintenanceCount}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by bed code, room number, student name or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={filterHostel}
              onChange={(e) => setFilterHostel(e.target.value)}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Hostels</option>
              {hostels.map(h => (
                <option key={h._id} value={h._id}>{h.hostelName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RESERVED">Reserved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bed Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm font-medium">Loading bed inventory...</p>
        </div>
      ) : filteredBeds.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Beds Found</h3>
          <p className="text-slate-500 text-sm mt-1">Try tweaking your search or filter options, or add new beds to the inventory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBeds.map(bed => {
            const isAvail = bed.status === 'AVAILABLE';
            const isOcc = bed.status === 'OCCUPIED';
            const isMaint = bed.status === 'MAINTENANCE';

            return (
              <div
                key={bed._id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md p-5 flex flex-col justify-between ${
                  isAvail
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : isOcc
                    ? 'border-rose-200 dark:border-rose-900/60'
                    : 'border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {bed.hostelId?.hostelName || 'Hostel'}
                      </span>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        {bed.bedIdentifier}
                      </h4>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isAvail
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : isOcc
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {bed.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Block / Floor</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{bed.block} · {bed.floor}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Room / Bed</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Room {bed.roomNumber} ({bed.bedNumber})</span>
                    </div>
                  </div>

                  {/* Occupant Info if occupied */}
                  {isOcc && bed.occupantStudentId && (
                    <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/30 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200">
                        <User className="w-3.5 h-3.5" />
                        <span>{bed.occupantStudentId.fullName}</span>
                      </div>
                      <p className="text-rose-700 dark:text-rose-300 text-[11px] mt-0.5">
                        Roll: {bed.occupantStudentId.rollNumber} · {bed.occupantStudentId.course}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Switcher & Delete Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {bed.status !== 'AVAILABLE' && !isOcc && (
                      <button
                        onClick={() => handleStatusChange(bed._id, 'AVAILABLE')}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg transition"
                      >
                        Make Available
                      </button>
                    )}
                    {bed.status !== 'MAINTENANCE' && !isOcc && (
                      <button
                        onClick={() => handleStatusChange(bed._id, 'MAINTENANCE')}
                        className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg transition"
                      >
                        Maintenance
                      </button>
                    )}
                  </div>

                  {!isOcc && (
                    <button
                      onClick={() => handleDeleteBed(bed._id, bed.bedIdentifier)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Delete bed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Bed Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Add Bed to Inventory</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBed} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Select Hostel <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.hostelId}
                  onChange={(e) => setForm({ ...form, hostelId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {hostels.map(h => (
                    <option key={h._id} value={h._id}>
                      {h.hostelName} ({h.hostelType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Block
                  </label>
                  <input
                    type="text"
                    value={form.block}
                    onChange={(e) => setForm({ ...form, block: e.target.value })}
                    placeholder="e.g. Block A"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    placeholder="e.g. 1st Floor"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Room Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.roomNumber}
                    onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                    placeholder="e.g. 101"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Bed Identifier / Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.bedNumber}
                    onChange={(e) => setForm({ ...form, bedNumber: e.target.value })}
                    placeholder="e.g. Bed-1 or B1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Room Sharing Type
                </label>
                <select
                  value={form.roomType}
                  onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="SINGLE">Single Room</option>
                  <option value="DOUBLE">Double Sharing</option>
                  <option value="TRIPLE">Triple Sharing</option>
                  <option value="FOUR_SHARING">Four Sharing</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default WardenBeds;
