import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Bell, FileText, ChevronRight, GraduationCap, User, PlayCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { academicTermService } from '../../services/academicTermService';

export const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userProfile, currentTerm] = await Promise.all([apiClient('/users/me'), academicTermService.getCurrent()]);
        setProfile(userProfile);

        if (userProfile.student?.sectionId) {
          const tt = await apiClient(`/timetable/section/${userProfile.student.sectionId}/term/${currentTerm.id}`);
          // Filter for today only
          const todayInt = new Date().getDay(); // 1=Mon, 5=Fri
          setTimetable(tt.filter((t: any) => t.dayOfWeek === todayInt));
        }

        const att = await apiClient('/attendance/my-attendance');
        setAttendanceStats(att);

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
  }

  const overallPercentage = attendanceStats?.overallPercentage || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Good Morning, {(profile?.profile?.fullName || '').split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-slate-500 mt-1">Make today productive!</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <Calendar size={18} className="text-slate-400" />
          <span className="font-semibold text-slate-700">{new Date().toDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats / Next Class */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Next Class */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 col-span-1 md:col-span-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 mt-1">
                <PlayCircle size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Next Class</p>
                {timetable.length > 0 ? (
                  <>
                    <h3 className="font-bold text-slate-900 leading-tight">{timetable[0].subject?.name || 'Class'}</h3>
                    <p className="text-sm font-medium text-blue-600 mt-1">{timetable[0].startTime}</p>
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-2">
                      <MapPin size={12} /> {timetable[0].room?.roomNumber || 'TBA'}
                    </div>
                  </>
                ) : (
                  <h3 className="font-bold text-slate-900 leading-tight mt-2">No Classes Left</h3>
                )}
              </div>
            </div>

            {/* Attendance Ring */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-5 justify-center col-span-1 md:col-span-1">
              <div className="relative flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="175" strokeDashoffset={175 - (175 * overallPercentage) / 100} className="text-emerald-500" />
                </svg>
                <span className="absolute font-bold text-slate-900">{Math.round(overallPercentage)}%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Attendance</p>
                <p className="text-xs text-slate-400 mt-1">Overall</p>
              </div>
            </div>

            {/* Minor Stats */}
            <div className="flex flex-col gap-4">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Today's Classes</p>
                  <p className="font-bold text-xl text-slate-900 mt-1">{timetable.length}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><Calendar size={14}/></div>
              </div>
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Pending Requests</p>
                  <p className="font-bold text-xl text-slate-900 mt-1">0</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><AlertCircle size={14}/></div>
              </div>
            </div>
          </div>

          {/* Today's Timetable */}
          <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Today's Timetable</h3>
            </div>
            
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <th className="font-medium p-4">Time</th>
                    <th className="font-medium p-4">Subject</th>
                    <th className="font-medium p-4">Class/Room</th>
                    <th className="font-medium p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timetable.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-500 font-medium">No classes scheduled for today.</td></tr>
                  ) : timetable.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-600 font-medium">{row.startTime} - {row.endTime}</td>
                      <td className="p-4 font-bold text-slate-900">{row.subject?.name}</td>
                      <td className="p-4 text-slate-600">{row.room?.roomNumber || 'TBA'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.status === 'CANCELLED' ? 'text-rose-600 bg-rose-50' : 'text-slate-600 bg-slate-100'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          
          {/* Quick Tools */}
          <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Quick Tools</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/student/attendance-planner" className="bg-slate-50 hover:bg-slate-100 p-4 rounded-xl border border-slate-100 transition flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500">
                  <BarChart3Icon size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700">Attendance Planner</span>
              </Link>
              <Link to="/student/find-room" className="bg-slate-50 hover:bg-slate-100 p-4 rounded-xl border border-slate-100 transition flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-purple-500">
                  <MapPin size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700">Find Room</span>
              </Link>
              <Link to="/student/sgpa-cgpa" className="bg-slate-50 hover:bg-slate-100 p-4 rounded-xl border border-slate-100 transition flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-pink-500">
                  <GraduationCap size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700">SGPA/CGPA</span>
              </Link>
              <Link to="/student/studyos" className="bg-slate-50 hover:bg-slate-100 p-4 rounded-xl border border-slate-100 transition flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-orange-500">
                  <FileText size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700">StudyOS</span>
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

// Simple internal icon to prevent imports failure for bar chart
function BarChart3Icon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
