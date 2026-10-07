import React from 'react';
import { Users, Layout, GraduationCap, Database, UserPlus, FilePlus, Server, Activity, HardDrive } from 'lucide-react';

export const Dashboard = () => {
  const logs = [
    { user: 'Admin (System)', action: 'Created new section CSE-B', time: '10 mins ago', status: 'Success' },
    { user: 'Dr. Sarah Mitchell', action: 'Updated DBMS Attendance', time: '1 hour ago', status: 'Success' },
    { user: 'System Bot', action: 'Daily Backup Completed', time: '3 hours ago', status: 'Success' },
    { user: 'John Doe', action: 'Failed Login Attempt', time: '5 hours ago', status: 'Failed' },
  ];

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
            <h2 className="text-3xl font-bold text-blue-500">1,204</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Sections</p>
            <h2 className="text-3xl font-bold text-purple-500">12</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
            <Layout size={24} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Faculties</p>
            <h2 className="text-3xl font-bold text-emerald-500">45</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Database</p>
            <h2 className="text-3xl font-bold text-emerald-500">99.9%</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <Database size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">System Activity Logs</h3>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="font-semibold p-4">User / System</th>
                  <th className="font-semibold p-4">Action</th>
                  <th className="font-semibold p-4">Time</th>
                  <th className="font-semibold p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-bold text-slate-900">{log.user}</td>
                    <td className="p-4 text-slate-600">{log.action}</td>
                    <td className="p-4 text-slate-400">{log.time}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                        log.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <span className="font-semibold text-sm">Add New Student</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100 hover:text-purple-600 transition group text-left">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 group-hover:text-purple-500 shadow-sm">
                  <UserPlus size={16} />
                </div>
                <span className="font-semibold text-sm">Add New Faculty</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100 hover:text-emerald-600 transition group text-left">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 group-hover:text-emerald-500 shadow-sm">
                  <FilePlus size={16} />
                </div>
                <span className="font-semibold text-sm">Create Section</span>
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
                  <span className="text-emerald-400">45ms</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-1/4 h-full bg-emerald-400"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-300">
                  <span>Database Load</span>
                  <span className="text-emerald-400">12%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[12%] h-full bg-emerald-400"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-300">
                  <span>Storage Usage</span>
                  <span className="text-amber-400">68%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[68%] h-full bg-amber-400"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
