import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { MatchScreener } from '@/components/MatchScreener';

export default function MatchScreenerPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Statistical Match Screener & Value Filter | PredictPro"
        description="Filter upcoming football matches by win probability, value edge percentage (+EV), expected goals (xG), BTTS likelihood, and odds brackets."
        keywords="football match screener, value bet filter, soccer statistical screening, positive expected value soccer, xG match filter"
      />
      <Navbar />

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            Quantitative Match Filter · Expected Goals (xG) &amp; Value Edge (+EV)
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Statistical Match Screener
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Filter upcoming fixtures across 40+ leagues by win probability, bookmaker value edge (+EV), total Expected Goals (xG), and BTTS rates.
          </p>
        </div>

        <MatchScreener />
      </main>

      <Footer />
    </div>
  );
}
