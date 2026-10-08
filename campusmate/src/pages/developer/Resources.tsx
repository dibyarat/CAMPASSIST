import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { studyosService } from '../../services/studyosService';
import type { AcademicResource } from '../../services/studyosService';

export const Resources = () => {
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    studyosService.listResources().then(setResources).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openResource = async (resource: AcademicResource) => {
    setOpeningId(resource.id);
    try {
      const { url } = await studyosService.getDownloadUrl(resource.fileReference);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to open resource', error);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">StudyOS Resources</h1>
          <p className="text-slate-500 font-medium mt-1">Monitor storage, API usage, and system health.</p>
        </div>
        <button onClick={load} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition">
          <RefreshCw size={18} /> Refresh Resources
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-6">Academic Resources ({resources.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Filename</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Uploader</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Size</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="py-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" /></td></tr> : resources.length === 0 ? <tr><td colSpan={4} className="py-10 text-center text-slate-500">No academic resources found.</td></tr> : resources.map(resource => (
                <tr key={resource.id} className="border-b border-slate-100">
                  <td className="py-4 px-4 font-medium text-slate-800 flex items-center gap-2"><FileText size={16} />{resource.title}</td>
                  <td className="py-4 px-4 text-slate-600">{resource.type}</td>
                  <td className="py-4 px-4 text-slate-600">{resource.subjectId || '-'}</td>
                  <td className="py-4 px-4 text-right"><button onClick={() => openResource(resource)} disabled={openingId === resource.id} className="text-blue-600 disabled:opacity-60" title="Open resource">{openingId === resource.id ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
