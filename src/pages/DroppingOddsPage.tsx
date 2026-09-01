import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { DroppingOddsRadar } from '@/components/DroppingOddsRadar';
import { TrendingDown, ShieldAlert, Sparkles } from 'lucide-react';
import { AdBannerHorizontal } from '@/components/AdBanner';

export default function DroppingOddsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Dropping Odds & Smart Money Radar | Real-Time Market Moves | PredictPro"
        description="Monitor sudden bookmaker odds drops, sharp betting syndicate movements, and market volume surges in real time across football fixtures."
        keywords="dropping odds, sharp betting money, market line movement, smart money football, odds movement radar, bookmaker odds drop"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-24 pb-20 md:pb-12 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-black flex items-center gap-3">
            <TrendingDown className="h-8 w-8 text-rose-500" />
            Dropping Odds & Sharp Money
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track when professional betting syndicates and insider news cause bookmaker lines to plummet. Capitalize before bookies adjust further.
          </p>
        </div>

        <DroppingOddsRadar />

        <div className="my-8">
          <AdBannerHorizontal />
        </div>
      </main>

      <Footer />
    </div>
  );
}
