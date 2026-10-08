import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const SgpaCgpa = () => {
  const [activeTab, setActiveTab] = useState<'SGPA' | 'CGPA' | 'Grade Calculator'>('SGPA');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/grades/my-records')
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
            {loading ? (
              <div className="py-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" /></div>
            ) : records.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No academic records found. Add them through the developer portal or university sync.</div>
            ) : (
              <div className="space-y-10">
                {records.map((record) => (
                  <div key={record.id} className="border border-slate-100 rounded-xl p-6 shadow-sm bg-white">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">{record.term?.name || 'Unknown Term'}</h3>
                    <table className="w-full text-left mb-6">
                      <thead>
                        <tr className="text-slate-500 text-sm border-b border-slate-100">
                          <th className="font-semibold pb-3 w-1/2">Subject</th>
                          <th className="font-semibold pb-3 text-center">Credits</th>
                          <th className="font-semibold pb-3 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {record.grades.map((g: any) => (
                          <tr key={g.id}>
                            <td className="py-4 pr-4">
                              <div className="text-sm font-medium text-slate-700">{g.subject?.name || 'Unknown'}</div>
                              <div className="text-xs text-slate-400">{g.subject?.code}</div>
                            </td>
                            <td className="py-4 px-2 text-center text-sm font-medium text-slate-700">{g.credits}</td>
                            <td className="py-4 px-2 text-center text-sm font-bold text-blue-600">{g.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="flex justify-end items-center gap-6 border-t border-slate-100 pt-4">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Credits</p>
                        <p className="text-lg font-bold text-slate-700">{record.totalCredits}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Term SGPA</p>
                        <p className="text-3xl font-extrabold text-emerald-500">{record.sgpa?.toFixed(2) || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
