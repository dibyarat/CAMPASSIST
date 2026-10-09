import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  FileText,
  UploadCloud,
  Building2,
  Users,
  Bell,
  BookOpen,
  Tag,
  MessageSquare,
  ArrowRight,
  Layers,
  BarChart2,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface SearchResultItem {
  id: string;
  title: string;
  desc: string;
  path: string;
  category: 'Pages & Tools' | 'Rooms & Facilities' | 'Subjects & Courses' | 'Notes & Resources' | 'Events';
  icon: any;
}

interface GlobalSearchProps {
  role: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ role }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveData, setLiveData] = useState<SearchResultItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Static Navigation items tailored by role
  const navItems = useMemo<SearchResultItem[]>(() => {
    if (role === 'developer') {
      return [
        { id: 'p-dev-dash', title: 'Dashboard', desc: 'System overview and metrics', path: '/developer', category: 'Pages & Tools', icon: Layers },
        { id: 'p-dev-users', title: 'Users & Roles', desc: 'Manage students, CRs, and developer roles', path: '/developer/users', category: 'Pages & Tools', icon: Users },
        { id: 'p-dev-inst', title: 'Institutions', desc: 'Manage colleges, universities, and codes', path: '/developer/institutions', category: 'Pages & Tools', icon: Building2 },
        { id: 'p-dev-sec', title: 'Sections & Batches', desc: 'Configure class sections, branches, and semesters', path: '/developer/sections', category: 'Pages & Tools', icon: FileText },
        { id: 'p-dev-sub', title: 'Subjects Master', desc: 'Course catalog, codes, and credit schemes', path: '/developer/subjects', category: 'Pages & Tools', icon: BookOpen },
        { id: 'p-dev-tt', title: 'Master Timetable', desc: 'Manage schedules, routine slots, and rooms', path: '/developer/timetable', category: 'Pages & Tools', icon: Calendar },
        { id: 'p-dev-rooms', title: 'Rooms & Facilities', desc: 'Lecture halls, labs, and capacity management', path: '/developer/rooms', category: 'Pages & Tools', icon: MapPin },
        { id: 'p-dev-att', title: 'Attendance Audit', desc: 'Inspect platform-wide attendance logs', path: '/developer/attendance', category: 'Pages & Tools', icon: Clock },
        { id: 'p-dev-res', title: 'Academic Resources', desc: 'Moderate uploaded notes and files', path: '/developer/resources', category: 'Pages & Tools', icon: UploadCloud },
        { id: 'p-dev-eve', title: 'Campus Events', desc: 'Publish and moderate college events', path: '/developer/events', category: 'Pages & Tools', icon: Calendar },
        { id: 'p-dev-off', title: 'Student Offers', desc: 'Manage student perks and local discounts', path: '/developer/offers', category: 'Pages & Tools', icon: Tag },
        { id: 'p-dev-map', title: 'Campus Map Moderation', desc: 'Update building locations and campus markers', path: '/developer/map', category: 'Pages & Tools', icon: MapPin },
        { id: 'p-dev-feed', title: 'Feedback Inbox', desc: 'Review student bug reports and feature requests', path: '/developer/feedbacks', category: 'Pages & Tools', icon: MessageSquare },
        { id: 'p-dev-sett', title: 'Developer Settings', desc: 'Platform configurations', path: '/developer/settings', category: 'Pages & Tools', icon: Users },
      ];
    }

    if (role === 'cr') {
      return [
        { id: 'p-cr-dash', title: 'CR Dashboard', desc: 'Quick overview of class routine and actions', path: '/cr', category: 'Pages & Tools', icon: Layers },
        { id: 'p-cr-tt', title: 'Class Timetable', desc: 'Weekly schedule and slot timings', path: '/cr/timetable', category: 'Pages & Tools', icon: Calendar },
        { id: 'p-cr-att', title: 'Mark Attendance', desc: 'Record and submit today\'s class attendance', path: '/cr/attendance', category: 'Pages & Tools', icon: Clock },
        { id: 'p-cr-ann', title: 'Broadcast Announcements', desc: 'Push important updates to all classmates', path: '/cr/announcements', category: 'Pages & Tools', icon: Bell },
        { id: 'p-cr-canc', title: 'Class Cancellations', desc: 'Log cancelled or rescheduled lectures', path: '/cr/cancellations', category: 'Pages & Tools', icon: Calendar },
        { id: 'p-cr-subm', title: 'Collect Submissions', desc: 'Track assignment submissions and files', path: '/cr/submissions', category: 'Pages & Tools', icon: FileText },
        { id: 'p-cr-polls', title: 'Class Polls', desc: 'Create polls to vote on deadlines or dates', path: '/cr/polls', category: 'Pages & Tools', icon: MessageSquare },
        { id: 'p-cr-rem', title: 'Class Reminders', desc: 'Schedule auto-reminders for exams and dues', path: '/cr/reminders', category: 'Pages & Tools', icon: Bell },
        { id: 'p-cr-rep', title: 'Class Reports', desc: 'Export class attendance statistics', path: '/cr/reports', category: 'Pages & Tools', icon: BarChart2 },
        { id: 'p-cr-room', title: 'Find Empty Rooms', desc: 'Search for vacant classrooms right now', path: '/student/find-room', category: 'Pages & Tools', icon: MapPin },
        { id: 'p-cr-study', title: 'StudyOS Library', desc: 'Access class notes, pyqs, and textbooks', path: '/student/studyos', category: 'Pages & Tools', icon: BookOpen },
      ];
    }

    // Default: Student
    return [
      { id: 'p-st-dash', title: 'Student Dashboard', desc: 'Daily classes, bunk streak, and overview', path: '/student', category: 'Pages & Tools', icon: Layers },
      { id: 'p-st-tt', title: 'My Timetable', desc: 'Weekly class routine, timings, and rooms', path: '/student/timetable', category: 'Pages & Tools', icon: Calendar },
      { id: 'p-st-att', title: 'Attendance Tracker', desc: 'Subject attendance percentages & safe bunks', path: '/student/attendance', category: 'Pages & Tools', icon: Clock },
      { id: 'p-st-plan', title: 'Attendance Planner', desc: 'Calculate classes needed to maintain 75%', path: '/student/attendance-planner', category: 'Pages & Tools', icon: BarChart2 },
      { id: 'p-st-room', title: 'Find Free Classrooms', desc: 'Locate empty rooms and labs on campus right now', path: '/student/find-room', category: 'Pages & Tools', icon: MapPin },
      { id: 'p-st-study', title: 'StudyOS Resource Hub', desc: 'Curated subject notes, formulas, and syllabus', path: '/student/studyos', category: 'Pages & Tools', icon: BookOpen },
      { id: 'p-st-subm', title: 'Assignments & Submissions', desc: 'Track pending assignments and submission status', path: '/student/submissions', category: 'Pages & Tools', icon: FileText },
      { id: 'p-st-gpa', title: 'SGPA / CGPA Calculator', desc: 'Calculate your GPA and target grades', path: '/student/calculator', category: 'Pages & Tools', icon: GraduationCap },
      { id: 'p-st-exam', title: 'Exam Schedule', desc: 'Mid-term and semester exam dates', path: '/student/exams', category: 'Pages & Tools', icon: Calendar },
      { id: 'p-st-seat', title: 'Exam Seating Arrangement', desc: 'Find your exam hall, floor, and bench number', path: '/student/exam-seat', category: 'Pages & Tools', icon: MapPin },
      { id: 'p-st-map', title: 'Campus Map Navigation', desc: 'Explore campus departments and buildings', path: '/student/map', category: 'Pages & Tools', icon: MapPin },
      { id: 'p-st-eve', title: 'Campus Events', desc: 'Upcoming workshops, festivals, and club meets', path: '/student/events', category: 'Pages & Tools', icon: Calendar },
      { id: 'p-st-off', title: 'Student Perks & Discounts', desc: 'Exclusive campus coupons and food deals', path: '/student/offers', category: 'Pages & Tools', icon: Tag },
      { id: 'p-st-poll', title: 'Class Polls', desc: 'Vote on class timings and surveys', path: '/student/polls', category: 'Pages & Tools', icon: MessageSquare },
      { id: 'p-st-rem', title: 'Reminder Center', desc: 'Custom alerts for submissions and events', path: '/student/reminders', category: 'Pages & Tools', icon: Bell },
      { id: 'p-st-not', title: 'Notifications', desc: 'Official notices and class updates', path: '/student/notifications', category: 'Pages & Tools', icon: Bell },
      { id: 'p-st-feed', title: 'Submit Feedback', desc: 'Share suggestions or report an issue', path: '/student/feedback', category: 'Pages & Tools', icon: MessageSquare },
      { id: 'p-st-set', title: 'Account Settings', desc: 'Update profile details and password', path: '/student/settings', category: 'Pages & Tools', icon: Users },
    ];
  }, [role]);

  // Fetch live searchable data (rooms, subjects, notes) once on mount
  useEffect(() => {
    let isMounted = true;

    const fetchSearchData = async () => {
      try {
        const [roomsRes, subjectsRes, resourcesRes, eventsRes] = await Promise.allSettled([
          apiClient('/rooms'),
          apiClient('/subjects'),
          apiClient('/studyos/academic'),
          apiClient('/events'),
        ]);

        if (!isMounted) return;
        const items: SearchResultItem[] = [];

        // 1. Rooms
        if (roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value)) {
          roomsRes.value.forEach((r: any) => {
            const label = r.roomNumber || `Room ${r.id}`;
            const desc = `${r.isLab ? 'Lab' : 'Classroom'}${r.building ? ` • ${r.building}` : ''} • Capacity: ${r.capacity || 'N/A'}`;
            items.push({
              id: `room-${r.id}`,
              title: `Room: ${label}`,
              desc,
              path: role === 'developer' ? '/developer/rooms' : '/student/find-room',
              category: 'Rooms & Facilities',
              icon: MapPin,
            });
          });
        }

        // 2. Subjects
        if (subjectsRes.status === 'fulfilled' && Array.isArray(subjectsRes.value)) {
          subjectsRes.value.forEach((s: any) => {
            items.push({
              id: `subj-${s.id}`,
              title: `${s.name} (${s.code || 'No Code'})`,
              desc: `${s.type || 'Course'} • ${s.credits || 3} Credits`,
              path: role === 'developer' ? '/developer/subjects' : '/student/timetable',
              category: 'Subjects & Courses',
              icon: BookOpen,
            });
          });
        }

        // 3. Resources
        if (resourcesRes.status === 'fulfilled' && Array.isArray(resourcesRes.value)) {
          resourcesRes.value.forEach((res: any) => {
            items.push({
              id: `res-${res.id}`,
              title: res.title || 'Untitled Document',
              desc: `${res.type || 'Academic Resource'} • Study Material`,
              path: role === 'developer' ? '/developer/resources' : '/student/studyos',
              category: 'Notes & Resources',
              icon: UploadCloud,
            });
          });
        }

        // 4. Events
        if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value)) {
          eventsRes.value.forEach((e: any) => {
            items.push({
              id: `event-${e.id}`,
              title: e.title || 'Campus Event',
              desc: `${e.category || 'Event'} • ${e.venue || 'Campus'}`,
              path: `/${role}/events`,
              category: 'Events',
              icon: Calendar,
            });
          });
        }

        setLiveData(items);
        setDataLoaded(true);
      } catch {
        // Silently fallback to static nav
      }
    };

    fetchSearchData();
    return () => { isMounted = false; };
  }, [role]);

  // Combined searchable item pool
  const allItems = useMemo(() => {
    return [...navItems, ...liveData];
  }, [navItems, liveData]);

  // Filter items matching query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Return top 8 suggested pages when empty
      return navItems.slice(0, 8);
    }

    return allItems
      .filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const descMatch = item.desc.toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch;
      })
      .slice(0, 15);
  }, [allItems, navItems, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K or '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation in dropdown
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    navigate(item.path);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input Bar */}
      <div
        className={`flex items-center bg-slate-100 rounded-full px-4 py-2 border transition duration-200 ${
          isOpen
            ? 'border-blue-400 bg-white ring-2 ring-blue-100 shadow-md'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <Search size={18} className="text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search rooms, notes, subjects, pages..."
          className="bg-transparent border-none outline-none ml-2 text-sm w-full text-slate-800 placeholder-slate-400 font-medium"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition"
            title="Clear"
          >
            <X size={15} />
          </button>
        ) : (
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs shrink-0 select-none">
            <span>⌘</span>
            <span>K</span>
          </div>
        )}
      </div>

      {/* Floating Results Dropdown */}
      {isOpen && (
        <div className="absolute top-12 left-0 right-0 sm:w-[480px] sm:-left-4 z-50 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header metadata */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" />
              {query ? `Search results for "${query}"` : 'Quick Navigation & Suggestions'}
            </span>
            <span className="text-slate-400 font-normal">
              {filteredResults.length} {filteredResults.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50 py-1">
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Search size={28} className="mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No matching results found</p>
                <p className="text-xs text-slate-400">
                  Try searching for room numbers (e.g. "Room 101"), courses ("CS"), notes, or pages.
                </p>
              </div>
            ) : (
              filteredResults.map((item, idx) => {
                const IconComponent = item.icon || Layers;
                const isSelected = idx === selectedIndex;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50/90 text-blue-900 border-l-4 border-blue-600 pl-3'
                        : 'hover:bg-slate-50/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <IconComponent size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate text-slate-900">
                            {item.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                              item.category === 'Pages & Tools'
                                ? 'bg-purple-100 text-purple-700'
                                : item.category === 'Rooms & Facilities'
                                ? 'bg-amber-100 text-amber-700'
                                : item.category === 'Subjects & Courses'
                                ? 'bg-emerald-100 text-emerald-700'
                                : item.category === 'Notes & Resources'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate font-medium mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 flex items-center gap-1 text-slate-400">
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-white px-2 py-1 rounded-md shadow-xs border border-blue-200">
                          <span>Jump</span>
                          <CornerDownLeft size={12} />
                        </div>
                      ) : (
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer keyboard helpers */}
          <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] shadow-xs">↑</kbd>{' '}
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] shadow-xs">↓</kbd> Navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] shadow-xs">Enter</kbd> Select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] shadow-xs">Esc</kbd> Close
              </span>
            </div>
            <span className="font-medium text-slate-500 hidden sm:inline">CampAssist Instant Search</span>
          </div>
        </div>
      )}
    </div>
  );
};
