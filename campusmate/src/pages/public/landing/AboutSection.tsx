import React from 'react';

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="py-24 sm:py-32 px-5 sm:px-8 text-center"
      style={{ background: 'var(--section-wash)' }}
    >
      <div className="max-w-[800px] mx-auto">
        <span className="text-sm font-bold text-[#1A86E0] uppercase tracking-wider block mb-4">
          Why CampAssist
        </span>

        <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#0B1020] tracking-tight leading-tight mb-6">
          Stop hunting across groups, notice boards and PDFs.
        </h2>

        <p className="text-base sm:text-lg lg:text-xl text-[#4A5270] leading-relaxed">
          Class changes, attendance, rooms, notes and deadlines all live in different places. CampAssist puts them in one dashboard you open every day.
        </p>
      </div>
    </section>
  );
};

