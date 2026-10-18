import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Loader2, Info } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Requests = () => {
  const [activeTab, setActiveTab] = useState<'My Requests' | 'New Request'>('My Requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [subjectRef, setSubjectRef] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await apiClient('/attendance/my-disputes');
      setRequests(data);
    } catch (error) {
      console.error("Failed to load requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'My Requests') {
      fetchRequests();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient('/attendance/dispute', {
        method: 'POST',
        body: JSON.stringify({
          subjectRef,
          sessionDate: new Date(sessionDate).toISOString(),
          reason
        })
      });
      setSuccess(true);
      setSubjectRef('');
      setSessionDate('');
      setReason('');
      setTimeout(() => {
        setSuccess(false);
        setActiveTab('My Requests');
      }, 2000);
    } catch (error) {
      console.error("Failed to submit dispute", error);
      alert("Failed to submit request. Please ensure all fields are correct.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'APPROVED': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'REJECTED': return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default: return 'glass text-[var(--color-muted)] border-[var(--color-border)]';
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <div className="flex justify-between items-center glass p-6 rounded-2xl border border-[var(--color-border)]">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Attendance Disputes</h1>
      </div>

      <div className="glass rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden p-6">
        <div className="flex glass p-1 rounded-xl mb-6 w-max border border-[var(--color-border)]">
          {['My Requests', 'New Request'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab ? 'bg-[rgba(25,163,233,0.15)] text-[#19A3E9] border border-[#19A3E9]/30 shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'My Requests' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#19A3E9] w-10 h-10" /></div>
            ) : requests.length === 0 ? (
              <div className="text-center py-10 text-[var(--color-muted)]">No requests found.</div>
            ) : requests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl border border-[var(--color-border)] glass flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[var(--color-text)]">{req.subjectRef}</span>
                    <span className="text-[var(--color-muted)] text-xs font-semibold">•</span>
                    <span className="text-[var(--color-muted)] text-xs font-semibold">{new Date(req.sessionDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">{req.reason}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                  <p className="text-[10px] font-semibold text-[var(--color-muted)] mt-2">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-xl">
            {success ? (
              <div className="p-8 text-center bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-emerald-400 mb-2">Request Submitted!</h3>
                <p className="text-emerald-300 text-sm">Your attendance dispute has been forwarded to the CR queue.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-4 bg-[rgba(25,163,233,0.12)] border border-[#19A3E9]/30 rounded-xl flex gap-3 text-[#19A3E9]">
                  <Info size={20} className="shrink-0" />
                  <p className="text-sm text-[var(--color-text)]">Submit a dispute if you believe your attendance was incorrectly marked. Your CR will review and verify this request.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Subject ID</label>
                  <input 
                    type="text" 
                    value={subjectRef}
                    onChange={(e) => setSubjectRef(e.target.value)}
                    placeholder="e.g. CS301"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] outline-none focus:border-[#19A3E9]" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Date of Class</label>
                  <input 
                    type="date" 
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] outline-none focus:border-[#19A3E9]" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Reason / Justification</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4} 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] outline-none focus:border-[#19A3E9] resize-none" 
                    placeholder="Explain why the attendance record should be corrected..."
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Submit Dispute Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
