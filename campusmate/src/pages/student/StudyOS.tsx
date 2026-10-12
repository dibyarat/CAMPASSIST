import React, { useEffect, useState } from 'react';
import { 
  Search, 
  FileText, 
  ExternalLink, 
  Loader2, 
  RefreshCw, 
  GraduationCap, 
  FlaskConical, 
  Video, 
  Paperclip, 
  HelpCircle, 
  Sparkles, 
  UserCheck, 
  BookOpen,
  X
} from 'lucide-react';
import { studyosService } from '../../services/studyosService';
import type { AcademicResource, StudyOSOverview } from '../../services/studyosService';

export const StudyOS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'Notes' | 'Files' | 'Lab Records' | 'Classes' | 'Viva'>('All');
  const [onlyMine, setOnlyMine] = useState(false);
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [overview, setOverview] = useState<StudyOSOverview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resList, overviewData] = await Promise.allSettled([
        studyosService.listResources(),
        studyosService.getOverview()
      ]);

      if (resList.status === 'fulfilled') {
        setResources(resList.value);
      } else {
        setError(resList.reason?.message || 'Unable to load academic resources.');
      }

      if (overviewData.status === 'fulfilled') {
        setOverview(overviewData.value);
      }
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to connect to StudyOS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rawUrl = overview?.studyosUrl || '';
  const studyosBaseUrl = (rawUrl && !rawUrl.includes('studyos-frontend.vercel.app'))
    ? rawUrl
    : (window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://studyos-nu-three.vercel.app');

  const openStudyOS = (path: string = '') => {
    const url = `${studyosBaseUrl.replace(/\/$/, '')}${path ? `/${path.replace(/^\//, '')}` : ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const visibleResources = resources.filter(resource => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      resource.title?.toLowerCase().includes(query) || 
      resource.description?.toLowerCase().includes(query) ||
      resource.category?.toLowerCase().includes(query) ||
      resource.type?.toLowerCase().includes(query);

    const matchesMine = !onlyMine || Boolean(resource.isMine);

    let matchesTab = true;
    if (activeTab === 'Notes') {
      matchesTab = resource.type === 'NOTE';
    } else if (activeTab === 'Files') {
      matchesTab = resource.type === 'FILE';
    } else if (activeTab === 'Lab Records') {
      matchesTab = resource.type === 'LAB_RECORD';
    } else if (activeTab === 'Classes') {
      matchesTab = resource.type === 'CLASS';
    } else if (activeTab === 'Viva') {
      matchesTab = resource.type === 'VIVA';
    }

    return matchesSearch && matchesMine && matchesTab;
  });

  const openResource = async (resource: AcademicResource) => {
    if (!resource.fileReference) {
      if (resource.type === 'CLASS') {
        openStudyOS('classes');
        return;
      }
      if (resource.type === 'LAB_RECORD') {
        openStudyOS('lab');
        return;
      }
      openStudyOS('vault');
      return;
    }

    const preferredName = resource.fileName || `${resource.title || 'document'}${resource.type === 'LAB_RECORD' ? '.pdf' : ''}`;
    setOpeningId(resource.id);
    try {
      const targetUrl = (resource.fileReference.startsWith('http://') || resource.fileReference.startsWith('https://'))
        ? resource.fileReference
        : (await studyosService.getDownloadUrl(resource.fileReference)).url;

      try {
        const res = await fetch(targetUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = preferredName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
          return;
        }
      } catch (_) {}

      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = preferredName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (openError: any) {
      setError(openError.message || 'Unable to open this resource.');
    } finally {
      setOpeningId(null);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'NOTE':
        return <FileText className="text-amber-600" size={20} />;
      case 'LAB_RECORD':
        return <FlaskConical className="text-emerald-600" size={20} />;
      case 'CLASS':
        return <Video className="text-purple-600" size={20} />;
      case 'VIVA':
        return <HelpCircle className="text-rose-600" size={20} />;
      default:
        return <Paperclip className="text-blue-600" size={20} />;
    }
  };

  const getIconBackground = (type: string) => {
    switch (type) {
      case 'NOTE':
        return 'bg-amber-50 border-amber-100';
      case 'LAB_RECORD':
        return 'bg-emerald-50 border-emerald-100';
      case 'CLASS':
        return 'bg-purple-50 border-purple-100';
      case 'VIVA':
        return 'bg-rose-50 border-rose-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const myCount = resources.filter(r => r.isMine).length;

  const stats = {
    myResources: overview?.myResources ?? overview?.stats?.myResources ?? (resources.filter(r => r.isMine && (r.type === 'NOTE' || r.type === 'FILE' || r.type === 'Resources')).length),
    totalResources: overview?.totalResources ?? overview?.stats?.totalResources ?? (resources.filter(r => r.type === 'NOTE' || r.type === 'FILE' || r.type === 'Resources').length),
    myLabs: overview?.myLabs ?? overview?.stats?.myLabs ?? (resources.filter(r => r.isMine && r.type === 'Lab Records').length),
    totalLabs: overview?.totalLabs ?? overview?.stats?.totalLabs ?? (resources.filter(r => r.type === 'Lab Records').length),
    myClasses: overview?.myClasses ?? overview?.stats?.myClasses ?? (resources.filter(r => r.isMine && r.type === 'Class').length),
    totalClasses: overview?.totalClasses ?? overview?.stats?.totalClasses ?? (resources.filter(r => r.type === 'Class').length),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* StudyOS Overview Hub Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl shadow-indigo-500/10">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white tracking-wide uppercase">
              <Sparkles size={13} className="text-amber-300" />
              CampAssist & StudyOS
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              CampAssist & StudyOS
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-xl leading-relaxed">
              Seamlessly browse your notes, experiment records, and virtual classes synced with your personal StudyOS workspace.
            </p>
          </div>

          <button
            onClick={() => openStudyOS()}
            className="self-start md:self-auto shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-700 font-bold text-sm shadow-md hover:bg-white/95 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <GraduationCap size={18} />
            Launch Full StudyOS
            <ExternalLink size={15} className="opacity-75" />
          </button>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-white/70 font-medium">Notes & Resources</div>
              <div className="text-lg font-bold">
                {stats.myResources} <span className="text-xs font-normal text-white/60">mine / {stats.totalResources} total</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <FlaskConical size={20} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-white/70 font-medium">Lab Experiments</div>
              <div className="text-lg font-bold">
                {stats.myLabs} <span className="text-xs font-normal text-white/60">mine / {stats.totalLabs} total</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Video size={20} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-white/70 font-medium">Virtual Classes</div>
              <div className="text-lg font-bold">
                {stats.myClasses} <span className="text-xs font-normal text-white/60">mine / {stats.totalClasses} total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap bg-slate-100/80 p-1.5 rounded-2xl gap-1">
            {(['All', 'Notes', 'Files', 'Lab Records', 'Classes', 'Viva'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search, My Items filter & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setOnlyMine(!onlyMine)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                onlyMine
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Show only items created by your account"
            >
              <UserCheck size={15} />
              My Items {myCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-indigo-100 text-indigo-700">{myCount}</span>}
            </button>

            <div className="relative">
              <input
                type="text"
                placeholder="Search notes, labs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 pl-8 pr-7 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none bg-slate-50 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition"
              />
              <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-100 active:scale-95 transition disabled:opacity-60"
              title="Refresh resources"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Resource List / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-sm font-medium">Fetching your StudyOS data...</p>
          </div>
        ) : visibleResources.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <GraduationCap size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">No items found</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                {searchQuery || onlyMine
                  ? 'No resources match your active filters or search terms. Try clearing your filters.'
                  : `No ${activeTab.toLowerCase()} available yet in your StudyOS vault or courses.`}
              </p>
            </div>
            <button
              onClick={() => openStudyOS()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition"
            >
              <Sparkles size={14} />
              Open StudyOS to Create Resources
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleResources.map((resource) => (
              <div
                key={resource.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-150 hover:border-indigo-200 hover:shadow-md transition-all duration-200 bg-white/70 backdrop-blur-sm"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${getIconBackground(
                      resource.type
                    )}`}
                  >
                    {getResourceIcon(resource.type)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-indigo-600 transition">
                        {resource.title}
                      </h4>

                      {resource.isMine && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          ✦ Created by you
                        </span>
                      )}

                      {resource.experimentNo !== undefined && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Exp #{resource.experimentNo}
                        </span>
                      )}

                      {resource.category && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          {resource.category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{resource.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                      {resource.fileName && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px] text-slate-400">{resource.fileName}</span>
                        </>
                      )}
                    </div>

                    {resource.description && (
                      <p className="text-xs text-slate-600 line-clamp-1 max-w-xl">
                        {resource.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => openResource(resource)}
                    disabled={openingId === resource.id}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 active:scale-95 disabled:opacity-60 transition"
                  >
                    {openingId === resource.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <ExternalLink size={15} />
                    )}
                    <span>
                      {resource.type === 'CLASS'
                        ? 'Join Class'
                        : resource.fileReference
                        ? 'Open File'
                        : 'View in StudyOS'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
