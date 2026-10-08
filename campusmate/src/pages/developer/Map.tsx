import React, { useEffect, useState } from 'react';
import { Check, Loader2, MapPin, X } from 'lucide-react';
import { mapService } from '../../services/mapService';
import type { MapLocation } from '../../services/mapService';

export const Map = () => {
	const [locations, setLocations] = useState<MapLocation[]>([]);
	const [loading, setLoading] = useState(true);
	const load = () => { setLoading(true); mapService.listForModeration().then(setLocations).catch(console.error).finally(() => setLoading(false)); };
	useEffect(load, []);
	const moderate = async (id: string, status: 'APPROVED' | 'REJECTED') => { try { await mapService.moderate(id, status); setLocations(current => current.filter(item => item.id !== id)); } catch (error) { console.error('Failed to moderate location', error); } };
	return <div className="max-w-6xl mx-auto space-y-6 pb-10"><header className="bg-white/60 p-6 rounded-2xl border border-slate-100"><h1 className="text-2xl font-bold">Map Moderation</h1><p className="text-slate-500 mt-1">Review student-submitted campus locations.</p></header>{loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div> : locations.length === 0 ? <div className="bg-white/60 p-10 rounded-2xl text-center text-slate-500">No pending locations.</div> : <div className="space-y-3">{locations.map(item => <article key={item.id} className="bg-white/60 p-5 rounded-2xl border border-slate-100 flex items-center justify-between gap-4"><div className="flex gap-3"><MapPin className="text-blue-600" /><div><h2 className="font-bold">{item.name}</h2><p className="text-sm text-slate-500">{item.description || 'No description'}</p><p className="text-xs text-slate-400 mt-1">{item.latitude}, {item.longitude}</p></div></div><div className="flex gap-2"><button onClick={() => moderate(item.id, 'APPROVED')} className="p-2 rounded-lg bg-emerald-50 text-emerald-700" title="Approve"><Check size={18} /></button><button onClick={() => moderate(item.id, 'REJECTED')} className="p-2 rounded-lg bg-rose-50 text-rose-700" title="Reject"><X size={18} /></button></div></article>)}</div>}</div>;
};
