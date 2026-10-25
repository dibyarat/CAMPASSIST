import React from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../../../assets/logo-icon.png';

export const LandingHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--color-border)] transition-all">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 sm:gap-3 group focus-visible:rounded-lg shrink-0">
          <img
            src={logoIcon}
            alt="CampAssist logo"
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-wordmark font-extrabold text-xl sm:text-2xl tracking-tight flex items-center">
            <span className="text-[#19A3E9]">Camp</span><span className="text-[#D946A8]">Assist</span>
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-[var(--color-muted)]">
          <a
            href="#features"
            className="hover:text-[var(--color-primary)] transition-colors focus-visible:rounded-md px-1 py-1"
          >
            Features
          </a>
          <a
            href="#about"
            className="hover:text-[var(--color-primary)] transition-colors focus-visible:rounded-md px-1 py-1"
          >
            About
          </a>
          <a
            href="#contact"
            className="hover:text-[var(--color-primary)] transition-colors focus-visible:rounded-md px-1 py-1"
          >
            Contact
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            to="/login"
            className="text-sm sm:text-[15px] font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors px-3 sm:px-4 py-1.5 sm:py-2 min-h-[38px] sm:min-h-[44px] flex items-center focus-visible:rounded-full rounded-full hover:bg-[var(--glass-surface)]"
          >
            Login
          </Link>
          <Link
            to="/register"
            style={{
              background: 'var(--gradient-brand)',
              boxShadow: '0 4px 18px rgba(113, 64, 216, 0.35)'
            }}
            className="text-white text-sm sm:text-[15px] font-bold px-3.5 sm:px-6 py-1.5 sm:py-2.5 rounded-full transition-all duration-200 hover:opacity-95 hover:shadow-lg min-h-[38px] sm:min-h-[44px] flex items-center justify-center focus-visible:rounded-full hover:scale-[1.02]"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
};

