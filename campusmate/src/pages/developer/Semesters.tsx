import React, { useEffect, useState } from 'react';
import { adminService, type AdminSection } from '../../services/adminService';

type Semester = { id: string; name: string; number: number; sectionNames: string[] };

export const Semesters = () => {
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let isMounted = true;
		adminService.listSections()
			.then((sections: AdminSection[]) => {
				if (!isMounted) return;
				const semesterMap = new Map<string, Semester>();
				sections.forEach(section => {
					const semester = section.semester;
					if (!semester) return;
					const record = semesterMap.get(semester.id) || {
						id: semester.id,
						name: semester.name,
						number: semester.number,
						sectionNames: [],
					};
					record.sectionNames.push(section.name);
					semesterMap.set(semester.id, record);
				});
				setSemesters([...semesterMap.values()].sort((left, right) => left.number - right.number));
			})
			.catch(requestError => {
				if (isMounted) setError(requestError instanceof Error ? requestError.message : 'Unable to load semester data.');
			})
			.finally(() => { if (isMounted) setLoading(false); });
		return () => { isMounted = false; };
	}, []);

	return (
		<section className="max-w-5xl mx-auto space-y-6 pb-10">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">Semesters</h1>
				<p className="mt-1 text-sm text-slate-500">Semester records referenced by sections</p>
			</header>
			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading semesters...</p>
			) : semesters.length === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No semester records are linked to sections.</p>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
					<table className="w-full text-left">
						<thead className="border-b border-slate-200 bg-slate-50">
							<tr>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Number</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Semester</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Sections</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{semesters.map(semester => (
								<tr key={semester.id}>
									<td className="px-4 py-3 text-sm font-medium text-slate-800">{semester.number}</td>
									<td className="px-4 py-3 text-sm text-slate-700">{semester.name}</td>
									<td className="px-4 py-3 text-sm text-slate-600">{semester.sectionNames.join(', ')}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
};
