import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Loader2, MapPin } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Cancellations = () => {
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userProfile = await apiClient('/users/me');
        if (userProfile.crAssignment?.sectionId) {
          const tt = await apiClient(`/timetable/section/${userProfile.crAssignment.sectionId}/term/TERM-1`);
          setCancellations(tt.filter((t: any) => t.status === 'CANCELLED'));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cancelled Classes</h1>
          <p className="text-slate-500 font-medium mt-1">Review the log of all cancelled or rescheduled classes.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cancellations.length === 0 ? (
          <div className="col-span-full bg-white/60 backdrop-blur-xl p-10 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-500">
             No cancelled classes found.
          </div>
        ) : cancellations.map((cls) => (
          <div key={cls.id} className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-bl-full flex items-start justify-end p-3">
              <AlertCircle size={20} className="text-rose-500" />
            </div>
            
            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              CANCELLED
            </span>
            
            <h3 className="font-bold text-slate-900 text-lg mt-4">{cls.subject?.name}</h3>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={16} className="text-slate-400" />
                <span className="font-medium">Day {cls.dayOfWeek} • {cls.startTime} - {cls.endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                <span>{cls.room?.roomNumber || 'TBA'}</span>
              </div>
            </div>
            
            {cls.cancellationNote && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase">Note</span>
                <p className="text-sm text-slate-700 mt-1">{cls.cancellationNote}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
