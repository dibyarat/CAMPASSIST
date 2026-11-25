import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logoIcon from '../../../assets/logo-icon.png';

export const LandingHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="site-navbar sticky top-4 z-50 w-[min(1240px,calc(100%-2rem))] mx-auto mt-4 px-5 py-2.5 rounded-full glass border border-[var(--color-border)] transition-all">
        <div className="flex items-center justify-between w-full gap-3">
          {/* Logo Mark + Baloo 2 Wordmark */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-3 group focus-visible:rounded-lg shrink-0"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl glass border border-[var(--color-border)] shadow-sm">
              <img
                src={logoIcon}
                alt="CampAssist logo"
                className="h-7 w-7 object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <span className="font-wordmark font-extrabold text-[1.65rem] leading-none tracking-tight flex items-center">
              <span className="text-[#19A3E9]">Camp</span>
              <span className="text-[#D946A8]">Assist</span>
            </span>
          </Link>

          {/* Center Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[var(--color-muted)]"
          >
            <a
              href="#hero"
              className="nav-item-underline hover:text-[var(--color-text)] transition-colors py-1.5"
            >
              Home
            </a>
            <a
              href="#features"
              className="nav-item-underline hover:text-[var(--color-text)] transition-colors py-1.5"
            >
              Features
            </a>
            <a
              href="#about"
              className="nav-item-underline hover:text-[var(--color-text)] transition-colors py-1.5"
            >
              About
            </a>
            <a
              href="#contact"
              className="nav-item-underline hover:text-[var(--color-text)] transition-colors py-1.5"
            >
              Contact
            </a>
          </nav>

          {/* Right CTA Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors px-3.5 py-2 rounded-full hover:bg-[var(--glass-surface)]"
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                background: 'var(--gradient-brand)',
                boxShadow: '0 10px 24px -8px var(--color-primary)',
              }}
              className="text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center justify-center gap-1.5"
            >
              <span>Get started</span>
              <ArrowRight size={15} />
            </Link>

            <button
              type="button"
              className="md:hidden flex flex-col justify-center gap-1.5 w-10 h-10 rounded-xl p-2 border border-[var(--color-border)] bg-[var(--glass-surface)]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <span className="w-full h-0.5 bg-[var(--color-text)] rounded" />
              <span className="w-full h-0.5 bg-[var(--color-text)] rounded" />
              <span className="w-full h-0.5 bg-[var(--color-text)] rounded" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed top-22 left-4 right-4 p-6 z-50 rounded-3xl glass border border-[var(--color-border)] shadow-2xl flex flex-col gap-3"
          aria-label="Mobile Navigation"
        >
          <a
            href="#hero"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-[var(--color-text)] py-2 border-b border-[var(--color-border)]"
          >
            Home
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-[var(--color-text)] py-2 border-b border-[var(--color-border)]"
          >
            Features
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-[var(--color-text)] py-2 border-b border-[var(--color-border)]"
          >
            About
          </a>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-[var(--color-text)] py-2 border-b border-[var(--color-border)]"
          >
            Contact
          </a>
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-2.5 text-center rounded-full glass border border-[var(--color-border)] font-semibold text-[var(--color-text)]"
          >
            Login
          </Link>
          <Link
            to="/register"
            onClick={() => setMobileMenuOpen(false)}
            style={{ background: 'var(--gradient-brand)' }}
            className="w-full py-2.5 text-center rounded-full text-white font-semibold"
          >
            Get started
          </Link>
        </div>
      )}
    </>
  );
};
