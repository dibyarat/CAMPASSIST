import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

export const SgpaCgpa = () => {
  const [activeTab, setActiveTab] = useState<'SGPA' | 'CGPA' | 'Grade Calculator'>('SGPA');

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">SGPA / CGPA Calculator</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="flex bg-slate-50 p-1 rounded-xl mb-8 w-max mx-auto">
          {['SGPA', 'CGPA', 'Grade Calculator'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === tab 
                  ? 'bg-[var(--brand-blue)] text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'SGPA' && (
          <div className="px-4">
            <table className="w-full text-left mb-4">
              <thead>
                <tr className="text-slate-500 text-sm border-b border-slate-100">
                  <th className="font-semibold pb-3 w-1/2">Subject</th>
                  <th className="font-semibold pb-3 text-center">Credits</th>
                  <th className="font-semibold pb-3 text-center">Grade</th>
                  <th className="font-semibold pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Database Systems', cred: '4', grade: 'A+' },
                  { name: 'Computer Networks', cred: '4', grade: 'A' },
                  { name: 'Operating Systems', cred: '4', grade: 'B+' },
                  { name: 'Mathematics', cred: '3', grade: 'A+' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="py-4 pr-4">
                      <input type="text" value={row.name} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-medium outline-none bg-slate-50 text-slate-700" readOnly />
                    </td>
                    <td className="py-4 px-2">
                      <select className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-medium outline-none bg-slate-50 text-slate-700 text-center appearance-none">
                        <option>{row.cred}</option>
                      </select>
                    </td>
                    <td className="py-4 px-2">
                      <select className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-medium outline-none bg-slate-50 text-slate-700 text-center appearance-none">
                        <option>{row.grade}</option>
                      </select>
                    </td>
                    <td className="py-4 pl-4 text-center">
                      <button className="text-slate-400 hover:text-rose-500 transition">
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition px-2 mb-10">
              <Plus size={16} /> Add Subject
            </button>

            <div className="flex flex-col items-center justify-center border-t border-slate-100 pt-8 pb-4">
              <h2 className="text-5xl font-extrabold text-emerald-500 mb-2">8.36</h2>
              <p className="font-semibold text-slate-500 tracking-widest uppercase">SGPA</p>
            </div>

            <div className="flex justify-between items-center mt-8 px-4 border-t border-slate-100 pt-6">
              <button className="px-8 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition">
                Clear
              </button>
              <button className="px-12 py-2.5 bg-gradient-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition">
                Calculate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
