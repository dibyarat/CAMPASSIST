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
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">SGPA / CGPA Calculator</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="flex bg-slate-50 p-1 rounded-xl mb-8 w-max mx-auto">
          {['SGPA', 'CGPA', 'Grade Calculator'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === tab 
                  ? 'bg-[var(--brand-blue)] text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        {activeTab === 'SGPA' && (
          <div className="px-4">
            {loading ? (
              <div className="py-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" /></div>
            ) : records.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No academic records found. Add them through the developer portal or university sync.</div>
            ) : (
              <div className="space-y-10">
                {records.map((record) => (
                  <div key={record.id} className="border border-slate-100 rounded-xl p-6 shadow-sm bg-white">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">{record.term?.name || 'Term not provided'}</h3>
                    <table className="w-full text-left mb-6">
                      <thead>
                        <tr className="text-slate-500 text-sm border-b border-slate-100">
                          <th className="font-semibold pb-3 w-1/2">Subject</th>
                          <th className="font-semibold pb-3 text-center">Credits</th>
                          <th className="font-semibold pb-3 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {record.grades.map((g: any) => (
                          <tr key={g.id}>
                            <td className="py-4 pr-4">
                              <div className="text-sm font-medium text-slate-700">{g.subject?.name || 'Subject not linked'}</div>
                              <div className="text-xs text-slate-400">{g.subject?.code}</div>
                            </td>
                            <td className="py-4 px-2 text-center text-sm font-medium text-slate-700">{g.credits}</td>
                            <td className="py-4 px-2 text-center text-sm font-bold text-blue-600">{g.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="flex justify-end items-center gap-6 border-t border-slate-100 pt-4">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Credits</p>
                        <p className="text-lg font-bold text-slate-700">{record.totalCredits}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Term SGPA</p>
                        <p className="text-3xl font-extrabold text-emerald-500">{record.sgpa === null ? 'N/A' : record.sgpa.toFixed(2)}</p>
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
            <div className="border-b border-slate-100 pb-5">
              <h2 id="cgpa-heading" className="text-sm font-semibold text-slate-500">Cumulative GPA</h2>
              <p className="mt-2 text-4xl font-bold text-slate-900">
                {loading ? '...' : cgpa === null ? 'N/A' : cgpa.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-slate-500">Across {totalCredits} recorded credits</p>
            </div>
            {records.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="py-3 pr-4 text-sm font-semibold text-slate-500">Term</th>
                      <th className="py-3 px-4 text-sm font-semibold text-slate-500">Credits</th>
                      <th className="py-3 pl-4 text-right text-sm font-semibold text-slate-500">SGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map(record => (
                      <tr key={record.id}>
                        <td className="py-3 pr-4 text-sm text-slate-700">{record.term?.name || 'Term not provided'}</td>
                        <td className="py-3 px-4 text-sm text-slate-700">{record.totalCredits}</td>
                        <td className="py-3 pl-4 text-right text-sm font-semibold text-slate-800">{record.sgpa === null ? 'N/A' : record.sgpa.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && records.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No academic records found.</p>}
          </section>
        )}

        {activeTab === 'Grade Calculator' && (
          <section aria-labelledby="calculator-heading" className="space-y-5">
            <div>
              <h2 id="calculator-heading" className="text-lg font-bold text-slate-900">Calculate term SGPA</h2>
              <p className="mt-1 text-sm text-slate-500">Enter each subject's credit value and grade points.</p>
            </div>
            <div className="space-y-3">
              {calculatorRows.map((row, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_auto]">
                  <input
                    value={row.subject}
                    onChange={event => updateCalculatorRow(index, 'subject', event.target.value)}
                    placeholder="Subject (optional)"
                    aria-label={`Subject ${index + 1}`}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={row.credits}
                    onChange={event => updateCalculatorRow(index, 'credits', event.target.value)}
                    placeholder="Credits"
                    aria-label={`Credits for subject ${index + 1}`}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
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
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setCalculatorRows(rows => rows.filter((_, rowIndex) => rowIndex !== index))}
                    disabled={calculatorRows.length === 1}
                    aria-label={`Remove subject ${index + 1}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setCalculatorRows(rows => [...rows, { subject: '', credits: '', gradePoint: '' }])} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
              <Plus size={17} /> Add subject
            </button>
            <div className="border-t border-slate-100 pt-5 text-right">
              <p className="text-xs font-semibold uppercase text-slate-500">Calculated SGPA</p>
              <p className="mt-1 text-3xl font-bold text-emerald-600" aria-live="polite">
                {calculatedSgpa === null ? '--' : calculatedSgpa.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">{calculatorCredits} credits included</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
