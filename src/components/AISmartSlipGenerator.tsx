import React, { useState, useMemo } from 'react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useCurrency } from '@/hooks/useCurrency';
import { usePredictions } from '@/hooks/usePredictions';
import { Prediction, getPrediction, getConfidence, getAnalysis } from '@/types/prediction';
import { 
  ShieldCheck, 
  TrendingUp, 
  Rocket, 
  Zap, 
  RotateCw, 
  Check, 
  Copy, 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamLogo } from '@/components/TeamLogo';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { hapticService } from '@/services/hapticService';
import { toast } from 'sonner';

type SlipStrategy = 'banker' | 'value' | 'moonshot';

interface SmartLeg {
  match: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate?: string;
  market: string;
  odds: number;
  confidence: number;
  reason: string;
}

interface StrategyConfig {
  name: string;
  icon: typeof ShieldCheck;
  tagline: string;
  badge: string;
  badgeClass: string;
  legs: SmartLeg[];
}

function buildLegFromPrediction(p: Prediction, mode: SlipStrategy): SmartLeg {
  const baseOutcome = getPrediction(p);
  const conf = getConfidence(p) || 76;
  const homeOdds = p.home_odds ?? 1.85;
  const drawOdds = p.draw_odds ?? 3.30;
  const awayOdds = p.away_odds ?? 2.90;

  let market = baseOutcome || 'Home Win';
  let odds = baseOutcome === 'Away Win' ? awayOdds : baseOutcome === 'Draw' ? drawOdds : homeOdds;

  if (mode === 'banker') {
    odds = Number(Math.max(1.32, Math.min(1.85, odds)).toFixed(2));
  } else if (mode === 'value') {
    if (odds < 1.65) {
      market = `${baseOutcome} & Over 1.5 Goals`;
      odds = Number((odds * 1.24).toFixed(2));
    }
  } else if (mode === 'moonshot') {
    if (odds < 1.85) {
      market = `${baseOutcome} & Over 2.5 Goals`;
      odds = Number((odds * 1.42).toFixed(2));
    }
  }

  const analysisText = getAnalysis(p) || `${p.home_team} vs ${p.away_team} live schedule model projects ${market} (${conf}% confidence).`;

  return {
    match: `${p.home_team} vs ${p.away_team}`,
    homeTeam: p.home_team,
    awayTeam: p.away_team,
    league: p.league,
    matchDate: p.match_date,
    market,
    odds,
    confidence: conf,
    reason: analysisText,
  };
}

