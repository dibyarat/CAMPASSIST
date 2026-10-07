import React from 'react';
import { Database, HardDrive, Cpu, Activity, Download } from 'lucide-react';

export const Resources = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">StudyOS Resources</h1>
          <p className="text-slate-500 font-medium mt-1">Monitor storage, API usage, and system health.</p>
        </div>
        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition">
          <Download size={18} /> Download Logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <HardDrive size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Storage Used</p>
              <h2 className="text-2xl font-bold text-slate-900">842 GB</h2>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: '84%' }}></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-right">84% of 1 TB</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <Database size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Database Load</p>
              <h2 className="text-2xl font-bold text-slate-900">42%</h2>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: '42%' }}></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-right">Normal</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">API Requests / min</p>
              <h2 className="text-2xl font-bold text-slate-900">1,204</h2>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: '60%' }}></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-right">Peak Load: 2,500</p>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-6">Recent File Uploads</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Filename</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Uploader</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Size</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'dbms_chapter_4.pdf', user: 'Dr. Smith', size: '4.2 MB', date: '10 mins ago' },
                { name: 'cn_assignment_3.zip', user: 'Alex (Student)', size: '12.5 MB', date: '45 mins ago' },
                { name: 'midsem_results.csv', user: 'Admin', size: '1.1 MB', date: '2 hours ago' },
                { name: 'os_lecture_video.mp4', user: 'Dr. Jones', size: '245 MB', date: '5 hours ago' },
              ].map((file, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-4 px-4 font-medium text-slate-800">{file.name}</td>
                  <td className="py-4 px-4 text-slate-600">{file.user}</td>
                  <td className="py-4 px-4 text-slate-600">{file.size}</td>
                  <td className="py-4 px-4 text-slate-500 text-sm">{file.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
