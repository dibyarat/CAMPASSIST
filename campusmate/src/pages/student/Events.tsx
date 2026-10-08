import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, ArrowRight, Loader2 } from 'lucide-react';
import { eventService } from '../../services/eventService';
import type { CampusEvent } from '../../services/eventService';

export const Events = () => {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    eventService.list().then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, []);

  const register = async (id: string) => {
    setRegistering(id);
    try {
      await eventService.register(id);
      setEvents(current => current.map(event => event.id === id ? { ...event, _count: { registrations: (event._count?.registrations || 0) + 1 } } : event));
    } catch (error) {
      console.error('Failed to register for event', error);
    } finally {
      setRegistering(null);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Campus Events</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div> : events.length === 0 ? <div className="col-span-full text-center py-12 text-slate-500">No upcoming events.</div> : events.map(event => (
          <div key={event.id} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition group flex flex-col">
            <div className="h-48 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10"></div>
              {event.imageUrl ? <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /> : <div className="w-full h-full bg-slate-700" />}
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="flex gap-2 mb-2">
                  {(event.tags || '').split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
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
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{new Date(event.startDate).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500">{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
                  {event._count?.registrations || 0} Attending
                </div>
                <button onClick={() => register(event.id)} disabled={registering === event.id} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-primary text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60">
                  {registering === event.id ? <Loader2 size={16} className="animate-spin" /> : 'Register'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
