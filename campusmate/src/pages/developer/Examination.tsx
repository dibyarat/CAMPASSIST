import React, { useEffect, useState } from 'react';
import { CalendarDays, SlidersHorizontal, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Exams } from './Exams';
import { academicTermService } from '../../services/academicTermService';
import { examService } from '../../services/examService';
import { examSeatingService } from '../../services/examSeatingService';

export const Examination: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'settings'>('schedule');
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [seatingJson, setSeatingJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: '' | 'success' | 'error' }>({ text: '', type: '' });

  useEffect(() => {
    if (activeTab !== 'settings') return;
    academicTermService
      .getCurrent()
      .then((term) => examService.listByTerm(term.id))
      .then((list) => {
        const rows = Array.isArray(list) ? list : [];
        setExams(rows);
        if (rows.length > 0 && !selectedExamId) setSelectedExamId(rows[0].id);
      })
      .catch(() => {});
  }, [activeTab]);

  const handleImportSeating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !seatingJson.trim()) return;
    setImporting(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const parsed = JSON.parse(seatingJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Seating payload must be a JSON array of { rollNumber, roomNumber, seatNumber } objects.');
      }
      await examSeatingService.import(selectedExamId, parsed);
      setStatusMsg({ text: `Successfully imported ${parsed.length} seat allocations.`, type: 'success' });
      setSeatingJson('');
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Failed to import seating data.', type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-2xl border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block mb-1">
            Developer Console
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--color-text)] tracking-tight">
            Examination
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Manage published exam schedules and configure exam seating allocations.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 p-1.5 rounded-xl glass border border-[var(--color-border)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'schedule'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <CalendarDays size={16} />
            <span>Exam Schedule</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>Exam Settings</span>
          </button>
        </div>
      </div>

      {activeTab === 'schedule' ? (
        <Exams />
      ) : (
        <div className="glass rounded-2xl border border-[var(--color-border)] p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Seating Allocation Import</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Publish room and seat numbers for a scheduled examination by uploading a JSON list of student allocations.
            </p>
          </div>

          {statusMsg.text && (
            <div
              role="status"
              className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}
            >
              {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleImportSeating} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                Select Examination
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] outline-none focus:border-[#2563EB]"
              >
                {exams.length === 0 ? (
                  <option value="">No exams available in current term</option>
                ) : (
                  exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.subject?.name || exam.subjectRef} ({new Date(exam.date).toLocaleDateString()})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                Seating JSON Array
              </label>
              <textarea
                rows={6}
                value={seatingJson}
                onChange={(e) => setSeatingJson(e.target.value)}
                required
                placeholder='[{"rollNumber": "240101001", "roomNumber": "LH-304", "seatNumber": "A-12"}]'
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] font-mono text-xs outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              disabled={importing || !selectedExamId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold text-sm transition disabled:opacity-50"
            >
              <Upload size={16} />
              <span>{importing ? 'Importing Seating...' : 'Publish Seating Allocations'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
