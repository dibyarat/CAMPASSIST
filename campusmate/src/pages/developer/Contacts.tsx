import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { adminService, type AdminUser } from '../../services/adminService';

export const Contacts = () => {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let isMounted = true;
		adminService.listUsers()
			.then(data => { if (isMounted) setUsers(data); })
			.catch(requestError => {
				if (isMounted) setError(requestError instanceof Error ? requestError.message : 'Unable to load contacts.');
			})
			.finally(() => { if (isMounted) setLoading(false); });
		return () => { isMounted = false; };
	}, []);

	const filteredUsers = users.filter(user =>
		`${user.profile?.fullName || ''} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase())
	);

	return (
		<section className="max-w-6xl mx-auto space-y-6 pb-10">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
					<p className="mt-1 text-sm text-slate-500">User contact directory</p>
				</div>
				<label className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-blue-400">
					<Search size={17} className="text-slate-400" />
					<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search contacts" aria-label="Search contacts" className="w-full bg-transparent text-sm outline-none" />
				</label>
			</header>
			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading contacts...</p>
			) : filteredUsers.length === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No matching contacts found.</p>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
					<table className="w-full text-left">
						<thead className="border-b border-slate-200 bg-slate-50">
							<tr>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Name</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Email</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Role</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Section</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{filteredUsers.map(user => (
								<tr key={user.id}>
									<td className="px-4 py-3 text-sm font-medium text-slate-800">{user.profile?.fullName || 'Name not provided'}</td>
									<td className="px-4 py-3 text-sm text-slate-600"><a className="hover:text-blue-700" href={`mailto:${user.email}`}>{user.email}</a></td>
									<td className="px-4 py-3 text-sm text-slate-600">{user.role || 'Role not provided'}</td>
									<td className="px-4 py-3 text-sm text-slate-600">{user.crAssignment?.section?.name || user.student?.section?.name || user.profile?.section || 'Not assigned'}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
};
