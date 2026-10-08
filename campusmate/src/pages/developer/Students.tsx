import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { adminService, type AdminUser } from '../../services/adminService';

type Section = { id: string; name: string };

export const Students = () => {
	const [students, setStudents] = useState<AdminUser[]>([]);
	const [sections, setSections] = useState<Section[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let isMounted = true;

		Promise.all([adminService.listStudents(), adminService.listSections()])
			.then(([studentRows, sectionRows]) => {
				if (!isMounted) return;
				setStudents(studentRows);
				setSections(sectionRows);
			})
			.catch((requestError) => {
				if (isMounted) setError(requestError instanceof Error ? requestError.message : 'Unable to load students.');
			})
			.finally(() => {
				if (isMounted) setLoading(false);
			});

		return () => { isMounted = false; };
	}, []);

	const sectionNames = new Map(sections.map(section => [section.id, section.name]));
	const normalizedSearch = search.trim().toLowerCase();
	const filteredStudents = students.filter(student => {
		const section = (student.student?.sectionId && sectionNames.get(student.student.sectionId)) || student.profile?.section || '';
		return [student.profile?.fullName, student.email, student.profile?.rollNumber, section]
			.some(value => value?.toLowerCase().includes(normalizedSearch));
	});

	return (
		<section className="max-w-6xl mx-auto space-y-6 pb-10">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Students</h1>
					<p className="mt-1 text-sm text-slate-500">{students.length} student accounts</p>
				</div>
				<label className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-blue-400">
					<Search size={17} className="text-slate-400" />
					<input
						type="search"
						value={search}
						onChange={event => setSearch(event.target.value)}
						placeholder="Search students"
						aria-label="Search students"
						className="w-full bg-transparent text-sm outline-none"
					/>
				</label>
			</header>

			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading students...</p>
			) : !error && filteredStudents.length === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
					{students.length === 0 ? 'No student accounts found.' : 'No students match this search.'}
				</p>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
					<table className="w-full text-left">
						<thead className="border-b border-slate-200 bg-slate-50">
							<tr>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Name</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Roll Number</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Email</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Section</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Institution</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{filteredStudents.map(student => {
								const section = (student.student?.sectionId && sectionNames.get(student.student.sectionId)) || student.profile?.section;
								return (
									<tr key={student.id}>
										<td className="px-4 py-3 text-sm font-medium text-slate-800">{student.profile?.fullName || 'Name not provided'}</td>
										<td className="px-4 py-3 text-sm text-slate-600">{student.profile?.rollNumber || 'Not provided'}</td>
										<td className="px-4 py-3 text-sm text-slate-600">{student.email}</td>
										<td className="px-4 py-3 text-sm text-slate-600">{section || 'Not assigned'}</td>
										<td className="px-4 py-3 text-sm text-slate-600">{student.Institution?.name || student.Institution?.code || 'Not provided'}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
};
