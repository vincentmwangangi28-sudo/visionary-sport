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
import { Trash2, Plus, Calculator, Share2, TrendingUp, Trophy, Sparkles, Copy, CheckCheck, Flame } from 'lucide-react';
import { toast } from 'sonner';

export default function AccumulatorBuilder() {
  const { predictions } = usePredictions(1);
  const {
    selections,
    stake,
    setStake,
    currency,
    setCurrency,
    addSelection: addToSlip,
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

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Football Accumulator Builder | Acca Calculator | PredictPro" description="Build football accumulators from AI predictions. Calculate potential returns, combine multiple bets and share your acca with friends." keywords="football accumulator builder, acca calculator, football acca tips, accumulator bet builder, multiple bet calculator" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3"><Calculator className="h-8 w-8 text-primary" />Accumulator Builder & Multi-Slip</h1>
          <p className="text-muted-foreground mt-1">Build multi-bet accumulators from AI predictions with real-time multi-bookmaker odds comparison and booking codes.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Predictions to pick from */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Today's Fixtures — Click to Add</h2>
            {predictions.slice(0, 15).map(pred => (
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
                          className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg text-sm font-medium border transition-all ${isAdded ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary hover:bg-primary/5'}`}>
                          <div className="text-xs opacity-70">{label}</div>
                          <div className="font-bold">{odds.toFixed(2)}</div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
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
                          <button onClick={() => removeSelection(s.id)} className="text-muted-foreground hover:text-destructive mt-0.5 flex-shrink-0">
                            <Trash2 className="h-4 w-4" />
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
                          <label className="text-muted-foreground">Stake ({currency})</label>
                          <div className="flex gap-1">
                            {['KES', 'USD', 'NGN'].map(c => (
                              <button key={c} onClick={() => setCurrency(c)} className={`text-[10px] px-1 py-0.5 rounded font-bold ${currency === c ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{c}</button>
                            ))}
                          </div>
                        </div>
                        <Input type="number" value={stake} onChange={e => setStake(parseFloat(e.target.value) || 0)} min="10" />
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

                      <Button onClick={shareAcca} className="w-full gap-2 font-bold">
                        <Share2 className="h-4 w-4" />Share Accumulator
                      </Button>
                      <Button variant="outline" onClick={clearSlip} className="w-full gap-2">
                        <Trash2 className="h-4 w-4" />Clear All
                      </Button>
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
