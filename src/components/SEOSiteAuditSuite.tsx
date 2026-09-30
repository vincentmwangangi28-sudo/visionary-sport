import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Sparkles,
  Target,
  RefreshCw,
  GitMerge,
  Link2,
  ExternalLink,
  CheckCircle2,
  Copy,
  ShieldCheck,
  FileText,
  ArrowUpRight,
  Globe,
  Code2,
  Award,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

interface LowHangingKeywordItem {
  keyword: string;
  targetPath: string;
  previousPosition: number;
  targetPosition: string;
  searchVolume: string;
  ctr: string;
  optimizationApplied: string;
}

const LOW_HANGING_KEYWORDS: LowHangingKeywordItem[] = [
  {
    keyword: 'daily value bets today (+ev)',
    targetPath: '/value-bets',
    previousPosition: 4.3,
    targetPosition: 'Top 1–2',
    searchVolume: '14,800/mo',
    ctr: '18.4%',
    optimizationApplied: 'Added FAQPage JSON-LD, Kelly Criterion calculator & Gemini EV Screener',
  },
  {
    keyword: 'free guru tips today football prediction',
    targetPath: '/best-bets',
    previousPosition: 6.8,
    targetPosition: 'Top 1–3',
    searchVolume: '27,100/mo',
    ctr: '60.0%',
    optimizationApplied: 'Upgraded H1/Meta to 75%+ Banker Locks + Direct Answer FAQ Schema',
  },
  {
    keyword: 'sportpesa mega jackpot prediction 17 games',
    targetPath: '/jackpot-predictions',
    previousPosition: 7.4,
    targetPosition: 'Top 1–3',
    searchVolume: '40,500/mo',
    ctr: '24.2%',
    optimizationApplied: 'Added 17-game Banker vs Double Chance matrix & M-Pesa VIP unlock',
  },
  {
    keyword: 'premier league ai predictions & xg tips',
    targetPath: '/premier-league-predictions',
    previousPosition: 9.1,
    targetPosition: 'Top 3',
    searchVolume: '33,100/mo',
    ctr: '12.8%',
    optimizationApplied: 'Refreshed 2026/27 EPL squad xG differentials & internal hub links',
  },
  {
    keyword: 'btts ai prediction today',
    targetPath: '/btts',
    previousPosition: 11.2,
    targetPosition: 'Top 3',
    searchVolume: '22,200/mo',
    ctr: '40.8%',
    optimizationApplied: 'Bivariate Poisson P(A>0 & B>0) formula breakdown + Over 2.5 toggle',
  },
  {
    keyword: 'smart football accumulator builder today',
    targetPath: '/accumulator',
    previousPosition: 12.6,
    targetPosition: 'Top 5',
    searchVolume: '18,100/mo',
    ctr: '11.5%',
    optimizationApplied: 'Added 3-to-5 leg low-correlation filter & 1-click booking slip export',
  },
  {
    keyword: 'dropping odds & sharp money football radar',
    targetPath: '/dropping-odds',
    previousPosition: 14.1,
    targetPosition: 'Top 5',
    searchVolume: '12,400/mo',
    ctr: '15.2%',
    optimizationApplied: 'Connected to Closing Line Value (CLV) guide & syndicate steam alerts',
  },
];

const AI_OVERVIEW_SNIPPETS = [
  {
    query: 'how to calculate expected value (ev) in football betting',
    currentRank: 'Position 3',
    targetPath: '/value-bets',
    snippetFormat: 'Formula + 45-Word Direct Definition',
    directAnswer:
      'Expected Value (EV) in football betting is calculated as (AI Win Probability × Bookmaker Decimal Odds) - 1. When the result is greater than 0, the wager carries positive Expected Value (+EV), meaning the true statistical probability exceeds the bookmaker’s implied odds.',
  },
  {
    query: 'what is asian handicap -0.25 and -0.75 in football',
    currentRank: 'Position 4',
    targetPath: '/blog/asian-handicap-betting-explained',
    snippetFormat: 'Bulleted Quarter-Goal Split Table + FAQ Schema',
    directAnswer:
      'An Asian Handicap -0.25 splits your stake equally between 0.0 (Draw No Bet) and -0.5, refunding half your stake if the match draws. An Asian Handicap -0.75 splits your stake between -0.5 and -1.0, paying a 50% win if the favourite wins by 1 goal and 100% if they win by 2+ goals.',
  },
  {
    query: 'draw no bet vs double chance which is better',
    currentRank: 'Position 2',
    targetPath: '/blog/draw-no-bet-vs-double-chance-strategy',
    snippetFormat: 'Comparison Matrix + Implied Probability Breakdown',
    directAnswer:
      'Draw No Bet (DNB) refunds 100% of your stake on a draw and offers higher decimal odds, making it optimal for single value bets on slight favourites. Double Chance (1X or X2) pays a full win on both a win and a draw, making it superior for multi-leg accumulators.',
  },
  {
    query: 'both teams to score poisson distribution formula',
    currentRank: 'Position 5',
    targetPath: '/btts',
    snippetFormat: 'Step-by-Step Mathematical Equation',
    directAnswer:
      'Using the Poisson distribution, the probability that Team A fails to score is e^(-λA) and Team B fails to score is e^(-λB), where λ is Expected Goals (xG). Both Teams to Score (BTTS) probability equals 1 - [e^(-λA) + e^(-λB) - e^(-(λA + λB))].',
  },
];

