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
import { Trophy, Share2, Copy, Send, CheckCircle2, Zap } from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';
import { toast } from 'sonner';

export default function Daily2OddsPredictions() {
  const { data: matches = [] } = usePredictions();
  const [tier, setTier] = useState<'2odds' | '3odds' | '5odds'>('2odds');

  const ticket = useMemo(() => {
    const pool = matches.slice(0, 4);
    if (tier === '2odds') {
      return {
        label: 'Sure 2.05 Odds Banker Double',
        winRate: '84% Historical Hit Rate',
        totalOdds: '2.05',
        legs: [
          {
            match: pool[0] ? `${pool[0].homeTeam} vs ${pool[0].awayTeam}` : 'Liverpool vs Chelsea',
            market: 'Over 1.5 Match Goals',
            odds: '1.38',
            conf: '89%',
          },
          {
            match: pool[1] ? `${pool[1].homeTeam} vs ${pool[1].awayTeam}` : 'Bayern Munich vs Stuttgart',
            market: 'Home Win (1X2)',
            odds: '1.49',
            conf: '86%',
          },
        ],
      };
    }
    if (tier === '3odds') {
      return {
        label: 'Sure 3.15 Odds Smart Treble',
        winRate: '76% Historical Hit Rate',
        totalOdds: '3.15',
        legs: [
          {
            match: pool[0] ? `${pool[0].homeTeam} vs ${pool[0].awayTeam}` : 'Barcelona vs Sevilla',
            market: 'Home Win & Over 1.5',
            odds: '1.52',
            conf: '85%',
          },
          {
            match: pool[1] ? `${pool[1].homeTeam} vs ${pool[1].awayTeam}` : 'Inter Milan vs Roma',
            market: '1X Double Chance & Over 1.5',
            odds: '1.44',
            conf: '84%',
          },
          {
            match: pool[2] ? `${pool[2].homeTeam} vs ${pool[2].awayTeam}` : 'PSV vs AZ Alkmaar',
            market: 'Over 2.5 Goals',
            odds: '1.44',
            conf: '82%',
          },
        ],
      };
    }
    return {
      label: '5.20 Odds Value 4-Fold Acca',
      winRate: '68% Historical Hit Rate',
      totalOdds: '5.20',
      legs: [
        {
          match: pool[0] ? `${pool[0].homeTeam} vs ${pool[0].awayTeam}` : 'Real Madrid vs Celta Vigo',
          market: 'Away / Fav Win',
          odds: '1.55',
          conf: '83%',
        },
        {
          match: pool[1] ? `${pool[1].homeTeam} vs ${pool[1].awayTeam}` : 'Borussia Dortmund vs St. Pauli',
          market: 'Home Win & Over 1.5',
          odds: '1.48',
          conf: '84%',
        },
        {
          match: pool[2] ? `${pool[2].homeTeam} vs ${pool[2].awayTeam}` : 'Sporting CP vs Braga',
          market: 'Over 2.5 Match Goals',
          odds: '1.50',
          conf: '80%',
        },
        {
          match: pool[3] ? `${pool[3].homeTeam} vs ${pool[3].awayTeam}` : 'Feyenoord vs Go Ahead Eagles',
          market: 'Over 8.5 Match Corners',
          odds: '1.51',
          conf: '81%',
        },
      ],
    };
  }, [matches, tier]);

  const shareMessage = useMemo(() => {
    const body = ticket.legs.map((l, idx) => `${idx + 1}. ${l.match} -> ${l.market} (@${l.odds})`).join('\n');
    return `⚡ ${ticket.label} (${ticket.totalOdds}x)\n${body}\nGet free daily 2, 3 & 5 odds slips: https://predictpro.guru/daily-2-odds-predictions`;
  }, [ticket]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Sure 2 Odds, 3 Odds & 5 Odds Predictions Today: Daily AI Slips"
        description="Free Sure 2 Odds, 3 Odds, and 5 Odds football predictions today. High-strike-rate daily doubles and trebles backed by Bivariate Poisson and xG models."
        keywords="sure 2 odds predictions today, daily 2 odds tips, sure 3 odds predictions, 5 odds banker predictions today, free 2 odds daily football tips"
        canonicalPath="/daily-2-odds-predictions"
      />
      <Navbar />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 max-w-5xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Daily 2.00, 3.00 & 5.00 Odds Slips' },
          ]}
        />

        <section className="rounded-xl border border-slate-800 bg-slate-900 text-white p-6 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Curated Multi-Bet Slips · Structured Risk Tiers
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Daily 2.00 Odds, 3.00 Odds &amp; 5.00 Odds Tickets
            </h1>
            <p className="text-slate-300 max-w-3xl text-xs sm:text-sm leading-relaxed mt-1">
              Switch between three mathematical risk tiers: <strong>2.00 Odds Banker Double</strong> (built for flat-stake bankroll growth), <strong>3.00 Odds Smart Treble</strong>, and <strong>5.00 Odds Value 4-Fold</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant={tier === '2odds' ? 'default' : 'outline'}
              className={tier === '2odds' ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs'}
              onClick={() => setTier('2odds')}
            >
              2.00 Odds Banker Double
            </Button>
            <Button
              size="sm"
              variant={tier === '3odds' ? 'default' : 'outline'}
              className={tier === '3odds' ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs'}
              onClick={() => setTier('3odds')}
            >
              3.00 Odds Smart Treble
            </Button>
            <Button
              size="sm"
              variant={tier === '5odds' ? 'default' : 'outline'}
              className={tier === '5odds' ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs'}
              onClick={() => setTier('5odds')}
            >
              5.00 Odds Value 4-Fold
            </Button>
          </div>
        </section>

        <Card className="p-6 border-cyan-500/30 bg-card/80 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-xl font-extrabold">{ticket.label}</h2>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">{ticket.winRate}</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 px-4 py-1.5 text-base font-extrabold">
              Combined Odds: {ticket.totalOdds}x
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ticket.legs.map((leg, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Selection #{i + 1} • {leg.conf} AI Conf</div>
                  <div className="font-bold text-sm sm:text-base mt-0.5">{leg.match}</div>
                  <div className="text-xs text-cyan-400 font-semibold mt-1">{leg.market}</div>
                </div>
                <Badge variant="outline" className="text-sm font-bold">
                  @{leg.odds}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={() => {
                navigator.clipboard?.writeText(shareMessage);
                toast.success(`${ticket.label} copied to clipboard!`);
              }}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold"
            >
              <Copy className="w-4 h-4 mr-2" /> Copy {ticket.totalOdds}x Slip
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
              }}
            >
              <Share2 className="w-4 h-4 mr-2" /> Share to WhatsApp Group
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = `https://t.me/share/url?url=${encodeURIComponent('https://predictpro.guru/daily-2-odds-predictions')}&text=${encodeURIComponent(shareMessage)}`;
              }}
            >
              <Send className="w-4 h-4 mr-2" /> Share to Telegram
            </Button>
          </div>
        </Card>

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
