import React, { useState, useEffect } from 'react';
import { Terminal, Activity, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Audit = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiClient('/audit');
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
    
    // Poll every 5 seconds for live logs
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Audit Logs</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time developer console and system events.</p>
        </div>
      </div>
      <div className="bg-slate-900 p-8 rounded-2xl shadow-sm font-mono text-sm min-h-[400px]">
        <div className="flex items-center gap-2 text-emerald-400 mb-4">
          <Activity size={16} className="animate-pulse" /> Live Logs Connected
          {loading && <Loader2 size={14} className="animate-spin ml-2" />}
        </div>
        <div className="space-y-2 text-slate-300">
          {logs.length === 0 && !loading && (
            <p className="text-slate-500 italic">No audit logs found.</p>
          )}
          {logs.map((log: any) => (
            <p key={log.id}>
              [{new Date(log.timestamp).toLocaleTimeString()}] 
              {log.status === 'FAILURE' ? <span className="text-rose-400 font-bold ml-2">ERROR:</span> : <span className="text-blue-400 font-bold ml-2">INFO:</span>}
              <span className="ml-2 text-slate-300">
                {log.user?.profile?.fullName ? log.user.profile.fullName : (log.userRole || 'SYSTEM')} - {log.action} ({log.entityType} {log.entityId})
              </span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
