import React from 'react';
import { Terminal, Activity } from 'lucide-react';

export const Audit = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Audit Logs</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time developer console and system events.</p>
        </div>
      </div>
      <div className="bg-slate-900 p-8 rounded-2xl shadow-sm font-mono text-sm min-h-[400px]">
        <div className="flex items-center gap-2 text-emerald-400 mb-4"><Activity size={16} /> Live Logs Connected</div>
        <div className="space-y-2 text-slate-300">
          <p>[10:42:05 AM] INFO: User Alex Student authenticated successfully.</p>
          <p>[10:45:12 AM] WARN: Rate limit approaching for route /api/timetable (IP: 192.168.1.5)</p>
          <p>[10:50:01 AM] INFO: CR Sarah Connor posted announcement to CSE-A.</p>
          <p>[10:55:33 AM] <span className="text-rose-400">ERROR: Database connection timeout on /api/sync</span></p>
        </div>
      </div>
    </div>
  );
};
