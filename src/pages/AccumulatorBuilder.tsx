import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TeamLogo } from '@/components/TeamLogo';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { AccaFixtureListSkeleton } from '@/components/PredictionCardSkeleton';
import { Trash2, Plus, Share2, Copy, CheckCheck, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { curateAccaWithGemini } from '@/services/geminiTasksService';
import { hapticService } from '@/services/hapticService';
import { ViralSlipShareCard } from '@/components/ViralSlipShareCard';

export default function AccumulatorBuilder() {
  const { predictions, isLoading } = usePredictions(1);
  const {
    selections,
    stake,
    setStake,
    currency,
    setCurrency,
    addSelection: addToSlip,
    addSelections,
    removeSelection,
    clearSlip,
    totalOdds,
    bonusMultiplier,
    potentialReturn,
    boostedReturn,
    combinedConfidence,
    generateBookingCode,
  } = useBetSlip();

  const [selectedBookmaker, setSelectedBookmaker] = useState('SportyBet');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [optimizingSlip, setOptimizingSlip] = useState(false);

  const handleAutoCurateAcca = async () => {
    if (predictions.length === 0) {
      toast.error('No fixtures available right now.');
      return;
    }
    setOptimizingSlip(true);
    try {
      const fixtures = predictions.slice(0, 8).map((p) => ({
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        league: p.league,
        homeOdds: p.home_odds,
        awayOdds: p.away_odds,
        drawOdds: p.draw_odds,
      }));
      const curated = await curateAccaWithGemini(fixtures, 'banker');
      if (curated?.legs && curated.legs.length > 0) {
        const bets = curated.legs.map((leg) => {
          const parts = leg.match.split(' vs ');
          return {
            match: leg.match,
            homeTeam: parts[0] || leg.match,
            awayTeam: parts[1] || '',
            league: leg.league,
            market: leg.market,
            odds: leg.odds,
            confidence: leg.confidence,
          };
        });
        addSelections(bets);
        toast.success(`Loaded ${bets.length}-leg Smart Accumulator!`);
      }
    } catch {
      toast.error('Could not auto-curate slip right now');
    } finally {
      setOptimizingSlip(false);
    }
  };

  const handleGenerateCode = (bookie: string) => {
    hapticService.betConfirmation();
    setSelectedBookmaker(bookie);
    const code = generateBookingCode(bookie);
    setGeneratedCode(code);
    toast.success(`Generated ${bookie} booking code: ${code}`);
  };

  const handleCopyCode = (code: string) => {
    hapticService.selection();
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Copied code ${code} to clipboard`);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareAcca = async () => {
    hapticService.success();
    const text = `${selections.length}-Fold Accumulator\n\n${selections
      .map((s) => `• ${s.homeTeam} vs ${s.awayTeam} — ${s.market} @ ${s.odds.toFixed(2)}`)
      .join('\n')}\n\nCombined Odds: ${totalOdds.toFixed(2)} (${combinedConfidence}%)\n${
      generatedCode ? `Code (${selectedBookmaker}): ${generatedCode}\n` : ''
    }predictpro.guru/accumulator`;
    if (navigator.share) await navigator.share({ title: 'My Accumulator', text });
    else {
      navigator.clipboard.writeText(text);
      toast.success('Copied slip to clipboard');
    }
  };

  const handleGenerateRecommendedAcca = (preset: 'bankers' | 'value' | 'longshot') => {
    hapticService.boost();
    if (predictions.length === 0) {
      toast.error('No fixtures available right now.');
      return;
    }

    const picks = [...predictions];
    let selected: typeof predictions = [];

    if (preset === 'bankers') {
      picks.sort((a, b) => (b.confidence_score ?? b.confidence ?? 0) - (a.confidence_score ?? a.confidence ?? 0));
      selected = picks.slice(0, 3);
    } else if (preset === 'value') {
      selected = picks.filter((p) => (p.home_odds ?? 2) >= 1.7 || (p.away_odds ?? 2) >= 1.7).slice(0, 4);
      if (selected.length < 4) selected = picks.slice(0, 4);
    } else {
      selected = picks
        .filter((p) => (p.home_odds ?? 2) >= 1.85 || (p.away_odds ?? 2) >= 1.85 || (p.draw_odds ?? 3) >= 3.0)
        .slice(0, 5);
      if (selected.length < 5) selected = picks.slice(0, 5);
    }

    const bets = selected.map((p) => ({
      match: `${p.home_team} vs ${p.away_team}`,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      market: p.predicted_outcome || p.prediction || 'Home Win',
      odds: p.home_odds || 1.95,
      confidence: p.confidence_score ?? p.confidence ?? 70,
    }));

    addSelections(bets);
  };

  const shareWhatsApp = () => {
    if (selections.length === 0) {
      toast.error('Add selections to your slip first');
      return;
    }
    const text =
      `*PredictPro ${selections.length}-Fold Accumulator*\n\n` +
      selections
        .map((s, i) => `*${i + 1}.* ${s.homeTeam} vs ${s.awayTeam}\nPick: *${s.market}* @ ${s.odds.toFixed(2)} (${s.confidence}%)`)
        .join('\n\n') +
      `\n\n*Total Odds:* ${totalOdds.toFixed(2)}\n*Combined Confidence:* ${combinedConfidence}%\n` +
      (generatedCode ? `*Booking Code (${selectedBookmaker}):* ${generatedCode}\n` : '') +
      `\nhttps://predictpro.guru/accumulator`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const accaFaqSchema = {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is a football accumulator (acca)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A football accumulator combines multiple selections into a single wager. The odds of each selection multiply together, resulting in higher payouts when all legs win.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do PredictPro booking codes work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PredictPro generates booking codes compatible with SportyBet, Bet9ja, Betway, and 1xBet so you can populate your multi-bet slip rapidly.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Football Accumulator Tips Today & Acca Builder | PredictPro"
        description="Build winning football accumulators today with statistical odds modeling. Generate booking codes for SportyBet, Bet9ja, Betway, and calculate parlay payouts."
        canonical="/accumulator"
        keywords="football accumulator tips today, acca builder, weekend accumulator tips, sportybet booking code today, bet9ja booking code, football parlay calculator"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Football Accumulator Builder', item: '/accumulator' },
        ]}
        structuredData={accaFaqSchema}
      />
      <Navbar />

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        {/* Broadcast Header Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Multi-Match Slip Builder · Instant Sportsbook Booking Codes
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Accumulator Builder &amp; Parlay Calculator
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Combine high-probability fixtures, calculate multi-leg returns, and generate instant booking codes for SportyBet, 1xBet, and Betway.
            </p>
          </div>

          {/* 1-Click Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleGenerateRecommendedAcca('bankers')}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-emerald-400 block">Safe 3-Fold</span>
              <span className="text-[11px] text-slate-300 font-mono">~3.20x Odds</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerateRecommendedAcca('value')}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-white block">Value 4-Fold</span>
              <span className="text-[11px] text-slate-300 font-mono">~6.80x Odds</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerateRecommendedAcca('longshot')}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-amber-400 block">High-Yield 5-Fold</span>
              <span className="text-[11px] text-slate-300 font-mono">~14.5x Odds</span>
            </button>

            <button
              type="button"
              onClick={handleAutoCurateAcca}
              disabled={optimizingSlip}
              className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-left transition-colors cursor-pointer"
            >
              <span className="text-xs font-black block">
                {optimizingSlip ? 'Curating...' : 'Smart Auto-Build'}
              </span>
              <span className="text-[11px] font-semibold opacity-85"> Optimal EV Slip</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Columns: Fixtures Table */}
          <div className="lg:col-span-2 space-y-3">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Available Matchday Fixtures — Click Odds to Add to Slip
                </h2>
                <span className="text-xs font-mono text-muted-foreground">1 · X · 2</span>
              </div>

              {isLoading ? (
                <div className="p-4">
                  <AccaFixtureListSkeleton count={6} />
                </div>
              ) : predictions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">No fixtures available right now.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {predictions.slice(0, 15).map((pred) => {
                    const conf = pred.confidence_score ?? pred.confidence ?? 68;
                    const recOutcome = pred.predicted_outcome || pred.prediction || 'Home Win';
                    return (
                      <div
                        key={pred.id}
                        className="px-4 py-3 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="font-semibold text-primary">{pred.league}</span>
                            <span>·</span>
                            <span className="font-mono">
                              {new Date(pred.match_date).toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                            <span>·</span>
                            <span>
                              Pick: <strong className="text-foreground">{recOutcome} ({conf}%)</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <TeamLogo team={pred.home_team} size="xs" />
                            <span className="text-sm font-semibold text-foreground">{pred.home_team}</span>
                            <span className="text-xs text-muted-foreground">v</span>
                            <TeamLogo team={pred.away_team} size="xs" />
                            <span className="text-sm font-semibold text-foreground">{pred.away_team}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 font-mono tabular-nums shrink-0">
                          {[
                            { label: 'Home Win', short: '1', odds: pred.home_odds ?? 2.0 },
                            { label: 'Draw', short: 'X', odds: pred.draw_odds ?? 3.2 },
                            { label: 'Away Win', short: '2', odds: pred.away_odds ?? 3.8 },
                          ].map(({ label, short, odds }) => {
                            const isAdded = selections.some(
                              (s) => s.homeTeam === pred.home_team && s.awayTeam === pred.away_team && s.market === label
                            );
                            return (
                              <button
                                type="button"
                                key={label}
                                onClick={() => {
                                  addToSlip({
                                    match: `${pred.home_team} vs ${pred.away_team}`,
                                    homeTeam: pred.home_team,
                                    awayTeam: pred.away_team,
                                    league: pred.league,
                                    matchDate: pred.match_date,
                                    market: label,
                                    odds,
                                    confidence: conf,
                                  });
                                }}
                                className={`h-9 w-16 rounded-md text-xs border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                                  isAdded
                                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                                    : 'bg-muted/50 hover:bg-muted border-border text-foreground'
                                }`}
                              >
                                <span className={`text-[9px] leading-none ${isAdded ? 'text-primary-foreground/85' : 'text-muted-foreground'}`}>
                                  {short}
                                </span>
                                <span className="font-bold text-xs mt-0.5">{odds.toFixed(2)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Accumulator Slip */}
          <div className="space-y-4">
            <Card className="sticky top-20 border-border overflow-hidden shadow-2xs">
              <CardHeader className="py-3.5 px-4 bg-slate-900 text-white border-b border-slate-800">
                <CardTitle className="flex items-center justify-between text-sm font-bold">
                  <span>Active Match Slip</span>
                  <Badge className="bg-emerald-500 text-slate-950 font-mono font-bold">
                    {selections.length} {selections.length === 1 ? 'Leg' : 'Legs'}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {selections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="h-7 w-7 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">Select match odds on the left or choose a 1-click preset above</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selections.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-start justify-between gap-2 p-2.5 bg-muted/40 border border-border/60 rounded-lg text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {s.homeTeam} vs {s.awayTeam}
                            </p>
                            <p className="text-muted-foreground mt-0.5">
                              {s.market} @ <span className="font-mono font-bold text-primary">{s.odds.toFixed(2)}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelection(s.id)}
                            aria-label={`Remove ${s.homeTeam} vs ${s.awayTeam} selection from slip`}
                            className="text-muted-foreground hover:text-destructive mt-0.5 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {bonusMultiplier > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-center gap-2 text-xs">
                        <Flame className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          +{(bonusMultiplier * 100).toFixed(0)}% Multi-Leg Odds Boost Active
                        </span>
                      </div>
                    )}

                    <div className="space-y-3 border-t border-border pt-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Combined Odds</span>
                        <span className="font-mono tabular-nums font-bold text-base text-foreground">
                          {totalOdds.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Combined Probability</span>
                        <span className="font-mono tabular-nums font-bold text-primary">
                          {combinedConfidence}%
                        </span>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <label htmlFor="acca-stake-input" className="text-muted-foreground font-medium">
                            Stake ({currency})
                          </label>
                          <div className="flex gap-1" role="group" aria-label="Select stake currency">
                            {['KES', 'USD', 'NGN'].map((c) => (
                              <button
                                type="button"
                                key={c}
                                onClick={() => setCurrency(c)}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  currency === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Input
                          id="acca-stake-input"
                          type="number"
                          value={stake}
                          onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                          min="10"
                          className="h-9 font-mono text-xs"
                          aria-label={`Stake amount in ${currency}`}
                        />
                      </div>

                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                        <p className="text-[11px] text-muted-foreground">Projected Payout</p>
                        <p className="text-xl font-mono tabular-nums font-extrabold text-primary">
                          {currency} {potentialReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                        {bonusMultiplier > 0 && (
                          <p className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                            With Boost: {currency} {boostedReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </p>
                        )}
                      </div>

                      {/* Booking Code Exporter */}
                      <div className="pt-2 border-t border-border space-y-2">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Generate Sportsbook Code
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['SportyBet', '1xBet', 'Betway'].map((b) => (
                            <Button
                              key={b}
                              size="sm"
                              variant={selectedBookmaker === b ? 'default' : 'outline'}
                              className="text-xs h-7 px-1 font-semibold"
                              onClick={() => handleGenerateCode(b)}
                            >
                              {b}
                            </Button>
                          ))}
                        </div>
                        {generatedCode && (
                          <div className="bg-muted/50 border border-border rounded-lg p-2 flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-primary">{generatedCode}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyCode(generatedCode)}
                              className="h-7 text-xs gap-1"
                            >
                              {copied ? <CheckCheck className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                              {copied ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={shareWhatsApp} size="sm" className="gap-1.5 text-xs font-bold">
                          <Share2 className="h-3.5 w-3.5" /> WhatsApp
                        </Button>
                        <Button variant="outline" size="sm" onClick={shareAcca} className="gap-1.5 text-xs font-medium">
                          <Copy className="h-3.5 w-3.5" /> Copy Slip
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSlip}
                        className="w-full gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Clear Slip
                      </Button>

                      <div className="pt-2 border-t border-border">
                        <ViralSlipShareCard
                          slipTitle={`${selections.length}-Fold Accumulator`}
                          legs={selections.map((s) => ({
                            match: `${s.homeTeam} vs ${s.awayTeam}`,
                            league: s.league || 'Football',
                            pick: s.market,
                            odds: s.odds,
                            confidence: s.confidence ?? 75,
                          }))}
                          totalOdds={totalOdds}
                          avgConfidence={combinedConfidence}
                          sharePath="/accumulator"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
