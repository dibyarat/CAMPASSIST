import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Calendar, CheckCircle, XCircle, Info } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Attendance = () => {
  const [activeTab, setActiveTab] = useState<'Overall' | 'Manual Log'>('Overall');
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Manual log state
  const [subjectRef, setSubjectRef] = useState('');
  const [date, setDate] = useState('');
  const [state, setState] = useState('PRESENT');
  const [logging, setLogging] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiClient('/attendance/my-attendance');
      setStats(data);
    } catch (error) {
      console.error("Failed to load attendance", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Overall') {
      fetchStats();
    }
  }, [activeTab]);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    try {
      await apiClient('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({ subjectRef, date: new Date(date).toISOString(), state })
      });
      alert('Attendance logged successfully!');
      setSubjectRef('');
      setDate('');
      setActiveTab('Overall');
    } catch (error) {
      console.error(error);
      alert('Failed to log attendance.');
    } finally {
      setLogging(false);
    }
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-blue-500';
    if (pct >= 65) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  return (
    <div className="max-w-5xl space-y-6 pb-10">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">My Attendance Log</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="flex bg-slate-50 p-1 rounded-xl mb-8 w-max">
          {['Overall', 'Manual Log'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === tab 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Overall' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
            ) : !stats ? (
              <div className="text-center text-slate-500 py-10">No attendance data found.</div>
            ) : (
              <>
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center flex flex-col items-center">
                  <p className="text-sm font-semibold text-slate-500 mb-2">Overall Attendance</p>
                  <h2 className={`text-4xl font-extrabold ${stats.overallPercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stats.overallPercentage?.toFixed(2) || 0}%
                  </h2>
                  <p className="text-sm font-medium text-slate-400 mt-2">
                    {stats.overallAttended || 0} / {stats.overallTotal || 0} Classes
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 mb-4">Subject-wise Breakdown</h3>
                  {Object.entries(stats.subjects || {}).map(([sub, data]: any) => (
                    <div key={sub} className="p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-slate-200 transition bg-white/40">
                      <div>
                        <h4 className="font-bold text-slate-900">{sub}</h4>
                        <p className="text-sm font-semibold text-slate-500 mt-1">
                          {data.attended} / {data.total} Classes Attended
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-48 h-2.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full rounded-full ${getPercentageColor(data.percentage)}`}
                            style={{ width: `${data.percentage}%` }}
                          ></div>
                        </div>
                        <span className={`font-bold w-14 text-right ${data.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {data.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(stats.subjects || {}).length === 0 && (
                     <div className="text-center text-sm text-slate-400 py-4">No subjects logged yet. Use Manual Log to start tracking.</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'Manual Log' && (
          <div className="max-w-xl">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-800 mb-6">
              <Info className="shrink-0" size={20} />
              <p className="text-sm">Since attendance is a personal tracking tool, use this form to manually log your presence in class.</p>
            </div>
            
            <form onSubmit={handleLog} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject Ref (e.g. CS301)</label>
                <input 
                  type="text" 
                  value={subjectRef}
                  onChange={(e) => setSubjectRef(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setState('PRESENT')} className={`p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${state === 'PRESENT' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <CheckCircle size={16} /> Present
                  </button>
                  <button type="button" onClick={() => setState('ABSENT')} className={`p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${state === 'ABSENT' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <XCircle size={16} /> Absent
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={logging}
                  className="w-full py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {logging ? <Loader2 className="animate-spin" size={20} /> : 'Log Record'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
