import React, { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { academicTermService } from '../../services/academicTermService';
import { examService } from '../../services/examService';
import { adminService } from '../../services/adminService';

type ExamForm = {
	subjectId: string;
	roomId: string;
	examType: string;
	date: string;
	startTime: string;
	endTime: string;
	notes: string;
};

const emptyExam: ExamForm = {
	subjectId: '',
	roomId: '',
	examType: '',
	date: '',
	startTime: '',
	endTime: '',
	notes: '',
};

export const Exams = () => {
	const [term, setTerm] = useState<{ id: string; name: string } | null>(null);
	const [exams, setExams] = useState<any[]>([]);
	const [subjects, setSubjects] = useState<any[]>([]);
	const [rooms, setRooms] = useState<any[]>([]);
	const [form, setForm] = useState<ExamForm>(emptyExam);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	const loadData = async () => {
		try {
			setError('');
			const [currentTerm, subjectRows, roomRows] = await Promise.all([
				academicTermService.getCurrent(),
				adminService.listSubjects(),
				adminService.listRooms(),
			]);
			setTerm(currentTerm);
			setSubjects(subjectRows);
			setRooms(roomRows);
			setExams(await examService.listByTerm(currentTerm.id));
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Unable to load exam data.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { void loadData(); }, []);

	const createExam = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!term) return;
		setSaving(true);
		setError('');
		try {
			await examService.create({
				...form,
				roomId: form.roomId || undefined,
				termId: term.id,
				date: new Date(`${form.date}T00:00:00`).toISOString(),
			});
			setForm(emptyExam);
			await loadData();
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Unable to create exam.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<section className="max-w-6xl mx-auto space-y-6 pb-10">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">Exam Schedule</h1>
				<p className="mt-1 text-sm text-slate-500">{term ? `Manage exams for ${term.name}` : 'Manage the current academic term'}</p>
			</header>

			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

			<form onSubmit={createExam} className="grid grid-cols-1 gap-4 border-b border-slate-200 pb-6 md:grid-cols-2">
				<label className="space-y-1.5">
					<span className="text-sm font-semibold text-slate-700">Subject</span>
					<select required value={form.subjectId} onChange={event => setForm({ ...form, subjectId: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
						<option value="">Select subject</option>
						{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}{subject.code ? ` (${subject.code})` : ''}</option>)}
					</select>
				</label>
				<label className="space-y-1.5">
					<span className="text-sm font-semibold text-slate-700">Exam Type</span>
					<input required value={form.examType} onChange={event => setForm({ ...form, examType: event.target.value })} placeholder="Midterm, final, practical..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
				</label>
				<label className="space-y-1.5">
					<span className="text-sm font-semibold text-slate-700">Date</span>
					<input required type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
				</label>
				<label className="space-y-1.5">
					<span className="text-sm font-semibold text-slate-700">Room</span>
					<select value={form.roomId} onChange={event => setForm({ ...form, roomId: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
						<option value="">No room assigned</option>
						{rooms.map(room => <option key={room.id} value={room.id}>{room.name || room.roomNumber || room.id}</option>)}
					</select>
				</label>
				<label className="space-y-1.5">
					<span className="text-sm font-semibold text-slate-700">Start Time</span>
					<input required type="time" value={form.startTime} onChange={event => setForm({ ...form, startTime: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
				</label>
				<label className="space-y-1.5">
					<span className="text-sm font-semibold text-slate-700">End Time</span>
					<input required type="time" value={form.endTime} onChange={event => setForm({ ...form, endTime: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
				</label>
				<label className="space-y-1.5 md:col-span-2">
					<span className="text-sm font-semibold text-slate-700">Notes</span>
					<textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
				</label>
				<div className="md:col-span-2">
					<button type="submit" disabled={saving || loading || !term} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
						{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add exam
					</button>
				</div>
			</form>

			{loading ? (
				<p role="status" className="py-10 text-center text-sm text-slate-500">Loading exams...</p>
			) : exams.length === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No exams are scheduled for this term.</p>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
					<table className="w-full text-left">
						<thead className="border-b border-slate-200 bg-slate-50">
							<tr>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Subject</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Type</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Date</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Time</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Room</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{exams.map(exam => (
								<tr key={exam.id}>
									<td className="px-4 py-3 text-sm font-medium text-slate-800">{exam.subject?.name || 'Subject not linked'}</td>
									<td className="px-4 py-3 text-sm text-slate-600">{exam.examType}</td>
									<td className="px-4 py-3 text-sm text-slate-600">{new Date(exam.date).toLocaleDateString()}</td>
									<td className="px-4 py-3 text-sm text-slate-600">{exam.startTime}–{exam.endTime}</td>
									<td className="px-4 py-3 text-sm text-slate-600">{exam.room?.name || exam.room?.roomNumber || 'Not assigned'}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
};
