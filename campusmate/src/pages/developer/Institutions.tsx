import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { apiClient } from '../../services/apiClient';
import { AlertCircle, Building2, Users } from 'lucide-react';

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
      setInstitutions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient('/institutions', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsModalOpen(false);
      setFormData({ name: '', code: '' });
      fetchInstitutions();
    } catch (err: any) {
      alert(err.message || 'Failed to create institution');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: (inst: Institution) => (
        <div className="flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-slate-400" />
          <span className="font-medium text-slate-900">{inst.name}</span>
        </div>
      ),
    },
    {
      header: 'Join Code',
      accessor: (inst: Institution) => (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md font-mono">
          {inst.code}
        </span>
      ),
    },
    {
      header: 'Users',
      accessor: (inst: Institution) => (
        <div className="flex items-center text-slate-500">
          <Users className="w-4 h-4 mr-1.5" />
          {inst._count?.users || 0}
        </div>
      ),
    },
    {
      header: 'Created',
      accessor: (inst: Institution) => new Date(inst.createdAt).toLocaleDateString(),
    },
  ];

  if (loading) return <div className="p-8 text-center text-slate-500">Loading institutions...</div>;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Institution Management" 
        subtitle="Manage available institutions and their unique join codes"
        action={{
          label: "Add Institution",
          onClick: () => setIsModalOpen(true)
        }}
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-100">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable columns={columns} data={institutions} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Institution"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Institution Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Stanford University"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Join Code
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="e.g. STANFORD24"
            />
            <p className="mt-1 text-xs text-slate-500">
              Students will use this exact code during registration to join this institution.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Institution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DeveloperInstitutions;
