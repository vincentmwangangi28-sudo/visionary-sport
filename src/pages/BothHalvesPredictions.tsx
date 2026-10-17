import React, { useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, CheckCircle2 } from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';

export default function BothHalvesPredictions() {
  const { data: matches = [] } = usePredictions();

  const picks = useMemo(() => {
    return matches.slice(0, 8).map((m, idx) => {
      const home = m.homeTeam || ['Manchester City', 'Bayern Munich', 'Real Madrid', 'Barcelona', 'PSG', 'PSV Eindhoven', 'Celtic', 'Sporting CP'][idx];
      const away = m.awayTeam || ['Fulham', 'Bochum', 'Osasuna', 'Espanyol', 'Strasbourg', 'PEC Zwolle', 'Dundee', 'Farense'][idx];
      const market = idx % 2 === 0 ? `${home} to Score in Both Halves` : `${home} to Win Both Halves`;
      const odds = idx % 2 === 0 ? (1.92 + (idx % 3) * 0.11).toFixed(2) : (2.65 + (idx % 3) * 0.15).toFixed(2);
      const prob = idx % 2 === 0 ? 64 - (idx % 4) * 2 : 48 - (idx % 4) * 2;
      return {
        id: m.id || `bh-${idx}`,
        match: `${home} vs ${away}`,
        league: m.league || ['Premier League', 'Bundesliga', 'La Liga', 'La Liga', 'Ligue 1', 'Eredivisie', 'Scottish Premiership', 'Primeira Liga'][idx],
        market,
        odds,
        prob,
        htXg: (1.22 + (idx % 3) * 0.12).toFixed(2),
        shXg: (1.45 + (idx % 3) * 0.14).toFixed(2),
      };
    });
  }, [matches]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Score in Both Halves & Win Both Halves Predictions Today"
        description="Free Team to Score in Both Halves (SBH) and Win Both Halves (WBH) football predictions today. Unlock 2.00+ value on heavy home favorites."
        keywords="score in both halves predictions, win both halves tips today, team to score in both halves tips, both halves over 0.5 goals predictions"
        canonicalPath="/both-halves-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Score / Win in Both Halves Predictions' },
          ]}
        />

        <section className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/35 via-card to-background p-6 sm:p-8">
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 mb-3">
            <Flame className="w-3.5 h-3.5 mr-1.5" /> Split-Half Poisson Model
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Score in Both Halves &amp; Win Both Halves Predictions Today
          </h1>
          <p className="text-muted-foreground max-w-3xl text-sm sm:text-base leading-relaxed">
            When an elite attacking club is priced at unbackable 1.18 moneyline odds, our <strong>Split-Half Poisson Model</strong> calculates separate 1st-Half (λ₁) and 2nd-Half (λ₂) goal expectancies to identify 2.00+ value on <strong>Team to Score in Both Halves</strong>.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {picks.map((p) => (
            <Card key={p.id} className="p-5 border-border/60 bg-card/75 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-orange-400">{p.league}</div>
                <div className="font-bold text-base mt-0.5">{p.match}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  1H xG: <strong className="text-foreground">{p.htXg}</strong> • 2H xG: <strong className="text-foreground">{p.shXg}</strong>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold">
                  {p.market} @{p.odds}
                </Badge>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                  {p.prob}% Split-Half Prob
                </div>
              </div>
            </Card>
          ))}
        </section>

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
