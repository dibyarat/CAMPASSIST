import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, SlidersHorizontal } from 'lucide-react';
import { ExamSchedule } from './ExamSchedule';
import { ExamSeat } from './ExamSeat';

export const Examination: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab')?.toLowerCase() === 'settings' ? 'settings' : 'schedule';
  const [activeTab, setActiveTab] = useState<'schedule' | 'settings'>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab')?.toLowerCase();
    if (t === 'settings' || t === 'seating') setActiveTab('settings');
    else if (t === 'schedule') setActiveTab('schedule');
  }, [searchParams]);

  const switchTab = (tab: 'schedule' | 'settings') => {
    setActiveTab(tab);
    setSearchParams(tab === 'settings' ? { tab: 'settings' } : {});
  };

  return (
    <div className="max-w-5xl space-y-6 pb-10">
      <div className="glass p-6 rounded-2xl border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block mb-1">
            Academic Assessments
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--color-text)] tracking-tight">
            Examination
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            View your upcoming exam timetable and manage your seating &amp; exam settings.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 p-1.5 rounded-xl glass border border-[var(--color-border)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => switchTab('schedule')}
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
            onClick={() => switchTab('settings')}
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

      {activeTab === 'schedule' ? <ExamSchedule /> : <ExamSeat />}
    </div>
  );
};
