import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  Loader2,
  MapPin,
  Save,
  X,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  XCircle,
  Filter
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

  const getIndex = (aliases: string[]) => headers.findIndex(h => aliases.includes(h));

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

  // Conflict detection
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
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [termId, setTermId] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Manual Add Form
  const [formData, setFormData] = useState({
    subjectName: '',
    roomNumber: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    sectionId: '',
  });

  // CSV Import States
  const [csvTargetSection, setCsvTargetSection] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<ParsedRow[]>([]);
  const [csvParseErrors, setCsvParseErrors] = useState<string[]>([]);
  const [csvReplaceExisting, setCsvReplaceExisting] = useState(true);
  const [importingCsv, setImportingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [secs, currentTerm] = await Promise.all([
          apiClient('/sections'),
          academicTermService.getCurrent(),
        ]);
        setTermId(currentTerm.id);
        setSections(secs);
        if (secs.length > 0) {
          setSelectedSection(secs[0].id);
          setFormData(prev => ({ ...prev, sectionId: secs[0].id }));
          setCsvTargetSection(secs[0].id);
        }
      } catch (error) {
        console.error('Failed to load initial sections or term', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const refreshTimetable = async (secId = selectedSection, tId = termId) => {
    if (!secId || !tId) return;
    setLoading(true);
    try {
      const data = await apiClient(`/timetable/section/${secId}/term/${tId}`);
      setTimetable(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load timetable', error);
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSection && termId) {
      refreshTimetable(selectedSection, termId);
    }
  }, [selectedSection, termId]);

  const handleSectionChange = (newSecId: string) => {
    setSelectedSection(newSecId);
    setFormData(prev => ({ ...prev, sectionId: newSecId }));
    setCsvTargetSection(newSecId);
  };

  const handleCancelClass = async (id: string) => {
    const reason = prompt('Enter reason for cancellation:');
    if (!reason) return;
    try {
      await apiClient(`/timetable/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ note: reason }),
      });
      alert('Class cancelled successfully');
      setTimetable(timetable.map(t => (t.id === id ? { ...t, status: 'CANCELLED' } : t)));
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class from the schedule?')) return;
    try {
      await apiClient(`/timetable/${id}/cr-delete`, { method: 'DELETE' });
      setTimetable(timetable.filter(t => t.id !== id));
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSec = formData.sectionId || selectedSection;
    if (!targetSec) {
      alert('Please select a target section.');
      return;
    }
    try {
      await apiClient('/timetable/cr', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          sectionId: targetSec,
          termId,
        }),
      });
      alert('Class added successfully!');
      setShowAddModal(false);
      setFormData(prev => ({
        ...prev,
        subjectName: '',
        roomNumber: '',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
      }));
      if (targetSec === selectedSection) {
        await refreshTimetable(targetSec, termId);
      } else {
        setSelectedSection(targetSec);
      }
    } catch (e: any) {
      alert('Error: ' + (e.message || 'Failed to add class'));
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvResult(null);
    const reader = new FileReader();
    reader.onload = event => {
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
    const targetSec = csvTargetSection || selectedSection;
    if (!targetSec) {
      alert('Please select a target section to import into.');
      return;
    }

    const seen = new Set<string>();
    const validRows = csvPreview.filter(r => {
      if (!r.isValid || (r.conflictsWith && r.conflictsWith.length > 0)) return false;
      const key = `${r.dayOfWeek}_${r.startTime}_${r.endTime}_${r.subjectName.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (validRows.length === 0) {
      alert('No valid classes without time conflicts were found in this file.');
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
          sectionId: targetSec,
        })),
        termId,
        sectionId: targetSec,
        replaceExisting: csvReplaceExisting,
      };

      const res = await timetableService.importCsvForCr(payload);
      if (res && res.importedCount > 0) {
        setCsvResult({
          success: true,
          message: `Successfully imported ${res.importedCount} classes into section!`,
          count: res.importedCount,
        });

        if (targetSec === selectedSection) {
          await refreshTimetable(targetSec, termId);
        } else {
          setSelectedSection(targetSec);
        }
      } else {
        const errorDetail = res?.errors?.length
          ? res.errors.slice(0, 3).join('; ')
          : 'Database returned 0 saved records.';
        setCsvResult({
          success: false,
          message: `Import failed: ${errorDetail}`,
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

  const currentSectionName = sections.find(s => s.id === selectedSection)?.name || 'Section';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Timetable Management</h1>
          <p className="text-slate-500 font-medium mt-1">
            Choose any academic section across the institution to view, upload CSV schedules, or manage class routines.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setShowCsvModal(true);
              setCsvTargetSection(selectedSection);
              setCsvFile(null);
              setCsvPreview([]);
              setCsvParseErrors([]);
              setCsvResult(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-semibold shadow-sm"
          >
            <FileSpreadsheet size={18} /> Import CSV
          </button>
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, sectionId: selectedSection }));
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow-sm"
          >
            <Plus size={18} /> Add Class
          </button>
        </div>
      </div>

      {/* Section Selector Toolbar */}
      <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Filter size={18} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Select Active Section</span>
            <select
              value={selectedSection}
              onChange={e => handleSectionChange(e.target.value)}
              className="mt-0.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              {sections.map(sec => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} {sec.department?.code ? `(${sec.department.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Total Sections: <strong className="text-slate-800">{sections.length}</strong>
          </span>
          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
            Scheduled Classes: <strong className="text-blue-900">{timetable.length}</strong>
          </span>
        </div>
      </div>

      {/* Main Schedule Grid */}
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            <h2 className="font-bold text-slate-800 text-lg">Schedule for {currentSectionName}</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
          </div>
        ) : (
          <div className="space-y-8">
            {days.map((dayName, dayIndex) => {
              const dayClasses = timetable
                .filter(t => t.dayOfWeek === dayIndex + 1)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              if (dayClasses.length === 0) return null;

              return (
                <div key={dayName}>
                  <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>{dayName}</span>
                    <span className="text-xs font-semibold text-slate-400 font-mono">{dayClasses.length} class(es)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayClasses.map(cls => (
                      <div
                        key={cls.id}
                        className={`p-4 rounded-xl border ${
                          cls.status === 'CANCELLED'
                            ? 'bg-rose-50 border-rose-100'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        } shadow-sm relative group transition`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4
                            className={`font-bold text-sm ${
                              cls.status === 'CANCELLED' ? 'text-rose-700 line-through' : 'text-slate-900'
                            }`}
                          >
                            {cls.subject?.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {cls.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleCancelClass(cls.id)}
                                className="opacity-0 group-hover:opacity-100 text-amber-500 hover:text-amber-700 transition p-1 rounded hover:bg-amber-50"
                                title="Mark Cancelled"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClass(cls.id)}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition p-1 rounded hover:bg-rose-50"
                              title="Delete from Schedule"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 mt-2">
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                            <Clock size={13} className="text-slate-400" /> {cls.startTime} - {cls.endTime}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <MapPin size={13} className="text-slate-400" /> Room: {cls.room?.roomNumber || 'TBA'}
                          </div>
                          {cls.subject?.code && (
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                              Code: {cls.subject.code}
                            </div>
                          )}
                        </div>

                        {cls.status === 'CANCELLED' && (
                          <div className="absolute bottom-3 right-3 bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            CANCELLED
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {timetable.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-700 font-semibold">No timetable found for {currentSectionName}.</p>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Click 'Import CSV' above to upload this section's weekly routine at once, or click 'Add Class' to insert classes manually.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MANUAL ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Add Class to Timetable</h2>
                <p className="text-xs text-slate-500 font-medium">Create a single class session</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Section</label>
                <select
                  required
                  value={formData.sectionId}
                  onChange={e => setFormData({ ...formData, sectionId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-semibold text-slate-800 outline-none"
                >
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.department?.code ? `(${s.department.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subject Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={formData.subjectName}
                  onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-medium outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Room Number</label>
                <input
                  type="text"
                  placeholder="e.g. Room 302 or Lab 1 (Optional)"
                  value={formData.roomNumber}
                  onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-medium outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Day of Week</label>
                <select
                  required
                  value={formData.dayOfWeek}
                  onChange={e => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-medium outline-none"
                >
                  {days.map((d, i) => (
                    <option key={d} value={i + 1}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Start Time</label>
                  <input
                    required
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-mono outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">End Time</label>
                  <input
                    required
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-mono outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-sm"
                >
                  <Save size={16} /> Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Upload Section Timetable (CSV)</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Select any section and batch-import its full weekly timetable schedule
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Target Section Picker */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <strong className="block text-sm text-blue-900">Upload Target Section:</strong>
                  <span className="text-xs text-blue-700">Choose which section will receive this timetable data</span>
                </div>
                <select
                  value={csvTargetSection}
                  onChange={e => setCsvTargetSection(e.target.value)}
                  className="px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} {sec.department?.code ? `(${sec.department.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

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
                  id="csv-dev-file-input"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="csv-dev-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 hover:text-emerald-600">
                      {csvFile ? csvFile.name : 'Click to browse or select your timetable CSV file'}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Formatted spreadsheet (.csv) up to 2MB</p>
                  </div>
                </label>
              </div>

              {/* CSV Parsing Errors */}
              {csvParseErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Failed to parse CSV headers
                  </div>
                  {csvParseErrors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}

              {/* Replace Existing Option */}
              {csvPreview.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="dev-replace-existing"
                    checked={csvReplaceExisting}
                    onChange={e => setCsvReplaceExisting(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="dev-replace-existing" className="text-xs text-slate-700 cursor-pointer font-medium">
                    <strong>Replace existing timetable for this section</strong> (Replaces all active classes in the current term to prevent overlaps)
                  </label>
                </div>
              )}

              {/* Result Notification */}
              {csvResult && (
                <div
                  className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
                    csvResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {csvResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{csvResult.message}</span>
                </div>
              )}

              {/* Preview Table */}
              {csvPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Preview: {csvPreview.length} rows loaded</span>
                    <div className="flex gap-3">
                      <span className="text-emerald-600 font-semibold">{validCsvCount} Ready</span>
                      {conflictCsvCount > 0 && (
                        <span className="text-amber-600 font-semibold">{conflictCsvCount} Overlaps</span>
                      )}
                      {invalidCsvCount > 0 && (
                        <span className="text-rose-600 font-semibold">{invalidCsvCount} Invalid</span>
                      )}
                    </div>
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
                      Import {validCsvCount} Classes into {sections.find(s => s.id === csvTargetSection)?.name || 'Section'}
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
