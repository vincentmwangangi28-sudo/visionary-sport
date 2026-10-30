import { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { GlobalMatchdayCommandRibbon } from '@/components/GlobalMatchdayCommandRibbon';
import { Hero } from '@/components/Hero';
import { HomeViewTabs, HomeViewMode } from '@/components/HomeViewTabs';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import {
  Flame,
  Ticket,
  Trophy,
  ArrowRightLeft,
  Activity,
  LineChart,
  Share2,
  GitBranch,
  Tv,
  SlidersHorizontal,
  Crosshair,
  Users,
  Bell,
  Gift,
  Wallet,
} from 'lucide-react';

const LiveMatches = lazy(() =>
  import('@/components/LiveMatches').then((m) => ({ default: m.LiveMatches }))
);
const AISmartSlipGenerator = lazy(() =>
  import('@/components/AISmartSlipGenerator').then((m) => ({ default: m.AISmartSlipGenerator }))
);
const TeamNewsInjuryUpdates = lazy(() =>
  import('@/components/TeamNewsInjuryUpdates').then((m) => ({ default: m.TeamNewsInjuryUpdates }))
);
const PastResultsArchive = lazy(() =>
  import('@/components/PastResultsArchive').then((m) => ({ default: m.PastResultsArchive }))
);
const FooterFAQ = lazy(() =>
  import('@/components/FooterFAQ').then((m) => ({ default: m.FooterFAQ }))
);

const PRO_SPORTS_TOOLS = [
  {
    to: '/bet-tracker',
    title: 'Bet Tracker & ROI Ledger',
    tag: 'ESPN Auto-Grade',
    desc: 'Track personal wagers, CLV edge, bankroll curve & auto-settle vs live ESPN full-time scores.',
    icon: LineChart,
  },
  {
    to: '/in-play-edge',
    title: 'In-Play Momentum & Late-Goal Radar',
    tag: "75'+ Alerts",
    desc: 'Live attacking pressure index, trailing-favorite xG spikes & remaining-minutes Poisson edge.',
    icon: Activity,
  },
  {
    to: '/social-card-studio',
    title: 'Social Slip & Card Studio',
    tag: 'PNG Export',
    desc: 'Export 1080×1350 WhatsApp, Telegram & X share cards with regional SportyBet/Betika codes.',
    icon: Share2,
  },
  {
    to: '/tournament-simulator',
    title: 'Tournament Group Simulator',
    tag: '10,000 Runs',
    desc: 'Interactive group-stage score overrides with Monte Carlo Top-2 & knockout qualification odds.',
    icon: GitBranch,
  },
  {
    to: '/live-multiview',
    title: 'Live 4-Match Multi-View',
    tag: '2×2 Grid',
    desc: 'Monitor 4 simultaneous live fixtures with real-time xG momentum bars and synchronized alerts.',
    icon: Tv,
  },
  {
    to: '/closing-line-value',
    title: 'Closing Line Value (CLV) Scanner',
    tag: 'Sharp Steam',
    desc: 'Compare opening vs current market odds, no-vig fair probabilities, and reverse line movement.',
    icon: SlidersHorizontal,
  },
  {
    to: '/sgp-builder',
    title: 'Correlated SGP Copula Builder',
    tag: 'Gaussian Copula',
    desc: 'Price multi-leg Same-Game Parlays with mathematical correlation matrices vs bookie quotes.',
    icon: Crosshair,
  },
  {
    to: '/community-slips',
    title: 'Community Copy-Bet Feed',
    tag: '1-Click Copy',
    desc: 'Copy verified high-ROI community accumulators and regional booking codes directly to your slip.',
    icon: Users,
  },
  {
    to: '/cashout-calculator',
    title: 'Acca Cash-Out & Live Hedge Calculator',
    tag: 'Profit Lock',
    desc: 'Audit bookmaker Cash-Out haircuts and calculate exact 2-way or 3-way final-leg counter-hedge stakes.',
    icon: SlidersHorizontal,
  },
  {
    to: '/arbitrage-finder',
    title: 'Multi-Bookmaker Arbitrage & Surebet Matrix',
    tag: 'Surebet ROI',
    desc: 'Scan risk-free 2-way and 3-way surebets across SportyBet, Betika, Bet9ja, 1xBet, and Pinnacle.',
    icon: ArrowRightLeft,
  },
  {
    to: '/code-converter',
    title: 'Universal Booking Code Converter',
    tag: '7 Bookies',
    desc: 'Translate shared slip codes between SportyBet, Betika, SportPesa, Bet9ja, 1xBet, and Betway.',
    icon: Ticket,
  },
  {
    to: '/tipsters',
    title: 'Verified Tipsters & 30-Day Yield Hub',
    tag: 'CLV Ranked',
    desc: 'Follow verified quantitative analysts ranked by 30-day ROI, CLV beat rate, and 1-click VIP slip tailing.',
    icon: Users,
  },
  {
    to: '/player-props',
    title: 'Player Shots on Target & Referee Cards',
    tag: 'SOT & Cards',
    desc: 'Per-90 Poisson shots on target (1+ SOT, 2+ SOT) projections and referee booking strictness index.',
    icon: Crosshair,
  },
  {
    to: '/rollover-challenge',
    title: 'Compound Rollover & Profit-Skim Ladder',
    tag: 'Safe Skim',
    desc: 'Interactive 3-Day to 10-Day compound bankroll planner that skims daily profit into a protected vault.',
    icon: Wallet,
  },
  {
    to: '/asian-handicap-calculator',
    title: 'Quarter-Ball Asian Handicap Split Matrix',
    tag: '-0.25 / -0.75',
    desc: 'Exact 50/50 split-stake Half-Win, Half-Loss & Push payout matrix for Asian Handicap and 2.25/2.75 Goal Lines.',
    icon: SlidersHorizontal,
  },
  {
    to: '/syndicate-pools',
    title: '17-Game Jackpot Syndicates & Mini-Leagues',
    tag: 'Syndicate',
    desc: 'Pool multi-double Mega Jackpot permutation tickets or compete in private CLV Mini-Leagues with invite codes.',
    icon: Users,
  },
  {
    to: '/corner-stats-scanner',
    title: 'Corner Kick Tempo & Set-Piece Scanner',
    tag: 'O9.5 / 1H O4.5',
    desc: 'Per-90 wing-cross intensity, First-Half Over 4.5 Corners radar, and Poisson Corner Handicap value finder.',
    icon: Activity,
  },
  {
    to: '/cash-out-calculator',
    title: 'Cash-Out Equity & Live Hedge Optimizer',
    tag: 'Haircut Audit',
    desc: 'Expose hidden bookmaker Cash-Out haircuts (8%–18%) and calculate higher-paying DIY opposite hedges.',
    icon: SlidersHorizontal,
  },
  {
    to: '/referee-stats-scanner',
    title: 'Referee Discipline & Card Poisson Matrix',
    tag: 'Cards & PKs',
    desc: 'Per-90 referee yellow/red card profiler, booking points simulator, and derby card value scanner.',
    icon: Flame,
  },
  {
    to: '/player-props-lab',
    title: 'Player Shots on Target (SoT) & Goal Prop Lab',
    tag: '1+ / 2+ SoT',
    desc: 'Convert per-90 npxG, shot volume, and penalty duty into fair odds for 1+ SoT, 2+ SoT & Goalscorer markets.',
    icon: Crosshair,
  },
  {
    to: '/trixie-yankee-calculator',
    title: 'System Bet & Permutation Simulator',
    tag: 'Trixie / Yankee',
    desc: 'Fault-tolerant payout table for Trixie, Patent, Yankee, Lucky 15, Canadian, Heinz & k-of-n Round Robins.',
    icon: GitBranch,
  },
  {
    to: '/h2h',
    title: 'Dynamic Team H2H & Matchup Hub',
    tag: '10-Match H2H',
    desc: 'Compare head-to-head form, xG differential, BTTS %, and Poisson score grids with 1-click IndexNow push.',
    icon: Users,
  },
  {
    to: '/odds-comparison',
    title: 'Bookmaker Odds Line-Shopping Hub',
    tag: '6 Bookies',
    desc: 'Live 1X2, Over/Under 2.5, and BTTS price comparison across SportyBet, Betika, SportPesa, Bet9ja & 1xBet.',
    icon: ArrowRightLeft,
  },
  {
    to: '/seo-audit',
    title: 'Ahrefs SEO, Discover XML & IndexNow Command',
    tag: 'SERP & XML',
    desc: 'Inspect Google News/Discover XML feeds, 301 redirect matrix, Low-Hanging Fruit keywords & IndexNow dispatch.',
    icon: Activity,
  },
];

const HOME_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PredictPro AI Football Predictions & xG Analytics',
    alternateName: ['PredictPro', 'PredictPro Football Tips'],
    url: 'https://predictpro.guru',
    description:
      'Daily AI football predictions, banker picks, SportyBet/Betika/SportPesa booking codes, Expected Goals (xG) match previews, personal bet tracking, and live scores across 40+ leagues.',
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
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: 'PredictPro Football Intelligence',
    url: 'https://predictpro.guru',
    sport: 'Association Football',
    description:
      'AI-powered football predictions, Expected Goals (xG) telemetry, bivariate Poisson score distributions, live scores, personal bet tracking, and multi-bookmaker booking tools.',
  },
];

