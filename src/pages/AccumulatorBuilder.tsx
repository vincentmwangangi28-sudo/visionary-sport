import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePredictions } from '@/hooks/usePredictions';
import { SharePrediction } from '@/components/SharePrediction';
import { Trash2, Plus, Calculator, Share2, TrendingUp, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface AccaSelection { id: string; match: string; market: string; odds: number; confidence: number; }

export default function AccumulatorBuilder() {
  const { predictions } = usePredictions(1);
  const [selections, setSelections] = useState<AccaSelection[]>([]);
  const [stake, setStake] = useState('100');

  const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1);
  const potentialReturn = parseFloat(stake || '0') * totalOdds;
  const combinedConfidence = selections.length > 0
    ? Math.round(selections.reduce((acc, s) => acc * (s.confidence / 100), 1) * 100)
    : 0;

  const addSelection = (pred: typeof predictions[0], market: string, odds: number) => {
    if (selections.find(s => s.id === `${pred.id}-${market}`)) { toast.error('Already added'); return; }
    if (selections.length >= 10) { toast.error('Maximum 10 selections'); return; }
    setSelections(prev => [...prev, {
      id: `${pred.id}-${market}`,
      match: `${pred.home_team} vs ${pred.away_team}`,
      market, odds, confidence: pred.confidence_score ?? pred.confidence ?? 60,
    }]);
    toast.success(`Added: ${pred.home_team} vs ${pred.away_team} — ${market}`);
  };

  const removeSelection = (id: string) => setSelections(prev => prev.filter(s => s.id !== id));

  const shareAcca = async () => {
    const text = `🎯 My ${selections.length}-fold Accumulator\n\n${selections.map(s => `✅ ${s.match}\n   ${s.market} @ ${s.odds}`).join('\n\n')}\n\n💰 Combined odds: ${totalOdds.toFixed(2)}\n📊 Confidence: ${combinedConfidence}%\n\nBuilt with PredictPro AI — predictpro.guru`;
    if (navigator.share) await navigator.share({ title: 'My Accumulator', text });
    else { navigator.clipboard.writeText(text); toast.success('Copied to clipboard!'); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Accumulator Builder | PredictPro" description="Build and share AI-powered football accumulators. Calculate potential returns and share with friends." />
      <Navbar />
      <main className="container mx-auto px-4 py-24 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3"><Calculator className="h-8 w-8 text-primary" />Accumulator Builder</h1>
          <p className="text-muted-foreground mt-1">Build multi-bet accumulators from AI predictions. Click any prediction to add it.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Predictions to pick from */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Today's Predictions — Click to Add</h2>
            {predictions.slice(0, 12).map(pred => (
              <Card key={pred.id} className="hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">{pred.home_team} vs {pred.away_team}</p>
                      <p className="text-xs text-muted-foreground">{pred.league} • {new Date(pred.match_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    </div>
                    <Badge variant="secondary">{pred.confidence_score ?? pred.confidence ?? 60}%</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'Home Win', odds: pred.home_odds ?? 2.0 },
                      { label: 'Draw', odds: pred.draw_odds ?? 3.2 },
                      { label: 'Away Win', odds: pred.away_odds ?? 3.8 },
                    ].map(({ label, odds }) => {
                      const isAdded = selections.some(s => s.id === `${pred.id}-${label}`);
                      return (
                        <button key={label} onClick={() => !isAdded && addSelection(pred, label, odds)}
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
                            <p className="font-medium truncate">{s.match}</p>
                            <p className="text-xs text-muted-foreground">{s.market} @ <span className="font-bold text-primary">{s.odds.toFixed(2)}</span></p>
                          </div>
                          <button onClick={() => removeSelection(s.id)} className="text-muted-foreground hover:text-destructive mt-0.5 flex-shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 border-t pt-3">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Combined odds</span><span className="font-bold text-lg">{totalOdds.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">AI Confidence</span>
                        <span className={`font-semibold ${combinedConfidence > 50 ? 'text-green-600' : combinedConfidence > 30 ? 'text-amber-600' : 'text-red-600'}`}>{combinedConfidence}%</span>
                      </div>

                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Stake (KES)</label>
                        <Input type="number" value={stake} onChange={e => setStake(e.target.value)} min="10" />
                      </div>

                      <div className="bg-primary/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Potential Return</p>
                        <p className="text-2xl font-bold text-primary">KES {potentialReturn.toLocaleString('en-KE', { maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-muted-foreground">Profit: KES {(potentialReturn - parseFloat(stake || '0')).toLocaleString('en-KE', { maximumFractionDigits: 0 })}</p>
                      </div>

                      <Button onClick={shareAcca} className="w-full gap-2">
                        <Share2 className="h-4 w-4" />Share Accumulator
                      </Button>
                      <Button variant="outline" onClick={() => setSelections([])} className="w-full gap-2">
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
