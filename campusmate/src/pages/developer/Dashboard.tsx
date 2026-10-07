import React, { useState, useEffect } from 'react';
import { Users, Layout, GraduationCap, Database, UserPlus, FilePlus, Server, Activity, HardDrive, Loader2, Building2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, sections: 0, institutions: 0 });
    const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState({ responseTime: 0, dbStatus: 'Optimal' });

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
        setHealth({ responseTime: Math.round(endTime - startTime), dbStatus: healthData.services.database === 'connected' ? 'Optimal' : 'Critical' });
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
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Developer Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">System Administration & Monitoring</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center">
          <Server size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Active Users</p>
            <h2 className="text-3xl font-bold text-blue-500">{stats.users}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Institutions</p>
            <h2 className="text-3xl font-bold text-purple-500">{stats.institutions}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
            <Building2 size={24} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Sections</p>
            <h2 className="text-3xl font-bold text-emerald-500">{stats.sections}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <Layout size={24} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Database</p>
            <h2 className="text-3xl font-bold text-emerald-500">100%</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <Database size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition group text-left">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 group-hover:text-blue-500 shadow-sm">
                  <UserPlus size={16} />
                </div>
                <span className="font-semibold text-sm">Manage Users</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100 hover:text-purple-600 transition group text-left">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 group-hover:text-purple-500 shadow-sm">
                  <Building2 size={16} />
                </div>
                <span className="font-semibold text-sm">Manage Institutions</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Activity size={18} className="text-emerald-400" /> System Health
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-300">
                  <span>API Response Time</span>
                  <span className="text-emerald-400">{health.responseTime}ms</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-1/4 h-full bg-emerald-400"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-300">
                  <span>Database Load</span>
                  <span className="text-emerald-400">{health.dbStatus}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[12%] h-full bg-emerald-400"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



