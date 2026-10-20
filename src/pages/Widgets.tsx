import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingUp,
  BarChart3,
  Globe,
  Radio,
  FileCode,
  Crosshair,
  Trophy,
  Tv,
  Link2,
  Image as ImageIcon,
  FormInput,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultHeight: number;
  previewUrl: string;
  sampleMatch: string;
  samplePick: string;
  sampleOdds: string;
  sampleConfidence: string;
  sampleXg: string;
  sampleScore: string;
}

export const WIDGET_TYPES: WidgetConfig[] = [
  {
    id: 'banker',
    name: 'Banker Bet of the Day',
    description: 'Displays the single highest-confidence football banker pick for today with win probability and odds.',
    icon: <Zap className="h-4 w-4 text-emerald-500" />,
    defaultHeight: 320,
    previewUrl: '/embed/banker',
    sampleMatch: 'Arsenal vs Chelsea',
    samplePick: 'Arsenal Win (1X2)',
    sampleOdds: '1.95',
    sampleConfidence: '87% Win Prob',
    sampleXg: '2.14 vs 0.98',
    sampleScore: '2-0',
  },
  {
    id: 'live-scores',
    name: 'Live Scores & In-Play xG Ticker',
    description: 'Sub-15s live football scoreboard with in-play win probabilities and minute momentum.',
    icon: <Radio className="h-4 w-4 text-rose-500" />,
    defaultHeight: 400,
    previewUrl: '/embed/live-scores',
    sampleMatch: 'Real Madrid vs Barcelona',
    samplePick: 'Both Teams to Score (BTTS: Yes)',
    sampleOdds: '1.68',
    sampleConfidence: '82% Probability',
    sampleXg: '2.45 vs 2.18',
    sampleScore: '2-2',
  },
  {
    id: 'player-radar',
    name: '10.0 Player Rating & 5-Axis Radar',
    description: 'SofaScore/FotMob-grade 0.0–10.0 season form rating and 5-axis percentile comparison card.',
    icon: <Crosshair className="h-4 w-4 text-emerald-400" />,
    defaultHeight: 360,
    previewUrl: '/embed/player-radar',
    sampleMatch: 'Erling Haaland vs Kylian Mbappé',
    samplePick: 'Haaland Anytime Goalscorer (0.98 xG/90)',
    sampleOdds: '1.72',
    sampleConfidence: '8.94 Season Rating',
    sampleXg: '0.98 vs 0.86 xG/90',
    sampleScore: '99th Pct Finishing',
  },
  {
    id: 'xpts-table',
    name: 'Expected Points (xPTS) Justice Table',
    description: 'Compares official league points against Dixon-Coles Expected Points (xPTS) to expose over/under-performing clubs.',
    icon: <Trophy className="h-4 w-4 text-amber-500" />,
    defaultHeight: 380,
    previewUrl: '/embed/xpts-table',
    sampleMatch: 'Premier League xPTS Projection',
    samplePick: 'Liverpool & Arsenal Top xG Differential',
    sampleOdds: '1.85',
    sampleConfidence: '+1.18 Net xG/90',
    sampleXg: '64.2 vs 62.8 xPTS',
    sampleScore: '#1 vs #2 Justice Rank',
  },
  {
    id: 'live-pitch',
    name: '2D Live Pitch & TV Broadcast Guide',
    description: 'Embeds 2D tactical field-tilt momentum alongside verified regional TV & streaming channels.',
    icon: <Tv className="h-4 w-4 text-sky-400" />,
    defaultHeight: 360,
    previewUrl: '/embed/live-pitch',
    sampleMatch: 'Arsenal vs PSG (2D Match Cast)',
    samplePick: 'Home Attacking Wave (+0.44 xG Last 15m)',
    sampleOdds: '1.91',
    sampleConfidence: '84% Live Win Prob',
    sampleXg: '1.92 vs 0.84 Live xG',
    sampleScore: 'Sky · SuperSport · DAZN',
  },
  {
    id: 'btts',
    name: 'Both Teams to Score (BTTS) Radar',
    description: 'Top Poisson-calculated BTTS Yes/No matches with expected goal expectancy (xG) metrics.',
    icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
    defaultHeight: 380,
    previewUrl: '/embed/btts',
    sampleMatch: 'Bayern Munich vs Dortmund',
    samplePick: 'Over 2.5 Goals & BTTS',
    sampleOdds: '1.75',
    sampleConfidence: '79% Win Rate',
    sampleXg: '3.10 vs 1.40',
    sampleScore: '3-1',
  },
  {
    id: 'jackpot',
    name: 'Mega Jackpot 17-Game Combinations',
    description: '17-game SportPesa and Betika jackpot banker picks and Double Chance combination tables.',
    icon: <Sparkles className="h-4 w-4 text-purple-500" />,
    defaultHeight: 460,
    previewUrl: '/embed/jackpot',
    sampleMatch: 'Gor Mahia vs AFC Leopards',
    samplePick: '1X (Home Win or Draw)',
    sampleOdds: '1.34',
    sampleConfidence: '85% Hedged',
    sampleXg: '1.25 vs 0.65',
    sampleScore: '1-0',
  },
  {
    id: 'value-bets',
    name: '+EV Value Bets Radar',
    description: 'Positive Expected Value (+EV) football bets comparing true model odds against bookmaker lines.',
    icon: <BarChart3 className="h-4 w-4 text-blue-500" />,
    defaultHeight: 380,
    previewUrl: '/embed/value-bets',
    sampleMatch: 'Inter Milan vs AC Milan',
    samplePick: 'Inter Milan Draw No Bet',
    sampleOdds: '1.88',
    sampleConfidence: '+14.2% EV Edge',
    sampleXg: '1.80 vs 1.15',
    sampleScore: '2-1',
  },
];

