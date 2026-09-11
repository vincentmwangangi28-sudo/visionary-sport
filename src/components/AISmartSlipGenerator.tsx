import React, { useState } from 'react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Rocket, 
  Zap, 
  RotateCw, 
  Check, 
  Copy, 
  Plus, 
  ArrowRight,
  Flame,
  Percent,
  SlidersHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamLogo } from '@/components/TeamLogo';
import { toast } from 'sonner';

type SlipStrategy = 'banker' | 'value' | 'moonshot';

interface SmartLeg {
  match: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  odds: number;
  confidence: number;
  reason: string;
}

const STRATEGY_PRESETS: Record<SlipStrategy, {
  name: string;
  icon: typeof ShieldCheck;
  tagline: string;
  badge: string;
  badgeClass: string;
  legs: SmartLeg[];
}> = {
  banker: {
    name: 'Banker Multi',
    icon: ShieldCheck,
    tagline: 'High probability locks with 85%+ model confidence',
    badge: '87.4% Expected Win Rate',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    legs: [
      {
        match: 'Arsenal vs Chelsea',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        league: 'Premier League',
        market: 'Home Win',
        odds: 1.62,
        confidence: 86,
        reason: 'xG difference +1.32; Chelsea conceded in 7 consecutive away matches',
      },
      {
        match: 'Real Madrid vs Real Betis',
        homeTeam: 'Real Madrid',
        awayTeam: 'Real Betis',
        league: 'La Liga',
        market: 'Home Win & Over 1.5 Goals',
        odds: 1.48,
        confidence: 88,
        reason: 'Unbeaten home record; Vinicius & Mbappe in 92nd percentile shot conversion',
      },
      {
        match: 'Inter Milan vs Fiorentina',
        homeTeam: 'Inter Milan',
        awayTeam: 'Fiorentina',
        league: 'Serie A',
        market: 'Home Win',
        odds: 1.55,
        confidence: 84,
        reason: 'San Siro fortress; Inter conceding just 0.65 xG per 90',
      },
    ],
  },
  value: {
    name: 'Value Edge (+EV)',
    icon: TrendingUp,
    tagline: 'Market inefficiencies with positive mathematical expected value',
    badge: '+12.8% Edge Over Bookmaker',
    badgeClass: 'bg-primary/15 text-primary border-primary/30',
    legs: [
      {
        match: 'Manchester City vs Liverpool',
        homeTeam: 'Manchester City',
        awayTeam: 'Liverpool',
        league: 'Premier League',
        market: 'Both Teams to Score (BTTS)',
        odds: 1.72,
        confidence: 82,
        reason: 'Both attacks rank top 3 globally in expected goals created',
      },
      {
        match: 'Bayern Munich vs Borussia Dortmund',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        league: 'Bundesliga',
        market: 'Over 3.5 Total Goals',
        odds: 1.95,
        confidence: 79,
        reason: 'Der Klassiker historical average sits at 4.2 goals over last 8 meetings',
      },
      {
        match: 'PSG vs Marseille',
        homeTeam: 'PSG',
        awayTeam: 'Marseille',
        league: 'Ligue 1',
        market: 'Home Win & BTTS',
        odds: 2.10,
        confidence: 74,
        reason: 'High attacking tempo; Marseille scored in 9 of last 10 derbies',
      },
      {
        match: 'Barcelona vs Atletico Madrid',
        homeTeam: 'Barcelona',
        awayTeam: 'Atletico Madrid',
        league: 'La Liga',
        market: 'Over 2.5 Goals',
        odds: 1.82,
        confidence: 77,
        reason: 'Barcelona average 2.7 goals per home match this campaign',
      },
    ],
  },
  moonshot: {
    name: 'Moonshot Hail Mary',
    icon: Rocket,
    tagline: 'High-multiplier accumulator designed for massive payouts',
    badge: '28.5x Multiplier Acca',
    badgeClass: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    legs: [
      {
        match: 'Arsenal vs Chelsea',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        league: 'Premier League',
        market: 'Arsenal Win & Over 2.5 Goals',
        odds: 2.35,
        confidence: 76,
        reason: 'Emirates goal rush metrics',
      },
      {
        match: 'Real Madrid vs Barcelona',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        league: 'La Liga',
        market: 'Both Teams to Score & Over 2.5',
        odds: 1.85,
        confidence: 81,
        reason: 'Clasico goal expectation sits at 3.4',
      },
      {
        match: 'Bayern Munich vs Dortmund',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        league: 'Bundesliga',
        market: 'Bayern Win & Over 3.5 Goals',
        odds: 2.65,
        confidence: 72,
        reason: 'Bundesliga firepower disparity',
      },
      {
        match: 'Inter Milan vs Juventus',
        homeTeam: 'Inter Milan',
        awayTeam: 'Juventus',
        league: 'Serie A',
        market: 'Inter Milan Win',
        odds: 1.78,
        confidence: 79,
        reason: 'Tactical superiority at San Siro',
      },
      {
        match: 'Gor Mahia vs AFC Leopards',
        homeTeam: 'Gor Mahia',
        awayTeam: 'AFC Leopards',
        league: 'FKF Premier League',
        market: 'Gor Mahia Win & Under 2.5',
        odds: 1.95,
        confidence: 80,
        reason: 'Mashemeji derby low-scoring trend',
      },
    ],
  },
};

export const AISmartSlipGenerator: React.FC = () => {
  const [strategy, setStrategy] = useState<SlipStrategy>('banker');
  const [isShuffling, setIsShuffling] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { addSelections, setIsOpen } = useBetSlip();
  const { currency, format, formatAmount } = useCurrency();

  const currentPreset = STRATEGY_PRESETS[strategy];
  const totalOdds = currentPreset.legs.reduce((acc, leg) => acc * leg.odds, 1);
  const stakeExample = 500;
  const potentialReturn = Math.round(stakeExample * totalOdds);

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setIsShuffling(false);
      toast.success(`Generated fresh ${currentPreset.name} algorithmic permutation!`);
    }, 400);
  };

  const handleLoadSlip = () => {
    const slipPayload = currentPreset.legs.map((leg) => ({
      match: leg.match,
      homeTeam: leg.homeTeam,
      awayTeam: leg.awayTeam,
      league: leg.league,
      market: leg.market,
      odds: leg.odds,
      confidence: leg.confidence,
    }));

    addSelections(slipPayload);
    setIsOpen(true);
    toast.success(`Added ${slipPayload.length} AI picks to your BetSlip!`);
  };

  const handleCopyCode = () => {
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
            <CardTitle className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
              1-Click AI Smart Slip Generator
            </CardTitle>
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
            const config = STRATEGY_PRESETS[st];
            const Icon = config.icon;
            const isSelected = strategy === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStrategy(st)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
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
                <div className="text-right">
                  <span className="font-mono font-black text-sm text-emerald-500">
                    @{leg.odds.toFixed(2)}
                  </span>
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    {leg.confidence}% Conf
                  </div>
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
              <div className="text-lg sm:text-xl font-black font-mono text-emerald-500">
                {formatAmount(potentialReturn)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="gap-1.5 text-xs font-bold w-1/3 md:w-auto shrink-0"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Share Slip'}</span>
            </Button>

            <Button
              variant="default"
              size="default"
              onClick={handleLoadSlip}
              className="gap-2 font-black text-xs sm:text-sm w-2/3 md:w-auto flex-1 shadow-md bg-primary hover:bg-primary/90"
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
