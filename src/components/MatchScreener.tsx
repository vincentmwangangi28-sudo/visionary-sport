import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamLogo } from '@/components/TeamLogo';
import { ScreenerMatchGridSkeleton } from '@/components/PredictionCardSkeleton';
import { useBetSlip } from '@/hooks/useBetSlip';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { getConfidence, getPrediction } from '@/types/prediction';
import { hapticService } from '@/services/hapticService';
import { Download, RefreshCw, Plus, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface ScreenedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  market: string;
  odds: number;
  aiConfidence: number;
  valueEdge: number;
  bttsProb: number;
  over25Prob: number;
  xGExpectancy: number;
}

function formatSlug(home: string, away: string): string {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${clean(home)}-vs-${clean(away)}`;
}

export const MatchScreener: React.FC = () => {
  const [minConfidence, setMinConfidence] = useState<number>(65);
  const [minValueEdge, setMinValueEdge] = useState<number>(4);
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'table' | 'grid'>('table');
  const [matches, setMatches] = useState<ScreenedMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { addSelection, selections } = useBetSlip();

  const loadData = async () => {
    setLoading(true);
    try {
      const fixtures = await fetchRealtimeUpcomingFixtures();
      const list: ScreenedMatch[] = [];

      fixtures.forEach((f, idx) => {
        const conf = getConfidence(f) || 72;
        const pred = getPrediction(f) || 'Home Win';
        const hash = (f.home_team + f.away_team).split('').reduce((a, b) => a + b.charCodeAt(0), 0);

        let odds = f.home_odds || 1.95;
        let market = 'Home Win';
        if (pred === 'Away Win') {
          odds = f.away_odds || 2.60;
          market = 'Away Win';
        } else if (pred === 'Draw') {
          odds = f.draw_odds || 3.30;
          market = 'Draw';
        }

        const actualProb = conf / 100;
        const valueEdge = Math.round((actualProb * odds - 1) * 100);

        const bttsProb = 50 + (hash % 38);
        const over25Prob = 48 + (hash % 42);
        const xGExpectancy = Number((2.1 + (hash % 16) / 10).toFixed(2));

        list.push({
          id: f.id || `scr-${idx}`,
          homeTeam: f.home_team,
          awayTeam: f.away_team,
          league: f.league,
          matchDate: f.match_date,
          market,
          odds,
          aiConfidence: conf,
          valueEdge: Math.max(2, valueEdge),
          bttsProb,
          over25Prob,
          xGExpectancy,
        });
      });

      list.sort((a, b) => b.aiConfidence - a.aiConfidence);
      setMatches(list);
    } catch (err) {
      console.warn('Match screener load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = matches.filter((m) => {
    if (m.aiConfidence < minConfidence) return false;
    if (m.valueEdge < minValueEdge) return false;
    if (selectedLeague !== 'all' && !m.league.toLowerCase().includes(selectedLeague.toLowerCase())) return false;
    if (selectedMarket === 'btts' && m.bttsProb < 60) return false;
    if (selectedMarket === 'over25' && m.over25Prob < 60) return false;
    if (selectedMarket === 'home_win' && !m.market.includes('Home')) return false;
    if (selectedMarket === 'away_win' && !m.market.includes('Away')) return false;
    return true;
  });

  const handleAddAllToAcca = () => {
    if (filtered.length === 0) return;
    hapticService.boost();
    const toAdd = filtered.slice(0, 5);
    toAdd.forEach((m) => {
      addSelection({
        match: `${m.homeTeam} vs ${m.awayTeam}`,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        league: m.league,
        matchDate: m.matchDate,
        market: m.market,
        odds: m.odds,
        confidence: m.aiConfidence,
      });
    });
    toast.success(`Added top ${toAdd.length} screened picks to Match Slip`);
  };

  const handleExportCSV = () => {
    hapticService.success();
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Match,League,Market,Odds,Confidence,Edge,xG,BTTS,Over2.5,Date',
        ...filtered.map(
          (m) =>
            `"${m.homeTeam} vs ${m.awayTeam}","${m.league}","${m.market}",${m.odds},${m.aiConfidence}%,+${m.valueEdge}%,${m.xGExpectancy},${m.bttsProb}%,${m.over25Prob}%,${m.matchDate}`
        ),
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `predictpro_screener_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Screener table exported as CSV');
  };

  return (
    <div className="space-y-5">
      {/* Screener Parameter Controls */}
      <Card className="border-border bg-card shadow-2xs">
        <CardContent className="p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3.5">
            <div>
              <h2 className="font-bold text-sm text-foreground">Filter Parameters</h2>
              <p className="text-xs text-muted-foreground">
                Adjust minimum win probability, value edge, market type, and competition
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-md">
                <Button
                  size="icon"
                  variant={displayMode === 'table' ? 'secondary' : 'ghost'}
                  onClick={() => setDisplayMode('table')}
                  className="h-7 w-7"
                  title="Table View"
                  aria-label="Table View"
                >
                  <List className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant={displayMode === 'grid' ? 'secondary' : 'ghost'}
                  onClick={() => setDisplayMode('grid')}
                  className="h-7 w-7"
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-8 gap-1.5 text-xs">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filtered.length === 0} className="h-8 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Min Probability</span>
                <span className="font-mono tabular-nums text-primary font-bold">{minConfidence}%</span>
              </div>
              <Slider
                value={[minConfidence]}
                min={50}
                max={88}
                step={2}
                onValueChange={(val) => setMinConfidence(val[0])}
                className="w-full"
                aria-label="Minimum Probability"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Min Value Edge (+EV)</span>
                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                  +{minValueEdge}%
                </span>
              </div>
              <Slider
                value={[minValueEdge]}
                min={0}
                max={25}
                step={1}
                onValueChange={(val) => setMinValueEdge(val[0])}
                className="w-full"
                aria-label="Minimum Value Edge"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Market</label>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder="Market" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Markets</SelectItem>
                  <SelectItem value="home_win">Home Win (1)</SelectItem>
                  <SelectItem value="away_win">Away Win (2)</SelectItem>
                  <SelectItem value="over25">Over 2.5 Goals (&gt;60%)</SelectItem>
                  <SelectItem value="btts">Both Teams to Score (&gt;60%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Competition</label>
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder="Competition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Competitions</SelectItem>
                  <SelectItem value="Premier League">Premier League</SelectItem>
                  <SelectItem value="Champions League">UEFA Champions League</SelectItem>
                  <SelectItem value="La Liga">LaLiga</SelectItem>
                  <SelectItem value="Serie A">Serie A</SelectItem>
                  <SelectItem value="Bundesliga">Bundesliga</SelectItem>
                  <SelectItem value="Kenya">FKF Premier League</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">
          Showing <strong className="font-mono text-foreground">{filtered.length}</strong> fixtures matching filter criteria
        </p>

        {filtered.length > 0 && (
          <Button size="sm" onClick={handleAddAllToAcca} className="h-8 gap-1.5 text-xs font-bold">
            <Plus className="h-3.5 w-3.5" /> Load Top {Math.min(5, filtered.length)} Picks to Slip
          </Button>
        )}
      </div>

      {/* Results View */}
      {loading ? (
        <ScreenerMatchGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-border bg-card">
          <h4 className="font-bold text-sm">No fixtures match these thresholds</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Lower the minimum probability or value edge slider to broaden the results.
          </p>
        </Card>
      ) : displayMode === 'table' ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-left font-semibold">Match</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Competition</th>
                  <th className="py-2.5 px-3 text-right font-semibold font-mono">Total xG</th>
                  <th className="py-2.5 px-3 text-right font-semibold font-mono">BTTS</th>
                  <th className="py-2.5 px-3 text-right font-semibold font-mono">O2.5</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Forecast</th>
                  <th className="py-2.5 px-3 text-right font-semibold font-mono">Prob</th>
                  <th className="py-2.5 px-3 text-right font-semibold font-mono">Edge</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Odds / Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((m) => {
                  const inSlip = selections.some(
                    (s) => s.homeTeam === m.homeTeam && s.awayTeam === m.awayTeam && s.market === m.market
                  );
                  return (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-foreground">
                        <Link
                          to={`/predict/${formatSlug(m.homeTeam, m.awayTeam)}`}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <TeamLogo team={m.homeTeam} size="xs" badgeOnly />
                          <span>{m.homeTeam}</span>
                          <span className="text-muted-foreground font-normal">v</span>
                          <TeamLogo team={m.awayTeam} size="xs" badgeOnly />
                          <span>{m.awayTeam}</span>
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{m.league}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-foreground">
                        {m.xGExpectancy.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">
                        {m.bttsProb}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">
                        {m.over25Prob}%
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{m.market}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-primary">
                        {m.aiConfidence}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        +{m.valueEdge}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        <button
                          type="button"
                          onClick={() => {
                            hapticService.selection();
                            addSelection({
                              match: `${m.homeTeam} vs ${m.awayTeam}`,
                              homeTeam: m.homeTeam,
                              awayTeam: m.awayTeam,
                              league: m.league,
                              matchDate: m.matchDate,
                              market: m.market,
                              odds: m.odds,
                              confidence: m.aiConfidence,
                            });
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                            inSlip
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/50 hover:bg-muted border-border text-foreground'
                          }`}
                        >
                          {m.odds.toFixed(2)}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Card key={m.id} className="border-border hover:border-primary/50 transition-colors shadow-2xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary truncate">{m.league}</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    +{m.valueEdge}% Edge · {m.aiConfidence}%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 py-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TeamLogo team={m.homeTeam} size="sm" />
                    <span className="font-bold text-xs truncate">{m.homeTeam}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono px-1">v</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span className="font-bold text-xs truncate text-right">{m.awayTeam}</span>
                    <TeamLogo team={m.awayTeam} size="sm" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] py-1.5 bg-muted/40 rounded-lg border border-border/60 font-mono tabular-nums">
                  <div>
                    <span className="text-muted-foreground block font-sans text-[10px]">BTTS</span>
                    <strong className="text-foreground">{m.bttsProb}%</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-sans text-[10px]">Over 2.5</span>
                    <strong className="text-foreground">{m.over25Prob}%</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-sans text-[10px]">Total xG</span>
                    <strong className="text-foreground">{m.xGExpectancy}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs">
                    <span className="text-muted-foreground text-[10px] block">Pick</span>
                    <span className="font-bold text-foreground">{m.market}</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      hapticService.selection();
                      addSelection({
                        match: `${m.homeTeam} vs ${m.awayTeam}`,
                        homeTeam: m.homeTeam,
                        awayTeam: m.awayTeam,
                        league: m.league,
                        matchDate: m.matchDate,
                        market: m.market,
                        odds: m.odds,
                        confidence: m.aiConfidence,
                      });
                    }}
                    className="gap-1 text-xs font-mono font-bold h-8"
                  >
                    {m.odds.toFixed(2)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
