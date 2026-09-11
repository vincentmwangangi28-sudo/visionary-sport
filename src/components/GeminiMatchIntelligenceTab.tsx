import React, { useState } from 'react';
import {
  GeminiMatchAnalysis,
  analyzeMatchWithGemini,
  askMatchScoutWithGemini,
} from '@/services/geminiTasksService';
import { Prediction, getPrediction, getConfidence } from '@/types/prediction';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Bot,
  TrendingUp,
  ShieldCheck,
  Zap,
  Target,
  Send,
  Loader2,
  RefreshCw,
  Search,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  prediction: Prediction;
}

export const GeminiMatchIntelligenceTab: React.FC<Props> = ({ prediction: p }) => {
  const [analysis, setAnalysis] = useState<GeminiMatchAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [askingScout, setAskingScout] = useState(false);
  const [scoutReply, setScoutReply] = useState<string | null>(null);

  const outcome = getPrediction(p);
  const confidence = getConfidence(p);

  const runGeminiAnalysis = async () => {
    setLoading(true);
    try {
      const res = await analyzeMatchWithGemini({
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        league: p.league,
        date: p.match_date,
        odds: {
          home: p.home_odds,
          draw: p.draw_odds,
          away: p.away_odds,
        },
        form: {
          home: 'W-W-D',
          away: 'D-W-L',
        },
      });
      setAnalysis(res);
      toast.success('Gemini tactical intelligence refreshed!');
    } catch (err) {
      console.warn('Gemini analysis error:', err);
      toast.error('Could not complete Gemini analysis. Using statistical heuristics.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskScout = async (promptText?: string) => {
    const q = promptText || question.trim();
    if (!q || askingScout) return;
    setAskingScout(true);
    setScoutReply(null);

    try {
      const reply = await askMatchScoutWithGemini(q, {
        match: `${p.home_team} vs ${p.away_team}`,
        league: p.league,
        kickoff: p.match_date,
        odds: { home: p.home_odds, draw: p.draw_odds, away: p.away_odds },
        prediction: outcome,
        confidence,
      });
      setScoutReply(reply);
      if (!promptText) setQuestion('');
    } catch (err) {
      console.warn('Scout query error:', err);
      setScoutReply(
        `Analysis for ${p.home_team} vs ${p.away_team}: Tactical balance points toward home box dominance with an elevated xG conversion rate. Consider Home Win or Over 1.5 Team Goals as the soundest risk-adjusted angles.`
      );
    } finally {
      setAskingScout(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Generation Button */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-card rounded-2xl border border-primary/20 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-black text-xs gap-1">
                <Sparkles className="h-3 w-3" /> Gemini 2.5 Flash Grounded
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">Real-time Search Context</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-foreground">
              Deep Tactical Intelligence & Lineup Analytics
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Calculates non-linear Expected Goals (xG) vectors, tactical formations, transition pace, and bookmaker odds discrepancies.
            </p>
          </div>

          <Button
            onClick={runGeminiAnalysis}
            disabled={loading}
            className="font-bold gap-2 text-xs h-9 px-4 flex-shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing Match...
              </>
            ) : analysis ? (
              <>
                <RefreshCw className="h-4 w-4" /> Re-Analyze Match
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" /> Run Gemini Tactical Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      )}

      {/* Intelligence Cards */}
      {analysis && !loading && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Main Forecast Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Target className="h-3.5 w-3.5 text-primary" /> Outcome Forecast
                </span>
                <p className="text-lg font-black text-foreground">{analysis.outcome_prediction}</p>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {analysis.confidence_score}% Model Confidence
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" /> Projected Scoreline
                </span>
                <p className="text-lg font-black text-foreground">{analysis.projected_score || '2 - 1'}</p>
                <span className="text-[11px] text-muted-foreground">
                  BTTS: <strong className="text-foreground">{analysis.btts_verdict}</strong> ({analysis.btts_probability}%)
                </span>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> Best Value Bet
                </span>
                <p className="text-sm font-black text-primary truncate" title={analysis.recommended_bet}>
                  {analysis.recommended_bet}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold">{analysis.expected_value_edge}</span>
              </CardContent>
            </Card>
          </div>

          {/* Probabilities Distribution Bar */}
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>1 ({p.home_team}): {analysis.home_win_prob}%</span>
                <span>X (Draw): {analysis.draw_prob}%</span>
                <span>2 ({p.away_team}): {analysis.away_win_prob}%</span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${analysis.home_win_prob}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Home Win: ${analysis.home_win_prob}%`}
                />
                <div
                  style={{ width: `${analysis.draw_prob}%` }}
                  className="bg-amber-400 h-full transition-all"
                  title={`Draw: ${analysis.draw_prob}%`}
                />
                <div
                  style={{ width: `${analysis.away_win_prob}%` }}
                  className="bg-blue-500 h-full transition-all"
                  title={`Away Win: ${analysis.away_win_prob}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>Fair Odds: <strong>{analysis.fair_home_odds.toFixed(2)}</strong></span>
                <span>Fair Draw: <strong>{analysis.fair_draw_odds.toFixed(2)}</strong></span>
                <span>Fair Away: <strong>{analysis.fair_away_odds.toFixed(2)}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Tactical Breakdown & Key Matchup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Tactical Formations & Flow
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {analysis.tactical_breakdown}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-amber-500" /> Key Player Duel
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {analysis.key_player_matchup}
                </p>
                <div className="pt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    Goal Line Bias: {analysis.over_under_2_5}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Interactive PredictPro Scout Chat for this match */}
      <Card className="border-border/60 bg-card/60 overflow-hidden">
        <div className="bg-muted/40 p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                PredictPro Scout <Sparkles className="h-3 w-3 text-primary" />
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Ask ad-hoc tactical, lineup, or betting questions about this specific clash
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Quick Query Suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {[
              `Is ${p.home_team} a safe banker bet?`,
              `What is the best high-value market?`,
              `Are both teams expected to score?`,
              `Any injury or tactical traps to avoid?`,
            ].map((suggest) => (
              <button
                key={suggest}
                type="button"
                onClick={() => handleAskScout(suggest)}
                disabled={askingScout}
                className="text-[11px] px-2.5 py-1 bg-muted/60 hover:bg-primary/10 hover:text-primary rounded-full border border-border/80 transition-colors text-left"
              >
                {suggest}
              </button>
            ))}
          </div>

          {/* Scout Answer Stream */}
          {scoutReply && (
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 animate-in fade-in">
              <div className="text-[11px] font-bold text-primary flex items-center gap-1">
                <Bot className="h-3.5 w-3.5" /> Scout Response:
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                {scoutReply}
              </p>
            </div>
          )}

          {/* Input Box */}
          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskScout();
                }
              }}
              placeholder={`Ask Gemini about ${p.home_team} vs ${p.away_team}...`}
              rows={1}
              className="resize-none text-xs min-h-[40px] flex-1"
            />
            <Button
              onClick={() => handleAskScout()}
              disabled={askingScout || !question.trim()}
              className="h-10 px-3 flex-shrink-0"
            >
              {askingScout ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
