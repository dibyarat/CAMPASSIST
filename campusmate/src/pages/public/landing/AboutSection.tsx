import React from 'react';
import logoIcon from '../../../assets/logo-icon.png';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 sm:py-28 px-5 sm:px-8 relative">
      <div className="max-w-[1240px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] items-center gap-12 lg:gap-16">
          {/* Left: Mission Copy */}
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full glass border border-[var(--color-border)] text-xs font-bold tracking-wider uppercase text-[var(--color-primary)] mb-4">
              WHY CAMPASSIST
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[var(--color-text)] tracking-tight leading-tight mb-6">
              Stop hunting across groups, notice boards, and PDFs.
            </h2>

            <p className="text-base sm:text-lg text-[var(--color-muted)] leading-relaxed mb-4">
              University life moves at breakneck speed. Class changes, attendance tracking, room assignments, and exam schedules all live in disconnected places.
            </p>

            <p className="text-base sm:text-lg text-[var(--color-muted)] leading-relaxed mb-6">
              CampAssist puts your daily campus operations into one clean dashboard you open every day — seamlessly paired with StudyOS under the HayonCampus umbrella.
            </p>

            <div className="w-full sm:w-auto px-5 py-4 rounded-2xl glass border border-[var(--color-border)] font-bold text-sm sm:text-base text-[var(--color-primary)] flex items-center gap-3">
              <span className="text-[var(--color-accent)]" aria-hidden="true">✦</span>
              <span>One shared student ecosystem. Zero fragmented noise.</span>
            </div>
          </div>

          {/* Right: Brand Emblem Showcase Card */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-[380px] py-12 px-8 text-center rounded-[32px] glass border border-[var(--color-border)] shadow-2xl flex flex-col items-center transition-all duration-300 hover:-translate-y-1">
              <img
                src={logoIcon}
                alt="CampAssist Icon"
                className="w-36 h-36 object-contain mb-6 drop-shadow-[0_12px_28px_rgba(135,88,245,0.4)]"
              />
              <span className="font-wordmark font-extrabold text-3xl tracking-tight mb-2 flex items-center">
                <span className="text-[#19A3E9]">Camp</span>
                <span className="text-[#D946A8]">Assist</span>
              </span>
              <span className="text-sm font-semibold text-[var(--color-muted)]">
                Everything important about your college life in one place.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
