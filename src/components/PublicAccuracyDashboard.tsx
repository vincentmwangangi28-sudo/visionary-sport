import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlatformAccuracy } from '@/hooks/usePlatformAccuracy';
import { Target, TrendingUp, Shield, CheckCircle, Award, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const PublicAccuracyDashboard = () => {
  const { accuracyData, currentAccuracy, loading } = usePlatformAccuracy();

  if (loading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="flex items-center justify-center p-12">
          <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const accuracy = currentAccuracy?.accuracy_percent || 0;
  const total = currentAccuracy?.total_predictions || 0;
  const correct = currentAccuracy?.correct_predictions || 0;
  const leagueStats = currentAccuracy?.by_league || {};

  const topLeagues = Object.entries(leagueStats)
    .sort(([, a], [, b]) => (b as any).accuracy - (a as any).accuracy)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero Stats Card */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-green-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle>Public Accuracy Dashboard</CardTitle>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/10 text-green-500">
              <CheckCircle className="h-3 w-3" />
              Verified Stats
            </Badge>
          </div>
          <CardDescription>
            Transparent AI prediction performance - updated daily
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Main Accuracy */}
            <div className="md:col-span-2 text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent">
                {accuracy.toFixed(1)}%
              </div>
              <p className="text-muted-foreground mt-2">Overall Win Rate</p>
              <Progress value={accuracy} className="mt-4 h-3" />
            </div>

            {/* Total Predictions */}
            <div className="text-center p-6 bg-muted/30 rounded-xl">
              <div className="text-4xl font-bold text-primary">
                {total.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Predictions</p>
              <Target className="h-8 w-8 mx-auto mt-3 text-primary/50" />
            </div>

            {/* Correct Predictions */}
            <div className="text-center p-6 bg-muted/30 rounded-xl">
              <div className="text-4xl font-bold text-green-500">
                {correct.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Correct Predictions</p>
              <CheckCircle className="h-8 w-8 mx-auto mt-3 text-green-500/50" />
            </div>
          </div>

          {/* Top Leagues Performance */}
          {topLeagues.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Top Performing Leagues
              </h4>
              <div className="space-y-3">
                {topLeagues.map(([league, stats]: [string, any], index) => (
                  <div key={league} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <span className="font-medium">{league}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {stats.correct}/{stats.total}
                      </span>
                      <Badge 
                        variant={stats.accuracy >= 70 ? 'default' : 'secondary'}
                        className={stats.accuracy >= 70 ? 'bg-green-500' : ''}
                      >
                        {stats.accuracy.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground">Data-Driven</p>
            </div>
            <div className="text-center p-4 bg-green-500/5 rounded-lg">
              <Shield className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-xs text-muted-foreground">Transparent</p>
            </div>
            <div className="text-center p-4 bg-orange-500/5 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-xs text-muted-foreground">Real-Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 bg-muted/30 rounded-lg border text-center text-sm text-muted-foreground">
        <p>
          📊 All statistics are independently verified and updated automatically.
          Past performance does not guarantee future results. Bet responsibly. 18+
        </p>
      </div>
    </div>
  );
};
