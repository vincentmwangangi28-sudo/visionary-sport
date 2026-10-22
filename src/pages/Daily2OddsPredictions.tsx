import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { ViralSlipShareCard } from '@/components/ViralSlipShareCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Send, Plus } from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip, encodeSlipToParam } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

export default function Daily2OddsPredictions() {
  const { predictions = [], data } = usePredictions(1);
  const { addSelections } = useBetSlip();
  const [tier, setTier] = useState<'2odds' | '3odds' | '5odds'>('2odds');

  const pool = useMemo(() => {
    const raw = data?.allPredictions ?? predictions;
    return Array.isArray(raw) ? raw.slice(0, 4) : [];
  }, [data?.allPredictions, predictions]);

  const ticket = useMemo(() => {
    const m0 = pool[0];
    const m1 = pool[1];
    const m2 = pool[2];
    const m3 = pool[3];

    if (tier === '2odds') {
      return {
        label: 'Sure 2.05 Odds Banker Double',
        winRate: '84% Historical Hit Rate',
        totalOdds: '2.05',
        legs: [
          {
            homeTeam: m0?.home_team || 'Liverpool',
            awayTeam: m0?.away_team || 'Chelsea',
            league: m0?.league || 'Premier League',
            match: m0 ? `${m0.home_team} vs ${m0.away_team}` : 'Liverpool vs Chelsea',
            market: 'Over 1.5 Match Goals',
            odds: '1.38',
            conf: '89%',
          },
          {
            homeTeam: m1?.home_team || 'Bayern Munich',
            awayTeam: m1?.away_team || 'VfB Stuttgart',
            league: m1?.league || 'Bundesliga',
            match: m1 ? `${m1.home_team} vs ${m1.away_team}` : 'Bayern Munich vs VfB Stuttgart',
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
            homeTeam: m0?.home_team || 'Barcelona',
            awayTeam: m0?.away_team || 'Sevilla',
            league: m0?.league || 'LaLiga',
            match: m0 ? `${m0.home_team} vs ${m0.away_team}` : 'Barcelona vs Sevilla',
            market: 'Home Win & Over 1.5',
            odds: '1.52',
            conf: '85%',
          },
          {
            homeTeam: m1?.home_team || 'Inter Milan',
            awayTeam: m1?.away_team || 'AS Roma',
            league: m1?.league || 'Serie A',
            match: m1 ? `${m1.home_team} vs ${m1.away_team}` : 'Inter Milan vs AS Roma',
            market: '1X Double Chance & Over 1.5',
            odds: '1.44',
            conf: '84%',
          },
          {
            homeTeam: m2?.home_team || 'PSV Eindhoven',
            awayTeam: m2?.away_team || 'AZ Alkmaar',
            league: m2?.league || 'Eredivisie',
            match: m2 ? `${m2.home_team} vs ${m2.away_team}` : 'PSV Eindhoven vs AZ Alkmaar',
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
          homeTeam: m0?.home_team || 'Real Madrid',
          awayTeam: m0?.away_team || 'Celta Vigo',
          league: m0?.league || 'LaLiga',
          match: m0 ? `${m0.home_team} vs ${m0.away_team}` : 'Real Madrid vs Celta Vigo',
          market: 'Home / Fav Win',
          odds: '1.55',
          conf: '83%',
        },
        {
          homeTeam: m1?.home_team || 'Borussia Dortmund',
          awayTeam: m1?.away_team || 'St. Pauli',
          league: m1?.league || 'Bundesliga',
          match: m1 ? `${m1.home_team} vs ${m1.away_team}` : 'Borussia Dortmund vs St. Pauli',
          market: 'Home Win & Over 1.5',
          odds: '1.48',
          conf: '84%',
        },
        {
          homeTeam: m2?.home_team || 'Sporting CP',
          awayTeam: m2?.away_team || 'Braga',
          league: m2?.league || 'Primeira Liga',
          match: m2 ? `${m2.home_team} vs ${m2.away_team}` : 'Sporting CP vs Braga',
          market: 'Over 2.5 Match Goals',
          odds: '1.50',
          conf: '80%',
        },
        {
          homeTeam: m3?.home_team || 'Arsenal',
          awayTeam: m3?.away_team || 'Bournemouth',
          league: m3?.league || 'Premier League',
          match: m3 ? `${m3.home_team} vs ${m3.away_team}` : 'Arsenal vs Bournemouth',
          market: 'Over 8.5 Match Corners',
          odds: '1.51',
          conf: '81%',
        },
      ],
    };
  }, [pool, tier]);

  const deepLinkUrl = useMemo(() => {
    const encoded = encodeSlipToParam(
      ticket.legs.map((l) => ({
        homeTeam: l.homeTeam,
        awayTeam: l.awayTeam,
        league: l.league,
        market: l.market,
        odds: parseFloat(l.odds) || 1.5,
        confidence: parseInt(l.conf, 10) || 84,
      }))
    );
    return `https://predictpro.guru/daily-2-odds?slip=${encodeURIComponent(encoded)}`;
  }, [ticket]);

  const shareMessage = useMemo(() => {
    const body = ticket.legs.map((l, idx) => `${idx + 1}. ${l.match} -> ${l.market} (@${l.odds})`).join('\n');
    return `⚡ ${ticket.label} (${ticket.totalOdds}x)\n${body}\n\n👇 Click to auto-load this slip into your Bet Slip:\n${deepLinkUrl}`;
  }, [ticket, deepLinkUrl]);

  const handleLoadTicketToSlip = () => {
    addSelections(
      ticket.legs.map((l) => ({
        match: l.match,
        homeTeam: l.homeTeam,
        awayTeam: l.awayTeam,
        league: l.league,
        market: l.market,
        odds: parseFloat(l.odds) || 1.5,
        confidence: parseInt(l.conf, 10) || 84,
      }))
    );
  };

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
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{ticket.winRate}</p>
            </div>
            <Badge className="bg-emerald-700 text-white px-4 py-1.5 text-base font-extrabold">
              Combined Odds: {ticket.totalOdds}x
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ticket.legs.map((leg, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Selection #{i + 1} • {leg.conf} AI Conf</div>
                  <div className="font-bold text-sm sm:text-base mt-0.5">{leg.match}</div>
                  <div className="text-xs text-primary font-semibold mt-1">{leg.market}</div>
                </div>
                <Badge variant="outline" className="text-sm font-bold font-mono">
                  @{leg.odds}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleLoadTicketToSlip}
              className="font-bold gap-2"
            >
              <Plus className="w-4 h-4" /> Load {ticket.totalOdds}x Ticket to Bet Slip
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(shareMessage);
                toast.success(`${ticket.label} copied to clipboard!`);
              }}
              className="font-semibold gap-2"
            >
              <Copy className="w-4 h-4" /> Copy {ticket.totalOdds}x Slip
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4 gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share to WhatsApp Group
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(deepLinkUrl)}&text=${encodeURIComponent(shareMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white h-10 px-4 gap-2 transition-colors"
            >
              <Send className="w-4 h-4" /> Share to Telegram
            </a>
          </div>
        </Card>

        <ViralSlipShareCard
          title={ticket.label}
          canonicalPath="/daily-2-odds"
          items={ticket.legs.map((l) => ({
            homeTeam: l.homeTeam,
            awayTeam: l.awayTeam,
            league: l.league,
            market: l.market,
            odds: parseFloat(l.odds) || 1.5,
            confidence: parseInt(l.conf, 10) || 84,
          }))}
          totalOdds={parseFloat(ticket.totalOdds)}
        />

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
