import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Sections = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSection, setNewSection] = useState({ name: "", departmentCode: "", departmentName: "", semesterNumber: 1, semesterName: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      await apiClient(`/sections/${id}`, { method: 'DELETE' });
      await fetchSections();
    } catch (err) {
      console.error(err);
      alert('Failed to delete section');
    }
  };

  const fetchSections = async () => {
    try {
      const data = await apiClient('/sections');
      setSections(data);
    } catch (error) {
      console.error("Failed to load sections", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient('/sections', {
        method: 'POST',
        body: JSON.stringify(newSection)
      });
      setShowModal(false);
      setNewSection({ name: "", departmentCode: "", departmentName: "", semesterNumber: 1, semesterName: "" });
      await fetchSections();
    } catch (err) {
      console.error(err);
      alert('Failed to add section');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sections & Batches</h1>
          <p className="text-slate-500 font-medium mt-1">Manage class sections, capacity, and assigned CRs.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition">
          <Plus size={18} /> Add Section
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Section</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section Name (e.g. CS-A)</label>
                <input required type="text" value={newSection.name} onChange={e => setNewSection({...newSection, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department Code (e.g. CS)</label>
                <input required type="text" value={newSection.departmentCode} onChange={e => setNewSection({...newSection, departmentCode: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department Name (e.g. Computer Science)</label>
                <input required type="text" value={newSection.departmentName} onChange={e => setNewSection({...newSection, departmentName: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semester Number (e.g. 1)</label>
                <input required type="number" value={newSection.semesterNumber} onChange={e => setNewSection({...newSection, semesterNumber: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semester Name (e.g. Semester 1)</label>
                <input required type="text" value={newSection.semesterName} onChange={e => setNewSection({...newSection, semesterName: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center">
                  {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Save Section
                </button>
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
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Section Name</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Department</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Semester</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr><td colSpan={3} className="py-8 text-center text-slate-500">No sections found</td></tr>
                ) : sections.map((sec, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-bold text-slate-900">{sec.name}</td>
                    <td className="py-4 px-4 text-slate-600">{sec.department?.name || '-'} ({sec.department?.code || '-'})</td>
                    <td className="py-4 px-4 text-slate-600">{sec.semester?.name || '-'} (Sem {sec.semester?.number || '-'})</td>
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


