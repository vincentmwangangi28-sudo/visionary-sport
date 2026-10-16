import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { Zap, Radio, TrendingUp, Sparkles, BarChart3, ExternalLink } from 'lucide-react';

export default function EmbedWidget() {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const theme = searchParams.get('theme') || 'dark';
  const isDark = theme !== 'light';

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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-black text-sm tracking-tight">PredictPro AI</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold gap-1">
            {selected.icon}
            {selected.badge}
          </Badge>
        </div>

        {/* Fixture Info */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            {selected.league}
          </div>
          <div className="text-base font-black flex items-center justify-between">
            <span>{selected.match}</span>
            <span className="text-xs text-emerald-500 font-bold">{selected.confidence}</span>
          </div>
        </div>

        {/* Prediction Box */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">AI Recommended Pick</div>
            <div className="text-sm font-black">{selected.pick}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Decimal Odds</div>
            <div className="text-base font-black">{selected.odds}</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className="text-[10px] text-muted-foreground block">Expected Goals (xG)</span>
            <span className="font-bold">{selected.xg}</span>
          </div>
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className="text-[10px] text-muted-foreground block">Poisson Scoreline</span>
            <span className="font-bold">{selected.score}</span>
          </div>
        </div>
      </div>

      {/* Attribution Footer */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Daily Verified AI Football Stats</span>
        <a
          href="https://predictpro.guru"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors"
        >
          predictpro.guru <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
