import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, Clock, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Submissions = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await apiClient('/submissions/mine');
        setSubmissions(data);
      } catch (error) {
        console.error("Failed to load submissions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">My Submissions</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900">Recent Assignments</h3>
          <div className="flex gap-2">
             <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">Submitted</span>
             <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">Pending</span>
             <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">Overdue</span>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
          ) : submissions.length === 0 ? (
             <div className="text-center text-slate-500 py-10">No submissions found.</div>
          ) : submissions.map((item, idx) => {
            const isSubmitted = item.status === 'SUBMITTED_DIGITALLY' || item.status === 'SUBMITTED_PHYSICALLY';
            const isOverdue = !isSubmitted && new Date(item.deadline) < new Date();
            
            let statusColor = 'bg-amber-50 text-amber-600 border-amber-200';
            let StatusIcon = Clock;
            
            if (isSubmitted) {
              statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
              StatusIcon = CheckCircle2;
            } else if (isOverdue) {
              statusColor = 'bg-rose-50 text-rose-600 border-rose-200';
              StatusIcon = AlertCircle;
            }

            return (
              <div key={idx} className={`p-4 rounded-xl border ${statusColor.split(' ')[0]} flex items-center justify-between`}>
                <div className="flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${statusColor.split(' ')[1]} ${statusColor.split(' ')[0]}`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.subject?.name || 'Task'}</h4>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">Due: {new Date(item.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${statusColor}`}>
                    <StatusIcon size={16} />
                    {isSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending'}
                  </span>
                  {!isSubmitted && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition">
                      <Upload size={16} /> Upload
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
