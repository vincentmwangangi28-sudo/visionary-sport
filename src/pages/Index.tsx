import { Suspense, startTransition, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { GlobalMatchdayCommandRibbon } from '@/components/GlobalMatchdayCommandRibbon';
import { Hero } from '@/components/Hero';
import { HomeViewTabs, HomeViewMode } from '@/components/HomeViewTabs';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { lazyWithRetry } from '@/lib/lazyWithRetry';
import { HomeDownloadAppBanner } from '@/components/PWAInstallButton';
import { triggerPWAInstallFlow } from '@/hooks/usePWAInstall';
import { DailyTopFiveBestBets } from '@/components/DailyTopFiveBestBets';
import {
  Flame,
  Ticket,
  Trophy,
  ArrowRightLeft,
  Activity,
  LineChart,
  Share2,
  SlidersHorizontal,
  Users,
  Gift,
  Download,
} from 'lucide-react';

const FooterFAQ = lazyWithRetry(() =>
  import('@/components/FooterFAQ').then((m) => ({ default: m.FooterFAQ }))
);
const LiveMatches = lazyWithRetry(() =>
  import('@/components/LiveMatches').then((m) => ({ default: m.LiveMatches }))
);
const AISmartSlipGenerator = lazyWithRetry(() =>
  import('@/components/AISmartSlipGenerator').then((m) => ({ default: m.AISmartSlipGenerator }))
);
const TeamNewsInjuryUpdates = lazyWithRetry(() =>
  import('@/components/TeamNewsInjuryUpdates').then((m) => ({ default: m.TeamNewsInjuryUpdates }))
);
const PastResultsArchive = lazyWithRetry(() =>
  import('@/components/PastResultsArchive').then((m) => ({ default: m.PastResultsArchive }))
);
const LiveApiIntelligenceSuite = lazyWithRetry(() =>
  import('@/components/LiveApiIntelligenceSuite').then((m) => ({ default: m.LiveApiIntelligenceSuite }))
);
const HomeProToolsGrid = lazyWithRetry(() =>
  import('@/components/HomeProToolsGrid').then((m) => ({ default: m.HomeProToolsGrid }))
);

function DeferredSection({
  children,
  minHeightClass = 'min-h-[280px]',
}: {
  children: React.ReactNode;
  minHeightClass?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(
    () =>
      import.meta.env.MODE === 'test' ||
      (typeof navigator !== 'undefined' &&
        /googlebot|ahrefsbot|bingbot|yandex|duckduckbot|slurp|applebot/i.test(
          navigator.userAgent || ''
        ))
  );

  useEffect(() => {
    if (visible) return;
    let settled = false;
    const reveal = () => {
      if (settled) return;
      settled = true;
      setVisible(true);
    };

    if (typeof IntersectionObserver !== 'undefined' && hostRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            reveal();
            observer.disconnect();
          }
        },
        { rootMargin: '320px 0px' }
      );
      observer.observe(hostRef.current);
      return () => observer.disconnect();
    }

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchstart', 'scroll'];
    const onInteract = () => reveal();
    events.forEach((evt) => window.addEventListener(evt, onInteract, { once: true, passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onInteract));
    };
  }, [visible]);

  return (
    <div ref={hostRef} className={visible ? undefined : minHeightClass}>
      {visible ? children : null}
    </div>
  );
}

const HOME_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PredictPro — Football Match Statistics, Live Scores & xG',
    alternateName: ['PredictPro', 'PredictPro Football Tips'],
    url: 'https://www.predictpro.guru',
    description:
      'Football match statistics, live scores, league standings, Expected Goals (xG) models, and Bivariate Poisson probability analysis across 40+ global leagues.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.predictpro.guru/screener?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: 'PredictPro Football Intelligence',
    url: 'https://www.predictpro.guru',
    sport: 'Association Football',
    description:
      'AI-powered football predictions, Expected Goals (xG) telemetry, bivariate Poisson score distributions, live scores, personal bet tracking, and multi-bookmaker booking tools.',
  },
];

