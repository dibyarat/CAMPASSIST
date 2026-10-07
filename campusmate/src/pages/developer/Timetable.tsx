import React, { useState, useEffect } from 'react';
import { Calendar, UploadCloud, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Timetable = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Hardcoding termId for now, but in reality this would be dynamic or selected
  const termId = 'TERM-1'; 

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const data = await apiClient('/sections');
        setSections(data);
        if (data.length > 0) setSelectedSection(data[0].id);
      } catch (error) {
        console.error("Failed to load sections", error);
      }
    };
    fetchSections();
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    const fetchTimetable = async () => {
      setLoading(true);
      try {
        const data = await apiClient(`/timetable/section/${selectedSection}/term/${termId}`);
        setTimetable(data);
      } catch (error) {
        console.error("Failed to load timetable", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [selectedSection]);

  // Group classes by day for the visualizer
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const groupedTimetable = days.map((day, idx) => {
    // API returns dayOfWeek as integer 1-5
    const classes = timetable.filter(entry => entry.dayOfWeek === idx + 1).length;
    return { day, classes };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Timetable</h1>
          <p className="text-slate-500 font-medium mt-1">Manage global schedules and resolve conflicts.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 transition">
            <Download size={18} /> Export
          </button>
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition">
            <UploadCloud size={18} /> Import CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">Schedule Overview</h3>
              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none"
              >
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : (
                groupedTimetable.map((d, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="w-24 font-bold text-slate-800">{d.day}</div>
                    <div className="flex-1 flex gap-2">
                      {Array.from({ length: Math.min(d.classes, 6) }).map((_, j) => (
                        <div key={j} className="h-8 flex-1 bg-blue-100/50 rounded border border-blue-200"></div>
                      ))}
                      {Array.from({ length: Math.max(6 - d.classes, 0) }).map((_, j) => (
                        <div key={j} className="h-8 flex-1 bg-slate-100 rounded border border-slate-200 border-dashed"></div>
                      ))}
                    </div>
                    <div className="text-sm font-semibold text-slate-500 w-16 text-right">{d.classes} slots</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-rose-50/50 backdrop-blur-xl p-6 rounded-2xl border border-rose-100">
            <div className="flex items-center gap-3 mb-4 text-rose-700">
              <AlertTriangle size={20} />
              <h3 className="font-bold">System Conflicts</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-xl border border-rose-100 shadow-sm">
                <p className="text-sm font-semibold text-slate-800 mb-1">Room Double Booking</p>
                <p className="text-xs text-slate-500 mb-2">Room 305 is booked for both CSE-A (DBMS) and IT-A (OS) on Tuesday 10:30 AM.</p>
                <button className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg w-full">Resolve</button>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-100 shadow-sm">
                <p className="text-sm font-semibold text-slate-800 mb-1">Faculty Overload</p>
                <p className="text-xs text-slate-500 mb-2">Dr. Smith is scheduled for 4 consecutive hours on Wednesday.</p>
                <button className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-full">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

