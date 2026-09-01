import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { MatchScreener } from '@/components/MatchScreener';
import { SlidersHorizontal } from 'lucide-react';
import { AdBannerHorizontal } from '@/components/AdBanner';

export default function MatchScreenerPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Statistical Match Screener & Value Filter | PredictPro"
        description="Filter upcoming soccer matches by AI win probability, value edge percentage (+EV), xG expectation, BTTS likelihood, and odds brackets."
        keywords="football match screener, value bet filter, soccer statistical screening, positive expected value soccer, AI football filter"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-24 pb-20 md:pb-12 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-black flex items-center gap-3">
            <SlidersHorizontal className="h-8 w-8 text-primary" />
            Statistical Match Screener
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build custom automated filters to uncover hidden high-edge value bets and accumulator legs based on probability models.
          </p>
        </div>

        <MatchScreener />

        <div className="my-8">
          <AdBannerHorizontal />
        </div>
      </main>

      <Footer />
    </div>
  );
}
