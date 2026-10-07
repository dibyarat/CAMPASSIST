import React from 'react';
import { BookOpen, Plus, Edit2, Trash2, Search } from 'lucide-react';

export const Subjects = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subject Master</h1>
          <p className="text-slate-500 font-medium mt-1">Manage course curriculum and subject codes.</p>
        </div>
        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition">
          <Plus size={18} /> Add Subject
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search subject code or name..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Code</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Subject Name</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Department</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Credits</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Type</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { code: 'CS301', name: 'Database Systems', dept: 'CSE', credits: 4, type: 'Theory' },
                { code: 'CS302', name: 'Computer Networks', dept: 'CSE', credits: 3, type: 'Theory' },
                { code: 'CS303', name: 'Operating Systems', dept: 'CSE', credits: 4, type: 'Theory' },
                { code: 'CS301L', name: 'DBMS Lab', dept: 'CSE', credits: 1, type: 'Practical' },
              ].map((sub, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                  <td className="py-4 px-4 font-bold text-slate-900">{sub.code}</td>
                  <td className="py-4 px-4 font-medium text-slate-800">{sub.name}</td>
                  <td className="py-4 px-4 text-slate-600">{sub.dept}</td>
                  <td className="py-4 px-4 text-slate-600">{sub.credits}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sub.type === 'Theory' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {sub.type}
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
        </div>
      </div>
    </div>
  );
};
