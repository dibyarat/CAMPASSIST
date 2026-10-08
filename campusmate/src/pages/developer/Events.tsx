import React, { useEffect, useState } from 'react';
import { Calendar, Loader2, Plus, Trash2 } from 'lucide-react';
import { eventService } from '../../services/eventService';
import type { CampusEvent } from '../../services/eventService';

export const Events = () => {
	const [events, setEvents] = useState<CampusEvent[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState<string | null>(null);
	const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', location: '', organizer: '', tags: '', imageUrl: '' });

	const load = () => { setLoading(true); eventService.list(true).then(setEvents).catch(console.error).finally(() => setLoading(false)); };
	useEffect(load, []);

	const create = async (event: React.FormEvent) => {
		event.preventDefault();
		setSaving(true);
		try { await eventService.create(form); setForm({ title: '', description: '', startDate: '', endDate: '', location: '', organizer: '', tags: '', imageUrl: '' }); setShowForm(false); load(); }
		catch (error) { console.error('Failed to create event', error); }
		finally { setSaving(false); }
	};

	const remove = async (id: string) => {
		if (!window.confirm('Delete this event and all of its registrations? This action cannot be undone.')) return;
		setDeleting(id);
		try { await eventService.remove(id); await load(); }
		catch (error) { console.error('Failed to delete event', error); }
		finally { setDeleting(null); }
	};

	return <div className="max-w-6xl mx-auto space-y-6 pb-10">
		<header className="flex justify-between items-center bg-white/60 p-6 rounded-2xl border border-slate-100"><div><h1 className="text-2xl font-bold">Event Management</h1><p className="text-slate-500 mt-1">Publish real campus events for students.</p></div><button onClick={() => setShowForm(value => !value)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-semibold"><Plus size={17} /> New Event</button></header>
		{showForm && <form onSubmit={create} className="bg-white/60 p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
			{(['title', 'location', 'organizer', 'tags', 'imageUrl'] as const).map(field => <input key={field} required={field === 'title' || field === 'location'} value={form[field]} onChange={event => setForm({ ...form, [field]: event.target.value })} placeholder={field === 'imageUrl' ? 'Image URL (optional)' : field[0].toUpperCase() + field.slice(1)} className="px-4 py-2.5 rounded-xl border border-slate-200" />)}
			<input required type="datetime-local" value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} className="px-4 py-2.5 rounded-xl border border-slate-200" />
			<input type="datetime-local" value={form.endDate} onChange={event => setForm({ ...form, endDate: event.target.value })} className="px-4 py-2.5 rounded-xl border border-slate-200" />
			<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Description" className="md:col-span-2 px-4 py-2.5 rounded-xl border border-slate-200" />
			<button disabled={saving} className="md:col-span-2 w-fit px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-60">{saving ? 'Publishing...' : 'Publish Event'}</button>
		</form>}
		{loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{events.map(item => <article key={item.id} className="bg-white/60 p-5 rounded-2xl border border-slate-100"><div className="flex gap-3"><Calendar className="text-blue-600" /><div className="min-w-0 flex-1"><h2 className="font-bold text-lg">{item.title}</h2><p className="text-sm text-slate-500">{new Date(item.startDate).toLocaleString()} · {item.location}</p><p className="text-sm text-slate-600 mt-3">{item.description}</p><p className="text-xs text-slate-400 mt-3">{item._count?.registrations || 0} registrations</p></div><button type="button" onClick={() => remove(item.id)} disabled={deleting === item.id} aria-label={`Delete ${item.title}`} className="self-start text-slate-400 hover:text-red-600 disabled:opacity-50"><Trash2 size={17} /></button></div></article>)}</div>}
	</div>;
};
