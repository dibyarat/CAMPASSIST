import React, { useEffect, useState } from 'react';
import { AlertCircle, Filter, Download, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Attendance = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient('/attendance/overview'),
      apiClient('/attendance/anomalies')
    ])
      .then(([overviewData, anomaliesData]) => {
        setStudents(overviewData);
        setAnomalies(anomaliesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Attendance</h1>
          <p className="text-slate-500 font-medium mt-1">Global attendance metrics and anomaly detection.</p>
        </div>
        <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 transition">
          <Download size={18} /> Export Master Record
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">Low Attendance Alerts</h3>
              <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                <Filter size={16} /> Filter by Section
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-sm font-semibold text-slate-500">Student Name</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-500">Section</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-500">Overall %</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-500">Critical Subjects</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" /></td></tr> : students.length === 0 ? <tr><td colSpan={5} className="py-10 text-center text-slate-500">No attendance records found.</td></tr> : students.map((student) => (
                    <tr key={student.id} className="border-b border-slate-100">
                      <td className="py-4 px-4 font-bold text-slate-900">{student.name}</td>
                      <td className="py-4 px-4 text-slate-600">{student.section}</td>
                      <td className="py-4 px-4">
                        <span className={`font-bold ${student.percentage < 60 ? 'text-rose-600' : 'text-amber-600'}`}>{student.percentage.toFixed(0)}%</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{student.criticalSubjects.join(', ') || 'None'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${student.status === 'LOW_ATTENDANCE' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>{student.status.replace(/_/g, ' ')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-rose-50/50 backdrop-blur-xl p-6 rounded-2xl border border-rose-100">
            <div className="flex items-center gap-3 mb-4 text-rose-700">
              <AlertCircle size={20} />
              <h3 className="font-bold">System Anomalies</h3>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="p-4 text-center"><Loader2 className="animate-spin text-rose-500 mx-auto" /></div>
              ) : anomalies.length === 0 ? (
                <div className="p-4 text-center text-rose-500/70 text-sm">No active anomalies detected.</div>
              ) : anomalies.map((anomaly) => (
                <div key={anomaly.id} className={`p-3 bg-white rounded-xl border shadow-sm ${anomaly.type === 'danger' ? 'border-rose-100' : 'border-amber-100'}`}>
                  <p className="text-sm font-semibold text-slate-800 mb-1">{anomaly.title}</p>
                  <p className="text-xs text-slate-500 mb-2">{anomaly.description}</p>
                  <button className={`text-xs font-bold px-3 py-1.5 rounded-lg w-full ${anomaly.type === 'danger' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'}`}>
                    {anomaly.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
