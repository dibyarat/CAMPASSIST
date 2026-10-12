import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Ban,
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Undo2,
  Plus,
  ChevronDown,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import type {
  AttendanceRegisterStore,
  RegisterSubject,
  RegisterComponent,
  RegisterLog,
} from '../../services/attendanceService';

const LS_KEY = 'attendance-register-v2';

const TODAY = (): string => {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
};

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);

function blank(): AttendanceRegisterStore {
  return { target: 75, subjects: [], logs: [] };
}

const PORTAL_ROWS: [string, string, ...[string, number, number][]][] = [
  ['Job Readiness', 'CUTM1016', ['PR', 11, 15]],
  ['Internship', 'CUTM1905', ['TUT', 1, 1]],
  ['Data Structure and Algorithms', 'CUTM3166', ['PR', 16, 18], ['TUT', 6, 10]],
  ['Machine Learning for Predictive Analytics', 'CUML1021', ['PR', 13, 20], ['TUT', 10, 12]],
  ['Deep Learning for Image Analytics', 'CUML1022', ['PR', 13, 17], ['TUT', 7, 7]],
  ['Data Analytics Using Tableau', 'CUML1023', ['PR', 20, 32], ['TUT', 6, 9]],
  ['Customer Experience Design and Programming', 'CUCS1012', ['PP', 3, 3], ['PR', 7, 8], ['TUT', 2, 3]],
];

function seedState(): AttendanceRegisterStore {
  return {
    target: 75,
    subjects: PORTAL_ROWS.map(([name, code, ...comps]) => ({
      id: 'seed-' + code,
      name,
      code,
      components: comps.map(([key, att, del]) => ({
        key,
        base: { p: att, a: del - att },
      })),
      createdAt: '2026-08-25T00:00:00.000Z',
    })),
    logs: [],
  };
}

function loadInitialStore(): AttendanceRegisterStore {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.subjects) && Array.isArray(parsed.logs)) {
        return {
          target: typeof parsed.target === 'number' ? parsed.target : 75,
          subjects: parsed.subjects,
          logs: parsed.logs,
        };
      }
    }
  } catch (err) {
    console.error('Failed reading localStorage register', err);
  }
  return seedState();
}

/* ————————————————— Mathematical engine ————————————————— */

function compTally(s: RegisterSubject, key: string, logs: RegisterLog[]) {
  const comp = s.components.find((c) => c.key === key);
  let p = comp && comp.base ? comp.base.p || 0 : 0;
  let a = comp && comp.base ? comp.base.a || 0 : 0;
  let c = 0;
  for (const l of logs) {
    if (l.sid !== s.id || l.comp !== key) continue;
    if (l.status === 'p') p++;
    else if (l.status === 'a') a++;
    else c++;
  }
  return { p, a, c, total: p + a };
}

function subjTally(s: RegisterSubject, logs: RegisterLog[]) {
  let p = 0,
    a = 0,
    c = 0;
  for (const comp of s.components) {
    const t = compTally(s, comp.key, logs);
    p += t.p;
    a += t.a;
    c += t.c;
  }
  return { p, a, c, total: p + a };
}

function overallTally(store: AttendanceRegisterStore) {
  let p = 0,
    a = 0,
    c = 0;
  for (const s of store.subjects) {
    const t = subjTally(s, store.logs);
    p += t.p;
    a += t.a;
    c += t.c;
  }
  return { p, a, c, total: p + a };
}

function pct(a: number, t: number): number | null {
  return t === 0 ? null : (a / t) * 100;
}

function fmtPct(x: number | null): string {
  return x === null ? '—' : (Math.round(x * 10) / 10).toFixed(1);
}

function verdict(a: number, t: number, target: number) {
  const T = target;
  if (t === 0) return { key: 'empty' as const, need: 0, bunk: 0 };
  const num = T * t - 100 * a;
  const need = num > 0 ? Math.ceil(num / (100 - T)) : 0;
  const bunk = Math.max(0, Math.floor((100 * a - T * t) / T));
  return {
    key: (need > 0 ? 'short' : bunk > 0 ? 'safe' : 'tight') as
      | 'empty'
      | 'short'
      | 'tight'
      | 'safe',
    need,
    bunk,
  };
}

const DTF = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

