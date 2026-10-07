import React, { useState, useEffect } from 'react';
import { UploadCloud, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Submissions</h1>
          <p className="text-slate-500 font-medium mt-1">Track assignments and deadlines.</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition flex items-center gap-2">
          <Plus size={18} /> Add Deadline
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Subject/Task</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Due Date</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Status</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-500">No submissions found</td></tr>
                ) : submissions.map((sub, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-medium text-slate-800">{sub.subject?.name || 'Task'}</td>
                    <td className="py-4 px-4 text-slate-600">{new Date(sub.deadline).toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sub.status === 'SUBMITTED_DIGITALLY' || sub.status === 'SUBMITTED_PHYSICALLY' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {sub.status.replace(/_/g, ' ')}
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
