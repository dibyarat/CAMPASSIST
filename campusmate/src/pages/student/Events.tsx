import React from 'react';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';

export const Events = () => {
  const events = [
    {
      title: 'TechX Hackathon 2025',
      date: '28-29 April 2025',
      time: '09:00 AM Onwards',
      location: 'Main Auditorium',
      organizer: 'Computer Science Dept',
      attendees: 342,
      tags: ['Hackathon', 'Coding', 'Tech'],
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Annual Cultural Fest: Symphony',
      date: '15-18 May 2025',
      time: '05:00 PM Onwards',
      location: 'College Grounds',
      organizer: 'Student Council',
      attendees: 1250,
      tags: ['Cultural', 'Music', 'Dance'],
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    }
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Campus Events</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map((event, idx) => (
          <div key={idx} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition group flex flex-col">
            <div className="h-48 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10"></div>
              <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="flex gap-2 mb-2">
                  {event.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="font-bold text-2xl text-white leading-tight">{event.title}</h3>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Date & Time</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{event.date}</p>
                    <p className="text-xs text-slate-500">{event.time}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Location</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{event.location}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Users size={16} className="text-slate-400" />
                  {event.attendees} Attending
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-primary text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition">
                  Register <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
