import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Zap, Radio, TrendingUp, Sparkles, BarChart3, ExternalLink, Crosshair, Trophy, Tv } from 'lucide-react';

export default function EmbedWidget() {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const theme = (searchParams.get('theme') || 'dark').toLowerCase();
  const isDark = !theme.includes('light');

  const widgetData = {
    banker: {
      title: "Today's Top AI Banker",
      badge: '89% Strike Rate',
      icon: <Zap className="h-4 w-4 text-emerald-400" />,
      match: 'Arsenal vs Chelsea',
      league: 'English Premier League',
      pick: 'Arsenal Win (1X2)',
      odds: '1.95',
      confidence: '87% AI Confidence',
      xg: '2.14 vs 0.98',
      score: '2-0',
      extraLabel: 'Broadcast',
      extraValue: 'Sky Sports / Showmax PL',
    },
    'motd-xg': {
      title: 'Match of the Day xG & Score Matrix',
      badge: '10,000-Run Poisson',
      icon: <Zap className="h-4 w-4 text-emerald-400" />,
      match: 'Arsenal vs Chelsea',
      league: 'Premier League · Match of the Day',
      pick: 'Arsenal Win & Over 1.5 Goals',
      odds: '1.88',
      confidence: '87% Model Lock',
      xg: '2.14 vs 0.98 xG',
      score: '2-0 (18.4%) · 2-1 (14.2%)',
      extraLabel: 'Fair Line',
      extraValue: '1.68 (+10.6% EV)',
    },
    'booking-codes': {
      title: 'Multi-Bookie Booking Code Strip',
      badge: 'Verified VIP Slip',
      icon: <Sparkles className="h-4 w-4 text-amber-400" />,
      match: '4-Fold European +EV Sharp Acca',
      league: 'SportyBet · 1xBet · Betika · Betway',
      pick: 'SB-8942K · 1X-9921P · BTK-7721M',
      odds: '5.14',
      confidence: '84% Combined Hit Rate',
      xg: '+6.1% Net EV Edge',
      score: '4 Verified Legs',
      extraLabel: '1-Click Load',
      extraValue: 'Ready to Convert',
    },
    'daily-bankers': {
      title: 'Top 5 Daily Bankers Ticker',
      badge: '85%+ Consensus',
      icon: <Trophy className="h-4 w-4 text-emerald-400" />,
      match: 'Arsenal · Real Madrid · Bayern · Inter · PSG',
      league: 'Top 5 European & African Slate',
      pick: 'Daily 2.04x Rollover Lock + 3 Bankers',
      odds: '2.04',
      confidence: '88% Strike Rate',
      xg: '+1.12 Avg xG Diff',
      score: '5/5 Green Streak',
      extraLabel: 'Audit Status',
      extraValue: 'SHA-256 Verified',
    },
    'live-scores': {
      title: 'In-Play Match Tracker',
      badge: 'Live xG Ticker',
      icon: <Radio className="h-4 w-4 text-rose-400" />,
      match: 'Real Madrid vs Barcelona',
      league: 'Spanish La Liga',
      pick: 'Both Teams to Score (BTTS: Yes)',
      odds: '1.68',
      confidence: '82% Probability',
      xg: '2.45 vs 2.18',
      score: '2-2',
      extraLabel: 'Field Tilt',
      extraValue: '58% - 42% (Home Surge)',
    },
    btts: {
      title: 'Both Teams to Score Radar',
      badge: 'Poisson Verified',
      icon: <TrendingUp className="h-4 w-4 text-amber-400" />,
      match: 'Bayern Munich vs Dortmund',
      league: 'German Bundesliga',
      pick: 'Over 2.5 Goals & BTTS',
      odds: '1.75',
      confidence: '79% Win Rate',
      xg: '3.10 vs 1.40',
      score: '3-1',
      extraLabel: 'Combined λ',
      extraValue: '4.50 Expected Goals',
    },
    jackpot: {
      title: 'Mega Jackpot Banker Pick',
      badge: '17-Game Slip',
      icon: <Sparkles className="h-4 w-4 text-purple-400" />,
      match: 'Gor Mahia vs AFC Leopards',
      league: 'FKF Kenya Premier League',
      pick: '1X (Home Win or Draw)',
      odds: '1.34',
      confidence: '85% Hedged',
      xg: '1.25 vs 0.65',
      score: '1-0',
      extraLabel: 'TV / Stream',
      extraValue: 'Azam Sports HD / KBC',
    },
    'value-bets': {
      title: 'Positive EV (+EV) Market Edge',
      badge: '+14.2% Edge',
      icon: <BarChart3 className="h-4 w-4 text-blue-400" />,
      match: 'Inter Milan vs AC Milan',
      league: 'Italian Serie A',
      pick: 'Inter Milan Draw No Bet',
      odds: '1.88',
      confidence: '71% AI Model',
      xg: '1.80 vs 1.15',
      score: '2-1',
      extraLabel: 'Pinnacle Fair',
      extraValue: '1.64 (+14.2% CLV)',
    },
    'player-radar': {
      title: '10.0 Player Rating & 5-Axis Radar',
      badge: '8.94 Season Rating',
      icon: <Crosshair className="h-4 w-4 text-emerald-400" />,
      match: 'Erling Haaland vs Kylian Mbappé',
      league: 'UEFA Champions League Telemetry',
      pick: 'Haaland Anytime Goalscorer (0.98 xG/90)',
      odds: '1.72',
      confidence: '99th Percentile Finishing',
      xg: '0.98 vs 0.86 xG/90',
      score: '8.94 vs 8.82 Rating',
      extraLabel: '5-Axis Edge',
      extraValue: 'Finishing 99 · Box Threat 99',
    },
    'xpts-table': {
      title: 'xPTS League Justice Table',
      badge: 'Dixon-Coles xPTS',
      icon: <Trophy className="h-4 w-4 text-amber-400" />,
      match: 'Premier League Title Projection',
      league: 'Expected Points (xPTS) vs Actual',
      pick: 'Liverpool & Arsenal Top xG Differential',
      odds: '1.85',
      confidence: '+1.18 Net xG/90',
      xg: '64.2 xPTS vs 62.8 xPTS',
      score: '#1 vs #2 Justice Rank',
      extraLabel: 'Regression Alert',
      extraValue: '+3.4 xPTS Undervalued',
    },
    'live-pitch': {
      title: '2D Live Pitch & Broadcast Hub',
      badge: 'Sub-15s Telemetry',
      icon: <Tv className="h-4 w-4 text-sky-400" />,
      match: 'Arsenal vs PSG (2D Match Cast)',
      league: 'UEFA Champions League Live',
      pick: 'Home Attacking Wave (+0.44 xG Last 15m)',
      odds: '1.91',
      confidence: '84% Live Win Prob',
      xg: '1.92 vs 0.84 Live xG',
      score: '61% Final-Third Tilt',
      extraLabel: 'Live Broadcasters',
      extraValue: 'SuperSport · TNT · Paramount+',
    },
  };

  const selected = (type && widgetData[type as keyof typeof widgetData]) || widgetData.banker;

  return (
    <div
      className={`min-h-screen p-4 flex flex-col justify-between font-sans ${
        isDark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
      }`}
    >
      <SEO
        title="PredictPro Football Predictions Widget Embed"
        description="Free embeddable live AI football predictions and odds widget."
        noIndex={true}
      />
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-black text-sm tracking-tight">PredictPro AI</span>
            <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
              · {selected.title}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            {selected.icon}
            {selected.badge}
          </span>
        </div>

        {/* Fixture Info */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            {selected.league}
          </div>
          <div className="text-base font-black flex items-center justify-between gap-2">
            <span className="truncate">{selected.match}</span>
            <span className="text-xs font-mono text-emerald-500 font-bold shrink-0">{selected.confidence}</span>
          </div>
        </div>

        {/* Prediction Box */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
            isDark
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">AI Quantitative Projection</div>
            <div className="text-sm font-black truncate">{selected.pick}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Fair Odds</div>
            <div className="text-base font-mono font-black">{selected.odds}</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className="text-[10px] text-muted-foreground block">Expected Goals</span>
            <span className="font-mono font-bold text-[11px]">{selected.xg}</span>
          </div>
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className="text-[10px] text-muted-foreground block">Model Matrix</span>
            <span className="font-mono font-bold text-[11px]">{selected.score}</span>
          </div>
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className="text-[10px] text-muted-foreground block">{selected.extraLabel}</span>
            <span className="font-mono font-bold text-[11px] truncate block">{selected.extraValue}</span>
          </div>
        </div>
      </div>

      {/* Attribution Footer */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Verified Poisson &amp; xG Telemetry</span>
        <a
          href="https://predictpro.guru"
          target="_blank"
          rel="noopener"
          className="text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors"
        >
          predictpro.guru <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
