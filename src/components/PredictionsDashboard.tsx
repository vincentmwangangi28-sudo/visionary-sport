import { useState, useMemo, useEffect } from "react";
import { RealtimeIndicator } from "./RealtimeIndicator";
import { PredictionCard } from "./PredictionCard";
import { usePredictions } from "@/hooks/usePredictions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Zap, RefreshCw, Filter, TrendingUp, Target, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InContentAd, SidebarAd } from "./AdBanner";

export const PredictionsDashboard = () => {
  const { 
    predictions, 
    loading, 
    refreshPredictions, 
    realtimeConnected,
    updateCount 
  } = usePredictions();
  const [generating, setGenerating] = useState(false);
  const [filterLeague, setFilterLeague] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "confidence">("date");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Track when predictions update
  useEffect(() => {
    if (predictions.length > 0) {
      setLastUpdate(new Date());
    }
  }, [predictions.length, updateCount]);

  // Generate daily predictions
  const handleGeneratePredictions = async () => {
    setGenerating(true);
    try {
      toast.info("🤖 Generating AI predictions...", {
        description: "This may take a minute. Fetching matches and analyzing data.",
      });

      const { data, error } = await supabase.functions.invoke('generate-daily-predictions');

      if (error) throw error;

      if (data.success) {
        toast.success(`✅ Generated ${data.predictionsGenerated} predictions!`, {
          description: `Analyzed ${data.totalMatches} upcoming matches`,
        });
        await refreshPredictions();
      } else {
        toast.warning("⚠️ No matches found", {
          description: "No upcoming matches available for prediction generation",
        });
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
      toast.error("Failed to generate predictions", {
        description: "Please try again later",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Get unique leagues
  const leagues = useMemo(() => {
    const uniqueLeagues = new Set(predictions.map(p => p.league));
    return Array.from(uniqueLeagues);
  }, [predictions]);

  // Calculate accuracy stats
  const stats = useMemo(() => {
    const totalPredictions = predictions.length;
    // Filter only predictions that have results
    const settledPredictions = predictions.filter(p => p.result !== null);
    const correctPredictions = settledPredictions.filter(p => p.result === 'correct').length;
    const avgConfidence = predictions.length > 0 
      ? Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length)
      : 0;
    const accuracy = settledPredictions.length > 0 
      ? Math.round((correctPredictions / settledPredictions.length) * 100)
      : 0;

    return { totalPredictions, correctPredictions, avgConfidence, accuracy };
  }, [predictions]);

  // Filter and sort predictions
  const filteredPredictions = useMemo(() => {
    let filtered = predictions;

    // Filter by league
    if (filterLeague !== "all") {
      filtered = filtered.filter(p => p.league === filterLeague);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "confidence") {
        return b.confidence - a.confidence;
      }
      return new Date(b.match_date).getTime() - new Date(a.match_date).getTime();
    });

    return filtered;
  }, [predictions, filterLeague, sortBy]);

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
          </div>
          <div className="max-w-5xl mx-auto space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-primary animate-pulse-glow" />
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Predictions Dashboard
            </h2>
            <Zap className="h-8 w-8 text-primary animate-pulse-glow" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time AI predictions powered by advanced machine learning
          </p>
        </div>

        {/* Realtime Status Indicator */}
        <div className="max-w-5xl mx-auto mb-8">
          <RealtimeIndicator 
            isConnected={realtimeConnected}
            lastUpdate={lastUpdate}
            updateCount={updateCount}
          />
        </div>

        {/* Stats Cards */}
        <div className="max-w-5xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Predictions</p>
                <p className="text-2xl font-bold">{stats.totalPredictions}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">{stats.accuracy}%</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{stats.avgConfidence}%</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-2xl font-bold">{stats.correctPredictions}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="max-w-5xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleGeneratePredictions}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Daily Predictions
                </>
              )}
            </Button>

            <Button
              onClick={() => refreshPredictions()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterLeague} onValueChange={setFilterLeague}>
                <SelectTrigger className="w-[180px]" aria-label="Filter by league">
                  <SelectValue placeholder="Filter by league" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  {leagues.map((league) => (
                    <SelectItem key={league} value={league}>
                      {league}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "confidence")}>
              <SelectTrigger className="w-[180px]" aria-label="Sort predictions">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="confidence">Sort by Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Predictions List */}
        {filteredPredictions.length === 0 ? (
          <div className="max-w-5xl mx-auto text-center py-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              {filterLeague !== "all" 
                ? "No predictions found for this league" 
                : "No predictions available yet"}
            </p>
            <Button onClick={handleGeneratePredictions} disabled={generating} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Predictions Now
            </Button>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto flex gap-6">
            {/* Main predictions content */}
            <div className="flex-1 space-y-6">
              {filteredPredictions.map((prediction, index) => (
                <div key={prediction.id}>
                  <div
                    className="animate-slide-up hover-lift transition-all duration-500"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <PredictionCard
                      homeTeam={prediction.home_team}
                      awayTeam={prediction.away_team}
                      league={prediction.league}
                      prediction={prediction.prediction}
                      confidence={prediction.confidence}
                      reasoning={prediction.reasoning}
                      matchDate={new Date(prediction.match_date).toLocaleDateString()}
                      matchTime={new Date(prediction.match_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    />
                  </div>
                  {/* Insert ad after every 3rd prediction */}
                  {(index + 1) % 3 === 0 && index < filteredPredictions.length - 1 && (
                    <InContentAd className="mt-6" />
                  )}
                </div>
              ))}
            </div>
            
            {/* Sidebar Ad - Hidden on mobile */}
            <aside className="hidden lg:block w-[300px] shrink-0">
              <SidebarAd />
            </aside>
          </div>
        )}

        {/* Info Banner */}
        {filteredPredictions.length > 0 && (
          <div className="max-w-6xl mx-auto mt-8">
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{filteredPredictions.length} predictions</Badge>
                  <span>•</span>
                  <span>Updated in real-time</span>
                  <span>•</span>
                  <span>Powered by AI</span>
                </div>
                <Badge variant="secondary">
                  {filterLeague !== "all" ? filterLeague : "All Leagues"}
                </Badge>
              </div>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};
