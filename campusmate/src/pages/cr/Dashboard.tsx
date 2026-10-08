import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, Calendar, Bell, Megaphone, MapPin, XCircle, Clock, BarChart2, Bookmark, Send, UploadCloud, CheckCircle2, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { academicTermService } from '../../services/academicTermService';

export const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userProfile, currentTerm] = await Promise.all([apiClient('/users/me'), academicTermService.getCurrent()]);
        setProfile(userProfile);

        if (userProfile.crAssignment?.sectionId) {
          const tt = await apiClient(`/timetable/section/${userProfile.crAssignment.sectionId}/term/${currentTerm.id}`);
          const todayInt = new Date().getDay();
          setTimetable(tt.filter((t: any) => t.dayOfWeek === todayInt));
        }

        const notifs = await apiClient('/notifications');
        setAnnouncements(notifs.slice(0, 3));

        const p = await apiClient('/polls');
        setPolls(p.filter((poll: any) => poll.status === 'ACTIVE').slice(0, 2));

        const subs = await apiClient('/submissions/mine');
        setSubmissions(subs.slice(0, 3));

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-purple-600 w-10 h-10" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Header section */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            CR Dashboard, {(profile?.profile?.fullName || '').split(' ')[0] || 'CR'}
          </h1>
          <p className="text-slate-500 mt-1">Class representative command center.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <Calendar size={18} className="text-slate-400" />
          <span className="font-semibold text-slate-700">{new Date().toDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Class Size</p>
                <h3 className="text-xl font-bold text-slate-900">42</h3>
              </div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Requests</p>
                <h3 className="text-xl font-bold text-slate-900">3</h3>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Today's Classes</p>
                <h3 className="text-xl font-bold text-slate-900">{timetable.length}</h3>
              </div>
            </div>
          </div>

          {/* Today's Timetable */}
          <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Today's Timetable</h3>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Edit Schedule</button>
            </div>
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

          {/* Submission Tracker */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Submission Tracker</h3>
              <button className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-1">
                <Plus size={14} /> Add Deadline
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {submissions.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No submissions found</div>
              ) : submissions.map((sub, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{sub.subject?.name || 'Task'}</p>
                    <p className="text-xs text-slate-500 mt-1">Due: {new Date(sub.deadline).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${sub.status === 'SUBMITTED_DIGITALLY' || sub.status === 'SUBMITTED_PHYSICALLY' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/cr/announcements" className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 transition group">
                <span className="font-semibold text-sm">Post Announcement</span>
                <Megaphone size={18} className="group-hover:scale-110 transition-transform" />
              </Link>
              <Link to="/cr/cancellations" className="w-full flex items-center justify-between p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 transition group">
                <span className="font-semibold text-sm">Report Cancellation</span>
                <XCircle size={18} className="group-hover:scale-110 transition-transform" />
              </Link>
              <Link to="/cr/polls" className="w-full flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 hover:bg-purple-100 transition group">
                <span className="font-semibold text-sm">Create Poll</span>
                <BarChart2 size={18} className="group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900">Recent Announcements</h3>
              <Link to="/cr/announcements" className="text-xs font-semibold text-blue-600">+ New</Link>
            </div>
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="text-sm text-slate-500">No recent announcements</div>
              ) : announcements.map((a, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.type === 'CANCELLATION' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>{a.type}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Polls */}
          <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Active Polls</h3>
            <div className="space-y-3">
              {polls.length === 0 ? (
                <div className="text-sm text-slate-500">No active polls</div>
              ) : polls.map((p, i) => {
                const totalVotes = p.options?.reduce((acc: number, opt: any) => acc + (opt._count?.votes || 0), 0) || 0;
                return (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold text-slate-600">{totalVotes} Votes</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
