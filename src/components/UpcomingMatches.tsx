import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpcomingMatches } from "@/hooks/useUpcomingMatches";
import { RefreshCw, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const UpcomingMatches = () => {
  const { matches, loading, source, lastUpdated, refresh } = useUpcomingMatches();
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold mb-2 gradient-text">Upcoming Matches</h2>
              <p className="text-muted-foreground">AI-powered predictions for scheduled fixtures</p>
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
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-6 h-6 text-primary" />
                <h2 className="text-4xl font-bold gradient-text">Upcoming Matches</h2>
              </div>
              <p className="text-muted-foreground">
                {source === 'demo' ? 'Demo data - showing sample upcoming fixtures' : 'AI-powered predictions for scheduled fixtures'}
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
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Upcoming Matches</h3>
            <p className="text-muted-foreground">
              There are no scheduled matches at the moment. Check back later!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Card 
                key={match.id} 
                className="p-6 hover-lift transition-all duration-300 bg-gradient-prediction border-primary/10 relative overflow-hidden"
              >
                {/* League & Date */}
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-xs">
                    {match.league}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm font-bold text-primary">
                    <Calendar className="w-3 h-3" />
                    {formatDate(match.date)}
                  </div>
                </div>

                {/* Teams Display */}
                <div className="mb-4">
                  <div className="text-center space-y-2 mb-3">
                    <h3 className="text-lg font-bold">{match.homeTeam}</h3>
                    <div className="text-muted-foreground text-sm font-semibold">vs</div>
                    <h3 className="text-lg font-bold">{match.awayTeam}</h3>
                  </div>
                  
                  {/* Match Time */}
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-3">
                    <Clock className="w-4 h-4" />
                    <span>{match.time}</span>
                  </div>
                </div>

                {/* AI Prediction */}
                {match.prediction && match.confidence && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl">🔮</span>
                      <span className="text-sm font-semibold text-foreground">AI Prediction</span>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-primary mb-1">
                        {match.prediction}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 max-w-[120px] h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500"
                            style={{ width: `${match.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {match.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {source === 'demo' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              💡 Showing demo data. Connect to live API for real upcoming fixtures.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