function fmtDate(iso: string) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return iso === TODAY() ? 'Today' : DTF.format(d);
  } catch {
    return iso;
  }
}

export const Attendance: React.FC = () => {
  const [store, setStore] = useState<AttendanceRegisterStore>(loadInitialStore);
  const [undoBuffer, setUndoBuffer] = useState<RegisterLog | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; hasUndo?: boolean } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [renamingSid, setRenamingSid] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  // Add subject state
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjComps, setNewSubjComps] = useState('PR, TUT');

  // Past date entries per subject: { [sid]: { date: string, comp: string } }
  const [pastLogState, setPastLogState] = useState<Record<string, { date: string; comp: string }>>({});

  // Base edit state per subject component: { [`${sid}-${compKey}`]: { p: string, t: string } }
  const [baseInputState, setBaseInputState] = useState<Record<string, { p: string; t: string }>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Sync to localStorage immediately on store changes
  const saveStore = (next: AttendanceRegisterStore) => {
    setStore(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
    // Background cloud backup
    attendanceService.saveRegister(next).catch((err) => {
      console.warn('Background sync error:', err);
    });
  };

  // On mount, check if cloud register has updates
  useEffect(() => {
    let isMounted = true;
    attendanceService
      .getRegister()
      .then((remote) => {
        if (!isMounted) return;
        if (remote && Array.isArray(remote.subjects) && remote.subjects.length > 0) {
          // If local is empty or untouched default seed, take cloud
          const localRaw = localStorage.getItem(LS_KEY);
          if (!localRaw) {
            setStore(remote);
            localStorage.setItem(LS_KEY, JSON.stringify(remote));
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const triggerToast = (text: string, hasUndo = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMsg({ text, hasUndo });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg(null);
    }, hasUndo ? 5500 : 2600);
  };

  /* ————— Log action ————— */
  const handleLog = (sid: string, comp: string, status: 'p' | 'a' | 'c', dateISO?: string) => {
    const s = store.subjects.find((item) => item.id === sid);
    if (!s) return;
    const date = dateISO || TODAY();
    const newLog: RegisterLog = {
      id: uid(),
      sid,
      comp,
      status,
      date,
      at: new Date().toISOString(),
    };
    const nextLogs = [...store.logs, newLog];
    const next = { ...store, logs: nextLogs };
    saveStore(next);

    const label = status === 'p' ? 'Present' : status === 'a' ? 'Absent' : 'Cancelled';
    triggerToast(`${label} · ${s.name} · ${comp} · ${fmtDate(date)}`);
  };

  /* ————— Delete Entry ————— */
  const handleDeleteEntry = (logId: string) => {
    const targetLog = store.logs.find((l) => l.id === logId);
    if (!targetLog) return;
    setUndoBuffer(targetLog);
    const nextLogs = store.logs.filter((l) => l.id !== logId);
    const next = { ...store, logs: nextLogs };
    saveStore(next);
    triggerToast('Entry removed', true);
  };

  const handleUndo = () => {
    if (!undoBuffer) return;
    const nextLogs = [...store.logs, undoBuffer];
    const next = { ...store, logs: nextLogs };
    setUndoBuffer(null);
    saveStore(next);
    setToastMsg(null);
  };

  /* ————— Base opening balance actions ————— */
  const handleSetBase = (sid: string, compKey: string, e: React.FormEvent) => {
    e.preventDefault();
    const keyId = `${sid}-${compKey}`;
    const inputVals = baseInputState[keyId];
    if (!inputVals) {
      triggerToast('Enter both attended and delivered counts');
      return;
    }
    const att = parseInt(inputVals.p, 10);
    const del = parseInt(inputVals.t, 10);
    if (isNaN(att) || isNaN(del)) {
      triggerToast('Enter both attended and delivered counts');
      return;
    }
    if (att < 0 || del < att) {
      triggerToast('Delivered classes must be ≥ attended classes');
      return;
    }

    const nextSubjects = store.subjects.map((s) => {
      if (s.id !== sid) return s;
      return {
        ...s,
        components: s.components.map((c) => {
          if (c.key !== compKey) return c;
          return {
            ...c,
            base: { p: att, a: del - att },
          };
        }),
      };
    });

    saveStore({ ...store, subjects: nextSubjects });
    setBaseInputState((prev) => ({ ...prev, [keyId]: { p: '', t: '' } }));
    triggerToast(`Opening balance set · ${compKey}`);
  };

  const handleClearBase = (sid: string, compKey: string) => {
    const nextSubjects = store.subjects.map((s) => {
      if (s.id !== sid) return s;
      return {
        ...s,
        components: s.components.map((c) => {
          if (c.key !== compKey) return c;
          return { ...c, base: { p: 0, a: 0 } };
        }),
      };
    });
    saveStore({ ...store, subjects: nextSubjects });
    triggerToast(`Opening balance cleared · ${compKey}`);
  };

  /* ————— Subject Management ————— */
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubjName.trim();
    if (!name) return;
    const code = newSubjCode.trim().toUpperCase().slice(0, 16);
    const comps = [
      ...new Set(
        newSubjComps
          .toUpperCase()
          .split(/[,\s]+/)
          .map((x) => x.replace(/[^A-Z0-9]/g, ''))
          .filter(Boolean)
          .map((x) => x.slice(0, 6))
      ),
    ].slice(0, 4);

    const components: RegisterComponent[] = (comps.length ? comps : ['PR']).map((k) => ({
      key: k,
      base: { p: 0, a: 0 },
    }));

    const newSubj: RegisterSubject = {
      id: uid(),
      name: name.slice(0, 60),
      code,
      components,
      createdAt: new Date().toISOString(),
    };

    saveStore({
      ...store,
      subjects: [...store.subjects, newSubj],
    });

    setNewSubjName('');
    setNewSubjCode('');
    setNewSubjComps('PR, TUT');
    triggerToast(`${name} added`);
  };

  const handleDeleteSubject = (s: RegisterSubject) => {
    const count = store.logs.filter((l) => l.sid === s.id).length;
    if (
      window.confirm(
        `Delete "${s.name}" and its ${count} logged ${count === 1 ? 'entry' : 'entries'}? This cannot be undone.`
      )
    ) {
      const nextSubjects = store.subjects.filter((x) => x.id !== s.id);
      const nextLogs = store.logs.filter((l) => l.sid !== s.id);
      saveStore({ ...store, subjects: nextSubjects, logs: nextLogs });
      triggerToast('Subject deleted');
    }
  };

  const handleCommitRename = (sid: string) => {
    if (!renameVal.trim()) {
      setRenamingSid(null);
      return;
    }
    const nextSubjects = store.subjects.map((s) =>
      s.id === sid ? { ...s, name: renameVal.trim().slice(0, 60) } : s
    );
    saveStore({ ...store, subjects: nextSubjects });
    setRenamingSid(null);
    triggerToast('Subject renamed');
  };

  /* ————— Export / Import / Erase ————— */
  const handleExport = () => {
    const json = JSON.stringify(store, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'attendance-register-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    triggerToast('Backup downloaded');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!Array.isArray(parsed.subjects) || !Array.isArray(parsed.logs)) {
          throw new Error('Invalid schema');
        }
        if (
          window.confirm(
            `Replace current register with this backup? (${parsed.subjects.length} subjects, ${parsed.logs.length} logged entries)`
          )
        ) {
          saveStore({
            target: typeof parsed.target === 'number' ? parsed.target : 75,
            subjects: parsed.subjects,
            logs: parsed.logs,
          });
          triggerToast('Backup restored successfully');
        }
      } catch {
        triggerToast("That file isn't a valid attendance register backup");
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleEraseEverything = () => {
    if (
      window.confirm(
        'Erase every subject and entry? Consider exporting a backup first. This will reset the register.'
      )
    ) {
      saveStore(blank());
      triggerToast('Register erased');
    }
  };

  // Calculations for overall
  const overall = useMemo(() => overallTally(store), [store]);
  const overallVerd = useMemo(
    () => verdict(overall.p, overall.total, store.target),
    [overall, store.target]
  );
  const overallPercentage = pct(overall.p, overall.total);

  // Today count helper
  const getTodayCounts = (sid: string, compKey: string) => {
    const td = TODAY();
    const c = { p: 0, a: 0, c: 0 };
    for (const l of store.logs) {
      if (l.sid === sid && l.comp === compKey && l.date === td) {
        c[l.status]++;
      }
    }
    return c;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Hidden file input for backup import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept="application/json,.json"
        className="hidden"
      />

      {/* Top Header Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
              End-sem eligibility · minimum {store.target}%
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Attendance Register
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <Calendar size={15} className="text-slate-400" />
            {new Intl.DateTimeFormat('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date())}
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-2xs transition cursor-pointer"
            >
              <SettingsIcon size={16} />
              <span>Settings</span>
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-5 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Register Settings</h3>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Required Attendance (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={store.target}
                        onChange={(e) => {
                          let v = parseInt(e.target.value, 10);
                          if (isNaN(v)) v = 75;
                          v = Math.min(100, Math.max(1, v));
                          saveStore({ ...store, target: v });
                        }}
                        className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-base outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-slate-500">% threshold</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Every verdict and calculation adapts to this goal.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Backup & Data
                    </p>
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Download size={14} className="text-blue-600" />
                      <span>Export Backup (.json)</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Upload size={14} className="text-emerald-600" />
                      <span>Import Backup (.json)</span>
                    </button>
                    <button
                      onClick={handleEraseEverything}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                      <span>Erase Everything</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overall Ledger Summary Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Overall Attendance — All Subjects</h2>
            <span className="text-xs text-slate-400 font-medium">Combined Components</span>
          </div>

          {/* Verdict Stamp Badge */}
          {overallVerd.key !== 'empty' && (
            <div
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-extrabold text-sm uppercase tracking-wider border-2 transform -rotate-2 ${
                overallVerd.key === 'safe'
                  ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                  : overallVerd.key === 'tight'
                  ? 'bg-amber-50 border-amber-600 text-amber-700 shadow-xs'
                  : 'bg-rose-50 border-rose-600 text-rose-700 shadow-xs'
              }`}
            >
              {overallVerd.key === 'safe' ? (
                <>
                  <ShieldCheck size={16} /> SAFE
                </>
              ) : overallVerd.key === 'tight' ? (
                <>
                  <AlertCircle size={16} /> TIGHT
                </>
              ) : (
                <>
                  <AlertTriangle size={16} /> SHORT
                </>
              )}
            </div>
          )}
        </div>

        {/* Overall Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 flex flex-col">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-5xl sm:text-6xl font-black tracking-tight font-mono ${
                  overallVerd.key === 'short'
                    ? 'text-rose-600'
                    : overallVerd.key === 'tight'
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`}
              >
                {fmtPct(overallPercentage)}
              </span>
              <span className="text-2xl font-bold text-slate-400">%</span>
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-2">
              <b>{overall.p}</b> attended · <b>{overall.a}</b> missed
              {overall.c > 0 && <span className="text-slate-400"> · {overall.c} cancelled</span>}
            </p>
          </div>

          <div className="md:col-span-8 flex flex-col justify-center">
            {/* Visual segmented bar with target tick */}
            <div className="relative pt-6 pb-2">
              {/* Tick label */}
              {overall.total > 0 && (
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${Math.min(100, Math.max(0, store.target))}%` }}
                >
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {store.target}% min
                  </span>
                  <div className="w-0.5 h-3 bg-slate-900 mt-0.5"></div>
                </div>
              )}

              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {overall.total === 0 ? (
                  <div className="w-full h-full bg-slate-200/60" />
                ) : (
                  <>
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ flex: overall.p }}
                      title={`${overall.p} attended`}
                    />
                    {overall.a > 0 && (
                      <div
                        className="bg-rose-500 h-full transition-all duration-300"
                        style={{ flex: overall.a }}
                        title={`${overall.a} missed`}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Overall Advice Callout */}
            <div
              className={`mt-4 p-4 rounded-2xl border flex items-start gap-3 ${
                overallVerd.key === 'empty'
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : overallVerd.key === 'short'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : overallVerd.key === 'tight'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}
            >
              <Info className="shrink-0 mt-0.5" size={18} />
              <div className="text-sm font-semibold leading-relaxed">
                {overallVerd.key === 'empty' && (
                  <span>No classes counted yet. Add your subjects below and start marking!</span>
                )}
                {overallVerd.key === 'short' && (
                  <span>
                    You're short of {store.target}% — attend the next{' '}
                    <span className="underline decoration-2 font-bold">{overallVerd.need}</span>{' '}
                    classes straight without skipping to get back to {store.target}%.
                  </span>
                )}
                {overallVerd.key === 'tight' && (
                  <span>
                    Holding {store.target}% on a knife's edge — you cannot afford any absences. Sit
                    every class from here on.
                  </span>
                )}
                {overallVerd.key === 'safe' && (
                  <span>
                    You can miss up to{' '}
                    <span className="underline decoration-2 font-bold">{overallVerd.bunk}</span>{' '}
                    more {overallVerd.bunk === 1 ? 'class' : 'classes'} and still walk into the
                    end-sem hall above {store.target}%.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Subject Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={18} className="text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Add New Subject</h2>
        </div>

        <form
          onSubmit={handleAddSubject}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
        >
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Subject Name (e.g. Operating Systems)"
              value={newSubjName}
              onChange={(e) => setNewSubjName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="Code (e.g. CS204)"
              value={newSubjCode}
              onChange={(e) => setNewSubjCode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="PR, TUT"
              value={newSubjComps}
              onChange={(e) => setNewSubjComps(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-primary text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>

      {/* Subject Cards Grid */}
      {store.subjects.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-dashed border-slate-300 text-center space-y-3">
          <p className="text-xl font-bold text-slate-800 font-serif italic">
            "Every bunk starts with honest bookkeeping."
          </p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Add a subject above — include its components (PR, TUT...) — then mark each period. The
            register does the arithmetic.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {store.subjects.map((s) => {
            const tally = subjTally(s, store.logs);
            const verd = verdict(tally.p, tally.total, store.target);
            const percentage = pct(tally.p, tally.total);
            const pastState = pastLogState[s.id] || {
              date: TODAY(),
              comp: s.components[0]?.key || 'PR',
            };

            const subjLogs = store.logs
              .filter((l) => l.sid === s.id)
              .sort(
                (x, y) =>
                  y.date.localeCompare(x.date) || (y.at || '').localeCompare(x.at || '')
              );

            return (
              <div
                key={s.id}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      {renamingSid === s.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={renameVal}
                            onChange={(e) => setRenameVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCommitRename(s.id);
                              if (e.key === 'Escape') setRenamingSid(null);
                            }}
                            autoFocus
                            className="px-3 py-1 text-base font-bold rounded-lg border border-blue-500 outline-none w-full"
                          />
                          <button
                            onClick={() => handleCommitRename(s.id)}
                            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setRenamingSid(null)}
                            className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
                            {s.name}
                          </h3>
                          {s.code && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-bold">
                              {s.code}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Verdict Stamp */}
                    {verd.key !== 'empty' && (
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border-1.5 shrink-0 ${
                          verd.key === 'safe'
                            ? 'bg-blue-50 border-blue-600 text-blue-700'
                            : verd.key === 'tight'
                            ? 'bg-amber-50 border-amber-600 text-amber-700'
                            : 'bg-rose-50 border-rose-600 text-rose-700'
                        }`}
                      >
                        {verd.key.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Attendance numbers */}
                  <p className="text-sm font-semibold text-slate-500 mb-2">
                    <b className="text-slate-900 font-bold">{tally.p}</b>/{tally.total} attended ·{' '}
                    <b
                      className={`font-bold ${
                        verd.key === 'short'
                          ? 'text-rose-600'
                          : verd.key === 'tight'
                          ? 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {fmtPct(percentage)}%
                    </b>
                    {tally.c > 0 && <span className="text-slate-400"> · {tally.c} cancelled</span>}
                  </p>

                  {/* Segmented bar */}
                  <div className="relative pt-4 pb-2 mb-2">
                    {tally.total > 0 && (
                      <div
                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                        style={{ left: `${Math.min(100, Math.max(0, store.target))}%` }}
                      >
                        <div className="w-0.5 h-3 bg-slate-900" />
                      </div>
                    )}
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      {tally.total === 0 ? (
                        <div className="w-full h-full bg-slate-200/50" />
                      ) : (
                        <>
                          <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ flex: tally.p }}
                          />
                          {tally.a > 0 && (
                            <div
                              className="bg-rose-500 h-full transition-all duration-300"
                              style={{ flex: tally.a }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Advice sentence */}
                  <div className="mb-4">
                    {verd.key === 'empty' && (
                      <p className="text-xs font-semibold text-slate-400">
                        No classes counted yet — mark your first one below.
                      </p>
                    )}
                    {verd.key === 'short' && (
                      <p className="text-xs font-semibold text-rose-600">
                        ↳ Attend the next <b className="font-bold">{verd.need}</b> in a row (no
                        skips) to get back to {store.target}%{' '}
                        <span className="opacity-75">
                          (→ {fmtPct(pct(tally.p + verd.need, tally.total + verd.need))}%)
                        </span>
                      </p>
                    )}
                    {verd.key === 'tight' && (
                      <p className="text-xs font-semibold text-amber-600">
                        ↳ Too tight to skip — one more absence drops you under {store.target}%.
                      </p>
                    )}
                    {verd.key === 'safe' && (
                      <p className="text-xs font-semibold text-blue-600">
                        ↳ Miss up to <b className="font-bold">{verd.bunk}</b> more and you'll still
                        hold ≥ {store.target}%.
                      </p>
                    )}
                  </div>

                  {/* Component Rows with Today-Marking Buttons */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    {s.components.map((comp) => {
                      const ct = compTally(s, comp.key, store.logs);
                      const tc = getTodayCounts(s.id, comp.key);
                      return (
                        <div
                          key={comp.key}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700">
                              {comp.key}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              <b>{ct.p}</b>/{ct.total} · {fmtPct(pct(ct.p, ct.total))}%
                              {ct.c > 0 && (
                                <span className="text-slate-400"> · {ct.c} canc.</span>
                              )}
                            </span>
                          </div>

                          {/* Quick Mark buttons for Today */}
                          <div
                            className="inline-flex rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs self-end sm:self-auto"
                            role="group"
                          >
                            <button
                              onClick={() => handleLog(s.id, comp.key, 'p')}
                              className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                tc.p > 0
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                              title="Mark Present today"
                            >
                              <span>✓ Present</span>
                              {tc.p > 0 && (
                                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-blue-600 font-extrabold">
                                  {tc.p}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => handleLog(s.id, comp.key, 'a')}
                              className={`px-3 py-1.5 text-xs font-bold transition border-l border-slate-200 flex items-center gap-1 cursor-pointer ${
                                tc.a > 0
                                  ? 'bg-rose-600 text-white'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                              title="Mark Absent today"
                            >
                              <span>✗ Absent</span>
                              {tc.a > 0 && (
                                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-rose-600 font-extrabold">
                                  {tc.a}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => handleLog(s.id, comp.key, 'c')}
                              className={`px-3 py-1.5 text-xs font-bold transition border-l border-slate-200 flex items-center gap-1 cursor-pointer ${
                                tc.c > 0
                                  ? 'bg-slate-800 text-white'
                                  : 'text-slate-500 hover:bg-slate-50'
                              }`}
                              title="Mark Cancelled today (not counted towards total)"
                            >
                              <span>⊘ Canc.</span>
                              {tc.c > 0 && (
                                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-slate-800 font-extrabold">
                                  {tc.c}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible History & Past Entry */}
                <details className="mt-4 border-t border-slate-100 pt-3 group">
                  <summary className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-800 select-none flex items-center justify-between py-1">
                    <span>History & Past Entry</span>
                    <ChevronDown
                      size={15}
                      className="transform group-open:rotate-180 transition-transform"
                    />
                  </summary>

                  <div className="pt-3 space-y-4 animate-in fade-in duration-200">
                    {/* Log for past date */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Log Past Class
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          max={TODAY()}
                          value={pastState.date}
                          onChange={(e) =>
                            setPastLogState((prev) => ({
                              ...prev,
                              [s.id]: { ...pastState, date: e.target.value },
                            }))
                          }
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                        />
                        <select
                          value={pastState.comp}
                          onChange={(e) =>
                            setPastLogState((prev) => ({
                              ...prev,
                              [s.id]: { ...pastState, comp: e.target.value },
                            }))
                          }
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                        >
                          {s.components.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.key}
                            </option>
                          ))}
                        </select>
                        <div className="inline-flex rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <button
                            onClick={() =>
                              handleLog(s.id, pastState.comp, 'p', pastState.date)
                            }
                            className="px-2.5 py-1 text-xs font-semibold hover:bg-slate-100"
                          >
                            Present
                          </button>
                          <button
                            onClick={() =>
                              handleLog(s.id, pastState.comp, 'a', pastState.date)
                            }
                            className="px-2.5 py-1 text-xs font-semibold border-l border-slate-200 hover:bg-slate-100 text-rose-600"
                          >
                            Absent
                          </button>
                          <button
                            onClick={() =>
                              handleLog(s.id, pastState.comp, 'c', pastState.date)
                            }
                            className="px-2.5 py-1 text-xs font-semibold border-l border-slate-200 hover:bg-slate-100 text-slate-500"
                          >
                            Canc.
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Opening Balances */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Opening Balances (Portal Import)
                      </p>
                      {s.components.map((comp) => {
                        const hasBase = comp.base && (comp.base.p || 0) + (comp.base.a || 0) > 0;
                        const keyId = `${s.id}-${comp.key}`;
                        const currentInput = baseInputState[keyId] || { p: '', t: '' };

                        return (
                          <div key={comp.key} className="space-y-1.5">
                            {hasBase && (
                              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-600">
                                    {comp.key}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-[10px] font-bold text-slate-600 uppercase">
                                    Opening
                                  </span>
                                  <span className="text-slate-600">
                                    {comp.base.p} attended · {comp.base.a} missed
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleClearBase(s.id, comp.key)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title="Remove opening balance"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}

                            {/* Set opening form */}
                            <form
                              onSubmit={(e) => handleSetBase(s.id, comp.key, e)}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span className="w-10 font-mono font-bold text-slate-600">
                                {comp.key}
                              </span>
                              <input
                                type="number"
                                min="0"
                                placeholder="att"
                                value={currentInput.p}
                                onChange={(e) =>
                                  setBaseInputState((prev) => ({
                                    ...prev,
                                    [keyId]: { ...currentInput, p: e.target.value },
                                  }))
                                }
                                className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="delivered"
                                value={currentInput.t}
                                onChange={(e) =>
                                  setBaseInputState((prev) => ({
                                    ...prev,
                                    [keyId]: { ...currentInput, t: e.target.value },
                                  }))
                                }
                                className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none"
                              />
                              <button
                                type="submit"
                                className="px-2.5 py-1 bg-slate-800 text-white font-bold rounded-lg hover:bg-black transition"
                              >
                                Set
                              </button>
                            </form>
                          </div>
                        );
                      })}
                    </div>

                    {/* Entries Log List */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Logged Entries ({subjLogs.length})
                      </p>
                      {subjLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No entries logged yet.</p>
                      ) : (
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                          {subjLogs.map((l) => (
                            <div
                              key={l.id}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-500 text-[11px]">
                                  {fmtDate(l.date)}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                                  {l.comp}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    l.status === 'p'
                                      ? 'bg-blue-50 text-blue-700'
                                      : l.status === 'a'
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {l.status === 'p'
                                    ? 'Present'
                                    : l.status === 'a'
                                    ? 'Absent'
                                    : 'Cancelled'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteEntry(l.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                                title="Delete entry"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Utilities */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                      <button
                        onClick={() => {
                          setRenamingSid(s.id);
                          setRenameVal(s.name);
                        }}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit2 size={12} /> Rename Subject
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(s)}
                        className="text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete Subject
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}

      {/* Explanatory Footnote */}
      <div className="p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 text-xs text-slate-500 space-y-1.5 leading-relaxed">
        <p>
          <b className="text-slate-800 font-semibold">How it's counted:</b> each subject's
          components (<span className="font-mono">PR</span> / <span className="font-mono">TUT</span>{' '}
          / <span className="font-mono">PP</span> / <span className="font-mono">TH</span>) are
          combined into one total, the exact way your university and portal snapshot calculates it.
          Mark each component separately after every period — cancelled periods aren't counted.
        </p>
        <p>
          "Miss up to N" calculates the maximum classes you can safely skip while holding ≥{' '}
          {store.target}%. "Attend next N" calculates the exact minimum classes in a row needed to
          pull your percentage back to eligibility.
        </p>
      </div>

      {/* Toast Notification with Undo */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span>{toastMsg.text}</span>
          {toastMsg.hasUndo && (
            <button
              onClick={handleUndo}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-1 font-bold text-xs transition cursor-pointer"
            >
              <Undo2 size={12} /> Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
};
