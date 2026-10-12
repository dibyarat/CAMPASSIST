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
import { authService } from '../../services/authService';
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

function isApkSeedSubject(s: any): boolean {
  return typeof s?.id === 'string' && s.id.startsWith('seed-');
}

function loadInitialStore(): AttendanceRegisterStore {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.subjects) && Array.isArray(parsed.logs)) {
        const cleanSubjects = parsed.subjects.filter((s: any) => !isApkSeedSubject(s));
        const cleanSubjectIds = new Set(cleanSubjects.map((s: any) => s.id));
        const cleanLogs = parsed.logs.filter((l: any) => cleanSubjectIds.has(l.sid));

        const cleanedStore: AttendanceRegisterStore = {
          target: typeof parsed.target === 'number' ? parsed.target : 75,
          subjects: cleanSubjects,
          logs: cleanLogs,
        };

        if (cleanSubjects.length !== parsed.subjects.length) {
          localStorage.setItem(LS_KEY, JSON.stringify(cleanedStore));
        }

        return cleanedStore;
      }
    }
  } catch (err) {
    console.error('Failed reading localStorage register', err);
  }
  return blank();
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

function getPersonalizedMessage(attended: number, total: number, target: number, rawGender?: string): string {
  if (total <= 0) return 'Add your subjects and start marking attendance below to plan your semester.';
  const g = String(rawGender || '').toLowerCase();
  const isBoy = g.includes('boy') || g === 'male';
  const isGirl = g.includes('girl') || g === 'female';

  const currentPct = (attended / total) * 100;
  const isSafe = currentPct >= target;

  if (isSafe) {
    const skippable = Math.floor((attended * 100) / target - total);
    if (skippable <= 0) {
      if (isBoy) return `You're right at ${target}%, bro! Sit every upcoming class to hold your ground.`;
      if (isGirl) return `You're right at ${target}%, sister! Attend the next class to protect your streak.`;
      return `You are right at ${target}%. Attend the next class to stay safe.`;
    }
    const classWord = skippable === 1 ? 'class' : 'classes';
    if (isBoy) return `Looking strong, brother! You can safely skip ${skippable} more ${classWord} and stay at or above ${target}%.`;
    if (isGirl) return `Looking great, sister! You can safely skip ${skippable} more ${classWord} and stay at or above ${target}%.`;
    return `You can skip ${skippable} more ${classWord} and stay at or above ${target}%.`;
  } else {
    const needed = Math.ceil((target * total - 100 * attended) / (100 - target));
    const classWord = needed === 1 ? 'class' : 'classes';
    if (isBoy) return `Time to lock in, bro! Attend the next ${needed} ${classWord} in a row to reach ${target}%.`;
    if (isGirl) return `Heads up girl! Attend the next ${needed} ${classWord} in a row to reach ${target}%.`;
    return `Attend the next ${needed} ${classWord} in a row to reach ${target}%.`;
  }
}