const Index = () => {
  const [activeMode, setActiveMode] = useState<HomeViewMode>('predictions');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="PredictPro — Football Match Statistics, Live Scores & xG"
        description="Football match statistics, live scores, league standings, Expected Goals (xG) models, and Bivariate Poisson probability analysis across 40+ global leagues."
        keywords="football predictions today, sure banker tips today, sportybet booking codes, betika jackpot predictions, expected goals xG, bet tracker, in-play momentum radar"
        canonical="/"
        schema={HOME_SCHEMA}
      />

      <Navbar />
      <GlobalMatchdayCommandRibbon />
      <Hero />

      {/* Workspace Mode Tabs (Fixtures & Odds | In-Play & TV | Acca Builder | Lineups & News | Results | All Views) */}
      <div className="border-b border-border bg-card/80 sticky top-16 z-30 backdrop-blur">
        <HomeViewTabs
          activeMode={activeMode}
          onModeChange={(nextMode) => startTransition(() => setActiveMode(nextMode))}
        />
      </div>

      <main id="main-content" className="flex-1 w-full">
        {/* Quick Action Strip (Single-row horizontal scroll on mobile for zero CLS) */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 pt-5">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar lg:flex-wrap min-h-[36px]">
            <div className="flex items-center gap-2 shrink-0 lg:flex-wrap">
              <Link
                to="/best-bets"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors shadow-2xs shrink-0"
              >
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                <span>80%+ Banker Picks</span>
              </Link>
              <Link
                to="/pro-command-center"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-foreground text-xs font-bold transition-colors shrink-0"
              >
                <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Pro Command Center</span>
              </Link>
              <Link
                to="/bet-tracker"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors shrink-0"
              >
                <LineChart className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Bet Tracker &amp; ROI Ledger</span>
              </Link>
              <Link
                to="/in-play-edge"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors shrink-0"
              >
                <Activity className="h-3.5 w-3.5 text-rose-700 dark:text-rose-400" aria-hidden="true" />
                <span>In-Play Late-Goal Radar</span>
              </Link>
              <Link
                to="/social-card-studio"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors shrink-0"
              >
                <Share2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Social Card Studio</span>
              </Link>
              <Link
                to="/accumulator"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors shrink-0"
              >
                <Ticket className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>AI Acca Builder</span>
              </Link>
              <Link
                to="/booking-code-converter"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors shrink-0"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Code Converter</span>
              </Link>
              <Link
                to="/jackpot-predictions"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors shrink-0"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                <span>Jackpot Hub</span>
              </Link>
              <Link
                to="/h2h"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors shrink-0"
              >
                <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Team H2H Hub</span>
              </Link>
              <Link
                to="/arbitrage-finder"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors shrink-0"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span>Odds Line-Shopping</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 shrink-0 lg:flex-wrap">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-card text-[11px] font-mono text-muted-foreground shrink-0">
                <span className="font-semibold text-foreground">Locale:</span>
                <Link to="/?lang=en" className="px-1.5 py-0.5 rounded hover:bg-muted text-foreground font-bold">EN</Link>
                <Link to="/?lang=sw" className="px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground">SW</Link>
                <Link to="/?lang=fr" className="px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground">FR</Link>
                <Link to="/?lang=pt" className="px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground">PT</Link>
              </div>
              <Link
                to="/pick-em-challenge"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 text-xs font-bold transition-colors shrink-0"
              >
                <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Daily 5-Match Pick&apos;em</span>
              </Link>
              <Link
                to="/referrals"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 text-xs font-bold transition-colors shrink-0"
              >
                <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Invite &amp; Earn Coins</span>
              </Link>
              <button
                type="button"
                onClick={triggerPWAInstallFlow}
                aria-haspopup="dialog"
                aria-label="Download App — Install PredictPro"
                data-testid="home-quickstrip-download-app-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/15 hover:bg-primary/25 text-foreground text-xs font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-none shrink-0 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Download App</span>
              </button>
            </div>
          </div>
        </section>

        {/* Home Screen Download App Banner */}
        <HomeDownloadAppBanner />

        {/* Daily Top 5 Best Bets (Bivariate Poisson High-Probability Filter) */}
        {(activeMode === 'predictions' || activeMode === 'all') && <DailyTopFiveBestBets />}

        {/* Primary Matchday Predictions Workspace */}
        {(activeMode === 'predictions' || activeMode === 'all') && (
          <section
            id="section-predictions"
            aria-label="Matchday Fixtures and AI Predictions"
            className="container mx-auto max-w-7xl px-4 sm:px-6 py-6"
          >
            <PredictionsDashboard />
          </section>
        )}

        {/* Complete 8-Feature Live API Intelligence Suite (Scorers/Props, Extended Markets, Injuries, Win-Prob Momentum, Referee Cards, Club Schedule, Knockout Brackets, Live News) */}
        {(activeMode === 'predictions' || activeMode === 'api_suite' || activeMode === 'all') && (
          <section
            id="section-api-intelligence"
            aria-label="Live API Football Intelligence, Player Props and Extended Markets"
            className="container mx-auto max-w-7xl px-4 sm:px-6 py-4"
          >
            <DeferredSection minHeightClass="min-h-[320px]">
              <Suspense fallback={<div className="min-h-[320px]" aria-hidden="true" />}>
                <LiveApiIntelligenceSuite />
              </Suspense>
            </DeferredSection>
          </section>
        )}

        {/* In-Play & Live Matches View */}
        {(activeMode === 'live' || activeMode === 'all') && (
          <div className="cv-auto">
            <Suspense fallback={<div className="min-h-[220px]" aria-hidden="true" />}>
              <LiveMatches />
            </Suspense>
          </div>
        )}

        {/* AI Smart Slip Generator View */}
        {(activeMode === 'slips' || activeMode === 'all') && (
          <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-6">
            <Suspense fallback={<div className="min-h-[260px]" aria-hidden="true" />}>
              <AISmartSlipGenerator />
            </Suspense>
          </section>
        )}

        {/* Team News & Injury Impact View */}
        {(activeMode === 'news' || activeMode === 'all') && (
          <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-6">
            <Suspense fallback={<div className="min-h-[220px]" aria-hidden="true" />}>
              <TeamNewsInjuryUpdates />
            </Suspense>
          </section>
        )}

        {/* Past Results Archive View */}
        {(activeMode === 'archive' || activeMode === 'all') && (
          <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-6">
            <Suspense fallback={<div className="min-h-[220px]" aria-hidden="true" />}>
              <PastResultsArchive />
            </Suspense>
          </section>
        )}

        {/* Professional Sports Tools & Bet Tracking Suite (Deferred below the fold) */}
        <DeferredSection minHeightClass="min-h-[420px]">
          <Suspense fallback={<div className="min-h-[420px]" aria-hidden="true" />}>
            <HomeProToolsGrid />
          </Suspense>
        </DeferredSection>

        {/* Contained FAQ Section */}
        <div className="cv-auto container mx-auto max-w-7xl px-4 sm:px-6">
          <DeferredSection minHeightClass="min-h-[240px]">
            <Suspense fallback={<div className="min-h-[240px]" aria-hidden="true" />}>
              <FooterFAQ />
            </Suspense>
          </DeferredSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
