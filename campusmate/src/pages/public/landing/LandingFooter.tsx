import React from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../../../assets/logo-icon.png';

export const LandingFooter: React.FC = () => {
  const contactEmail = 'support@campassist.me';

  return (
    <footer id="contact" className="site-footer border-t border-[var(--color-border)] py-16 sm:py-20 px-5 sm:px-8 mt-8 bg-transparent">
      <div className="max-w-[1240px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-12 pb-14 border-b border-[var(--color-border)]">
          {/* Brand Column */}
          <div className="flex flex-col items-start">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-3 mb-4 focus-visible:rounded-lg"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-xl glass border border-[var(--color-border)] shadow-sm">
                <img src={logoIcon} alt="CampAssist logo" className="h-7 w-7 object-contain" />
              </div>
              <span className="font-wordmark font-extrabold text-[1.65rem] leading-none tracking-tight flex items-center">
                <span className="text-[#19A3E9]">Camp</span>
                <span className="text-[#D946A8]">Assist</span>
              </span>
            </Link>
            <p className="text-sm sm:text-base text-[var(--color-muted)] max-w-xs leading-relaxed">
              Everything important about your college life in one place. Part of the HayonCampus student ecosystem.
            </p>
          </div>

          {/* Column 1: Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-5">
              Platform
            </h4>
            <ul className="space-y-3 text-sm text-[var(--color-muted)]">
              <li>
                <a href="#features" className="hover:text-[var(--color-text)] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <Link to="/student/timetable" className="hover:text-[var(--color-text)] transition-colors">
                  Timetable Engine
                </Link>
              </li>
              <li>
                <Link to="/student/examination" className="hover:text-[var(--color-text)] transition-colors">
                  Examination
                </Link>
              </li>
              <li>
                <Link to="/student/offers" className="hover:text-[var(--color-text)] transition-colors">
                  Student Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Ecosystem & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-5">
              Ecosystem
            </h4>
            <ul className="space-y-3 text-sm text-[var(--color-muted)]">
              <li>
                <a
                  href="https://hayoncampus.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  HayonCampus Parent
                </a>
              </li>
              <li>
                <a
                  href={import.meta.env.VITE_STUDYOS_URL || 'https://studyos.website'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  StudyOS Workspace
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[var(--color-text)] transition-colors">
                  About CampAssist
                </a>
              </li>
              <li>
                <a href={`mailto:${contactEmail}`} className="hover:text-[var(--color-text)] transition-colors break-all">
                  {contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-[var(--color-muted)]">
          <div>
            © {new Date().getFullYear()} CampAssist • HayonCampus. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span>Designed for higher education</span>
            <span>•</span>
            <span>CampAssist &amp; StudyOS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
