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
        const [userProfile, currentTerm, notifs, p, subs] = await Promise.all([
          apiClient('/users/me'),
          academicTermService.getCurrent(),
          apiClient('/notifications').catch(() => []),
          apiClient('/polls').catch(() => []),
          apiClient('/submissions/mine').catch(() => []),
        ]);
        setProfile(userProfile);
        setAnnouncements(Array.isArray(notifs) ? notifs.slice(0, 3) : []);
        setPolls(Array.isArray(p) ? p.filter((poll: any) => poll.status === 'ACTIVE').slice(0, 2) : []);
        setSubmissions(Array.isArray(subs) ? subs.slice(0, 3) : []);

        if (userProfile?.crAssignment?.sectionId && currentTerm?.id) {
          const tt = await apiClient(`/timetable/section/${userProfile.crAssignment.sectionId}/term/${currentTerm.id}`).catch(() => []);
          const todayInt = new Date().getDay();
          setTimetable(Array.isArray(tt) ? tt.filter((t: any) => t.dayOfWeek === todayInt) : []);
        }
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
      <div className="flex justify-between items-center bg-[var(--glass-surface)] backdrop-blur-xl p-6 rounded-2xl shadow-[var(--card-shadow)] border border-[var(--color-border)] mb-6 text-[var(--color-text)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
            CR Dashboard, {(profile?.profile?.fullName || '').split(' ')[0] || 'CR'}
          </h1>
          <p className="text-[var(--color-muted)] mt-1">Class representative command center.</p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--glass-sub-surface)] px-4 py-2 rounded-xl border border-[var(--color-border)] shadow-xs">
          <Calendar size={18} className="text-[#19A3E9]" />
          <span className="font-semibold text-xs sm:text-sm text-[var(--color-text)]">{new Date().toDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--card-shadow)] flex items-center gap-4 hover:-translate-y-0.5 transition-all text-[var(--color-text)]">
              <div className="w-12 h-12 rounded-full bg-[#19A3E9]/15 text-[#19A3E9] border border-[#19A3E9]/25 flex items-center justify-center shrink-0 shadow-xs">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-muted)] mb-1">Class Size</p>
                <h3 className="text-2xl font-extrabold text-[#19A3E9]">42</h3>
              </div>
            </div>
            
            <div className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--card-shadow)] flex items-center gap-4 hover:-translate-y-0.5 transition-all text-[var(--color-text)]">
              <div className="w-12 h-12 rounded-full bg-[#8758F5]/15 text-[#8758F5] border border-[#8758F5]/25 flex items-center justify-center shrink-0 shadow-xs">
                <BarChart2 size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-muted)] mb-1">Active Polls</p>
                <h3 className="text-2xl font-extrabold text-[#8758F5]">{polls.length}</h3>
              </div>
            </div>

            <div className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--card-shadow)] flex items-center gap-4 hover:-translate-y-0.5 transition-all text-[var(--color-text)]">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-muted)] mb-1">Today's Classes</p>
                <h3 className="text-2xl font-extrabold text-emerald-500">{timetable.length}</h3>
              </div>
            </div>
          </div>

          {/* Today's Timetable */}
          <div className="bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--color-border)] rounded-2xl shadow-[var(--card-shadow)] overflow-hidden text-[var(--color-text)]">
            <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--color-text)]">Today's Timetable</h3>
              <button className="text-xs font-semibold text-[#19A3E9] hover:underline">Edit Schedule</button>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--glass-sub-surface)] text-[var(--color-muted)] border-b border-[var(--color-border)]">
                  <th className="font-semibold p-4 text-xs uppercase tracking-wider">Time</th>
                  <th className="font-semibold p-4 text-xs uppercase tracking-wider">Subject</th>
                  <th className="font-semibold p-4 text-xs uppercase tracking-wider">Class/Room</th>
                  <th className="font-semibold p-4 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {timetable.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-[var(--color-muted)] font-medium">No classes scheduled for today.</td></tr>
                ) : timetable.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-[var(--color-muted)] font-medium">{row.startTime} - {row.endTime}</td>
                    <td className="p-4 font-bold text-[var(--color-text)]">{row.subject?.name}</td>
                    <td className="p-4 text-[var(--color-muted)]">{row.room?.roomNumber || 'TBA'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${row.status === 'CANCELLED' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submission Tracker */}
          <div className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] shadow-[var(--card-shadow)] overflow-hidden text-[var(--color-text)]">
            <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--color-text)]">Submission Tracker</h3>
              <button className="text-xs font-semibold text-white bg-gradient-brand px-3 py-1.5 rounded-lg hover:opacity-95 transition flex items-center gap-1 shadow-xs">
                <Plus size={14} /> Add Deadline
              </button>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {submissions.length === 0 ? (
                <div className="p-6 text-center text-[var(--color-muted)]">No submissions found</div>
              ) : submissions.map((sub, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <p className="font-bold text-[var(--color-text)] text-sm">{sub.subject?.name || 'Task'}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-1">Due: {new Date(sub.deadline).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${sub.status === 'SUBMITTED_DIGITALLY' || sub.status === 'SUBMITTED_PHYSICALLY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
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
          <div className="bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--card-shadow)] text-[var(--color-text)]">
            <h3 className="font-bold text-[var(--color-text)] mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/cr/announcements" className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--glass-sub-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-white/10 transition group backdrop-blur-md shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#19A3E9]/15 text-[#19A3E9] flex items-center justify-center border border-[#19A3E9]/25">
                    <Megaphone size={16} />
                  </div>
                  <span className="font-semibold text-sm">Post Announcement</span>
                </div>
              </Link>
              <Link to="/cr/cancellations" className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--glass-sub-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-white/10 transition group backdrop-blur-md shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/25">
                    <XCircle size={16} />
                  </div>
                  <span className="font-semibold text-sm">Report Cancellation</span>
                </div>
              </Link>
              <Link to="/cr/find-room" className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--glass-sub-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-white/10 transition group backdrop-blur-md shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                    <MapPin size={16} />
                  </div>
                  <span className="font-semibold text-sm">Room Availability & Status</span>
                </div>
              </Link>
              <Link to="/cr/polls" className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--glass-sub-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-white/10 transition group backdrop-blur-md shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#8758F5]/15 text-[#8758F5] flex items-center justify-center border border-[#8758F5]/25">
                    <BarChart2 size={16} />
                  </div>
                  <span className="font-semibold text-sm">Create Poll</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--card-shadow)] text-[var(--color-text)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[var(--color-text)]">Recent Announcements</h3>
              <Link to="/cr/announcements" className="text-xs font-semibold text-[#19A3E9] hover:underline">+ New</Link>
            </div>
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="text-sm text-[var(--color-muted)]">No recent announcements</div>
              ) : announcements.map((a, i) => (
                <div key={i} className="p-3 bg-[var(--glass-sub-surface)] rounded-xl border border-[var(--color-border)]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{a.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${a.type === 'CANCELLATION' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{a.type}</span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Polls */}
          <div className="bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--card-shadow)] text-[var(--color-text)]">
            <h3 className="font-bold text-[var(--color-text)] mb-4">Active Polls</h3>
            <div className="space-y-3">
              {polls.length === 0 ? (
                <div className="text-sm text-[var(--color-muted)]">No active polls</div>
              ) : polls.map((p, i) => {
                const totalVotes = p.options?.reduce((acc: number, opt: any) => acc + (opt._count?.votes || 0), 0) || 0;
                return (
                  <div key={i} className="p-3 bg-[var(--glass-sub-surface)] rounded-xl border border-[var(--color-border)]">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{p.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold text-[#8758F5]">{totalVotes} Votes</span>
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
