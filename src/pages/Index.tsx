import { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { AccuracyTracker } from '@/components/AccuracyTracker';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { LiveMarketSteamTicker } from '@/components/LiveMarketSteamTicker';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

const LiveMatches = lazy(() => import('@/components/LiveMatches').then((m) => ({ default: m.LiveMatches })));
const AISmartSlipGenerator = lazy(() =>
  import('@/components/AISmartSlipGenerator').then((m) => ({ default: m.AISmartSlipGenerator }))
);
const UpcomingMatches = lazy(() =>
  import('@/components/UpcomingMatches').then((m) => ({ default: m.UpcomingMatches }))
);
const AIRecommendationsHub = lazy(() =>
  import('@/components/AIRecommendationsHub').then((m) => ({ default: m.AIRecommendationsHub }))
);
const DailyAIDigestBanner = lazy(() =>
  import('@/components/DailyAIDigestBanner').then((m) => ({ default: m.DailyAIDigestBanner }))
);
const BreakingNewsTicker = lazy(() =>
  import('@/components/BreakingNewsTicker').then((m) => ({ default: m.BreakingNewsTicker }))
);
const PastResultsArchive = lazy(() =>
  import('@/components/PastResultsArchive').then((m) => ({ default: m.PastResultsArchive }))
);
const Features = lazy(() => import('@/components/Features').then((m) => ({ default: m.Features })));

const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://predictpro.guru/#website',
      name: 'PredictPro.guru — AI Football Predictions Today, Expected Goals (xG) & Value Betting Tips',
      alternateName: ['PredictPro', 'PredictPro.guru', 'PredictPro AI Football Analytics'],
      url: 'https://predictpro.guru',
      inLanguage: 'en',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://predictpro.guru/screener?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SportsOrganization',
      '@id': 'https://predictpro.guru/#organization',
      name: 'PredictPro.guru',
      url: 'https://predictpro.guru',
      logo: {
        '@type': 'ImageObject',
        url: 'https://predictpro.guru/pwa-512x512.png',
        width: 512,
        height: 512,
      },
      sport: 'Association Football (Soccer)',
      description:
        'Enterprise AI football prediction engine delivering 87% verified accuracy across Premier League, UEFA Champions League, La Liga, Serie A, Bundesliga, Ligue 1, KPL, and Mega Jackpot fixtures using Bivariate Poisson distributions, Expected Goals (xG), and Closing Line Value (+EV) models.',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://predictpro.guru/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How accurate are PredictPro.guru AI football predictions today?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PredictPro.guru achieves an 84% to 87% verified accuracy rate on high-confidence AI Banker Picks (75%+ certainty) by combining Bivariate Poisson goal modeling, Expected Goals (xG) differentials, ELO team strength ratings, and real-time market steam across 40+ global football leagues.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which leagues and betting markets does PredictPro.guru cover?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We provide daily mathematical predictions for the English Premier League (EPL), UEFA Champions League, La Liga, Serie A, Bundesliga, Ligue 1, Kenyan Premier League (KPL), MLS, and 17-game Mega & Midweek Jackpots across 1X2 Match Winner, Both Teams To Score (BTTS), Over/Under 2.5 Goals, Exact Correct Score, and Asian Handicap markets.',
          },
        },
      ],
    },
  ],
};

const Index = () => {
  const [deferredReady, setDeferredReady] = useState(false);

  useEffect(() => {
    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;
      setDeferredReady(true);
    };

    const timer = setTimeout(activate, 5500);
    window.addEventListener('scroll', activate, { passive: true, once: true });
    window.addEventListener('pointerdown', activate, { passive: true, once: true });
    window.addEventListener('keydown', activate, { passive: true, once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', activate);
      window.removeEventListener('pointerdown', activate);
      window.removeEventListener('keydown', activate);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="AI Football Predictions Today (87% Verified Accuracy) — EPL, Champions League, BTTS, xG & Mega Jackpot Tips | PredictPro.guru"
        description="Free AI football predictions today & tomorrow with 87% verified accuracy on Banker Bets. Mathematical 1X2, BTTS, Over 2.5 Goals, Correct Score, Expected Goals (xG) & 17-game Mega Jackpot tips across Premier League, Champions League, La Liga, Serie A & KPL."
        canonical="/"
        keywords="AI football predictions today, accurate soccer predictions 100% free, premier league predictions this weekend, champions league AI tips, sure banker bets today, both teams to score BTTS tips, over 2.5 goals predictions, correct score mathematical model, sportpesa mega jackpot 17 games predictions, expected goals xG football analytics"
        jsonLd={HOME_JSON_LD}
      />
      <Navbar />
      <LiveMarketSteamTicker />
      <main className="flex-1">
        <Hero />
        <LeagueNavigationStrip />

        {/* Accuracy Tracker + Live Matches side-by-side above predictions */}
        <section className="py-10 bg-muted/20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <AccuracyTracker />
              </div>
              <div className="lg:col-span-2">
                {deferredReady ? (
                  <Suspense fallback={<div className="h-48 rounded-2xl bg-card border border-border/50" />}>
                    <LiveMatches />
                  </Suspense>
                ) : (
                  <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col justify-between h-full">
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Live In-Play Scoreboard & Real-Time Odds</p>
                      <p className="text-xs text-muted-foreground">
                        Real-time match telemetry across Premier League, UEFA Champions League, La Liga, Serie A, and global competitions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeferredReady(true)}
                      className="mt-4 self-start min-h-[44px] px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                    >
                      Load Live Scoreboard Stream
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Primary Predictions Grid — Always Above the Fold */}
        <PredictionsDashboard />

        {/* Deferred Below-the-Fold Interactive Modules */}
        {deferredReady && (
          <Suspense fallback={null}>
            {/* Breaking Football News & Gemini Tactical Wire */}
            <section className="pt-8 pb-2">
              <div className="container mx-auto px-4 max-w-6xl">
                <BreakingNewsTicker />
              </div>
            </section>

            {/* Daily AI Digest & Featured Match of the Day */}
            <section className="py-6">
              <div className="container mx-auto px-4 max-w-6xl">
                <DailyAIDigestBanner />
              </div>
            </section>

            {/* AI Smart Slip Generator (One-Click Accumulator Builder) */}
            <AISmartSlipGenerator />

            {/* Upcoming Matches */}
            <UpcomingMatches />

            {/* AI Recommendations Hub (Top Value Bets, High Confidence, Correct Score, BTTS) */}
            <AIRecommendationsHub />

            {/* Past Results & Historical Accuracy Archive */}
            <section className="py-12 bg-muted/15 border-t border-border/50">
              <div className="container mx-auto px-4 max-w-6xl">
                <PastResultsArchive />
              </div>
            </section>

            <Features />
          </Suspense>
        )}

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
