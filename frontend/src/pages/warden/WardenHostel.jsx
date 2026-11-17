import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Home, Plus, Edit2, Phone, Users, Layers, CheckCircle2, AlertCircle, Loader2, X, Building2 } from 'lucide-react';

export const WardenHostel = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    hostelName: '',
    hostelType: 'BOYS',
    building: 'Main Campus Wing',
    wardenName: '',
    wardenContact: '',
    hostelFee: 45000,
    blocksText: 'Block A, Block B',
    floorsText: 'Ground Floor, 1st Floor, 2nd Floor',
    facilitiesText: 'High-speed Wi-Fi, Nutritious Mess, 24x7 Security, RO Purified Water, Gymnasium',
    description: ''
  });

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warden/hostels');
      if (res.data?.success) {
        setHostels(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hostels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const openAddModal = () => {
    setEditingHostel(null);
    setForm({
      hostelName: '',
      hostelType: 'BOYS',
      building: 'Main Campus Wing',
      wardenName: '',
      wardenContact: '',
      hostelFee: 45000,
      blocksText: 'Block A, Block B',
      floorsText: 'Ground Floor, 1st Floor, 2nd Floor',
      facilitiesText: 'High-speed Wi-Fi, Nutritious Mess, 24x7 Security, RO Purified Water',
      description: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (h) => {
    setEditingHostel(h);
    setForm({
      hostelName: h.hostelName,
      hostelType: h.hostelType || 'BOYS',
      building: h.building || 'Main Campus Wing',
      wardenName: h.wardenName || '',
      wardenContact: h.wardenContact || '',
      hostelFee: h.hostelFee || 45000,
      blocksText: (h.blocks || []).join(', '),
      floorsText: (h.floors || []).join(', '),
      facilitiesText: (h.facilities || []).join(', '),
      description: h.description || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        id: editingHostel?._id,
        hostelName: form.hostelName,
        hostelType: form.hostelType,
        building: form.building,
        wardenName: form.wardenName,
        wardenContact: form.wardenContact,
        hostelFee: Number(form.hostelFee) || 45000,
        blocks: form.blocksText.split(',').map((s) => s.trim()).filter(Boolean),
        floors: form.floorsText.split(',').map((s) => s.trim()).filter(Boolean),
        facilities: form.facilitiesText.split(',').map((s) => s.trim()).filter(Boolean),
        description: form.description
      };

      const res = await api.post('/warden/hostels', payload);
      if (res.data?.success) {
        setSuccess(editingHostel ? 'Hostel updated successfully' : 'Hostel created successfully');
        setModalOpen(false);
        fetchHostels();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save hostel');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-teal-600" />
            <span>Campus Hostel Buildings &amp; Infrastructure</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage residential buildings, blocks, floors, capacity, and fee configuration.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Hostel Building</span>
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

      {/* Hostels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hostels.map((h) => (
          <div key={h._id} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900">{h.hostelName}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      h.hostelType === 'GIRLS'
                        ? 'bg-pink-100 text-pink-800 border border-pink-200'
                        : h.hostelType === 'BOYS'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {h.hostelType} HOSTEL
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{h.building || 'Campus Wing'}</p>
                </div>
                <button
                  onClick={() => openEditModal(h)}
                  className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
                  title="Edit Hostel"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              {/* Occupancy Stats Strip */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center mb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Capacity</span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{h.totalBeds || 0} Beds</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Available</span>
                  <p className="text-sm font-black text-emerald-600 mt-0.5">{h.availableBeds || 0} Beds</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">Occupancy</span>
                  <p className="text-sm font-black text-indigo-600 mt-0.5">{h.occupancyPercentage || 0}%</p>
                </div>
              </div>

              {/* Blocks & Floors */}
              <div className="space-y-2 text-xs mb-4">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold">Blocks Configured:</span>
                  <span className="font-bold text-slate-900">{(h.blocks || []).join(', ') || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold">Floors Mapped:</span>
                  <span className="font-bold text-slate-900">{(h.floors || []).join(', ') || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold">Annual / Term Fee:</span>
                  <span className="font-black text-teal-700">₹{Number(h.hostelFee || 45000).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">Amenities &amp; Facilities:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(h.facilities || []).map((fac, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Warden In-Charge */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block">Warden In-Charge</span>
                <span className="font-bold text-slate-900">{h.wardenName || 'Dr. S. K. Verma'}</span>
              </div>
              <a
                href={`tel:${h.wardenContact}`}
                className="flex items-center gap-1 text-teal-700 font-bold hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{h.wardenContact || '+91 9876543210'}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-base font-black text-slate-900 mb-1">
              {editingHostel ? 'Edit Hostel Building' : 'Add New Hostel Building'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Configure building wing, blocks, floors, fee, and warden in-charge.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Hostel Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.hostelName}
                    onChange={(e) => setForm({ ...form, hostelName: e.target.value })}
                    placeholder="e.g. Mandakini Boys Hostel"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Hostel Type
                  </label>
                  <select
                    value={form.hostelType}
                    onChange={(e) => setForm({ ...form, hostelType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600"
                  >
                    <option value="BOYS">Boys Hostel</option>
                    <option value="GIRLS">Girls Hostel</option>
                    <option value="CO-ED">Co-Ed Residential</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Building / Wing Location
                </label>
                <input
                  type="text"
                  value={form.building}
                  onChange={(e) => setForm({ ...form, building: e.target.value })}
                  placeholder="e.g. West Campus Wing"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Blocks (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.blocksText}
                    onChange={(e) => setForm({ ...form, blocksText: e.target.value })}
                    placeholder="Block A, Block B"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Floors (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.floorsText}
                    onChange={(e) => setForm({ ...form, floorsText: e.target.value })}
                    placeholder="Ground Floor, 1st Floor, 2nd Floor"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Warden Name
                  </label>
                  <input
                    type="text"
                    value={form.wardenName}
                    onChange={(e) => setForm({ ...form, wardenName: e.target.value })}
                    placeholder="e.g. Dr. S. K. Verma"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Warden Contact Number
                  </label>
                  <input
                    type="text"
                    value={form.wardenContact}
                    onChange={(e) => setForm({ ...form, wardenContact: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Hostel Annual Fee (INR)
                </label>
                <input
                  type="number"
                  value={form.hostelFee}
                  onChange={(e) => setForm({ ...form, hostelFee: e.target.value })}
                  placeholder="45000"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Facilities &amp; Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.facilitiesText}
                  onChange={(e) => setForm({ ...form, facilitiesText: e.target.value })}
                  placeholder="Wi-Fi, Mess, Power Backup, RO Water, Gym"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingHostel ? 'Save Changes' : 'Create Hostel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
