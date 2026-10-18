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

	const rawStudentType = profile?.profile?.studentType || (profile?.profile as any)?.residency || (profile as any)?.studentType || (profile as any)?.residency;
	const formattedStudentType = rawStudentType
		? (String(rawStudentType).toUpperCase().includes('HOSTEL') ? 'Hosteller' : 'Day Scholar')
		: 'Not provided';

	const rawGender = (profile?.profile as any)?.gender || (profile as any)?.gender || (profile as any)?.academicIdentity?.gender;
	const formattedGender = rawGender || 'Not provided';

	const details = [
		['Email', profile?.email],
		['Roll Number', profile?.profile?.rollNumber || 'Not provided'],
		['Section', profile?.student?.section?.name || profile?.profile?.section || 'Not assigned'],
		['Department', profile?.student?.section?.department?.name || profile?.profile?.department || 'Not provided'],
		['Semester', profile?.profile?.semester || 'Not provided'],
		['Student Type', formattedStudentType],
		['Gender', formattedGender],
		['Hostel', profile?.profile?.hostelName || (formattedStudentType === 'Hosteller' ? 'Assigned' : 'N/A')],
		['Hostel Block', profile?.profile?.hostelBlock || (formattedStudentType === 'Hosteller' ? 'Assigned' : 'N/A')],
		['Hostel Room', profile?.profile?.hostelRoom || (formattedStudentType === 'Hosteller' ? 'Assigned' : 'N/A')],
	];


	return (
		<section className="max-w-4xl mx-auto space-y-6 pb-10">
			<header className="flex flex-wrap items-end justify-between gap-4 bg-[var(--glass-surface)] backdrop-blur-xl p-6 rounded-2xl shadow-[var(--card-shadow)] border border-[var(--color-border)] text-[var(--color-text)]">
				<div>
					<h1 className="text-2xl font-bold text-[var(--color-text)]">My Profile</h1>
					<p className="mt-1 text-sm text-[var(--color-muted)]">Account and academic details</p>
				</div>
				<Link to="/student/settings" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition shadow-xs">
					<UserRoundPen size={16} className="text-[#8758F5]" /> Edit profile
				</Link>
			</header>

			{error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-400">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-[var(--color-muted)]">Loading profile...</p>
			) : profile && (
				<div className="rounded-2xl border border-[var(--color-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-6 shadow-[var(--card-shadow)] text-[var(--color-text)]">
					<div className="flex items-center gap-4 border-b border-[var(--color-border)] pb-6">
						{profile.profile?.avatarUrl ? (
							<img src={profile.profile.avatarUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border border-[var(--color-border)] shadow-xs" />
						) : (
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-[#8758F5] border border-[var(--color-border)]"><User size={26} /></div>
						)}
						<div>
							<h2 className="text-xl font-bold text-[var(--color-text)]">{profile.profile?.fullName || 'Name not provided'}</h2>
							<p className="text-sm font-medium text-[var(--color-muted)]">Student account</p>
						</div>
					</div>
					<dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
						{details.map(([label, value]) => (
							<div key={label} className="border-b border-[var(--color-border)] py-4">
								<dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</dt>
								<dd className="mt-1 text-sm font-medium text-[var(--color-text)]">{value || 'Not provided'}</dd>
							</div>
						))}
					</dl>
				</div>
			)}
		</section>
	);
};
