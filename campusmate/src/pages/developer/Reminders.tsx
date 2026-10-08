import React, { useEffect, useState } from 'react';
import { CalendarClock, Loader2, Trash2 } from 'lucide-react';
import { reminderService, type Reminder } from '../../services/reminderService';

export const Reminders = () => {
	const [reminders, setReminders] = useState<Reminder[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const loadReminders = async () => {
		try {
			setError('');
			setReminders(await reminderService.listMine());
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Unable to load your reminders.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { void loadReminders(); }, []);

	const deleteReminder = async (reminder: Reminder) => {
		try {
			await reminderService.remove(reminder.id);
			setReminders(current => current.filter(item => item.id !== reminder.id));
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Unable to delete this reminder.');
		}
	};

	return (
		<section className="max-w-5xl mx-auto space-y-6 pb-10">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">My Reminders</h1>
				<p className="mt-1 text-sm text-slate-500">Reminders created by your account</p>
			</header>
			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading reminders...</p>
			) : reminders.length === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No reminders created by this account.</p>
			) : (
				<ul className="divide-y divide-slate-200 border-y border-slate-200">
					{reminders.map(reminder => (
						<li key={reminder.id} className="flex items-center justify-between gap-4 py-4">
							<div className="min-w-0">
								<h2 className="text-sm font-semibold text-slate-900">{reminder.title}</h2>
								{reminder.description && <p className="mt-1 text-sm text-slate-600">{reminder.description}</p>}
								<p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500"><CalendarClock size={14} />{new Date(reminder.dueDate).toLocaleString()}</p>
							</div>
							<button type="button" onClick={() => void deleteReminder(reminder)} aria-label={`Delete ${reminder.title}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700">
								<Trash2 size={16} />
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
};
