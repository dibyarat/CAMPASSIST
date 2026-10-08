import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { pollService } from '../../services/pollService';

type Poll = {
	id: string;
	title: string;
	description?: string | null;
	target: string;
	endDate?: string | null;
	options: { id: string; text: string; _count?: { votes?: number } }[];
};

export const Polls = () => {
	const [polls, setPolls] = useState<Poll[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let isMounted = true;
		pollService.listActive()
			.then(data => { if (isMounted) setPolls(data as Poll[]); })
			.catch(requestError => {
				if (isMounted) setError(requestError instanceof Error ? requestError.message : 'Unable to load active polls.');
			})
			.finally(() => { if (isMounted) setLoading(false); });
		return () => { isMounted = false; };
	}, []);

	return (
		<section className="max-w-5xl mx-auto space-y-6 pb-10">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">Active Polls</h1>
				<p className="mt-1 text-sm text-slate-500">Live poll results from the poll service</p>
			</header>
			{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
			{loading ? (
				<p role="status" className="py-12 text-center text-sm text-slate-500">Loading polls...</p>
			) : polls.length === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No active polls found.</p>
			) : (
				<div className="divide-y divide-slate-200 border-y border-slate-200">
					{polls.map(poll => {
						const votes = poll.options.reduce((total, option) => total + (option._count?.votes || 0), 0);
						return (
							<article key={poll.id} className="py-5">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<h2 className="text-base font-semibold text-slate-900">{poll.title}</h2>
										{poll.description && <p className="mt-1 text-sm text-slate-600">{poll.description}</p>}
										<p className="mt-2 text-xs text-slate-500">Target: {poll.target}{poll.endDate ? ` · Ends ${new Date(poll.endDate).toLocaleDateString()}` : ''}</p>
									</div>
									<span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"><BarChart3 size={14} />{votes} votes</span>
								</div>
								<ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
									{poll.options.map(option => (
										<li key={option.id} className="flex justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
											<span>{option.text}</span><span className="font-semibold text-slate-500">{option._count?.votes || 0}</span>
										</li>
									))}
								</ul>
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
};
