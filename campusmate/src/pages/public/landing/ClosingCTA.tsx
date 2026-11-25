import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const ClosingCTA: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 px-5 sm:px-8 bg-transparent">
      <div className="max-w-[1040px] mx-auto">
        <div className="rounded-[32px] px-8 py-16 sm:py-20 sm:px-14 text-center glass border border-[var(--color-border)] shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-tight mb-5 text-[var(--color-text)]">
              Education shouldn&apos;t feel fragmented. <br />
              <span className="text-gradient">Ready to simplify your college life?</span>
            </h2>

            <p className="text-base sm:text-lg text-[var(--color-muted)] leading-relaxed mb-9 max-w-xl mx-auto">
              One dashboard for your timetable, attendance, rooms, notes, and deadlines.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/student"
                style={{
                  background: '#2563EB',
                  boxShadow: '0 10px 24px -8px #2563EB',
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-white text-[15px] font-semibold transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>Get Started Now</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full glass border border-[var(--color-border)] text-[var(--color-text)] text-[15px] font-semibold hover:border-[#2563EB] transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center"
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
