import React, { useEffect, useState } from 'react';
import { Tag, ExternalLink, Ticket, Clock, Loader2 } from 'lucide-react';
import { offerService } from '../../services/offerService';
import type { StudentOffer } from '../../services/offerService';

export const Offers = () => {
  const [offers, setOffers] = useState<StudentOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    offerService.list().then(setOffers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const claim = async (offer: StudentOffer) => {
    setClaiming(offer.id);
    try {
      await offerService.claim(offer.id);
      if (offer.claimUrl) window.open(offer.claimUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to claim offer', error);
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Tag className="text-blue-500" /> Student Offers & Ads
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div> : offers.length === 0 ? <div className="col-span-full text-center py-12 text-slate-500">No active offers.</div> : offers.map(offer => (
          <div key={offer.id} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col relative">
            <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
              {offer.discount}
            </div>
            
            <div className="p-6 pb-0 flex flex-col gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${offer.type.toLowerCase() === 'local' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                <Ticket size={28} />
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{offer.provider}</p>
                <h3 className="font-bold text-lg text-slate-900 leading-tight mb-2">{offer.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{offer.description}</p>
              </div>
            </div>
            
            <div className="p-6 pt-4 mt-auto">
              <div className="flex justify-between items-center mb-6">
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                  <Clock size={14} /> {offer.expiresAt ? `Ends ${new Date(offer.expiresAt).toLocaleDateString()}` : 'No expiry'}
                </span>
                <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs font-bold rounded-md border border-slate-100">
                  {offer.type}
                </span>
              </div>
              
              <button onClick={() => claim(offer)} disabled={claiming === offer.id} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-primary text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60">
                {claiming === offer.id ? <Loader2 size={16} className="animate-spin" /> : 'Claim Offer'} <ExternalLink size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
