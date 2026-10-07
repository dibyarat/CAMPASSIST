import React from 'react';
import { Bookmark, Plus, Edit2, Trash2 } from 'lucide-react';

export const Reminders = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Reminders</h1>
          <p className="text-slate-500 font-medium mt-1">Create reminders for the entire class.</p>
        </div>
        <button className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition flex items-center gap-2">
          <Plus size={18} /> Create Reminder
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Title</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Due Date</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Priority</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { title: 'Submit CN assignment', due: 'Friday, 11:59 PM', priority: 'High' },
                { title: 'Fill out feedback form', due: 'Monday, 5:00 PM', priority: 'Medium' },
                { title: 'Bring lab coats tomorrow', due: 'Tomorrow, 9:00 AM', priority: 'Low' },
              ].map((rem, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                  <td className="py-4 px-4 font-medium text-slate-800">{rem.title}</td>
                  <td className="py-4 px-4 text-slate-600">{rem.due}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      rem.priority === 'High' ? 'bg-rose-100 text-rose-700' : 
                      rem.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                      'bg-emerald-100 text-emerald-700'
                    }`}>{rem.priority}</span>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
