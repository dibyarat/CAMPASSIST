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
  Download,
  Users,
  MessageSquare
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
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const loadData = async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError('');
    try {
      const [resList, overviewData] = await Promise.allSettled([
        studyosService.listResources(),
        studyosService.getOverview()
      ]);

      if (resList.status === 'fulfilled') {
        setRawResources(resList.value);
      } else if (!silent) {
        setError(resList.reason?.message || 'Unable to load StudyOS resources.');
      }

      if (overviewData.status === 'fulfilled') {
        setOverview(overviewData.value);
      }
    } catch (loadError: any) {
      if (!silent) {
        setError(loadError.message || 'Unable to connect to StudyOS.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Continuously update StudyOS resources every 8 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 8000);

    // Auto-sync immediately when returning to this tab from StudyOS workspace
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
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
      openTeams: overview?.openTeams ?? overview?.stats?.openTeams ?? overview?.totalTeams ?? overview?.stats?.totalTeams ?? 0,
      myTeams: overview?.myTeams ?? overview?.stats?.myTeams ?? 0,
      totalTeams: overview?.totalTeams ?? overview?.stats?.totalTeams ?? overview?.openTeams ?? overview?.stats?.openTeams ?? 0,
      helpServices: overview?.helpServices ?? overview?.stats?.helpServices ?? overview?.totalHelpServices ?? overview?.stats?.totalHelpServices ?? 0,
      myHelpServices: overview?.myHelpServices ?? overview?.stats?.myHelpServices ?? 0,
      totalHelpServices: overview?.totalHelpServices ?? overview?.stats?.totalHelpServices ?? overview?.helpServices ?? overview?.stats?.helpServices ?? 0,
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
        return <FileText className="text-amber-400" size={20} />;
      case 'LAB_RECORD':
        return <FlaskConical className="text-emerald-400" size={20} />;
      case 'CLASS':
        return <Video className="text-[#D946A8]" size={20} />;
      case 'VIVA':
        return <HelpCircle className="text-rose-400" size={20} />;
      case 'FILE':
      default:
        return <Paperclip className="text-[#19A3E9]" size={20} />;
    }
  };

  const getIconBackground = (category: CanonicalCategory) => {
    switch (category) {
      case 'NOTE':
        return 'bg-amber-500/15 border-amber-500/30';
      case 'LAB_RECORD':
        return 'bg-emerald-500/15 border-emerald-500/30';
      case 'CLASS':
        return 'bg-[rgba(217,70,168,0.15)] border-[#D946A8]/30';
      case 'VIVA':
        return 'bg-rose-500/15 border-rose-500/30';
      case 'FILE':
      default:
        return 'bg-[rgba(25,163,233,0.15)] border-[#19A3E9]/30';
    }
  };

  const tabs: TabKey[] = ['All', 'Notes', 'Files', 'Lab Records', 'Classes', 'Viva'];
  const myTotalCount = normalizedList.filter(r => r.isMine).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* CampAssist & StudyOS Header Card */}
      <div className="relative overflow-hidden rounded-3xl glass p-8 text-[var(--color-text)] border border-[var(--color-border)] shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[radial-gradient(circle,rgba(217,70,168,0.15)_0%,transparent_70%)] rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-[radial-gradient(circle,rgba(25,163,233,0.12)_0%,transparent_70%)] rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] tracking-wide uppercase">
              <Sparkles size={13} className="text-amber-400" />
              CampAssist & StudyOS
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
              CampAssist & StudyOS
            </h1>
            <p className="text-[var(--color-muted)] text-sm md:text-base max-w-xl leading-relaxed">
              Seamlessly browse your notes, experiment records, and virtual classes synced with your personal StudyOS workspace.
            </p>
          </div>

          <button
            onClick={() => openStudyOS()}
            className="self-start md:self-auto shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-primary text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <GraduationCap size={18} />
            Launch Full StudyOS
            <ExternalLink size={15} className="opacity-75" />
          </button>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-8 pt-6 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            onClick={() => openStudyOS('teams')}
            className="glass hover:border-[#19A3E9]/50 transition-all cursor-pointer rounded-2xl p-4 border border-[var(--color-border)] flex items-center gap-3"
            title="Open Team Finder in StudyOS"
          >
            <div className="w-10 h-10 rounded-xl bg-[rgba(25,163,233,0.15)] border border-[#19A3E9]/30 flex items-center justify-center shrink-0">
              <Users size={20} className="text-[#19A3E9]" />
            </div>
            <div>
              <div className="text-xs text-[var(--color-muted)] font-medium">Open Teams</div>
              <div className="text-lg font-bold text-[var(--color-text)]">
                {stats.myTeams} <span className="text-xs font-normal text-[var(--color-muted)]">mine / {stats.openTeams} total</span>
              </div>
            </div>
          </div>

          <div 
            onClick={() => openStudyOS('skills')}
            className="glass hover:border-[#D946A8]/50 transition-all cursor-pointer rounded-2xl p-4 border border-[var(--color-border)] flex items-center gap-3"
            title="Open Skills & Help in StudyOS"
          >
            <div className="w-10 h-10 rounded-xl bg-[rgba(217,70,168,0.15)] border border-[#D946A8]/30 flex items-center justify-center shrink-0">
              <MessageSquare size={20} className="text-[#D946A8]" />
            </div>
            <div>
              <div className="text-xs text-[var(--color-muted)] font-medium">Help Services</div>
              <div className="text-lg font-bold text-[var(--color-text)]">
                {stats.myHelpServices} <span className="text-xs font-normal text-[var(--color-muted)]">mine / {stats.helpServices} total</span>
              </div>
            </div>
          </div>

          <div 
            onClick={() => openStudyOS('classes')}
            className="glass hover:border-purple-400/50 transition-all cursor-pointer rounded-2xl p-4 border border-[var(--color-border)] flex items-center gap-3"
            title="Open Virtual Classes in StudyOS"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Video size={20} className="text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-[var(--color-muted)] font-medium">Virtual Classes</div>
              <div className="text-lg font-bold text-[var(--color-text)]">
                {stats.myClasses} <span className="text-xs font-normal text-[var(--color-muted)]">mine / {stats.totalClasses} total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass rounded-3xl border border-[var(--color-border)] shadow-sm p-6 space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Navigation Tabs with Accurate Item Counts */}
          <div className="flex flex-wrap glass p-1.5 rounded-2xl border border-[var(--color-border)] gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-[rgba(25,163,233,0.15)] text-[#19A3E9] border border-[#19A3E9]/30 shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    activeTab === tab
                      ? 'bg-[#19A3E9]/20 text-[#19A3E9]'
                      : 'glass text-[var(--color-muted)] border border-[var(--color-border)]'
                  }`}
                >
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Search, My Items filter & Refresh & Live Indicator */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Sync Status indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass border border-[var(--color-border)] text-[11px] font-medium text-[var(--color-muted)]" title="Auto-syncing with StudyOS workspace in real time">
              <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-[#19A3E9] animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span>Live Sync Active</span>
            </div>

            <button
              onClick={() => setOnlyMine(!onlyMine)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                onlyMine
                  ? 'bg-[rgba(25,163,233,0.15)] border-[#19A3E9] text-[#19A3E9]'
                  : 'glass border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
              title="Show only items created by your account"
            >
              <UserCheck size={15} />
              My Items
              {myTotalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-[rgba(25,163,233,0.2)] text-[#19A3E9] font-bold">
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
                className="w-48 sm:w-60 pl-8 pr-7 py-2 rounded-xl border border-[var(--color-border)] text-xs sm:text-sm outline-none glass text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[#19A3E9] transition"
              />
              <Search size={14} className="absolute left-2.5 top-3 text-[var(--color-muted)]" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => loadData(false)}
              disabled={loading || isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-[rgba(25,163,233,0.15)] text-[#19A3E9] border border-[#19A3E9]/30 rounded-xl text-xs sm:text-sm font-semibold hover:bg-[rgba(25,163,233,0.25)] active:scale-95 transition disabled:opacity-60"
              title="Refresh resources from StudyOS"
            >
              <RefreshCw size={14} className={loading || isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error notification with retry */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => loadData(false)}
                className="px-3 py-1 glass border border-rose-500/30 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
              >
                Retry
              </button>
              <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-300">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Resource List / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted)] space-y-3">
            <Loader2 className="animate-spin text-[#19A3E9]" size={32} />
            <p className="text-sm font-medium">Fetching your StudyOS workspace...</p>
          </div>
        ) : visibleResources.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-[var(--color-border)] rounded-2xl p-8 space-y-4 glass">
            <div className="w-14 h-14 rounded-2xl glass text-[#19A3E9] border border-[var(--color-border)] flex items-center justify-center mx-auto">
              <GraduationCap size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[var(--color-text)] text-base">
                {searchQuery ? 'No matching resources found' : `No ${activeTab.toLowerCase()} found`}
              </h3>
              <p className="text-[var(--color-muted)] text-xs sm:text-sm max-w-md mx-auto">
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
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--color-border)] hover:border-[#19A3E9]/50 hover:shadow-md transition-all duration-200 glass"
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
                      <h4 className="font-bold text-[var(--color-text)] text-sm sm:text-base truncate group-hover:text-[#19A3E9] transition">
                        {resource.title}
                      </h4>

                      {resource.isMine && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(217,70,168,0.15)] text-[#D946A8] border border-[#D946A8]/30">
                          ✦ Created by you
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold glass text-[var(--color-text)] border border-[var(--color-border)]">
                        {resource.displayCategory}
                      </span>

                      {resource.experimentNo !== undefined && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Exp #{resource.experimentNo}
                        </span>
                      )}

                      {resource.subjectId && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(25,163,233,0.15)] text-[#19A3E9] border border-[#19A3E9]/30">
                          {resource.subjectId}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                      <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                      {resource.fileName && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[240px] text-[var(--color-text)] font-medium">
                            {resource.fileName}
                          </span>
                        </>
                      )}
                      {resource.fileSize && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--color-muted)]">
                            {(resource.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </>
                      )}
                    </div>

                    {resource.description && (
                      <p className="text-xs text-[var(--color-muted)] line-clamp-1 max-w-xl">
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
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#19A3E9] bg-[rgba(25,163,233,0.15)] border border-[#19A3E9]/30 rounded-xl hover:bg-[rgba(25,163,233,0.25)] active:scale-95 disabled:opacity-60 transition"
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
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#D946A8] bg-[rgba(217,70,168,0.15)] border border-[#D946A8]/30 rounded-xl hover:bg-[rgba(217,70,168,0.25)] active:scale-95 transition"
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
                    className="flex items-center gap-1 px-2.5 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] glass hover:border-[var(--color-primary)] rounded-xl transition border border-[var(--color-border)]"
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
