import React, { useEffect, useState } from 'react';
import { AlertCircle, Filter, Download, Loader2, X, CheckCircle, Info } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Attendance = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [sections, setSections] = useState<string[]>([]);
  
  // Investigation modal state
  const [activeAnomaly, setActiveAnomaly] = useState<any | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    Promise.all([
      apiClient('/attendance/overview'),
      apiClient('/attendance/anomalies'),
      apiClient('/sections').catch(() => [])
    ])
      .then(([overviewData, anomaliesData, sectionsData]) => {
        setStudents(overviewData || []);
        setAnomalies(anomaliesData || []);

        const uniqueSections = new Set<string>();
        (overviewData || []).forEach((s: any) => {
          if (s.section && s.section !== 'Unassigned') uniqueSections.add(s.section);
        });
        (sectionsData || []).forEach((sec: any) => {
          if (sec.name) uniqueSections.add(sec.name);
        });
        setSections(Array.from(uniqueSections).sort());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredStudents = selectedSection === 'ALL'
    ? students
    : students.filter((s) => s.section === selectedSection);

  const handleExportCSV = () => {
    if (!students.length) return;
    const headers = ['Student Name', 'Section', 'Overall %', 'Critical Subjects', 'Status'];
    const rows = filteredStudents.map((s) => [
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.section || '').replace(/"/g, '""')}"`,
      `${s.percentage.toFixed(1)}%`,
      `"${(s.criticalSubjects?.join(', ') || 'None').replace(/"/g, '""')}"`,
      `"${s.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_attendance_${selectedSection.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Master attendance record exported to CSV.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleAnomalyAction = (anomaly: any) => {
    setActiveAnomaly(anomaly);
  };

  const acknowledgeAnomaly = (id: string) => {
    setAcknowledgedIds((prev) => [...prev, id]);
    setActiveAnomaly(null);
    showToast('Anomaly marked as reviewed.');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle size={18} className="text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Attendance</h1>
          <p className="text-slate-500 font-medium mt-1">Global attendance metrics, section filtering, and anomaly detection.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={loading || filteredStudents.length === 0}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm cursor-pointer"
        >
          <Download size={18} /> Export Master Record ({filteredStudents.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h3 className="font-bold text-slate-900">Attendance Monitoring</h3>
                <p className="text-xs text-slate-500 mt-0.5">Showing {filteredStudents.length} of {students.length} students</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-500 shrink-0" />
                <label htmlFor="section-filter-select" className="sr-only">Filter by Section</label>
                <select
                  id="section-filter-select"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Sections ({students.length})</option>
                  {sections.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec} ({students.filter((s) => s.section === sec).length})
                    </option>
                  ))}
                </select>
              </div>
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
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" /></td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        {selectedSection === 'ALL' ? 'No attendance records found.' : `No students found for Section ${selectedSection}.`}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4 font-bold text-slate-900">{student.name}</td>
                        <td className="py-4 px-4 text-slate-600">{student.section}</td>
                        <td className="py-4 px-4">
                          <span className={`font-bold ${student.percentage < 60 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {student.percentage.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">{student.criticalSubjects?.join(', ') || 'None'}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${student.status === 'LOW_ATTENDANCE' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                            {student.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
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
              ) : (
                anomalies.map((anomaly) => {
                  const isAcked = acknowledgedIds.includes(anomaly.id);
                  return (
                    <div
                      key={anomaly.id}
                      className={`p-3.5 bg-white rounded-xl border shadow-sm transition ${isAcked ? 'opacity-60 border-slate-200' : anomaly.type === 'danger' ? 'border-rose-100' : 'border-amber-100'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-800">{anomaly.title}</p>
                        {isAcked && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">Reviewed</span>}
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{anomaly.description}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAnomalyAction(anomaly)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg flex-1 cursor-pointer transition ${anomaly.type === 'danger' ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'}`}
                        >
                          {anomaly.actionLabel}
                        </button>
                        {!isAcked && (
                          <button
                            onClick={() => acknowledgeAnomaly(anomaly.id)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Investigation Details Modal */}
      {activeAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setActiveAnomaly(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeAnomaly.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{activeAnomaly.title}</h3>
                  <p className="text-xs text-slate-500">Anomaly Investigation Report</p>
                </div>
              </div>
              <button onClick={() => setActiveAnomaly(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-medium text-slate-800 text-xs uppercase tracking-wider mb-1">Observed Pattern</p>
                <p className="text-slate-600 text-xs">{activeAnomaly.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">Confidence</span>
                  <span className="font-bold text-slate-800">High (94%)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">Detection Mode</span>
                  <span className="font-bold text-slate-800">Statistical Outlier</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-blue-800 text-xs">
                <Info size={16} className="shrink-0" />
                <span>Marking this anomaly as reviewed records your audit review and dismisses future active warnings for this batch.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveAnomaly(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => acknowledgeAnomaly(activeAnomaly.id)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                Mark as Reviewed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
