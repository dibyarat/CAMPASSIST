import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Tag, X, ExternalLink } from 'lucide-react';
import { offerService } from '../../services/offerService';
import type { StudentOffer } from '../../services/offerService';

export const Offers = () => {
	const [offers, setOffers] = useState<StudentOffer[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [form, setForm] = useState({
		title: '',
		provider: '',
		discount: '',
		description: '',
		type: 'Digital',
		expiresAt: '',
		claimUrl: '',
	});

	const load = () => {
		setLoading(true);
		offerService
			.list()
			.then(setOffers)
			.catch(console.error)
			.finally(() => setLoading(false));
	};

	useEffect(load, []);

	const create = async (event: React.FormEvent) => {
		event.preventDefault();
		setSubmitting(true);
		try {
			await offerService.create({ ...form, expiresAt: form.expiresAt || null });
			setForm({
				title: '',
				provider: '',
				discount: '',
				description: '',
				type: 'Digital',
				expiresAt: '',
				claimUrl: '',
			});
			setShowForm(false);
			load();
		} catch (error) {
			console.error('Failed to create offer', error);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="max-w-6xl mx-auto space-y-6 pb-10">
			<header className="flex justify-between items-center bg-white/70 dark:bg-slate-900/70 p-6 rounded-2xl border border-[var(--color-border)] shadow-xs">
				<div>
					<h1 className="text-2xl font-bold text-[var(--color-text)]">Offer Management</h1>
					<p className="text-sm text-[var(--color-muted)] mt-1">Publish current student discounts, academic perks, and partner offers.</p>
				</div>
				<button
					onClick={() => setShowForm((val) => !val)}
					className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-semibold hover:opacity-95 transition"
				>
					{showForm ? <X size={17} /> : <Plus size={17} />}
					{showForm ? 'Cancel' : 'New Offer'}
				</button>
			</header>

			{showForm && (
				<form
					onSubmit={create}
					className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl border border-[var(--color-border)] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
				>
					<div>
						<label htmlFor="offer-title" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
							Offer Title <span className="text-rose-500">*</span>
						</label>
						<input
							id="offer-title"
							required
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							placeholder="e.g. 50% Off Spotify Student"
							className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] text-sm"
						/>
					</div>

					<div>
						<label htmlFor="offer-provider" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
							Provider / Merchant <span className="text-rose-500">*</span>
						</label>
						<input
							id="offer-provider"
							required
							value={form.provider}
							onChange={(e) => setForm({ ...form, provider: e.target.value })}
							placeholder="e.g. Spotify"
							className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] text-sm"
						/>
					</div>

					<div>
						<label htmlFor="offer-discount" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
							Discount Value <span className="text-rose-500">*</span>
						</label>
						<input
							id="offer-discount"
							required
							value={form.discount}
							onChange={(e) => setForm({ ...form, discount: e.target.value })}
							placeholder="e.g. 50% OFF or Free Tier"
							className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] text-sm"
						/>
					</div>

					<div>
						<label htmlFor="offer-type" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
							Category / Type
						</label>
						<select
							id="offer-type"
							value={form.type}
							onChange={(e) => setForm({ ...form, type: e.target.value })}
							className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] text-sm"
						>
							<option value="Digital">Digital / Software</option>
							<option value="Campus">Campus / Bookstore</option>
							<option value="Food">Food & Dining</option>
							<option value="Travel">Travel & Transit</option>
							<option value="Other">Other</option>
						</select>
					</div>

					<div>
						<label htmlFor="offer-claim-url" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
							Redemption Website URL <span className="text-[var(--color-muted)] font-normal">(Optional)</span>
						</label>
						<input
							id="offer-claim-url"
							type="url"
							value={form.claimUrl}
							onChange={(e) => setForm({ ...form, claimUrl: e.target.value })}
							placeholder="https://example.com/student-discount"
							className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] text-sm"
						/>
					</div>

					<div>
						<label htmlFor="offer-expires" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
							Expiration Date & Time <span className="text-[var(--color-muted)] font-normal">(Optional)</span>
						</label>
						<input
							id="offer-expires"
							type="datetime-local"
							value={form.expiresAt}
							onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
							className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] text-sm"
						/>
					</div>

					<div className="md:col-span-2">
						<label htmlFor="offer-description" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
							Offer Details <span className="text-rose-500">*</span>
						</label>
						<textarea
							id="offer-description"
							required
							rows={3}
							value={form.description}
							onChange={(e) => setForm({ ...form, description: e.target.value })}
							placeholder="Describe how students can redeem this perk and any eligibility requirements."
							className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] text-sm"
						/>
					</div>

					<div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={() => setShowForm(false)}
							className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5 transition"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
						>
							{submitting ? 'Publishing…' : 'Publish Offer'}
						</button>
					</div>
				</form>
			)}

			{loading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="animate-spin text-blue-500" />
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{offers.map((item) => (
						<article
							key={item.id}
							className="bg-white/70 dark:bg-slate-900/70 p-5 rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-col justify-between"
						>
							<div>
								<div className="flex items-center justify-between">
									<span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
										<Tag size={18} />
									</span>
									<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
										{item.discount}
									</span>
								</div>
								<h2 className="font-bold text-lg text-[var(--color-text)] mt-3">{item.title}</h2>
								<p className="text-xs text-[var(--color-muted)] mt-0.5">{item.provider} · {item.type || 'Student Perk'}</p>
								<p className="text-sm text-[var(--color-text)]/80 mt-3 line-clamp-3">{item.description}</p>
							</div>
							{item.claimUrl && (
								<div className="mt-4 pt-3 border-t border-[var(--color-border)]">
									<a
										href={item.claimUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
									>
										Redemption Link <ExternalLink size={12} />
									</a>
								</div>
							)}
						</article>
					))}
					{offers.length === 0 && (
						<div className="col-span-full py-12 text-center text-sm text-[var(--color-muted)] bg-white/50 rounded-2xl border border-[var(--color-border)]">
							No active student offers published yet. Click &quot;New Offer&quot; above to add one.
						</div>
					)}
				</div>
			)}
		</div>
	);
};