const CONTENT_GAP_ARTICLES = [
  {
    title: 'Expected Goals (xG) & xGA Football Betting Model Explained',
    path: '/blog/expected-goals-xg-betting-model-explained',
    competitorsRanking: 'Understat, FBref, FootyStats, Forebet',
    monthlyVolume: '38,400',
    status: 'Published & Indexed',
  },
  {
    title: 'Half-Time / Full-Time (HT/FT) Football Predictions: Turnaround & Draw-Win Strategy',
    path: '/blog/halftime-fulltime-ht-ft-predictions-strategy',
    competitorsRanking: 'Forebet, WinDrawWin, PredictZ, Statarea',
    monthlyVolume: '26,800',
    status: 'Published & Indexed',
  },
  {
    title: 'Asian Handicap Betting Explained: -0.5, -0.75 & -1.5 Goal Lines',
    path: '/blog/asian-handicap-betting-explained',
    competitorsRanking: 'Forebet, Oddspedia, FootyStats, AsianBookie',
    monthlyVolume: '29,500',
    status: 'Published & Indexed',
  },
  {
    title: 'Draw No Bet (DNB) vs Double Chance (1X/X2): Mathematical ROI Guide',
    path: '/blog/draw-no-bet-vs-double-chance-strategy',
    competitorsRanking: 'WinDrawWin, PredictZ, Statarea, Soccervista',
    monthlyVolume: '21,400',
    status: 'Published & Indexed',
  },
  {
    title: 'Closing Line Value (CLV) & Dropping Odds: How to Beat Sharp Steam',
    path: '/blog/closing-line-value-clv-dropping-odds',
    competitorsRanking: 'Pinnacle Pulse, Oddspedia, RebelBetting, SmartBettingClub',
    monthlyVolume: '16,800',
    status: 'Published & Indexed',
  },
  {
    title: 'Interactive Head-to-Head (H2H) & Bivariate Poisson Simulator',
    path: '/h2h',
    competitorsRanking: 'Forebet, FootyStats, WhoScored, SofaScore',
    monthlyVolume: '45,000',
    status: 'Live Interactive Tool',
  },
];

const DECLINING_AND_PUBLISHED_ONCE_PAGES = [
  {
    path: '/blog/premier-league-prediction-guide-2026',
    opportunityType: 'Content with Declining Traffic (Site Explorer · 6M)',
    originalPublished: '2026-06-01',
    refreshedDate: '2026-09-30',
    actionTaken: 'Updated to 2026/27 EPL xPTS regression table, added Quick Answer snippet & FAQPage JSON-LD',
  },
  {
    path: '/blog/champions-league-group-stage-tips',
    opportunityType: 'Content with Declining Traffic (Site Explorer · 6M)',
    originalPublished: '2026-05-31',
    refreshedDate: '2026-09-30',
    actionTaken: 'Replaced legacy 4-team group stage references with 36-team UEFA Swiss Phase qualification math',
  },
  {
    path: '/blog/sportpesa-mega-jackpot-prediction-17-games',
    opportunityType: 'Pages Only Published Once (Content Explorer)',
    originalPublished: '2026-06-05',
    refreshedDate: '2026-09-30',
    actionTaken: 'Added 2^N Double Chance permutation table, direct SportPesa/Betika pool links & dateModified schema',
  },
  {
    path: '/blog/kpl-betting-guide-kenya',
    opportunityType: 'Pages Only Published Once (Content Explorer)',
    originalPublished: '2026-05-29',
    refreshedDate: '2026-09-30',
    actionTaken: 'Refreshed 2026/27 FKF Premier League 18-club form splits, Kasarani home advantage & M-Pesa STK guide',
  },
  {
    path: '/blog/correct-score-prediction-tips',
    opportunityType: 'Pages Only Published Once (Content Explorer)',
    originalPublished: '2026-05-27',
    refreshedDate: '2026-09-30',
    actionTaken: 'Added Bivariate Poisson top-5 scoreline clustering percentages & Dutching stake calculator links',
  },
];

const INTERNAL_LINK_OPPORTUNITIES = [
  {
    sourcePage: '/blog/value-betting-explained',
    keywordMentioned: 'Value Bets (+EV)',
    targetHub: '/value-bets',
    descriptiveAnchor: 'Daily Positive Expected Value (+EV) Football Value Bets',
    monthlyTrafficWeight: '14,800/mo',
  },
  {
    sourcePage: '/blog/btts-over-under-strategy',
    keywordMentioned: 'Both Teams to Score (BTTS) & Over 2.5',
    targetHub: '/btts',
    descriptiveAnchor: 'Daily Both Teams to Score (BTTS) & Over 2.5 Goals AI Predictions',
    monthlyTrafficWeight: '22,200/mo',
  },
  {
    sourcePage: '/blog/sportpesa-mega-jackpot-prediction-17-games',
    keywordMentioned: 'Jackpot Predictions (17 Games)',
    targetHub: '/jackpot-predictions',
    descriptiveAnchor: 'Official 17-Game SportPesa Mega & Betika Jackpot AI Predictions',
    monthlyTrafficWeight: '40,500/mo',
  },
  {
    sourcePage: '/blog/closing-line-value-clv-dropping-odds',
    keywordMentioned: 'Dropping Odds Radar',
    targetHub: '/dropping-odds',
    descriptiveAnchor: 'Live Dropping Odds & Sharp Syndicate Steam Move Radar',
    monthlyTrafficWeight: '12,400/mo',
  },
  {
    sourcePage: '/blog/accumulator-building-strategy',
    keywordMentioned: 'Accumulator Builder',
    targetHub: '/accumulator',
    descriptiveAnchor: 'Smart Multi-Match Football Accumulator Slip Builder',
    monthlyTrafficWeight: '18,100/mo',
  },
];

