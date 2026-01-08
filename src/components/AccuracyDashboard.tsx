import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformAccuracy } from '@/hooks/usePlatformAccuracy';
import { Target, TrendingUp, Calendar, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function AccuracyDashboard() {
  const { accuracyData, currentAccuracy, loading } = usePlatformAccuracy();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            AI Accuracy Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [...accuracyData].reverse().map(item => ({
    date: item.date.slice(5), // MM-DD format
    accuracy: item.accuracy_percent,
    total: item.total_predictions,
  }));

  const leagueStats = currentAccuracy?.by_league || {};
  const sortedLeagues = Object.entries(leagueStats)
    .sort(([, a], [, b]) => b.accuracy - a.accuracy)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            AI Prediction Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {currentAccuracy?.accuracy_percent?.toFixed(1) || 0}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Current Accuracy</p>
            </div>

            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-4xl font-bold text-primary">
                {currentAccuracy?.total_predictions || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Predictions</p>
            </div>

            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-4xl font-bold text-green-500">
                {currentAccuracy?.correct_predictions || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Correct Predictions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accuracy Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Accuracy Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="hsl(var(--primary))"
                    fill="url(#accuracyGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By League Stats */}
      {sortedLeagues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Accuracy by League
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedLeagues.map(([league, stats], index) => (
                <div key={league} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{league}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {stats.correct}/{stats.total}
                    </span>
                    <span className="font-bold text-primary">
                      {stats.accuracy.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
