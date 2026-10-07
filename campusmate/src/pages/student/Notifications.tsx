import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, Bell, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Notifications = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await apiClient('/notifications');
        setNotifications(data);
      } catch (error) {
        console.error("Failed to load notifications", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const filteredNotifs = activeTab === 'Unread' ? notifications.filter(n => !n.isRead) : notifications;

  const getIconAndColor = (type: string) => {
    switch(type) {
      case 'CANCELLATION': return { icon: <AlertTriangle size={20} className="text-amber-500" />, bg: 'bg-amber-50' };
      case 'ROOM_CHANGE': return { icon: <Info size={20} className="text-blue-500" />, bg: 'bg-blue-50' };
      case 'GENERAL_ANNOUNCEMENT': return { icon: <Bell size={20} className="text-purple-500" />, bg: 'bg-purple-50' };
      default: return { icon: <FileText size={20} className="text-slate-500" />, bg: 'bg-slate-50' };
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Notifications Center</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm p-2 flex gap-1">
        {['All', 'Unread'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
        ) : filteredNotifs.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl p-10 rounded-2xl text-center border border-slate-100">
            <p className="text-slate-500">No {activeTab.toLowerCase()} notifications found.</p>
          </div>
        ) : filteredNotifs.map((notif, idx) => {
          const { icon, bg } = getIconAndColor(notif.type);
          
          return (
            <div 
              key={notif.id} 
              className={`p-5 rounded-2xl border transition-all ${notif.isRead ? 'bg-white/40 border-slate-100 opacity-75 hover:opacity-100' : 'bg-white shadow-sm border-blue-100'}`}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-bold text-base mb-1 ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{notif.title}</h4>
                      <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>{notif.message}</p>
                    </div>
                    {!notif.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2 shadow-sm shadow-blue-200 cursor-pointer" 
                        title="Mark as read"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs font-semibold text-slate-400">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
