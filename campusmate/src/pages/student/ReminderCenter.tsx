import React from 'react';
import { Bell, Plus, Calendar, Clock } from 'lucide-react';

export const ReminderCenter = () => {
  const reminders = [
    { title: 'Submit OS Project Proposal', date: 'Tomorrow', time: '11:59 PM', type: 'Academic', color: 'border-blue-500' },
    { title: 'Library Book Return', date: '25 Apr 2025', time: '05:00 PM', type: 'Personal', color: 'border-purple-500' },
    { title: 'CR Meeting with HOD', date: '26 Apr 2025', time: '02:30 PM', type: 'Administrative', color: 'border-orange-500' },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="text-pink-500" /> Reminder Center
        </h1>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition">
          <Plus size={16} /> Add Reminder
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reminders.map((rem, idx) => (
          <div key={idx} className={`bg-white rounded-2xl border-l-4 border-y border-r border-y-slate-100 border-r-slate-100 shadow-sm p-6 hover:shadow-md transition ${rem.color}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-900">{rem.title}</h3>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                rem.type === 'Academic' ? 'bg-blue-50 text-blue-600' :
                rem.type === 'Personal' ? 'bg-purple-50 text-purple-600' :
                'bg-orange-50 text-orange-600'
              }`}>{rem.type}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><Calendar size={14} className="text-slate-400" /></div>
                {rem.date}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><Clock size={14} className="text-slate-400" /></div>
                {rem.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