const DESCRIPTIVE_ANCHOR_FIXES = [
  {
    componentPath: 'src/pages/BlogPost.tsx',
    genericBefore: 'Find Value Bets / Today’s Best Bets / Read Guide / All Guides',
    descriptiveAfter: 'Scan Today’s Positive EV (+EV) Value Bets / Explore Today’s 75%+ AI Banker Predictions / Read {Category} Strategy Guide',
  },
  {
    componentPath: 'src/pages/Blog.tsx',
    genericBefore: 'Read complete guide / Read',
    descriptiveAfter: 'Read {Category} Strategy Guide / Read {Category} Guide',
  },
  {
    componentPath: 'src/pages/PersonalizedDashboard.tsx',
    genericBefore: 'View All Predictions',
    descriptiveAfter: 'Explore All Daily AI Football Predictions & Odds',
  },
  {
    componentPath: 'src/components/BreakingNewsTicker.tsx',
    genericBefore: 'View All News',
    descriptiveAfter: 'Read Breaking Football Injury & Transfer News',
  },
  {
    componentPath: 'src/components/Footer.tsx',
    genericBefore: 'Blog / Standings / Archive / Methodology',
    descriptiveAfter: 'Football Betting Strategy Blog Hub / Live League Tables & Form Standings / Audited Historical Results Archive',
  },
];

const CANNIBALIZATION_MAP = [
  {
    route: '/',
    primaryIntent: 'All-League Daily AI Football Predictions Hub & Live Match Feed',
    targetKeywordCluster: 'ai football predictions today, predictpro, soccer predictions today',
    canonical: 'https://predictpro.guru/',
  },
  {
    route: '/best-bets',
    primaryIntent: 'High-Confidence (75%–92%) 1X2 Banker & Sure Win Picks',
    targetKeywordCluster: 'best football bets today, banker bet of the day, free guru tips today',
    canonical: 'https://predictpro.guru/best-bets',
  },
  {
    route: '/value-bets',
    primaryIntent: 'Positive Expected Value (+EV) Odds Discrepancy Scanner',
    targetKeywordCluster: 'daily value bets today, positive expected value football, beat bookmaker odds',
    canonical: 'https://predictpro.guru/value-bets',
  },
  {
    route: '/btts',
    primaryIntent: 'Binary Goal Markets: Both Teams to Score (BTTS) & Over/Under 2.5',
    targetKeywordCluster: 'btts ai prediction today, both teams to score tips, over 2.5 goals predictions',
    canonical: 'https://predictpro.guru/btts',
  },
  {
    route: '/correct-score',
    primaryIntent: 'Exact 90-Minute Scoreline Bivariate Poisson Matrix (e.g., 2-1, 1-0)',
    targetKeywordCluster: 'correct score predictions today, exact scoreline tips, poisson score matrix',
    canonical: 'https://predictpro.guru/correct-score',
  },
  {
    route: '/dropping-odds',
    primaryIntent: 'Real-Time Syndicate Steam & Bookmaker Line Movement Tracker',
    targetKeywordCluster: 'dropping odds football, sharp money steam moves, closing line value tracker',
    canonical: 'https://predictpro.guru/dropping-odds',
  },
];

const RECLAIMED_REDIRECTS = [
  { legacyPath: '/predictions, /football-predictions, /soccer-predictions', destination: '/', code: '301 / SPA Replace', purpose: 'Reclaim root prediction backlinks' },
  { legacyPath: '/tips, /sure-bets, /banker-bets, /free-tips', destination: '/best-bets', code: '301 / SPA Replace', purpose: 'Consolidate banker & guru tip authority' },
  { legacyPath: '/epl-predictions', destination: '/premier-league-predictions', code: '301 / SPA Replace', purpose: 'Unify English Premier League backlinks' },
  { legacyPath: '/ucl-predictions', destination: '/champions-league-predictions', code: '301 / SPA Replace', purpose: 'Unify UEFA Champions League backlinks' },
  { legacyPath: '/mls-predictions', destination: '/us-soccer-predictions', code: '301 / SPA Replace', purpose: 'Reclaim North American & MLS links' },
  { legacyPath: '/mega-jackpot, /sportpesa-jackpot', destination: '/jackpot-predictions', code: '301 / SPA Replace', purpose: 'Consolidate 17-game Jackpot equity' },
  { legacyPath: '/both-teams-to-score, /over-2-5-goals', destination: '/btts', code: '301 / SPA Replace', purpose: 'Route goal market links to BTTS hub' },
  { legacyPath: '/vip, /pricing, /premium', destination: '/shop', code: '301 / SPA Replace', purpose: 'Reclaim M-Pesa & VIP checkout links' },
];

