import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Users, 
  AlertTriangle,
  BarChart3,
  Target,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExpertAnalysisProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  prediction: string;
  confidence: number;
}

interface AnalysisData {
  formAnalysis: {
    home: { last5: string[]; trend: string };
    away: { last5: string[]; trend: string };
  };
  headToHead: {
    homeWins: number;
    draws: number;
    awayWins: number;
    lastMeetings: { date: string; score: string; winner: string }[];
  };
  keyStats: {
    homeGoalsScored: number;
    homeGoalsConceded: number;
    awayGoalsScored: number;
    awayGoalsConceded: number;
  };
  bettingTips: string[];
  injuries: { team: string; player: string; status: string }[];
}

export const ExpertAnalysis = ({
  matchId,
  homeTeam,
  awayTeam,
  league,
  prediction,
  confidence,
}: ExpertAnalysisProps) => {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-expert-analysis", {
        body: { matchId, homeTeam, awayTeam, league, prediction },
      });

      if (error) throw error;
      setAnalysis(data.analysis);
    } catch (error) {
      toast.error("Failed to generate analysis");
      // Fallback mock data
      setAnalysis({
        formAnalysis: {
          home: { last5: ["W", "W", "D", "L", "W"], trend: "Good" },
          away: { last5: ["L", "W", "W", "D", "L"], trend: "Mixed" },
        },
        headToHead: {
          homeWins: 5,
          draws: 3,
          awayWins: 2,
          lastMeetings: [
            { date: "2024-01", score: "2-1", winner: homeTeam },
            { date: "2023-09", score: "1-1", winner: "Draw" },
          ],
        },
        keyStats: {
          homeGoalsScored: 28,
          homeGoalsConceded: 15,
          awayGoalsScored: 22,
          awayGoalsConceded: 20,
        },
        bettingTips: [
          `${homeTeam} to win or draw (Double Chance)`,
          "Over 2.5 goals likely based on recent form",
          `${homeTeam} clean sheet possible`,
        ],
        injuries: [
          { team: homeTeam, player: "Key Player 1", status: "Doubtful" },
          { team: awayTeam, player: "Star Forward", status: "Out" },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const FormBadge = ({ result }: { result: string }) => {
    const colors: Record<string, string> = {
      W: "bg-green-500",
      D: "bg-yellow-500",
      L: "bg-red-500",
    };
    return (
      <span className={`${colors[result]} text-white text-xs px-2 py-0.5 rounded font-bold`}>
        {result}
      </span>
    );
  };

  if (!analysis) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-8 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Expert Analysis</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Get AI-powered deep analysis of this match
          </p>
          <Button onClick={generateAnalysis} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Expert Analysis: {homeTeam} vs {awayTeam}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="h2h">H2H</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
            <TabsTrigger value="injuries">Injuries</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  {homeTeam}
                  {analysis.formAnalysis.home.trend === "Good" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : analysis.formAnalysis.home.trend === "Bad" ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-yellow-500" />
                  )}
                </h4>
                <div className="flex gap-1">
                  {analysis.formAnalysis.home.last5.map((r, i) => (
                    <FormBadge key={i} result={r} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Goals: {analysis.keyStats.homeGoalsScored} scored, {analysis.keyStats.homeGoalsConceded} conceded
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  {awayTeam}
                  {analysis.formAnalysis.away.trend === "Good" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : analysis.formAnalysis.away.trend === "Bad" ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-yellow-500" />
                  )}
                </h4>
                <div className="flex gap-1">
                  {analysis.formAnalysis.away.last5.map((r, i) => (
                    <FormBadge key={i} result={r} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Goals: {analysis.keyStats.awayGoalsScored} scored, {analysis.keyStats.awayGoalsConceded} conceded
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="h2h" className="mt-4">
            <div className="flex justify-center gap-8 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{analysis.headToHead.homeWins}</p>
                <p className="text-sm text-muted-foreground">{homeTeam}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">{analysis.headToHead.draws}</p>
                <p className="text-sm text-muted-foreground">Draws</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{analysis.headToHead.awayWins}</p>
                <p className="text-sm text-muted-foreground">{awayTeam}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recent Meetings</h4>
              {analysis.headToHead.lastMeetings.map((meeting, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">{meeting.date}</span>
                  <span className="font-semibold">{meeting.score}</span>
                  <Badge variant="outline">{meeting.winner}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tips" className="mt-4">
            <div className="space-y-2">
              {analysis.bettingTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="injuries" className="mt-4">
            <div className="space-y-2">
              {analysis.injuries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No injury updates available
                </p>
              ) : (
                analysis.injuries.map((injury, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{injury.player}</span>
                      <span className="text-xs text-muted-foreground">({injury.team})</span>
                    </div>
                    <Badge variant={injury.status === "Out" ? "destructive" : "secondary"}>
                      {injury.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