const Index = () => {
  const [activeMode, setActiveMode] = useState<HomeViewMode>('predictions');
  const [faqReady, setFaqReady] = useState(
    () => import.meta.env.MODE === 'test'
  );

  useEffect(() => {
    if (faqReady) return;
    let mounted = false;
    const enable = () => {
      if (mounted) return;
      mounted = true;
      setFaqReady(true);
    };
    const timer = setTimeout(enable, 2000);
    window.addEventListener('scroll', enable, { passive: true, once: true });
    window.addEventListener('pointerdown', enable, { passive: true, once: true });
    window.addEventListener('touchstart', enable, { passive: true, once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', enable);
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('touchstart', enable);
    };
  }, [faqReady]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="AI Football Predictions Today, xG & Live Odds | PredictPro"
        description="Free daily AI football predictions, 80%+ banker tips, Expected Goals (xG) models, SportyBet/Betika booking codes, and live scores across 40+ leagues."
        keywords="football predictions today, sure banker tips today, sportybet booking codes, betika jackpot predictions, expected goals xG, bet tracker, in-play momentum radar"
        canonical="/"
        schema={HOME_SCHEMA}
      />

      <Navbar />
      <GlobalMatchdayCommandRibbon />
      <Hero />

      {/* Workspace Mode Tabs (Fixtures & Odds | In-Play & TV | Acca Builder | Lineups & News | Results | All Views) */}
      <div className="border-b border-border bg-card/80 sticky top-16 z-30 backdrop-blur">
        <HomeViewTabs activeMode={activeMode} onModeChange={setActiveMode} />
      </div>

      <main id="main-content" className="flex-1 w-full">
        {/* Quick Action Strip */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 pt-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/best-bets"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <Flame className="h-3.5 w-3.5" />
                <span>80%+ Banker Picks</span>
              </Link>
              <Link
                to="/bet-tracker"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              >
                <LineChart className="h-3.5 w-3.5 text-primary" />
                <span>Bet Tracker &amp; ROI Ledger</span>
              </Link>
              <Link
                to="/in-play-edge"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              >
                <Activity className="h-3.5 w-3.5 text-rose-500" />
                <span>In-Play Late-Goal Radar</span>
              </Link>
              <Link
                to="/social-card-studio"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              >
                <Share2 className="h-3.5 w-3.5 text-primary" />
                <span>Social Card Studio</span>
              </Link>
              <Link
                to="/accumulator"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              >
                <Ticket className="h-3.5 w-3.5 text-primary" />
                <span>AI Acca Builder</span>
              </Link>
              <Link
                to="/booking-code-converter"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
                <span>Code Converter</span>
              </Link>
              <Link
                to="/jackpot-predictions"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>Jackpot Hub</span>
              </Link>
              <Link
                to="/h2h"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Team H2H Hub</span>
              </Link>
              <Link
                to="/odds-comparison"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-500" />
                <span>Odds Line-Shopping</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-card text-[11px] font-mono text-muted-foreground">
                <span className="font-semibold text-foreground">Locale:</span>
                <Link to="/?lang=en" className="px-1.5 py-0.5 rounded hover:bg-muted text-foreground font-bold">EN</Link>
                <Link to="/?lang=sw" className="px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground">SW</Link>
                <Link to="/?lang=fr" className="px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground">FR</Link>
                <Link to="/?lang=pt" className="px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground">PT</Link>
              </div>
              <Link
                to="/pick-em-challenge"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold transition-colors"
              >
                <Trophy className="h-3.5 w-3.5" />
                <span>Daily 5-Match Pick&apos;em</span>
              </Link>
              <Link
                to="/referrals"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors"
              >
                <Gift className="h-3.5 w-3.5" />
                <span>Invite &amp; Earn Coins</span>
              </Link>
            </div>
          </div>
        </section>

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

        {/* In-Play & Live Matches View */}
        {(activeMode === 'live' || activeMode === 'all') && (
          <Suspense fallback={<div className="min-h-[220px]" aria-hidden="true" />}>
            <LiveMatches />
          </Suspense>
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

        {/* Professional Sports Tools & Bet Tracking Suite (Commit 7771c93 + Phase 12) */}
        <section
          aria-label="Professional Sports Analytics Tools and Bet Tracking"
          className="cv-auto container mx-auto max-w-7xl px-4 sm:px-6 py-8 border-t border-border/60"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Pro Quantitative Suite &amp; Bet Tracking
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                Professional Sports Tools, In-Play Telemetry &amp; ROI Ledger
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
              <Link to="/h2h" className="text-muted-foreground hover:text-foreground">
                Team H2H Matrix →
              </Link>
              <Link to="/odds-comparison" className="text-muted-foreground hover:text-foreground">
                Odds Line-Shopping →
              </Link>
              <Link to="/xpts-standings" className="text-muted-foreground hover:text-foreground">
                xPTS Justice Table →
              </Link>
              <Link to="/pitch-telemetry" className="text-muted-foreground hover:text-foreground">
                2D Shot Map &amp; xT →
              </Link>
              <a
                href="/sitemap-discover-news.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground font-mono"
              >
                Discover XML Feed ↗
              </a>
              <Link to="/alert-center" className="text-emerald-400 hover:underline inline-flex items-center gap-1">
                <Bell className="h-3.5 w-3.5" />
                Telegram &amp; Push Alerts →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRO_SPORTS_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.to}
                  to={tool.to}
                  className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                        {tool.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-primary">
                    Launch Tool →
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Contained FAQ Section */}
        <div className="cv-auto container mx-auto max-w-7xl px-4 sm:px-6">
          {faqReady ? (
            <Suspense fallback={<div className="min-h-[160px]" aria-hidden="true" />}>
              <FooterFAQ />
            </Suspense>
          ) : (
            <div className="min-h-[160px]" aria-hidden="true" />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
