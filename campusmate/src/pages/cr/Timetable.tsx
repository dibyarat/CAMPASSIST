import React, { useState, useEffect } from 'react';
import { Calendar, Plus, XCircle, Clock, Loader2, MapPin, Save, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { academicTermService } from '../../services/academicTermService';

export const Timetable = () => {
  const [profile, setProfile] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    subjectName: '',
    roomNumber: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    termId: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userProfile, currentTerm] = await Promise.all([apiClient('/users/me'), academicTermService.getCurrent()]);
        setProfile(userProfile);
        setFormData(current => ({ ...current, termId: currentTerm.id }));

        const [subs, rms] = await Promise.all([
          apiClient('/timetable/subjects'),
          apiClient('/rooms')
        ]);
        setSubjects(subs);
        setRooms(rms);

        if (userProfile.crAssignment?.sectionId) {
          const tt = await apiClient(`/timetable/section/${userProfile.crAssignment.sectionId}/term/${currentTerm.id}`);
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

  const handleCancelClass = async (id: string) => {
    const reason = prompt("Enter reason for cancellation:");
    if (!reason) return;
    try {
      await apiClient(`/timetable/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ note: reason })
      });
      alert('Cancellation requested successfully');
      setTimetable(timetable.map(t => t.id === id ? { ...t, status: 'CANCELLED' } : t));
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this class?")) return;
    try {
      await apiClient(`/timetable/${id}/cr-delete`, { method: 'DELETE' });
      setTimetable(timetable.filter(t => t.id !== id));
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/timetable/cr', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (profile?.crAssignment?.sectionId) {
        const tt = await apiClient(`/timetable/section/${profile.crAssignment.sectionId}/term/${formData.termId}`);
        setTimetable(tt);
      }
      setShowAddModal(false);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Timetable</h1>
          <p className="text-slate-500 font-medium mt-1">Add, update, or cancel classes for your section.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow-sm">
          <Plus size={18} /> Add Class
        </button>
      </div>
      
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
         <div className="space-y-8">
          {days.map((dayName, dayIndex) => {
            const dayClasses = timetable.filter(t => t.dayOfWeek === dayIndex + 1).sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (dayClasses.length === 0) return null;
            
            return (
              <div key={dayName}>
                <h3 className="font-bold text-slate-800 text-lg mb-4 border-b pb-2">{dayName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayClasses.map(cls => (
                    <div key={cls.id} className={`p-4 rounded-xl border ${cls.status === 'CANCELLED' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-200'} shadow-sm relative group`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold ${cls.status === 'CANCELLED' ? 'text-rose-700' : 'text-slate-900'}`}>{cls.subject?.name}</h4>
                        <div className="flex gap-2">
                          {cls.status !== 'CANCELLED' && (
                            <button onClick={() => handleCancelClass(cls.id)} className="opacity-0 group-hover:opacity-100 text-amber-500 hover:text-amber-700 transition p-1" title="Cancel Class">
                              <XCircle size={18} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteClass(cls.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition p-1" title="Delete from Timetable">
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock size={14} /> {cls.startTime} - {cls.endTime}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin size={14} /> {cls.room?.roomNumber || 'TBA'}
                        </div>
                      </div>
                      {cls.status === 'CANCELLED' && <div className="absolute bottom-4 right-4 bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded">CANCELLED</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {timetable.length === 0 && <p className="text-slate-500 text-center py-10">No classes found for this term. Click 'Add Class' to build the timetable.</p>}
         </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Add Class to Timetable</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Subject</label>
                <input required type="text" placeholder="e.g. Data Structures" value={formData.subjectName} onChange={e => setFormData({...formData, subjectName: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Room</label>
                <input type="text" placeholder="e.g. Room 101 (Optional)" value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Day</label>
                <select required value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: parseInt(e.target.value)})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none">
                  {days.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Start Time</label>
                  <input required type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">End Time</label>
                  <input required type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none" />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2">
                  <Save size={18} /> Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
