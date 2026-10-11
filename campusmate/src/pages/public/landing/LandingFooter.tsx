import React from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../../../assets/logo-icon.png';

export const LandingFooter: React.FC = () => {
  // TODO: Replace support@campassist.me with your final production contact email if different
  const contactEmail = 'support@campassist.me';

  return (
    <footer id="contact" className="bg-white border-t border-slate-100 py-16 sm:py-20 px-5 sm:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-slate-100">
          {/* Brand Info */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-3 mb-4 focus-visible:rounded-lg">
              <img
                src={logoIcon}
                alt="CampAssist logo"
                className="h-9 w-9 object-contain drop-shadow-xs"
              />
              <span className="font-extrabold text-2xl tracking-tight text-[#0B1020]">
                Camp<span className="text-[#1A86E0]">Assist</span>
              </span>
            </Link>
            <p className="text-sm sm:text-base text-[#4A5270] max-w-sm leading-relaxed">
              Everything important about your college life in one place.
            </p>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            {/* Column 1: Product */}
            <div>
              <h4 className="font-bold text-[#0B1020] mb-4">Product</h4>
              <ul className="space-y-3 font-medium text-[#4A5270]">
                <li>
                  <a href="#features" className="hover:text-[#1A86E0] transition-colors py-1 inline-block">
                    Features
                  </a>
                </li>
                <li>
                  <Link to="/student/timetable" className="hover:text-[#1A86E0] transition-colors py-1 inline-block">
                    Timetable
                  </Link>
                </li>
                <li>
                  <Link to="/student/studyos" className="hover:text-[#1A86E0] transition-colors py-1 inline-block">
                    StudyOS
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Campus */}
            <div>
              <h4 className="font-bold text-[#0B1020] mb-4">Campus</h4>
              <ul className="space-y-3 font-medium text-[#4A5270]">
                <li>
                  <Link to="/student/events" className="hover:text-[#1A86E0] transition-colors py-1 inline-block">
                    Events
                  </Link>
                </li>
                <li>
                  <Link to="/student/college-map" className="hover:text-[#1A86E0] transition-colors py-1 inline-block">
                    College Map
                  </Link>
                </li>
                <li>
                  <Link to="/student/offers" className="hover:text-[#1A86E0] transition-colors py-1 inline-block">
                    Student Offers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h4 className="font-bold text-[#0B1020] mb-4">Contact</h4>
              <ul className="space-y-3 font-medium text-[#4A5270]">
                <li>
                  <a href="#about" className="hover:text-[#1A86E0] transition-colors py-1 inline-block">
                    About
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hover:text-[#1A86E0] transition-colors py-1 inline-block break-all"
                  >
                    {contactEmail}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 text-center sm:text-left text-xs sm:text-sm font-medium text-[#4A5270]">
          &copy; 2026 CampAssist. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

