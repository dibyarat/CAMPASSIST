import React, { useEffect, useState, useMemo } from 'react';
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
  X,
  AlertCircle,
  Download
} from 'lucide-react';
import { studyosService } from '../../services/studyosService';
import type { AcademicResource, StudyOSOverview } from '../../services/studyosService';

export type CanonicalCategory = 'NOTE' | 'FILE' | 'LAB_RECORD' | 'CLASS' | 'VIVA';
export type TabKey = 'All' | 'Notes' | 'Files' | 'Lab Records' | 'Classes' | 'Viva';

export interface NormalizedResource extends AcademicResource {
  canonicalCategory: CanonicalCategory;
  displayCategory: string;
  destinationUrl: string;
}

export function normalizeResource(raw: AcademicResource, studyosBaseUrl: string): NormalizedResource {
  const t = String(raw.type || '').trim().toUpperCase();
  const c = String(raw.category || '').trim().toUpperCase();
  const s = String(raw.source || '').trim().toLowerCase();

  let canonicalCategory: CanonicalCategory = 'NOTE';
  let displayCategory = 'Notes';
  let destinationPath = 'vault';

  // 1. Lab Records (Highest precedence: source labs, experiment number, or LAB type)
  if (
    s.includes('lab') ||
    raw.experimentNo !== undefined ||
    t.includes('LAB') ||
    c.includes('LAB')
  ) {
    canonicalCategory = 'LAB_RECORD';
    displayCategory = 'Lab Records';
    destinationPath = 'projects';
  }
  // 2. Virtual Study Classes
  else if (
    s.includes('class') ||
    t.includes('CLASS') ||
    c.includes('CLASS')
  ) {
    canonicalCategory = 'CLASS';
    displayCategory = 'Classes';
    destinationPath = 'classes';
  }
  // 3. Viva Resources
  else if (
    t.includes('VIVA') ||
    c.includes('VIVA') ||
    raw.title?.toUpperCase().includes('VIVA') ||
    raw.description?.toUpperCase().includes('VIVA')
  ) {
    canonicalCategory = 'VIVA';
    displayCategory = 'Viva';
    destinationPath = 'vault';
  }
  // 4. Notes (explicit study notes)
  else if (
    t === 'NOTE' ||
    t === 'NOTES' ||
    c === 'NOTE' ||
    c === 'NOTES'
  ) {
    canonicalCategory = 'NOTE';
    displayCategory = 'Notes';
    destinationPath = 'vault';
  }
  // 5. Standalone Files (PDFs, docs, code, archives)
  else if (
    t.includes('FILE') ||
    t.includes('PDF') ||
    t.includes('DOC') ||
    c.includes('FILE') ||
    Boolean(raw.fileName || raw.fileReference)
  ) {
    canonicalCategory = 'FILE';
    displayCategory = 'Files';
    destinationPath = 'vault';
  }

  const base = studyosBaseUrl.replace(/\/$/, '');
  const destinationUrl = `${base}/${destinationPath}`;

  return {
    ...raw,
    canonicalCategory,
    displayCategory,
    destinationUrl,
  };
}

