import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Calendar, MapPin, BarChart3, Bell, ArrowRight } from 'lucide-react';
import logoIcon from '../../assets/logo-icon.png';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 flex flex-col font-sans text-slate-900">
      {/* Navbar */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="CampAssist Logo" className="w-9 h-9 object-contain" />
            <span className="brand-wordmark font-extrabold text-2xl tracking-tight">CampAssist</span>
          </div>
          <nav className="hidden md:flex gap-8 font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#about" className="hover:text-blue-600 transition">About</a>
            <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-600 font-medium hover:text-slate-900">Login</Link>
            <Link to="/register" className="bg-gradient-primary text-white px-5 py-2 rounded-full font-medium shadow-md hover:shadow-lg transition">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--brand-cyan)] opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[var(--brand-pink)] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-3xl relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-cyan-50 text-[var(--brand-blue)] text-sm font-semibold mb-6 border border-cyan-100">The Ultimate Student Companion</span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-[#0a1128]">
            Your College Journey,<br/>
            <span className="text-gradient">Simplified.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Everything important about your college life in one place. Timetables, attendance, room finding, study resources, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto bg-gradient-primary text-white px-8 py-3.5 rounded-full font-semibold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-white/60 backdrop-blur-xl border-2 border-slate-200 text-slate-700 px-8 py-3.5 rounded-full font-semibold hover:border-slate-300 hover:bg-slate-50 transition">
              Student Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">CampAssist brings all your scattered college information into one beautiful, unified dashboard.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Calendar, color: "text-blue-500", bg: "bg-blue-50", title: "Smart Timetable", desc: "Never miss a class. Real-time updates on room changes and cancellations." },
            { icon: BarChart3, color: "text-pink-500", bg: "bg-pink-50", title: "Attendance Planner", desc: "Track your attendance effortlessly and plan when you can safely skip." },
            { icon: MapPin, color: "text-purple-500", bg: "bg-purple-50", title: "Room Finder", desc: "Instantly find free classrooms and labs across the campus." },
            { icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50", title: "StudyOS", desc: "Access lab records, notes, and academic PDFs in one unified workspace." },
            { icon: Bell, color: "text-orange-500", bg: "bg-orange-50", title: "Reminder Center", desc: "Stay on top of deadlines, exams, and assignment submissions." },
            { icon: GraduationCap, color: "text-indigo-500", bg: "bg-indigo-50", title: "SGPA/CGPA", desc: "Calculate your grades and track your academic performance accurately." },
          ].map((feat, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className={`w-12 h-12 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center mb-4`}>
                <feat.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-xl border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} CampAssist. Student-first digital college companion.
        </div>
      </footer>
    </div>
  );
};
