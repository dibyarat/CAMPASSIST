import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface DirectoryCard {
  title: string;
  bg: string;
  borderColor: string;
  items: { label: string; to: string }[];
}

export const PageDirectory: React.FC = () => {
  const directoryCards: DirectoryCard[] = [
    {
      title: 'Main Menu',
      bg: 'bg-[#F1F7FF]',
      borderColor: 'border-blue-100',
      items: [
        { label: 'Dashboard', to: '/student' },
        { label: 'Timetable', to: '/student/timetable' },
        { label: 'Attendance', to: '/student/attendance' },
        { label: 'Find Room', to: '/student/find-room' },
        { label: 'StudyOS', to: '/student/studyos' },
      ],
    },
    {
      title: 'Academics',
      bg: 'bg-[#F7F2FF]',
      borderColor: 'border-purple-100',
      items: [
        { label: 'Submissions', to: '/student/submissions' },
        { label: 'SGPA/CGPA', to: '/student/sgpa-cgpa' },
        { label: 'Exam Schedule', to: '/student/exam-schedule' },
        { label: 'Exam Seating', to: '/student/exam-seat' },
      ],
    },
    {
      title: 'Campus',
      bg: 'bg-[#FFF2F8]',
      borderColor: 'border-pink-100',
      items: [
        { label: 'Events', to: '/student/events' },
        { label: 'College Map', to: '/student/college-map' },
        { label: 'Student Offers', to: '/student/offers' },
      ],
    },
  ];

  return (
    <section className="py-24 sm:py-32 px-5 sm:px-8 bg-transparent">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[var(--color-text)] tracking-tight leading-tight mb-3">
            The rest of campus, one click away
          </h2>
          <p className="text-base sm:text-lg text-[var(--color-muted)]">
            Jump straight to any page in your student dashboard.
          </p>
        </div>

        {/* 3 Directory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {directoryCards.map((card, idx) => (
            <div
              key={idx}
              className="glass rounded-[28px] border border-[var(--color-border)] p-6 sm:p-7 shadow-sm hover:shadow-[0_20px_45px_rgba(113,64,216,0.15)] transition-all duration-300 flex flex-col hover:-translate-y-1"
            >
              <h3 className="text-xl font-extrabold text-[var(--color-text)] mb-5 px-2">
                {card.title}
              </h3>

              <div className="flex-1 flex flex-col divide-y divide-[var(--color-border)]">
                {card.items.map((item, itemIdx) => (
                  <Link
                    key={itemIdx}
                    to={item.to}
                    className="group flex items-center justify-between min-h-[46px] px-2 py-2 text-sm sm:text-base font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors rounded-lg"
                  >
                    <span>{item.label}</span>
                    <ArrowRight
                      size={16}
                      className="text-[var(--color-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all"
                    />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

