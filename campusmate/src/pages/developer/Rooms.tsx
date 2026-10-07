import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Search, Filter, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Rooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await apiClient('/rooms');
        setRooms(data);
      } catch (error) {
        console.error("Failed to load rooms", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Room Management</h1>
          <p className="text-slate-500 font-medium mt-1">Manage physical classrooms, labs, and capacities.</p>
        </div>
        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition">
          <Plus size={18} /> Add Room
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search room number..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-50 transition">
            <Filter size={18} /> Filter
          </button>
        </div>

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
                      <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 size={16} /></button>
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
