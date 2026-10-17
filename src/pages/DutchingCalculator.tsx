import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator, Plus, Trash2, Scale } from 'lucide-react';

interface DutchEntry {
  id: number;
  label: string;
  odds: string;
}

export default function DutchingCalculator() {
  const [totalBankStake, setTotalBankStake] = useState<string>('100');
  const [entries, setEntries] = useState<DutchEntry[]>([
    { id: 1, label: 'Correct Score 1-0', odds: '6.50' },
    { id: 2, label: 'Correct Score 2-0', odds: '7.50' },
    { id: 3, label: 'Correct Score 2-1', odds: '8.50' },
  ]);

  const results = useMemo(() => {
    const bank = Math.max(1, parseFloat(totalBankStake) || 100);
    const parsed = entries.map((e) => ({
      ...e,
      val: Math.max(1.05, parseFloat(e.odds) || 2),
    }));
    const impliedSum = parsed.reduce((acc, item) => acc + 1 / item.val, 0);

    const stakes = parsed.map((item) => {
      const exactStake = (bank * (1 / item.val)) / impliedSum;
      const grossReturn = exactStake * item.val;
      return {
        ...item,
        exactStake,
        grossReturn,
      };
    });

    const equalGrossReturn = stakes[0]?.grossReturn || 0;
    const guaranteedNetProfit = equalGrossReturn - bank;
    const effectiveCombinedOdds = equalGrossReturn / bank;

    return {
      stakes,
      equalGrossReturn,
      guaranteedNetProfit,
      effectiveCombinedOdds,
    };
  }, [totalBankStake, entries]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Dutching Calculator: Equal-Profit Multi-Outcome & Correct Score Tool"
        description="Free football Dutching Calculator. Split your total stake across multiple Correct Score or match outcomes to guarantee equal profit if any pick wins."
        keywords="dutching calculator, correct score dutching calculator, dutch betting calculator, split stake calculator football, equal profit betting tool"
        canonical="/dutching-calculator"
      />
      <Navbar />
      <MarketQuickStrip />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Dutching Calculator (Correct Score & Multi-Outcome)' },
          ]}
        />

        <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-card to-background p-6 sm:p-8">
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 mb-3">
            <Scale className="w-3.5 h-3.5 mr-1.5" /> Multi-Scoreline Stake Splitter
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Football Dutching Calculator (Correct Score &amp; Multi-Outcome)
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
            Professional Correct Score bettors rarely back a single scoreline. By <strong>Dutching 3 or 4 Poisson-favored scorelines</strong> (such as 1-0, 2-0, and 2-1), this calculator divides your stake proportionally so you earn the exact same profit regardless of which scoreline hits.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 p-6 border-border/60 bg-card/75 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Total Combined Stake Across All Selections ($)
              </label>
              <input
                type="number"
                value={totalBankStake}
                onChange={(e) => setTotalBankStake(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            </div>

            <div className="space-y-2.5">
              {entries.map((entry, idx) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.label}
                    onChange={(e) =>
                      setEntries((prev) =>
                        prev.map((it) => (it.id === entry.id ? { ...it, label: e.target.value } : it))
                      )
                    }
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                  />
                  <input
                    type="number"
                    step="0.25"
                    value={entry.odds}
                    onChange={(e) =>
                      setEntries((prev) =>
                        prev.map((it) => (it.id === entry.id ? { ...it, odds: e.target.value } : it))
                      )
                    }
                    className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
                  />
                  {entries.length > 2 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEntries((prev) => prev.filter((it) => it.id !== entry.id))}
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {entries.length < 6 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setEntries((prev) => [
                    ...prev,
                    { id: Date.now(), label: `Outcome #${prev.length + 1}`, odds: '9.00' },
                  ])
                }
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Another Scoreline / Outcome
              </Button>
            )}
          </Card>

          <Card className="lg:col-span-5 p-6 border-indigo-500/30 bg-card/85 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400" /> Exact Dutching Stakes
            </h2>

            <div className="space-y-2">
              {results.stakes.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 text-xs sm:text-sm">
                  <span>{s.label} (@{s.odds})</span>
                  <span className="font-extrabold text-emerald-400">Stake: ${s.exactStake.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="text-xs text-muted-foreground">Effective Combined Dutch Odds</div>
              <div className="text-2xl font-extrabold text-emerald-400">
                {results.effectiveCombinedOdds.toFixed(2)}x
              </div>
              <div className="text-xs font-semibold">
                Net Profit if ANY Selection Wins:{' '}
                <span className={results.guaranteedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {results.guaranteedNetProfit >= 0 ? '+' : ''}${results.guaranteedNetProfit.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
