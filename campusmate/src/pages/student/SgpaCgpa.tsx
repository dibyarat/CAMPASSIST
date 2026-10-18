import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { gradesService, type AcademicRecord } from '../../services/gradesService';

export const SgpaCgpa = () => {
  const [activeTab, setActiveTab] = useState<'SGPA' | 'CGPA' | 'Grade Calculator'>('SGPA');
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calculatorRows, setCalculatorRows] = useState([{ subject: '', credits: '', gradePoint: '' }]);

  useEffect(() => {
    gradesService.getMyRecords()
      .then(data => setRecords(data))
      .catch(requestError => setError(requestError instanceof Error ? requestError.message : 'Unable to load academic records.'))
      .finally(() => setLoading(false));
  }, []);

  const validRows = calculatorRows
    .filter(row => row.credits.trim() !== '' && row.gradePoint.trim() !== '')
    .map(row => ({ credits: Number(row.credits), gradePoint: Number(row.gradePoint) }))
    .filter(row => row.credits > 0 && row.gradePoint >= 0 && row.gradePoint <= 10);
  const calculatorCredits = validRows.reduce((sum, row) => sum + row.credits, 0);
  const calculatedSgpa = calculatorCredits > 0
    ? validRows.reduce((sum, row) => sum + row.credits * row.gradePoint, 0) / calculatorCredits
    : null;
  const cgpa = records.find(record => record.cgpa !== null)?.cgpa ?? null;
  const totalCredits = records.reduce((sum, record) => sum + record.totalCredits, 0);

  const updateCalculatorRow = (index: number, field: 'subject' | 'credits' | 'gradePoint', value: string) => {
    setCalculatorRows(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-[var(--glass-surface)] backdrop-blur-xl p-6 rounded-2xl shadow-[var(--card-shadow)] border border-[var(--color-border)] text-[var(--color-text)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">SGPA / CGPA Calculator</h1>
          <p className="text-xs text-[var(--color-muted)] mt-1">Track semester grades, cumulative performance, and forecast your GPA</p>
        </div>
      </div>

      <div className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] shadow-[var(--card-shadow)] overflow-hidden p-6 text-[var(--color-text)]">
        <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl mb-8 w-max mx-auto border border-[var(--color-border)]">
          {['SGPA', 'CGPA', 'Grade Calculator'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 sm:px-8 py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                activeTab === tab 
                  ? 'bg-gradient-brand text-white shadow-xs' 
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-400">{error}</p>}

        {activeTab === 'SGPA' && (
          <div className="px-2 sm:px-4">
            {loading ? (
              <div className="py-10 text-center"><Loader2 className="animate-spin text-[#19A3E9] mx-auto w-8 h-8" /></div>
            ) : records.length === 0 ? (
              <div className="py-10 text-center text-[var(--color-muted)]">No academic records found. Add them through the developer portal or university sync.</div>
            ) : (
              <div className="space-y-8">
                {records.map((record) => (
                  <div key={record.id} className="border border-[var(--color-border)] rounded-2xl p-6 shadow-xs bg-[var(--glass-sub-surface)] backdrop-blur-md">
                    <h3 className="font-bold text-lg text-[var(--color-text)] mb-4">{record.term?.name || 'Term not provided'}</h3>
                    <table className="w-full text-left mb-6">
                      <thead>
                        <tr className="text-[var(--color-muted)] text-sm border-b border-[var(--color-border)]">
                          <th className="font-semibold pb-3 w-1/2">Subject</th>
                          <th className="font-semibold pb-3 text-center">Credits</th>
                          <th className="font-semibold pb-3 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {record.grades.map((g: any) => (
                          <tr key={g.id}>
                            <td className="py-4 pr-4">
                              <div className="text-sm font-medium text-[var(--color-text)]">{g.subject?.name || 'Subject not linked'}</div>
                              <div className="text-xs text-[var(--color-muted)]">{g.subject?.code}</div>
                            </td>
                            <td className="py-4 px-2 text-center text-sm font-medium text-[var(--color-text)]">{g.credits}</td>
                            <td className="py-4 px-2 text-center text-sm font-bold text-[#19A3E9]">{g.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="flex justify-end items-center gap-6 border-t border-[var(--color-border)] pt-4">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Total Credits</p>
                        <p className="text-lg font-bold text-[var(--color-text)]">{record.totalCredits}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Term SGPA</p>
                        <p className="text-3xl font-extrabold text-emerald-400">{record.sgpa === null ? 'N/A' : record.sgpa.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'CGPA' && (
          <section aria-labelledby="cgpa-heading" className="space-y-6">
            <div className="border-b border-[var(--color-border)] pb-5">
              <h2 id="cgpa-heading" className="text-sm font-semibold text-[var(--color-muted)]">Cumulative GPA</h2>
              <p className="mt-2 text-4xl font-extrabold text-[#19A3E9]">
                {loading ? '...' : cgpa === null ? 'N/A' : cgpa.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Across {totalCredits} recorded credits</p>
            </div>
            {records.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
                    <tr>
                      <th className="py-3 pr-4 text-sm font-semibold">Term</th>
                      <th className="py-3 px-4 text-sm font-semibold">Credits</th>
                      <th className="py-3 pl-4 text-right text-sm font-semibold">SGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {records.map(record => (
                      <tr key={record.id}>
                        <td className="py-3 pr-4 text-sm font-medium text-[var(--color-text)]">{record.term?.name || 'Term not provided'}</td>
                        <td className="py-3 px-4 text-sm text-[var(--color-muted)]">{record.totalCredits}</td>
                        <td className="py-3 pl-4 text-right text-sm font-bold text-emerald-400">{record.sgpa === null ? 'N/A' : record.sgpa.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && records.length === 0 && <p className="py-8 text-center text-sm text-[var(--color-muted)]">No academic records found.</p>}
          </section>
        )}

        {activeTab === 'Grade Calculator' && (
          <section aria-labelledby="calculator-heading" className="space-y-5">
            <div>
              <h2 id="calculator-heading" className="text-lg font-bold text-[var(--color-text)]">Calculate term SGPA</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Enter each subject's credit value and grade points.</p>
            </div>
            <div className="space-y-3">
              {calculatorRows.map((row, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_auto]">
                  <input
                    value={row.subject}
                    onChange={event => updateCalculatorRow(index, 'subject', event.target.value)}
                    placeholder="Subject (optional)"
                    aria-label={`Subject ${index + 1}`}
                    className="rounded-xl border border-[var(--color-border)] bg-black/5 dark:bg-white/5 px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[#19A3E9]"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={row.credits}
                    onChange={event => updateCalculatorRow(index, 'credits', event.target.value)}
                    placeholder="Credits"
                    aria-label={`Credits for subject ${index + 1}`}
                    className="rounded-xl border border-[var(--color-border)] bg-black/5 dark:bg-white/5 px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[#19A3E9]"
                  />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={row.gradePoint}
                    onChange={event => updateCalculatorRow(index, 'gradePoint', event.target.value)}
                    placeholder="Grade points"
                    aria-label={`Grade points for subject ${index + 1}`}
                    className="rounded-xl border border-[var(--color-border)] bg-black/5 dark:bg-white/5 px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[#19A3E9]"
                  />
                  <button
                    type="button"
                    onClick={() => setCalculatorRows(rows => rows.filter((_, rowIndex) => rowIndex !== index))}
                    disabled={calculatorRows.length === 1}
                    aria-label={`Remove subject ${index + 1}`}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-muted)] hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-40 transition cursor-pointer"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setCalculatorRows(rows => [...rows, { subject: '', credits: '', gradePoint: '' }])} className="inline-flex items-center gap-2 text-sm font-semibold text-[#19A3E9] hover:underline cursor-pointer">
              <Plus size={17} /> Add subject
            </button>
            <div className="border-t border-[var(--color-border)] pt-5 text-right">
              <p className="text-xs font-semibold uppercase text-[var(--color-muted)]">Calculated SGPA</p>
              <p className="mt-1 text-3xl font-extrabold text-emerald-400" aria-live="polite">
                {calculatedSgpa === null ? '--' : calculatedSgpa.toFixed(2)}
              </p>
              <p className="text-xs text-[var(--color-muted)]">{calculatorCredits} credits included</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
