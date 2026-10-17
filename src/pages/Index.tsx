import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { AccuracyTracker } from '@/components/AccuracyTracker';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { LiveMarketSteamTicker } from '@/components/LiveMarketSteamTicker';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { TeamNewsInjuryUpdates } from '@/components/TeamNewsInjuryUpdates';
import { LiveMatches } from '@/components/LiveMatches';
import { AISmartSlipGenerator } from '@/components/AISmartSlipGenerator';
import { UpcomingMatches } from '@/components/UpcomingMatches';
import { AIRecommendationsHub } from '@/components/AIRecommendationsHub';
import { DailyAIDigestBanner } from '@/components/DailyAIDigestBanner';
import { BreakingNewsTicker } from '@/components/BreakingNewsTicker';
import { PastResultsArchive } from '@/components/PastResultsArchive';
import { Features } from '@/components/Features';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HomeViewTabs, HomeViewMode } from '@/components/HomeViewTabs';
import { ScrollNavigator } from '@/components/ScrollNavigator';

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
  const [activeMode, setActiveMode] = useState<HomeViewMode>('predictions');

  useEffect(() => {
    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;
      setDeferredReady(true);
    };

    const timer = setTimeout(activate, 20000);
    window.addEventListener('scroll', activate, { passive: true, once: true });
    window.addEventListener('pointerdown', activate, { passive: true, once: true });
    window.addEventListener('keydown', activate, { passive: true, once: true });
    window.addEventListener('touchstart', activate, { passive: true, once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', activate);
      window.removeEventListener('pointerdown', activate);
      window.removeEventListener('keydown', activate);
      window.removeEventListener('touchstart', activate);
    };
  }, []);

  const handleModeChange = (mode: HomeViewMode) => {
    setActiveMode(mode);
    const contentTarget = document.getElementById('home-tab-content') || document.getElementById('section-predictions');
    if (contentTarget && window.scrollY > 300) {
      const yOffset = -90;
      const y = contentTarget.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="PredictPro — AI Pro Tips Today: Football Predictions & xG"
        description="Daily AI pro tips today & verified football predictions with 87% accuracy. Expected Goals (xG), Poisson probabilities, and banker picks across 40+ leagues."
        canonical="/"
        keywords="aipro tips today, aiprotips prediction today, AI football predictions today, accurate soccer predictions 100% free, premier league predictions this weekend, champions league AI tips, sure banker bets today, both teams to score BTTS tips, over 2.5 goals predictions, correct score mathematical model, expected goals xG football analytics"
        jsonLd={HOME_JSON_LD}
      />
      <Navbar />
      <LiveMarketSteamTicker />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Hero />
        <HomeViewTabs activeMode={activeMode} onModeChange={handleModeChange} />
        <div id="home-tab-content" />

        {/* 1. Primary Predictions View */}
        {(activeMode === 'predictions' || activeMode === 'all') && (
          <section id="section-predictions" className="py-4 space-y-3">
            <LeagueNavigationStrip />
            <MarketQuickStrip />
            <div className="container mx-auto px-4 max-w-6xl">
              <PredictionsDashboard />
            </div>
          </section>
        )}

        {/* 2. Live Matches & Accuracy Tracker View */}
        {(activeMode === 'live' || activeMode === 'all') && (
          <section id="section-live" className="py-8 bg-muted/20 border-t border-border/40">
            <div className="container mx-auto px-4 max-w-6xl space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <AccuracyTracker />
                </div>
                <div className="lg:col-span-2">
                  <ErrorBoundary compact>
                    <LiveMatches />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. AI Smart Slips & Acca Builder View */}
        {(activeMode === 'slips' || activeMode === 'all') && (
          <section id="section-slips" className="py-6 space-y-6 border-t border-border/40">
            <ErrorBoundary compact>
              <AISmartSlipGenerator />
            </ErrorBoundary>
            <ErrorBoundary compact>
              <AIRecommendationsHub />
            </ErrorBoundary>
          </section>
        )}

        {/* 4. Team News, Injury & Tactical Digest View */}
        {(activeMode === 'news' || activeMode === 'all') && (
          <section id="section-news" className="py-6 space-y-6 border-t border-border/40">
            <div className="container mx-auto px-4 max-w-6xl space-y-6">
              <ErrorBoundary compact>
                <BreakingNewsTicker />
              </ErrorBoundary>
              <ErrorBoundary compact>
                <DailyAIDigestBanner />
              </ErrorBoundary>
              <TeamNewsInjuryUpdates />
            </div>
          </section>
        )}

        {/* 5. Historical Archive, Upcoming & Accuracy Proof */}
        {(activeMode === 'archive' || activeMode === 'all') && (
          <section id="section-archive" className="py-8 space-y-6 border-t border-border/40 bg-muted/10">
            <div className="container mx-auto px-4 max-w-6xl space-y-6">
              <ErrorBoundary compact>
                <PastResultsArchive />
              </ErrorBoundary>
              <ErrorBoundary compact>
                <UpcomingMatches />
              </ErrorBoundary>
              <ErrorBoundary compact>
                <Features />
              </ErrorBoundary>
            </div>
          </section>
        )}

        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '700px' }}>
          <SEOAuthorityHub />
        </div>
      </main>
      <div style={{ contentVisibility: 'auto', containIntrinsicSize: '600px' }}>
        <Footer />
      </div>
      <ScrollNavigator />
    </div>
  );
};

export default Index;
