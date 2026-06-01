import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Prediction, getPrediction, getConfidence, getAnalysis } from '@/types/prediction';
import { SharePrediction } from '@/components/SharePrediction';
import { Lock, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PredictionDetailModal } from '@/components/PredictionDetailModal';
import { useSubscription } from '@/hooks/useSubscription';

interface Props { prediction: Prediction; }

const OUTCOME_COLOR: Record<string, string> = {
  'Home Win': 'bg-green-500/10 text-green-700 border-green-500/30',
  'Away Win': 'bg-red-500/10 text-red-700 border-red-500/30',
  'Draw':     'bg-amber-500/10 text-amber-700 border-amber-500/30',
};

export const PredictionCard = ({ prediction: p }: Props) => {
  const { isPremium } = useSubscription();
  const [showDetail, setShowDetail] = useState(false);
  const outcome = getPrediction(p);
  const confidence = getConfidence(p);
  const analysis = getAnalysis(p);
  const locked = p.is_premium && !isPremium() && outcome.includes('🔒');

  return (
    <>
    <Card onClick={() => !locked && setShowDetail(true)} className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${locked ? 'opacity-70' : ''} ${confidence >= 80 ? 'border-primary/30' : ''}`}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <Badge variant="outline" className="text-xs">{p.league}</Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(p.match_date).toLocaleString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="mt-2">
          <p className="font-bold text-base leading-snug">{p.home_team} <span className="text-muted-foreground font-normal text-sm">vs</span> {p.away_team}</p>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Prediction + confidence */}
        <div className="flex items-center justify-between gap-2">
          <Badge className={`${OUTCOME_COLOR[outcome] ?? 'bg-muted text-foreground'} border font-semibold px-3 py-1`}>
            {locked ? <><Lock className="h-3 w-3 mr-1" />Premium</> : outcome}
          </Badge>
          {!locked && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${confidence >= 80 ? 'bg-green-500' : confidence >= 65 ? 'bg-primary' : 'bg-amber-500'}`}
                  style={{ width: `${confidence}%` }} />
              </div>
              <span className={`text-xs font-bold ${confidence >= 80 ? 'text-green-600' : confidence >= 65 ? 'text-primary' : 'text-amber-600'}`}>
                {confidence}%
              </span>
            </div>
          )}
        </div>

        {/* Odds row */}
        {!locked && (p.home_odds || p.draw_odds || p.away_odds) && (
          <div className="flex gap-2">
            {[{ l: '1', v: p.home_odds }, { l: 'X', v: p.draw_odds }, { l: '2', v: p.away_odds }].map(({ l, v }) =>
              v ? (
                <div key={l} className="flex-1 text-center bg-muted/50 rounded-md py-1.5">
                  <p className="text-xs text-muted-foreground">{l}</p>
                  <p className="font-bold text-sm">{v.toFixed(2)}</p>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Analysis */}
        {!locked && analysis && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{analysis}</p>
        )}

        {locked && (
          <Link to="/shop">
            <Button size="sm" className="w-full gap-2"><TrendingUp className="h-3.5 w-3.5" />Unlock Premium</Button>
          </Link>
        )}

        <div className="flex justify-end">
          <SharePrediction prediction={{ ...p, predicted_outcome: outcome, confidence_score: confidence, status: p.status ?? 'pending', is_premium: p.is_premium, created_at: p.created_at }} />
        </div>
      </CardContent>
    </Card>
    <PredictionDetailModal prediction={p} open={showDetail} onClose={() => setShowDetail(false)} />
    </>
  );
};
