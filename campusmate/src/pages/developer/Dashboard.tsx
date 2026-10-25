import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Layout, GraduationCap, Database, UserPlus, FilePlus, Server, Activity, HardDrive, Loader2, Building2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, sections: 0, institutions: 0 });
    const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<{ loadTimeMs: number; dbLatencyMs: number | null; dbStatus: string; firestoreStatus: string; lastUpdated: string }>({ loadTimeMs: 0, dbLatencyMs: null, dbStatus: 'Connected', firestoreStatus: 'Connected', lastUpdated: '' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const startTime = performance.now();
        const [usersData, sectionsData, institutionsData, healthData] = await Promise.all([
          apiClient('/users'),
          apiClient('/sections'),
          apiClient('/institutions'),
          apiClient('/health')
        ]);
        
        const endTime = performance.now();
        setHealth({
          loadTimeMs: Math.round(endTime - startTime),
          dbLatencyMs: healthData?.metrics?.dbLatencyMs ?? null,
          dbStatus: healthData?.services?.database === 'connected' ? 'Connected' : 'Unavailable',
          firestoreStatus: healthData?.services?.firestore === 'connected' ? 'Connected' : 'Unavailable',
          lastUpdated: new Date().toLocaleTimeString(),
        });
        setStats({
          users: usersData.length || 0,
          sections: sectionsData.length || 0,
          institutions: institutionsData.length || 0
        });

        

      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-[var(--glass-surface)] backdrop-blur-xl p-6 rounded-2xl shadow-[var(--card-shadow)] border border-[var(--color-border)] text-[var(--color-text)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Developer Dashboard</h1>
          <p className="text-[var(--color-muted)] font-medium mt-1">System Administration & Monitoring</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-brand text-white flex items-center justify-center shadow-[0_4px_16px_rgba(113,64,216,0.35)]">
          <Server size={22} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--card-shadow)] flex items-center justify-between text-[var(--color-text)] hover:-translate-y-0.5 transition-all">
          <div>
            <p className="text-xs font-semibold text-[var(--color-muted)] mb-1">Active Users</p>
            <h2 className="text-3xl font-extrabold text-[#19A3E9]">{stats.users}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#19A3E9]/15 text-[#19A3E9] border border-[#19A3E9]/25 flex items-center justify-center shadow-xs">
            <Users size={22} />
          </div>
        </div>
        <div className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--card-shadow)] flex items-center justify-between text-[var(--color-text)] hover:-translate-y-0.5 transition-all">
          <div>
            <p className="text-xs font-semibold text-[var(--color-muted)] mb-1">Institutions</p>
            <h2 className="text-3xl font-extrabold text-[#8758F5]">{stats.institutions}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#8758F5]/15 text-[#8758F5] border border-[#8758F5]/25 flex items-center justify-center shadow-xs">
            <Building2 size={22} />
          </div>
        </div>
        <div className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--card-shadow)] flex items-center justify-between text-[var(--color-text)] hover:-translate-y-0.5 transition-all">
          <div>
            <p className="text-xs font-semibold text-[var(--color-muted)] mb-1">Sections</p>
            <h2 className="text-3xl font-extrabold text-emerald-500">{stats.sections}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 flex items-center justify-center shadow-xs">
            <Layout size={22} />
          </div>
        </div>
        <div className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--card-shadow)] flex items-center justify-between text-[var(--color-text)] hover:-translate-y-0.5 transition-all">
          <div>
            <p className="text-xs font-semibold text-[var(--color-muted)] mb-1">Database</p>
            <h2 className="text-3xl font-extrabold text-emerald-500">100%</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 flex items-center justify-center shadow-xs">
            <Database size={22} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--card-shadow)] text-[var(--color-text)]">
            <h3 className="font-bold text-[var(--color-text)] mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/developer/users" className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-[var(--glass-sub-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/10 transition group text-left backdrop-blur-md shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center shadow-xs">
                  <UserPlus size={16} />
                </div>
                <span className="font-semibold text-sm">Manage Users</span>
              </Link>
              <Link to="/developer/institutions" className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-[var(--glass-sub-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/10 transition group text-left backdrop-blur-md shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center shadow-xs">
                  <Building2 size={16} />
                </div>
                <span className="font-semibold text-sm">Manage Institutions</span>
              </Link>
            </div>
          </div>

          <div className="bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--card-shadow)] text-[var(--color-text)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2 text-[var(--color-text)]">
                <Activity size={18} className="text-emerald-400" /> System Health
              </h3>
              {health.lastUpdated && <span className="text-[11px] text-[var(--color-muted)] font-medium">Checked: {health.lastUpdated}</span>}
            </div>
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-[var(--color-muted)]">
                  <span>Dashboard data load time</span>
                  <span className="text-emerald-400 font-bold">{health.loadTimeMs}ms</span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)]">Batch fetch time for live admin dashboard view.</p>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-[var(--color-muted)]">
                  <span>Database Connection</span>
                  <span className={`font-bold ${health.dbStatus === 'Connected' ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {health.dbStatus}{health.dbLatencyMs !== null ? ` (${health.dbLatencyMs}ms ping)` : ''}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)]">PostgreSQL primary query ping & connection status.</p>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-[var(--color-muted)]">
                  <span>Firestore Auxiliary Store</span>
                  <span className={`font-bold ${health.firestoreStatus === 'Connected' ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {health.firestoreStatus}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)]">Secondary document cache & notification sync.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