export const TARGET_ANCHOR_HUBS = [
  { path: '/', anchorText: 'PredictPro Football Predictions Today, Expected Goals (xG) & Match Analytics' },
  { path: '/premier-league-predictions', anchorText: 'English Premier League (EPL) Football Predictions & xG Statistics' },
  { path: '/la-liga-predictions', anchorText: 'Spanish LaLiga Match Predictions, Fair Odds & xG Previews' },
  { path: '/champions-league-predictions', anchorText: 'UEFA Champions League Predictions & 36-Team League Phase Odds' },
  { path: '/afcon-predictions', anchorText: 'AFCON & CAF Champions League Football Predictions & Odds' },
  { path: '/accumulator', anchorText: 'Smart Football Accumulator Builder & Multi-Bookmaker Booking Codes' },
  { path: '/standings', anchorText: 'Football League Standings & Expected Points (xPTS) Justice Tables' },
  { path: '/live', anchorText: 'Live Football Scores, 2D Shot Maps & Official TV Broadcast Guide' },
  { path: '/value-bets', anchorText: 'Daily Positive Expected Value (+EV) Football Bets & Fair Odds' },
  { path: '/btts', anchorText: 'Both Teams To Score (BTTS) & Over 2.5 Goals Poisson Predictions' },
  { path: '/correct-score', anchorText: 'Bivariate Poisson Exact Correct Score Football Predictions' },
  { path: '/archive', anchorText: 'Verified Football Prediction Archive & Settled 90-Minute ROI Ledger' },
];

export const SVG_AUTHORITY_BADGES = [
  {
    id: 'xg-verified',
    label: 'Verified xG Telemetry Badge',
    src: '/badges/predictpro-xg-verified.svg',
    fullUrl: 'https://predictpro.guru/badges/predictpro-xg-verified.svg',
  },
  {
    id: 'live-odds',
    label: 'Live 1X2 & Poisson Odds Badge',
    src: '/badges/predictpro-live-odds.svg',
    fullUrl: 'https://predictpro.guru/badges/predictpro-live-odds.svg',
  },
  {
    id: 'accuracy-rating',
    label: '84% Audited Hit Rate Badge',
    src: '/badges/predictpro-accuracy-rating.svg',
    fullUrl: 'https://predictpro.guru/badges/predictpro-accuracy-rating.svg',
  },
];

