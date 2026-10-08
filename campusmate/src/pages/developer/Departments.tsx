import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { departmentService, type Department } from '../../services/departmentService';

export const Departments = () => {
	const [departments, setDepartments] = useState<Department[]>([]);
	const [name, setName] = useState('');
	const [code, setCode] = useState('');
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	const loadDepartments = async () => {
		try {
			setDepartments(await departmentService.list());
			setError('');
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Unable to load departments.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { void loadDepartments(); }, []);

	const createDepartment = async (event: React.FormEvent) => {
		event.preventDefault();
		setSaving(true);
		setError('');
		try {
			await departmentService.create({ name: name.trim(), code: code.trim().toUpperCase() });
			setName('');
			setCode('');
			await loadDepartments();
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Unable to create department.');
		} finally {
			setSaving(false);
		}
	};

	const filteredDepartments = departments.filter(department =>
		`${department.name} ${department.code}`.toLowerCase().includes(search.trim().toLowerCase())
	);

	return (
		<section className="max-w-6xl mx-auto space-y-6 pb-10">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Departments</h1>
					<p className="mt-1 text-sm text-slate-500">{departments.length} departments</p>
				</div>
				<label className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-blue-400">
					<Search size={17} className="text-slate-400" />
					<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search departments" aria-label="Search departments" className="w-full bg-transparent text-sm outline-none" />
				</label>
			</header>

			<form onSubmit={createDepartment} className="flex flex-wrap items-end gap-3 border-b border-slate-200 pb-6">
				<label className="min-w-48 flex-1 space-y-1.5">
					<span className="text-sm font-semibold text-slate-700">Department name</span>
					<input required value={name} onChange={event => setName(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
				</label>
				<label className="w-36 space-y-1.5">
					<span className="text-sm font-semibold text-slate-700">Code</span>
					<input required value={code} onChange={event => setCode(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-400" />
				</label>
				<button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
					<Plus size={17} /> {saving ? 'Adding...' : 'Add department'}
				</button>
			</form>

			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading departments...</p>
			) : !error && filteredDepartments.length === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
					{departments.length === 0 ? 'No departments found.' : 'No departments match this search.'}
				</p>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
					<table className="w-full text-left">
						<thead className="border-b border-slate-200 bg-slate-50">
							<tr>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Department</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Code</th>
								<th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Sections</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{filteredDepartments.map(department => (
								<tr key={department.id}>
									<td className="px-4 py-3 text-sm font-medium text-slate-800">{department.name}</td>
									<td className="px-4 py-3 text-sm text-slate-600">{department.code}</td>
									<td className="px-4 py-3 text-right text-sm text-slate-600">{department.sections?.length ?? 0}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
};
