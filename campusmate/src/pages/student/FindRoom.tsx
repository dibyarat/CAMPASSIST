import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Airplay, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const FindRoom = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredRooms = rooms.filter(r => 
    r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.building && r.building.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Find a Room</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm p-6">
        {/* Search Form */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by room number or building..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            Current Status
          </h3>
          
          {loading ? (
             <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : filteredRooms.length === 0 ? (
             <div className="text-center text-slate-500 py-10">No rooms found.</div>
          ) : (
            filteredRooms.map((room, i) => {
              const isFree = room.status === 'FREE_BY_TIMETABLE' || room.status === 'REPORTED_FREE';
              return (
                <div key={i} className={`p-4 rounded-xl border ${isFree ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'} flex items-start justify-between`}>
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isFree ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {isFree ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-lg">{room.roomNumber}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${room.isLab ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'}`}>
                          {room.isLab ? 'Lab' : 'Classroom'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-500 mt-1">{room.building || 'Main Block'}</p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Users size={14} className="text-slate-400" />
                          Capacity: {room.capacity}
                        </div>
                        {room.hasProjector && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <Airplay size={14} className="text-slate-400" />
                            Projector
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${isFree ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {room.status.replace(/_/g, ' ')}
                    </span>
                    {isFree && (
                      <div className="mt-3">
                        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 underline">Report in use</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
