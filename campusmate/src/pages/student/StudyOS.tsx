import React, { useState } from 'react';
import { Search, Plus, FileText, MoreVertical } from 'lucide-react';

export const StudyOS = () => {
  const [activeTab, setActiveTab] = useState<'Notes' | 'Files' | 'Lab Records' | 'Viva' | 'Resources'>('Notes');

  const notes = [
    { title: 'DBMS Important Topics', desc: 'Relational Algebra, Normalization...', tag: 'DBMS', color: 'bg-blue-100 text-blue-700' },
    { title: 'CN Short Notes', desc: 'OSI Model, TCP/IP...', tag: 'CN', color: 'bg-purple-100 text-purple-700' },
    { title: 'OS Handwritten Notes', desc: 'Processes, Scheduling...', tag: 'OS', color: 'bg-emerald-100 text-emerald-700' },
    { title: 'Math Formulas', desc: 'Integrals, Matrices...', tag: 'Math', color: 'bg-orange-100 text-orange-700' },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">StudyOS</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-slate-50 p-1 rounded-xl">
            {['Notes', 'Files', 'Lab Records', 'Viva', 'Resources'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                  activeTab === tab 
                    ? 'bg-gradient-primary text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="text" placeholder="Search..." className="w-48 pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none bg-slate-50 focus:bg-white/60 backdrop-blur-xl focus:border-blue-300 transition" />
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-sm font-semibold hover:bg-blue-100 transition">
              <Plus size={16} /> New Note
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {notes.map((note, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition group cursor-pointer bg-white/60 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${note.color}`}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{note.title}</h4>
                  <p className="text-sm text-slate-500">{note.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-md text-xs font-bold ${note.color.replace('100', '50')}`}>
                  {note.tag}
                </span>
                <button className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
