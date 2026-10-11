import React from 'react';

export const ThreeSteps: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: 'Create your account',
      desc: 'Sign up with your student details.',
      gradient: 'linear-gradient(135deg, #1A86E0 0%, #4F46E5 100%)',
    },
    {
      step: 2,
      title: 'Set up your semester',
      desc: 'Add your timetable and subjects once.',
      gradient: 'linear-gradient(135deg, #7A5FD0 0%, #D23AA0 100%)',
    },
    {
      step: 3,
      title: 'Open your dashboard',
      desc: 'Everything you need for the day, in one place.',
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #1A86E0 100%)',
    },
  ];

  return (
    <section className="py-20 sm:py-28 px-5 sm:px-8 bg-[#F7F8FE]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          {steps.map((item) => (
            <div key={item.step} className="flex items-start gap-5">
              <div
                className="w-12 h-12 rounded-full text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-md"
                style={{ background: item.gradient }}
              >
                {item.step}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#0B1020] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-[#4A5270] leading-relaxed">
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

