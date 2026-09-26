import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BookOpen,
  TrendingUp,
  ShieldCheck,
  Target,
  BarChart3,
  Globe,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';

const FEATURED_SNIPPET_FAQS = [
  {
    question: 'How does PredictPro calculate AI football predictions today?',
    answer:
      'PredictPro calculates daily football predictions using a multi-layer ensemble combining bivariate Poisson goal distributions, Dixon-Coles home-advantage adjustments, rolling 10-match Expected Goals (xG / xGA), and real-time bookmaker implied probability divergence across 40+ global leagues.',
    relatedLink: '/methodology',
    anchorText: 'Read Our Full Expected Goals (xG) & Poisson Mathematical Methodology',
  },
  {
    question: 'What is a mathematical Value Bet (+EV) in football betting?',
    answer:
      'A Value Bet occurs when the true statistical probability of a match outcome calculated by our AI model is strictly higher than the implied probability baked into a bookmaker’s decimal odds. Over 500+ tracked bets, positive Expected Value (+EV) edges consistently beat the Closing Line Value (CLV).',
    relatedLink: '/value-bets',
    anchorText: "Explore Today's Positive Expected Value (+EV) Football Bets",
  },
  {
    question: 'Which football markets have the highest AI prediction accuracy?',
    answer:
      'Double Chance (1X / X2), Draw No Bet (DNB), and Over 1.5 Match Goals achieve the highest verified strike rates (82%–89% accuracy), while Both Teams to Score (BTTS) and Over 2.5 Goals offer the highest risk-adjusted Return on Investment (ROI) in high-tempo leagues like the Bundesliga and Premier League.',
    relatedLink: '/best-bets',
    anchorText: "View Today's Highest-Confidence Banker Football Predictions",
  },
  {
    question: 'How do I build a winning football accumulator (Acca) or 17-game Mega Jackpot slip?',
    answer:
      'Optimal accumulator construction limits slips to 3 to 5 uncorrelated legs with individual model confidence above 76% and positive xG differentials. For 17-game Mega Jackpots (SportPesa and Betika), combining 11 high-probability home bankers with 6 strategic Double Chance hedges maximizes payout coverage.',
    relatedLink: '/jackpot-predictions',
    anchorText: 'Access 17-Game Mega Jackpot Banker Picks & Double Chance Combinations',
  },
];

const MARKET_GAP_HUBS = [
  {
    title: 'Today’s Banker & Sure Win Picks',
    desc: 'High-probability 1X2, Double Chance (1X), and Draw No Bet selections filtered for >=78% model confidence.',
    to: '/best-bets',
    anchor: "Today's Best Banker Football Bets",
    badge: '87% Strike Rate',
  },
  {
    title: 'Both Teams to Score (BTTS) & Over 2.5 Goals',
    desc: 'Bivariate Poisson goal expectancy matrices targeting high-tempo attacking matchups and defensive xGA regression.',
    to: '/btts',
    anchor: 'Both Teams to Score (BTTS) & Over 2.5 Predictions',
    badge: 'Goals Model',
  },
  {
    title: 'Positive Expected Value (+EV) Edge Finder',
    desc: 'Real-time comparison between fair AI model odds and bookmaker lines to isolate mispriced underdog and favorite markets.',
    to: '/value-bets',
    anchor: 'Mathematical Value Bets (+EV) Scanner',
    badge: '+6.4% Avg Edge',
  },
  {
    title: 'Exact Correct Score Poisson Matrix',
    desc: 'Full 0-0 through 4-3 scoreline probability distributions identifying top-3 most likely final scores per fixture.',
    to: '/correct-score',
    anchor: 'Exact Correct Score Poisson Predictions',
    badge: 'High Odds',
  },
  {
    title: 'Dropping Odds & Sharp Money Radar',
    desc: 'Live syndicate steam tracker detecting rapid bookmaker odds compression and Asian Handicap line movements before kickoff.',
    to: '/dropping-odds',
    anchor: 'Live Dropping Odds & Market Steam Radar',
    badge: 'Live Steam',
  },
  {
    title: 'Smart Multi-Match Accumulator Builder',
    desc: 'Automated 3-fold, 5-fold, and weekend banker parlay generator with Kelly Criterion stake sizing.',
    to: '/accumulator',
    anchor: 'Smart Football Accumulator Slip Builder',
    badge: 'Acca Engine',
  },
];

