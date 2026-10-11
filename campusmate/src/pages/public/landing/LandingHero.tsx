import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { DashboardPreview } from './DashboardPreview';

export const LandingHero: React.FC = () => {
  return (
    <section
      className="relative pt-12 pb-24 sm:pt-16 sm:pb-32 px-5 sm:px-8 overflow-hidden text-center"
      style={{
        background:
          'radial-gradient(55% 60% at 0% 38%, rgba(36, 150, 255, 0.40), transparent 70%), radial-gradient(55% 60% at 100% 28%, rgba(255, 72, 172, 0.34), transparent 70%), #ffffff',
      }}
    >
      <div className="max-w-[1200px] mx-auto flex flex-col items-center relative z-10">
        {/* Badge Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/80 text-[#1A86E0] text-xs sm:text-sm font-semibold tracking-wide mb-8 shadow-xs">
          <Sparkles size={14} className="text-[#1A86E0]" />
          <span>The Ultimate Student Companion</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-[44px] sm:text-[62px] lg:text-[84px] font-extrabold tracking-tight text-[#0B1020] leading-[1.08] max-w-4xl mb-6">
          Your College Journey,<br />
          <span className="text-gradient">Simplified.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-[#4A5270] max-w-2xl mx-auto leading-relaxed font-normal mb-10">
          Everything important about your college life in one place. Timetables, attendance, room finding, study resources, and more.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            to="/student"
            style={{
              background: 'var(--gradient-brand)',
              boxShadow: '0 6px 24px rgba(210, 58, 160, 0.35)',
            }}
            className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-full text-white text-lg font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-xl flex items-center justify-center gap-2.5"
          >
            Get Started <ArrowRight size={20} />
          </Link>

          <Link
            to="/student"
            className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-[#0B1020] text-lg font-bold transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center shadow-xs"
          >
            Student Login
          </Link>
        </div>

        {/* Dashboard Preview Component Embedded in Hero */}
        <DashboardPreview />
      </div>
    </section>
  );
};