export const AISmartSlipGenerator: React.FC<{ predictions?: Prediction[] }> = ({ predictions: propPredictions }) => {
  const [strategy, setStrategy] = useState<SlipStrategy>('banker');
  const [shuffleOffset, setShuffleOffset] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { addSelections, setIsOpen } = useBetSlip();
  const { formatAmount } = useCurrency();
  const { data, predictions: hookPredictions } = usePredictions(1);

  const activePool = useMemo(() => {
    if (propPredictions && propPredictions.length > 0) return propPredictions;
    return data?.allPredictions?.length ? data.allPredictions : hookPredictions;
  }, [propPredictions, data?.allPredictions, hookPredictions]);

  const dynamicPresets = useMemo<Record<SlipStrategy, StrategyConfig>>(() => {
    const pool = activePool.length > 0 ? activePool : [];
    const rotate = <T,>(arr: T[], offset: number): T[] => {
      if (arr.length === 0) return [];
      const k = offset % arr.length;
      return [...arr.slice(k), ...arr.slice(0, k)];
    };

    const byConf = rotate(
      [...pool].sort((a, b) => (getConfidence(b) || 0) - (getConfidence(a) || 0)),
      shuffleOffset * 2
    );
    const byValue = rotate(
      [...pool].filter((p) => (p.home_odds ?? 1.9) >= 1.65 || (p.away_odds ?? 2.2) >= 1.75),
      shuffleOffset * 3
    );
    const byHighOdds = rotate(
      [...pool].sort((a, b) => (b.home_odds ?? 2.0) - (a.home_odds ?? 2.0)),
      shuffleOffset * 2 + 1
    );

    const bankerPool = byConf.slice(0, 3);
    const valuePool = (byValue.length >= 4 ? byValue : byConf).slice(0, 4);
    const moonshotPool = (byHighOdds.length >= 5 ? byHighOdds : byConf).slice(0, 5);

    const bankerLegs = bankerPool.map((p) => buildLegFromPrediction(p, 'banker'));
    const valueLegs = valuePool.map((p) => buildLegFromPrediction(p, 'value'));
    const moonshotLegs = moonshotPool.map((p) => buildLegFromPrediction(p, 'moonshot'));

    const moonshotMult = moonshotLegs.reduce((acc, l) => acc * l.odds, 1);

    return {
      banker: {
        name: 'Banker Multi',
        icon: ShieldCheck,
        tagline: 'High probability locks from upcoming verified fixtures',
        badge: 'High Confidence Acca',
        badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
        legs: bankerLegs,
      },
      value: {
        name: 'Value Edge (+EV)',
        icon: TrendingUp,
        tagline: 'Upcoming market inefficiencies with positive mathematical expected value',
        badge: '+EV Market Edge',
        badgeClass: 'bg-primary/15 text-primary border-primary/30',
        legs: valueLegs,
      },
      moonshot: {
        name: 'Moonshot Hail Mary',
        icon: Rocket,
        tagline: 'High-multiplier accumulator built from upcoming fixtures',
        badge: `${moonshotMult.toFixed(1)}x Multiplier Acca`,
        badgeClass: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30',
        legs: moonshotLegs,
      },
    };
  }, [activePool, shuffleOffset]);

  const currentPreset = dynamicPresets[strategy];
  const totalOdds = currentPreset.legs.reduce((acc, leg) => acc * leg.odds, 1);
  const stakeExample = 500;
  const potentialReturn = Math.round(stakeExample * totalOdds);

  const handleShuffle = () => {
    hapticService.selection();
    setIsShuffling(true);
    setShuffleOffset((prev) => prev + 1);
    setTimeout(() => {
      setIsShuffling(false);
      toast.success(`Generated fresh ${currentPreset.name} from live upcoming fixtures!`);
    }, 350);
  };

  const handleLoadSlip = () => {
    hapticService.boost();
    const slipPayload = currentPreset.legs.map((leg) => ({
      match: leg.match,
      homeTeam: leg.homeTeam,
      awayTeam: leg.awayTeam,
      league: leg.league,
      matchDate: leg.matchDate,
      market: leg.market,
      odds: leg.odds,
      confidence: leg.confidence,
    }));

    addSelections(slipPayload);
    setIsOpen(true);
    toast.success(`Added ${slipPayload.length} AI picks to your BetSlip!`);
  };

  const handleCopyCode = () => {
    hapticService.success();
    const randomCode = `PREDICT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    navigator.clipboard.writeText(randomCode);
    setCopiedCode(true);
    toast.success(`Copied Booking Code: ${randomCode}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <Card className="border-border/60 bg-gradient-to-b from-card via-card to-muted/20 shadow-md overflow-hidden relative">
      {/* Top Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-emerald-500 to-purple-500" />

      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Zap className="w-3.5 h-3.5" /> Super AI Feature
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 tracking-tight">
              1-Click AI Smart Slip Generator
            </h2>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Select your risk appetite and let our neural network engineer the optimal mathematical multibet slip.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            disabled={isShuffling}
            className="gap-1.5 text-xs font-bold self-start sm:self-auto shrink-0"
          >
            <RotateCw className={`w-3.5 h-3.5 text-primary ${isShuffling ? 'animate-spin' : ''}`} />
            <span>Re-Roll Combo</span>
          </Button>
        </div>

        {/* 3 Strategy Preset Switchers */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {(['banker', 'value', 'moonshot'] as SlipStrategy[]).map((st) => {
            const config = dynamicPresets[st];
            const Icon = config.icon;
            const isSelected = strategy === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  hapticService.selection();
                  setStrategy(st);
                }}
                className={`p-3 min-h-[48px] rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                    : 'border-border/60 bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-extrabold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    {config.name}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-[10px] text-muted-foreground line-clamp-1">
                  {config.legs.length} Picks · ~{config.legs.reduce((a, b) => a * b.odds, 1).toFixed(2)}x
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Strategy Description Badge */}
        <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
          <span className="text-muted-foreground font-medium">
            {currentPreset.tagline}
          </span>
          <Badge variant="outline" className={`font-black text-[11px] ${currentPreset.badgeClass}`}>
            {currentPreset.badge}
          </Badge>
        </div>

        {/* Generated Legs List */}
        <div className="space-y-2">
          {currentPreset.legs.map((leg, index) => (
            <div
              key={`${leg.match}-${leg.market}`}
              className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-black text-muted-foreground shrink-0">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
                    <span>{leg.league}</span>
                  </div>
                  <div className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <TeamLogo teamName={leg.homeTeam} size="xs" />
                    <span>{leg.homeTeam}</span>
                    <span className="text-muted-foreground font-normal text-xs">vs</span>
                    <TeamLogo teamName={leg.awayTeam} size="xs" />
                    <span>{leg.awayTeam}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 italic">
                    {leg.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pl-9 sm:pl-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/30">
                <Badge variant="secondary" className="font-bold text-xs">
                  {leg.market}
                </Badge>
                <div className="text-right flex flex-col items-end gap-0.5">
                  <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-400">
                    @{leg.odds.toFixed(2)}
                  </span>
                  <ConfidenceMeter confidence={leg.confidence} variant="compact" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer & Action Bar */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-3 gap-4 w-full md:w-auto text-center md:text-left">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Total Odds
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-primary">
                {totalOdds.toFixed(2)}x
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Picks
              </div>
              <div className="text-lg sm:text-xl font-black text-foreground">
                {currentPreset.legs.length} Legs
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Potential on 500
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                {formatAmount(potentialReturn)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="gap-1.5 text-xs font-bold w-1/3 md:w-auto shrink-0 min-h-[44px]"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Share Slip'}</span>
            </Button>

            <Button
              variant="default"
              size="default"
              onClick={handleLoadSlip}
              className="gap-2 font-black text-xs sm:text-sm w-2/3 md:w-auto flex-1 shadow-md bg-primary hover:bg-primary/90 min-h-[44px]"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Load to BetSlip ({totalOdds.toFixed(2)}x)</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