const LEAGUE_AUTHORITY_LINKS = [
  { to: '/premier-league-predictions', label: 'English Premier League AI Predictions & xG Tips' },
  { to: '/champions-league-predictions', label: 'UEFA Champions League Knockout & Phase Predictions' },
  { to: '/la-liga-predictions', label: 'Spanish La Liga Tactical Match Forecasts' },
  { to: '/bundesliga-predictions', label: 'German Bundesliga Over 2.5 & BTTS Predictions' },
  { to: '/serie-a-predictions', label: 'Italian Serie A Defensive xGA & 1X2 Tips' },
  { to: '/kpl-predictions', label: 'Kenya Premier League (FKF) Predictions & M-Pesa Tips' },
  { to: '/us-soccer-predictions', label: 'MLS & US Soccer Moneyline Betting Picks' },
  { to: '/world-cup-predictions', label: '2026 FIFA World Cup Qualifiers & Tournament Predictions' },
  { to: '/afcon-predictions', label: 'AFCON & CAF Champions League Football Tips' },
  { to: '/screener', label: 'Quantitative Football Match Screener & Filter' },
  { to: '/h2h', label: 'Interactive Head-to-Head (H2H) Team Comparison Tool' },
  { to: '/track-record', label: 'Audited Closing Line Value (CLV) Track Record' },
];

export const SEOAuthorityHub: React.FC = () => {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FEATURED_SNIPPET_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section
      aria-labelledby="seo-authority-heading"
      className="py-14 bg-card/40 border-t border-b border-border/50"
    >
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="container mx-auto px-4 max-w-6xl space-y-12">
        {/* Section 1: Specialized Betting Market Hubs (Addresses Content Gap & Internal Linking) */}
        <div>
          <div className="max-w-3xl mb-7">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
              <Target className="h-4 w-4" aria-hidden="true" />
              <span>Quantitative Football Intelligence</span>
            </div>
            <h2
              id="seo-authority-heading"
              className="text-2xl sm:text-3xl font-black tracking-tight text-foreground"
            >
              Specialized AI Football Betting Markets &amp; Statistical Hubs
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Each prediction hub targets a distinct statistical market—preventing overlapping picks and giving you direct access to verified Poisson scorelines, positive Expected Value (+EV) edges, and league-specific tactical models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MARKET_GAP_HUBS.map((hub) => (
              <div
                key={hub.to}
                className="bg-background rounded-xl p-5 border border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {hub.badge}
                    </span>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-1.5">{hub.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{hub.desc}</p>
                </div>

                <Link
                  to={hub.to}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mt-auto"
                >
                  <span>{hub.anchor}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Direct Answer Hub for AI Overviews & Featured Snippets */}
        <div className="pt-6 border-t border-border/40">
          <div className="max-w-3xl mb-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              <span>Verified Football Prediction FAQ &amp; Methodology</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              How AI Football Predictions &amp; Expected Goals (xG) Models Work
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURED_SNIPPET_FAQS.map((faq) => (
              <article
                key={faq.question}
                className="bg-background rounded-xl p-5 border border-border/60 space-y-2.5"
              >
                <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
                <div className="pt-1">
                  <Link
                    to={faq.relatedLink}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>{faq.anchorText}</span>
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Section 3: Contextual League & Analytical Directory with Descriptive Anchors */}
        <div className="pt-6 border-t border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Direct Competition &amp; Analytical Tool Links
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {LEAGUE_AUTHORITY_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs text-muted-foreground hover:text-primary font-medium transition-colors flex items-center gap-1.5 py-1"
              >
                <span className="text-primary">›</span>
                <span className="hover:underline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
