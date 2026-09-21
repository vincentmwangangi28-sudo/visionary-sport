import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/useCurrency';
import { Calculator, Plus, Trash2, ShieldCheck, AlertCircle, Percent } from 'lucide-react';

interface SelectionOutcome {
  id: string;
  name: string;
  odds: number;
}

interface DutchingCalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelections?: { name: string; odds: number }[];
}

export const DutchingCalculatorModal: React.FC<DutchingCalculatorModalProps> = ({
  open,
  onOpenChange,
  initialSelections,
}) => {
  const { format, currency } = useCurrency();
  const [totalStake, setTotalStake] = useState<number>(100);
  const [targetMode, setTargetMode] = useState<'totalStake' | 'targetProfit'>('totalStake');
  const [targetProfit, setTargetProfit] = useState<number>(50);

  const [outcomes, setOutcomes] = useState<SelectionOutcome[]>(() => {
    if (initialSelections && initialSelections.length > 0) {
      return initialSelections.map((s, i) => ({
        id: `outcome-${i}`,
        name: s.name,
        odds: s.odds,
      }));
    }
    return [
      { id: '1', name: 'Selection A (e.g. Home Win)', odds: 2.10 },
      { id: '2', name: 'Selection B (e.g. Draw)', odds: 3.40 },
    ];
  });

  const addOutcome = () => {
    if (outcomes.length >= 6) return;
    setOutcomes(prev => [
      ...prev,
      {
        id: `outcome-${Date.now()}`,
        name: `Selection ${String.fromCharCode(65 + prev.length)}`,
        odds: 3.00,
      },
    ]);
  };

  const removeOutcome = (id: string) => {
    if (outcomes.length <= 2) return;
    setOutcomes(prev => prev.filter(o => o.id !== id));
  };

  const updateOutcome = (id: string, field: 'name' | 'odds', value: string) => {
    setOutcomes(prev =>
      prev.map(o => {
        if (o.id === id) {
          if (field === 'odds') {
            const num = Math.max(1.01, parseFloat(value) || 1.01);
            return { ...o, odds: num };
          }
          return { ...o, [field]: value };
        }
        return o;
      })
    );
  };

  // Calculations
  const calculations = useMemo(() => {
    // Total implied probability = sum(1 / odds)
    const sumInvOdds = outcomes.reduce((acc, o) => acc + (1 / Math.max(1.01, o.odds)), 0);
    const bookmakerMargin = (sumInvOdds - 1) * 100;
    const isArbitrage = sumInvOdds < 1.0;

    let computedTotalStake = totalStake;
    if (targetMode === 'targetProfit') {
      // Net Profit = (Stake_i * Odds_i) - TotalStake
      // Stake_i = TotalStake * (1/Odds_i) / sumInvOdds
      // Return_i = TotalStake / sumInvOdds
      // Profit = TotalStake * (1 / sumInvOdds - 1)
      if (sumInvOdds < 1.0) {
        computedTotalStake = targetProfit / (1 / sumInvOdds - 1);
      } else {
        computedTotalStake = totalStake;
      }
    }

    const items = outcomes.map(o => {
      const impliedProb = (1 / o.odds) / sumInvOdds;
      const individualStake = Math.round((computedTotalStake * impliedProb) * 100) / 100;
      const potentialReturn = Math.round((individualStake * o.odds) * 100) / 100;
      const profit = Math.round((potentialReturn - computedTotalStake) * 100) / 100;
      return {
        ...o,
        impliedProb: Math.round(impliedProb * 1000) / 10,
        individualStake,
        potentialReturn,
        profit,
      };
    });

    const avgReturn = items.length > 0 ? items[0].potentialReturn : 0;
    const netProfit = items.length > 0 ? items[0].profit : 0;
    const roi = computedTotalStake > 0 ? (netProfit / computedTotalStake) * 100 : 0;

    return {
      sumInvOdds,
      bookmakerMargin: Math.round(bookmakerMargin * 10) / 10,
      isArbitrage,
      computedTotalStake,
      items,
      avgReturn,
      netProfit,
      roi: Math.round(roi * 10) / 10,
    };
  }, [outcomes, totalStake, targetMode, targetProfit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold">Dutching &amp; Arbitrage Calculator</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Split stakes across multiple outcomes to guarantee equal profit regardless of which selection hits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Arbitrage Banner */}
          {calculations.isArbitrage ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-xs">
              <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-500" />
              <div>
                <p className="font-semibold">Arbitrage Opportunity Detected! (Sum: {(calculations.sumInvOdds * 100).toFixed(1)}%)</p>
                <p className="text-[11px] opacity-90">Risk-free guaranteed profit of {calculations.roi}% across selected markets.</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-muted/60 border border-border/40 rounded-xl flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Percent className="h-4 w-4 text-primary" />
                Implied Bookmaker Margin:
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                {calculations.bookmakerMargin > 0 ? `+${calculations.bookmakerMargin}%` : `${calculations.bookmakerMargin}%`}
              </Badge>
            </div>
          )}

          {/* Stake input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Total Bankroll Stake ({currency})</Label>
              <div className="flex gap-1">
                {[50, 100, 250, 500].map(amt => (
                  <Button
                    key={amt}
                    size="sm"
                    variant={totalStake === amt ? 'default' : 'outline'}
                    className="h-6 px-2 text-[11px]"
                    onClick={() => setTotalStake(amt)}
                  >
                    {amt}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              type="number"
              min="1"
              step="5"
              value={totalStake}
              onChange={e => setTotalStake(Math.max(1, parseFloat(e.target.value) || 1))}
              className="h-10 text-base font-semibold"
            />
          </div>

          {/* Outcomes table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Outcomes &amp; Decimal Odds</Label>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-primary gap-1"
                onClick={addOutcome}
                disabled={outcomes.length >= 6}
              >
                <Plus className="h-3.5 w-3.5" /> Add Outcome
              </Button>
            </div>

            <div className="space-y-2">
              {calculations.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-card border border-border/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      {idx + 1}
                    </span>
                    <Input
                      value={item.name}
                      onChange={e => updateOutcome(item.id, 'name', e.target.value)}
                      className="h-8 text-xs font-medium"
                      placeholder="Selection Name"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <Label className="text-[10px] text-muted-foreground block mb-0.5">Odds</Label>
                      <Input
                        type="number"
                        step="0.05"
                        min="1.01"
                        value={item.odds}
                        onChange={e => updateOutcome(item.id, 'odds', e.target.value)}
                        className="h-8 text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="text-right min-w-[90px]">
                      <div className="text-[10px] text-muted-foreground">Stake ({item.impliedProb}%)</div>
                      <div className="font-bold text-foreground font-mono">{format(item.individualStake)}</div>
                    </div>

                    {outcomes.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeOutcome(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dutching summary */}
          <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Invested Stake:</span>
              <span className="font-bold text-foreground font-mono">{format(calculations.computedTotalStake)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Guaranteed Return (Any Win):</span>
              <span className="font-bold text-primary font-mono">{format(calculations.avgReturn)}</span>
            </div>
            <div className="h-px bg-border/50 my-1" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block">Net Guaranteed Profit:</span>
                <span className="text-[11px] text-muted-foreground">Calculated after deducting all stakes</span>
              </div>
              <div className="text-right">
                <span
                  className={`text-lg font-bold font-mono ${
                    calculations.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                  }`}
                >
                  {calculations.netProfit >= 0 ? `+${format(calculations.netProfit)}` : format(calculations.netProfit)}
                </span>
                <span className="text-[10px] block text-muted-foreground font-mono">
                  ROI: {calculations.roi >= 0 ? `+${calculations.roi}%` : `${calculations.roi}%`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
