import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, RefreshCw, Clock, ChevronDown, ChevronUp, Zap, Radio, CheckCircle2, Trophy, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useFootballData, ApiFootballLiveFixture } from '@/hooks/useFootballData';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import { TeamLogo } from '@/components/TeamLogo';
import { NotifyMeButton } from '@/components/NotifyMeButton';
import { Link } from 'react-router-dom';

export default function LiveScores() {
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const { 
    liveFixtures: matches, 
    isLiveLoading: loading, 
    isLiveFetching, 
    refetchLive: refresh,
    isServiceUnavailable,
    serviceUnavailableMessage,
    hasAuthError,
    authErrorStatus,
  } = useFootballData({ 
    leagueId: selectedLeague === 'all' ? undefined : selectedLeague,
    livePollInterval: 15_000 
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    setLastSyncTime(new Date());
  }, [matches]);

  const filteredMatches = selectedLeague === 'all'
    ? matches
    : matches.filter(m => 
        m.league.toLowerCase().includes(selectedLeague.toLowerCase()) || 
        String(m.league_id) === selectedLeague
      );

  const live = filteredMatches.filter(m => m.status === 'live' || m.status === 'halftime');
  const upcoming = filteredMatches.filter(m => m.status === 'upcoming');
  const finished = filteredMatches.filter(m => m.status === 'finished');

  const statusBadge = (m: ApiFootballLiveFixture) => {
    if (m.status === 'live') {
      return (
        <span className="px-2.5 py-0.5 bg-red-600 text-white text-xs rounded-full font-bold animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          {m.minute ? `${m.minute}'` : 'LIVE'}
        </span>
      );
    }
    if (m.status === 'halftime') {
      return <span className="px-2 py-0.5 bg-amber-600 text-white text-xs rounded-full font-bold">HT</span>;
    }
    if (m.status === 'finished') {
      return <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full font-medium">FT</span>;
    }
    return (
      <span className="px-2.5 py-0.5 bg-blue-600/90 text-white text-xs rounded-full font-medium">
        {new Date(m.match_date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  };

  const MatchCard = ({ m }: { m: ApiFootballLiveFixture }) => (
    <Card className={`${m.status === 'live' ? 'border-red-500/40 bg-red-500/5 shadow-md shadow-red-500/5' : 'hover:border-primary/30'} transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-semibold">{m.league}</Badge>
            {statusBadge(m)}
            {m.is_realtime && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
                Live Feed
              </Badge>
            )}
            {m.venue && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                📍 {m.venue}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {m.status !== 'finished' && (
              <NotifyMeButton
                match={{
                  id: String(m.id),
                  home_team: m.home_team,
                  away_team: m.away_team,
                  league: m.league,
                  match_date: m.match_date,
                  prediction: m.prediction,
                  confidence: m.confidence,
                  home_odds: m.home_odds,
                  draw_odds: m.draw_odds,
                  away_odds: m.away_odds,
                }}
                variant="icon"
              />
            )}
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              aria-label={expandedId === m.id ? `Hide match events for ${m.home_team} vs ${m.away_team}` : `Show match events for ${m.home_team} vs ${m.away_team}`}
              aria-expanded={expandedId === m.id}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {expandedId === m.id ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 my-1">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <TeamLogo team={m.home_team} logoUrl={m.home_logo} size="sm" />
            <p className={`font-bold text-sm sm:text-base truncate ${m.home_score != null && m.away_score != null && m.home_score > m.away_score ? 'text-primary' : ''}`}>
              {m.home_team}
            </p>
          </div>

          <div className="text-center px-3 py-1 rounded bg-muted/40 min-w-[70px]">
            {m.home_score != null && m.away_score != null ? (
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
                {m.home_score} – {m.away_score}
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">VS</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
            <p className={`font-bold text-sm sm:text-base truncate ${m.home_score != null && m.away_score != null && m.away_score > m.home_score ? 'text-primary' : ''}`}>
              {m.away_team}
            </p>
            <TeamLogo team={m.away_team} logoUrl={m.away_logo} size="sm" />
          </div>
        </div>

        {expandedId === m.id && (
          <div className="mt-3 pt-3 border-t space-y-2 text-xs sm:text-sm">
            {m.prediction && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">AI Prediction:</span>
                  <Badge className="bg-primary/10 text-primary border-primary/20">{m.prediction}</Badge>
                </div>
                {m.confidence && (
                  <span className="text-primary font-bold">{m.confidence}% Confidence</span>
                )}
              </div>
            )}
            {m.home_odds && (
              <div className="flex items-center justify-between text-muted-foreground pt-1">
                <span>Live Odds:</span>
                <span className="space-x-3">
                  <span>1: <b className="text-foreground">{m.home_odds.toFixed(2)}</b></span>
                  {m.draw_odds && <span>X: <b className="text-foreground">{m.draw_odds.toFixed(2)}</b></span>}
                  {m.away_odds && <span>2: <b className="text-foreground">{m.away_odds.toFixed(2)}</b></span>}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Live Football Scores Today | Real-Time Updates | PredictPro"
        description="Live football scores updating in real time with API-Football data feeds. Follow live matches, goal alerts, in-play statistics and instant AI predictions."
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-red-500" />
              Live Football Center
            </h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Real-time API-Football feed active · Auto-refreshes every 15s · {isLiveFetching ? 'Fetching updates...' : `Synced ${lastSyncTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/standings">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Standings</span>
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refresh()} 
              disabled={loading || isLiveFetching} 
              className="gap-1.5 text-xs"
              aria-label="Sync live match data now"
            >
              <RefreshCw className={`h-4 w-4 ${loading || isLiveFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Sync Now</span>
            </Button>
          </div>
        </div>

        {/* Real-time Status Card or Service Unavailable Banner */}
        {isServiceUnavailable ? (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">Service Temporarily Unavailable</h3>
                  {authErrorStatus && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px]">
                      HTTP {authErrorStatus}
                    </Badge>
                  )}
                </div>
                <p className="text-xs mt-1 text-muted-foreground">
                  {serviceUnavailableMessage}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => refresh()} 
                    disabled={isLiveFetching}
                    className="h-7 text-xs gap-1.5"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLiveFetching ? 'animate-spin' : ''}`} />
                    Retry Connection
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <RealtimeIndicator
              isConnected={true}
              lastUpdate={lastSyncTime}
              updateCount={filteredMatches.length}
              sourceName="API-Football & Global Matchday Feed"
              onRefresh={() => refresh()}
            />
          </div>
        )}

        {/* League Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          <Button
            size="sm"
            variant={selectedLeague === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedLeague('all')}
            className="text-xs h-8 flex-shrink-0"
          >
            All Competitions ({matches.length})
          </Button>
          {[
            { id: '39', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
            { id: '140', name: 'La Liga', flag: '🇪🇸' },
            { id: '135', name: 'Serie A', flag: '🇮🇹' },
            { id: '78', name: 'Bundesliga', flag: '🇩🇪' },
            { id: '61', name: 'Ligue 1', flag: '🇫🇷' },
            { id: '2', name: 'Champions League', flag: '🏆' },
          ].map(lg => (
            <Button
              key={lg.id}
              size="sm"
              variant={selectedLeague === lg.id || selectedLeague === lg.name ? 'default' : 'outline'}
              onClick={() => setSelectedLeague(selectedLeague === lg.id ? 'all' : lg.id)}
              className="text-xs h-8 gap-1.5 flex-shrink-0"
            >
              <span>{lg.flag}</span>
              <span>{lg.name}</span>
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {live.length > 0 && (
              <div>
                <h2 className="font-bold text-sm uppercase tracking-wider text-red-500 flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  Live In-Play Matches ({live.length})
                </h2>
                <div className="space-y-3">
                  {live.map(m => (
                    <MatchCard key={m.id} m={m} />
                  ))}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <h2 className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
                  <Radio className="h-4 w-4 text-primary" />
                  Scheduled Matches Today ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map(m => (
                    <MatchCard key={m.id} m={m} />
                  ))}
                </div>
              </div>
            )}

            {finished.length > 0 && (
              <div>
                <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed Match Results ({finished.length})
                </h2>
                <div className="space-y-3">
                  {finished.map(m => (
                    <MatchCard key={m.id} m={m} />
                  ))}
                </div>
              </div>
            )}

            {filteredMatches.length === 0 && !isServiceUnavailable && (
              <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed p-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-75" />
                <p className="text-muted-foreground font-semibold text-lg">No matches found for selected competition</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto mb-4">
                  API-Football real-time data connection is active. Upcoming fixtures for the matchday will populate automatically.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setSelectedLeague('all')} className="text-xs">
                    View All Competitions
                  </Button>
                  <Link to="/best-bets">
                    <Button variant="default" className="gap-2 text-xs">
                      <Zap className="h-4 w-4" />
                      View AI Best Bets
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {filteredMatches.length === 0 && isServiceUnavailable && (
              <div className="text-center py-16 bg-muted/20 rounded-2xl border border-amber-500/20 p-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4 opacity-80" />
                <h3 className="font-semibold text-lg text-foreground">Service Temporarily Unavailable</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto mb-5">
                  {serviceUnavailableMessage}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => refresh()} className="gap-2 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry Live Feed
                  </Button>
                  <Link to="/best-bets">
                    <Button variant="default" className="gap-2 text-xs">
                      <Zap className="h-4 w-4" />
                      View AI Best Bets
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


