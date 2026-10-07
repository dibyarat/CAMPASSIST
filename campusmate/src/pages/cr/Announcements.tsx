import React, { useState } from 'react';
import { Bell, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Announcements = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    
    setSending(true);
    try {
      await apiClient('/notifications/announcement', {
        method: 'POST',
        body: JSON.stringify({ title, message })
      });
      setSuccess(true);
      setTitle('');
      setMessage('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to send announcement", error);
      alert("Failed to send announcement. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Post Announcement</h1>
        
        {success ? (
          <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-100 mb-6">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-900 mb-2">Announcement Sent!</h3>
            <p className="text-emerald-700">All students in your section have been notified.</p>
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="e.g. Lab cancelled today" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
              placeholder="Type your announcement here..."
            ></textarea>
          </div>
          <button 
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            className="w-full bg-gradient-primary text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />} 
            Send to Class
          </button>
        </div>
      </div>
    </div>
  );
};
