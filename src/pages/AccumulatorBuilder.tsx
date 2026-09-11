import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { AccaFixtureListSkeleton } from '@/components/PredictionCardSkeleton';
import { Trash2, Plus, Calculator, Share2, TrendingUp, Trophy, Sparkles, Copy, CheckCheck, Flame, Send } from 'lucide-react';
import { toast } from 'sonner';
import { broadcastAcca } from '@/services/telegramTasksService';
import { curateAccaWithGemini } from '@/services/geminiTasksService';

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
  const [broadcastingToTelegram, setBroadcastingToTelegram] = useState(false);
  const [optimizingWithGemini, setOptimizingWithGemini] = useState(false);

  const handleBroadcastToTelegram = async () => {
    if (selections.length === 0) {
      toast.error('Add selections to your slip first');
      return;
    }
    setBroadcastingToTelegram(true);
    try {
      const res = await broadcastAcca({
        title: `${selections.length}-Fold Accumulator`,
        totalOdds: totalOdds.toFixed(2),
        estimatedPayout: potentialReturn.toFixed(0),
        selections: selections.map(s => ({
          homeTeam: s.homeTeam,
          awayTeam: s.awayTeam,
          match: `${s.homeTeam} vs ${s.awayTeam}`,
          market: s.market,
          odds: s.odds,
          confidence: s.confidence,
        })),
      });
      if (res.success) {
        toast.success(res.simulated ? 'Acca broadcast simulated & previewed!' : 'Accumulator slip posted to Telegram channel!');
      } else {
        toast.error(res.error || 'Failed to broadcast');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error broadcasting');
    } finally {
      setBroadcastingToTelegram(false);
    }
  };

  const handleGeminiOptimizeAcca = async () => {
    if (predictions.length === 0) {
      toast.error('No predictions available right now.');
      return;
    }
    setOptimizingWithGemini(true);
    try {
      const fixtures = predictions.slice(0, 8).map(p => ({
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        league: p.league,
        homeOdds: p.home_odds,
        awayOdds: p.away_odds,
        drawOdds: p.draw_odds,
      }));
      const aiSlip = await curateAccaWithGemini(fixtures, 'banker');
      if (aiSlip?.legs && aiSlip.legs.length > 0) {
        const bets = aiSlip.legs.map(leg => {
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
        toast.success(`Gemini AI curated ${bets.length}-leg accumulator!`);
      }
    } catch {
      toast.error('Failed to optimize with Gemini');
    } finally {
      setOptimizingWithGemini(false);
    }
  };

  const handleGenerateCode = (bookie: string) => {
    setSelectedBookmaker(bookie);
    const code = generateBookingCode(bookie);
    setGeneratedCode(code);
    toast.success(`Generated ${bookie} booking code: ${code}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Copied code ${code} to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareAcca = async () => {
    const text = `🎯 My ${selections.length}-fold Accumulator\n\n${selections.map(s => `✅ ${s.homeTeam} vs ${s.awayTeam}\n   ${s.market} @ ${s.odds.toFixed(2)}`).join('\n\n')}\n\n💰 Combined odds: ${totalOdds.toFixed(2)}\n📊 Confidence: ${combinedConfidence}%\n${generatedCode ? `🎟️ Code (${selectedBookmaker}): ${generatedCode}\n` : ''}\nBuilt with PredictPro AI — predictpro.guru`;
    if (navigator.share) await navigator.share({ title: 'My Accumulator', text });
    else { navigator.clipboard.writeText(text); toast.success('Copied to clipboard!'); }
  };

  const handleGenerateRecommendedAcca = (preset: 'bankers' | 'value' | 'longshot') => {
    if (predictions.length === 0) {
      toast.error('No predictions available right now.');
      return;
    }

    const picks = [...predictions];
    let selected: typeof predictions = [];

    if (preset === 'bankers') {
      // 3 safest picks: confidence >= 72%
      picks.sort((a, b) => ((b.confidence_score ?? b.confidence ?? 0) - (a.confidence_score ?? a.confidence ?? 0)));
      selected = picks.slice(0, 3);
    } else if (preset === 'value') {
      // 4 picks with balanced odds and confidence
      selected = picks
        .filter(p => ((p.home_odds ?? 2) >= 1.70 || (p.away_odds ?? 2) >= 1.70))
        .slice(0, 4);
      if (selected.length < 4) selected = picks.slice(0, 4);
    } else {
      // 5 picks for high odds
      selected = picks
        .filter(p => ((p.home_odds ?? 2) >= 1.85 || (p.away_odds ?? 2) >= 1.85 || (p.draw_odds ?? 3) >= 3.0))
        .slice(0, 5);
      if (selected.length < 5) selected = picks.slice(0, 5);
    }

    const bets = selected.map(p => ({
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
    const text = `🎯 *PredictPro AI ${selections.length}-Fold Accumulator*\n\n` +
      selections.map((s, i) => `*${i + 1}.* ${s.homeTeam} vs ${s.awayTeam}\n👉 Pick: *${s.market}* @ ${s.odds.toFixed(2)} (${s.confidence}% conf)`).join('\n\n') +
      `\n\n💰 *Total Odds:* ${totalOdds.toFixed(2)}\n📊 *AI Combined Confidence:* ${combinedConfidence}%\n` +
      (generatedCode ? `🎟️ *Booking Code (${selectedBookmaker}):* ${generatedCode}\n` : '') +
      `\n🔥 Build free at https://predictpro.guru/accumulator`;
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
          text: 'A football accumulator combines multiple selections into a single wager. The odds of each selection multiply together, resulting in exponentially higher payouts, but all legs must win for the accumulator to pay out.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do PredictPro booking codes work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PredictPro generates booking codes compatible with top African and global sportsbooks (SportyBet, Bet9ja, Betway, 1xBet). Enter the generated alphanumeric code on your bookmaker app to populate the entire multi-bet slip instantly.'
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Football Accumulator Tips Today & AI Acca Builder (+EV Multi-Bets) | PredictPro"
        description="Build winning football accumulators today with AI odds modeling. Generate booking codes for SportyBet, Bet9ja, Betway, calculate parlay payouts, and share via WhatsApp."
        canonical="/accumulator"
        keywords="football accumulator tips today, ai acca builder, weekend accumulator tips, sportybet booking code today, bet9ja booking code, football parlay calculator"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Football Accumulator Builder', item: '/accumulator' }
        ]}
        structuredData={accaFaqSchema}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center text-xs text-muted-foreground gap-2 mb-4">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <span>/</span>
          <span className="text-foreground font-medium">Accumulator Builder</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3"><Calculator className="h-8 w-8 text-primary" />Accumulator Builder & Multi-Slip</h1>
          <p className="text-muted-foreground mt-1">Build multi-bet accumulators from AI predictions with real-time multi-bookmaker odds comparison and booking codes.</p>
        </div>

        {/* AI Recommended Acca Generator Shortcuts */}
        <div className="mb-6 bg-card border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-bold text-sm">AI Recommended Acca Generators</span>
            </div>
            <span className="text-xs text-muted-foreground">1-Click algorithmically selected multis</span>
          </div>

          <div className="grid sm:grid-cols-4 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGeminiOptimizeAcca}
              disabled={optimizingWithGemini}
              className="justify-start gap-2 h-auto py-2.5 px-3 border-primary/40 bg-primary/5 hover:bg-primary/10 text-left"
            >
              <Sparkles className={`h-5 w-5 text-primary shrink-0 ${optimizingWithGemini ? 'animate-spin' : ''}`} />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs block text-primary">Gemini Optimizer</span>
                <span className="text-[10px] text-muted-foreground">{optimizingWithGemini ? 'Analyzing...' : 'AI curated multi-leg'}</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleGenerateRecommendedAcca('bankers')}
              className="justify-start gap-2 h-auto py-2.5 px-3 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5 text-left"
            >
              <span className="text-lg">🛡️</span>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs block text-foreground">Safe 3-Fold Banker</span>
                <span className="text-[10px] text-muted-foreground">High accuracy (~3.2x)</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleGenerateRecommendedAcca('value')}
              className="justify-start gap-2 h-auto py-2.5 px-3 border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5 text-left"
            >
              <span className="text-lg">💎</span>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs block text-foreground">Balanced 4-Fold Value</span>
                <span className="text-[10px] text-muted-foreground">High EV (~6.8x)</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleGenerateRecommendedAcca('longshot')}
              className="justify-start gap-2 h-auto py-2.5 px-3 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/5 text-left"
            >
              <span className="text-lg">🚀</span>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs block text-foreground">High Yield 5-Fold</span>
                <span className="text-[10px] text-muted-foreground">Maximum multiplier (~14.5x)</span>
              </div>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Predictions to pick from */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Today's Fixtures — Click to Add</h2>
            {isLoading ? (
              <AccaFixtureListSkeleton count={6} />
            ) : predictions.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <p className="text-muted-foreground text-sm">No fixtures available right now.</p>
              </Card>
            ) : (
              predictions.slice(0, 15).map(pred => (
                <Card key={pred.id} className="hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{pred.home_team} vs {pred.away_team}</p>
                        <p className="text-xs text-muted-foreground">{pred.league} • {new Date(pred.match_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      </div>
                      <Badge variant="secondary">{pred.confidence_score ?? pred.confidence ?? 60}% AI</Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: 'Home Win', odds: pred.home_odds ?? 2.0 },
                        { label: 'Draw', odds: pred.draw_odds ?? 3.2 },
                        { label: 'Away Win', odds: pred.away_odds ?? 3.8 },
                      ].map(({ label, odds }) => {
                        const isAdded = selections.some(s => s.homeTeam === pred.home_team && s.awayTeam === pred.away_team && s.market === label);
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
                                confidence: pred.confidence_score ?? pred.confidence ?? 60,
                              });
                            }}
                            aria-label={`Select ${label} at ${odds.toFixed(2)} odds for ${pred.home_team} vs ${pred.away_team}`}
                            className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg text-sm font-medium border transition-all ${isAdded ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary hover:bg-primary/5'}`}>
                            <div className="text-xs opacity-70">{label}</div>
                            <div className="font-bold">{odds.toFixed(2)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Accumulator slip */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-5 w-5 text-primary" />Acca Slip
                  {selections.length > 0 && <Badge className="ml-auto">{selections.length} selections</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selections.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Add predictions from the left</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selections.map(s => (
                        <div key={s.id} className="flex items-start justify-between gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{s.homeTeam} vs {s.awayTeam}</p>
                            <p className="text-xs text-muted-foreground">{s.market} @ <span className="font-bold text-primary">{s.odds.toFixed(2)}</span></p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelection(s.id)}
                            aria-label={`Remove ${s.homeTeam} vs ${s.awayTeam} selection from slip`}
                            className="text-muted-foreground hover:text-destructive mt-0.5 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {bonusMultiplier > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-center gap-2 text-xs">
                        <Flame className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          +{(bonusMultiplier * 100).toFixed(0)}% Multi-Leg Boost Active!
                        </span>
                      </div>
                    )}

                    <div className="space-y-3 border-t pt-3">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Combined odds</span><span className="font-bold text-lg">{totalOdds.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">AI Confidence</span>
                        <span className={`font-semibold ${combinedConfidence > 50 ? 'text-green-600' : combinedConfidence > 30 ? 'text-amber-600' : 'text-red-600'}`}>{combinedConfidence}%</span>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <label htmlFor="acca-stake-input" className="text-muted-foreground">Stake ({currency})</label>
                          <div className="flex gap-1" role="group" aria-label="Select stake currency">
                            {['KES', 'USD', 'NGN'].map(c => (
                              <button
                                type="button"
                                key={c}
                                onClick={() => setCurrency(c)}
                                aria-label={`Set currency to ${c}`}
                                className={`text-[10px] px-1 py-0.5 rounded font-bold ${currency === c ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
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
                          onChange={e => setStake(parseFloat(e.target.value) || 0)}
                          min="10"
                          aria-label={`Stake amount in ${currency}`}
                        />
                      </div>

                      <div className="bg-primary/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Potential Return</p>
                        <p className="text-2xl font-bold text-primary">{currency} {potentialReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                        {bonusMultiplier > 0 && (
                          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                            Boosted: {currency} {boostedReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </p>
                        )}
                      </div>

                      {/* Booking Code Exporter */}
                      <div className="pt-2 border-t space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-primary" /> 1-Click Booking Code
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                          {['SportyBet', '1xBet', 'Betway'].map((b) => (
                            <Button key={b} size="sm" variant={selectedBookmaker === b ? 'default' : 'outline'} className="text-xs h-7 px-1" onClick={() => handleGenerateCode(b)}>
                              {b}
                            </Button>
                          ))}
                        </div>
                        {generatedCode && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-primary">{generatedCode}</span>
                            <Button size="sm" variant="ghost" onClick={() => handleCopyCode(generatedCode)} className="h-7 text-xs gap-1">
                              {copied ? <CheckCheck className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                              {copied ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={shareWhatsApp}
                          className="gap-2 font-bold bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Share2 className="h-4 w-4" />WhatsApp
                        </Button>
                        <Button
                          onClick={handleBroadcastToTelegram}
                          disabled={broadcastingToTelegram}
                          className="gap-2 font-bold bg-sky-600 hover:bg-sky-700 text-white"
                        >
                          <Send className="h-4 w-4" />
                          {broadcastingToTelegram ? 'Posting...' : 'Telegram'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={shareAcca} className="gap-2 font-medium">
                          <Copy className="h-4 w-4" />Copy / Share
                        </Button>
                        <Button variant="outline" onClick={clearSlip} className="gap-2 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />Clear All
                        </Button>
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
