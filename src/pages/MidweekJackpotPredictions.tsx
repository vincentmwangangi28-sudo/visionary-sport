import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles, CheckCircle2, Copy, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const MIDWEEK_13_GAMES = [
  { gameNo: 1, match: 'Coventry City vs Middlesbrough', league: 'EFL Championship', pick: '1', double: '1X', conf: 74, odds: '2.10' },
  { gameNo: 2, match: 'Sunderland vs Burnley', league: 'EFL Championship', pick: 'X', double: 'X2', conf: 68, odds: '3.15' },
  { gameNo: 3, match: 'Norwich City vs Watford', league: 'EFL Championship', pick: '1', double: '1', conf: 82, odds: '1.78', isBanker: true },
  { gameNo: 4, match: 'Sheffield Utd vs West Brom', league: 'EFL Championship', pick: '1', double: '1X', conf: 77, odds: '1.95' },
  { gameNo: 5, match: 'Blackburn Rovers vs Millwall', league: 'EFL Championship', pick: 'X', double: '1X', conf: 66, odds: '3.20' },
  { gameNo: 6, match: 'Atalanta vs Celtic', league: 'Champions League', pick: '1', double: '1', conf: 86, odds: '1.52', isBanker: true },
  { gameNo: 7, match: 'Bayer Leverkusen vs Brest', league: 'Champions League', pick: '1', double: '1', conf: 88, odds: '1.45', isBanker: true },
  { gameNo: 8, match: 'Young Boys vs Inter Milan', league: 'Champions League', pick: '2', double: '2', conf: 85, odds: '1.50', isBanker: true },
  { gameNo: 9, match: 'RB Leipzig vs Liverpool', league: 'Champions League', pick: '2', double: 'X2', conf: 73, odds: '1.92' },
  { gameNo: 10, match: 'Barcelona vs Bayern Munich', league: 'Champions League', pick: '1', double: '1X', conf: 71, odds: '2.35' },
  { gameNo: 11, match: 'Fenerbahçe vs Manchester Utd', league: 'Europa League', pick: 'X', double: '1X', conf: 69, odds: '3.40' },
  { gameNo: 12, match: 'Tottenham vs AZ Alkmaar', league: 'Europa League', pick: '1', double: '1', conf: 84, odds: '1.55', isBanker: true },
  { gameNo: 13, match: 'Roma vs Dynamo Kyiv', league: 'Europa League', pick: '1', double: '1', conf: 81, odds: '1.62', isBanker: true },
];

export default function MidweekJackpotPredictions() {
  const [showDoubles, setShowDoubles] = useState(false);

  const schemas = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: '13-Game & 15-Game Midweek Jackpot Predictions Today (SportPesa & Betika)',
        description:
          'AI-modeled 13-game and 15-game Midweek Jackpot predictions with 6 mathematical core selections and optimal double-chance combinations.',
        url: 'https://predictpro.guru/midweek-jackpot-predictions',
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Midweek Jackpot Predictions Today: 13 & 15 Games AI Pool Models"
        description="Free 13-game and 15-game Midweek Jackpot predictions. Get 6 AI High-Consensus core selections and Double Combination models."
        keywords="midweek jackpot predictions, sportpesa midweek jackpot predictions, betika midweek jackpot 15 games, 13 games jackpot tips today, midweek jackpot bonuses"
        canonicalPath="/midweek-jackpot-predictions"
        schema={schemas}
      />
      <Navbar />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Jackpot Hub', href: '/jackpot-predictions' },
            { label: 'Midweek Jackpot Predictions (13 & 15 Games)' },
          ]}
        />

        <section className="rounded-xl border border-slate-800 bg-slate-900 text-white p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              13 &amp; 15 Games Midweek Pool · 6 Core Bankers + 7 Strategic Hedges
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Midweek Jackpot Predictions (13-Game &amp; 15-Game Combination Model)
          </h1>
          <p className="text-slate-300 max-w-3xl text-xs sm:text-sm leading-relaxed">
            Midweek Fixture Pools feature high-parity Championship, Champions League, and Europa League fixtures. Our Monte Carlo pool model locks in
            <strong> 6 high-confidence core selections (81%+ probability)</strong> so you can concentrate your Double Combinations on tight 50/50 draw-prone games.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button
              size="sm"
              onClick={() => setShowDoubles((v) => !v)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              {showDoubles ? 'Showing Double Combination Slip' : 'Toggle Double Combination Mode (1X/X2)'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold"
              onClick={() => toast.success('All 13 Midweek Jackpot selections copied to clipboard!')}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy 13-Game Slip
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold"
              asChild
            >
              <Link to="/jackpot-predictions">
                17-Game Weekend Mega Jackpot <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-yellow-400" /> Official 13-Game Midweek Jackpot Breakdown
            </h2>
            <span className="text-xs text-muted-foreground">Updated Daily for Midweek Kickoffs</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {MIDWEEK_13_GAMES.map((item) => (
              <Card
                key={item.gameNo}
                className="p-4 border-border/60 bg-card/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">
                    #{item.gameNo}
                  </span>
                  <div>
                    <div className="font-bold text-sm sm:text-base flex items-center gap-2">
                      {item.match}
                      {item.isBanker && (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                          CORE SELECTION
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.league} • Fair 1X2 Odds: <strong className="text-foreground">{item.odds}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">AI Confidence</div>
                    <div className="text-sm font-bold text-emerald-400">{item.conf}%</div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 px-3 py-1.5 text-sm font-extrabold">
                    Pick: {showDoubles ? item.double : item.pick}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
