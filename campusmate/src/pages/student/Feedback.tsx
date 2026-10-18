import React, { useState } from 'react';
import { Send, MessageSquare, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function Feedback() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('GENERAL');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      await apiClient('/feedback', {
        method: 'POST',
        body: JSON.stringify({ title, content, type })
      });

      setStatusMsg({ text: 'Feedback submitted successfully!', type: 'success' });
      setTitle('');
      setContent('');
      setType('GENERAL');
    } catch (error: any) {
      setStatusMsg({ text: error.message || 'Something went wrong', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="text-[#19A3E9] w-8 h-8" />
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Send Feedback</h1>
      </div>
      
      <div className="glass rounded-2xl p-6 shadow-sm border border-[var(--color-border)]">
        <p className="text-[var(--color-muted)] mb-6">
          We'd love to hear your thoughts! Whether you found a bug, have a feature request, or just want to share some general feedback, let us know below.
        </p>

        {statusMsg.text && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            <AlertCircle size={20} />
            <p>{statusMsg.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Feedback Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:outline-none focus:border-[#19A3E9] transition-all"
            >
              <option value="GENERAL">General Feedback</option>
              <option value="BUG">Report a Bug</option>
              <option value="FEATURE">Feature Request</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Brief summary of your feedback"
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:outline-none focus:border-[#19A3E9] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Details</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              placeholder="Please provide as much detail as possible..."
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:outline-none focus:border-[#19A3E9] transition-all resize-none"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-primary text-white font-medium py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Submitting...' : 'Submit Feedback'}
            {!isLoading && <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}

