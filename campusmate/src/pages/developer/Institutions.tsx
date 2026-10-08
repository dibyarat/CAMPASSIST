import React, { useState, useEffect } from 'react';
import { Building2, Plus, Loader2, Trash2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface Institution {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  _count?: {
    users: number;
    sections: number;
  };
}

export const DeveloperInstitutions = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const data = await apiClient('/institutions');
      setInstitutions(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient('/institutions', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setFormData({ name: '', code: '' });
      setIsModalOpen(false);
      fetchInstitutions();
    } catch (err: any) {
      setError(err.message || 'Failed to create institution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this institution and all related section assignments?')) return;
    try {
      await apiClient(`/institutions/${id}`, { method: 'DELETE' });
      await fetchInstitutions();
    } catch (err: any) {
      setError(err.message || 'Failed to delete institution');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutions</h1>
          <p className="text-slate-500 font-medium mt-1">Manage platform tenants and their unique join codes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm hover:shadow"
        >
          <Plus size={18} />
          Add Institution
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-medium flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          {error}
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Name</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Join Code</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Users</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Sections</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Created</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => (
                <tr key={inst.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                  <td className="py-4 px-4 font-medium text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Building2 size={16} />
                    </div>
                    {inst.name}
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-sm font-semibold tracking-wider">
                      {inst.code}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {inst._count?.users || 0}
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {inst._count?.sections || 0}
                  </td>
                  <td className="py-4 px-4 text-slate-500 text-sm">
                    {new Date(inst.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(inst.id)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {institutions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No institutions found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Add New Institution</h2>
              <p className="text-slate-500 text-sm mt-1">Create a tenant for a university or college.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Stanford University"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Join Code</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono uppercase"
                  placeholder="e.g. STAN24"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
                <p className="text-xs text-slate-500 mt-2">Students will use this exact code to join your institution.</p>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
