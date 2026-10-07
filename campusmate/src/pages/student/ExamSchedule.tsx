import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, MapPin, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const ExamSchedule = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('TERM-1');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const data = await apiClient(`/exams/term/${term}`);
        setExams(data);
      } catch (error) {
        console.error("Failed to load exams", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [term]);

  return (
    <div className="max-w-5xl space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Exam Schedule</h1>
        <div className="flex items-center gap-2">
           <select 
             value={term}
             onChange={(e) => setTerm(e.target.value)}
             className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white/60 backdrop-blur-xl hover:bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
           >
             <option value="TERM-1">Term 1</option>
             <option value="TERM-2">Term 2</option>
           </select>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
        ) : exams.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No exams scheduled for this term yet.</div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-4 py-4 space-y-10">
            {exams.map((exam, idx) => {
              const isPast = new Date(exam.date) < new Date();
              return (
                <div key={exam.id} className="relative pl-8 group">
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${isPast ? 'bg-slate-300' : 'bg-blue-500'} ring-4 ring-white shadow-sm`}></div>
                  
                  <div className={`bg-white/60 backdrop-blur-xl border border-slate-200 p-6 rounded-2xl shadow-sm transition ${isPast ? 'opacity-60' : 'hover:border-blue-200 hover:shadow-md'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{exam.subject?.name || exam.subjectRef}</h3>
                        <p className="text-sm font-semibold text-slate-500 mt-1">{exam.subjectRef}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${exam.type === 'MID_TERM' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                        {exam.type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="text-blue-500 shrink-0" size={18} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                          <p className="text-sm font-bold text-slate-700">{new Date(exam.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="text-blue-500 shrink-0" size={18} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</p>
                          <p className="text-sm font-bold text-slate-700">{exam.startTime} - {exam.endTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
