import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { studyosService, type AcademicResource } from '../../services/studyosService';

export const PDFs = () => {
	const [resources, setResources] = useState<AcademicResource[]>([]);
	const [loading, setLoading] = useState(true);
	const [openingId, setOpeningId] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		let isMounted = true;
		studyosService.listResources()
			.then(data => { if (isMounted) setResources(data); })
			.catch(requestError => {
				if (isMounted) setError(requestError instanceof Error ? requestError.message : 'Unable to load academic resources.');
			})
			.finally(() => { if (isMounted) setLoading(false); });
		return () => { isMounted = false; };
	}, []);

	const openResource = async (resource: AcademicResource) => {
		setOpeningId(resource.id);
		setError('');
		try {
			const { url } = await studyosService.getDownloadUrl(resource.fileReference);
			window.location.assign(url);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Unable to open this resource.');
		} finally {
			setOpeningId('');
		}
	};

	return (
		<section className="max-w-6xl mx-auto space-y-6 pb-10">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">Academic Resources</h1>
				<p className="mt-1 text-sm text-slate-500">Resources currently stored in StudyOS</p>
			</header>
			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading resources...</p>
			) : resources.length === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No academic resources have been uploaded.</p>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
					<table className="w-full text-left">
						<thead className="border-b border-slate-200 bg-slate-50">
							<tr>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Title</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Type</th>
								<th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Uploaded</th>
								<th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">File</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{resources.map(resource => (
								<tr key={resource.id}>
									<td className="px-4 py-3 text-sm font-medium text-slate-800"><span className="inline-flex items-center gap-2"><FileText size={16} className="text-blue-600" />{resource.title}</span></td>
									<td className="px-4 py-3 text-sm text-slate-600">{resource.type}</td>
									<td className="px-4 py-3 text-sm text-slate-600">{new Date(resource.createdAt).toLocaleDateString()}</td>
									<td className="px-4 py-3 text-right">
										<button type="button" onClick={() => void openResource(resource)} disabled={openingId === resource.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
											{openingId === resource.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Open
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
};
