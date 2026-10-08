import React, { useState, useEffect } from 'react';
import { Search, Map, Users, Loader2, Info } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { academicTermService } from '../../services/academicTermService';

export const ExamSeat = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingSeat, setLoadingSeat] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const currentTerm = await academicTermService.getCurrent();
        const data = await apiClient(`/exams/term/${currentTerm.id}`);
        setExams(data);
        if (data.length > 0) setSelectedExamId(data[0].id);
      } catch (error) {
        console.error("Failed to load exams", error);
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    
    setLoadingSeat(true);
    setError('');
    setResult(null);
    
    try {
      const data = await apiClient(`/exams/${selectedExamId}/my-seat`);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Seating arrangement not published yet or roll number missing.');
    } finally {
      setLoadingSeat(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Exam Seating Arrangement</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-8">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-800 mb-8">
          <Info className="shrink-0" size={20} />
          <p className="text-sm">Select an upcoming exam to view your allocated room and seat number. Seating is usually published 48 hours before the exam.</p>
        </div>

        {loadingExams ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
        ) : exams.length === 0 ? (
          <div className="text-center text-slate-500 py-4">No upcoming exams found.</div>
        ) : (
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.subject?.name || exam.subjectRef} - {new Date(exam.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            <button 
              type="submit" 
              disabled={loadingSeat}
              className="px-8 py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loadingSeat ? <Loader2 className="animate-spin" size={20} /> : <Search size={18} />} Find Seat
            </button>
          </form>
        )}

        {error && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-center font-medium">
            {error}
          </div>
        )}

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-bold text-slate-900 mb-4 text-center">Your Allocation</h3>
            
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white/40 shadow-sm relative">
              {/* Decorative top bar */}
              <div className="h-2 bg-gradient-primary w-full"></div>
              
              <div className="p-8 flex flex-col md:flex-row gap-8 items-center justify-center">
                <div className="flex-1 text-center md:text-right md:border-r border-slate-100 md:pr-8">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</p>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">{result.exam?.subject?.name || result.exam?.subjectRef}</h2>
                  <p className="text-sm font-semibold text-slate-500 mt-2">{new Date(result.exam?.date).toLocaleDateString()} | {result.exam?.startTime} - {result.exam?.endTime}</p>
                </div>
                
                <div className="flex-1 text-center">
                  <div className="inline-flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 border-emerald-100 bg-emerald-50 mb-3 shadow-inner">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Seat No</p>
                    <span className="text-4xl font-black text-emerald-600">{result.seatNumber}</span>
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left md:border-l border-slate-100 md:pl-8">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                  <h3 className="text-xl font-bold text-slate-800">{result.room?.roomNumber}</h3>
                  <div className="flex items-center justify-center md:justify-start gap-1.5 text-sm font-semibold text-slate-500 mt-2">
                    <Map size={16} /> {result.room?.building || 'Main Block'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
