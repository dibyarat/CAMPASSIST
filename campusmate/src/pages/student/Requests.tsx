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
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Attendance Disputes</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="flex bg-slate-50 p-1 rounded-xl mb-6 w-max">
          {['My Requests', 'New Request'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'My Requests' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
            ) : requests.length === 0 ? (
              <div className="text-center py-10 text-slate-500">No requests found.</div>
            ) : requests.map((req, i) => (
              <div key={req.id} className="p-4 rounded-xl border border-slate-100 bg-white/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{req.subjectRef}</span>
                    <span className="text-slate-400 text-xs font-semibold">•</span>
                    <span className="text-slate-600 text-xs font-semibold">{new Date(req.sessionDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-500">{req.reason}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                  <p className="text-[10px] font-semibold text-slate-400 mt-2">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-xl">
            {success ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-emerald-900 mb-2">Request Submitted!</h3>
                <p className="text-emerald-700">Your attendance dispute has been forwarded to the CR queue.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-800">
                  <Info size={20} className="shrink-0" />
                  <p className="text-sm">Submit a dispute if you believe your attendance was incorrectly marked. Your CR will review and verify this request.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject ID</label>
                  <input 
                    type="text" 
                    value={subjectRef}
                    onChange={(e) => setSubjectRef(e.target.value)}
                    placeholder="e.g. CS301"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Class</label>
                  <input 
                    type="date" 
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason / Justification</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4} 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
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
