import React, { useEffect, useState } from 'react';
import { Bell, Plus, Calendar, Clock, Trash2, Loader2 } from 'lucide-react';
import { reminderService } from '../../services/reminderService';
import type { Reminder } from '../../services/reminderService';

export const ReminderCenter = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadReminders = async () => {
    setLoading(true);
    try {
      setReminders(await reminderService.listRelevant());
    } catch (error) {
      console.error('Failed to load reminders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const addReminder = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await reminderService.create({ title, dueDate: new Date(dueDate).toISOString(), description });
      setTitle('');
      setDueDate('');
      setDescription('');
      setShowForm(false);
      await loadReminders();
    } catch (error) {
      console.error('Failed to create reminder', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await reminderService.remove(id);
      setReminders(current => current.filter(reminder => reminder.id !== id));
    } catch (error) {
      console.error('Failed to delete reminder', error);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center glass p-6 rounded-2xl border border-[var(--color-border)]">
        <h1 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
          <Bell className="text-[#D946A8]" /> Reminder Center
        </h1>
        <button onClick={() => setShowForm(current => !current)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition">
          <Plus size={16} /> Add Reminder
        </button>
      </div>

      {showForm && (
        <form onSubmit={addReminder} className="glass rounded-2xl border border-[var(--color-border)] shadow-sm p-6 space-y-4">
          <input required value={title} onChange={event => setTitle(event.target.value)} placeholder="Reminder title" className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)]" />
          <input required type="datetime-local" value={dueDate} onChange={event => setDueDate(event.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)]" />
          <textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Description (optional)" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] resize-none" />
          <button disabled={saving} className="px-5 py-2.5 bg-gradient-primary text-white rounded-xl font-semibold disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Reminder'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? <div className="col-span-full flex justify-center py-10"><Loader2 className="animate-spin text-[#19A3E9]" /></div> : reminders.length === 0 ? <div className="col-span-full text-center py-10 text-[var(--color-muted)]">No reminders yet.</div> : reminders.map(rem => (
          <div key={rem.id} className="glass rounded-2xl border-l-4 border-y border-r border-l-[#19A3E9] border-y-[var(--color-border)] border-r-[var(--color-border)] shadow-sm p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-[var(--color-text)]">{rem.title}</h3>
              <button onClick={() => deleteReminder(rem.id)} className="text-[var(--color-muted)] hover:text-rose-400 transition" title="Delete reminder"><Trash2 size={16} /></button>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
                <div className="w-8 h-8 rounded-full glass flex items-center justify-center border border-[var(--color-border)]"><Calendar size={14} className="text-[#19A3E9]" /></div>
                {new Date(rem.dueDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
                <div className="w-8 h-8 rounded-full glass flex items-center justify-center border border-[var(--color-border)]"><Clock size={14} className="text-[#D946A8]" /></div>
                {new Date(rem.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