export type EmbedFormatType = 'iframe' | 'image-badge' | 'form-widget' | 'citation-html';

export default function Widgets() {
  const [selectedWidget, setSelectedWidget] = useState<string>('banker');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [width, setWidth] = useState<'100%' | '480px' | '320px'>('100%');
  const [embedFormat, setEmbedFormat] = useState<EmbedFormatType>('iframe');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('xg-verified');
  const [targetHubPath, setTargetHubPath] = useState<string>('/');
  const [copied, setCopied] = useState<boolean>(false);

  const active = WIDGET_TYPES.find((w) => w.id === selectedWidget) || WIDGET_TYPES[0];
  const targetHub = TARGET_ANCHOR_HUBS.find((h) => h.path === targetHubPath) || TARGET_ANCHOR_HUBS[0];
  const activeBadge = SVG_AUTHORITY_BADGES.find((b) => b.id === selectedBadgeId) || SVG_AUTHORITY_BADGES[0];
  const targetCanonicalUrl = targetHub.path === '/' ? 'https://predictpro.guru/' : `https://predictpro.guru${targetHub.path}`;

  // 1. Frame + Text Backlink (Iframe Embed)
  const iframeEmbedCode = `<!-- PredictPro Football Analytics Widget (Frame + Contextual Anchor Backlink) -->
<div class="predictpro-widget-container" style="max-width: ${width}; width: 100%; margin: 12px auto; font-family: system-ui, -apple-system, sans-serif;">
  <iframe
    src="https://predictpro.guru/embed/${active.id}?theme=${theme}"
    width="100%"
    height="${active.defaultHeight}"
    frameborder="0"
    scrolling="no"
    loading="lazy"
    style="border-radius: 12px; border: 1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"
    title="PredictPro ${active.name}">
  </iframe>
  <div style="font-size: 11px; text-align: center; margin-top: 6px; color: #64748b;">
    Statistical Match Telemetry via 
    <a href="${targetCanonicalUrl}" target="_blank" rel="noopener" title="${targetHub.anchorText}" style="color: #16a34a; font-weight: 700; text-decoration: underline;">
      ${targetHub.anchorText}
    </a>
  </div>
</div>`;

  // 2. Image Backlink (SVG Authority Badge with Descriptive Alt Anchor)
  const imageBadgeEmbedCode = `<!-- PredictPro Verified Authority Image Badge (Builds Image + Alt-Text Backlink Equity) -->
<a href="${targetCanonicalUrl}" target="_blank" rel="noopener" title="${targetHub.anchorText}" style="display: inline-block; text-decoration: none;">
  <img
    src="${activeBadge.fullUrl}"
    alt="${targetHub.anchorText}"
    width="260"
    height="60"
    loading="lazy"
    style="border: 0; border-radius: 10px; max-width: 100%; height: auto;"
  />
</a>`;

  // 3. Form Backlink (Interactive xG Quick-Simulator Form)
  const formWidgetEmbedCode = `<!-- PredictPro Interactive Poisson xG Calculator Form (Builds Form + Text Backlink Equity) -->
<form action="https://predictpro.guru/poisson-calculator" method="get" target="_blank" style="max-width: ${width}; width: 100%; margin: 14px auto; padding: 16px; border-radius: 12px; border: 1px solid #1e293b; background: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif;">
  <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #22c55e; margin-bottom: 6px;">
    Interactive Poisson xG Match Simulator
  </div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
    <input type="text" name="home" defaultValue="Arsenal" placeholder="Home Club" style="padding: 7px 10px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 12px;" />
    <input type="text" name="away" defaultValue="Chelsea" placeholder="Away Club" style="padding: 7px 10px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 12px;" />
  </div>
  <button type="submit" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 0; background: #16a34a; color: #fff; font-weight: 700; font-size: 12px; cursor: pointer;">
    Simulate 1X2 Odds &amp; Score Matrix on PredictPro.guru
  </button>
  <div style="font-size: 11px; margin-top: 8px; text-align: center; color: #94a3b8;">
    Powered by <a href="${targetCanonicalUrl}" style="color: #4ade80; font-weight: 700; text-decoration: underline;">${targetHub.anchorText}</a>
  </div>
</form>`;

  // 4. Text Citation Backlink (Zero-Iframe Blockquote)
  const semanticCitationHtmlCode = `<!-- PredictPro Direct SEO & Search Citation Block (Zero-Iframe Crawlability) -->
<blockquote cite="${targetCanonicalUrl}" style="max-width: ${width}; width: 100%; margin: 14px auto; padding: 16px; border-radius: 12px; border: 1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}; background: ${theme === 'dark' ? '#0f172a' : '#ffffff'}; color: ${theme === 'dark' ? '#f8fafc' : '#0f172a'}; font-family: system-ui, -apple-system, sans-serif;">
  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #16a34a; font-weight: 800; margin-bottom: 6px;">
    PredictPro · ${active.name}
  </div>
  <div style="font-size: 15px; font-weight: 800; margin-bottom: 8px;">
    ${active.sampleMatch} — ${active.samplePick} (@${active.sampleOdds} · ${active.sampleConfidence})
  </div>
  <div style="font-size: 12px; color: #64748b; margin-bottom: 10px; font-family: monospace;">
    Expected Goals (xG): ${active.sampleXg} | Projected Scoreline: ${active.sampleScore}
  </div>
  <footer style="font-size: 11px; border-top: 1px solid rgba(148,163,184,0.25); padding-top: 8px;">
    Source: <a href="${targetCanonicalUrl}" title="${targetHub.anchorText}" style="color: #16a34a; font-weight: 700; text-decoration: underline;">${targetHub.anchorText}</a>
  </footer>
</blockquote>`;

  const activeCode =
    embedFormat === 'iframe'
      ? iframeEmbedCode
      : embedFormat === 'image-badge'
      ? imageBadgeEmbedCode
      : embedFormat === 'form-widget'
      ? formWidgetEmbedCode
      : semanticCitationHtmlCode;

  const copyCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    toast.success('Embed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="Free Embeddable Football Predictions Widgets, SVG Badges & Feeds"
        description="Embed live football predictions, SVG authority badges, 10.0 player radars, and xPTS Justice Table widgets on your sports blog with contextual SEO attribution."
        canonical="/widgets"
        keywords="embed football predictions widget, sports blog widget, soccer odds iframe, free football prediction widget, live score widget, player radar embed"
      />
      <Navbar />

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 max-w-6xl space-y-8">
        {/* Dark Broadcast Header Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Publisher Syndication Studio · Iframe, Image Badge, Form &amp; Citation Embeds
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Embeddable Football Widgets, SVG Authority Badges &amp; Data Feeds
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Embed live matchday probabilities, 0.0–10.0 player radars, xPTS Justice Tables, verified SVG authority badges, and interactive Poisson calculators on your sports blog, forum, or news site.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a href="/disavow-predictpro-guru.txt" download="disavow-predictpro-guru.txt">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                GSC Disavow File (.txt)
              </Button>
            </a>
            <Button
              size="sm"
              onClick={copyCode}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied Active Code' : 'Copy Active Embed'}
            </Button>
          </div>
        </div>

        {/* 4 Backlink Modality Cards (Text, Image, Frame, Form) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-border shadow-none">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Code2 className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-bold text-foreground">1. Frame + Text Widgets</h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Responsive `&lt;iframe&gt;` widgets paired with a crawlable dofollow footer link to any deep league or market hub.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-bold text-foreground">2. SVG Authority Badges</h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  High-contrast SVG badges (`&lt;img alt=&quot;...&quot;&gt;`) that build verified Image backlinks and semantic `alt` anchor equity.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <FormInput className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-bold text-foreground">3. Interactive Form Embed</h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Embeddable `&lt;form&gt;` simulator that lets readers run Poisson club matchups directly from partner websites.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Globe className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-bold text-foreground">4. Semantic HTML Citation</h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Zero-iframe `&lt;blockquote cite=&quot;...&quot;&gt;` snippets with descriptive keyword anchors for instant crawler indexing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Widget Configurator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="border-border shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">1. Select Embed Format (Link Type)</CardTitle>
                <CardDescription className="text-xs">
                  Diversify backlink modalities across Frame, Image Badge, Form, and Text Citation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={embedFormat === 'iframe' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmbedFormat('iframe')}
                    className="text-xs font-bold justify-start gap-1.5"
                  >
                    <Code2 className="h-3.5 w-3.5" /> Iframe (Frame)
                  </Button>
                  <Button
                    type="button"
                    variant={embedFormat === 'image-badge' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmbedFormat('image-badge')}
                    className="text-xs font-bold justify-start gap-1.5"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> SVG Badge (Image)
                  </Button>
                  <Button
                    type="button"
                    variant={embedFormat === 'form-widget' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmbedFormat('form-widget')}
                    className="text-xs font-bold justify-start gap-1.5"
                  >
                    <FormInput className="h-3.5 w-3.5" /> Mini Sim (Form)
                  </Button>
                  <Button
                    type="button"
                    variant={embedFormat === 'citation-html' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmbedFormat('citation-html')}
                    className="text-xs font-bold justify-start gap-1.5"
                  >
                    <Globe className="h-3.5 w-3.5" /> Citation (Text)
                  </Button>
                </div>

                {embedFormat === 'image-badge' && (
                  <div className="pt-2 border-t border-border space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Select SVG Authority Badge Design
                    </label>
                    <div className="space-y-1.5">
                      {SVG_AUTHORITY_BADGES.map((badge) => (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => setSelectedBadgeId(badge.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                            selectedBadgeId === badge.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card hover:bg-muted/50'
                          }`}
                        >
                          <span>{badge.label}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">260×60 SVG</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Deep-Link Target Hub &amp; Semantic Anchor Text
                  </label>
                  <div className="relative">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      aria-label="Attribution Target Hub"
                      value={targetHubPath}
                      onChange={(e) => setTargetHubPath(e.target.value)}
                      className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {TARGET_ANCHOR_HUBS.map((hub) => (
                        <option key={hub.path} value={hub.path}>
                          {hub.path} — {hub.anchorText}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Embeds semantic keyword anchor text (&ldquo;{targetHub.anchorText}&rdquo;) to distribute link equity across deep pages.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Color Theme
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        type="button"
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme('dark')}
                        className="text-xs h-8"
                      >
                        Dark
                      </Button>
                      <Button
                        type="button"
                        variant={theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme('light')}
                        className="text-xs h-8"
                      >
                        Light
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Width
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['100%', '480px', '320px'] as const).map((w) => (
                        <Button
                          key={w}
                          type="button"
                          variant={width === w ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setWidth(w)}
                          className="text-[11px] h-8 px-2"
                        >
                          {w === '100%' ? 'Auto' : w}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">2. Choose Widget Telemetry Feed</CardTitle>
                <CardDescription className="text-xs">Select the matchday module to display</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {WIDGET_TYPES.map((widget) => {
                  const isSelected = selectedWidget === widget.id;
                  return (
                    <button
                      key={widget.id}
                      type="button"
                      onClick={() => setSelectedWidget(widget.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="mt-0.5">{widget.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs flex items-center justify-between gap-2">
                          <span className="truncate">{widget.name}</span>
                          {isSelected && (
                            <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {widget.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Preview & Code Column */}
          <div className="lg:col-span-7 space-y-5">
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold">Live Embed Preview</CardTitle>
                  <CardDescription className="text-xs">
                    Rendered output for {embedFormat === 'image-badge' ? 'SVG Image Badge' : embedFormat === 'form-widget' ? 'Interactive Form Simulator' : active.name}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  DoFollow + Anchor Ready
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="p-5 bg-muted/30 rounded-xl border border-dashed flex flex-col items-center justify-center gap-3">
                  {embedFormat === 'image-badge' ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <img
                        src={activeBadge.src}
                        alt={targetHub.anchorText}
                        width={260}
                        height={60}
                        className="rounded-xl shadow-sm"
                      />
                      <span className="text-[11px] text-muted-foreground text-center">
                        Image <code className="text-primary">alt</code> attribute: <strong>&ldquo;{targetHub.anchorText}&rdquo;</strong>
                      </span>
                    </div>
                  ) : (
                    <div style={{ maxWidth: width, width: '100%' }}>
                      <div
                        className={`rounded-xl border p-5 shadow-sm transition-all ${
                          theme === 'dark' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="font-extrabold text-sm tracking-tight">PredictPro</span>
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                            {active.name}
                          </span>
                        </div>

                        <div className="py-4 space-y-3">
                          <div className="flex justify-between items-center text-xs gap-2">
                            <span className="font-bold truncate">{active.sampleMatch}</span>
                            <span className="text-emerald-500 font-mono font-extrabold shrink-0">{active.sampleConfidence}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex justify-between items-center gap-2">
                            <span className="font-semibold text-emerald-500 truncate">{active.samplePick}</span>
                            <span className="font-mono font-black shrink-0">@{active.sampleOdds}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 flex justify-between gap-2">
                            <span>xG: {active.sampleXg}</span>
                            <span>Projection: {active.sampleScore}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-700/40 text-[10px] text-center text-slate-400">
                          Statistical Match Telemetry by <span className="text-emerald-400 font-bold">PredictPro.guru</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-center mt-2 text-muted-foreground">
                        Source:{' '}
                        <a href={targetCanonicalUrl} className="text-primary font-semibold hover:underline">
                          {targetHub.anchorText}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Embed Code Snippet */}
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold">Copy-Paste HTML Snippet</CardTitle>
                  <CardDescription className="text-xs">
                    Includes self-referencing canonical target ({targetCanonicalUrl}) and descriptive keyword anchor
                  </CardDescription>
                </div>
                <Button size="sm" onClick={copyCode} className="gap-1.5 text-xs font-bold">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy Code'}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed whitespace-pre-wrap">
                  {activeCode}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Semrush Backlink Hygiene & Disavow Protection Panel */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Badge variant="outline" className="text-[10px] font-bold text-amber-600 dark:text-amber-400 border-amber-500/30 mb-1">
                  Domain Authority &amp; Backlink Hygiene · Semrush Audit Verified
                </Badge>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Low-Authority Scraper Disavow File &amp; Open Data Syndication Feeds
                </CardTitle>
                <CardDescription className="text-xs">
                  Protects predictpro.guru against automated low-reputation (AS 0–10) .shop / .online / .xyz scraper networks while exposing clean RSS, LLMs.txt, and OpenAPI feeds for legitimate sports publishers.
                </CardDescription>
              </div>
              <a href="/disavow-predictpro-guru.txt" download="disavow-predictpro-guru.txt">
                <Button size="sm" variant="outline" className="text-xs font-bold gap-1.5">
                  <Download className="h-3.5 w-3.5 text-primary" />
                  Download GSC Disavow File (.txt)
                </Button>
              </a>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-amber-500" /> RSS 2.0 Feed
                </span>
                <p className="text-[11px] text-muted-foreground">/rss.xml — Editorial &amp; guides</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            <a
              href="/feed-predictions.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-rose-500" /> Predictions Feed
                </span>
                <p className="text-[11px] text-muted-foreground">/feed-predictions.xml — Daily tips</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            <a
              href="/llms-full.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> LLMs-Full.txt
                </span>
                <p className="text-[11px] text-muted-foreground">/llms-full.txt — Search citations</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            <a
              href="/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <Code2 className="h-4 w-4 text-blue-500" /> OpenAPI 3.1
                </span>
                <p className="text-[11px] text-muted-foreground">/openapi.json — Data schema</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
