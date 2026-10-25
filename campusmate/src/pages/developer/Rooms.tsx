import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Loader2,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  X,
  Airplay,
  Wind
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface RoomItem {
  id: string;
  roomNumber: string;
  building?: string;
  block?: string;
  floor?: string;
  capacity: number;
  isAC?: boolean;
  isLab?: boolean;
  equipment?: string;
  status: string;
  notes?: string;
}

export const Rooms = () => {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    building: '',
    block: '',
    floor: '',
    capacity: 60,
    isLab: false,
    isAC: false,
    status: 'FREE_BY_TIMETABLE',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Modal
  const [roomToDelete, setRoomToDelete] = useState<RoomItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchRooms = async () => {
    try {
      const data = await apiClient('/rooms');
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load rooms', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openAddModal = () => {
    setEditingRoom(null);
    setFormError('');
    setRoomForm({
      roomNumber: '',
      building: '',
      block: '',
      floor: '',
      capacity: 60,
      isLab: false,
      isAC: false,
      status: 'FREE_BY_TIMETABLE',
      notes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (room: RoomItem) => {
    setEditingRoom(room);
    setFormError('');
    setRoomForm({
      roomNumber: room.roomNumber,
      building: room.building || '',
      block: room.block || '',
      floor: room.floor || '',
      capacity: room.capacity || 0,
      isLab: Boolean(room.isLab),
      isAC: Boolean(room.isAC),
      status: room.status || 'FREE_BY_TIMETABLE',
      notes: room.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    const payload = {
      ...roomForm,
      capacity: parseInt(roomForm.capacity as any, 10) || 0,
    };

    try {
      if (editingRoom) {
        await apiClient(`/rooms/${editingRoom.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/rooms', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      await fetchRooms();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save room details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMaintenance = async (room: RoomItem) => {
    const nextStatus = room.status === 'MAINTENANCE' ? 'FREE_BY_TIMETABLE' : 'MAINTENANCE';
    const notes = nextStatus === 'MAINTENANCE' ? 'Marked under maintenance by developer' : '';
    try {
      await apiClient(`/rooms/${room.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, notes }),
      });
      await fetchRooms();
    } catch (err) {
      console.error('Failed to toggle room maintenance', err);
    }
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiClient(`/rooms/${roomToDelete.id}`, { method: 'DELETE' });
      setRoomToDelete(null);
      await fetchRooms();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete room.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    const num = (r.roomNumber || '').toLowerCase();
    const bld = (r.building || r.block || '').toLowerCase();
    const matchesSearch = !q || num.includes(q) || bld.includes(q);

    const matchesType =
      filterType === 'ALL'
        ? true
        : filterType === 'LAB'
        ? Boolean(r.isLab)
        : !r.isLab;

    const matchesStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'MAINTENANCE'
        ? r.status === 'MAINTENANCE'
        : filterStatus === 'FREE'
        ? r.status === 'FREE_BY_TIMETABLE' || r.status === 'REPORTED_FREE'
        : r.status !== 'FREE_BY_TIMETABLE' && r.status !== 'REPORTED_FREE';

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl shadow-xs border border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Room & Facilities Management</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Manage classrooms, labs, capacities, and maintenance availability for examinations and events.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:opacity-95 transition"
        >
          <Plus size={18} /> Add Room
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl shadow-xs border border-[var(--color-border)] space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-[var(--color-muted)]" size={18} />
          <input
            type="text"
            placeholder="Search rooms by number, building, or block..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--glass-sub-surface)] border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-[#19A3E9] text-sm text-[var(--color-text)] font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--color-muted)]">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="CLASSROOM">Classrooms</option>
              <option value="LAB">Laboratories</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--color-muted)]">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="FREE">Vacant Now</option>
              <option value="MAINTENANCE">Under Maintenance (Unavailable)</option>
              <option value="OCCUPIED">In Use / Scheduled</option>
            </select>
          </div>

          {(searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('ALL');
                setFilterStatus('ALL');
              }}
              className="text-xs text-blue-600 hover:underline ml-auto font-semibold"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl shadow-xs border border-[var(--color-border)]">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)] text-xs font-semibold uppercase">
                  <th className="py-3 px-4">Room No</th>
                  <th className="py-3 px-4">Type & Facilities</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-[var(--color-muted)]">
                      No rooms found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => {
                    const isUnderMaintenance = room.status === 'MAINTENANCE';
                    const isFree =
                      room.status === 'FREE_BY_TIMETABLE' || room.status === 'REPORTED_FREE';

                    return (
                      <tr key={room.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                        <td className="py-4 px-4 font-bold text-[var(--color-text)]">
                          {room.roomNumber}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded ${
                                room.isLab
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {room.isLab ? 'Lab' : 'Classroom'}
                            </span>
                            {room.isAC && (
                              <span className="p-1 rounded bg-sky-500/10 text-sky-600" title="Air Conditioned">
                                <Wind size={13} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-[var(--color-text)]">
                          {room.capacity && room.capacity > 0 ? room.capacity : 'Unknown'}
                        </td>
                        <td className="py-4 px-4 text-sm text-[var(--color-muted)]">
                          {room.building || 'Main Block'} {room.floor ? `· Floor ${room.floor}` : ''}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                isUnderMaintenance
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : isFree
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              }`}
                            >
                              {isUnderMaintenance
                                ? 'Under Maintenance'
                                : isFree
                                ? 'Available / Free'
                                : 'In Use'}
                            </span>
                            {room.notes && (
                              <span className="text-[11px] text-[var(--color-muted)] truncate max-w-xs" title={room.notes}>
                                {room.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleMaintenance(room)}
                            title={isUnderMaintenance ? 'Mark room as operational' : 'Mark room under maintenance'}
                            className={`p-2 rounded-lg transition ${
                              isUnderMaintenance
                                ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25'
                                : 'text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            <Wrench size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(room)}
                            title="Edit room details"
                            className="p-2 text-[var(--color-muted)] hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRoomToDelete(room);
                              setDeleteError('');
                            }}
                            title="Delete room"
                            className="p-2 text-[var(--color-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Room Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-[var(--color-border)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
              <h2 className="text-xl font-bold text-[var(--color-text)]">
                {editingRoom ? 'Edit Room & Facilities' : 'Add New Room'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Room Number *</label>
                  <input
                    required
                    type="text"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    placeholder="e.g. 204 or Lab-3"
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--glass-sub-surface)] text-[var(--color-text)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Capacity *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--glass-sub-surface)] text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Building</label>
                  <input
                    type="text"
                    value={roomForm.building}
                    onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                    placeholder="e.g. Academic Block 1"
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--glass-sub-surface)] text-[var(--color-text)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Floor</label>
                  <input
                    type="text"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                    placeholder="e.g. 2nd Floor"
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--glass-sub-surface)] text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Operational Status</label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--glass-sub-surface)] text-[var(--color-text)]"
                >
                  <option value="FREE_BY_TIMETABLE">Available / Free</option>
                  <option value="MAINTENANCE">Under Maintenance (Unavailable for Exams/Events)</option>
                  <option value="OCCUPIED_BY_TIMETABLE">In Use / Occupied</option>
                </select>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    checked={roomForm.isLab}
                    onChange={(e) => setRoomForm({ ...roomForm, isLab: e.target.checked })}
                    className="rounded border-[var(--color-border)]"
                  />
                  <span>Laboratory Facility</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    checked={roomForm.isAC}
                    onChange={(e) => setRoomForm({ ...roomForm, isAC: e.target.checked })}
                    className="rounded border-[var(--color-border)]"
                  />
                  <span>Air Conditioned</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Maintenance / Event Notes</label>
                <textarea
                  rows={2}
                  value={roomForm.notes}
                  onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                  placeholder="Optional notice for students and faculty regarding this room..."
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--glass-sub-surface)] text-[var(--color-text)]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--color-muted)] hover:bg-black/5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  {submitting ? 'Saving…' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-[var(--color-border)] space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-500/10 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--color-text)]">Confirm Room Deletion</h3>
                <p className="text-xs text-[var(--color-muted)]">Permanent facility removal</p>
              </div>
            </div>

            <p className="text-sm text-[var(--color-text)]/80">
              Are you sure you want to delete room{' '}
              <strong className="text-[var(--color-text)]">{roomToDelete.roomNumber}</strong>?
            </p>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
              <strong>Timetable Notice:</strong> Any scheduled class lectures or exams mapped to this room will have their location unassigned.
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-500">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setRoomToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-muted)] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                {deleting ? 'Deleting…' : 'Delete Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
