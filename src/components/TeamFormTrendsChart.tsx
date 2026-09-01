import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import { StandingRow } from '@/data/standingsData';
import { TrendingUp, Flame, Award, Shield, BarChart3, Activity } from 'lucide-react';

interface TeamFormTrendsChartProps {
  standings: StandingRow[];
  leagueName?: string;
  leagueFlag?: string;
}

// Convert form string ('WWDLD') into chronological match outcomes and points
const parseFormResults = (formStr: string = '') => {
  const letters = formStr.trim().toUpperCase().split('');
  // If fewer than 5 matches, pad or slice
  const results = letters.slice(-5);
  
  let pointsTotal = 0;
  const matchPoints = results.map(r => {
    let pts = 0;
    if (r === 'W') pts = 3;
    else if (r === 'D') pts = 1;
    else pts = 0;
    pointsTotal += pts;
    return { result: r, pts };
  });

  return { results, matchPoints, pointsTotal };
};

const TEAM_COLORS = [
  '#10b981', // Emerald / Green
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export const TeamFormTrendsChart = ({
  standings,
  leagueName = 'League',
  leagueFlag = '⚽',
}: TeamFormTrendsChartProps) => {
  // Selected teams for the multi-line trajectory chart
  const defaultSelectedTeams = useMemo(() => {
    return standings.slice(0, 4).map(s => s.team);
  }, [standings]);

  const [selectedTeams, setSelectedTeams] = useState<string[]>(defaultSelectedTeams);
  const [activeTab, setActiveTab] = useState<'momentum' | 'ranking' | 'goals'>('momentum');

  // Update selected teams if standings change and selected are empty
  const activeTeams = selectedTeams.length > 0 ? selectedTeams : defaultSelectedTeams;

  // Process Form Ranking Data (Form Points in Last 5 Matches)
  const formRankingData = useMemo(() => {
    return standings.map(row => {
      const { results, pointsTotal } = parseFormResults(row.form || '');
      const maxPossible = Math.max(results.length * 3, 3);
      const efficiency = Math.round((pointsTotal / maxPossible) * 100);
      
      const wins = results.filter(r => r === 'W').length;
      const draws = results.filter(r => r === 'D').length;
      const losses = results.filter(r => r === 'L').length;

      return {
        team: row.team,
        shortName: row.team.length > 13 ? row.team.slice(0, 11) + '..' : row.team,
        position: row.position,
        pointsTotal,
        efficiency,
        form: row.form || 'N/A',
        results,
        wins,
        draws,
        losses,
        played: row.played,
        points: row.points,
        gd: row.gd,
        gf: row.gf,
        ga: row.ga,
        logo: row.logo,
      };
    }).sort((a, b) => b.pointsTotal - a.pointsTotal || b.gd - a.gd);
  }, [standings]);

  // Process Trajectory Data for Match 1 to Match 5 (Cumulative Points)
  const trajectoryData = useMemo(() => {
    // Determine max matches in form (up to 5)
    const matchesCount = 5;
    const pointsData: Array<{ matchLabel: string; [teamName: string]: number | string }> = [];

    for (let i = 0; i < matchesCount; i++) {
      const matchIndex = i + 1;
      const point: { matchLabel: string; [teamName: string]: number | string } = {
        matchLabel: `Match ${matchIndex}`,
      };

      standings.forEach(row => {
        const { matchPoints } = parseFormResults(row.form || '');
        // Calculate cumulative points up to this match
        const sub = matchPoints.slice(0, matchIndex);
        const cumPts = sub.reduce((acc, curr) => acc + curr.pts, 0);
        point[row.team] = cumPts;
      });

      pointsData.push(point);
    }

    return pointsData;
  }, [standings]);

  // Goal Dynamics Data (Goals Scored vs Conceded)
  const goalDynamicsData = useMemo(() => {
    return standings.slice(0, 10).map(row => ({
      team: row.team,
      shortName: row.team.length > 12 ? row.team.slice(0, 10) + '..' : row.team,
      gf: row.gf,
      ga: row.ga,
      gd: row.gd,
      position: row.position,
    }));
  }, [standings]);

  // Handle Team Selection Toggle
  const toggleTeam = (teamName: string) => {
    if (selectedTeams.includes(teamName)) {
      if (selectedTeams.length > 1) {
        setSelectedTeams(selectedTeams.filter(t => t !== teamName));
      }
    } else {
      if (selectedTeams.length < 6) {
        setSelectedTeams([...selectedTeams, teamName]);
      } else {
        // Replace last
        setSelectedTeams([...selectedTeams.slice(1), teamName]);
      }
    }
  };

  const setPreset = (type: 'top4' | 'next4' | 'relegation') => {
    if (type === 'top4') {
      setSelectedTeams(standings.slice(0, 4).map(s => s.team));
    } else if (type === 'next4') {
      setSelectedTeams(standings.slice(4, 8).map(s => s.team));
    } else if (type === 'relegation') {
      setSelectedTeams(standings.slice(-4).map(s => s.team));
    }
  };

  // Top In-Form Team
  const topFormTeam = formRankingData[0];

  if (!standings || standings.length === 0) return null;

  return (
    <Card id="team-form-trends-card" className="border border-border/80 shadow-sm bg-card overflow-hidden my-6">
      <CardHeader className="pb-4 bg-muted/20 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{leagueFlag}</span>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>{leagueName} Form Trends & Analytics</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                  Last 5 Matches
                </Badge>
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Interactive visualization of recent match momentum, points accumulation, and goal differentials.
            </CardDescription>
          </div>

          {topFormTeam && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs self-start sm:self-auto">
              <Flame className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block leading-tight">
                  Most In-Form Team
                </span>
                <span className="font-bold text-foreground">{topFormTeam.team}</span>{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ({topFormTeam.pointsTotal} pts / {topFormTeam.form})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs Control */}
        <div className="pt-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList id="form-trends-tab-list" className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="momentum" id="tab-momentum" className="text-xs gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Form Trajectory</span>
              </TabsTrigger>
              <TabsTrigger value="ranking" id="tab-ranking" className="text-xs gap-1.5">
                <Award className="h-3.5 w-3.5" />
                <span>Form Table (Pts/5)</span>
              </TabsTrigger>
              <TabsTrigger value="goals" id="tab-goals" className="text-xs gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Goals For / Against</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* TAB 1: FORM MOMENTUM TRAJECTORY */}
        {activeTab === 'momentum' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span>Select up to 6 teams to compare point trajectory across last 5 matches:</span>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground mr-1">Presets:</span>
                <Button
                  id="preset-top4-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreset('top4')}
                  className="h-7 text-[11px] px-2"
                >
                  Top 4
                </Button>
                <Button
                  id="preset-next4-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreset('next4')}
                  className="h-7 text-[11px] px-2"
                >
                  5th–8th
                </Button>
                <Button
                  id="preset-relegation-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreset('relegation')}
                  className="h-7 text-[11px] px-2"
                >
                  Bottom 4
                </Button>
              </div>
            </div>

            {/* Team Selection Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-muted/20 rounded-lg border border-border/50">
              {standings.map((row) => {
                const isSelected = activeTeams.includes(row.team);
                const colorIdx = activeTeams.indexOf(row.team);
                const teamColor = colorIdx !== -1 ? TEAM_COLORS[colorIdx % TEAM_COLORS.length] : undefined;

                return (
                  <button
                    key={row.team}
                    id={`team-chip-${row.position}`}
                    type="button"
                    onClick={() => toggleTeam(row.team)}
                    aria-pressed={isSelected}
                    aria-label={`Toggle trend line for ${row.team}, currently ${isSelected ? 'selected' : 'not selected'}`}
                    style={{
                      borderColor: isSelected ? teamColor : undefined,
                      backgroundColor: isSelected ? `${teamColor}15` : undefined,
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'border-primary text-foreground shadow-sm'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/60'
                    }`}
                  >
                    {row.logo && (
                      <img
                        src={row.logo}
                        alt={`${row.team} logo`}
                        className="w-3.5 h-3.5 object-contain"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    )}
                    <span>{row.team}</span>
                    {isSelected && (
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: teamColor }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Recharts Line / Trajectory Chart */}
            <div className="h-[280px] sm:h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectoryData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="matchLabel"
                    tick={{ fontSize: 12 }}
                    stroke="#888888"
                  />
                  <YAxis
                    domain={[0, 15]}
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    stroke="#888888"
                    label={{
                      value: 'Cumulative Points',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 11,
                      style: { textAnchor: 'middle', fill: '#888888' },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="bg-popover border border-border text-popover-foreground p-3 rounded-lg shadow-lg text-xs space-y-1.5 min-w-[160px]">
                          <p className="font-bold border-b border-border pb-1 text-primary">{label} (Last 5 Form)</p>
                          {payload.map((entry) => (
                            <div key={entry.name} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="font-medium text-foreground">{entry.name}:</span>
                              </span>
                              <span className="font-bold">{entry.value} pts</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    iconType="circle"
                  />
                  {activeTeams.map((teamName, idx) => (
                    <Line
                      key={teamName}
                      type="monotone"
                      dataKey={teamName}
                      name={teamName}
                      stroke={TEAM_COLORS[idx % TEAM_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 1.5 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: FORM RANKING (BAR CHART) */}
        {activeTab === 'ranking' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Points earned in the last 5 matches across the league (Max: 15 pts):</span>
              <span className="hidden sm:inline font-medium text-emerald-600 dark:text-emerald-400">
                Green = 10+ pts · Amber = 5-9 pts · Red = &lt;5 pts
              </span>
            </div>

            <div className="h-[300px] sm:h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formRankingData.slice(0, 14)}
                  margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    stroke="#888888"
                  />
                  <YAxis domain={[0, 15]} tick={{ fontSize: 11 }} stroke="#888888" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border text-popover-foreground p-3 rounded-lg shadow-lg text-xs space-y-1.5 min-w-[170px]">
                          <div className="flex items-center gap-2 border-b border-border pb-1">
                            {item.logo && <img src={item.logo} alt={`${item.team} logo`} className="w-4 h-4 object-contain" />}
                            <span className="font-bold text-foreground">{item.team}</span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <p className="flex justify-between">
                              <span className="text-muted-foreground">Table Rank:</span>
                              <span className="font-semibold">#{item.position}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-muted-foreground">Form Points:</span>
                              <span className="font-bold text-primary">{item.pointsTotal} / 15 pts</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-muted-foreground">Form Streak:</span>
                              <span className="font-mono font-bold tracking-wider">{item.form}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-muted-foreground">W-D-L (Last 5):</span>
                              <span>{item.wins}W - {item.draws}D - {item.losses}L</span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={10} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Elite Form (10+)', position: 'insideTopRight', fontSize: 10, fill: '#10b981' }} />
                  <Bar dataKey="pointsTotal" name="Form Points" radius={[4, 4, 0, 0]}>
                    {formRankingData.slice(0, 14).map((entry) => {
                      let color = '#ef4444'; // Red < 5
                      if (entry.pointsTotal >= 10) color = '#10b981'; // Green >= 10
                      else if (entry.pointsTotal >= 5) color = '#f59e0b'; // Amber 5-9
                      return <Cell key={entry.team} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: GOALS FOR VS AGAINST */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Goals Scored (GF) vs Goals Conceded (GA) for Top 10 Clubs:</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Goals Scored
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Goals Conceded
                </span>
              </div>
            </div>

            <div className="h-[300px] sm:h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={goalDynamicsData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    stroke="#888888"
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#888888" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border text-popover-foreground p-3 rounded-lg shadow-lg text-xs space-y-1 min-w-[160px]">
                          <p className="font-bold border-b border-border pb-1 text-foreground">{item.team} (#{item.position})</p>
                          <div className="space-y-1 text-[11px] pt-1">
                            <p className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                              <span>Goals Scored:</span>
                              <span>{item.gf}</span>
                            </p>
                            <p className="flex justify-between text-rose-500 font-semibold">
                              <span>Goals Conceded:</span>
                              <span>{item.ga}</span>
                            </p>
                            <p className="flex justify-between font-bold border-t border-border/50 pt-1">
                              <span>Goal Diff:</span>
                              <span>{item.gd > 0 ? `+${item.gd}` : item.gd}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="gf" name="Goals Scored (GF)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ga" name="Goals Conceded (GA)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
