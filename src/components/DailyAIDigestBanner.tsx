import React, { useState, useEffect } from 'react';
import {
  DailyAIDigest,
  DailyDigestItem,
  geminiDailyCronService,
} from '@/services/geminiDailyCron';
import { Prediction } from '@/types/prediction';
import { useBetSlip } from '@/hooks/useBetSlip';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  RefreshCw,
  Zap,
  TrendingUp,
  ShieldCheck,
  Flame,
  Plus,
  Check,
  Send,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  predictions?: Prediction[];
}

export const DailyAIDigestBanner: React.FC<Props> = ({ predictions = [] }) => {
  const [digest, setDigest] = useState<DailyAIDigest | null>(() =>
    geminiDailyCronService.getCachedDigest()
  );
  const [loading, setLoading] = useState(false);
  const { addSelection, selections } = useBetSlip();

  useEffect(() => {
    if (!digest && predictions.length > 0) {
      setLoading(true);
      geminiDailyCronService
        .generateDailyDigest(predictions)
        .then((res) => setDigest(res))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [predictions, digest]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const fresh = await geminiDailyCronService.generateDailyDigest(predictions);
      setDigest(fresh);
      toast.success('Generated fresh Gemini matchday briefing!');
    } catch (e) {
      console.warn('Failed to refresh digest:', e);
      toast.error('Failed to regenerate digest.');
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (pick: DailyDigestItem) => {
    return selections.some(
      (s) => s.match === pick.match && s.market === pick.pick
    );
  };

  const handleAddPick = (pick: DailyDigestItem) => {
    const parts = pick.match.split(' vs ');
    const home = parts[0] || pick.match;
    const away = parts[1] || '';

    addSelection({
      match: pick.match,
      homeTeam: home,
      awayTeam: away,
      league: pick.league,
      matchDate: new Date().toISOString(),
      market: pick.pick,
      odds: pick.odds,
      confidence: pick.confidence,
    });
    toast.success(`Added ${pick.match} (${pick.pick}) to Bet Slip`);
  };

  if (!digest && loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!digest) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-primary/[0.03] to-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary text-primary-foreground font-black text-[11px] gap-1 px-2.5 py-0.5">
                <Sparkles className="h-3.5 w-3.5" /> Gemini Daily Briefing
              </Badge>
              <Badge variant="outline" className="text-[11px] font-semibold gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" /> {digest.dateKey}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-bold">
                Auto-Cron Synchronized
              </Badge>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-foreground pt-1">
              {digest.headline}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {digest.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Send className="h-3.5 w-3.5" />
              <span>Telegram Auto-Broadcast Active</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs font-bold h-8 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Pulse Bar */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 mt-3 border-t border-border/40 flex-wrap">
          <span>
            Evaluated Matches: <strong className="text-foreground">{digest.marketPulse.totalMatchesAnalyzed}</strong>
          </span>
          <span>•</span>
          <span>
            Avg Model Confidence: <strong className="text-emerald-600 dark:text-emerald-400">{digest.marketPulse.avgConfidence}%</strong>
          </span>
          <span>•</span>
          <span>
            Top Value Market: <strong className="text-primary">{digest.marketPulse.bestValueLeague}</strong>
          </span>
        </div>
      </div>

      {/* Top Curated Picks Grid */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {digest.topPicks.map((pick, i) => {
          const selected = isSelected(pick);
          const icon =
            pick.type === 'banker' ? (
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            ) : pick.type === 'value' ? (
              <Zap className="h-4 w-4 text-amber-500" />
            ) : (
              <Flame className="h-4 w-4 text-rose-500" />
            );

          return (
            <Card
              key={i}
              className="border-border/60 bg-card/70 hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {icon}
                    <span className="text-xs font-bold text-foreground">{pick.title}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {pick.badge}
                  </Badge>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {pick.league}
                  </span>
                  <p className="font-extrabold text-sm sm:text-base text-foreground truncate">
                    {pick.match}
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-medium block">
                      Recommended Pick
                    </span>
                    <span className="text-xs font-black text-primary">{pick.pick}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground font-medium block">
                      Odds
                    </span>
                    <span className="text-xs font-black text-foreground">
                      {pick.odds.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {pick.tacticalAngle}
                </p>

                <Button
                  size="sm"
                  variant={selected ? 'default' : 'outline'}
                  onClick={() => handleAddPick(pick)}
                  className={`w-full text-xs font-bold h-8 gap-1.5 ${
                    selected ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {selected ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Added to Bet Slip
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" /> Add to Bet Slip
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
