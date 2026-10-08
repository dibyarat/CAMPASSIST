import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Tag } from 'lucide-react';
import { offerService } from '../../services/offerService';
import type { StudentOffer } from '../../services/offerService';

export const Offers = () => {
	const [offers, setOffers] = useState<StudentOffer[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState({ title: '', provider: '', discount: '', description: '', type: 'Digital', expiresAt: '', claimUrl: '' });
	const load = () => { setLoading(true); offerService.list().then(setOffers).catch(console.error).finally(() => setLoading(false)); };
	useEffect(load, []);
	const create = async (event: React.FormEvent) => { event.preventDefault(); try { await offerService.create({ ...form, expiresAt: form.expiresAt || null }); setForm({ title: '', provider: '', discount: '', description: '', type: 'Digital', expiresAt: '', claimUrl: '' }); setShowForm(false); load(); } catch (error) { console.error('Failed to create offer', error); } };
	return <div className="max-w-6xl mx-auto space-y-6 pb-10">
		<header className="flex justify-between items-center bg-white/60 p-6 rounded-2xl border border-slate-100"><div><h1 className="text-2xl font-bold">Offer Management</h1><p className="text-slate-500 mt-1">Publish current student discounts and partner offers.</p></div><button onClick={() => setShowForm(value => !value)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-semibold"><Plus size={17} /> New Offer</button></header>
		{showForm && <form onSubmit={create} className="bg-white/60 p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">{(['title', 'provider', 'discount', 'type', 'claimUrl'] as const).map(field => <input key={field} required={field !== 'claimUrl'} value={form[field]} onChange={event => setForm({ ...form, [field]: event.target.value })} placeholder={field[0].toUpperCase() + field.slice(1)} className="px-4 py-2.5 rounded-xl border border-slate-200" />)}<input type="datetime-local" value={form.expiresAt} onChange={event => setForm({ ...form, expiresAt: event.target.value })} className="px-4 py-2.5 rounded-xl border border-slate-200" /><textarea required value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Description" className="md:col-span-2 px-4 py-2.5 rounded-xl border border-slate-200" /><button className="md:col-span-2 w-fit px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold">Publish Offer</button></form>}
		{loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div> : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{offers.map(item => <article key={item.id} className="bg-white/60 p-5 rounded-2xl border border-slate-100"><Tag className="text-blue-600" /><h2 className="font-bold text-lg mt-3">{item.title}</h2><p className="text-sm text-slate-500">{item.provider} · {item.discount}</p><p className="text-sm text-slate-600 mt-3">{item.description}</p></article>)}</div>}
	</div>;
};
