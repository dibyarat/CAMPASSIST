import React from 'react';
import { FileText, Download } from 'lucide-react';

export const Reports = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Class Reports</h1>
          <p className="text-slate-500 font-medium mt-1">Export class activity and submission metrics.</p>
        </div>
        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2">
          <Download size={18} /> Export CSV
        </button>
      </div>
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-100 text-center min-h-[300px] flex items-center justify-center">
        <p className="text-slate-500">Select a date range to view reports.</p>
      </div>
    </div>
  );
};
