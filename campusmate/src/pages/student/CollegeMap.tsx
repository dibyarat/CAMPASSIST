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
			<div className="flex justify-between items-center bg-[var(--glass-surface)] backdrop-blur-xl p-6 rounded-2xl shadow-[var(--card-shadow)] border border-[var(--color-border)] text-[var(--color-text)]">
				<h1 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2"><MapPin className="text-[#19A3E9]" /> College Map</h1>
				<button onClick={() => setShowForm(current => !current)} className="flex items-center gap-2 px-4 py-2 bg-gradient-brand text-white rounded-xl font-semibold shadow-xs hover:opacity-95 transition cursor-pointer"><Plus size={16} /> Submit Location</button>
			</div>

			{showForm && (
				<form onSubmit={submitLocation} className="bg-[var(--glass-surface)] backdrop-blur-xl p-6 rounded-2xl border border-[var(--color-border)] space-y-4 shadow-[var(--card-shadow)] text-[var(--color-text)]">
					<input required value={name} onChange={event => setName(event.target.value)} placeholder="Location name" className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-black/5 dark:bg-white/5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[#19A3E9]" />
					<textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Description (optional)" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-black/5 dark:bg-white/5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[#19A3E9] resize-none" />
					<div className="grid grid-cols-2 gap-4">
						<input required type="number" step="any" value={latitude} onChange={event => setLatitude(event.target.value)} placeholder="Latitude" className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-black/5 dark:bg-white/5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[#19A3E9]" />
						<input required type="number" step="any" value={longitude} onChange={event => setLongitude(event.target.value)} placeholder="Longitude" className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-black/5 dark:bg-white/5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[#19A3E9]" />
					</div>
					<button disabled={submitting} className="px-5 py-2.5 bg-gradient-brand text-white rounded-xl font-semibold disabled:opacity-60 cursor-pointer shadow-xs">{submitting ? 'Submitting...' : 'Submit for review'}</button>
				</form>
			)}

			{loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#19A3E9] w-8 h-8" /></div> : locations.length === 0 ? <div className="bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-10 text-center text-[var(--color-muted)]">No approved campus locations yet.</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{locations.map(location => <div key={location.id} className="bg-[var(--glass-surface)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] p-5 shadow-[var(--card-shadow)] text-[var(--color-text)]">
					<div className="flex items-start justify-between gap-4">
						<div><h3 className="font-bold text-[var(--color-text)]">{location.name}</h3><p className="text-sm text-[var(--color-muted)] mt-1">{location.description || 'Campus location'}</p></div>
						<a href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} target="_blank" rel="noreferrer" className="text-[#19A3E9] hover:underline" title="Open in maps"><ExternalLink size={18} /></a>
					</div>
					<p className="text-xs text-[var(--color-muted)] mt-4">{location.latitude}, {location.longitude}</p>
				</div>)}
			</div>}
		</div>
	);
};
