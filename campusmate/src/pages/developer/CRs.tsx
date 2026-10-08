import React, { useEffect, useState } from 'react';
import { adminService, type AdminUser } from '../../services/adminService';

export const CRs = () => {
	const [representatives, setRepresentatives] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let isMounted = true;
		adminService.listCRs()
			.then(data => { if (isMounted) setRepresentatives(data); })
			.catch(requestError => {
				if (isMounted) setError(requestError instanceof Error ? requestError.message : 'Unable to load class representatives.');
			})
			.finally(() => { if (isMounted) setLoading(false); });
		return () => { isMounted = false; };
	}, []);

	return (
		<section className="max-w-6xl mx-auto space-y-6 pb-10">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">Class Representatives</h1>
				<p className="mt-1 text-sm text-slate-500">{representatives.length} assigned representatives</p>
			</header>
			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading representatives...</p>
			) : !error && representatives.length === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No class representatives found.</p>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
					<table className="w-full text-left">
						<thead className="border-b border-slate-200 bg-slate-50">
							<tr>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Name</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Email</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Assigned Section</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{representatives.map(representative => (
								<tr key={representative.id}>
									<td className="px-4 py-3 text-sm font-medium text-slate-800">{representative.profile?.fullName || 'Name not provided'}</td>
									<td className="px-4 py-3 text-sm text-slate-600">{representative.email}</td>
									<td className="px-4 py-3 text-sm text-slate-600">{representative.crAssignment?.section?.name || 'Not assigned'}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
};
