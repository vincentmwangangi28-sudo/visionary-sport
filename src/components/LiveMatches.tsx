import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveMatches } from "@/hooks/useLiveMatches";
import { RefreshCw, Radio, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const LiveMatches = () => {
  const { matches, loading, source, lastUpdated, refresh } = useLiveMatches();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold mb-2 gradient-text">Live Matches</h2>
              <p className="text-muted-foreground">Real-time football scores</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-8 w-32 mb-4" />
                <Skeleton className="h-16 w-full mb-4" />
                <Skeleton className="h-4 w-24" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-6 h-6 text-primary animate-pulse" />
                <h2 className="text-4xl font-bold gradient-text">Live Matches</h2>
              </div>
              <p className="text-muted-foreground">
                {source === 'demo' ? 'Demo data - showing sample matches' : 'Real-time football scores'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Updated {formatTime(lastUpdated)}</span>
              </div>
            )}
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {matches.length === 0 ? (
          <Card className="p-12 text-center">
            <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Live Matches</h3>
            <p className="text-muted-foreground">
              There are no matches being played right now. Check back later!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Card 
                key={match.id} 
                className="p-6 hover-lift transition-all duration-300 bg-gradient-prediction border-primary/10 relative overflow-hidden"
              >
                {/* Live indicator */}
                <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground px-3 py-1 text-xs font-bold flex items-center gap-1 rounded-bl-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>

                {/* League & Time */}
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-xs">
                    {match.league}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm font-bold text-primary">
                    <Clock className="w-3 h-3" />
                    {match.time}
                  </div>
                </div>

                {/* Score Display */}
                <div className="mb-4">
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-3">
                    <div className="text-right">
                      <h3 className="text-lg font-bold truncate">{match.homeTeam}</h3>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-secondary/20 rounded-lg">
                      <span className="text-2xl font-bold text-primary">
                        {match.homeScore ?? '-'}
                      </span>
                      <span className="text-muted-foreground">:</span>
                      <span className="text-2xl font-bold text-primary">
                        {match.awayScore ?? '-'}
                      </span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold truncate">{match.awayTeam}</h3>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    {match.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {source === 'demo' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              💡 Showing demo data. Connect a live sports API for real-time updates.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