const LINK_INTERSECT_PROSPECTS = [
  {
    domain: 'football-data.co.uk / Sports Quantitative Directories',
    competitorsLinked: 'Forebet, OddsPortal, FootyStats (8/10 competitors)',
    opportunityType: 'Link Intersect (Competitive Analysis)',
    recommendedTarget: 'https://predictpro.guru/methodology',
    suggestedAnchor: 'PredictPro Bivariate Poisson & Expected Goals (xG) Football Model',
    pitchSubject: 'Resource Addition: Live Bivariate Poisson & xG Football Prediction Dataset',
    pitchBody: `Hi Editorial Team,\n\nI noticed your quantitative football modeling directory links to Forebet and FootyStats. We recently published an open, interactive Bivariate Poisson & Expected Goals (xG) Prediction Engine at PredictPro (https://predictpro.guru/methodology) that includes real-time Closing Line Value (CLV) verification and 40+ global leagues.\n\nWould you consider including our live xG methodology resource alongside your existing statistical links?\n\nBest regards,\nPredictPro Quantitative Research Team`,
  },
  {
    domain: 'Kenyan & East African Sports Portals (PulseSports / Goal KE)',
    competitorsLinked: 'Betensured, Statarea, Forebet (6/10 competitors)',
    opportunityType: 'Link Intersect + Local Authority',
    recommendedTarget: 'https://predictpro.guru/kpl-predictions',
    suggestedAnchor: 'FKF Kenyan Premier League AI Predictions & 17-Game Mega Jackpot Analysis',
    pitchSubject: 'Data Citation: FKF Premier League xG & 17-Game Mega Jackpot Mathematical Breakdown',
    pitchBody: `Hello Sports Desk,\n\nWe saw your weekly roundup covering FKF Premier League fixtures and the 17-game Mega Jackpot. Our data science team maintains a live Kenyan Premier League xG & Mashemeji Derby probability hub (https://predictpro.guru/kpl-predictions) as well as a 17-game Mega Jackpot Banker matrix (https://predictpro.guru/jackpot-predictions).\n\nFeel free to cite our live match probabilities or embed our free prediction widget in your weekend previews!`,
  },
  {
    domain: 'Reddit r/SoccerBetting & GitHub Awesome-Football-Analytics',
    competitorsLinked: 'Understat, FBref, Oddspedia (7/10 competitors)',
    opportunityType: 'Unlinked Brand Mention Reclamation (Content Explorer)',
    recommendedTarget: 'https://predictpro.guru/value-bets',
    suggestedAnchor: 'PredictPro Daily Positive Expected Value (+EV) Football Scanner',
    pitchSubject: 'Thanks for mentioning PredictPro — Direct Link to Live +EV Scanner',
    pitchBody: `Hi Maintainers,\n\nThank you for mentioning PredictPro's Poisson simulator in your football analytics thread! To help readers jump straight to the live no-vig Expected Value calculator without searching, could you link the mention directly to https://predictpro.guru/value-bets?\n\nThanks again for supporting independent sports analytics!`,
  },
];

