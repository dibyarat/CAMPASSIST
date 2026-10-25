import React from 'react';
import { MapPin, BarChart2, Bell, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const DashboardPreview: React.FC = () => {
  // TODO: Swap in real user timetable and attendance data when integrating live authenticated preview
  const timetableSample = [
    {
      time: '09:00',
      subject: 'Data Structures',
      room: 'Room 204',
      status: 'On time',
      chipBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
    },
    {
      time: '11:00',
      subject: 'Operating Systems',
      room: 'Moved to Lab 3',
      status: 'Room changed',
      chipBg: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
    },
    {
      time: '14:00',
      subject: 'Database Lab',
      room: 'Lab 1',
      status: 'Cancelled',
      chipBg: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
    },
  ];

  return (
    <div className="relative w-full max-w-[960px] mx-auto mt-14 sm:mt-16 text-left">
      {/* Floating Card 1: Top Left (Free room found) - hidden < 1100px */}
      <div
        className="hidden min-[1100px]:flex items-center gap-3.5 absolute -top-8 -left-12 z-20 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-white shadow-[0_12px_30px_rgba(26,134,224,0.18)] transition-transform hover:scale-105"
        style={{ transform: 'rotate(-4deg)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-[#1A86E0] flex items-center justify-center shrink-0">
          <MapPin size={20} />
        </div>
        <div>
          <div className="text-[13px] font-bold text-[#0B1020]">Free room found</div>
          <div className="text-[12px] text-[#334155] font-medium">Room 118 · open now</div>
        </div>
      </div>

      {/* Floating Card 2: Bottom Left (SGPA calculator) - hidden < 1100px */}
      <div
        className="hidden min-[1100px]:flex items-center gap-3.5 absolute -bottom-6 -left-10 z-20 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-white shadow-[0_12px_30px_rgba(122,95,208,0.18)] transition-transform hover:scale-105"
        style={{ transform: 'rotate(3deg)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-[#7A5FD0] flex items-center justify-center shrink-0">
          <BarChart2 size={20} />
        </div>
        <div>
          <div className="text-[13px] font-bold text-[#0B1020]">SGPA calculator</div>
          <div className="text-[12px] text-[#334155] font-medium">Sample · 8.7</div>
        </div>
      </div>

      {/* Floating Card 3: Top Right (Submission due) - hidden < 1100px */}
      <div
        className="hidden min-[1100px]:flex items-center gap-3.5 absolute -top-6 -right-10 z-20 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-white shadow-[0_12px_30px_rgba(210,58,160,0.18)] transition-transform hover:scale-105"
        style={{ transform: 'rotate(5deg)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-pink-100/80 text-[#D23AA0] flex items-center justify-center shrink-0">
          <Bell size={20} />
        </div>
        <div>
          <div className="text-[13px] font-bold text-[#0B1020]">Submission due</div>
          <div className="text-[12px] text-[#334155] font-medium">Tomorrow, 11:59 PM</div>
        </div>
      </div>

      {/* Main Frosted Card */}
      <div className="relative bg-white/75 backdrop-blur-xl rounded-[30px] border border-white p-6 sm:p-9 shadow-[0_24px_60px_-15px_rgba(26,134,224,0.16),0_12px_30px_-10px_rgba(210,58,160,0.12)]">
        {/* Top Header Row with Greeting & Dashboard preview Tag */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100/90 mb-6">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-[#1A86E0]">Overview</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1020] mt-0.5">Good morning</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/90 text-[#334155] border border-slate-200/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Dashboard preview
          </span>
        </div>

        {/* Content 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* Left Column: Today's timetable */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-[#0B1020]">Today&apos;s timetable</h4>
                <span className="text-xs font-medium text-[#334155]">3 classes scheduled</span>
              </div>

              <div className="space-y-3">
                {timetableSample.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 sm:p-4 rounded-2xl bg-white/70 border border-slate-100/90 shadow-2xs hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#1A86E0] font-mono px-2.5 py-1 bg-blue-50/70 rounded-lg shrink-0">
                        {item.time}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-[#0B1020]">{item.subject}</div>
                        <div className="text-xs text-[#334155] font-medium">{item.room}</div>
                      </div>
                    </div>
                    {/* Status Chip carrying both text and color label */}
                    <span
                      className={`inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-full border ${item.chipBg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`}></span>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Attendance Ring & Reminders Card */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Attendance Ring Box */}
            <div className="bg-white/70 border border-slate-100/90 rounded-2xl p-5 shadow-2xs flex items-center gap-5">
              {/* Circular SVG Gauge for 82% */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
                  <defs>
                    <linearGradient id="attRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1A86E0" />
                      <stop offset="100%" stopColor="#D23AA0" />
                    </linearGradient>
                  </defs>
                  {/* Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="7"
                  />
                  {/* Progress (82% of 2 * PI * 32 ~= 201.06) -> dashoffset ~= 36.2 */}
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke="url(#attRingGrad)"
                    strokeWidth="7"
                    strokeDasharray={201.06}
                    strokeDashoffset={201.06 * (1 - 0.82)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-extrabold text-[#0B1020]">82%</span>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-[#334155]">Attendance</div>
                <div className="text-sm font-extrabold text-[#0B1020] mt-0.5">Above your target</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Target: 75%
                </div>
              </div>
            </div>

            {/* Reminders Card */}
            <div className="bg-white/70 border border-slate-100/90 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#334155] flex items-center gap-1.5">
                  <Bell size={13} className="text-[#D23AA0]" />
                  Reminders
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  Priority
                </span>
              </div>
              <div className="text-sm font-bold text-[#0B1020]">DBMS assignment</div>
              <div className="text-xs font-medium text-[#334155] mt-1 flex items-center gap-1">
                <Clock size={12} className="text-amber-500" />
                Due tomorrow
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

