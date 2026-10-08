import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Search, Filter, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Rooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomNumber: '', building: '', capacity: 60, isLab: false });
  const [submitting, setSubmitting] = useState(false);

  const fetchRooms = async () => {
    try {
      const data = await apiClient('/rooms');
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load rooms", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient('/rooms', { method: 'POST', body: JSON.stringify({...newRoom, capacity: parseInt(newRoom.capacity as any)}) });
      setShowModal(false);
      setNewRoom({ roomNumber: '', building: '', capacity: 60, isLab: false });
      fetchRooms();
    } catch (err) {
      alert('Failed to add room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await apiClient(`/rooms/${id}`, { method: 'DELETE' });
      fetchRooms();
    } catch (err) {
      alert('Failed to delete room');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Room Management</h1>
          <p className="text-slate-500 font-medium mt-1">Manage physical classrooms, labs, and capacities.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition">
          <Plus size={18} /> Add Room
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Room</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                <input required type="text" value={newRoom.roomNumber} onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Building</label>
                <input type="text" value={newRoom.building} onChange={e => setNewRoom({...newRoom, building: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                <input required type="number" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value as any})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={newRoom.isLab} onChange={e => setNewRoom({...newRoom, isLab: e.target.checked})} id="isLab" />
                <label htmlFor="isLab" className="text-sm font-medium text-slate-700">Is Lab</label>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Room No</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Type</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Capacity</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Building</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Status</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">No rooms found</td></tr>
                ) : rooms.map((room, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-bold text-slate-900">{room.roomNumber}</td>
                    <td className="py-4 px-4 font-medium text-slate-800">{room.isLab ? 'Lab' : 'Classroom'}</td>
                    <td className="py-4 px-4 text-slate-600">{room.capacity}</td>
                    <td className="py-4 px-4 text-slate-600">{room.building || 'Main Block'}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${room.status === 'FREE_BY_TIMETABLE' || room.status === 'REPORTED_FREE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {room.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button onClick={() => handleDelete(room.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
