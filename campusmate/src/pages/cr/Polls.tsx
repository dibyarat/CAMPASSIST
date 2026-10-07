import React, { useState, useEffect } from 'react';
import { BarChart2, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Polls = () => {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const data = await apiClient('/polls');
        setPolls(data);
      } catch (error) {
        console.error("Failed to load polls", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Polls</h1>
          <p className="text-slate-500 font-medium mt-1">Create and monitor class polls.</p>
        </div>
        <button className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition flex items-center gap-2">
          <Plus size={18} /> Create Poll
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
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Question</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Status</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Total Votes</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {polls.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-500">No active polls found</td></tr>
                ) : polls.map((poll, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-medium text-slate-800">{poll.title}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${poll.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{poll.status}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {poll.options?.reduce((acc: number, opt: any) => acc + (opt._count?.votes || 0), 0)}
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
