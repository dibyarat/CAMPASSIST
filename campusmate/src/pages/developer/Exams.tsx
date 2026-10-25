import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Calendar, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
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
	status: string;
	notes: string;
};

const emptyExam: ExamForm = {
	subjectId: '',
	roomId: '',
	examType: 'Midterm',
	date: '',
	startTime: '10:00',
	endTime: '13:00',
	status: 'PUBLISHED',
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
	const [filterStatus, setFilterStatus] = useState('ALL');
	const [deletingId, setDeletingId] = useState<string | null>(null);

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

	const handleDelete = async (id: string, subjectName: string) => {
		if (!window.confirm(`Are you sure you want to remove the exam schedule for "${subjectName}"? Any student seating assignments will also be deleted.`)) return;
		setDeletingId(id);
		try {
			await examService.delete(id);
			await loadData();
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Failed to delete exam.');
		} finally {
			setDeletingId(null);
		}
	};

	const filteredExams = exams.filter((e) => {
		const isPublished = (e.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED' || (e.status || 'SCHEDULED').toUpperCase() === 'SCHEDULED';
		if (filterStatus === 'PUBLISHED') return isPublished;
		if (filterStatus === 'DRAFT') return !isPublished;
		return true;
	});

	return (
		<section className="max-w-6xl mx-auto space-y-6 pb-10">
			<header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl shadow-xs border border-[var(--color-border)]">
				<div>
					<h1 className="text-2xl font-bold text-[var(--color-text)]">Exam Schedule Management</h1>
					<p className="mt-1 text-sm text-[var(--color-muted)]">
						{term ? `Managing term examinations for: ${term.name}` : 'Manage academic examinations and time slots'}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-xs font-semibold text-[var(--color-muted)]">Filter:</span>
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
						className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-xs text-[var(--color-text)] font-medium"
					>
						<option value="ALL">All ({exams.length})</option>
						<option value="PUBLISHED">Published</option>
						<option value="DRAFT">Drafts</option>
					</select>
				</div>
			</header>

			{error && (
				<p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-500">
					{error}
				</p>
			)}

			{/* Add Exam Form */}
			<div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl shadow-xs border border-[var(--color-border)]">
				<h2 className="text-base font-bold text-[var(--color-text)] mb-4">Add Examination Slot</h2>
				<form onSubmit={createExam} className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<label className="space-y-1.5">
						<span className="text-xs font-semibold text-[var(--color-text)]">Subject *</span>
						<select
							required
							value={form.subjectId}
							onChange={event => setForm({ ...form, subjectId: event.target.value })}
							className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] px-3 py-2 text-sm"
						>
							<option value="">Select subject...</option>
							{subjects.map(subject => (
								<option key={subject.id} value={subject.id}>
									{subject.name}{subject.code ? ` (${subject.code})` : ''}
								</option>
							))}
						</select>
					</label>

					<label className="space-y-1.5">
						<span className="text-xs font-semibold text-[var(--color-text)]">Exam Type *</span>
						<input
							required
							value={form.examType}
							onChange={event => setForm({ ...form, examType: event.target.value })}
							placeholder="Midterm, Final, Practical..."
							className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] px-3 py-2 text-sm"
						/>
					</label>

					<label className="space-y-1.5">
						<span className="text-xs font-semibold text-[var(--color-text)]">Publication Status</span>
						<select
							value={form.status}
							onChange={event => setForm({ ...form, status: event.target.value })}
							className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] px-3 py-2 text-sm"
						>
							<option value="PUBLISHED">Published (Visible to students)</option>
							<option value="DRAFT">Draft (Admin only)</option>
						</select>
					</label>

					<label className="space-y-1.5">
						<span className="text-xs font-semibold text-[var(--color-text)]">Date *</span>
						<input
							required
							type="date"
							value={form.date}
							onChange={event => setForm({ ...form, date: event.target.value })}
							className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] px-3 py-2 text-sm"
						/>
					</label>

					<label className="space-y-1.5">
						<span className="text-xs font-semibold text-[var(--color-text)]">Room (Facility)</span>
						<select
							value={form.roomId}
							onChange={event => setForm({ ...form, roomId: event.target.value })}
							className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] px-3 py-2 text-sm"
						>
							<option value="">No room assigned yet</option>
							{rooms.map(room => (
								<option key={room.id} value={room.id}>
									{room.roomNumber || room.name} {room.building ? `(${room.building})` : ''}
								</option>
							))}
						</select>
					</label>

					<div className="grid grid-cols-2 gap-2">
						<label className="space-y-1.5">
							<span className="text-xs font-semibold text-[var(--color-text)]">Start Time *</span>
							<input
								required
								type="time"
								value={form.startTime}
								onChange={event => setForm({ ...form, startTime: event.target.value })}
								className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] px-3 py-2 text-sm"
							/>
						</label>
						<label className="space-y-1.5">
							<span className="text-xs font-semibold text-[var(--color-text)]">End Time *</span>
							<input
								required
								type="time"
								value={form.endTime}
								onChange={event => setForm({ ...form, endTime: event.target.value })}
								className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] px-3 py-2 text-sm"
							/>
						</label>
					</div>

					<label className="space-y-1.5 md:col-span-3">
						<span className="text-xs font-semibold text-[var(--color-text)]">Instructions / Candidate Notes</span>
						<textarea
							value={form.notes}
							onChange={event => setForm({ ...form, notes: event.target.value })}
							rows={2}
							placeholder="e.g. Non-programmable calculators permitted; reporting time 15 minutes prior"
							className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] px-3 py-2 text-sm"
						/>
					</label>

					<div className="md:col-span-3 flex justify-end">
						<button
							type="submit"
							disabled={saving || loading || !term}
							className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2.5 text-sm font-semibold hover:opacity-95 transition disabled:opacity-50"
						>
							{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Exam
						</button>
					</div>
				</form>
			</div>

			{/* Exam List Table */}
			{loading ? (
				<div className="py-12 text-center text-sm text-[var(--color-muted)] flex justify-center">
					<Loader2 className="animate-spin text-blue-500 w-8 h-8" />
				</div>
			) : filteredExams.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center text-sm text-[var(--color-muted)] bg-white/40">
					{exams.length === 0 ? 'No exams scheduled for this term yet.' : 'No exams match the selected filter.'}
				</div>
			) : (
				<div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white/70 dark:bg-slate-900/70 shadow-xs">
					<table className="w-full text-left">
						<thead className="border-b border-[var(--color-border)] text-xs font-semibold uppercase text-[var(--color-muted)]">
							<tr>
								<th className="px-4 py-3.5">Subject</th>
								<th className="px-4 py-3.5">Exam Type</th>
								<th className="px-4 py-3.5">Status</th>
								<th className="px-4 py-3.5">Date</th>
								<th className="px-4 py-3.5">Slot Time</th>
								<th className="px-4 py-3.5">Assigned Room</th>
								<th className="px-4 py-3.5 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[var(--color-border)] text-sm">
							{filteredExams.map((exam) => {
								const isPublished = (exam.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED' || (exam.status || 'SCHEDULED').toUpperCase() === 'SCHEDULED';

								return (
									<tr key={exam.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
										<td className="px-4 py-3.5 font-bold text-[var(--color-text)]">
											{exam.subject?.name || 'Subject not linked'}
											{exam.subject?.code && <span className="block text-xs font-normal text-[var(--color-muted)]">{exam.subject.code}</span>}
										</td>
										<td className="px-4 py-3.5 font-medium text-[var(--color-text)]">{exam.examType}</td>
										<td className="px-4 py-3.5">
											<span
												className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
													isPublished
														? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
														: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
												}`}
											>
												{isPublished ? 'Published' : 'Draft'}
											</span>
										</td>
										<td className="px-4 py-3.5 text-[var(--color-muted)]">
											{new Date(exam.date).toLocaleDateString()}
										</td>
										<td className="px-4 py-3.5 font-medium text-[var(--color-text)]">
											{exam.startTime} – {exam.endTime}
										</td>
										<td className="px-4 py-3.5 text-[var(--color-muted)]">
											{exam.room?.name || exam.room?.roomNumber || 'Not assigned'}
										</td>
										<td className="px-4 py-3.5 text-right">
											<button
												type="button"
												disabled={deletingId === exam.id}
												onClick={() => handleDelete(exam.id, exam.subject?.name || 'Exam')}
												className="p-1.5 text-[var(--color-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-50"
												title="Delete exam slot"
											>
												{deletingId === exam.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
};
