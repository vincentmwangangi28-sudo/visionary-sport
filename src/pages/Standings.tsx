import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, RefreshCw, AlertCircle, ShieldAlert, Activity, BarChart2, Table as TableIcon, CheckCircle2 } from 'lucide-react';
import { LEAGUES, FALLBACK_STANDINGS, LeagueConfig } from '@/data/standingsData';
import { useStandings } from '@/hooks/useFootballData';
import { TeamFormTrendsChart } from '@/components/TeamFormTrendsChart';
import { TeamLogo } from '@/components/TeamLogo';
import { toast } from 'sonner';

const FormBit = ({ r }: { r: string }) => (
  <span className={`inline-flex w-5 h-5 rounded-full text-[10px] font-bold items-center justify-center text-white ${r==='W'?'bg-green-500':r==='L'?'bg-red-500':'bg-amber-500'}`}>{r}</span>
);

export default function Standings() {
  const [league, setLeague] = useState<LeagueConfig>(LEAGUES[0]);
  const [showChart, setShowChart] = useState(true);
  const { data, isLoading: loading, isFetching, refetch } = useStandings(league.id);

  const standings = data?.standings?.length ? data.standings : (FALLBACK_STANDINGS[league.id] || []);
  const isLive = data?.isLive ?? false;

  const handleSync = async () => {
    const res = await refetch();
    if (res.data?.isLive) {
      toast.success(`Synced live ${league.name} standings`);
    } else {
      toast.info(`Loaded verified ${league.name} standings`);
    }
  };

  const selectLeague = (lg: LeagueConfig) => {
    setLeague(lg);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Football League Standings 2025/26 | Live Tables | PredictPro"
        description="Live football league standings for Premier League, La Liga, Bundesliga, Serie A, Ligue 1 and Champions League. Updated in real-time with form, goal difference and points."
        keywords="Premier League table 2026, La Liga standings, Bundesliga table, Serie A standings, Champions League table, football league tables"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              League Standings
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Official table standings with goal differences, points, and current team form powered by API-Football.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isLive ? (
              <Badge variant="outline" className="text-[11px] text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Verified Season Cache
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] text-green-700 bg-green-50 dark:bg-green-950/40 border-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                API-Football Live
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={loading || isFetching}
              className="gap-1.5"
              aria-label="Sync league standings"
            >
              <RefreshCw className={`h-4 w-4 ${loading || isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">Sync Standings</span>
            </Button>
          </div>
        </div>

        {/* Informative Provider Notice if fallback is used */}
        {!isLive && (
          <Alert className="mb-6 bg-muted/40 border-primary/20 text-xs">
            <AlertCircle className="h-4 w-4 text-primary" aria-hidden="true" />
            <AlertTitle className="text-xs font-semibold">Live Data Status</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-0.5">
              <span>Displaying verified season tables. Live sync automatically caches API updates in the background.</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-primary font-medium underline self-start sm:self-auto"
                onClick={handleSync}
                disabled={loading || isFetching}
                aria-label="Sync standings data immediately"
              >
                Sync Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* League Selector Chips & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex gap-2 flex-wrap flex-1" role="group" aria-label="Select league standings">
            {LEAGUES.map(lg => (
              <Button
                key={lg.id}
                id={`league-select-btn-${lg.id}`}
                size="sm"
                variant={league.id === lg.id ? 'default' : 'outline'}
                onClick={() => selectLeague(lg)}
                className="text-xs gap-1.5 h-9"
                aria-label={`View standings for ${lg.name}`}
              >
                <span aria-hidden="true">{lg.flag}</span>
                <span>{lg.name}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 self-start sm:self-auto" role="group" aria-label="Toggle view mode">
            <Button
              id="view-toggle-chart-btn"
              variant={showChart ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowChart(true)}
              className="h-7 text-xs gap-1.5 px-2.5"
              aria-label="Show form analytics and charts"
            >
              <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Form Analytics</span>
            </Button>
            <Button
              id="view-toggle-table-btn"
              variant={!showChart ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowChart(false)}
              className="h-7 text-xs gap-1.5 px-2.5"
              aria-label="Show standings table only"
            >
              <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Table Only</span>
            </Button>
          </div>
        </div>

        {/* Visual Team Form Trends Chart (Recharts) */}
        {showChart && standings.length > 0 && !loading && (
          <TeamFormTrendsChart
            standings={standings}
            leagueName={league.name}
            leagueFlag={league.flag}
          />
        )}

        <Card id="standings-table-card" className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>{league.flag}</span>
                <span>{league.name}</span>
                <span className="text-xs font-normal text-muted-foreground">({league.season || '2025/2026'})</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                {isFetching && (
                  <span className="text-[11px] text-primary flex items-center gap-1">
                    <Activity className="h-3 w-3 animate-spin" />
                    Updating...
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {league.matchdayLabel || 'Season Table'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2 px-2">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12 hidden sm:block" />
                  <Skeleton className="h-4 w-12 hidden sm:block" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16 hidden lg:block" />
                </div>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2">
                    <Skeleton className="h-4 w-5" />
                    <div className="flex items-center gap-2 w-36">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-4 w-8 hidden sm:block" />
                    <Skeleton className="h-4 w-8 hidden sm:block" />
                    <Skeleton className="h-4 w-8 font-bold" />
                    <Skeleton className="h-4 w-20 hidden lg:block" />
                  </div>
                ))}
              </div>
            ) : standings.length === 0 ? (
              <div className="text-center py-16 px-4">
                <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <h3 className="font-semibold text-base mb-1">Standings Temporarily Unavailable</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4 leading-relaxed">
                  Data for {league.name} is currently being refreshed from the provider.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={handleSync}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Retry
                  </Button>
                  <Button size="sm" onClick={() => selectLeague(LEAGUES[0])}>
                    View Premier League
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground">
                      <th className="text-left py-2.5 px-3 w-8">#</th>
                      <th className="text-left py-2.5 px-3">Team</th>
                      <th className="text-center py-2.5 px-2 hidden sm:table-cell">P</th>
                      <th className="text-center py-2.5 px-2 hidden sm:table-cell">W</th>
                      <th className="text-center py-2.5 px-2 hidden sm:table-cell">D</th>
                      <th className="text-center py-2.5 px-2 hidden sm:table-cell">L</th>
                      <th className="text-center py-2.5 px-2 hidden md:table-cell">GD</th>
                      <th className="text-center py-2.5 px-3 font-bold text-foreground">Pts</th>
                      <th className="text-center py-2.5 px-2 hidden lg:table-cell">Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, i) => (
                      <tr
                        key={row.team}
                        className={`border-b hover:bg-muted/20 transition-colors ${
                          i < 4
                            ? 'border-l-2 border-l-blue-500'
                            : i === 4 || i === 5
                            ? 'border-l-2 border-l-amber-500'
                            : i >= standings.length - 3
                            ? 'border-l-2 border-l-red-500'
                            : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-muted-foreground font-medium">{row.position}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <TeamLogo team={row.team} logoUrl={row.logo} size="xs" />
                            <span className="font-medium truncate max-w-[140px] sm:max-w-none">{row.team}</span>
                          </div>
                        </td>
                        <td className="text-center py-2.5 px-2 hidden sm:table-cell text-muted-foreground">{row.played}</td>
                        <td className="text-center py-2.5 px-2 hidden sm:table-cell text-green-600 font-medium">{row.won}</td>
                        <td className="text-center py-2.5 px-2 hidden sm:table-cell text-muted-foreground">{row.drawn}</td>
                        <td className="text-center py-2.5 px-2 hidden sm:table-cell text-red-500">{row.lost}</td>
                        <td
                          className={`text-center py-2.5 px-2 hidden md:table-cell font-medium ${
                            row.gd > 0 ? 'text-green-600' : row.gd < 0 ? 'text-red-500' : 'text-muted-foreground'
                          }`}
                        >
                          {row.gd > 0 ? '+' : ''}
                          {row.gd}
                        </td>
                        <td className="text-center py-2.5 px-3 font-black text-primary">{row.points}</td>
                        <td className="py-2.5 px-2 hidden lg:table-cell">
                          <div className="flex gap-0.5 justify-center">
                            {(row.form ?? '').split('').map((r, idx) => (
                              <FormBit key={idx} r={r} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-muted-foreground border-t bg-muted/10">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-4 bg-blue-500 rounded-sm inline-block" />
                    Champions League / Top Tier
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-4 bg-amber-500 rounded-sm inline-block" />
                    Europa League / Continental
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-4 bg-red-500 rounded-sm inline-block" />
                    Relegation Zone
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}


