import React, { useEffect, useState } from 'react';
import { Bookmark, Loader2, Plus, Trash2 } from 'lucide-react';
import { reminderService } from '../../services/reminderService';
import type { Reminder } from '../../services/reminderService';

export const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const load = () => {
    setLoading(true);
    reminderService.listMine().then(setReminders).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await reminderService.createForSection({ title, dueDate: new Date(dueDate).toISOString(), description });
      setTitle('');
      setDueDate('');
      setDescription('');
      setShowForm(false);
      load();
    } catch (error) {
      console.error('Failed to create class reminder', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <header className="flex justify-between items-center bg-white/60 p-6 rounded-2xl border border-slate-100">
        <div><h1 className="text-2xl font-bold">Manage Reminders</h1><p className="text-slate-500 mt-1">Create reminders for your assigned section.</p></div>
        <button onClick={() => setShowForm(value => !value)} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"><Plus size={18} /> Create Reminder</button>
      </header>
      {showForm && <form onSubmit={create} className="bg-white/60 p-6 rounded-2xl border border-slate-100 space-y-4"><input required value={title} onChange={event => setTitle(event.target.value)} placeholder="Reminder title" className="w-full px-4 py-2.5 rounded-xl border border-slate-200" /><input required type="datetime-local" value={dueDate} onChange={event => setDueDate(event.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" /><textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Description (optional)" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 resize-none" /><button disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-60">{saving ? 'Creating...' : 'Create for Section'}</button></form>}
      <div className="bg-white/60 p-6 rounded-2xl border border-slate-100">{loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div> : reminders.length === 0 ? <div className="text-center py-10 text-slate-500">No reminders created yet.</div> : <div className="space-y-3">{reminders.map(reminder => <div key={reminder.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100"><div className="flex items-center gap-3"><Bookmark className="text-amber-500" /><div><h3 className="font-bold text-slate-900">{reminder.title}</h3><p className="text-sm text-slate-500">{new Date(reminder.dueDate).toLocaleString()}</p></div></div><Trash2 className="text-slate-400" /></div>)}</div>}</div>
    </div>
  );
};
