import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, BookOpen, Layers } from 'lucide-react';

export const StudyOSBand: React.FC = () => {
  const sampleFiles = [
    { type: 'PDF', title: 'Data Structures Lab Record', badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { type: 'NOTE', title: 'Operating Systems Unit 2', badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { type: 'PDF', title: 'DBMS Previous Paper', badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
    { type: 'NOTE', title: 'Networks Quick Revision', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  ];

  return (
    <section className="py-16 sm:py-20 px-5 sm:px-8 bg-[var(--color-bg)]">
      <div className="max-w-[1200px] mx-auto">
        <div
          className="relative rounded-[40px] overflow-hidden p-8 sm:p-12 lg:p-16 text-white border border-white/10 shadow-2xl"
          style={{
            backgroundColor: '#120F24',
          }}
        >
          {/* Bottom-left Blue Glow & Top-right Pink Glow */}
          <div
            className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full pointer-events-none blur-[100px]"
            style={{ background: 'rgba(25, 163, 233, 0.35)' }}
          />
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none blur-[100px]"
            style={{ background: 'rgba(217, 70, 168, 0.32)' }}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 text-left">
              <span className="text-sm font-bold text-[#19A3E9] uppercase tracking-wider block mb-3 font-wordmark">
                Study<span className="text-[#D946A8]">OS</span>
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-white tracking-tight leading-tight mb-5">
                Your academic<br />workspace.
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-lg">
                Access lab records, notes, and academic PDFs in one unified workspace.
              </p>

              {/* 3 Bullets with Colored Dots */}
              <ul className="space-y-3.5 mb-10 text-sm sm:text-base font-semibold text-slate-200">
                <li className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#19A3E9] shadow-[0_0_8px_#19A3E9]"></span>
                  <span>Lab records</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7140D8] shadow-[0_0_8px_#7140D8]"></span>
                  <span>Notes</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D946A8] shadow-[0_0_8px_#D946A8]"></span>
                  <span>Academic PDFs</span>
                </li>
              </ul>

              <Link
                to="/student/studyos"
                style={{
                  background: 'var(--gradient-brand)',
                  boxShadow: '0 4px 20px rgba(113, 64, 216, 0.4)',
                }}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-white font-bold text-base hover:scale-[1.02] transition-all duration-200 shadow-lg min-h-[44px]"
              >
                <span>Open StudyOS</span>
                <ArrowRight size={18} />
              </Link>
            </div>

            {/* Right Mockup Card */}
            <div className="lg:col-span-6">
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Mockup Sidebar */}
                  <div className="sm:col-span-4 flex flex-row sm:flex-col gap-2 border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-3">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-white/20 text-white flex items-center gap-2 shadow-xs"
                    >
                      <Layers size={13} className="text-[#38BDF8]" />
                      <span>Lab Records</span>
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition flex items-center gap-2"
                    >
                      <BookOpen size={13} />
                      <span>Notes</span>
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition flex items-center gap-2"
                    >
                      <FileText size={13} />
                      <span>PDFs</span>
                    </button>
                  </div>

                  {/* Mockup File List */}
                  <div className="sm:col-span-8 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      {sampleFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left"
                        >
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border shrink-0 ${file.badgeBg}`}
                          >
                            {file.type}
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                            {file.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Sample files</span>
                      <span className="text-[#38BDF8] font-semibold">StudyOS v2.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

