import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Prediction, getPrediction, getConfidence, getAnalysis } from '@/types/prediction';
import { TeamFormBadge } from '@/components/TeamFormBadge';
import { H2HWidget } from '@/components/H2HWidget';
import { SharePrediction } from '@/components/SharePrediction';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Target } from 'lucide-react';

interface Props { prediction: Prediction; open: boolean; onClose: () => void; }

interface MatchContext { homeForm?: string; awayForm?: string; h2h?: { home: string; away: string; score: string; date: string }[]; }

export const PredictionDetailModal = ({ prediction: p, open, onClose }: Props) => {
  const [context, setContext] = useState<MatchContext | null>(null);
  const [loading, setLoading] = useState(false);

  const loadContext = async () => {
    if (context || loading) return;
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('fetch-match-context', {
        body: { home_team: p.home_team, away_team: p.away_team },
      });
      if (data?.context) setContext(data.context);
    } finally { setLoading(false); }
  };

  if (open && !context && !loading) loadContext();

  const outcome = getPrediction(p);
  const confidence = getConfidence(p);
  const analysis = getAnalysis(p);

  const OUTCOME_COLOR: Record<string, string> = {
    'Home Win': 'bg-green-700', 'Away Win': 'bg-red-700', 'Draw': 'bg-amber-600',
  };

  const metadata = p.metadata as Record<string, number> | undefined;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{p.home_team} vs {p.away_team}</DialogTitle>
          <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
            <Badge variant="outline">{p.league}</Badge>
            <span>{new Date(p.match_date).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main prediction */}
          <div className="flex items-center justify-between bg-muted/30 rounded-xl p-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">AI Prediction</p>
              <Badge className={`${OUTCOME_COLOR[outcome] ?? 'bg-primary'} text-white text-base px-4 py-1.5`}>{outcome}</Badge>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Confidence</p>
              <p className="text-3xl font-black text-primary">{confidence}%</p>
            </div>
            <SharePrediction prediction={{ ...p, predicted_outcome: outcome, confidence_score: confidence, status: p.status ?? 'pending', is_premium: p.is_premium, created_at: p.created_at }} />
          </div>

          {/* Win probabilities */}
          {metadata?.home_win_probability !== undefined && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Win Probabilities</p>
              {[
                { label: p.home_team, prob: metadata.home_win_probability, odds: p.home_odds, color: 'bg-green-700' },
                { label: 'Draw', prob: metadata.draw_probability, odds: p.draw_odds, color: 'bg-amber-600' },
                { label: p.away_team, prob: metadata.away_win_probability, odds: p.away_odds, color: 'bg-red-700' },
              ].map(({ label, prob, odds, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate max-w-[55%] font-medium">{label}</span>
                    <div className="flex gap-3 text-muted-foreground">
                      {odds && <span className="font-bold text-primary">@ {odds.toFixed(2)}</span>}
                      <span>{prob ?? 0}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${prob ?? 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Analysis */}
          {analysis && (
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-sm font-medium flex items-center gap-2 mb-1.5"><TrendingUp className="h-4 w-4 text-primary" />AI Analysis</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis}</p>
            </div>
          )}

          {/* Form + H2H */}
          {loading && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {context?.homeForm && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent Form</p>
              <TeamFormBadge form={context.homeForm} label={p.home_team} />
              <TeamFormBadge form={context.awayForm ?? ''} label={p.away_team} />
            </div>
          )}
          {context?.h2h && context.h2h.length > 0 && (
            <H2HWidget h2h={context.h2h} homeTeam={p.home_team} awayTeam={p.away_team} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
