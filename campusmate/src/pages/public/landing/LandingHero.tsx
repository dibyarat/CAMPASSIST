import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { DashboardPreview } from './DashboardPreview';

export const LandingHero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative py-14 sm:py-20 px-5 sm:px-8 overflow-hidden"
    >
      <div className="max-w-[1280px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] items-center gap-12 lg:gap-14">
          {/* Left Column: Copy & CTAs */}
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-[var(--color-border)] text-[var(--color-primary)] text-xs font-bold tracking-wider uppercase mb-6">
              <span className="text-[var(--color-accent)] text-sm" aria-hidden="true">✦</span>
              <span>THE ULTIMATE STUDENT COMPANION</span>
            </div>

            <h1 className="text-[40px] sm:text-[52px] lg:text-[62px] font-extrabold tracking-tight text-[var(--color-text)] leading-[1.08] mb-6">
              Your college life, <span className="text-gradient">simplified.</span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--color-muted)] max-w-[520px] leading-relaxed mb-8">
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

          {/* Right Column: CampAssist Dashboard Preview */}
          <div className="w-full">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
};
