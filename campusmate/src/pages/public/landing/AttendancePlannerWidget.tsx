import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';

export const AttendancePlannerWidget: React.FC = () => {
  const [attended, setAttended] = useState<number>(42);
  const [total, setTotal] = useState<number>(52);
  const [target, setTarget] = useState<number>(75);

  const handleTotalChange = (val: number) => {
    const newTotal = Math.max(1, Math.min(150, val));
    setTotal(newTotal);
    if (attended > newTotal) {
      setAttended(newTotal);
    }
  };

  const handleAttendedChange = (val: number) => {
    const newAttended = Math.max(0, Math.min(total, val));
    setAttended(newAttended);
  };

  const pct = total > 0 ? (attended / total) * 100 : 0;
  const isSafe = pct >= target;

  let message = '';
  if (isSafe) {
    const skippable = Math.floor((attended * 100) / target - total);
    if (skippable <= 0) {
      message = `You are right at ${target}%. Attend the next class to stay safe.`;
    } else {
      message = `You can skip ${skippable} more ${skippable === 1 ? 'class' : 'classes'} and stay at or above ${target}%.`;
    }
  } else {
    const needed = Math.ceil((target * total - 100 * attended) / (100 - target));
    message = `Attend the next ${needed} ${needed === 1 ? 'class' : 'classes'} in a row to reach ${target}%.`;
  }

  return (
    <section className="py-24 sm:py-32 px-5 sm:px-8 bg-white">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Explanatory Copy & CTA */}
        <div className="lg:col-span-5 text-left">
          <span className="text-sm font-bold text-[#1A86E0] uppercase tracking-wider block mb-3">
            Attendance Planner
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#0B1020] tracking-tight leading-[1.12] mb-5">
            Know when you can<br />
            <span className="text-gradient">safely skip.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#4A5270] leading-relaxed mb-8">
            Track your attendance effortlessly and plan ahead. Try it here with your own numbers.
          </p>

          <Link
            to="/student/attendance"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full border-2 border-slate-200 text-[#0B1020] font-bold text-base hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-2xs min-h-[44px]"
          >
            <span>Open Attendance Planner</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Right Column: Working Interactive Widget Card */}
        <div className="lg:col-span-7">
          <div
            className="rounded-[32px] p-6 sm:p-9 border border-white shadow-[0_20px_50px_rgba(26,134,224,0.12),0_10px_25px_rgba(210,58,160,0.08)]"
            style={{
              background: 'linear-gradient(135deg, #F0F6FF 0%, #FAF2FF 50%, #FFF0F7 100%)',
            }}
          >
            {/* Range 1: Classes attended */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="classes-attended-input"
                  className="text-sm sm:text-base font-bold text-[#0B1020]"
                >
                  Classes attended
                </label>
                <span className="text-base sm:text-lg font-extrabold text-[#1A86E0] font-mono">
                  {attended}
                </span>
              </div>
              <input
                id="classes-attended-input"
                type="range"
                min={0}
                max={total}
                value={attended}
                onChange={(e) => handleAttendedChange(Number(e.target.value))}
                className="w-full h-2.5 bg-white rounded-lg appearance-none cursor-pointer accent-[#1A86E0] shadow-inner"
                aria-label="Classes attended"
              />
            </div>

            {/* Range 2: Total classes held */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="total-classes-input"
                  className="text-sm sm:text-base font-bold text-[#0B1020]"
                >
                  Total classes held
                </label>
                <span className="text-base sm:text-lg font-extrabold text-[#7A5FD0] font-mono">
                  {total}
                </span>
              </div>
              <input
                id="total-classes-input"
                type="range"
                min={1}
                max={150}
                value={total}
                onChange={(e) => handleTotalChange(Number(e.target.value))}
                className="w-full h-2.5 bg-white rounded-lg appearance-none cursor-pointer accent-[#7A5FD0] shadow-inner"
                aria-label="Total classes held"
              />
            </div>

            {/* Target Attendance Buttons */}
            <div className="mb-8">
              <label className="block text-xs uppercase tracking-wider font-bold text-[#4A5270] mb-3">
                Required attendance
              </label>
              <div className="flex items-center gap-3" role="group" aria-label="Target attendance percentage">
                {[65, 75, 80].map((t) => {
                  const isSelected = target === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setTarget(t)}
                      className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 min-h-[44px] cursor-pointer ${
                        isSelected
                          ? 'bg-[#0B1020] text-white shadow-md'
                          : 'bg-white/80 text-[#4A5270] border border-slate-200 hover:bg-white'
                      }`}
                    >
                      {t}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Result Panel */}
            <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 border border-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl sm:text-5xl font-extrabold text-[#0B1020] font-mono tracking-tight">
                  {pct.toFixed(1)}%
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
                    isSafe
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {isSafe ? (
                    <>
                      <ShieldCheck size={16} className="text-emerald-500" />
                      Safe
                    </>
                  ) : (
                    <>
                      <TrendingUp size={16} className="text-rose-500" />
                      Catch up
                    </>
                  )}
                </span>
              </div>

              {/* Progress Bar with Target Marker */}
              <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: 'var(--gradient-brand)',
                  }}
                />
              </div>

              {/* Target Marker Indicator below progress bar */}
              <div className="relative w-full h-4 mb-4">
                <div
                  className="absolute -top-3.5 flex flex-col items-center -translate-x-1/2 pointer-events-none"
                  style={{ left: `${target}%` }}
                >
                  <div className="w-1 h-3.5 bg-[#0B1020] rounded-full shadow-xs"></div>
                  <span className="text-[10px] font-bold text-[#0B1020] mt-0.5">{target}% target</span>
                </div>
              </div>

              {/* Dynamic message */}
              <p className="text-sm sm:text-base font-semibold text-[#0B1020] mt-1">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

