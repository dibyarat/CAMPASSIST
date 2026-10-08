import React, { useEffect, useState } from 'react';
import { Mail, User, Copy, Loader2 } from 'lucide-react';
import { contactService } from '../../services/contactService';
import type { Contact } from '../../services/contactService';

export const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contactService.listClassRepresentatives()
      .then(setContacts)
      .catch(error => console.error('Failed to load contacts', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Important Contacts</h1>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div> : contacts.length === 0 ? <div className="bg-white/60 p-10 rounded-2xl text-center text-slate-500">No class representatives are available.</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contacts.map((contact, idx) => (
          <div key={contact.id || idx} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col hover:shadow-md hover:border-blue-200 transition group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
                <User size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">{contact.profile?.fullName || contact.email}</h3>
                <p className="text-sm font-medium text-slate-500">Class Representative{contact.profile?.section ? ` · ${contact.profile.section}` : ''}</p>
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
                <button onClick={() => navigator.clipboard.writeText(contact.email)} className="text-slate-400 hover:text-blue-600 transition" title="Copy Email">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
};
