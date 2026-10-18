import React from 'react';
import { Link } from 'react-router-dom';

export const ClosingCTA: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 px-5 sm:px-8 bg-transparent">
      <div className="max-w-[1200px] mx-auto">
        <div
          className="rounded-[40px] px-8 py-16 sm:py-20 sm:px-16 text-center text-white relative overflow-hidden"
          style={{
            background: 'var(--gradient-brand)',
            boxShadow: '0 30px 70px -20px rgba(113, 64, 216, 0.45)',
          }}
        >
          {/* Subtle background glow accents */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight leading-tight mb-4">
              Ready to simplify your college life?
            </h2>

            <p className="text-base sm:text-lg text-white/90 leading-relaxed mb-10 max-w-xl mx-auto">
              One dashboard for your timetable, attendance, rooms, notes and deadlines.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/student"
                className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-full bg-white text-[var(--color-text)] text-base font-bold shadow-lg hover:bg-slate-50 transition-all duration-200 flex items-center justify-center hover:scale-[1.02]"
              >
                Get Started
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-full bg-transparent border-2 border-white/80 text-white text-base font-bold hover:bg-white/15 transition-all duration-200 flex items-center justify-center"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

