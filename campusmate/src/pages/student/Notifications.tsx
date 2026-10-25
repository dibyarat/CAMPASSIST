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
      case 'CANCELLATION': return { icon: <AlertTriangle size={20} className="text-amber-400" />, bg: 'bg-amber-500/15' };
      case 'ROOM_CHANGE': return { icon: <Info size={20} className="text-[#19A3E9]" />, bg: 'bg-[rgba(25,163,233,0.15)]' };
      case 'GENERAL_ANNOUNCEMENT': return { icon: <Bell size={20} className="text-[#D946A8]" />, bg: 'bg-[rgba(217,70,168,0.15)]' };
      default: return { icon: <FileText size={20} className="text-[var(--color-muted)]" />, bg: 'bg-white/10' };
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <div className="flex justify-between items-center glass p-6 rounded-2xl border border-[var(--color-border)]">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Notifications Center</h1>
      </div>

      <div className="glass rounded-2xl border border-[var(--color-border)] p-2 flex gap-1">
        {['All', 'Unread'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab ? 'bg-[rgba(25,163,233,0.15)] text-[#19A3E9] border border-[#19A3E9]/30 shadow-sm' : 'text-[var(--color-muted)] hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#19A3E9] w-10 h-10" /></div>
        ) : filteredNotifs.length === 0 ? (
          <div className="glass p-10 rounded-2xl text-center border border-[var(--color-border)]">
            <p className="text-[var(--color-muted)]">
              {activeTab === 'All' 
                ? 'You have no notifications yet.' 
                : 'You’re all caught up — no unread notifications.'}
            </p>
          </div>
        ) : filteredNotifs.map((notif) => {
          const { icon, bg } = getIconAndColor(notif.type);
          
          return (
            <div 
              key={notif.id} 
              className={`p-5 rounded-2xl border transition-all ${notif.isRead ? 'glass border-[var(--color-border)] opacity-75 hover:opacity-100' : 'glass border-[#19A3E9]/40 shadow-sm'}`}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-bold text-base ${notif.isRead ? 'text-[var(--color-muted)]' : 'text-[var(--color-text)]'}`}>{notif.title}</h4>
                        {notif.isRead ? (
                          <span className="px-2 py-0.5 glass text-[var(--color-muted)] rounded text-xs font-semibold border border-[var(--color-border)]">Read</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-[rgba(25,163,233,0.15)] text-[#19A3E9] rounded text-xs font-semibold border border-[#19A3E9]/30">New</span>
                        )}
                      </div>
                      <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-[var(--color-muted)]' : 'text-[var(--color-text)] font-medium'}`}>{notif.message}</p>
                    </div>
                    {!notif.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="w-2.5 h-2.5 rounded-full bg-[#19A3E9] shrink-0 mt-2 shadow-sm shadow-[#19A3E9]/50 cursor-pointer" 
                        title="Mark as read"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs font-semibold text-[var(--color-muted)]">{new Date(notif.createdAt).toLocaleString()}</span>
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
