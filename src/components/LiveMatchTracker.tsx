import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { useNavigate } from 'react-router-dom';
import { 
  Radio, 
  Clock, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  ChevronRight,
  Volume2,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

interface MatchEvent {
  minute: number;
  type: 'goal' | 'card' | 'substitution' | 'var';
  team: 'home' | 'away';
  description: string;
}

export const LiveMatchTracker = () => {
  const { matches, loading, source, refresh } = useLiveMatches();
  const navigate = useNavigate();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [prevScores, setPrevScores] = useState<Record<string, { home: number; away: number }>>({});

  // Track score changes for notifications
  useEffect(() => {
    matches.forEach(match => {
      const prev = prevScores[match.id];
      if (prev && match.homeScore !== null && match.awayScore !== null) {
        if (match.homeScore > prev.home) {
          toast.success(`⚽ GOAL! ${match.homeTeam} scores!`, {
            description: `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`
          });
        } else if (match.awayScore > prev.away) {
          toast.success(`⚽ GOAL! ${match.awayTeam} scores!`, {
            description: `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`
          });
        }
      }
    });

    const newScores: Record<string, { home: number; away: number }> = {};
    matches.forEach(match => {
      newScores[match.id] = {
        home: match.homeScore ?? 0,
        away: match.awayScore ?? 0
      };
    });
    setPrevScores(newScores);
  }, [matches]);

  const liveMatches = matches.filter(m => m.status !== 'Upcoming' && m.status !== 'Finished');
  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId) || liveMatches[0];

  // Mock match events for demo
  const mockEvents: MatchEvent[] = [
    { minute: 23, type: 'goal', team: 'home', description: 'Brilliant strike from outside the box!' },
    { minute: 34, type: 'card', team: 'away', description: 'Yellow card for tactical foul' },
    { minute: 45, type: 'goal', team: 'away', description: 'Header from corner kick' },
    { minute: 67, type: 'substitution', team: 'home', description: 'Fresh legs brought on' },
  ];

  const getMinuteProgress = (status: string) => {
    if (status.includes("'")) {
      const minute = parseInt(status.replace("'", ""));
      return Math.min((minute / 90) * 100, 100);
    }
    if (status === 'HT') return 50;
    if (status === 'FT') return 100;
    return 0;
  };

  if (loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardContent className="py-12 text-center">
          <Activity className="w-8 h-8 animate-pulse mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading live matches...</p>
        </CardContent>
      </Card>
    );
  }

  if (liveMatches.length === 0) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            Live Match Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Live Matches</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Check back when matches are being played for live tracking.
          </p>
          <Button onClick={refresh} variant="outline" size="sm">
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-destructive animate-pulse" />
            Live Match Tracker
            <Badge variant="destructive" className="ml-2 animate-pulse">
              {liveMatches.length} LIVE
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? 'text-primary' : 'text-muted-foreground'}
              aria-label={soundEnabled ? 'Disable sound notifications' : 'Enable sound notifications'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Match Selector */}
        {liveMatches.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {liveMatches.map(match => (
              <Button
                key={match.id}
                variant={selectedMatch?.id === match.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMatchId(match.id)}
                className="whitespace-nowrap"
              >
                {match.homeTeam.slice(0, 3)} vs {match.awayTeam.slice(0, 3)}
              </Button>
            ))}
          </div>
        )}

        {selectedMatch && (
          <>
            {/* Main Score Display */}
            <div className="relative p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">{selectedMatch.league}</Badge>
                <Badge variant="destructive" className="animate-pulse">
                  <div className="w-2 h-2 bg-destructive-foreground rounded-full mr-1" />
                  {selectedMatch.time || selectedMatch.status}
                </Badge>
              </div>

              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-1">{selectedMatch.homeTeam}</h3>
                  <span className="text-4xl font-black text-primary">
                    {selectedMatch.homeScore ?? 0}
                  </span>
                </div>
                <div className="text-2xl text-muted-foreground">:</div>
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-1">{selectedMatch.awayTeam}</h3>
                  <span className="text-4xl font-black text-primary">
                    {selectedMatch.awayScore ?? 0}
                  </span>
                </div>
              </div>

              {/* Match Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>0'</span>
                  <span>45' HT</span>
                  <span>90'</span>
                </div>
                <Progress value={getMinuteProgress(selectedMatch.time)} className="h-2" aria-label={`Match progress: ${selectedMatch.time}`} />
              </div>
            </div>

            {/* AI Prediction */}
            {selectedMatch.prediction && (
              <div className="p-4 bg-secondary/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔮</span>
                    <div>
                      <p className="text-sm text-muted-foreground">AI Prediction</p>
                      <p className="font-semibold text-primary">{selectedMatch.prediction}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{selectedMatch.confidence}%</p>
                    <p className="text-xs text-muted-foreground">confidence</p>
                  </div>
                </div>
              </div>
            )}

            {/* Match Events */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Match Events</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mockEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                      event.team === 'home' ? 'bg-primary/5' : 'bg-secondary/5'
                    }`}
                  >
                    <Badge variant="outline" className="w-12 justify-center">
                      {event.minute}'
                    </Badge>
                    <span className={event.type === 'goal' ? 'text-primary font-semibold' : ''}>
                      {event.type === 'goal' && '⚽ '}
                      {event.type === 'card' && '🟨 '}
                      {event.type === 'substitution' && '🔄 '}
                      {event.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* View Full Details */}
            <Button 
              onClick={() => navigate(`/match/${selectedMatch.id}`)}
              className="w-full"
              variant="outline"
            >
              View Full Match Details
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {source === 'demo' && (
          <p className="text-xs text-center text-muted-foreground">
            💡 Demo data shown. Live tracking updates every minute.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
