import React, { useState, useEffect } from 'react';
import { Clock, Loader2, MapPin, AlertCircle, Info } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { academicTermService } from '../../services/academicTermService';

export const Timetable = () => {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userProfile, currentTerm] = await Promise.all([apiClient('/users/me'), academicTermService.getCurrent()]);
        if (userProfile.student?.sectionId) {
          const tt = await apiClient(`/timetable/section/${userProfile.student.sectionId}/term/${currentTerm.id}`);
          setTimetable(tt);
        }
      } catch (error) {
        console.error("Failed to load timetable", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center glass p-6 rounded-2xl border border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">My Timetable</h1>
          <p className="text-[var(--color-muted)] font-medium mt-1">Your weekly schedule and class timings.</p>
        </div>
      </div>
      
      <div className="glass p-6 rounded-2xl border border-[var(--color-border)]">
         <div className="space-y-8">
          {days.map((dayName, dayIndex) => {
            const dayClasses = timetable.filter(t => t.dayOfWeek === dayIndex + 1).sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (dayClasses.length === 0) return null;
            
            return (
              <div key={dayName}>
                <h3 className="font-bold text-[var(--color-text)] text-lg mb-4 border-b border-[var(--color-border)] pb-2">{dayName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayClasses.map(cls => (
                    <div key={cls.id} className={`p-4 rounded-xl border ${cls.status === 'CANCELLED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'glass border-[var(--color-border)]'} shadow-sm relative group`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold ${cls.status === 'CANCELLED' ? 'text-rose-400' : 'text-[var(--color-text)]'}`}>{cls.subject?.name}</h4>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                          <Clock size={14} /> {cls.startTime} - {cls.endTime}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                          <MapPin size={14} /> {cls.room?.roomNumber || 'TBA'}
                        </div>
                      </div>
                      {cls.status === 'CANCELLED' && <div className="absolute top-4 right-4 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-2 py-1 rounded">CANCELLED</div>}
                      {cls.status === 'ROOM_CHANGED' && <div className="absolute top-4 right-4 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-2 py-1 rounded">ROOM CHANGED</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {timetable.length === 0 && <p className="text-[var(--color-muted)] text-center py-10">No classes have been scheduled for your section yet. Your CR is probably building it now!</p>}
         </div>
      </div>
    </div>
  );
};
