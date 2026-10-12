import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  XCircle,
  Clock,
  Loader2,
  MapPin,
  Save,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { academicTermService } from '../../services/academicTermService';
import { timetableService } from '../../services/timetableService';

interface ParsedRow {
  rowNum: number;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  subjectCode: string;
  roomNumber: string;
  classType: string;
  isValid: boolean;
  errors: string[];
  conflictsWith?: number[];
}

function parseTimetableCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], errors: ['CSV file must have a header row and at least one data row.'] };
  }

  // Parse CSV line taking care of quotes and escaped quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));

  const getIndex = (aliases: string[]) => {
    return headers.findIndex(h => aliases.includes(h));
  };

  const dayIdx = getIndex(['day', 'dayofweek', 'weekday']);
  const startIdx = getIndex(['starttime', 'start', 'begintime', 'from', 'start_time']);
  const endIdx = getIndex(['endtime', 'end', 'totime', 'to', 'end_time']);
  const subjectIdx = getIndex(['subject', 'subjectname', 'course', 'coursename', 'subject_name']);
  const codeIdx = getIndex(['subjectcode', 'code', 'coursecode', 'subject_code']);
  const roomIdx = getIndex(['room', 'roomno', 'roomnumber', 'classroom', 'room_no', 'room_number']);
  const typeIdx = getIndex(['type', 'classtype', 'class_type']);

  if (dayIdx === -1 || startIdx === -1 || endIdx === -1 || subjectIdx === -1) {
    return {
      rows: [],
      errors: [
        'Missing required headers in CSV. Required headers: day, start_time, end_time, subject. (Optional: room_no, subject_code, class_type)'
      ]
    };
  }

  const dayMap: Record<string, number> = {
    '1': 1, 'mon': 1, 'monday': 1,
    '2': 2, 'tue': 2, 'tues': 2, 'tuesday': 2,
    '3': 3, 'wed': 3, 'wednesday': 3,
    '4': 4, 'thu': 4, 'thur': 4, 'thurs': 4, 'thursday': 4,
    '5': 5, 'fri': 5, 'friday': 5,
    '6': 6, 'sat': 6, 'saturday': 6,
    '7': 7, 'sun': 7, 'sunday': 7,
  };

  const normalizeTime = (raw: string): string => {
    let t = raw.trim().toUpperCase();
    const isPm = t.includes('PM');
    const isAm = t.includes('AM');
    t = t.replace(/[^\d:]/g, '');
    const parts = t.split(':');
    if (parts.length < 2) return '';
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return '';
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const parsedRows: ParsedRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

    const rowNum = i + 1;
    const rawDay = (cols[dayIdx] || '').toLowerCase().trim();
    const day = dayMap[rawDay] || parseInt(rawDay, 10);
    const rawStart = cols[startIdx] || '';
    const rawEnd = cols[endIdx] || '';
    const startTime = normalizeTime(rawStart);
    const endTime = normalizeTime(rawEnd);
    const subjectName = cols[subjectIdx] || '';
    const subjectCode = codeIdx !== -1 ? cols[codeIdx] || '' : '';
    const roomNumber = roomIdx !== -1 ? cols[roomIdx] || '' : '';
    const classType = typeIdx !== -1 ? cols[typeIdx] || 'Theory' : 'Theory';

    const rowIssues: string[] = [];
    if (!subjectName) rowIssues.push('Missing subject name');
    if (!day || day < 1 || day > 7) rowIssues.push(`Invalid day: "${cols[dayIdx]}"`);
    if (!startTime) rowIssues.push(`Invalid start time: "${rawStart}"`);
    if (!endTime) rowIssues.push(`Invalid end time: "${rawEnd}"`);
    if (startTime && endTime && startTime >= endTime) rowIssues.push('Start time must be earlier than end time');

    parsedRows.push({
      rowNum,
      dayOfWeek: day || 1,
      dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day ? day - 1 : 0] || 'Unknown',
      startTime: startTime || rawStart,
      endTime: endTime || rawEnd,
      subjectName,
      subjectCode,
      roomNumber,
      classType,
      isValid: rowIssues.length === 0,
      errors: rowIssues,
    });
  }

  // Conflict detection among parsed rows
  for (let a = 0; a < parsedRows.length; a++) {
    for (let b = a + 1; b < parsedRows.length; b++) {
      const rowA = parsedRows[a];
      const rowB = parsedRows[b];
      if (rowA.isValid && rowB.isValid && rowA.dayOfWeek === rowB.dayOfWeek) {
        if (rowA.startTime < rowB.endTime && rowB.startTime < rowA.endTime) {
          const isIdenticalRecurrence =
            rowA.startTime === rowB.startTime &&
            rowA.endTime === rowB.endTime &&
            rowA.subjectName.toLowerCase() === rowB.subjectName.toLowerCase();

          if (!isIdenticalRecurrence) {
            rowA.conflictsWith = (rowA.conflictsWith || []).concat(rowB.rowNum);
            rowB.conflictsWith = (rowB.conflictsWith || []).concat(rowA.rowNum);
          }
        }
      }
    }
  }

  return { rows: parsedRows, errors };
}

