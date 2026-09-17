import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamLogo } from '@/components/TeamLogo';
import { 
  getQuickInsight, 
  QuickInsightResult, 
  QuickInsightInjuryItem,
  QuickInsightH2HTrend 
} from '@/services/geminiTasksService';
import { 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldAlert,
  Flame,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickInsightCardProps {
  homeTeam: string;
  awayTeam: string;
  league?: string;
  matchDate?: string;
  className?: string;
}

export const QuickInsightCard: React.FC<QuickInsightCardProps> = ({
  homeTeam,
  awayTeam,
  league = 'Premier League',
  matchDate,
  className = '',
}) => {
  const [insight, setInsight] = useState<QuickInsightResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSources, setShowSources] = useState<boolean>(false);

  const fetchInsight = useCallback(async (bypassCache = false) => {
    if (!homeTeam || !awayTeam) return;
    
    if (bypassCache) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getQuickInsight({
        homeTeam,
        awayTeam,
        league,
        date: matchDate,
        bypassCache,
      });
      setInsight(data);
    } catch (err) {
      console.error('[QuickInsightCard] Failed to fetch insight:', err);
      toast.error('Unable to fetch live insights. Displaying tactical baseline.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [homeTeam, awayTeam, league, matchDate]);

  useEffect(() => {
    fetchInsight(false);
  }, [fetchInsight]);

  const handleCopy = () => {
    if (!insight) return;
    const text = `⚽ ${homeTeam} vs ${awayTeam} - Tactical & Injury Insight (Gemini AI)\n\n` +
      `Summary: ${insight.summary}\n\n` +
      `Tactical Verdict: ${insight.tacticalVerdict}\n\n` +
      `Key H2H Trend: ${insight.h2hTrends[0]?.trend || 'High intensity clash'}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        toast.success('Insight copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const getStatusBadge = (status: QuickInsightInjuryItem['status']) => {
    switch (status) {
      case 'Ruled Out':
        return (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-bold tracking-tight">
            Ruled Out
          </Badge>
        );
      case 'Doubtful':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0 font-bold">
            Doubtful
          </Badge>
        );
      case 'Returning':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0 font-bold">
            Returning
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {status}
          </Badge>
        );
    }
  };

  const getAdvantageBadge = (adv: QuickInsightH2HTrend['advantage']) => {
    if (adv === 'home') {
      return (
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {homeTeam} Edge
        </span>
      );
    }
    if (adv === 'away') {
      return (
        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
          {awayTeam} Edge
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
        Balanced
      </span>
    );
  };

  return (
    <Card className={`border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b bg-muted/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight">
                Quick Tactical & Injury Insight
              </h3>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/30 font-mono py-0 px-1.5">
                Gemini 3.8
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Automated intelligence on squad availability & historical head-to-head dynamics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            disabled={loading || !insight}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            title="Copy insight briefing"
            aria-label={copied ? "Insight briefing copied to clipboard" : "Copy insight briefing to clipboard"}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchInsight(true)}
            disabled={loading || refreshing}
            className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-muted font-semibold"
            aria-label="Refresh live tactical and injury insights"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing || loading ? 'animate-spin text-primary' : ''}`} aria-hidden="true" />
            <span>{refreshing ? 'Analyzing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 space-y-5">
        {loading && !insight ? (
          /* Shimmering Skeleton Loader */
          <div className="space-y-4 py-2 animate-pulse">
            <div className="h-14 bg-muted/60 rounded-xl w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="h-28 bg-muted/40 rounded-xl" />
              <div className="h-28 bg-muted/40 rounded-xl" />
            </div>
            <div className="h-20 bg-muted/50 rounded-xl" />
          </div>
        ) : insight ? (
          <>
            {/* Executive Summary Briefing */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-primary/5 border border-primary/15 relative">
              <div className="flex items-start gap-2.5">
                <Zap className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">
                    Executive Match Briefing
                  </p>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium">
                    {insight.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Injuries & Squad Fitness Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span>Key Squad Fitness & Injury Reports</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Verified Team News
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Home Team Injuries */}
                <div className="p-3 rounded-xl border bg-card/60 space-y-2">
                  <div className="flex items-center gap-2 pb-1 border-b">
                    <TeamLogo team={homeTeam} league={league} size="sm" />
                    <span className="font-bold text-xs text-foreground truncate">{homeTeam}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto py-0 px-1.5 text-muted-foreground">
                      Home
                    </Badge>
                  </div>

                  {insight.keyInjuries.home && insight.keyInjuries.home.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {insight.keyInjuries.home.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-0.5 text-xs">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-semibold text-foreground truncate">{item.player}</span>
                            {getStatusBadge(item.status)}
                          </div>
                          <span className="text-[11px] text-muted-foreground leading-tight">{item.detail}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No high-impact squad absences reported.
                    </p>
                  )}
                </div>

                {/* Away Team Injuries */}
                <div className="p-3 rounded-xl border bg-card/60 space-y-2">
                  <div className="flex items-center gap-2 pb-1 border-b">
                    <TeamLogo team={awayTeam} league={league} size="sm" />
                    <span className="font-bold text-xs text-foreground truncate">{awayTeam}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto py-0 px-1.5 text-muted-foreground">
                      Away
                    </Badge>
                  </div>

                  {insight.keyInjuries.away && insight.keyInjuries.away.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {insight.keyInjuries.away.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-0.5 text-xs">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-semibold text-foreground truncate">{item.player}</span>
                            {getStatusBadge(item.status)}
                          </div>
                          <span className="text-[11px] text-muted-foreground leading-tight">{item.detail}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No high-impact squad absences reported.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* H2H Tactical Trends */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Head-to-Head & Tactical Trends</span>
                </div>
                {insight.impactScore && (
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                    Impact Factor: {insight.impactScore}/10
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {insight.h2hTrends.map((trend, idx) => (
                  <div key={idx} className="p-3 rounded-xl border bg-muted/20 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-foreground">{trend.stat}</span>
                      {getAdvantageBadge(trend.advantage)}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {trend.trend}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Verdict Footer */}
            <div className="p-3 bg-card border rounded-xl flex items-start gap-2.5">
              <Flame className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="text-foreground font-bold">Tactical Takeaway: </strong>
                <span className="text-muted-foreground">{insight.tacticalVerdict}</span>
              </div>
            </div>

            {/* Grounding & Verification Footnote */}
            {insight.groundingMetadata && (
              <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Grounded with Google Sports Search & Official Medical Bulletins</span>
                </div>

                {insight.groundingMetadata.sources?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSources(!showSources)}
                    aria-expanded={showSources}
                    aria-label={showSources ? 'Hide verified sources' : `View ${insight.groundingMetadata.sources.length} verified sources`}
                    className="text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>{showSources ? 'Hide Sources' : `View Sources (${insight.groundingMetadata.sources.length})`}</span>
                  </button>
                )}
              </div>
            )}

            {showSources && insight.groundingMetadata?.sources && (
              <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5 text-xs animate-in fade-in-50 duration-200">
                <span className="text-[11px] font-bold text-muted-foreground block">Verified Intelligence References:</span>
                <ul className="space-y-1">
                  {insight.groundingMetadata.sources.map((src, i) => (
                    <li key={i}>
                      <a
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 truncate text-[11px]"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{src.title || src.uri}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 space-y-2">
            <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">Tactical insights unavailable at the moment.</p>
            <Button size="sm" variant="outline" onClick={() => fetchInsight(true)} className="text-xs">
              Retry Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
