import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Airplay, CheckCircle2, XCircle, Search, Loader2, RotateCcw, AlertCircle, ShieldCheck } from 'lucide-react';
import { roomService } from '../../services/roomService';
import type { RoomStatus } from '../../services/roomService';
import { authService } from '../../services/authService';

export const FindRoom = () => {
  const location = useLocation();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userRole, setUserRole] = useState<string>(() => (localStorage.getItem('userRole') || '').toUpperCase());

  useEffect(() => {
    authService.me().then(profile => {
      if (profile?.role) {
        const liveRole = profile.role.toUpperCase();
        setUserRole(liveRole);
        localStorage.setItem('userRole', profile.role);
      }
    }).catch(() => {});
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await roomService.list();
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load rooms", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Determine view context and permissions:
  // Strict requirement: "report in use" is removed from the student side!
  const isStudentView = location.pathname.startsWith('/student');
  const isAuthorizedCRorDev = userRole === 'CR' || userRole === 'DEVELOPER';
  const canManageRooms = isAuthorizedCRorDev && !isStudentView;

  const handleReportInUse = async (roomId: string) => {
    setReportingId(roomId);
    setFeedback(null);
    try {
      await roomService.reportStatus(roomId, 'OCCUPIED_BY_TIMETABLE' as RoomStatus, 'Reported in use by CR');
      await fetchRooms();
      setFeedback({ type: 'success', message: 'Room reported as in use.' });
    } catch (error) {
      console.error('Failed to report room status', error);
      setFeedback({ type: 'error', message: 'Failed to report room status. Please try again.' });
    } finally {
      setReportingId(null);
    }
  };

  const handleRevokeReport = async (roomId: string) => {
    setReportingId(roomId);
    setFeedback(null);
    try {
      await roomService.revokeStatus(roomId);
      await fetchRooms();
      setFeedback({ type: 'success', message: 'Report revoked. Room marked as free.' });
    } catch (error) {
      console.error('Failed to revoke room status', error);
      setFeedback({ type: 'error', message: 'Failed to revoke room report. Please try again.' });
    } finally {
      setReportingId(null);
    }
  };

  const filteredRooms = (Array.isArray(rooms) ? rooms : []).filter(r => {
    if (!r) return false;
    const roomNo = String(r.roomNumber || r.name || r.id || '').toLowerCase();
    const bld = String(r.building || r.block || '').toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return roomNo.includes(q) || bld.includes(q);
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--glass-surface)] backdrop-blur-xl p-6 rounded-2xl shadow-[var(--card-shadow)] border border-[var(--color-border)] text-[var(--color-text)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            {canManageRooms ? 'Room Status & Availability' : 'Find a Room'}
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {canManageRooms 
              ? 'Check live classroom vacancy and manage occupancy status as CR.'
              : 'Check real-time classroom and laboratory availability across campus.'}
          </p>
        </div>
        {canManageRooms && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8758F5]/10 text-[#8758F5] text-xs font-semibold rounded-xl border border-[#8758F5]/20 self-start sm:self-auto">
            <ShieldCheck size={14} />
            CR Controls Enabled
          </span>
        )}
      </div>

      {/* Helpful banner for CR/Dev viewing the student side */}
      {isAuthorizedCRorDev && isStudentView && (
        <div className="bg-[#8758F5]/10 border border-[#8758F5]/20 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs text-[var(--color-text)] shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#8758F5] shrink-0" />
            <span>You are viewing the student room finder (read-only). To report or revoke occupancy, use CR Room Management.</span>
          </div>
          <Link 
            to="/cr/find-room" 
            className="px-3 py-1.5 bg-[#8758F5] hover:bg-[#7140D8] text-white font-semibold rounded-lg transition shrink-0 shadow-xs"
          >
            Go to CR Find Room &rarr;
          </Link>
        </div>
      )}

      {/* Action feedback toast */}
      {feedback && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-rose-400" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold underline opacity-80 hover:opacity-100">Dismiss</button>
        </div>
      )}

      <div className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] shadow-[var(--card-shadow)] p-6 text-[var(--color-text)]">
        {/* Search Form */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-[var(--color-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Search by room number or building..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/5 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-[#19A3E9] text-[var(--color-text)] font-medium" 
            />
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          <h3 className="font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
            Current Status
          </h3>
          
          {loading ? (
             <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#19A3E9] w-8 h-8" /></div>
          ) : filteredRooms.length === 0 ? (
             <div className="text-center text-[var(--color-muted)] py-10">No rooms found.</div>
          ) : (
            filteredRooms.map((room, i) => {
              const isFree = room.status === 'FREE_BY_TIMETABLE' || room.status === 'REPORTED_FREE';
              return (
                <div key={i} className={`p-4 rounded-xl border ${isFree ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'} flex items-start justify-between`}>
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isFree ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {isFree ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[var(--color-text)] text-lg">{room.roomNumber}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${room.isLab ? 'bg-[#8758F5]/15 text-[#8758F5]' : 'bg-black/10 dark:bg-white/10 text-[var(--color-muted)]'}`}>
                          {room.isLab ? 'Lab' : 'Classroom'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[var(--color-muted)] mt-1">{room.building || 'Main Block'}</p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
                          <Users size={14} className="opacity-70" />
                          Capacity: {room.capacity}
                        </div>
                        {room.hasProjector && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
                            <Airplay size={14} className="opacity-70" />
                            Projector
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${isFree ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {String(room.status || 'UNKNOWN').replace(/_/g, ' ')}
                    </span>
                    
                    {room.notes && (
                      <p className="text-[11px] text-[var(--color-muted)] font-medium max-w-[200px] text-right truncate" title={room.notes}>
                        {room.notes}
                      </p>
                    )}

                    {/* Reporting controls strictly for authorized CR / Developer on CR side */}
                    {canManageRooms && (
                      <div className="mt-2">
                        {isFree ? (
                          <button 
                            onClick={() => handleReportInUse(room.id)} 
                            disabled={reportingId === room.id} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition disabled:opacity-60 shadow-xs cursor-pointer"
                            title="Report this room as occupied"
                          >
                            {reportingId === room.id ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Reporting...</span>
                              </>
                            ) : (
                              <span>Report in use</span>
                            )}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRevokeReport(room.id)} 
                            disabled={reportingId === room.id} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition disabled:opacity-60 shadow-xs cursor-pointer"
                            title="Undo report and mark room as free"
                          >
                            {reportingId === room.id ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Revoking...</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw size={13} />
                                <span>Revoke (Mark Free)</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
