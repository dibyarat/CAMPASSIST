import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface FeedbackItem {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    profile?: {
      fullName: string;
    };
  };
}

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/feedback');
      if (Array.isArray(data)) {
        setFeedbacks(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient(`/feedback/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (newStatus === 'RESOLVED') {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
      } else {
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12}/> Resolved</span>;
      case 'REVIEWED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Reviewed</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12}/> Pending</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BUG': return <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-semibold border border-red-200">BUG</span>;
      case 'FEATURE': return <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-semibold border border-purple-200">FEATURE</span>;
      default: return <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs font-semibold border border-gray-200">GENERAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-blue-500 w-8 h-8" />
          <h1 className="text-2xl font-bold text-slate-800">User Feedbacks</h1>
        </div>
        <button 
          onClick={fetchFeedbacks}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 font-medium text-sm"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading feedbacks...</div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No Feedbacks Yet</h3>
          <p className="text-slate-500">When users submit feedback, it will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {feedbacks.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(item.type)}
                      <span className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                  </div>
                  <div>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
                
                <p className="text-slate-600 whitespace-pre-wrap">{item.content}</p>
                
                <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 inline-block">
                  Submitted by: <span className="font-medium text-slate-700">{item.user.profile?.fullName || 'Unknown User'}</span> ({item.user.email})
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end md:justify-start">
                <select 
                  value={item.status} 
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

