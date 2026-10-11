import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  BarChart3,
  MapPin,
  BookOpen,
  Bell,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

interface FeatureItem {
  title: string;
  desc: string;
  route: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  tileBg: string;
  iconColor: string;
}

export const FeaturesGrid: React.FC = () => {
  const features: FeatureItem[] = [
    {
      title: 'Smart Timetable',
      desc: 'Never miss a class. Real-time updates on room changes and cancellations.',
      route: '/student/timetable',
      icon: Calendar,
      tileBg: 'bg-[#DDEEFF]',
      iconColor: 'text-[#1A86E0]',
    },
    {
      title: 'Attendance Planner',
      desc: 'Track your attendance effortlessly and plan when you can safely skip.',
      route: '/student/attendance',
      icon: BarChart3,
      tileBg: 'bg-[#FDE3F1]',
      iconColor: 'text-[#D23AA0]',
    },
    {
      title: 'Room Finder',
      desc: 'Instantly find free classrooms and labs across the campus.',
      route: '/student/find-room',
      icon: MapPin,
      tileBg: 'bg-[#EAE3FF]',
      iconColor: 'text-[#7A5FD0]',
    },
    {
      title: 'StudyOS',
      desc: 'Access lab records, notes, and academic PDFs in one unified workspace.',
      route: '/student/studyos',
      icon: BookOpen,
      tileBg: 'bg-[#DDEEFF]',
      iconColor: 'text-[#1A86E0]',
    },
    {
      title: 'Reminder Center',
      desc: 'Stay on top of deadlines, exams, and assignment submissions.',
      route: '/student/submissions',
      icon: Bell,
      tileBg: 'bg-[#FDE3F1]',
      iconColor: 'text-[#D23AA0]',
    },
    {
      title: 'SGPA/CGPA',
      desc: 'Calculate your grades and track your academic performance accurately.',
      route: '/student/sgpa-cgpa',
      icon: GraduationCap,
      tileBg: 'bg-[#EAE3FF]',
      iconColor: 'text-[#7A5FD0]',
    },
  ];

  return (
    <section
      id="features"
      className="py-24 sm:py-32 px-5 sm:px-8"
      style={{ background: 'var(--section-wash)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0B1020] tracking-tight leading-tight mb-4">
            Everything You Need
          </h2>
          <p className="text-base sm:text-lg text-[#4A5270] leading-relaxed">
            CampAssist brings all your scattered college information into one beautiful, unified dashboard.
          </p>
        </div>

        {/* 6 Frosted Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group bg-white/75 backdrop-blur-xl rounded-[28px] border border-white p-7 sm:p-8 shadow-[0_10px_30px_rgba(26,134,224,0.06)] hover:shadow-[0_20px_40px_rgba(26,134,224,0.12)] transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  {/* Tinted Icon Tile */}
                  <div
                    className={`w-14 h-14 rounded-2xl ${feature.tileBg} ${feature.iconColor} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 shadow-xs`}
                  >
                    <Icon size={26} />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B1020] mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-[#4A5270] text-sm sm:text-base leading-relaxed mb-6 font-normal">
                    {feature.desc}
                  </p>
                </div>

                <Link
                  to={feature.route}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#0B1020] group-hover:text-[#1A86E0] transition-colors pt-2 min-h-[44px]"
                >
                  <span>Open {feature.title}</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

