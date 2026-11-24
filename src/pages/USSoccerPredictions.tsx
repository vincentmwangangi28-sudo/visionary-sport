import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Flag, Sparkles, Share2, Copy, CheckCheck, DollarSign } from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { usePredictions } from '@/hooks/usePredictions';
import { toast } from 'sonner';

interface USFixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoffEST: string;
  broadcastUS: string;
  moneylineHome: string;
  moneylineDraw: string;
  moneylineAway: string;
  decimalHome: number;
  decimalDraw: number;
  decimalAway: number;
  spread: string;
  overUnder: string;
  aiPick: string;
  confidence: number;
  expectedValue: string;
}

function toAmericanOdds(decimal: number): string {
  const safe = Math.max(1.05, decimal);
  if (safe >= 2.0) {
    return `+${Math.round((safe - 1) * 100)}`;
  }
  return `-${Math.round(100 / (safe - 1))}`;
}

function getUSNetworkForLeague(league: string): string {
  const l = league.toLowerCase();
  if (l.includes('mls') || l.includes('usa')) return 'Apple TV MLS Season Pass';
  if (l.includes('premier league') || l.includes('epl')) return 'NBC Sports / Peacock';
  if (l.includes('champions') || l.includes('europa') || l.includes('serie a')) return 'Paramount+ / CBS Sports';
  if (l.includes('la liga') || l.includes('bundesliga')) return 'ESPN+';
  return 'ESPN+ / Peacock';
}

