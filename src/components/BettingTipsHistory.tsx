import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  Trophy,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface PredictionHistory {
  id: string;
  match_id: string;
  home_team: string;
  away_team: string;
  prediction: string;
  confidence: number;
  match_date: string;
  is_correct: boolean | null;
  actual_result: string | null;
  competition: string | null;
}

export const BettingTipsHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, wins: 0, losses: 0, pending: 0, winRate: 0 });

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("predictions_history")
          .select("*")
          .eq("user_id", user.id)
          .order("match_date", { ascending: false })
          .limit(50);

        if (error) throw error;
        
        setHistory(data || []);
        
        // Calculate stats
        const wins = data?.filter(p => p.is_correct === true).length || 0;
        const losses = data?.filter(p => p.is_correct === false).length || 0;
        const pending = data?.filter(p => p.is_correct === null).length || 0;
        const total = data?.length || 0;
        const winRate = total - pending > 0 ? Math.round((wins / (total - pending)) * 100) : 0;
        
        setStats({ total, wins, losses, pending, winRate });
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-8 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Betting Tips History</h3>
          <p className="text-muted-foreground text-sm">
            Login to track your prediction history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Betting Tips History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg">
            <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
            <p className="text-xs text-muted-foreground">Losses</p>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold text-primary">{stats.winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="wins">Wins</TabsTrigger>
            <TabsTrigger value="losses">Losses</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <HistoryList history={history} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="wins">
            <HistoryList 
              history={history.filter(h => h.is_correct === true)} 
              isLoading={isLoading} 
            />
          </TabsContent>
          <TabsContent value="losses">
            <HistoryList 
              history={history.filter(h => h.is_correct === false)} 
              isLoading={isLoading} 
            />
          </TabsContent>
          <TabsContent value="pending">
            <HistoryList 
              history={history.filter(h => h.is_correct === null)} 
              isLoading={isLoading} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const HistoryList = ({ 
  history, 
  isLoading 
}: { 
  history: PredictionHistory[]; 
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        No predictions found
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] mt-4">
      <div className="space-y-2">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {item.is_correct === true ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : item.is_correct === false ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-500" />
                )}
                <span className="font-medium text-sm">
                  {item.home_team} vs {item.away_team}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{item.competition}</span>
                <span>•</span>
                <span>{format(new Date(item.match_date), "MMM d, yyyy")}</span>
              </div>
            </div>
            <div className="text-right">
              <Badge 
                variant={
                  item.is_correct === true 
                    ? "default" 
                    : item.is_correct === false 
                    ? "destructive" 
                    : "secondary"
                }
              >
                {item.prediction}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {item.confidence}% confidence
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
