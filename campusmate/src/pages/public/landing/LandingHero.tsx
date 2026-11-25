import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import logoIcon from '../../../assets/logo-icon.png';

export const LandingHero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative py-16 sm:py-24 px-5 sm:px-8 overflow-hidden"
    >
      <div className="max-w-[1240px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-center gap-12 lg:gap-16">
          {/* Left Column: Copy & CTAs */}
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-[var(--color-border)] text-[var(--color-primary)] text-xs font-bold tracking-wider uppercase mb-6">
              <span className="text-[var(--color-accent)] text-sm" aria-hidden="true">✦</span>
              <span>THE ULTIMATE STUDENT COMPANION</span>
            </div>

            <h1 className="text-[42px] sm:text-[56px] lg:text-[68px] font-extrabold tracking-tight text-[var(--color-text)] leading-[1.08] mb-6">
              Your college life, <span className="text-gradient">simplified.</span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--color-muted)] max-w-[560px] leading-relaxed mb-9">
              Everything important about your college life in one place. Streamline your daily timetables, protect your 75% attendance with smart bunk-guard, locate exam halls, and stay ahead.
            </p>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-8">
              <Link
                to="/student"
                style={{
                  background: 'var(--gradient-brand)',
                  boxShadow: '0 10px 24px -8px var(--color-primary)',
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full text-white text-[15px] font-semibold transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full glass border border-[var(--color-border)] text-[var(--color-text)] text-[15px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)] flex items-center justify-center"
              >
                <span>Student Login</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <CheckCircle2 size={18} className="text-[#19A3E9] shrink-0" aria-hidden="true" />
              <span>Built by students, for students. Part of the HayonCampus ecosystem.</span>
            </div>
          </div>

          {/* Right Column: Staggered Floating Product Mockup Cards */}
          <div className="relative w-full flex flex-col justify-center py-4" aria-label="CampAssist feature preview">
            {/* Card 1: Live Schedule & Attendance */}
            <div className="w-full max-w-[410px] mr-auto rounded-3xl p-6 glass border border-[var(--color-border)] shadow-2xl relative z-10 animate-float-1">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2.5">
                  <img src={logoIcon} alt="CampAssist" className="w-6 h-6 object-contain" />
                  <span className="text-sm font-bold text-[var(--color-text)]">CampAssist</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass border border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-primary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Live Schedule</span>
                </span>
              </div>

              <div className="rounded-2xl p-4 mb-3 bg-[var(--color-card)] border border-[var(--color-border)]">
                <div className="text-sm font-bold text-[var(--color-text)] mb-1">Data Structures &amp; Algorithms</div>
                <div className="text-xs text-[var(--color-muted)]">Room 302 • 10:30 AM – 11:30 AM • Prof. Roy</div>
              </div>

              <div className="rounded-2xl p-4 bg-[var(--color-card)] border border-[var(--color-border)]">
                <div className="text-xs text-[var(--color-muted)]">Current Semester Attendance</div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-xl font-extrabold text-[var(--color-primary)]">86.4%</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/12 text-emerald-500">
                    Safe to Skip: 2 Lectures
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Smart Wayfinder & Alerts */}
            <div className="w-full max-w-[410px] ml-auto -mt-8 sm:-mt-12 rounded-3xl p-6 glass border border-[var(--color-border)] shadow-2xl relative z-20 animate-float-2">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2.5">
                  <img src={logoIcon} alt="CampAssist" className="w-6 h-6 object-contain" />
                  <span className="text-sm font-bold text-[var(--color-text)]">Campus Wayfinder</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass border border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-primary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>75% Bunk-Guard</span>
                </span>
              </div>

              <div className="rounded-2xl p-4 mb-3 bg-[var(--color-card)] border border-[var(--color-border)]">
                <div className="text-sm font-bold text-[var(--color-text)] mb-1">Lecture Hall 304 (Seat A-22)</div>
                <div className="text-xs text-[var(--color-muted)]">Academic Block B • 3rd Floor West Wing</div>
              </div>

              <div className="rounded-2xl p-4 bg-[var(--color-card)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-[var(--color-text)]">Operating Systems Lab</div>
                    <div className="text-xs text-[var(--color-muted)]">Starts in 12 mins</div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full glass border border-[var(--color-border)] text-[#19A3E9]">
                    CR Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
