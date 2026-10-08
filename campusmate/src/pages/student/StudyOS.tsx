import React, { useEffect, useState } from 'react';
import { Search, FileText, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { studyosService } from '../../services/studyosService';
import type { AcademicResource } from '../../services/studyosService';

export const StudyOS = () => {
  const [activeTab, setActiveTab] = useState<'Notes' | 'Files' | 'Lab Records' | 'Viva' | 'Resources'>('Notes');
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadResources = async () => {
    setLoading(true);
    setError('');
    try {
      setResources(await studyosService.listResources());
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load academic resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const visibleResources = resources.filter(resource => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || resource.title.toLowerCase().includes(query) || resource.type.toLowerCase().includes(query);
    const matchesTab = activeTab === 'Resources' || resource.type.toLowerCase().includes(activeTab.slice(0, -1).toLowerCase());
    return matchesSearch && matchesTab;
  });

  const openResource = async (resource: AcademicResource) => {
    setOpeningId(resource.id);
    try {
      const { url } = await studyosService.getDownloadUrl(resource.fileReference);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (openError: any) {
      setError(openError.message || 'Unable to open this resource.');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">StudyOS</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-slate-50 p-1 rounded-xl">
            {['Notes', 'Files', 'Lab Records', 'Viva', 'Resources'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                  activeTab === tab 
                    ? 'bg-gradient-primary text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="text" placeholder="Search..." className="w-48 pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none bg-slate-50 focus:bg-white/60 backdrop-blur-xl focus:border-blue-300 transition" />
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
            <button onClick={loadResources} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-sm font-semibold hover:bg-blue-100 transition" title="Refresh resources">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">{error}</div>}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : visibleResources.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No resources found for this view.</div>
          ) : visibleResources.map(resource => (
            <div key={resource.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition bg-white/60 backdrop-blur-xl">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 text-blue-700">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{resource.title}</h4>
                  <p className="text-sm text-slate-500">{resource.type} · {new Date(resource.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => openResource(resource)} disabled={openingId === resource.id} className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-60">
                {openingId === resource.id ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                Open
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
