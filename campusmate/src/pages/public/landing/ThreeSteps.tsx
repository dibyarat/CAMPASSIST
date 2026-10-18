import React from 'react';

export const ThreeSteps: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: 'Create your account',
      desc: 'Sign up with your student details.',
      gradient: 'linear-gradient(135deg, #19A3E9 0%, #7140D8 100%)',
    },
    {
      step: 2,
      title: 'Set up your semester',
      desc: 'Add your timetable and subjects once.',
      gradient: 'linear-gradient(135deg, #7140D8 0%, #D946A8 100%)',
    },
    {
      step: 3,
      title: 'Open your dashboard',
      desc: 'Everything you need for the day, in one place.',
      gradient: 'linear-gradient(135deg, #087DB7 0%, #19A3E9 100%)',
    },
  ];

  return (
    <section className="py-20 sm:py-28 px-5 sm:px-8 bg-transparent border-y border-[var(--color-border)]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          {steps.map((item) => (
            <div key={item.step} className="flex items-start gap-5">
              <div
                className="w-12 h-12 rounded-full text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(113,64,216,0.35)]"
                style={{ background: item.gradient }}
              >
                {item.step}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[var(--color-text)] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-[var(--color-muted)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