export const Attendance: React.FC = () => {
  const [store, setStore] = useState<AttendanceRegisterStore>(loadInitialStore);
  const [undoBuffer, setUndoBuffer] = useState<RegisterLog | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; hasUndo?: boolean } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [renamingSid, setRenamingSid] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  // User Profile for Gender Preference
  const [userProfile, setUserProfile] = useState<any>(null);

  // Add subject state
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjComps, setNewSubjComps] = useState('PR, TUT');

  // Interactive Sliders Simulation State
  const [sliderAttended, setSliderAttended] = useState<number | null>(null);
  const [sliderTotal, setSliderTotal] = useState<number | null>(null);

  // Past date entries per subject: { [sid]: { date: string, comp: string } }
  const [pastLogState, setPastLogState] = useState<Record<string, { date: string; comp: string }>>({});

  // Base edit state per subject component: { [`${sid}-${compKey}`]: { p: string, t: string } }
  const [baseInputState, setBaseInputState] = useState<Record<string, { p: string; t: string }>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<any>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  // Load User Profile on mount
  useEffect(() => {
    authService.me().then(setUserProfile).catch(() => {});
  }, []);

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
        if (remote && Array.isArray(remote.subjects)) {
          const cleanSubjects = remote.subjects.filter((s: any) => !isApkSeedSubject(s));
          const cleanSubjectIds = new Set(cleanSubjects.map((s: any) => s.id));
          const cleanLogs = (remote.logs || []).filter((l: any) => cleanSubjectIds.has(l.sid));

          const cleanRemote: AttendanceRegisterStore = {
            target: typeof remote.target === 'number' ? remote.target : 75,
            subjects: cleanSubjects,
            logs: cleanLogs,
          };

          setStore(cleanRemote);
          localStorage.setItem(LS_KEY, JSON.stringify(cleanRemote));
        }
      })
      .catch((err) => {
        console.warn('Could not sync with cloud register on mount:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (text: string, hasUndo = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMsg({ text, hasUndo });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  const handleLog = (
    sid: string,
    compKey: string,
    status: 'p' | 'a' | 'c',
    customDate?: string
  ) => {
    const date = customDate || TODAY();
    const log: RegisterLog = {
      id: uid(),
      sid,
      comp: compKey,
      status,
      date,
      at: new Date().toISOString(),
    };
    const nextLogs = [log, ...store.logs];
    const next = { ...store, logs: nextLogs };
    setUndoBuffer(log);
    saveStore(next);

    const s = store.subjects.find((x) => x.id === sid);
    const label = status === 'p' ? 'Present' : status === 'a' ? 'Absent' : 'Cancelled';
    showToast(
      `Marked ${label} · ${s?.name || ''} (${compKey}) for ${fmtDate(date)}`,
      true
    );
  };

  const handleUndo = () => {
    if (!undoBuffer) return;
    const nextLogs = store.logs.filter((l) => l.id !== undoBuffer.id);
    saveStore({ ...store, logs: nextLogs });
    setUndoBuffer(null);
    showToast('Action undone');
  };

  const handleDeleteEntry = (logId: string) => {
    const nextLogs = store.logs.filter((l) => l.id !== logId);
    saveStore({ ...store, logs: nextLogs });
    showToast('Entry removed from history');
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;

    const comps: RegisterComponent[] = newSubjComps
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
      .map((key) => ({ key, base: { p: 0, a: 0 } }));

    if (comps.length === 0) comps.push({ key: 'PR', base: { p: 0, a: 0 } });

    const newSubject: RegisterSubject = {
      id: uid(),
      name: newSubjName.trim(),
      code: newSubjCode.trim().toUpperCase() || undefined,
      components: comps,
      createdAt: new Date().toISOString(),
    };

    saveStore({ ...store, subjects: [...store.subjects, newSubject] });
    setNewSubjName('');
    setNewSubjCode('');
    setNewSubjComps('PR, TUT');
    showToast(`Added subject ${newSubject.name}`);
  };

  const handleDeleteSubject = (s: RegisterSubject) => {
    if (!confirm(`Delete "${s.name}" and all of its recorded periods?`)) return;
    const nextSubjects = store.subjects.filter((x) => x.id !== s.id);
    const nextLogs = store.logs.filter((l) => l.sid !== s.id);
    saveStore({ ...store, subjects: nextSubjects, logs: nextLogs });
    showToast(`Deleted ${s.name}`);
  };

  const handleCommitRename = (sid: string) => {
    if (!renameVal.trim()) return;
    const nextSubjects = store.subjects.map((s) =>
      s.id === sid ? { ...s, name: renameVal.trim() } : s
    );
    saveStore({ ...store, subjects: nextSubjects });
    setRenamingSid(null);
    showToast('Subject renamed');
  };

  const handleSetBase = (sid: string, compKey: string, e: React.FormEvent) => {
    e.preventDefault();
    const keyId = `${sid}-${compKey}`;
    const inp = baseInputState[keyId];
    if (!inp) return;
    const p = Math.max(0, parseInt(inp.p, 10) || 0);
    const total = Math.max(p, parseInt(inp.t, 10) || 0);
    const a = total - p;

    const nextSubjects = store.subjects.map((s) => {
      if (s.id !== sid) return s;
      return {
        ...s,
        components: s.components.map((c) => {
          if (c.key !== compKey) return c;
          return { ...c, base: { p, a } };
        }),
      };
    });

    saveStore({ ...store, subjects: nextSubjects });
    setBaseInputState((prev) => ({ ...prev, [keyId]: { p: '', t: '' } }));
    showToast(`Updated opening balance for ${compKey}`);
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
    showToast(`Cleared opening balance for ${compKey}`);
  };

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(store, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `attendance-backup-${TODAY()}.json`);
    dl.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.subjects) && Array.isArray(parsed.logs)) {
          const cleanSubjects = parsed.subjects.filter((s: any) => !isApkSeedSubject(s));
          const cleanSubjectIds = new Set(cleanSubjects.map((s: any) => s.id));
          const cleanLogs = parsed.logs.filter((l: any) => cleanSubjectIds.has(l.sid));

          const cleanedStore: AttendanceRegisterStore = {
            target: typeof parsed.target === 'number' ? parsed.target : 75,
            subjects: cleanSubjects,
            logs: cleanLogs,
          };
          saveStore(cleanedStore);
          showToast('Backup successfully imported');
        } else {
          alert('Invalid attendance backup format');
        }
      } catch (err) {
        alert('Could not parse JSON backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleEraseEverything = () => {
    if (
      confirm(
        'Are you sure you want to completely erase all subjects, components, and attendance logs?'
      )
    ) {
      saveStore(blank());
      showToast('Attendance register erased');
    }
  };

  const getTodayCounts = (sid: string, compKey: string) => {
    const today = TODAY();
    let p = 0,
      a = 0,
      c = 0;
    for (const l of store.logs) {
      if (l.sid === sid && l.comp === compKey && l.date === today) {
        if (l.status === 'p') p++;
        else if (l.status === 'a') a++;
        else c++;
      }
    }
    return { p, a, c };
  };

  // Overall calculations
  const overall = useMemo(() => overallTally(store), [store]);
  const overallPercentage = pct(overall.p, overall.total);

  // Sliders values: either simulated or actual
  const isSimulated = sliderAttended !== null || sliderTotal !== null;
  const attendedCount = sliderAttended !== null ? sliderAttended : overall.p;
  const totalCount = sliderTotal !== null ? sliderTotal : Math.max(overall.total, 1);
  const activePct = totalCount > 0 ? (attendedCount / totalCount) * 100 : 0;
  const isSafe = activePct >= store.target;

  // Gender preference from user profile
  const rawGender =
    userProfile?.profile?.gender ||
    userProfile?.gender ||
    userProfile?.academicIdentity?.gender ||
    '';
  const dynamicMessage = getPersonalizedMessage(
    attendedCount,
    totalCount,
    store.target,
    rawGender
  );

  const handleTotalSliderChange = (val: number) => {
    const newTotal = Math.max(1, Math.min(200, val));
    setSliderTotal(newTotal);
    if (attendedCount > newTotal) {
      setSliderAttended(newTotal);
    }
  };

  const handleAttendedSliderChange = (val: number) => {
    const newAttended = Math.max(0, Math.min(totalCount, val));
    setSliderAttended(newAttended);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />

      {/* TOP HEADER & TITLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100 relative z-30">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Student Attendance Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Attendance Register & Planner
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            {new Intl.DateTimeFormat('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date())}
            <span>·</span>
            <span>Target: {store.target}%</span>
          </p>
        </div>

        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-2xs transition cursor-pointer"
          >
            <SettingsIcon size={16} />
            <span>Options & Backup</span>
          </button>

          {isSettingsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSettingsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Register Options</h3>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Custom Target (%)
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
                      className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-500">% target</span>
                  </div>
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
          </>
          )}
        </div>
      </div>

      {/* TOP OVERALL ATTENDANCE CARD — ANIMATED REFERENCE DESIGN */}
      <div
        className="rounded-[32px] p-6 sm:p-9 border border-white shadow-[0_20px_50px_rgba(26,134,224,0.12),0_10px_25px_rgba(210,58,160,0.08)] relative"
        style={{
          background: 'linear-gradient(135deg, #F0F6FF 0%, #FAF2FF 50%, #FFF0F7 100%)',
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0B1020] tracking-tight">
              Overall Attendance
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#4A5270]">
              Track cumulative classes or simulate future absences in real time.
            </p>
          </div>
          {isSimulated && (
            <button
              type="button"
              onClick={() => {
                setSliderAttended(null);
                setSliderTotal(null);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 transition shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Undo2 size={13} />
              Reset to actual counts ({overall.p}/{overall.total})
            </button>
          )}
        </div>

        {/* Range 1: Classes attended */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="classes-attended-range"
              className="text-sm sm:text-base font-bold text-[#0B1020]"
            >
              Classes attended
            </label>
            <span className="text-base sm:text-lg font-extrabold text-[#1A86E0] font-mono">
              {attendedCount}
            </span>
          </div>
          <input
            id="classes-attended-range"
            type="range"
            min={0}
            max={totalCount}
            value={attendedCount}
            onChange={(e) => handleAttendedSliderChange(Number(e.target.value))}
            className="w-full h-2.5 bg-white rounded-lg appearance-none cursor-pointer accent-[#1A86E0] shadow-inner"
            aria-label="Classes attended"
          />
        </div>

        {/* Range 2: Total classes held */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="total-classes-range"
              className="text-sm sm:text-base font-bold text-[#0B1020]"
            >
              Total classes held
            </label>
            <span className="text-base sm:text-lg font-extrabold text-[#7A5FD0] font-mono">
              {totalCount}
            </span>
          </div>
          <input
            id="total-classes-range"
            type="range"
            min={1}
            max={Math.max(150, totalCount + 20)}
            value={totalCount}
            onChange={(e) => handleTotalSliderChange(Number(e.target.value))}
            className="w-full h-2.5 bg-white rounded-lg appearance-none cursor-pointer accent-[#7A5FD0] shadow-inner"
            aria-label="Total classes held"
          />
        </div>

        {/* Target Attendance Buttons */}
        <div className="mb-8">
          <label className="block text-xs uppercase tracking-wider font-bold text-[#4A5270] mb-3">
            Required attendance
          </label>
          <div className="flex items-center gap-3" role="group" aria-label="Target attendance percentage">
            {[65, 75, 80].map((t) => {
              const isSelected = store.target === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => saveStore({ ...store, target: t })}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 min-h-[44px] cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B1020] text-white shadow-md'
                      : 'bg-white/80 text-[#4A5270] border border-slate-200 hover:bg-white'
                  }`}
                >
                  {t}%
                </button>
              );
            })}
          </div>
        </div>

        {/* Result Panel */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-7 border border-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl sm:text-5xl font-extrabold text-[#0B1020] font-mono tracking-tight">
              {activePct.toFixed(1)}%
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
                isSafe
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {isSafe ? (
                <>
                  <ShieldCheck size={16} className="text-emerald-500" />
                  Safe
                </>
              ) : (
                <>
                  <TrendingUp size={16} className="text-rose-500" />
                  Catch up
                </>
              )}
            </span>
          </div>

          {/* Progress Bar with Target Marker */}
          <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(activePct, 100)}%`,
                background: 'linear-gradient(to right, #1A86E0 0%, #D23AA0 100%)',
              }}
            />
          </div>

          {/* Target Marker Indicator below progress bar */}
          <div className="relative w-full h-4 mb-4">
            <div
              className="absolute -top-3.5 flex flex-col items-center -translate-x-1/2 pointer-events-none"
              style={{ left: `${store.target}%` }}
            >
              <div className="w-1 h-3.5 bg-[#0B1020] rounded-full shadow-xs"></div>
              <span className="text-[10px] font-bold text-[#0B1020] mt-0.5">
                {store.target}% target
              </span>
            </div>
          </div>

          {/* Dynamic Personalized Message */}
          <p className="text-sm sm:text-base font-semibold text-[#0B1020] mt-1 leading-snug">
            {dynamicMessage}
          </p>
        </div>
      </div>

      {/* ADD SUBJECT SECTION */}
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
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              <span>Add Subject</span>
            </button>
          </div>
        </form>
      </div>

      {/* COMPACT INDIVIDUAL SUBJECT CARDS GRID */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      {renamingSid === s.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={renameVal}
                            onChange={(e) => setRenameVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCommitRename(s.id);
                              if (e.key === 'Escape') setRenamingSid(null);
                            }}
                            autoFocus
                            className="px-2 py-1 text-sm font-bold rounded-lg border border-blue-500 outline-none w-full"
                          />
                          <button
                            onClick={() => handleCommitRename(s.id)}
                            className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setRenamingSid(null)}
                            className="p-1 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug truncate" title={s.name}>
                            {s.name}
                          </h3>
                          {s.code && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono font-bold">
                              {s.code}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Verdict Stamp */}
                    {verd.key !== 'empty' && (
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider border shrink-0 ${
                          verd.key === 'safe'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : verd.key === 'tight'
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-rose-50 border-rose-300 text-rose-700'
                        }`}
                      >
                        {verd.key.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Attendance numbers & Metric Row */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span
                      className={`text-2xl font-black font-mono tracking-tight ${
                        verd.key === 'short'
                          ? 'text-rose-600'
                          : verd.key === 'tight'
                          ? 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {fmtPct(percentage)}%
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      <b className="text-slate-900">{tally.p}</b>/{tally.total} attended
                      {tally.c > 0 && <span className="text-slate-400"> · {tally.c} canc.</span>}
                    </span>
                  </div>

                  {/* Mini Segmented Progress bar */}
                  <div className="relative pt-2 pb-1.5 mb-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
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
                  <div className="mb-3 text-[11px] font-semibold leading-relaxed">
                    {verd.key === 'empty' && (
                      <p className="text-slate-400">No classes counted yet.</p>
                    )}
                    {verd.key === 'short' && (
                      <p className="text-rose-600">
                        Attend next <b>{verd.need}</b> in a row to reach {store.target}%
                      </p>
                    )}
                    {verd.key === 'tight' && (
                      <p className="text-amber-600">
                        On the knife's edge — sit every class from here on.
                      </p>
                    )}
                    {verd.key === 'safe' && (
                      <p className="text-emerald-700">
                        Can skip up to <b>{verd.bunk}</b> more and stay ≥ {store.target}%
                      </p>
                    )}
                  </div>

                  {/* Component Rows with Quick Mark Buttons */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                    {s.components.map((comp) => {
                      const ct = compTally(s, comp.key, store.logs);
                      const tc = getTodayCounts(s.id, comp.key);
                      return (
                        <div
                          key={comp.key}
                          className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-[11px] text-slate-700">
                              {comp.key}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 truncate">
                              {ct.p}/{ct.total}
                            </span>
                          </div>

                          {/* Quick Mark buttons */}
                          <div
                            className="inline-flex rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs shrink-0"
                            role="group"
                          >
                            <button
                              onClick={() => handleLog(s.id, comp.key, 'p')}
                              className={`px-2 py-1 text-[11px] font-bold transition flex items-center gap-0.5 cursor-pointer ${
                                tc.p > 0
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                              title="Mark Present today"
                            >
                              <span>+P</span>
                              {tc.p > 0 && <span className="text-[9px] font-extrabold ml-0.5">({tc.p})</span>}
                            </button>
                            <button
                              onClick={() => handleLog(s.id, comp.key, 'a')}
                              className={`px-2 py-1 text-[11px] font-bold transition border-l border-slate-200 flex items-center gap-0.5 cursor-pointer ${
                                tc.a > 0
                                  ? 'bg-rose-600 text-white'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                              title="Mark Absent today"
                            >
                              <span>+A</span>
                              {tc.a > 0 && <span className="text-[9px] font-extrabold ml-0.5">({tc.a})</span>}
                            </button>
                            <button
                              onClick={() => handleLog(s.id, comp.key, 'c')}
                              className={`px-1.5 py-1 text-[11px] font-bold transition border-l border-slate-200 flex items-center gap-0.5 cursor-pointer ${
                                tc.c > 0
                                  ? 'bg-slate-800 text-white'
                                  : 'text-slate-400 hover:bg-slate-50'
                              }`}
                              title="Mark Cancelled today"
                            >
                              <span>⊘</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible Details */}
                <details className="mt-3 border-t border-slate-100 pt-2 group">
                  <summary className="cursor-pointer text-[11px] font-bold text-slate-500 hover:text-slate-800 select-none flex items-center justify-between py-1">
                    <span>History, Past Logs & Options</span>
                    <ChevronDown
                      size={14}
                      className="transform group-open:rotate-180 transition-transform"
                    />
                  </summary>

                  <div className="pt-2.5 space-y-3">
                    {/* Log Past Date */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Log Past Class
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
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
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] outline-none"
                        />
                        <select
                          value={pastState.comp}
                          onChange={(e) =>
                            setPastLogState((prev) => ({
                              ...prev,
                              [s.id]: { ...pastState, comp: e.target.value },
                            }))
                          }
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-bold outline-none"
                        >
                          {s.components.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.key}
                            </option>
                          ))}
                        </select>
                        <div className="inline-flex rounded overflow-hidden border border-slate-200 bg-white">
                          <button
                            onClick={() => handleLog(s.id, pastState.comp, 'p', pastState.date)}
                            className="px-2 py-0.5 text-[10px] font-semibold hover:bg-slate-100"
                          >
                            P
                          </button>
                          <button
                            onClick={() => handleLog(s.id, pastState.comp, 'a', pastState.date)}
                            className="px-2 py-0.5 text-[10px] font-semibold border-l border-slate-200 hover:bg-slate-100 text-rose-600"
                          >
                            A
                          </button>
                          <button
                            onClick={() => handleLog(s.id, pastState.comp, 'c', pastState.date)}
                            className="px-2 py-0.5 text-[10px] font-semibold border-l border-slate-200 hover:bg-slate-100 text-slate-500"
                          >
                            ⊘
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Opening Balances */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Opening Balances
                      </p>
                      {s.components.map((comp) => {
                        const hasBase = comp.base && (comp.base.p || 0) + (comp.base.a || 0) > 0;
                        const keyId = `${s.id}-${comp.key}`;
                        const currentInput = baseInputState[keyId] || { p: '', t: '' };

                        return (
                          <div key={comp.key} className="space-y-1 text-xs">
                            {hasBase && (
                              <div className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                <span>
                                  {comp.key}: {comp.base.p} att / {comp.base.a} miss
                                </span>
                                <button
                                  onClick={() => handleClearBase(s.id, comp.key)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Remove opening balance"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}

                            <form
                              onSubmit={(e) => handleSetBase(s.id, comp.key, e)}
                              className="flex items-center gap-1.5 text-[11px]"
                            >
                              <span className="w-8 font-mono font-bold text-slate-600">{comp.key}</span>
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
                                className="w-12 px-1.5 py-0.5 bg-white border border-slate-200 rounded outline-none"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="total"
                                value={currentInput.t}
                                onChange={(e) =>
                                  setBaseInputState((prev) => ({
                                    ...prev,
                                    [keyId]: { ...currentInput, t: e.target.value },
                                  }))
                                }
                                className="w-14 px-1.5 py-0.5 bg-white border border-slate-200 rounded outline-none"
                              />
                              <button
                                type="submit"
                                className="px-2 py-0.5 bg-slate-800 text-white font-bold rounded hover:bg-black transition text-[10px]"
                              >
                                Set
                              </button>
                            </form>
                          </div>
                        );
                      })}
                    </div>

                    {/* Logged Entries List */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        History ({subjLogs.length})
                      </p>
                      {subjLogs.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No entries yet.</p>
                      ) : (
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                          {subjLogs.map((l) => (
                            <div
                              key={l.id}
                              className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-slate-50 border border-slate-100"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-slate-500">{fmtDate(l.date)}</span>
                                <span className="font-mono font-bold text-slate-700">[{l.comp}]</span>
                                <span
                                  className={`font-bold ${
                                    l.status === 'p'
                                      ? 'text-blue-600'
                                      : l.status === 'a'
                                      ? 'text-rose-600'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {l.status === 'p' ? 'Present' : l.status === 'a' ? 'Absent' : 'Cancelled'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteEntry(l.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                                title="Delete entry"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold">
                      <button
                        onClick={() => {
                          setRenamingSid(s.id);
                          setRenameVal(s.name);
                        }}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit2 size={12} /> Rename
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(s)}
                        className="text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTNOTE */}
      <div className="p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 text-xs text-slate-500 space-y-1.5 leading-relaxed">
        <p>
          <b className="text-slate-800 font-semibold">How it works:</b> Subject components (PR / TUT / TH)
          combine into one total with opening balances and logged periods.
        </p>
        <p>
          "Miss up to N" calculates safe skippable classes above {store.target}%. "Attend next N" calculates
          the exact consecutive classes required to restore eligibility.
        </p>
      </div>

      {/* TOAST NOTIFICATION WITH UNDO */}
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
