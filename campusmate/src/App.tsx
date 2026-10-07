import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Settings, ArrowRightLeft, Menu, ChevronLeft, ChevronRight, LayoutDashboard, Calendar, Clock, MapPin, GraduationCap, FileText, UploadCloud, Building2, Users, Bell, Search, LogOut, BarChart2, CalendarDays, Bookmark, Tag } from 'lucide-react';

// Public
import { Landing } from './pages/public/Landing';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';

// Student Pages
import { Dashboard as StudentDashboard } from './pages/student/Dashboard';
import { Timetable as StudentTimetable } from './pages/student/Timetable';
import { Attendance as StudentAttendance } from './pages/student/Attendance';
import { AttendancePlanner as StudentAttendancePlanner } from './pages/student/AttendancePlanner';
import { SgpaCgpa as StudentSgpaCgpa } from './pages/student/SgpaCgpa';
import { FindRoom as StudentFindRoom } from './pages/student/FindRoom';
import { StudyOS as StudentStudyOS } from './pages/student/StudyOS';
import { Submissions as StudentSubmissions } from './pages/student/Submissions';
import { Contacts as StudentContacts } from './pages/student/Contacts';
import { Notifications as StudentNotifications } from './pages/student/Notifications';
import { Requests as StudentRequests } from './pages/student/Requests';
import { Polls as StudentPolls } from './pages/student/Polls';
import { ReminderCenter as StudentReminderCenter } from './pages/student/ReminderCenter';
import { ExamSchedule as StudentExamSchedule } from './pages/student/ExamSchedule';
import { ExamSeat as StudentExamSeat } from './pages/student/ExamSeat';
import { Events as StudentEvents } from './pages/student/Events';

import { Offers as StudentOffers } from './pages/student/Offers';
import { Settings as StudentSettings } from './pages/student/Settings';

// CR Pages
import { Dashboard as CrDashboard } from './pages/cr/Dashboard';
import { Timetable as CrTimetable } from './pages/cr/Timetable';
import { Attendance as CrAttendance } from './pages/cr/Attendance';
import { Announcements as CrAnnouncements } from './pages/cr/Announcements';
import { Cancellations as CrCancellations } from './pages/cr/Cancellations';
import { Reports as CrReports } from './pages/cr/Reports';
import { Polls as CrPolls } from './pages/cr/Polls';
import { Reminders as CrReminders } from './pages/cr/Reminders';
import { Submissions as CrSubmissions } from './pages/cr/Submissions';

// Developer Pages
import { Dashboard as DevDashboard } from './pages/developer/Dashboard';
import { Users as DevUsers } from './pages/developer/Users';
import { DeveloperInstitutions as DevInstitutions } from './pages/developer/Institutions';
import { Sections as DevSections } from './pages/developer/Sections';
import { Subjects as DevSubjects } from './pages/developer/Subjects';
import { Timetable as DevTimetable } from './pages/developer/Timetable';
import { Rooms as DevRooms } from './pages/developer/Rooms';
import { Attendance as DevAttendance } from './pages/developer/Attendance';
import { Resources as DevResources } from './pages/developer/Resources';
import { Audit as DevAudit } from './pages/developer/Audit';
import logoIcon from './assets/logo-icon.png';

