import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Settings, ArrowRightLeft, Menu, ChevronLeft, ChevronRight, LayoutDashboard, Calendar, Clock, MapPin, GraduationCap, FileText, UploadCloud, Building2, Users, Bell, Search, LogOut, BarChart2, CalendarDays, Bookmark, Tag, MessageSquare } from 'lucide-react';

// Public
import { AnalyticsTracker } from './utils/AnalyticsTracker';
import { trackEvent } from './utils/analytics';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebaseClient';
import { RouteFallback } from './routeFallback';
import { GlobalSearch } from './components/GlobalSearch';
import { BrandBackdrop } from './components/BrandBackdrop';
import { authService } from './services/authService';
import {
  Landing, Login, Register,
  StudentDashboard, StudentTimetable, StudentAttendance, StudentAttendancePlanner, StudentSgpaCgpa, StudentFindRoom, StudentStudyOS, StudentSubmissions, StudentContacts, StudentNotifications, StudentRequests, StudentPolls, StudentReminderCenter, StudentExamSchedule, StudentExamSeat, StudentEvents, StudentCollegeMap, StudentOffers, StudentSettings, StudentAcademicPdfs, StudentProfile, StudentFeedback,
  CrDashboard, CrTimetable, CrAnnouncements, CrCancellations, CrReports, CrPolls, CrReminders, CrSubmissions,
  DevDashboard, DevUsers, DevInstitutions, DevSections, DevSubjects, DevTimetable, DevRooms, DevAttendance, DevResources, DevEvents, DevOffers, DevMap, DevContacts, DevExams, DevPDFs, DevStudents, DevSettings, DevDepartments, DevSemesters, DevFeedbacks
} from './lazyRoutes';
import logoIcon from './assets/logo-icon.png';
import { useAndroidAppShell } from './hooks/useAndroidAppShell';

function AndroidBridgeInitializer() {
  useAndroidAppShell();
  return null;
}

