import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Attendance = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await apiClient('/attendance/cr-queue');
        setRequests(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleResolve = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient(`/attendance/cr-queue/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setRequests(requests.filter(r => r.id !== id));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Disputes</h1>
          <p className="text-slate-500 font-medium mt-1">Review pending attendance requests from students in your section.</p>
        </div>
      </div>
      
      <div className="grid gap-4">
        {requests.length === 0 ? (
           <div className="bg-white/60 backdrop-blur-xl p-10 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-500">
              No pending attendance disputes.
           </div>
        ) : requests.map((req) => (
          <div key={req.id} className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                {req.student?.profile?.fullName?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{req.student?.profile?.fullName || 'Student'} ({req.student?.profile?.rollNumber})</h3>
                <p className="text-sm text-slate-500 mt-0.5">Subject: {req.subjectRef}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={12} /> Date: {new Date(req.sessionDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex-1 px-8">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase">Reason</span>
                <p className="text-sm text-slate-700 mt-1">"{req.reason}"</p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleResolve(req.id, 'APPROVED')} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition" title="Approve">
                <CheckCircle2 size={20} />
              </button>
              <button onClick={() => handleResolve(req.id, 'REJECTED')} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition" title="Reject">
                <XCircle size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
