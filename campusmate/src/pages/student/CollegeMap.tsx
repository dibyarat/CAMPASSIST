import React, { useEffect, useState } from 'react';
import { Loader2, MapPin, Plus, ExternalLink } from 'lucide-react';
import { mapService } from '../../services/mapService';
import type { MapLocation } from '../../services/mapService';

export const CollegeMap = () => {
	const [locations, setLocations] = useState<MapLocation[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [latitude, setLatitude] = useState('');
	const [longitude, setLongitude] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const loadLocations = () => {
		setLoading(true);
		mapService.listApproved().then(setLocations).catch(console.error).finally(() => setLoading(false));
	};

	useEffect(() => {
		loadLocations();
	}, []);

	const submitLocation = async (event: React.FormEvent) => {
		event.preventDefault();
		setSubmitting(true);
		try {
			await mapService.submit({ name, description, latitude: Number(latitude), longitude: Number(longitude) });
			setName('');
			setDescription('');
			setLatitude('');
			setLongitude('');
			setShowForm(false);
		} catch (error) {
			console.error('Failed to submit location', error);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="max-w-5xl space-y-6 pb-10">
			<div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
				<h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><MapPin className="text-blue-500" /> College Map</h1>
				<button onClick={() => setShowForm(current => !current)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold"><Plus size={16} /> Submit Location</button>
			</div>

			{showForm && (
				<form onSubmit={submitLocation} className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 space-y-4">
					<input required value={name} onChange={event => setName(event.target.value)} placeholder="Location name" className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
					<textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Description (optional)" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 resize-none" />
					<div className="grid grid-cols-2 gap-4">
						<input required type="number" step="any" value={latitude} onChange={event => setLatitude(event.target.value)} placeholder="Latitude" className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
						<input required type="number" step="any" value={longitude} onChange={event => setLongitude(event.target.value)} placeholder="Longitude" className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
					</div>
					<button disabled={submitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-60">{submitting ? 'Submitting...' : 'Submit for review'}</button>
				</form>
			)}

			{loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div> : locations.length === 0 ? <div className="bg-white/60 rounded-2xl p-10 text-center text-slate-500">No approved campus locations yet.</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{locations.map(location => <div key={location.id} className="bg-white/60 rounded-2xl border border-slate-100 p-5 shadow-sm">
					<div className="flex items-start justify-between gap-4">
						<div><h3 className="font-bold text-slate-900">{location.name}</h3><p className="text-sm text-slate-500 mt-1">{location.description || 'Campus location'}</p></div>
						<a href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} target="_blank" rel="noreferrer" className="text-blue-600" title="Open in maps"><ExternalLink size={18} /></a>
					</div>
					<p className="text-xs text-slate-400 mt-4">{location.latitude}, {location.longitude}</p>
				</div>)}
			</div>}
		</div>
	);
};
