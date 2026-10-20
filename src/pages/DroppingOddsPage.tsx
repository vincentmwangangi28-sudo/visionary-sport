import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { DroppingOddsRadar } from '@/components/DroppingOddsRadar';

export default function DroppingOddsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Dropping Odds & Sharp Money Radar | Live Market Moves | PredictPro"
        description="Monitor sudden bookmaker odds drops, sharp betting syndicate movements, and market volume surges in real time across football fixtures."
        keywords="dropping odds, sharp betting money, market line movement, smart money football, odds movement radar, bookmaker odds drop"
      />
      <Navbar />

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            Live Bookmaker Line Movements · Syndicate Volume Tracker
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dropping Odds &amp; Sharp Money Radar
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Monitor sudden bookmaker price contractions, late team-news line shifts, and sharp market volume across European and global fixtures before kickoff.
          </p>
        </div>

        <DroppingOddsRadar />
      </main>

      <Footer />
    </div>
  );
}
