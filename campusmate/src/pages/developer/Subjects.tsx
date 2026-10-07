import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Subjects = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ code: '', name: '', credits: 3, type: 'Theory' });
  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      const data = await apiClient('/subjects');
      setSubjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient('/subjects', { method: 'POST', body: JSON.stringify({...newSubject, credits: parseInt(newSubject.credits as any)}) });
      setShowModal(false);
      setNewSubject({ code: '', name: '', credits: 3, type: 'Theory' });
      fetchSubjects();
    } catch (err) {
      alert('Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await apiClient(/subjects/+id, { method: 'DELETE' });
      fetchSubjects();
    } catch (err) {
      alert('Failed to delete subject');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subject Master</h1>
          <p className="text-slate-500 font-medium mt-1">Manage course curriculum and subject codes.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition">
          <Plus size={18} /> Add Subject
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Subject</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                <input required type="text" value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input required type="text" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Credits</label>
                <input required type="number" value={newSubject.credits} onChange={e => setNewSubject({...newSubject, credits: e.target.value as any})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select value={newSubject.type} onChange={e => setNewSubject({...newSubject, type: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                  <option>Theory</option>
                  <option>Practical</option>
                  <option>Project</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Code</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Subject Name</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Credits</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Type</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No subjects found</td></tr>}
                {subjects.map((sub, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-bold text-slate-900">{sub.code}</td>
                    <td className="py-4 px-4 font-medium text-slate-800">{sub.name}</td>
                    <td className="py-4 px-4 text-slate-600">{sub.credits}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sub.type === 'Theory' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {sub.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
