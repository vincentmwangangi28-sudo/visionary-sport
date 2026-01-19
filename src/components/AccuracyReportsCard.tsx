import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Trophy, Target, Loader2 } from 'lucide-react';
import { useAccuracyReports } from '@/hooks/useAccuracyReports';

export const AccuracyReportsCard = () => {
  const { latestReport, loading } = useAccuracyReports();

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!latestReport) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Accuracy Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No reports available yet</p>
        </CardContent>
      </Card>
    );
  }

  const accuracyPercent = Number(latestReport.accuracy_percent) || 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Weekly Accuracy Report
        </CardTitle>
        <CardDescription>
          Performance analysis for the past week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Accuracy */}
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <div className="text-4xl font-bold text-primary mb-1">
            {accuracyPercent.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {latestReport.correct_predictions} / {latestReport.total_predictions} correct
          </div>
          <Progress value={accuracyPercent} className="mt-3" />
        </div>

        {/* Confidence Range Performance */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            By Confidence Level
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(latestReport.by_confidence_range || {}).map(([range, stats]) => (
              <div key={range} className="p-2 bg-muted/50 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">{range}%</div>
                <div className="font-semibold text-sm">
                  {stats.accuracy}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.correct}/{stats.total}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Leagues */}
        {latestReport.top_performing_leagues?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top Performing Leagues
            </h4>
            <div className="flex flex-wrap gap-2">
              {latestReport.top_performing_leagues.slice(0, 5).map((league, i) => (
                <Badge 
                  key={league} 
                  variant={i === 0 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {i === 0 && '🥇'} {league}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sport Breakdown */}
        {Object.keys(latestReport.by_sport || {}).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              By Sport
            </h4>
            <div className="space-y-2">
              {Object.entries(latestReport.by_sport).map(([sport, stats]) => (
                <div key={sport} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="capitalize text-sm">{sport}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stats.accuracy}%</span>
                    <span className="text-xs text-muted-foreground">
                      ({stats.correct}/{stats.total})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
