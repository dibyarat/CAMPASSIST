import React from 'react';
import { Mail, Phone, User, Copy, ExternalLink } from 'lucide-react';

export const Contacts = () => {
  const contacts = [
    { name: 'Dr. Sarah Mitchell', role: 'HOD - Computer Science', email: 's.mitchell@college.edu', phone: '+1 234 567 8901', avatar: 'bg-purple-100 text-purple-600' },
    { name: 'Prof. James Wilson', role: 'Database Systems Faculty', email: 'j.wilson@college.edu', phone: '+1 234 567 8902', avatar: 'bg-blue-100 text-blue-600' },
    { name: 'Anita Desai', role: 'Class Representative (CR)', email: 'a.desai@student.edu', phone: '+1 234 567 8903', avatar: 'bg-pink-100 text-pink-600' },
    { name: 'Admin Office', role: 'General Inquiries', email: 'admin@college.edu', phone: '+1 234 567 8904', avatar: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Important Contacts</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contacts.map((contact, idx) => (
          <div key={idx} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col hover:shadow-md hover:border-blue-200 transition group">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${contact.avatar}`}>
                <User size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">{contact.name}</h3>
                <p className="text-sm font-medium text-slate-500">{contact.role}</p>
              </div>
            </div>
            
            <div className="space-y-3 mt-auto border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Mail size={14} className="text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">{contact.email}</span>
                </div>
                <button className="text-slate-400 hover:text-blue-600 transition" title="Copy Email">
                  <Copy size={16} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Phone size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium">{contact.phone}</span>
                </div>
                <button className="text-slate-400 hover:text-emerald-600 transition" title="Copy Phone">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
