import React, { useEffect, useState } from 'react';
import { Save, User } from 'lucide-react';
import { authService } from '../../services/authService';

type Account = {
	email?: string;
	role?: string;
	profile?: { fullName?: string | null; department?: string | null; github?: string | null; linkedin?: string | null; portfolio?: string | null } | null;
	Institution?: { name?: string; code?: string } | null;
};

export const Settings = () => {
	const [account, setAccount] = useState<Account | null>(null);
	const [fullName, setFullName] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');

	useEffect(() => {
		let isMounted = true;
		authService.me()
			.then(data => {
				if (!isMounted) return;
				setAccount(data);
				setFullName(data.profile?.fullName || '');
			})
			.catch(requestError => {
				if (isMounted) setError(requestError instanceof Error ? requestError.message : 'Unable to load account settings.');
			})
			.finally(() => { if (isMounted) setLoading(false); });
		return () => { isMounted = false; };
	}, []);

	const saveProfile = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!fullName.trim()) {
			setError('Enter a name before saving.');
			return;
		}
		setSaving(true);
		setError('');
		setMessage('');
		try {
			const profile = await authService.updateProfile({ fullName: fullName.trim() });
			setAccount(current => ({ ...current, profile: { ...current?.profile, ...profile } }));
			localStorage.setItem('userFullName', fullName.trim());
			setMessage('Profile saved.');
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Unable to save profile.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<section className="max-w-3xl mx-auto space-y-6 pb-10">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
				<p className="mt-1 text-sm text-slate-500">Your CampAssist developer account</p>
			</header>
			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading account...</p>
			) : account && (
				<form onSubmit={saveProfile} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
					<div className="flex items-center gap-3 border-b border-slate-100 pb-5">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><User size={22} /></div>
						<div>
							<h2 className="font-semibold text-slate-900">{account.role || 'Account'}</h2>
							<p className="text-sm text-slate-500">{account.email || 'Email not available'}</p>
						</div>
					</div>
					<label className="block space-y-1.5">
						<span className="text-sm font-semibold text-slate-700">Full Name</span>
						<input required value={fullName} onChange={event => setFullName(event.target.value)} disabled={saving} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 disabled:opacity-60" />
					</label>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
						<p><span className="text-slate-500">Department:</span> <span className="font-medium text-slate-800">{account.profile?.department || 'Not provided'}</span></p>
						<p><span className="text-slate-500">Institution:</span> <span className="font-medium text-slate-800">{account.Institution?.name || account.Institution?.code || 'Not assigned'}</span></p>
					</div>
					{message && <p role="status" className="text-sm font-medium text-emerald-700">{message}</p>}
					<div className="flex justify-end border-t border-slate-100 pt-5">
						<button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
							<Save size={16} /> {saving ? 'Saving...' : 'Save name'}
						</button>
					</div>
				</form>
			)}
		</section>
	);
};
