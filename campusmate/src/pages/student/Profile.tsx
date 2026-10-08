import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRoundPen } from 'lucide-react';
import { authService } from '../../services/authService';

type StudentProfile = {
	email?: string;
	profile?: {
		fullName?: string | null;
		rollNumber?: string | null;
		department?: string | null;
		semester?: string | null;
		section?: string | null;
		avatarUrl?: string | null;
		studentType?: string | null;
		hostelName?: string | null;
		hostelBlock?: string | null;
		hostelRoom?: string | null;
	} | null;
	student?: {
		section?: { name?: string; department?: { name?: string } } | null;
	} | null;
};

export const Profile = () => {
	const [profile, setProfile] = useState<StudentProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let isMounted = true;
		authService.me()
			.then(data => { if (isMounted) setProfile(data); })
			.catch(requestError => {
				if (isMounted) setError(requestError instanceof Error ? requestError.message : 'Unable to load your profile.');
			})
			.finally(() => { if (isMounted) setLoading(false); });
		return () => { isMounted = false; };
	}, []);

	const details = [
		['Email', profile?.email],
		['Roll Number', profile?.profile?.rollNumber],
		['Section', profile?.student?.section?.name || profile?.profile?.section],
		['Department', profile?.student?.section?.department?.name || profile?.profile?.department],
		['Semester', profile?.profile?.semester],
		['Student Type', profile?.profile?.studentType?.replace('_', ' ')],
		['Hostel', profile?.profile?.hostelName],
		['Hostel Block', profile?.profile?.hostelBlock],
		['Hostel Room', profile?.profile?.hostelRoom],
	];

	return (
		<section className="max-w-4xl mx-auto space-y-6 pb-10">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
					<p className="mt-1 text-sm text-slate-500">Account and academic details</p>
				</div>
				<Link to="/student/settings" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
					<UserRoundPen size={16} /> Edit profile
				</Link>
			</header>

			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading profile...</p>
			) : profile && (
				<div className="rounded-xl border border-slate-200 bg-white p-6">
					<div className="flex items-center gap-4 border-b border-slate-100 pb-6">
						{profile.profile?.avatarUrl ? (
							<img src={profile.profile.avatarUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
						) : (
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500"><User size={26} /></div>
						)}
						<div>
							<h2 className="text-xl font-bold text-slate-900">{profile.profile?.fullName || 'Name not provided'}</h2>
							<p className="text-sm text-slate-500">Student account</p>
						</div>
					</div>
					<dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
						{details.map(([label, value]) => (
							<div key={label} className="border-b border-slate-100 py-4">
								<dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
								<dd className="mt-1 text-sm font-medium text-slate-800">{value || 'Not provided'}</dd>
							</div>
						))}
					</dl>
				</div>
			)}
		</section>
	);
};