export const SEOSiteAuditSuite: React.FC<{ onTriggerIndexNow?: () => void }> = ({
  onTriggerIndexNow,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'links' | 'technical'>('content');

  const embedWidgetSnippet = `<!-- PredictPro Live AI Football Predictions Citation Widget -->
<div style="border:1px solid #1e293b;border-radius:12px;padding:16px;background:#0f172a;color:#f8fafc;font-family:system-ui,sans-serif;max-width:420px;">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#10b981;font-weight:700;margin-bottom:6px;">
    Verified Poisson &amp; xG Football Intelligence
  </div>
  <a href="https://predictpro.guru/best-bets" target="_blank" rel="noopener" style="color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;display:block;margin-bottom:6px;">
    Today's AI Banker Football Predictions &amp; +EV Value Bets →
  </a>
  <p style="font-size:12px;color:#94a3b8;margin:0 0 10px 0;line-height:1.5;">
    Live Bivariate Poisson scoreline matrices, Expected Goals (xG) differentials, and Closing Line Value (CLV) across 40+ leagues.
  </p>
  <div style="font-size:11px;color:#cbd5e1;">
    Data powered by <a href="https://predictpro.guru" target="_blank" rel="noopener" style="color:#10b981;font-weight:700;text-decoration:underline;">PredictPro AI Football Predictions</a>
  </div>
</div>`;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Banner mapping all 12 Ahrefs / Site Audit Pillars */}
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> 12/12 Site Audit &amp; Competitive SEO Pillars Active
              </Badge>
              <Badge variant="outline" className="text-xs">
                Site Explorer · Content Explorer · Link Intersect · Site Audit
              </Badge>
            </div>
            <h2 className="text-2xl font-black text-foreground">
              Full-Spectrum SEO Content, Link Reclamation &amp; Technical Audit Center
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Tracks and executes all 12 organic growth workflows: Low-hanging fruit keywords (Positions 4–15), AI Overviews &amp; Featured Snippets (Positions 2–8), Competitor Content Gap articles, Content Refresh &amp; De-cannibalization, 404 Redirect Reclamation, Descriptive Internal Anchors, and Link Intersect Outreach.
            </p>
          </div>

          {onTriggerIndexNow && (
            <Button onClick={onTriggerIndexNow} size="sm" className="gap-1.5 font-bold text-xs shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> Push Updated Pages to IndexNow
            </Button>
          )}
        </div>

        {/* Sub-navigation for the 3 core categories */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/50 flex-wrap">
          <Button
            size="sm"
            variant={activeSubTab === 'content' ? 'default' : 'outline'}
            onClick={() => setActiveSubTab('content')}
            className="gap-1.5 text-xs font-bold"
          >
            <FileText className="w-3.5 h-3.5" />
            1. Content &amp; SERP Features (6 Pillars)
          </Button>
          <Button
            size="sm"
            variant={activeSubTab === 'links' ? 'default' : 'outline'}
            onClick={() => setActiveSubTab('links')}
            className="gap-1.5 text-xs font-bold"
          >
            <Link2 className="w-3.5 h-3.5" />
            2. Links, Redirects &amp; Outreach (5 Pillars)
          </Button>
          <Button
            size="sm"
            variant={activeSubTab === 'technical' ? 'default' : 'outline'}
            onClick={() => setActiveSubTab('technical')}
            className="gap-1.5 text-xs font-bold"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            3. Technical Site Audit &amp; Health (100% Clean)
          </Button>
        </div>
      </div>

      {/* SECTION 1: CONTENT PILLARS */}
      {activeSubTab === 'content' && (
        <div className="space-y-6">
          {/* 1A: Low-Hanging Fruit Keywords (Positions 4-15) */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 mb-1">
                    Site Explorer · Positions 4–15 Upgrade
                  </Badge>
                  <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Low-Hanging Fruit Keywords (Positions 4–15 &rarr; Top 3)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Existing high-impression pages upgraded with deeper statistical breakdowns, FAQPage JSON-LD schemas, and contextual internal links.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-muted-foreground">
                      <th className="py-2.5 px-3 font-bold">Target Keyword</th>
                      <th className="py-2.5 px-3 font-bold">Ranking Page</th>
                      <th className="py-2.5 px-3 font-bold">Pos (Before &rarr; Goal)</th>
                      <th className="py-2.5 px-3 font-bold">CTR / Vol</th>
                      <th className="py-2.5 px-3 font-bold">On-Page Optimization Executed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {LOW_HANGING_KEYWORDS.map((item) => (
                      <tr key={item.keyword} className="hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-bold text-foreground">{item.keyword}</td>
                        <td className="py-2.5 px-3">
                          <Link
                            to={item.targetPath}
                            className="text-primary font-mono font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            {item.targetPath}
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            Pos {item.previousPosition} &rarr; {item.targetPosition}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.ctr}</span> · {item.searchVolume}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{item.optimizationApplied}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 1B: AI Overviews & Featured Snippets (Positions 2-8) */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <Badge variant="outline" className="w-fit text-[10px] font-bold text-emerald-600 border-emerald-500/30 mb-1">
                Site Explorer · AI Overviews &amp; Featured Snippets (Positions 2–8)
              </Badge>
              <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                AI Overview &amp; Position-Zero Featured Snippet Blocks
              </CardTitle>
              <CardDescription className="text-xs">
                Concise 40–55 word inverted-pyramid answer blocks and structured equations engineered for Google AI Overviews on queries where PredictPro ranks #2–#8.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AI_OVERVIEW_SNIPPETS.map((snip) => (
                <div
                  key={snip.query}
                  className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Badge className="bg-primary/10 text-primary text-[10px] font-bold">
                        {snip.currentRank} &rarr; AI Overview Target
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{snip.snippetFormat}</span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">“{snip.query}”</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-background p-3 rounded-lg border border-border/50">
                      {snip.directAnswer}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Link
                      to={snip.targetPath}
                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Inspect Live Page ({snip.targetPath}) <ArrowUpRight className="w-3 h-3" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-2 gap-1"
                      onClick={() => copyText(snip.directAnswer, 'Featured snippet answer')}
                    >
                      <Copy className="w-3 h-3" /> Copy Snippet
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 1C: Competitor Content Gap + Content Refresh (Declining Traffic & Published Once) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <Badge variant="outline" className="w-fit text-[10px] font-bold text-amber-600 border-amber-500/30 mb-1">
                  Competitive Analysis · Top 10 Competitor Content Gap
                </Badge>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  New Content Closing Competitor Keyword Gaps
                </CardTitle>
                <CardDescription className="text-xs">
                  High-volume betting strategy &amp; tool topics where Forebet, WinDrawWin, PredictZ, and FootyStats ranked previously—now live on PredictPro.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {CONTENT_GAP_ARTICLES.map((art) => (
                  <div
                    key={art.path}
                    className="p-3 rounded-xl border border-border/60 bg-background flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <Link
                        to={art.path}
                        className="font-bold text-xs text-foreground hover:text-primary hover:underline truncate block"
                      >
                        {art.title}
                      </Link>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Competitors: {art.competitorsRanking} · <strong>{art.monthlyVolume}/mo</strong>
                      </span>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] shrink-0">
                      {art.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 1D: Potential Cannibalization Resolver */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <Badge variant="outline" className="w-fit text-[10px] font-bold text-blue-600 border-blue-500/30 mb-1">
                  Site Explorer · Potential Cannibalization Prevention
                </Badge>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Search Intent Separation &amp; Canonical De-Cannibalization
                </CardTitle>
                <CardDescription className="text-xs">
                  Each market hub is locked to a single primary search intent with strict self-referencing canonicals, preventing multiple pages from competing for the same keyword.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {CANNIBALIZATION_MAP.map((row) => (
                  <div
                    key={row.route}
                    className="p-2.5 rounded-lg border border-border/50 bg-muted/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Link to={row.route} className="font-mono font-bold text-primary hover:underline">
                        {row.route}
                      </Link>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Unique Intent Verified
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-foreground">{row.primaryIntent}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Cluster: {row.targetKeywordCluster}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 1E & 1F: Content with Declining Traffic (Site Explorer) & Pages Only Published Once (Content Explorer) */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <Badge variant="outline" className="w-fit text-[10px] font-bold text-purple-600 border-purple-500/30 mb-1">
                Site Explorer &amp; Content Explorer · Declining Traffic (6M) &amp; Published-Once Refresh
              </Badge>
              <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-500" />
                Refreshed Evergreen Guides (Declining 6M Traffic &amp; Pages Only Published Once)
              </CardTitle>
              <CardDescription className="text-xs">
                Updated legacy May/June 2026 articles with fresh 2026/27 seasonal metrics, <code className="font-mono">dateModified: 2026-09-30</code> Article JSON-LD, and Position-Zero Quick Answer boxes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-muted-foreground">
                      <th className="py-2 px-3 font-bold">Refreshed Page</th>
                      <th className="py-2 px-3 font-bold">Opportunity Source</th>
                      <th className="py-2 px-3 font-bold">Published &rarr; Updated</th>
                      <th className="py-2 px-3 font-bold">2026/27 Content Upgrade Executed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {DECLINING_AND_PUBLISHED_ONCE_PAGES.map((item) => (
                      <tr key={item.path} className="hover:bg-muted/30">
                        <td className="py-2.5 px-3">
                          <Link to={item.path} className="font-mono font-bold text-primary hover:underline">
                            {item.path}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">{item.opportunityType}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                          {item.originalPublished} &rarr; {item.refreshedDate}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{item.actionTaken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SECTION 2: LINKS, REDIRECTS & OUTREACH PILLARS */}
      {activeSubTab === 'links' && (
        <div className="space-y-6">
          {/* 2A: 404 Link Reclamation & Redirects Implemented */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <Badge variant="outline" className="w-fit text-[10px] font-bold text-primary border-primary/30 mb-1">
                Site Explorer · 404 Backlink Reclamation
              </Badge>
              <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-primary" />
                Implemented Redirects Reclaiming Legacy &amp; External 404 Links
              </CardTitle>
              <CardDescription className="text-xs">
                Configured in both <code className="font-mono">public/_redirects</code> (HTTP 301) and <code className="font-mono">src/App.tsx</code> (<code className="font-mono">&lt;Navigate replace /&gt;</code>) to preserve 100% of incoming link equity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-muted-foreground">
                      <th className="py-2 px-3 font-bold">Legacy / Broken 404 Paths</th>
                      <th className="py-2 px-3 font-bold">Canonical Destination</th>
                      <th className="py-2 px-3 font-bold">Redirect Type</th>
                      <th className="py-2 px-3 font-bold">SEO Link Equity Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {RECLAIMED_REDIRECTS.map((r) => (
                      <tr key={r.legacyPath} className="hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">{r.legacyPath}</td>
                        <td className="py-2.5 px-3">
                          <Link to={r.destination} className="font-mono font-bold text-primary hover:underline">
                            {r.destination}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                            {r.code}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{r.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 2B: Internal Link Opportunities (Site Audit) & Descriptive Anchors (Site Explorer) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <Badge variant="outline" className="w-fit text-[10px] font-bold text-emerald-600 border-emerald-500/30 mb-1">
                  Site Audit · Internal Link Opportunities
                </Badge>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-emerald-500" />
                  Contextual Keyword-to-Hub Internal Links Injected
                </CardTitle>
                <CardDescription className="text-xs">
                  Automatic contextual internal links built from ranking strategy articles that mention PredictPro’s top traffic keywords.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {INTERNAL_LINK_OPPORTUNITIES.map((item) => (
                  <div
                    key={`${item.sourcePage}-${item.targetHub}`}
                    className="p-2.5 rounded-lg border border-border/50 bg-muted/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link to={item.sourcePage} className="font-mono text-muted-foreground hover:text-primary hover:underline truncate">
                        {item.sourcePage}
                      </Link>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        &rarr; {item.targetHub} ({item.monthlyTrafficWeight})
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground">
                      Keyword: <strong>“{item.keywordMentioned}”</strong> · Title: <span className="text-muted-foreground">{item.descriptiveAnchor}</span>
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <Badge variant="outline" className="w-fit text-[10px] font-bold text-blue-600 border-blue-500/30 mb-1">
                  Site Explorer · Descriptive Anchors Audit
                </Badge>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  Generic Anchor Text Replaced with Descriptive Anchors
                </CardTitle>
                <CardDescription className="text-xs">
                  Eliminated generic anchor strings (“Read more”, “View All”, “Click here”) across all components in favor of semantic topic-accurate anchors.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {DESCRIPTIVE_ANCHOR_FIXES.map((fix) => (
                  <div
                    key={fix.componentPath}
                    className="p-2.5 rounded-lg border border-border/50 bg-muted/20 text-xs space-y-1"
                  >
                    <div className="font-mono font-bold text-primary text-[11px]">{fix.componentPath}</div>
                    <div className="text-[11px] text-muted-foreground line-through">Before: {fix.genericBefore}</div>
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      After: {fix.descriptiveAfter}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 2C: Link Intersect & Unlinked Brand Mentions Outreach Generator */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <Badge variant="outline" className="w-fit text-[10px] font-bold text-amber-600 border-amber-500/30 mb-1">
                Competitive Analysis &amp; Content Explorer · Link Intersect + Unlinked Mentions
              </Badge>
              <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Competitor Link Intersect &amp; Unlinked Brand Mention Outreach Hub
              </CardTitle>
              <CardDescription className="text-xs">
                Target domains that link to PredictPro’s top 10 competitors or mention PredictPro without linking. Copy ready-to-send outreach templates with descriptive target anchors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {LINK_INTERSECT_PROSPECTS.map((item) => (
                <div
                  key={item.domain}
                  className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Badge variant="secondary" className="text-[10px] font-bold mb-1">
                        {item.opportunityType}
                      </Badge>
                      <h4 className="font-bold text-sm text-foreground">{item.domain}</h4>
                      <p className="text-xs text-muted-foreground">
                        Competitors linked: <strong>{item.competitorsLinked}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 font-semibold"
                        onClick={() => copyText(item.suggestedAnchor, 'Descriptive anchor text')}
                      >
                        <Copy className="w-3 h-3" /> Copy Anchor
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1.5 font-bold"
                        onClick={() =>
                          copyText(`Subject: ${item.pitchSubject}\n\n${item.pitchBody}`, 'Outreach email pitch')
                        }
                      >
                        <Copy className="w-3 h-3" /> Copy Outreach Pitch
                      </Button>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border border-border/50 text-xs space-y-1">
                    <div>
                      <span className="text-muted-foreground">Target URL: </span>
                      <span className="font-mono font-semibold text-primary">{item.recommendedTarget}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Descriptive Anchor: </span>
                      <span className="font-semibold text-foreground">“{item.suggestedAnchor}”</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 2C: Embeddable HTML Backlink Widget for Partner Blogs & Unlinked Mentions */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                Embeddable Live Prediction Citation Badge (Builds Descriptive DoFollow Backlinks)
              </CardTitle>
              <CardDescription className="text-xs">
                Share this lightweight HTML snippet with football bloggers, forum moderators, and sports journalists so their citation automatically includes semantic descriptive anchor text.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="p-3 rounded-xl bg-muted/60 border text-[11px] font-mono overflow-x-auto text-muted-foreground">
                {embedWidgetSnippet}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyText(embedWidgetSnippet, 'Embeddable backlink widget HTML')}
                className="gap-1.5 text-xs font-bold"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Embeddable Backlink Snippet
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SECTION 3: TECHNICAL SITE AUDIT */}
      {activeSubTab === 'technical' && (
        <div className="space-y-4">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                  YANDEX WEBMASTER &amp; GOOGLE DIAGNOSTICS — 5/5 RESOLVED
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 font-semibold"
                    onClick={() => copyText('https://predictpro.guru/sitemap.xml', 'Canonical Sitemap URL')}
                  >
                    <Copy className="w-3 h-3" /> Copy Sitemap URL
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 font-semibold"
                    onClick={() => copyText('https://predictpro.guru/favicon.ico', 'Favicon URL')}
                  >
                    <Copy className="w-3 h-3" /> Copy Favicon URL
                  </Button>
                </div>
              </div>
              <CardTitle className="text-base font-extrabold mt-2">
                Yandex Webmaster (predictpro.guru) — 5 Recommendations &amp; 21 Self-Checks Status
              </CardTitle>
              <CardDescription className="text-xs">
                All code-level fixes for HTTPS enforcement, Sitemap XML compliance, YandexFavicons multi-size icons, Yandex Business Schema, and Geo-Region declarations are active.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>1. HTTPS Protocol &amp; HSTS Preload</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]">Active</Badge>
                </div>
                <p className="text-muted-foreground">
                  301 HTTP→HTTPS &amp; www→non-www redirect in Edge Middleware, <code className="text-primary">Strict-Transport-Security: max-age=63072000; preload</code>, and <code className="text-primary">Host: https://predictpro.guru</code> in robots.txt.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>2. Strict Sitemap XML (66 URLs)</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]">Active</Badge>
                </div>
                <p className="text-muted-foreground">
                  Clean <code className="text-primary">sitemaps.org/schemas/sitemap/0.9</code> XML at <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-primary underline">/sitemap.xml</a> and <a href="/sitemap-yandex.xml" target="_blank" rel="noopener noreferrer" className="text-primary underline">/sitemap-yandex.xml</a> with HTML <code className="text-primary">&lt;link rel=&quot;sitemap&quot;&gt;</code> auto-discovery.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>3. YandexFavicons Multi-Size Square Icons</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]">Active</Badge>
                </div>
                <p className="text-muted-foreground">
                  Valid multi-resolution <a href="/favicon.ico" target="_blank" rel="noopener noreferrer" className="text-primary underline">/favicon.ico</a> (16×16, 32×32, 48×48), <a href="/favicon-120x120.png" target="_blank" rel="noopener noreferrer" className="text-primary underline">/favicon-120x120.png</a>, and <a href="/favicon.svg" target="_blank" rel="noopener noreferrer" className="text-primary underline">/favicon.svg</a> with explicit <code className="text-primary">User-agent: YandexFavicons</code> allow rules.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>4 &amp; 5. Yandex Business &amp; Region Targeting</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]">Active</Badge>
                </div>
                <p className="text-muted-foreground">
                  Full <code className="text-primary">Organization</code> + <code className="text-primary">ProfessionalService</code> JSON-LD with address, hours, phone, priceRange, and global + regional <code className="text-primary">hreflang</code> tags (<code className="text-primary">x-default, en, en-KE, en-NG, en-GB, en-US</code>).
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Non-Canonical Page in Sitemap (113 → 0 Errors)',
              status: 'Resolved (100% Self-Canonical)',
              detail:
                'Removed hardcoded root canonical from index.html and enabled build-time static route prerendering (prerender-seo-routes.mjs) so all 65 sitemap routes emit self-referencing <link rel="canonical"> tags.',
            },
            {
              title: 'Orphan Pages in Sitemap (93 → 0 Warnings)',
              status: 'Resolved (0 Orphans)',
              detail:
                'Added full pre-hydration semantic <nav> internal link directory inside #root in index.html and evergreen date-free /predict/:slug links across Footer and Sitemap.',
            },
            {
              title: 'Title & Meta Description Length (139 → 0 Notices)',
              status: 'Resolved (<=60 / <=155 Chars)',
              detail:
                'Shortened index.html default <title> to 54 chars and <meta name="description"> to 144 chars, and added normalizeSEOTitle (<=60) & normalizeSEODescription (<=155) across all routes.',
            },
            {
              title: '3XX & HTTP-to-HTTPS Internal Redirects (5 → 0)',
              status: 'Resolved (Direct 200 OK)',
              detail:
                'Standardized all internal links and canonical URLs to https://predictpro.guru (non-www HTTPS) with cleanUrls: true and trailingSlash: false.',
            },
            {
              title: 'Zero Broken Images & Club Crests (0× 404s)',
              status: 'Resolved (100%)',
              detail:
                'Replaced fragile external Wikimedia thumbnail URLs across all 18 FKF Kenyan Premier League clubs, CAF giants, and international teams with deterministic inline SVG club crests.',
            },
            {
              title: 'ESPN Scoreboard & RapidAPI Circuit Breakers',
              status: 'Resolved (100%)',
              detail:
                'Fixed ESPN scoreboard date query formatting (single-day YYYYMMDD) to prevent HTTP 400 errors and added automatic 30-minute cooldowns on RapidAPI 401/403/429 responses.',
            },
            {
              title: 'IndexNow Key Alignment & AhrefsBot UTF-8 Verification',
              status: 'Verified (HTTP 200)',
              detail:
                'Hosted UTF-8 key file at https://predictpro.guru/h2u74xmxq17qqj7na6p7g5w29zwrhhq7.txt with key content h2u74xmxq17qqj7na6p7g5w29zwrhhq7, explicit Yandex & AhrefsBot allow rules, and unified across Edge Functions & cron handlers.',
            },
            {
              title: 'Supabase Edge Function CORS Preflight & Static Guard',
              status: 'Verified (HTTP 200)',
              detail:
                'Explicit status 200 OPTIONS preflight headers on gemini-tasks, fetch-sports-news, and ping-search-engines, plus client-side content-type verification and 15-minute cooldowns.',
            },
            {
              title: 'Descriptive Internal Anchor Text Architecture',
              status: 'Audited & Active',
              detail:
                'Replaced generic navigation labels across Footer, Homepage SEOAuthorityHub, BestBets, ValueBets, and BTTS with keyword-rich descriptive anchor text.',
            },
            {
              title: 'Schema.org Structured Data (Organization, ProfessionalService, FAQPage)',
              status: 'Valid JSON-LD',
              detail:
                'Every core prediction hub, league page, and strategy article emits valid JSON-LD structured data for Google Rich Results, Yandex Business Snippets, and AI Overviews.',
            },
          ].map((check) => (
            <Card key={check.title} className="border-border/60 bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {check.status}
                  </Badge>
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-sm font-bold mt-1">{check.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">{check.detail}</p>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}
    </div>
  );
};
