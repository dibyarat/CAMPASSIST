import React from 'react';
import { Tag, ExternalLink, Ticket, Clock } from 'lucide-react';

export const Offers = () => {
  const offers = [
    {
      title: 'Spotify Premium Student',
      provider: 'Spotify',
      discount: '50% OFF',
      desc: 'Get Spotify Premium for half the price for up to 4 years.',
      expires: 'No expiry',
      type: 'Digital',
      logo: 'bg-green-100 text-green-600',
    },
    {
      title: 'GitHub Student Developer Pack',
      provider: 'GitHub',
      discount: 'FREE',
      desc: 'Free access to the best developer tools in one place.',
      expires: 'No expiry',
      type: 'Digital',
      logo: 'bg-slate-200 text-slate-800',
    },
    {
      title: 'Campus Cafe Combo Meal',
      provider: 'Campus Cafe',
      discount: '20% OFF',
      desc: 'Show your CampusMate ID to get 20% off on all combo meals.',
      expires: 'Ends in 2 days',
      type: 'Local',
      logo: 'bg-orange-100 text-orange-600',
    }
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Tag className="text-blue-500" /> Student Offers & Ads
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer, idx) => (
          <div key={idx} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col relative">
            <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
              {offer.discount}
            </div>
            
            <div className="p-6 pb-0 flex flex-col gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${offer.logo}`}>
                <Ticket size={28} />
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{offer.provider}</p>
                <h3 className="font-bold text-lg text-slate-900 leading-tight mb-2">{offer.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{offer.desc}</p>
              </div>
            </div>
            
            <div className="p-6 pt-4 mt-auto">
              <div className="flex justify-between items-center mb-6">
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                  <Clock size={14} /> {offer.expires}
                </span>
                <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs font-bold rounded-md border border-slate-100">
                  {offer.type}
                </span>
              </div>
              
              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-primary text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition">
                Claim Offer <ExternalLink size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
