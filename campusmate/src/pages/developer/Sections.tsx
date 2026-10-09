import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Sections = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    departmentCode: '',
    departmentName: '',
    semesterNumber: 1,
    semesterName: '',
    institutionId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSections = async () => {
    try {
      const [data, institutionData] = await Promise.all([
        apiClient('/sections'),
        apiClient('/institutions'),
      ]);
      setSections(Array.isArray(data) ? data : []);
      setInstitutions(Array.isArray(institutionData) ? institutionData : []);
    } catch (error) {
      console.error('Failed to load sections', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      departmentCode: '',
      departmentName: '',
      semesterNumber: 1,
      semesterName: '',
      institutionId: institutions.length > 0 ? institutions[0].id : '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sec: any) => {
    setEditingId(sec.id);
    setFormData({
      name: sec.name || '',
      departmentCode: sec.department?.code || '',
      departmentName: sec.department?.name || '',
      semesterNumber: sec.semester?.number || 1,
      semesterName: sec.semester?.name || '',
      institutionId: sec.institutionId || sec.institution?.id || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await apiClient(`/sections/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...formData,
            institutionId: formData.institutionId || null,
          }),
        });
      } else {
        await apiClient('/sections', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            institutionId: formData.institutionId || null,
          }),
        });
      }
      setShowModal(false);
      setEditingId(null);
      await fetchSections();
    } catch (err: any) {
      console.error(err);
      alert(err.message || (editingId ? 'Failed to update section' : 'Failed to add section'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete section "${name}"?`)) return;
    try {
      await apiClient(`/sections/${id}`, { method: 'DELETE' });
      await fetchSections();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete section');
    }
  };

  const filteredSections = sections.filter((sec) => {
    const q = searchQuery.toLowerCase();
    const name = (sec.name || '').toLowerCase();
    const dept = (sec.department?.name || '' + sec.department?.code || '').toLowerCase();
    const sem = (sec.semester?.name || '' + sec.semester?.number || '').toLowerCase();
    const inst = (sec.institution?.name || '' + sec.institution?.code || '').toLowerCase();
    return name.includes(q) || dept.includes(q) || sem.includes(q) || inst.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="text-blue-600" size={24} /> Sections & Batches
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Create, edit, and manage class sections and assigned departments.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition shadow-sm w-fit"
        >
          <Plus size={18} /> Add Section
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search by section, department, semester, or institution..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-sm text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingId ? 'Edit Section' : 'Add New Section'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Section Name (e.g. CS-A)
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. CS-A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department Code (e.g. CS)
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. CS"
                  value={formData.departmentCode}
                  onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department Name (e.g. Computer Science)
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={formData.departmentName}
                  onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Semester Number
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="12"
                    value={formData.semesterNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, semesterNumber: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Semester Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Semester 1"
                    value={formData.semesterName}
                    onChange={(e) => setFormData({ ...formData, semesterName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Institution
                </label>
                <select
                  value={formData.institutionId}
                  onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">No specific institution</option>
                  {institutions.map((inst: any) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium transition"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  {editingId ? 'Update Section' : 'Save Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sections Table */}
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Section Name</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Department</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Semester</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Institution</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      {searchQuery ? 'No sections matching your search query' : 'No sections found'}
                    </td>
                  </tr>
                ) : (
                  filteredSections.map((sec) => (
                    <tr
                      key={sec.id}
                      className="border-b border-slate-100 hover:bg-slate-50/60 transition group"
                    >
                      <td className="py-4 px-4 font-bold text-slate-900">{sec.name}</td>
                      <td className="py-4 px-4 text-slate-600">
                        {sec.department?.name || '-'}{' '}
                        {sec.department?.code ? `(${sec.department.code})` : ''}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {sec.semester?.name || '-'}{' '}
                        {sec.semester?.number ? `(Sem ${sec.semester.number})` : ''}
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-sm">
                        {sec.institution?.name || sec.institutionId || '-'}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(sec)}
                          title="Edit Section"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition inline-flex items-center"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(sec.id, sec.name)}
                          title="Delete Section"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition inline-flex items-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
