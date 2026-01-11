import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { TrendingUp, Activity } from "lucide-react";

interface FormData {
  match: string;
  homePoints: number;
  awayPoints: number;
  homeGoals: number;
  awayGoals: number;
}

interface FormAnalysisChartProps {
  homeTeam: string;
  awayTeam: string;
  data?: FormData[];
}

export const FormAnalysisChart = ({ homeTeam, awayTeam, data }: FormAnalysisChartProps) => {
  // Generate mock data if not provided
  const chartData = data || [
    { match: "Match 1", homePoints: 3, awayPoints: 0, homeGoals: 2, awayGoals: 0 },
    { match: "Match 2", homePoints: 1, awayPoints: 1, homeGoals: 1, awayGoals: 2 },
    { match: "Match 3", homePoints: 3, awayPoints: 3, homeGoals: 3, awayGoals: 1 },
    { match: "Match 4", homePoints: 0, awayPoints: 1, homeGoals: 0, awayGoals: 0 },
    { match: "Match 5", homePoints: 3, awayPoints: 3, homeGoals: 2, awayGoals: 2 },
  ];

  // Calculate cumulative points
  let homeCumulative = 0;
  let awayCumulative = 0;
  const cumulativeData = chartData.map(d => {
    homeCumulative += d.homePoints;
    awayCumulative += d.awayPoints;
    return {
      ...d,
      homeCumulative,
      awayCumulative,
    };
  });

  // Calculate form summary
  const homeTotal = chartData.reduce((sum, d) => sum + d.homePoints, 0);
  const awayTotal = chartData.reduce((sum, d) => sum + d.awayPoints, 0);
  const homeGoals = chartData.reduce((sum, d) => sum + d.homeGoals, 0);
  const awayGoals = chartData.reduce((sum, d) => sum + d.awayGoals, 0);

  const getFormRating = (points: number) => {
    if (points >= 12) return { label: "Excellent", color: "bg-green-500" };
    if (points >= 9) return { label: "Good", color: "bg-blue-500" };
    if (points >= 6) return { label: "Average", color: "bg-yellow-500" };
    return { label: "Poor", color: "bg-red-500" };
  };

  const homeForm = getFormRating(homeTotal);
  const awayForm = getFormRating(awayTotal);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Form Analysis (Last 5 Matches)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{homeTeam}</span>
              <span className={`${homeForm.color} text-white text-xs px-2 py-0.5 rounded`}>
                {homeForm.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Points</p>
                <p className="font-bold text-lg">{homeTotal}/15</p>
              </div>
              <div>
                <p className="text-muted-foreground">Goals</p>
                <p className="font-bold text-lg">{homeGoals}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{awayTeam}</span>
              <span className={`${awayForm.color} text-white text-xs px-2 py-0.5 rounded`}>
                {awayForm.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Points</p>
                <p className="font-bold text-lg">{awayTotal}/15</p>
              </div>
              <div>
                <p className="text-muted-foreground">Goals</p>
                <p className="font-bold text-lg">{awayGoals}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Points Trend Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Points Trend
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="match" 
                tick={{ fontSize: 12 }} 
                className="fill-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="homeCumulative" 
                name={homeTeam}
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
              <Line 
                type="monotone" 
                dataKey="awayCumulative" 
                name={awayTeam}
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--destructive))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Goals Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Goals per Match</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="match" 
                tick={{ fontSize: 12 }} 
                className="fill-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Bar 
                dataKey="homeGoals" 
                name={homeTeam} 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="awayGoals" 
                name={awayTeam} 
                fill="hsl(var(--destructive))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