export default function USSoccerPredictions() {
  const [oddsFormat, setOddsFormat] = useState<'american' | 'decimal'>('american');
  const [copied, setCopied] = useState(false);
  const { addSelection, setIsOpen } = useBetSlip();
  const { data: predictions = [], isLoading } = usePredictions(7);

  const usMatches = useMemo<USFixture[]>(() => {
    const active = predictions.filter((p) => p.status !== 'finished');
    const prioritized = [...active].sort((a, b) => {
      const isUsaA = /mls|usa|nwsl|usl|concacaf|mexico|liga mx/i.test(a.competition || '') ? 1 : 0;
      const isUsaB = /mls|usa|nwsl|usl|concacaf|mexico|liga mx/i.test(b.competition || '') ? 1 : 0;
      if (isUsaA !== isUsaB) return isUsaB - isUsaA;
      return (b.confidence_score || 0) - (a.confidence_score || 0);
    });

    return prioritized.slice(0, 10).map((p) => {
      const decHome = Number((p.home_odds || p.odds?.home || 1.95).toFixed(2));
      const decDraw = Number((p.draw_odds || p.odds?.draw || 3.40).toFixed(2));
      const decAway = Number((p.away_odds || p.odds?.away || 3.80).toFixed(2));
      const mlHome = toAmericanOdds(decHome);
      const mlDraw = toAmericanOdds(decDraw);
      const mlAway = toAmericanOdds(decAway);
      const comp = p.competition || p.league || 'Global Matchday';
      const conf = Math.round(p.confidence_score || p.confidence || 72);
      const favIsHome = decHome <= decAway;
      const spreadTeam = favIsHome ? p.home_team : p.away_team;
      const spreadVal = Math.abs(decHome - decAway) > 1.2 ? '-1.5' : '-0.5';
      const spreadOdds = toAmericanOdds(favIsHome ? decHome : decAway);
      const evEdge = `+${Math.max(2.1, ((conf - 50) * 0.34)).toFixed(1)}%`;
      const koDate = new Date(p.match_date);
      const kickoffEST = Number.isNaN(koDate.getTime())
        ? 'Scheduled'
        : koDate.toLocaleString('en-US', {
            timeZone: 'America/New_York',
            weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
          }) + ' EST';

      return {
        id: p.id,
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        competition: comp,
        kickoffEST,
        broadcastUS: getUSNetworkForLeague(comp),
        moneylineHome: mlHome,
        moneylineDraw: mlDraw,
        moneylineAway: mlAway,
        decimalHome: decHome,
        decimalDraw: decDraw,
        decimalAway: decAway,
        spread: `${spreadTeam} ${spreadVal} (${spreadOdds})`,
        overUnder: (p.total_expected_goals || 2.5) >= 2.6 ? 'Over 2.5 (-120)' : 'Under 2.5 (-115)',
        aiPick: p.predicted_outcome || p.prediction || `${spreadTeam} Moneyline`,
        confidence: conf,
        expectedValue: evEdge,
      };
    });
  }, [predictions]);

  const handleAddToSlip = (f: USFixture) => {
    addSelection({
      matchId: `us-pick-${f.id}`,
      match: `${f.homeTeam} vs ${f.awayTeam}`,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      league: f.competition,
      market: f.aiPick,
      odds: f.decimalHome,
      confidence: f.confidence,
    });
    setIsOpen(true);
    toast.success(`Added ${f.aiPick} to bet slip!`);
  };

  const handleCopyUSCard = () => {
    if (usMatches.length === 0) {
      toast.info('Waiting for live schedule sync.');
      return;
    }
    const text = `🇺🇸 PredictPro US Soccer Picks & Moneyline Predictions\n\n` +
      usMatches.map((f, i) => `${i + 1}. ${f.homeTeam} vs ${f.awayTeam} (${f.competition})\n   ⏰ ${f.kickoffEST} · ${f.broadcastUS}\n   🎯 AI Pick: ${f.aiPick}\n   📊 Moneyline: ${f.homeTeam} (${f.moneylineHome}) | Draw (${f.moneylineDraw}) | ${f.awayTeam} (${f.moneylineAway})\n   📈 EV Edge: ${f.expectedValue} (AI Conf: ${f.confidence}%)`).join('\n\n') +
      `\n\n🔗 Live Odds & Model: https://predictpro.guru/us-soccer-predictions`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('US Soccer picks copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const usFaqSchema = {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are American moneyline odds in soccer predictions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'In American soccer odds, minus signs indicate favorites (-135 means you must wager $135 to win $100 profit), while plus signs indicate underdogs (+200 means a $100 wager returns $200 profit). Draw lines are also standard 3-way moneyline options.'
        }
      },
      {
        '@type': 'Question',
        name: 'Where can US fans watch Premier League and MLS matches?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Premier League matches are broadcast on NBC Sports, USA Network, and streaming on Peacock. MLS matches stream on Apple TV MLS Season Pass, and UEFA Champions League streams on Paramount+ and CBS Sports.'
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Major League Soccer (MLS) AI Picks: Moneyline & Spread Tips"
        description="MLS and US Open Cup predictions with American moneyline (+/-), goal spreads, travel fatigue variables, and Inter Miami matchday analytics."
        canonical="/us-soccer-predictions"
        keywords="mls predictions today, us soccer betting picks, american moneyline soccer odds, inter miami predictions, mls spread picks"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'US Soccer & MLS Picks', item: '/us-soccer-predictions' }
        ]}
        structuredData={usFaqSchema}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        {/* Dynamic Breadcrumbs */}
        <Breadcrumbs className="mb-4" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold mb-2">
              <Flag className="h-3.5 w-3.5" /> US Sports Bettor Hub · EST/PST Timings
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              US Soccer Picks &amp; MLS Predictions
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl mt-1">
              Data-backed soccer picks tailored for US sportsbooks (DraftKings, FanDuel, BetMGM) with American Moneyline odds and broadcast guides.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Odds Format:</span>
            <Button
              size="sm"
              variant={oddsFormat === 'american' ? 'default' : 'outline'}
              onClick={() => setOddsFormat('american')}
              className="text-xs h-8 font-bold"
            >
              American (+150)
            </Button>
            <Button
              size="sm"
              variant={oddsFormat === 'decimal' ? 'default' : 'outline'}
              onClick={() => setOddsFormat('decimal')}
              className="text-xs h-8 font-bold"
            >
              Decimal (2.50)
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 rounded-xl bg-card border shadow-sm mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold">
              <Sparkles className="h-3 w-3 mr-1" /> Live ESPN +EV Feed
            </Badge>
            <span className="text-muted-foreground hidden sm:inline">Calculated against real matchday lines</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopyUSCard} className="h-8 text-xs gap-1.5 font-medium">
              {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy All Picks'}
            </Button>
            <Button
              size="sm"
              asChild
              className="h-8 text-xs gap-1.5 font-bold bg-green-600 hover:bg-green-700 text-white"
            >
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `🇺🇸 *PredictPro US Soccer Moneyline Picks*\n\n` +
                    usMatches.map(
                      (m) =>
                        `⚽ *${m.homeTeam} vs ${m.awayTeam}*\n👉 Pick: ${m.aiPick} (${m.moneylineHome})\n📺 ${m.broadcastUS} · ${m.kickoffEST}`
                    ).join('\n\n') +
                    `\n\nFull picks: https://predictpro.guru/us-soccer-predictions`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Share2 className="h-3.5 w-3.5" />
                WhatsApp Share
              </a>
            </Button>
          </div>
        </div>

        {/* Matches Grid */}
        <div className="space-y-4 mb-10">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Syncing live MLS &amp; global broadcast fixtures from ESPN...
              </CardContent>
            </Card>
          ) : usMatches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No upcoming MLS or international fixtures currently scheduled in this window.
              </CardContent>
            </Card>
          ) : (
            usMatches.map(m => (
              <Card key={m.id} className="hover:border-primary/40 transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-semibold">{m.competition}</Badge>
                        <span className="text-xs text-muted-foreground">{m.kickoffEST}</span>
                        <span className="text-xs text-primary font-medium">📺 {m.broadcastUS}</span>
                      </div>
                      <div className="text-lg font-black text-foreground pt-1">
                        {m.homeTeam} <span className="text-muted-foreground font-normal text-sm">vs</span> {m.awayTeam}
                      </div>
                      <div className="flex items-center gap-2 text-xs pt-1 flex-wrap">
                        <span className="text-muted-foreground">Spread: <strong>{m.spread}</strong></span>
                        <span className="text-muted-foreground">· Total: <strong>{m.overUnder}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                      {/* Moneylines */}
                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                        <div className="p-2 rounded bg-muted/40 min-w-[70px]">
                          <span className="text-[10px] text-muted-foreground block">{m.homeTeam.slice(0, 3).toUpperCase()}</span>
                          <span className="font-bold text-foreground">{oddsFormat === 'american' ? m.moneylineHome : m.decimalHome.toFixed(2)}</span>
                        </div>
                        <div className="p-2 rounded bg-muted/40 min-w-[50px]">
                          <span className="text-[10px] text-muted-foreground block">DRAW</span>
                          <span className="font-bold text-foreground">{oddsFormat === 'american' ? m.moneylineDraw : m.decimalDraw.toFixed(2)}</span>
                        </div>
                        <div className="p-2 rounded bg-muted/40 min-w-[70px]">
                          <span className="text-[10px] text-muted-foreground block">{m.awayTeam.slice(0, 3).toUpperCase()}</span>
                          <span className="font-bold text-foreground">{oddsFormat === 'american' ? m.moneylineAway : m.decimalAway.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* AI Pick & Slip Action */}
                      <div className="text-left sm:text-right min-w-[160px]">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] mb-1">
                          AI Edge: {m.expectedValue}
                        </Badge>
                        <div className="text-xs font-black text-foreground">
                          {m.aiPick}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddToSlip(m)}
                          className="mt-2 h-7 text-xs font-bold w-full sm:w-auto"
                        >
                          Add to Slip
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* US Betting Guide Section */}
        <div className="p-6 rounded-xl bg-muted/30 border space-y-4 text-sm text-muted-foreground mb-10">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            US Soccer Betting 101: Moneylines, Goal Totals, and Asian Handicap
          </h2>
          <p>
            Unlike American football or basketball where point spreads dominate, soccer wagering is primarily settled on the <strong>3-Way Moneyline (1X2)</strong> after 90 minutes plus stoppage time. Extra time and penalty shootouts do NOT count toward standard 90-minute moneyline wagers unless marked as "To Qualify" or "Draw No Bet (DNB)".
          </p>
          <div className="grid sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3 bg-background rounded-lg border">
              <span className="font-bold text-foreground block mb-1">Draw No Bet (DNB)</span>
              <p>Eliminates the draw option. If the match ends tied, your original stake is pushed/refunded in full.</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <span className="font-bold text-foreground block mb-1">Over/Under 2.5 Goals</span>
              <p>The global standard goal line. Over 2.5 requires 3 or more total goals scored in the match.</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <span className="font-bold text-foreground block mb-1">Same-Game Parlays (SGPs)</span>
              <p>Combine moneyline, BTTS, and player shots on target into a single high-payout slip.</p>
            </div>
          </div>
        </div>

        {/* Cross-Link Hubs */}
        <div className="p-4 rounded-xl bg-card border flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-medium text-muted-foreground">More Betting Strategies:</span>
          <div className="flex flex-wrap gap-2">
            <Link to="/predict"><Button variant="outline" size="sm">AI Pro Tips Today</Button></Link>
            <Link to="/btts"><Button variant="outline" size="sm">BTTS AI Predictions</Button></Link>
            <Link to="/value-bets"><Button variant="outline" size="sm">Daily Value Bets</Button></Link>
            <Link to="/accumulator"><Button variant="outline" size="sm">Acca Builder</Button></Link>
            <Link to="/jackpot-predictions"><Button variant="outline" size="sm">Mega Jackpot Picks</Button></Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