export const StudyOS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('All');
  const [onlyMine, setOnlyMine] = useState(false);
  const [rawResources, setRawResources] = useState<AcademicResource[]>([]);
  const [overview, setOverview] = useState<StudyOSOverview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const rawUrl = overview?.studyosUrl || '';
  const studyosBaseUrl = (rawUrl && !rawUrl.includes('studyos-frontend.vercel.app'))
    ? rawUrl
    : (window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://studyos-nu-three.vercel.app');

  const openStudyOS = (path: string = '') => {
    const url = `${studyosBaseUrl.replace(/\/$/, '')}${path ? `/${path.replace(/^\//, '')}` : ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resList, overviewData] = await Promise.allSettled([
        studyosService.listResources(),
        studyosService.getOverview()
      ]);

      if (resList.status === 'fulfilled') {
        setRawResources(resList.value);
      } else {
        setError(resList.reason?.message || 'Unable to load StudyOS resources.');
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

  // Centralized normalized list
  const normalizedList = useMemo(() => {
    return rawResources.map(r => normalizeResource(r, studyosBaseUrl));
  }, [rawResources, studyosBaseUrl]);

  // Tab counts
  const counts = useMemo(() => {
    const list = onlyMine ? normalizedList.filter(r => r.isMine) : normalizedList;
    return {
      All: list.length,
      Notes: list.filter(r => r.canonicalCategory === 'NOTE').length,
      Files: list.filter(r => r.canonicalCategory === 'FILE').length,
      'Lab Records': list.filter(r => r.canonicalCategory === 'LAB_RECORD').length,
      Classes: list.filter(r => r.canonicalCategory === 'CLASS').length,
      Viva: list.filter(r => r.canonicalCategory === 'VIVA').length,
    };
  }, [normalizedList, onlyMine]);

  // KPI stats summary
  const stats = useMemo(() => {
    const myNotesAndFiles = normalizedList.filter(r => r.isMine && (r.canonicalCategory === 'NOTE' || r.canonicalCategory === 'FILE')).length;
    const totalNotesAndFiles = normalizedList.filter(r => r.canonicalCategory === 'NOTE' || r.canonicalCategory === 'FILE').length;

    const myLabs = normalizedList.filter(r => r.isMine && r.canonicalCategory === 'LAB_RECORD').length;
    const totalLabs = normalizedList.filter(r => r.canonicalCategory === 'LAB_RECORD').length;

    const myClasses = normalizedList.filter(r => r.isMine && r.canonicalCategory === 'CLASS').length;
    const totalClasses = normalizedList.filter(r => r.canonicalCategory === 'CLASS').length;

    return {
      myResources: overview?.myResources ?? overview?.stats?.myResources ?? myNotesAndFiles,
      totalResources: overview?.totalResources ?? overview?.stats?.totalResources ?? totalNotesAndFiles,
      myLabs: overview?.myLabs ?? overview?.stats?.myLabs ?? myLabs,
      totalLabs: overview?.totalLabs ?? overview?.stats?.totalLabs ?? totalLabs,
      myClasses: overview?.myClasses ?? overview?.stats?.myClasses ?? myClasses,
      totalClasses: overview?.totalClasses ?? overview?.stats?.totalClasses ?? totalClasses,
    };
  }, [normalizedList, overview]);

  // Tab & search filtering
  const visibleResources = useMemo(() => {
    return normalizedList.filter(item => {
      // 1. Tab category filter
      let matchesTab = true;
      if (activeTab === 'Notes') matchesTab = item.canonicalCategory === 'NOTE';
      else if (activeTab === 'Files') matchesTab = item.canonicalCategory === 'FILE';
      else if (activeTab === 'Lab Records') matchesTab = item.canonicalCategory === 'LAB_RECORD';
      else if (activeTab === 'Classes') matchesTab = item.canonicalCategory === 'CLASS';
      else if (activeTab === 'Viva') matchesTab = item.canonicalCategory === 'VIVA';

      // 2. Ownership filter
      const matchesMine = !onlyMine || Boolean(item.isMine);

      // 3. Search query filter
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        item.title?.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query) ||
        item.subjectId?.toLowerCase().includes(query) ||
        item.fileName?.toLowerCase().includes(query) ||
        item.displayCategory?.toLowerCase().includes(query);

      return matchesTab && matchesMine && matchesSearch;
    });
  }, [normalizedList, activeTab, onlyMine, searchQuery]);

  const openResource = async (resource: NormalizedResource) => {
    if (resource.canonicalCategory === 'CLASS') {
      openStudyOS('classes');
      return;
    }

    if (!resource.fileReference) {
      if (resource.canonicalCategory === 'LAB_RECORD') {
        openStudyOS('projects');
      } else {
        openStudyOS('vault');
      }
      return;
    }

    const preferredName = resource.fileName || `${resource.title || 'document'}${resource.canonicalCategory === 'LAB_RECORD' ? '.pdf' : ''}`;
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

      // Fallback
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

  const getResourceIcon = (category: CanonicalCategory) => {
    switch (category) {
      case 'NOTE':
        return <FileText className="text-amber-600" size={20} />;
      case 'LAB_RECORD':
        return <FlaskConical className="text-emerald-600" size={20} />;
      case 'CLASS':
        return <Video className="text-purple-600" size={20} />;
      case 'VIVA':
        return <HelpCircle className="text-rose-600" size={20} />;
      case 'FILE':
      default:
        return <Paperclip className="text-blue-600" size={20} />;
    }
  };

  const getIconBackground = (category: CanonicalCategory) => {
    switch (category) {
      case 'NOTE':
        return 'bg-amber-50 border-amber-100';
      case 'LAB_RECORD':
        return 'bg-emerald-50 border-emerald-100';
      case 'CLASS':
        return 'bg-purple-50 border-purple-100';
      case 'VIVA':
        return 'bg-rose-50 border-rose-100';
      case 'FILE':
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const tabs: TabKey[] = ['All', 'Notes', 'Files', 'Lab Records', 'Classes', 'Viva'];
  const myTotalCount = normalizedList.filter(r => r.isMine).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* CampAssist & StudyOS Header Card */}
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
          {/* Navigation Tabs with Accurate Item Counts */}
          <div className="flex flex-wrap bg-slate-100/80 p-1.5 rounded-2xl gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    activeTab === tab
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {counts[tab]}
                </span>
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
              My Items
              {myTotalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-indigo-100 text-indigo-700 font-bold">
                  {myTotalCount}
                </span>
              )}
            </button>

            <div className="relative">
              <input
                type="text"
                placeholder="Search resources, labs..."
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

        {/* Error notification with retry */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadData}
                className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
              >
                Retry
              </button>
              <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Resource List / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-sm font-medium">Fetching your StudyOS workspace...</p>
          </div>
        ) : visibleResources.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <GraduationCap size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">
                {searchQuery ? 'No matching resources found' : `No ${activeTab.toLowerCase()} found`}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                {searchQuery || onlyMine
                  ? 'No resources match your active filters or search terms. Try clearing search or disabling My Items.'
                  : `You haven't uploaded or accessed any ${activeTab.toLowerCase()} yet in your StudyOS workspace.`}
              </p>
            </div>
            <button
              onClick={() => openStudyOS(activeTab === 'Lab Records' ? 'projects' : activeTab === 'Classes' ? 'classes' : 'vault')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition"
            >
              <Sparkles size={14} />
              Open StudyOS to create {activeTab === 'All' ? 'resources' : activeTab.toLowerCase()} ↗
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
                      resource.canonicalCategory
                    )}`}
                  >
                    {getResourceIcon(resource.canonicalCategory)}
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

                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {resource.displayCategory}
                      </span>

                      {resource.experimentNo !== undefined && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Exp #{resource.experimentNo}
                        </span>
                      )}

                      {resource.subjectId && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
                          {resource.subjectId}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                      {resource.fileName && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[240px] text-slate-600 font-medium">
                            {resource.fileName}
                          </span>
                        </>
                      )}
                      {resource.fileSize && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">
                            {(resource.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </span>
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
                  {resource.fileReference ? (
                    <button
                      onClick={() => openResource(resource)}
                      disabled={openingId === resource.id}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 active:scale-95 disabled:opacity-60 transition"
                      title={resource.fileName ? `Download ${resource.fileName}` : 'Download file'}
                    >
                      {openingId === resource.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Download size={15} />
                      )}
                      <span>
                        {resource.canonicalCategory === 'LAB_RECORD'
                          ? 'Download Document'
                          : 'Download File'}
                      </span>
                    </button>
                  ) : resource.canonicalCategory === 'CLASS' ? (
                    <button
                      onClick={() => openResource(resource)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 active:scale-95 transition"
                    >
                      <Video size={15} />
                      <span>Join Class</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => {
                      if (resource.canonicalCategory === 'LAB_RECORD') openStudyOS('projects');
                      else if (resource.canonicalCategory === 'CLASS') openStudyOS('classes');
                      else openStudyOS('vault');
                    }}
                    className="flex items-center gap-1 px-2.5 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                    title="View in StudyOS"
                  >
                    <ExternalLink size={14} />
                    <span className="hidden md:inline">View in StudyOS</span>
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