export const Timetable = () => {
  const [profile, setProfile] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Manual Add Form Data
  const [formData, setFormData] = useState({
    subjectName: '',
    roomNumber: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    termId: ''
  });

  // CSV Import States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<ParsedRow[]>([]);
  const [csvParseErrors, setCsvParseErrors] = useState<string[]>([]);
  const [csvReplaceExisting, setCsvReplaceExisting] = useState(true);
  const [importingCsv, setImportingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userProfile, currentTerm] = await Promise.all([apiClient('/users/me'), academicTermService.getCurrent()]);
        setProfile(userProfile);
        setFormData(current => ({ ...current, termId: currentTerm.id }));

        const [subs, rms] = await Promise.all([
          apiClient('/timetable/subjects'),
          apiClient('/rooms')
        ]);
        setSubjects(subs);
        setRooms(rms);

        if (userProfile.crAssignment?.sectionId) {
          const tt = await apiClient(`/timetable/section/${userProfile.crAssignment.sectionId}/term/${currentTerm.id}`);
          setTimetable(tt);
        }
      } catch (error) {
        console.error("Failed to load timetable", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshTimetable = async (explicitTermId?: string) => {
    const termToUse = explicitTermId || formData.termId;
    const sectionToUse = profile?.crAssignment?.sectionId;
    if (sectionToUse && termToUse) {
      try {
        const tt = await apiClient(`/timetable/section/${sectionToUse}/term/${termToUse}`);
        setTimetable(Array.isArray(tt) ? tt : []);
      } catch (err) {
        console.error("Failed to refresh timetable:", err);
      }
    }
  };

  const handleCancelClass = async (id: string) => {
    const reason = prompt("Enter reason for cancellation:");
    if (!reason) return;
    try {
      await apiClient(`/timetable/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ note: reason })
      });
      alert('Cancellation requested successfully');
      setTimetable(timetable.map(t => t.id === id ? { ...t, status: 'CANCELLED' } : t));
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this class?")) return;
    try {
      await apiClient(`/timetable/${id}/cr-delete`, { method: 'DELETE' });
      setTimetable(timetable.filter(t => t.id !== id));
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/timetable/cr', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      await refreshTimetable();
      setShowAddModal(false);
      setFormData(prev => ({
        ...prev,
        subjectName: '',
        roomNumber: '',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
      }));
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvResult(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const { rows, errors } = parseTimetableCsv(text);
        setCsvPreview(rows);
        setCsvParseErrors(errors);
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCsv = () => {
    const sample = `day,start_time,end_time,subject,subject_code,room_no,class_type
Monday,09:00,10:00,Computer Networks,CS501,Room 302,Theory
Monday,10:00,11:00,Operating Systems,CS502,Room 302,Theory
Monday,11:15,12:15,Database Management,CS503,Room 304,Theory
Tuesday,09:00,10:00,Discrete Mathematics,MA302,Room 201,Theory
Tuesday,10:00,12:00,Operating Systems Lab,CS502L,Lab 1,Lab
Wednesday,09:00,10:00,Computer Networks,CS501,Room 302,Theory
Wednesday,10:00,11:00,Software Engineering,CS504,Room 105,Theory
Thursday,11:15,12:15,Database Management,CS503,Room 304,Theory
Thursday,14:00,16:00,Database Lab,CS503L,Lab 3,Lab
Friday,09:00,10:00,Software Engineering,CS504,Room 105,Theory
Friday,10:00,11:00,Open Elective,OE501,Room 401,Theory`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'timetable_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    const seen = new Set<string>();
    const validRows = csvPreview.filter(r => {
      if (!r.isValid || (r.conflictsWith && r.conflictsWith.length > 0)) return false;
      const key = `${r.dayOfWeek}_${r.startTime}_${r.endTime}_${r.subjectName.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (validRows.length === 0) {
      alert("No valid classes without time conflicts were found in this file.");
      return;
    }

    setImportingCsv(true);
    setCsvResult(null);
    try {
      const payload = {
        entries: validRows.map(r => ({
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
          subjectName: r.subjectName,
          subjectCode: r.subjectCode || undefined,
          roomNumber: r.roomNumber || undefined,
          classType: r.classType || undefined,
        })),
        termId: formData.termId,
        replaceExisting: csvReplaceExisting,
      };

      const res = await timetableService.importCsvForCr(payload);
      if (res && res.importedCount > 0) {
        setCsvResult({
          success: true,
          message: `Successfully imported ${res.importedCount} classes!`,
          count: res.importedCount,
        });

        if (res.termId) {
          setFormData(prev => ({ ...prev, termId: res.termId }));
        }

        await refreshTimetable(res.termId);
      } else {
        const errorDetail = res?.errors?.length ? res.errors.slice(0, 3).join('; ') : 'Database returned 0 saved records.';
        setCsvResult({
          success: false,
          message: `Import failed (0 classes saved): ${errorDetail}`,
          count: 0,
        });
      }
    } catch (err: any) {
      setCsvResult({
        success: false,
        message: err.message || 'Failed to import timetable from CSV.',
      });
    } finally {
      setImportingCsv(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const seenCount = new Set<string>();
  const validCsvCount = csvPreview.filter(r => {
    if (!r.isValid || (r.conflictsWith && r.conflictsWith.length > 0)) return false;
    const key = `${r.dayOfWeek}_${r.startTime}_${r.endTime}_${r.subjectName.toLowerCase()}`;
    if (seenCount.has(key)) return false;
    seenCount.add(key);
    return true;
  }).length;
  const conflictCsvCount = csvPreview.filter(r => r.conflictsWith && r.conflictsWith.length > 0).length;
  const invalidCsvCount = csvPreview.filter(r => !r.isValid).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Timetable</h1>
          <p className="text-slate-500 font-medium mt-1">Upload CSV or manually add and update classes for your section.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowCsvModal(true);
              setCsvFile(null);
              setCsvPreview([]);
              setCsvParseErrors([]);
              setCsvResult(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-semibold shadow-sm"
          >
            <FileSpreadsheet size={18} /> Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow-sm"
          >
            <Plus size={18} /> Add Class
          </button>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="space-y-8">
          {days.map((dayName, dayIndex) => {
            const dayClasses = timetable.filter(t => t.dayOfWeek === dayIndex + 1).sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (dayClasses.length === 0) return null;

            return (
              <div key={dayName}>
                <h3 className="font-bold text-slate-800 text-lg mb-4 border-b pb-2">{dayName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayClasses.map(cls => (
                    <div key={cls.id} className={`p-4 rounded-xl border ${cls.status === 'CANCELLED' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-200'} shadow-sm relative group`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold ${cls.status === 'CANCELLED' ? 'text-rose-700' : 'text-slate-900'}`}>{cls.subject?.name}</h4>
                        <div className="flex gap-2">
                          {cls.status !== 'CANCELLED' && (
                            <button onClick={() => handleCancelClass(cls.id)} className="opacity-0 group-hover:opacity-100 text-amber-500 hover:text-amber-700 transition p-1" title="Cancel Class">
                              <XCircle size={18} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteClass(cls.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition p-1" title="Delete from Timetable">
                              <X size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock size={14} /> {cls.startTime} - {cls.endTime}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin size={14} /> {cls.room?.roomNumber || 'TBA'}
                        </div>
                      </div>
                      {cls.status === 'CANCELLED' && <div className="absolute bottom-4 right-4 bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded">CANCELLED</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {timetable.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-medium">No classes found for this term yet.</p>
              <p className="text-slate-400 text-sm">Upload a CSV timetable to import all classes at once, or click 'Add Class' to build manually.</p>
            </div>
          )}
        </div>
      </div>

      {/* MANUAL ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Add Class to Timetable</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Subject Name</label>
                <input required type="text" placeholder="e.g. Data Structures" value={formData.subjectName} onChange={e => setFormData({...formData, subjectName: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Room Number</label>
                <input type="text" placeholder="e.g. Room 101 (Optional)" value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Day</label>
                <select required value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: parseInt(e.target.value)})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none">
                  {days.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Start Time</label>
                  <input required type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">End Time</label>
                  <input required type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2">
                  <Save size={18} /> Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Import Timetable from CSV</h2>
                  <p className="text-xs text-slate-500 font-medium">Auto-populate weekly timetable for your academic section</p>
                </div>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Template Download Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-sm text-slate-600">
                  <strong className="block text-slate-800">Supported columns:</strong>
                  <span>day, start_time, end_time, subject, subject_code, room_no, class_type</span>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-sm"
                >
                  <Download size={14} /> Download Sample CSV
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-6 text-center transition bg-slate-50/50">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Upload size={22} />
                  </div>
                  <div className="font-semibold text-slate-700 text-sm">
                    {csvFile ? csvFile.name : 'Click to select or drag and drop timetable CSV'}
                  </div>
                  <p className="text-xs text-slate-400">Supported format: .csv</p>
                </label>
              </div>

              {/* CSV Parse Errors Banner */}
              {csvParseErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle size={16} /> Parsing Issues:
                  </div>
                  {csvParseErrors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}

              {/* Feedback Result */}
              {csvResult && (
                <div
                  className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    csvResult.success
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {csvResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  {csvResult.message}
                </div>
              )}

              {/* Parsed Preview Table */}
              {csvPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">Total Rows: {csvPreview.length}</span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} /> {validCsvCount} Valid
                      </span>
                      {conflictCsvCount > 0 && (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle size={13} /> {conflictCsvCount} Overlaps
                        </span>
                      )}
                      {invalidCsvCount > 0 && (
                        <span className="text-rose-600 flex items-center gap-1">
                          <XCircle size={13} /> {invalidCsvCount} Invalid
                        </span>
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={csvReplaceExisting}
                        onChange={e => setCsvReplaceExisting(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Replace existing timetable for this term</span>
                    </label>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2.5">Row</th>
                          <th className="p-2.5">Day</th>
                          <th className="p-2.5">Time</th>
                          <th className="p-2.5">Subject</th>
                          <th className="p-2.5">Room</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreview.map(row => {
                          const hasConflict = row.conflictsWith && row.conflictsWith.length > 0;
                          return (
                            <tr
                              key={row.rowNum}
                              className={
                                !row.isValid
                                  ? 'bg-rose-50/50'
                                  : hasConflict
                                  ? 'bg-amber-50/50'
                                  : 'hover:bg-slate-50'
                              }
                            >
                              <td className="p-2.5 font-mono text-slate-500">{row.rowNum}</td>
                              <td className="p-2.5 font-medium text-slate-800">{row.dayName}</td>
                              <td className="p-2.5 text-slate-600 font-mono">
                                {row.startTime} - {row.endTime}
                              </td>
                              <td className="p-2.5 font-medium text-slate-800">
                                {row.subjectName}
                                {row.subjectCode && (
                                  <span className="ml-1 text-[10px] text-slate-400">({row.subjectCode})</span>
                                )}
                              </td>
                              <td className="p-2.5 text-slate-600">{row.roomNumber || '—'}</td>
                              <td className="p-2.5">
                                {!row.isValid ? (
                                  <span className="text-rose-600 font-semibold" title={row.errors.join(', ')}>
                                    Error ({row.errors[0]})
                                  </span>
                                ) : hasConflict ? (
                                  <span
                                    className="text-amber-600 font-semibold"
                                    title={`Overlaps with row(s) ${row.conflictsWith?.join(', ')}`}
                                  >
                                    Overlap (Row {row.conflictsWith?.join(', ')})
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-semibold">Ready</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
              >
                Close
              </button>
              {csvPreview.length > 0 && (
                <button
                  type="button"
                  disabled={validCsvCount === 0 || importingCsv}
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                >
                  {importingCsv ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Import {validCsvCount} Valid Classes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