const SidebarLink = ({ to, icon: Icon, children, isCollapsed = false }: { to: string, icon: any, children: React.ReactNode, isCollapsed?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (!['/student', '/cr', '/developer'].includes(to) && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 py-2.5 rounded-xl transition font-medium text-sm ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${isActive ? 'bg-gradient-primary text-white font-semibold shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      
    >
      <Icon size={18} className={isActive ? 'text-white shrink-0' : 'text-slate-400 shrink-0'} />
      {!isCollapsed && <span className="whitespace-nowrap">{children}</span>}
    </Link>
  );
};

const MainLayout = ({ children, role = 'student' }: { children: React.ReactNode, role?: string }) => {
  const userName = localStorage.getItem('userFullName') || 'Student';
  const actualRole = localStorage.getItem('userRole') || 'STUDENT';
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 bg-white border-r border-slate-200 flex flex-col z-30 transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-72'}`}>
        <div className={'h-16 flex items-center border-b border-slate-100 justify-between lg:justify-start cursor-pointer select-none ' + (isCollapsed ? 'px-4 justify-center' : 'px-6')} onClick={() => setIsCollapsed(!isCollapsed)}>
          <div className="hidden lg:flex items-center gap-2 overflow-hidden">
            <img src={logoIcon} alt="CampusMate Logo" className="w-8 h-8 shrink-0 object-contain hover:scale-105 transition-transform" />
            {!isCollapsed && <span className="font-extrabold text-xl tracking-tight text-[#0a1128] whitespace-nowrap hover:text-blue-600 transition-colors">CampusMate</span>}
          </div>
          <Link to="/" className="flex lg:hidden items-center gap-2 overflow-hidden">
            <img src={logoIcon} alt="CampusMate Logo" className="w-8 h-8 shrink-0 object-contain" />
            <span className="font-extrabold text-xl tracking-tight text-[#0a1128] whitespace-nowrap">CampusMate</span>
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <button className="p-1 text-slate-500" onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }}>
              <ChevronLeft size={24} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {role === 'student' && (
            <>
              {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-2">Main Menu</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}`} icon={LayoutDashboard}>Dashboard</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/timetable`} icon={Calendar}>Timetable</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/attendance`} icon={Clock}>Attendance</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/find-room`} icon={MapPin}>Find Room</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/studyos`} icon={FileText}>StudyOS</SidebarLink>
              
              {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6">Academics</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/submissions`} icon={UploadCloud}>Submissions</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/sgpa-cgpa`} icon={GraduationCap}>SGPA/CGPA</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/exam-schedule`} icon={CalendarDays}>Exam Schedule</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/exam-seat`} icon={MapPin}>Exam Seating</SidebarLink>
              
              {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6">Campus</div>}

              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/events`} icon={Calendar}>Events</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/offers`} icon={Tag}>Student Offers</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/notifications`} icon={Bell}>Notifications</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/requests`} icon={FileText}>Requests</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/polls`} icon={BarChart2}>Polls</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/reminder-center`} icon={Bookmark}>Reminder Center</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/contacts`} icon={Users}>Contacts</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/settings`} icon={Settings}>Settings</SidebarLink>
            </>
          )}

          {role === 'cr' && (
            <>
              {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-2">Overview</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}`} icon={LayoutDashboard}>CR Dashboard</SidebarLink>
              
              {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6">My Board</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/timetable`} icon={Calendar}>Timetable</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/announcements`} icon={Bell}>Announcements</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/cancellations`} icon={MapPin}>Cancellations</SidebarLink>
              
              {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6">Other</div>}
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
              {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-2">Overview</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}`} icon={LayoutDashboard}>Dashboard</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/users`} icon={Users}>Users</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/institutions`} icon={Building2}>Institutions</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/sections`} icon={FileText}>Sections</SidebarLink>
              
              {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6">Management</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/subjects`} icon={Bookmark}>Subjects</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/timetable`} icon={Calendar}>Timetable</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/rooms`} icon={MapPin}>Rooms & Facilities</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/resources`} icon={UploadCloud}>Resources</SidebarLink>
              
              {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6">System</div>}
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/audit`} icon={FileText}>Audit Logs</SidebarLink>
              <SidebarLink isCollapsed={isCollapsed} to={`/${role}/settings`} icon={Users}>Settings</SidebarLink>
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 space-y-2">
          {isCollapsed && (
            <button onClick={() => setIsCollapsed(false)} className="w-full flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition">
              <ChevronRight size={24} />
            </button>
          )}

          {actualRole === 'CR' && (
            <Link to={role === 'student' ? '/cr' : '/student'} className={`flex items-center gap-3 py-3 rounded-xl transition font-medium ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${role === 'student' ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>
              <ArrowRightLeft size={20} className="shrink-0" />
              {!isCollapsed && <span>{role === 'student' ? 'Switch to CR Mode' : 'Switch to Student Mode'}</span>}
            </Link>
          )}

          <Link to="/" className={`flex items-center gap-3 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-red-600 transition font-medium ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <LayoutDashboard size={20} />
            </button>
            <div className="hidden sm:flex items-center bg-slate-100 rounded-full px-4 py-2 w-96 border border-slate-200 focus-within:border-blue-300 focus-within:bg-white/60 backdrop-blur-xl transition">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Search for rooms, notes, people..." className="bg-transparent border-none outline-none ml-2 text-sm w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <Link to={`/${role}/settings`} className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-full pr-4 transition cursor-pointer">
              <img src={`https://ui-avatars.com/api/?name=${userName}&background=3B82F6&color=fff`} alt="Avatar" className="w-8 h-8 rounded-full" />
              <span className="text-sm font-semibold">{userName.split(" ")[0]}</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};


export default function App() {
  return (
    <BrowserRouter>
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

        <Route path="/student/offers" element={<MainLayout role="student"><StudentOffers /></MainLayout>} />
        <Route path="/student/settings" element={<MainLayout role="student"><StudentSettings /></MainLayout>} />
        
        {/* Fallback mock routes for scaffolding */}
        <Route path="/student/*" element={<MainLayout role="student"><div className="p-6">Page under construction (Scaffolded)</div></MainLayout>} />
        
                  {/* CR Routes */}
          <Route path="/cr" element={<MainLayout role="cr"><CrDashboard /></MainLayout>} />
          <Route path="/cr/timetable" element={<MainLayout role="cr"><CrTimetable /></MainLayout>} />
          <Route path="/cr/attendance" element={<MainLayout role="cr"><CrAttendance /></MainLayout>} />
          <Route path="/cr/announcements" element={<MainLayout role="cr"><CrAnnouncements /></MainLayout>} />
          <Route path="/cr/cancellations" element={<MainLayout role="cr"><CrCancellations /></MainLayout>} />
          <Route path="/cr/reports" element={<MainLayout role="cr"><CrReports /></MainLayout>} />
          <Route path="/cr/polls" element={<MainLayout role="cr"><CrPolls /></MainLayout>} />
          <Route path="/cr/reminders" element={<MainLayout role="cr"><CrReminders /></MainLayout>} />
          <Route path="/cr/submissions" element={<MainLayout role="cr"><CrSubmissions /></MainLayout>} />
          <Route path="/cr/notifications" element={<MainLayout role="cr"><StudentNotifications /></MainLayout>} />
          <Route path="/cr/settings" element={<MainLayout role="cr"><StudentSettings /></MainLayout>} />
        
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
          <Route path="/developer/audit" element={<MainLayout role="developer"><DevAudit /></MainLayout>} />
          <Route path="/developer/settings" element={<MainLayout role="developer"><StudentSettings /></MainLayout>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}






