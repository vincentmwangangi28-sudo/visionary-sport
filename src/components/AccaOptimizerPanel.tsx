import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamLogo } from '@/components/TeamLogo';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  Download,
  Copy,
  Plus,
  ArrowRight,
  Sliders,
  Flame,
  CheckCheck,
} from 'lucide-react';
import {
  optimizeAccumulator,
  downloadAccaCsvFile,
  type AccaStrategy,
  type OptimizedAccumulatorResult,
} from '@/services/accumulatorOptimizerService';
import { useBetSlip } from '@/hooks/useBetSlip';
import { hapticService } from '@/services/hapticService';
import { toast } from 'sonner';
import type { Prediction } from '@/types/prediction';

interface AccaOptimizerPanelProps {
  predictions: Prediction[];
  selectedBookmaker?: string;
}

export const AccaOptimizerPanel: React.FC<AccaOptimizerPanelProps> = ({
  predictions,
  selectedBookmaker = 'SportyBet',
}) => {
  const { addSelections, setIsOpen: setSlipOpen, generateBookingCode } = useBetSlip();

  const [strategy, setStrategy] = useState<AccaStrategy>('MAX_EXPECTED_VALUE');
  const [targetLegs, setTargetLegs] = useState<number>(4);
  const [minEdge, setMinEdge] = useState<number>(2.5);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [generatedBookieCode, setGeneratedBookieCode] = useState<string | null>(null);

  // Compute optimized accumulator reactively
  const optimizedResult: OptimizedAccumulatorResult = useMemo(() => {
    return optimizeAccumulator(predictions, {
      strategy,
      targetLegs,
      minEdgePct: minEdge,
    });
  }, [predictions, strategy, targetLegs, minEdge]);

  const handleStageToSlip = () => {
    if (optimizedResult.legs.length === 0) {
      toast.error('No eligible legs found for current filters.');
      return;
    }
    hapticService.boost();

    const slipBets = optimizedResult.legs.map((leg) => ({
      id: leg.id,
      matchId: leg.matchId,
      match: `${leg.homeTeam} vs ${leg.awayTeam}`,
      homeTeam: leg.homeTeam,
      awayTeam: leg.awayTeam,
      league: leg.league,
      matchDate: leg.matchDate,
      market: leg.market,
      selection: leg.selection,
      odds: leg.odds,
      confidence: Math.round(leg.modelProb),
    }));

    addSelections(slipBets);
    setSlipOpen(true);
    toast.success(`Staged ${slipBets.length}-leg ${optimizedResult.strategyLabel} to bet slip!`);
  };

  const handleGenerateCode = (bookie: string) => {
    hapticService.betConfirmation();
    const code = generateBookingCode(bookie);
    setGeneratedBookieCode(code);
    toast.success(`Generated ${bookie} code: ${code}`);
  };

  const handleCopySummary = () => {
    hapticService.selection();
    const text =
      `*PredictPro ${optimizedResult.legCount}-Fold ${optimizedResult.strategyLabel}*\n` +
      `Combined Odds: ${optimizedResult.totalOdds.toFixed(2)}x · Win Prob: ${optimizedResult.combinedModelProbPct.toFixed(1)}% · EV: +${optimizedResult.totalEvPct.toFixed(1)}%\n\n` +
      optimizedResult.legs
        .map(
          (leg, i) =>
            `${i + 1}. ${leg.homeTeam} vs ${leg.awayTeam}\n   Pick: ${leg.selection} @ ${leg.odds.toFixed(2)} (Edge: +${leg.edgePct.toFixed(1)}%)`
        )
        .join('\n') +
      (generatedBookieCode ? `\n\nBooking Code (${selectedBookmaker}): ${generatedBookieCode}` : '') +
      `\nhttps://predictpro.guru/accumulator`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    toast.success('Copied accumulator summary to clipboard!');
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleDownloadCsv = () => {
    hapticService.selection();
    downloadAccaCsvFile(optimizedResult);
    toast.success('Downloaded analytical CSV dossier!');
  };

  return (
    <Card className="border border-border/80 bg-slate-950 text-slate-100 shadow-md overflow-hidden">
      <CardHeader className="bg-slate-900/90 border-b border-border/60 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono px-2 py-0.5">
                <Sparkles className="w-3 h-3 mr-1 inline" /> Algorithmic +EV Optimizer
              </Badge>
              <span className="text-xs text-slate-400">Anti-Correlation Enforced</span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Automated Acca &amp; Parlay Optimizer
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-400">
              Derives optimal multi-bet combinations by calculating statistical probability discrepancies against bookmaker margins.
            </CardDescription>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadCsv}
              className="h-8 text-xs bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopySummary}
              className="h-8 text-xs bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700"
            >
              {copiedSummary ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Slip
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleStageToSlip}
              className="h-8 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Stage into Bet Slip
            </Button>
          </div>
        </div>

        {/* Strategy Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
          <button
            type="button"
            onClick={() => setStrategy('MAX_EXPECTED_VALUE')}
            className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
              strategy === 'MAX_EXPECTED_VALUE'
                ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-xs'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Mathematical +EV
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">Maximizes statistical pricing discrepancies</p>
          </button>

          <button
            type="button"
            onClick={() => setStrategy('MAX_WIN_RATE')}
            className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
              strategy === 'MAX_WIN_RATE'
                ? 'bg-sky-950/60 border-sky-500 text-white shadow-xs'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> High-Certainty Banker
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">Lowest variance, highest probability picks</p>
          </button>

          <button
            type="button"
            onClick={() => setStrategy('KELLY_GROWTH')}
            className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
              strategy === 'KELLY_GROWTH'
                ? 'bg-amber-950/60 border-amber-500 text-white shadow-xs'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-0.5">
              <Zap className="w-3.5 h-3.5" /> Kelly Bankroll Growth
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">Compound growth rate sizing</p>
          </button>

          <button
            type="button"
            onClick={() => setStrategy('MOONSHOT_ACCURATE')}
            className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
              strategy === 'MOONSHOT_ACCURATE'
                ? 'bg-purple-950/60 border-purple-500 text-white shadow-xs'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 mb-0.5">
              <Flame className="w-3.5 h-3.5" /> Moonshot Acca
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">High-yield multiplier on top edges</p>
          </button>
        </div>

        {/* Folds & Edge Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Leg Count:</span>
            {[3, 4, 5, 6, 8].map((fold) => (
              <button
                key={fold}
                type="button"
                onClick={() => setTargetLegs(fold)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  targetLegs === fold
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {fold}-Fold
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Min Edge %:</span>
            <div className="flex items-center gap-1.5">
              {[1.0, 2.5, 4.0, 6.0].map((edgeVal) => (
                <button
                  key={edgeVal}
                  type="button"
                  onClick={() => setMinEdge(edgeVal)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                    minEdge === edgeVal
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  +{edgeVal}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Metric Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Combined Odds
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tabular-nums">
              {optimizedResult.totalOdds.toFixed(2)}x
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Model Win Prob
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
              {optimizedResult.combinedModelProbPct.toFixed(1)}%
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Net Acca EV
            </span>
            <span
              className={`text-xl sm:text-2xl font-black font-mono tabular-nums ${
                optimizedResult.totalEvPct >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {optimizedResult.totalEvPct >= 0 ? '+' : ''}
              {optimizedResult.totalEvPct.toFixed(1)}%
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Quarter-Kelly Stake
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 tabular-nums">
              {optimizedResult.recommendedKellyStakePct.toFixed(1)}%
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Return on $100
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-sky-400 tabular-nums">
              ${optimizedResult.potentialReturnOn100.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Optimized Legs Table */}
        <div className="border border-slate-800/80 rounded-lg overflow-x-auto bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Leg</th>
                <th className="py-2.5 px-3">Fixture</th>
                <th className="py-2.5 px-3">Selection &amp; Market</th>
                <th className="py-2.5 px-3 text-right">Odds</th>
                <th className="py-2.5 px-3 text-right">Model vs Implied</th>
                <th className="py-2.5 px-3 text-right">Edge %</th>
                <th className="py-2.5 px-3 text-right">Kelly %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {optimizedResult.legs.map((leg, index) => (
                <tr key={leg.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                    #{index + 1}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-100">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo teamName={leg.homeTeam} className="w-4 h-4 object-contain shrink-0" />
                      <span>{leg.homeTeam} vs {leg.awayTeam}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{leg.league}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-emerald-300 block">{leg.selection}</span>
                    <span className="text-[10px] text-slate-400">{leg.market}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums">
                    {leg.odds.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    <span className="text-emerald-400 font-semibold">{leg.modelProb.toFixed(1)}%</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-slate-400">{leg.impliedProb.toFixed(1)}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                    <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[11px]">
                      +{leg.edgePct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300 tabular-nums">
                    {leg.kellyFraction.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bookmaker Booking Code Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">1-Click Booking Code:</span>
            {['SportyBet', '1xBet', 'Bet9ja', 'Betway'].map((bookie) => (
              <button
                key={bookie}
                type="button"
                onClick={() => handleGenerateCode(bookie)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold cursor-pointer"
              >
                {bookie}
              </button>
            ))}
          </div>

          {generatedBookieCode && (
            <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 rounded font-mono">
              <span className="text-slate-300">Code:</span>
              <span className="text-emerald-400 font-bold text-sm tracking-wider">{generatedBookieCode}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
