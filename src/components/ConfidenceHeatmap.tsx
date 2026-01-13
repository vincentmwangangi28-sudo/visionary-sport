import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Prediction {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  prediction: string;
  confidence: number;
  is_upset_alert: boolean | null;
  sport: string | null;
}

export const ConfidenceHeatmap = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const { data } = await supabase
        .from('predictions')
        .select('id, home_team, away_team, league, prediction, confidence, is_upset_alert, sport')
        .gte('match_date', new Date().toISOString())
        .order('confidence', { ascending: false })
        .limit(20);

      setPredictions(data || []);
    } catch (error) {
      console.error("Error fetching predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'bg-green-500';
    if (confidence >= 75) return 'bg-green-400';
    if (confidence >= 70) return 'bg-yellow-400';
    if (confidence >= 65) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getConfidenceGlow = (confidence: number) => {
    if (confidence >= 85) return 'shadow-green-500/50';
    if (confidence >= 75) return 'shadow-green-400/40';
    if (confidence >= 70) return 'shadow-yellow-400/40';
    return 'shadow-orange-400/30';
  };

  const getSportIcon = (sport: string | null) => {
    switch (sport) {
      case 'basketball': return '🏀';
      case 'tennis': return '🎾';
      case 'football':
      default: return '⚽';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Confidence Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          AI Confidence Heatmap
          <Badge variant="secondary" className="ml-auto">
            {predictions.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
          {predictions.map((pred) => (
            <div
              key={pred.id}
              className={`relative p-2 rounded-lg transition-all hover:scale-105 cursor-pointer ${getConfidenceColor(pred.confidence)} ${getConfidenceGlow(pred.confidence)} shadow-lg`}
              title={`${pred.home_team} vs ${pred.away_team}\n${pred.prediction} (${pred.confidence}%)`}
            >
              <div className="text-center text-white">
                <span className="text-lg">{getSportIcon(pred.sport)}</span>
                <p className="text-xl font-bold">{pred.confidence}%</p>
                <p className="text-[10px] truncate opacity-90">
                  {pred.home_team.substring(0, 3)} v {pred.away_team.substring(0, 3)}
                </p>
              </div>
              
              {pred.is_upset_alert && (
                <div className="absolute -top-1 -right-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-300 animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>85%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-400" />
            <span>75-84%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-400" />
            <span>70-74%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-400" />
            <span>&lt;70%</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-400" />
            <span>Upset Alert</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-lg font-bold text-green-400">
              {predictions.filter(p => p.confidence >= 80).length}
            </p>
            <p className="text-xs text-muted-foreground">High Confidence</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-lg font-bold text-yellow-400">
              {predictions.filter(p => p.is_upset_alert).length}
            </p>
            <p className="text-xs text-muted-foreground">Upset Alerts</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-lg font-bold text-primary">
              {Math.round(predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length || 0)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
