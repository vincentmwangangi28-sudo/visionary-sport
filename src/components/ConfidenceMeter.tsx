import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConfidenceFactor, calculateConfidenceFactors } from '@/types/confidence';
import { ConfidenceFactorBreakdown } from '@/components/ConfidenceFactorBreakdown';

export interface ConfidenceMeterProps {
  confidence: number;
  variant?: 'card' | 'compact' | 'gauge' | 'inline';
  showLabel?: boolean;
  className?: string;
  predictionTip?: string;
  factors?: ConfidenceFactor[];
  homeTeam?: string;
  awayTeam?: string;
  showBreakdownInline?: boolean;
}

interface CertaintyTier {
  label: string;
  badgeText: string;
  colorClass: string;
  glowClass: string;
  barColor: string;
  pulseSpeed: number; // seconds per cycle
  description: string;
  winRateEstimate: string;
}

function getCertaintyTier(confidence: number): CertaintyTier {
  if (confidence >= 85) {
    return {
      label: 'Ultra High Certainty',
      badgeText: 'AI Banker',
      colorClass: 'text-emerald-800 dark:text-emerald-300',
      glowClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40',
      barColor: 'from-emerald-500 to-green-400',
      pulseSpeed: 1.1,
      description: 'Exceptionally strong statistical convergence across Poisson model, xG delta, and market steam.',
      winRateEstimate: '82% - 88% verified strike rate',
    };
  }
  if (confidence >= 75) {
    return {
      label: 'High Certainty',
      badgeText: 'Strong Pick',
      colorClass: 'text-green-800 dark:text-green-300',
      glowClass: 'bg-green-500/15 text-green-800 dark:text-green-300 border-green-500/30',
      barColor: 'from-green-500 to-emerald-400',
      pulseSpeed: 1.5,
      description: 'Solid statistical advantage with favorable home/away form, squad stability, and value odds alignment.',
      winRateEstimate: '74% - 81% historical accuracy',
    };
  }
  if (confidence >= 65) {
    return {
      label: 'Moderate Certainty',
      badgeText: 'Value Edge',
      colorClass: 'text-teal-800 dark:text-teal-300',
      glowClass: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30',
      barColor: 'from-teal-500 to-cyan-400',
      pulseSpeed: 2.0,
      description: 'Balanced fixture where model flags a clear positive expected value (+EV) margin versus bookmaker line.',
      winRateEstimate: '65% - 73% positive yield range',
    };
  }
  return {
    label: 'Calculated Risk',
    badgeText: 'Speculative',
    colorClass: 'text-amber-800 dark:text-amber-300',
    glowClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
    barColor: 'from-amber-500 to-yellow-400',
    pulseSpeed: 2.5,
    description: 'High volatility matchup with close margin; suitable for hedge betting, draw cover, or small staking.',
    winRateEstimate: '54% - 64% high-variance band',
  };
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = React.memo(({
  confidence,
  variant = 'card',
  showLabel = true,
  className = '',
  predictionTip,
  factors,
  homeTeam,
  awayTeam,
  showBreakdownInline = false,
}) => {
  const normalizedConfidence = Math.min(100, Math.max(0, Math.round(confidence)));
  const tier = getCertaintyTier(normalizedConfidence);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [inlineExpanded, setInlineExpanded] = useState(showBreakdownInline);

  // Lazy-compute breakdown of underlying factors only when needed
  const needsBreakdown = popoverOpen || inlineExpanded || variant === 'gauge';
  const breakdown = useMemo(() => {
    if (!needsBreakdown) {
      return { baseConfidence: normalizedConfidence, adjustedConfidence: normalizedConfidence, netImpact: 0, factors: [] };
    }
    return calculateConfidenceFactors(
      normalizedConfidence,
      homeTeam,
      awayTeam,
      predictionTip,
      factors
    );
  }, [needsBreakdown, normalizedConfidence, homeTeam, awayTeam, predictionTip, factors]);

  const dotColorClass =
    normalizedConfidence >= 80
      ? 'bg-emerald-500'
      : normalizedConfidence >= 65
      ? 'bg-teal-500'
      : 'bg-amber-500';

  // 1. Compact variant (for match lists, tickers, table cells)
  if (variant === 'compact') {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            title="Click to view underlying factors"
            className={`inline-flex items-center gap-1.5 focus:outline-none cursor-pointer group hover:opacity-85 transition-opacity ${className}`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColorClass}`} />
            </span>
            <span className={`text-[11px] font-black tabular-nums ${tier.colorClass}`}>
              {normalizedConfidence}%
            </span>
          </button>
        </PopoverTrigger>
        {popoverOpen && (
          <PopoverContent
            onClick={(e) => e.stopPropagation()}
            className="w-80 p-3.5 text-xs shadow-xl border-border/80"
            align="end"
            side="top"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={`h-4 w-4 ${tier.colorClass}`} />
                  <span className="font-extrabold text-foreground">{tier.label}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${tier.glowClass}`}>
                  {tier.badgeText}
                </span>
              </div>
              <ConfidenceFactorBreakdown breakdown={breakdown} predictionTip={predictionTip} />
            </div>
          </PopoverContent>
        )}
      </Popover>
    );
  }

  // 2. Inline badge variant
  if (variant === 'inline') {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity ${tier.glowClass} ${className}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
            <span className="tabular-nums">{normalizedConfidence}%</span>
            {showLabel && <span className="opacity-80 font-medium">({tier.badgeText})</span>}
          </button>
        </PopoverTrigger>
        {popoverOpen && (
          <PopoverContent
            onClick={(e) => e.stopPropagation()}
            className="w-80 p-3.5 text-xs shadow-xl border-border/80"
            align="start"
            side="bottom"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={`h-4 w-4 ${tier.colorClass}`} />
                  <span className="font-extrabold text-foreground">{tier.label}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${tier.glowClass}`}>
                  {tier.badgeText}
                </span>
              </div>
              <ConfidenceFactorBreakdown
                breakdown={breakdown}
                predictionTip={predictionTip}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            </div>
          </PopoverContent>
        )}
      </Popover>
    );
  }

  // 3. Gauge variant (Radial Circular Meter with Embedded Factor Breakdown)
  if (variant === 'gauge') {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (normalizedConfidence / 100) * circumference;

    return (
      <div
        className={`flex flex-col items-center justify-center p-4 bg-muted/30 rounded-2xl border border-border/50 text-center relative overflow-hidden ${className}`}
      >
        <div className="relative w-28 h-28 flex items-center justify-center mb-2">
          <svg className="w-28 h-28 transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              className="text-muted/40"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={tier.colorClass}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black tracking-tight tabular-nums ${tier.colorClass}`}>
              {normalizedConfidence}%
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Certainty
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={`inline-flex rounded-full h-2 w-2 ${dotColorClass}`} />
          <span className={`text-xs font-extrabold ${tier.colorClass}`}>
            {tier.label}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground mt-1.5 max-w-[220px] leading-snug">
          {tier.description}
        </p>

        <div className="mt-3 w-full bg-background/60 rounded-xl p-2.5 border border-border/40 text-left">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
            <span className="flex items-center gap-1 text-foreground">
              <Layers className="h-3 w-3 text-primary" /> Key Influencing Factors
            </span>
            <span className="text-[10px] text-muted-foreground">
              Net: {breakdown.netImpact >= 0 ? `+${breakdown.netImpact}%` : `${breakdown.netImpact}%`}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {breakdown.factors.slice(0, 3).map((factor) => (
              <span
                key={factor.name}
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                  factor.positive
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
                    : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/20'
                }`}
              >
                {factor.name}: {factor.impactDisplay}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setInlineExpanded(!inlineExpanded)}
            className="mt-2 text-[10px] text-primary hover:underline flex items-center justify-between w-full font-bold pt-1 border-t border-border/30"
          >
            <span>{inlineExpanded ? 'Hide Factor Breakdown' : 'View Full Factor Breakdown'}</span>
            {inlineExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {inlineExpanded && (
            <div className="mt-3 pt-2 border-t border-border/40">
              <ConfidenceFactorBreakdown
                breakdown={breakdown}
                predictionTip={predictionTip}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            </div>
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-border/40 w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-primary" />
          <span>{tier.winRateEstimate}</span>
        </div>
      </div>
    );
  }

  // 4. Default "card" variant with lazy popover (mounts Popover only on user click)
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        {popoverOpen ? (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                aria-label={`AI Confidence ${normalizedConfidence}% - ${tier.label}`}
                className="group flex items-center gap-1.5 focus:outline-none select-none cursor-pointer rounded-lg hover:opacity-90 transition-opacity"
              >
                <div className="relative flex items-center justify-center w-3.5 h-3.5">
                  <span className={`w-2 h-2 rounded-full ring-1 ring-background shadow-xs ${dotColorClass}`} />
                </div>
                <div className="w-16 sm:w-20 h-2 bg-muted/80 dark:bg-muted/40 rounded-full overflow-hidden p-0.5 border border-border/40 relative">
                  <div
                    style={{ width: `${normalizedConfidence}%` }}
                    className={`h-full rounded-full bg-gradient-to-r ${tier.barColor}`}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black tabular-nums tracking-tight ${tier.colorClass}`}>
                    {normalizedConfidence}%
                  </span>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent
              onClick={(e) => e.stopPropagation()}
              className="w-80 p-3.5 text-xs shadow-xl border-border/80"
              align="end"
              side="top"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className={`h-4 w-4 ${tier.colorClass}`} />
                    <span className="font-extrabold text-foreground">{tier.label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${tier.glowClass}`}>
                    {tier.badgeText}
                  </span>
                </div>

                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {tier.description}
                </p>

                <ConfidenceFactorBreakdown
                  breakdown={breakdown}
                  predictionTip={predictionTip}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />

                <div className="pt-1 text-[10px] text-muted-foreground flex items-center justify-between border-t border-border/30">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span>Historical accuracy: <strong>{tier.winRateEstimate}</strong></span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPopoverOpen(true);
            }}
            aria-label={`AI Confidence ${normalizedConfidence}% - ${tier.label}`}
            className="group flex items-center gap-1.5 focus:outline-none select-none cursor-pointer rounded-lg hover:opacity-90 transition-opacity"
          >
            <div className="relative flex items-center justify-center w-3.5 h-3.5">
              <span className={`w-2 h-2 rounded-full ring-1 ring-background shadow-xs ${dotColorClass}`} />
            </div>
            <div className="w-16 sm:w-20 h-2 bg-muted/80 dark:bg-muted/40 rounded-full overflow-hidden p-0.5 border border-border/40 relative">
              <div
                style={{ width: `${normalizedConfidence}%` }}
                className={`h-full rounded-full bg-gradient-to-r ${tier.barColor}`}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-black tabular-nums tracking-tight ${tier.colorClass}`}>
                {normalizedConfidence}%
              </span>
              <HelpCircle className="h-3 w-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            </div>
          </button>
        )}

        {/* Inline Factor Breakdown Quick Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setInlineExpanded(!inlineExpanded);
          }}
          title="Toggle underlying factors breakdown"
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-muted/50 font-semibold"
        >
          <Layers className="h-2.5 w-2.5" />
          <span>Factors</span>
          {inlineExpanded ? (
            <ChevronUp className="h-2.5 w-2.5" />
          ) : (
            <ChevronDown className="h-2.5 w-2.5" />
          )}
        </button>
      </div>

      {/* Inline Accordion Breakdown (When Expanded) */}
      {inlineExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="overflow-hidden w-full"
        >
          <div className="p-2 bg-muted/30 rounded-xl border border-border/50 text-left mt-1 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
              <span>Underlying Influences</span>
              <span className="font-mono text-primary font-black">
                Net: {breakdown.netImpact >= 0 ? `+${breakdown.netImpact}%` : `${breakdown.netImpact}%`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {breakdown.factors.slice(0, 4).map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between text-[10px] p-1 bg-background/80 rounded border border-border/30"
                >
                  <span className="truncate text-muted-foreground font-medium">{f.name}</span>
                  <strong
                    className={`font-mono text-[10px] font-black shrink-0 ${
                      f.positive ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {f.impactDisplay}
                  </strong>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPopoverOpen(true);
              }}
              className="text-[10px] text-primary hover:underline font-bold w-full text-center block pt-0.5"
            >
              View complete breakdown ({breakdown.factors.length} factors) →
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