const SidebarLink = ({ to, icon: Icon, children, isCollapsed = false }: { to: string, icon: any, children: React.ReactNode, isCollapsed?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (!['/student', '/cr', '/developer'].includes(to) && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 py-2.5 rounded-full transition-all duration-150 font-medium text-sm ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${
        isActive 
          ? 'bg-gradient-brand text-white font-semibold shadow-[0_4px_16px_rgba(113,64,216,0.35)]' 
          : 'text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--color-text)]'
      }`}
    >
      <Icon size={18} className={isActive ? 'text-white shrink-0' : 'text-[var(--color-muted)] shrink-0'} />
      {!isCollapsed && <span className="whitespace-nowrap">{children}</span>}
    </Link>
  );
};

const MainLayout = ({ children, role = 'student' }: { children: React.ReactNode, role?: string }) => {
  const [actualRole, setActualRole] = React.useState<string>(() => localStorage.getItem('userRole') || 'STUDENT');
  const [userName, setUserName] = React.useState<string>(() => localStorage.getItem('userFullName') || 'Student');
  const normalizedAccountRole = actualRole.toUpperCase();
  const accountHome = normalizedAccountRole === 'DEVELOPER' ? '/developer' : normalizedAccountRole === 'CR' ? '/cr' : '/student';
  const canAccessRole = role.toUpperCase() === normalizedAccountRole || (normalizedAccountRole === 'CR' && role === 'student');
  const [authState, setAuthState] = React.useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        let activeUser = auth.currentUser;
        if (!activeUser) {
          activeUser = await new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
              unsubscribe();
              resolve(user);
            });
          });
        }

        if (activeUser) {
          // Immediately sync latest user profile from backend so role promotions take effect dynamically!
          try {
            const profile = await authService.me();
            if (profile && isMounted) {
              const liveRole = profile.role || 'STUDENT';
              const liveName = profile.profile?.fullName || profile.email?.split('@')[0] || 'User';
              localStorage.setItem('userRole', liveRole);
              localStorage.setItem('userFullName', liveName);
              setActualRole(liveRole);
              setUserName(liveName);
            }
          } catch (profileErr) {
            console.warn('Unable to sync profile during session check:', profileErr);
          }

          if (!isMounted) return;
          setAuthState('authenticated');
          return;
        }
      } catch (error) {
        console.error('Unable to restore the authenticated session', error);
      }

      if (!isMounted) return;
      localStorage.removeItem('userFullName');
      localStorage.removeItem('userRole');
      setAuthState('unauthenticated');
    };

    void verifySession();
    return () => { isMounted = false; };
  }, []);

  if (authState === 'checking') {
    return <div role="status" className="min-h-screen flex items-center justify-center text-slate-500">Checking your session...</div>;
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessRole) {
    return <Navigate to={accountHome} replace />;
  }

  return (
    <div className="flex h-screen bg-transparent text-[var(--color-text)] font-sans overflow-hidden relative selection:bg-purple-500/20 selection:text-purple-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 bg-[var(--glass-surface)] backdrop-blur-2xl border-r border-[var(--color-border)] flex flex-col z-40 transform transition-all duration-300 ease-in-out shadow-[var(--card-shadow)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-72'}`}>
        <div className={'h-16 flex items-center border-b border-[var(--color-border)] justify-between lg:justify-start cursor-pointer select-none ' + (isCollapsed ? 'px-4 justify-center' : 'px-6')} onClick={() => setIsCollapsed(!isCollapsed)}>
          <div className="hidden lg:flex items-center gap-2.5 overflow-hidden">
            <img src={logoIcon} alt="CampAssist Logo" className="w-8 h-8 shrink-0 object-contain hover:scale-105 transition-transform" />
            {!isCollapsed && (
              <span className="font-wordmark font-extrabold text-xl tracking-tight whitespace-nowrap">
                <span className="text-[#19A3E9]">Camp</span><span className="text-[#D946A8]">Assist</span>
              </span>
            )}
          </div>
          <Link to="/" className="flex lg:hidden items-center gap-2.5 overflow-hidden">
            <img src={logoIcon} alt="CampAssist Logo" className="w-8 h-8 shrink-0 object-contain" />
            <span className="font-wordmark font-extrabold text-xl tracking-tight whitespace-nowrap">
              <span className="text-[#19A3E9]">Camp</span><span className="text-[#D946A8]">Assist</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <button className="p-1.5 rounded-lg text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5" onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }}>
              <ChevronLeft size={22} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {role === 'student' && (
            <>
              {!isCollapsed && <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-2 px-4 mt-2">Main Menu</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}`} icon={LayoutDashboard}>Dashboard</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/timetable`} icon={Calendar}>Timetable</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/attendance`} icon={Clock}>Attendance</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/find-room`} icon={MapPin}>Find Room</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/studyos`} icon={FileText}>StudyOS</SidebarLink>
              
              {!isCollapsed && <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-2 px-4 mt-6">Academics</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/submissions`} icon={UploadCloud}>Submissions</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/sgpa-cgpa`} icon={GraduationCap}>SGPA/CGPA</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/exam-schedule`} icon={CalendarDays}>Exam Schedule</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/exam-seat`} icon={MapPin}>Exam Seating</SidebarLink>
              
              {!isCollapsed && <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-2 px-4 mt-6">Campus</div>}

              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/events`} icon={Calendar}>Events</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/college-map`} icon={MapPin}>College Map</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/offers`} icon={Tag}>Student Offers</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/notifications`} icon={Bell}>Notifications</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/requests`} icon={FileText}>Requests</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/polls`} icon={BarChart2}>Polls</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/reminder-center`} icon={Bookmark}>Reminder Center</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/contacts`} icon={Users}>Contacts</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/feedback`} icon={MessageSquare}>Feedback</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/settings`} icon={Settings}>Settings</SidebarLink>
            </>
          )}

          {role === 'cr' && (
            <>
              {!isCollapsed && <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-2 px-4 mt-2">Overview</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}`} icon={LayoutDashboard}>CR Dashboard</SidebarLink>
              
              {!isCollapsed && <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-2 px-4 mt-6">My Board</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/timetable`} icon={Calendar}>Timetable</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/find-room`} icon={MapPin}>Find Room</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/announcements`} icon={Bell}>Announcements</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/cancellations`} icon={MapPin}>Cancellations</SidebarLink>
              
              {!isCollapsed && <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-2 px-4 mt-6">Other</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/reports`} icon={FileText}>Reports</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/polls`} icon={BarChart2}>Polls</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/reminders`} icon={Bookmark}>Reminders</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/submissions`} icon={UploadCloud}>Submissions</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/notifications`} icon={Bell}>Notifications</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/settings`} icon={Users}>Settings</SidebarLink>
            </>
          )}

          {role === 'developer' && (
            <>
              {!isCollapsed && <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-2 px-4 mt-2">Overview</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}`} icon={LayoutDashboard}>Dashboard</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/users`} icon={Users}>Users</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/institutions`} icon={Building2}>Institutions</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/sections`} icon={FileText}>Sections</SidebarLink>
              
              {!isCollapsed && <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-2 px-4 mt-6">Management</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/subjects`} icon={Bookmark}>Subjects</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/timetable`} icon={Calendar}>Timetable</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/rooms`} icon={MapPin}>Rooms & Facilities</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/attendance`} icon={Clock}>Attendance</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/resources`} icon={UploadCloud}>Resources</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/events`} icon={Calendar}>Events</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/offers`} icon={Tag}>Offers</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/map`} icon={MapPin}>Map Moderation</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/feedbacks`} icon={MessageSquare}>Feedbacks</SidebarLink>
              
              {!isCollapsed && <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-2 px-4 mt-6">System</div>}

              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/settings`} icon={Users}>Settings</SidebarLink>
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-[var(--color-border)] space-y-2">
          {isCollapsed && (
            <button onClick={() => setIsCollapsed(false)} className="w-full flex items-center justify-center p-2 rounded-xl text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--color-text)] transition">
              <ChevronRight size={24} />
            </button>
          )}

          {actualRole === 'CR' && (
            <Link to={role === 'student' ? '/cr' : '/student'} className={`flex items-center gap-3 py-2.5 rounded-full transition-all font-medium text-sm ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${role === 'student' ? 'text-[#8758F5] bg-[rgba(135,88,245,0.1)] hover:bg-[rgba(135,88,245,0.18)]' : 'text-[#19A3E9] bg-[rgba(25,163,233,0.1)] hover:bg-[rgba(25,163,233,0.18)]'}`}>
              <ArrowRightLeft size={18} className="shrink-0" />
              {!isCollapsed && <span>{role === 'student' ? 'Switch to CR Mode' : 'Switch to Student Mode'}</span>}
            </Link>
          )}

          <Link to="/" onClick={async (event) => { event.preventDefault(); try { await signOut(auth); } catch {} localStorage.removeItem('userFullName'); localStorage.removeItem('userRole'); trackEvent('logout'); window.location.href = '/'; }} className={`flex items-center gap-3 py-2.5 rounded-full text-[var(--color-muted)] hover:bg-rose-500/10 hover:text-rose-500 transition-all font-medium text-sm ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-16 bg-[var(--glass-surface)] backdrop-blur-xl border-b border-[var(--color-border)] flex items-center justify-between px-3 sm:px-8 sticky top-0 z-20 shadow-xs gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button className="lg:hidden p-2 text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl shrink-0" onClick={() => setIsSidebarOpen(true)}>
              <LayoutDashboard size={20} />
            </button>
            <div className="flex-1 min-w-0 max-w-xs sm:w-80 md:w-96">
              <GlobalSearch role={role} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link to={`/${role}/notifications`} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--glass-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:shadow-xs transition relative" title="Notifications">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D946A8] rounded-full ring-2 ring-white dark:ring-[#1B1733]"></span>
            </Link>
            <Link to={role === 'student' ? '/student/profile' : `/${role}/settings`} className="flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-full sm:pr-3 transition cursor-pointer border border-transparent hover:border-[var(--color-border)]" title="Profile">
              <img src={`https://ui-avatars.com/api/?name=${userName}&background=7140D8&color=fff`} alt="Avatar" className="w-7 h-7 rounded-full shadow-xs shrink-0" />
              <span className="hidden sm:inline text-xs font-semibold text-[var(--color-text)]">{userName.split(" ")[0]}</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};


export default function App() {
  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <AndroidBridgeInitializer />
      <BrandBackdrop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Student Routes */}
        <Route path="/student" element={<MainLayout role="student"><StudentDashboard /></MainLayout>} />
        <Route path="/student/timetable" element={<MainLayout role="student"><StudentTimetable /></MainLayout>} />
        <Route path="/student/attendance" element={<MainLayout role="student"><StudentAttendance /></MainLayout>} />
        <Route path="/student/attendance-planner" element={<MainLayout role="student"><StudentAttendancePlanner /></MainLayout>} />
        <Route path="/student/find-room" element={<MainLayout role="student"><StudentFindRoom /></MainLayout>} />
        <Route path="/student/sgpa-cgpa" element={<MainLayout role="student"><StudentSgpaCgpa /></MainLayout>} />
        <Route path="/student/studyos" element={<MainLayout role="student"><StudentStudyOS /></MainLayout>} />
        <Route path="/student/submissions" element={<MainLayout role="student"><StudentSubmissions /></MainLayout>} />
        <Route path="/student/contacts" element={<MainLayout role="student"><StudentContacts /></MainLayout>} />
        <Route path="/student/notifications" element={<MainLayout role="student"><StudentNotifications /></MainLayout>} />
        <Route path="/student/requests" element={<MainLayout role="student"><StudentRequests /></MainLayout>} />
        <Route path="/student/polls" element={<MainLayout role="student"><StudentPolls /></MainLayout>} />
        <Route path="/student/reminder-center" element={<MainLayout role="student"><StudentReminderCenter /></MainLayout>} />
        <Route path="/student/exam-schedule" element={<MainLayout role="student"><StudentExamSchedule /></MainLayout>} />
        <Route path="/student/exam-seat" element={<MainLayout role="student"><StudentExamSeat /></MainLayout>} />
        <Route path="/student/events" element={<MainLayout role="student"><StudentEvents /></MainLayout>} />
        <Route path="/student/college-map" element={<MainLayout role="student"><StudentCollegeMap /></MainLayout>} />

        <Route path="/student/offers" element={<MainLayout role="student"><StudentOffers /></MainLayout>} />
        <Route path="/student/settings" element={<MainLayout role="student"><StudentSettings /></MainLayout>} />
        
        <Route path="/student/academic-pdfs" element={<MainLayout role="student"><StudentAcademicPdfs /></MainLayout>} />
        <Route path="/student/profile" element={<MainLayout role="student"><StudentProfile /></MainLayout>} />
        <Route path="/student/feedback" element={<MainLayout role="student"><StudentFeedback /></MainLayout>} />

        {/* Student Route Aliases */}
        <Route path="/student/calculator" element={<Navigate to="/student/sgpa-cgpa" replace />} />
        <Route path="/student/exams" element={<Navigate to="/student/exam-schedule" replace />} />
        <Route path="/student/map" element={<Navigate to="/student/college-map" replace />} />
        <Route path="/student/reminders" element={<Navigate to="/student/reminder-center" replace />} />

        <Route path="/student/*" element={<Navigate to="/student" replace />} />
        
                  {/* CR Routes */}
          <Route path="/cr" element={<MainLayout role="cr"><CrDashboard /></MainLayout>} />
          <Route path="/cr/timetable" element={<MainLayout role="cr"><CrTimetable /></MainLayout>} />
          <Route path="/cr/find-room" element={<MainLayout role="cr"><StudentFindRoom /></MainLayout>} />
          <Route path="/cr/announcements" element={<MainLayout role="cr"><CrAnnouncements /></MainLayout>} />
          <Route path="/cr/cancellations" element={<MainLayout role="cr"><CrCancellations /></MainLayout>} />
          <Route path="/cr/reports" element={<MainLayout role="cr"><CrReports /></MainLayout>} />
          <Route path="/cr/polls" element={<MainLayout role="cr"><CrPolls /></MainLayout>} />
          <Route path="/cr/reminders" element={<MainLayout role="cr"><CrReminders /></MainLayout>} />
          <Route path="/cr/submissions" element={<MainLayout role="cr"><CrSubmissions /></MainLayout>} />
          <Route path="/cr/notifications" element={<MainLayout role="cr"><StudentNotifications /></MainLayout>} />
          <Route path="/cr/settings" element={<MainLayout role="cr"><StudentSettings /></MainLayout>} />
          <Route path="/cr/events" element={<MainLayout role="cr"><StudentEvents /></MainLayout>} />
          <Route path="/cr/map" element={<MainLayout role="cr"><StudentCollegeMap /></MainLayout>} />
        
                  {/* Developer Routes */}
          <Route path="/developer" element={<MainLayout role="developer"><DevDashboard /></MainLayout>} />
          <Route path="/developer/users" element={<MainLayout role="developer"><DevUsers /></MainLayout>} />
          <Route path="/developer/institutions" element={<MainLayout role="developer"><DevInstitutions /></MainLayout>} />
          <Route path="/developer/sections" element={<MainLayout role="developer"><DevSections /></MainLayout>} />
          <Route path="/developer/subjects" element={<MainLayout role="developer"><DevSubjects /></MainLayout>} />
          <Route path="/developer/timetable" element={<MainLayout role="developer"><DevTimetable /></MainLayout>} />
          <Route path="/developer/rooms" element={<MainLayout role="developer"><DevRooms /></MainLayout>} />
          <Route path="/developer/attendance" element={<MainLayout role="developer"><DevAttendance /></MainLayout>} />
                    <Route path="/developer/resources" element={<MainLayout role="developer"><DevResources /></MainLayout>} />
                    <Route path="/developer/events" element={<MainLayout role="developer"><DevEvents /></MainLayout>} />
                    <Route path="/developer/offers" element={<MainLayout role="developer"><DevOffers /></MainLayout>} />
                    <Route path="/developer/map" element={<MainLayout role="developer"><DevMap /></MainLayout>} />
                    <Route path="/developer/settings" element={<MainLayout role="developer"><DevSettings /></MainLayout>} />

                    <Route path="/developer/contacts" element={<MainLayout role="developer"><DevContacts /></MainLayout>} />
                    <Route path="/developer/exams" element={<MainLayout role="developer"><DevExams /></MainLayout>} />
                    <Route path="/developer/notifications" element={<MainLayout role="developer"><StudentNotifications /></MainLayout>} />
                    <Route path="/developer/pdfs" element={<MainLayout role="developer"><DevPDFs /></MainLayout>} />
                    <Route path="/developer/students" element={<MainLayout role="developer"><DevStudents /></MainLayout>} />
                    <Route path="/developer/departments" element={<MainLayout role="developer"><DevDepartments /></MainLayout>} />
                    <Route path="/developer/semesters" element={<MainLayout role="developer"><DevSemesters /></MainLayout>} />
                    <Route path="/developer/feedbacks" element={<MainLayout role="developer"><DevFeedbacks /></MainLayout>} />
                  <Route path="/developer/*" element={<Navigate to="/developer" replace />} />
        
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}











