import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { studyosService, type AcademicResource } from '../../services/studyosService';

export const AcademicPdfs = () => {
	const [resources, setResources] = useState<AcademicResource[]>([]);
	const [loading, setLoading] = useState(true);
	const [openingId, setOpeningId] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		let isMounted = true;
		studyosService.listResources()
			.then(data => { if (isMounted) setResources(data); })
			.catch(requestError => {
				if (isMounted) setError(requestError instanceof Error ? requestError.message : 'Unable to load academic PDFs.');
			})
			.finally(() => { if (isMounted) setLoading(false); });
		return () => { isMounted = false; };
	}, []);

	const pdfs = resources.filter(resource =>
		resource.type.toLowerCase().includes('pdf') || resource.fileReference.toLowerCase().endsWith('.pdf')
	);

	const openPdf = async (resource: AcademicResource) => {
		setOpeningId(resource.id);
		setError('');
		try {
			const { url } = await studyosService.getDownloadUrl(resource.fileReference);
			window.location.assign(url);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Unable to open this PDF.');
		} finally {
			setOpeningId('');
		}
	};

	return (
		<section className="max-w-5xl mx-auto space-y-6 pb-10">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">Academic PDFs</h1>
				<p className="mt-1 text-sm text-slate-500">Course materials shared with your campus</p>
			</header>
			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading academic PDFs...</p>
			) : pdfs.length === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No academic PDFs are available.</p>
			) : (
				<ul className="divide-y divide-slate-200 border-y border-slate-200">
					{pdfs.map(resource => (
						<li key={resource.id} className="flex items-center justify-between gap-4 py-4">
							<div className="flex min-w-0 items-center gap-3">
								<FileText size={19} className="shrink-0 text-[var(--brand-blue)]" />
								<div className="min-w-0">
									<h2 className="truncate text-sm font-semibold text-slate-900">{resource.title}</h2>
									<p className="mt-1 text-xs text-slate-500">{resource.type} · {new Date(resource.createdAt).toLocaleDateString()}</p>
								</div>
							</div>
							<button type="button" onClick={() => void openPdf(resource)} disabled={openingId === resource.id} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
								{openingId === resource.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
								Open PDF
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
};
