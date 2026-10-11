import React from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../../../assets/logo-icon.png';

export const LandingHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60 transition-all">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group focus-visible:rounded-lg">
          <img
            src={logoIcon}
            alt="CampAssist logo"
            className="h-10 w-10 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
          />
          <span className="brand-wordmark font-extrabold text-2xl tracking-tight">
            CampAssist
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-[#4A5270]">
          <a
            href="#features"
            className="hover:text-[#1A86E0] transition-colors focus-visible:rounded-md px-1 py-1"
          >
            Features
          </a>
          <a
            href="#about"
            className="hover:text-[#1A86E0] transition-colors focus-visible:rounded-md px-1 py-1"
          >
            About
          </a>
          <a
            href="#contact"
            className="hover:text-[#1A86E0] transition-colors focus-visible:rounded-md px-1 py-1"
          >
            Contact
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/login"
            className="text-[15px] font-semibold text-[#0B1020] hover:text-[#1A86E0] transition-colors px-3 py-2 min-h-[44px] flex items-center focus-visible:rounded-full"
          >
            Login
          </Link>
          <Link
            to="/register"
            style={{
              background: 'var(--gradient-brand)',
              boxShadow: '0 4px 18px rgba(210, 58, 160, 0.32)'
            }}
            className="text-white text-[15px] font-bold px-6 py-2.5 rounded-full transition-all duration-200 hover:opacity-95 hover:shadow-lg min-h-[44px] flex items-center justify-center focus-visible:rounded-full"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
};

