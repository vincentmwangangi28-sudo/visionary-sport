import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface UpsetPrediction {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  prediction: string;
  confidence: number;
  odds_value: number | null;
  match_date: string;
  reasoning: string;
}

export const UpsetAlerts = () => {
  const [upsets, setUpsets] = useState<UpsetPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpsets();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('upset-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predictions',
          filter: 'is_upset_alert=eq.true'
        },
        () => fetchUpsets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUpsets = async () => {
    try {
      const { data } = await supabase
        .from('predictions')
        .select('*')
        .eq('is_upset_alert', true)
        .gte('match_date', new Date().toISOString())
        .order('match_date', { ascending: true })
        .limit(5);

      setUpsets(data || []);
    } catch (error) {
      console.error("Error fetching upsets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            Upset Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-muted/50 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (upsets.length === 0) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Upset Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No upset alerts detected today. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-400">
          <AlertTriangle className="h-5 w-5 animate-pulse" />
          🔥 Upset Alerts
          <Badge className="ml-auto bg-yellow-500/20 text-yellow-400">
            <Bell className="h-3 w-3 mr-1" />
            {upsets.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upsets.map((upset) => (
          <div 
            key={upset.id}
            className="p-3 bg-background/50 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-foreground">
                  {upset.home_team} vs {upset.away_team}
                </p>
                <p className="text-xs text-muted-foreground">{upset.league}</p>
              </div>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                {upset.prediction}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {format(new Date(upset.match_date), 'MMM d, HH:mm')}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-green-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {upset.confidence}%
                </span>
                {upset.odds_value && (
                  <span className="text-primary font-bold">
                    @{upset.odds_value.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {upset.reasoning.replace('⚠️ UPSET ALERT:', '').trim()}
            </p>
          </div>
        ))}

        <p className="text-xs text-center text-muted-foreground pt-2">
          ⚠️ Upset predictions have higher potential returns but lower probability
        </p>
      </CardContent>
    </Card>
  );
};
