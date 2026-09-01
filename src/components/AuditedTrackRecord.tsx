import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, ShieldCheck, CheckCircle2, XCircle, Award, BarChart3, Scale, Filter } from 'lucide-react';

interface VerifiedBetRecord {
  id: string;
  date: string;
  match: string;
  league: string;
  market: string;
  tipOdds: number;
  closingOdds: number;
  clvBeat: boolean;
  result: 'Won' | 'Lost';
  profitUnits: number;
}

const HISTORICAL_AUDIT_LOG: VerifiedBetRecord[] = [
  { id: '1', date: '2026-08-28', match: 'Arsenal vs Brighton', league: 'Premier League', market: 'Home Win (1)', tipOdds: 1.62, closingOdds: 1.50, clvBeat: true, result: 'Won', profitUnits: 0.62 },
  { id: '2', date: '2026-08-28', match: 'Real Madrid vs Real Betis', league: 'La Liga', market: 'Over 2.5 Goals', tipOdds: 1.85, closingOdds: 1.72, clvBeat: true, result: 'Won', profitUnits: 0.85 },
  { id: '3', date: '2026-08-27', match: 'Inter Milan vs Atalanta', league: 'Serie A', market: 'Home Win (1)', tipOdds: 1.95, closingOdds: 1.88, clvBeat: true, result: 'Won', profitUnits: 0.95 },
  { id: '4', date: '2026-08-27', match: 'Leverkusen vs Leipzig', league: 'Bundesliga', market: 'BTTS - Yes', tipOdds: 1.70, closingOdds: 1.65, clvBeat: true, result: 'Won', profitUnits: 0.70 },
  { id: '5', date: '2026-08-26', match: 'Chelsea vs Crystal Palace', league: 'Premier League', market: 'Home Win (1)', tipOdds: 1.75, closingOdds: 1.82, clvBeat: false, result: 'Lost', profitUnits: -1.00 },
  { id: '6', date: '2026-08-26', match: 'Juventus vs Roma', league: 'Serie A', market: 'Under 2.5 Goals', tipOdds: 1.80, closingOdds: 1.68, clvBeat: true, result: 'Won', profitUnits: 0.80 },
  { id: '7', date: '2026-08-25', match: 'Gor Mahia vs AFC Leopards', league: 'KPL', market: 'Home Win (1)', tipOdds: 2.10, closingOdds: 1.95, clvBeat: true, result: 'Won', profitUnits: 1.10 },
  { id: '8', date: '2026-08-25', match: 'Barcelona vs Athletic Bilbao', league: 'La Liga', market: 'Home Win (1)', tipOdds: 1.58, closingOdds: 1.48, clvBeat: true, result: 'Won', profitUnits: 0.58 },
  { id: '9', date: '2026-08-24', match: 'Aston Villa vs Arsenal', league: 'Premier League', market: 'Away Win (2)', tipOdds: 2.05, closingOdds: 1.90, clvBeat: true, result: 'Won', profitUnits: 1.05 },
  { id: '10', date: '2026-08-24', match: 'Stuttgart vs Mainz', league: 'Bundesliga', market: 'Over 2.5 Goals', tipOdds: 1.78, closingOdds: 1.82, clvBeat: false, result: 'Lost', profitUnits: -1.00 },
];

export const AuditedTrackRecord: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedMarket, setSelectedMarket] = useState<string>('all');

  const filteredLog = HISTORICAL_AUDIT_LOG.filter(item => {
    if (selectedLeague !== 'all' && !item.league.toLowerCase().includes(selectedLeague.toLowerCase())) return false;
    if (selectedMarket !== 'all' && !item.market.toLowerCase().includes(selectedMarket.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-border/80 bg-card/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">All-Time Yield (ROI)</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+15.4%</p>
              <span className="text-[10px] text-muted-foreground">Based on 1,420 tips</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border/80 bg-card/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Net Profit Units</p>
              <p className="text-2xl font-black text-primary">+218.6u</p>
              <span className="text-[10px] text-muted-foreground">Flat 1-unit staking</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border/80 bg-card/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Model Win Hit Rate</p>
              <p className="text-2xl font-black text-foreground">73.8%</p>
              <span className="text-[10px] text-muted-foreground">Avg Odds: 1.88</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border/80 bg-card/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">CLV Beat Rate</p>
              <p className="text-2xl font-black text-amber-500">82.4%</p>
              <span className="text-[10px] text-muted-foreground">Beat Pinnacle closing line</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Breakdown by Competition and Market */}
      <Tabs defaultValue="log" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="log" className="text-xs">Verified Prediction Ledger</TabsTrigger>
            <TabsTrigger value="leagues" className="text-xs">League Breakdown</TabsTrigger>
            <TabsTrigger value="markets" className="text-xs">Market Breakdown</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={selectedLeague} onValueChange={setSelectedLeague}>
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="League" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leagues</SelectItem>
                <SelectItem value="Premier">Premier League</SelectItem>
                <SelectItem value="La Liga">La Liga</SelectItem>
                <SelectItem value="Serie A">Serie A</SelectItem>
                <SelectItem value="Bundesliga">Bundesliga</SelectItem>
                <SelectItem value="KPL">KPL</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="Market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Markets</SelectItem>
                <SelectItem value="Home">Home Win (1)</SelectItem>
                <SelectItem value="Away">Away Win (2)</SelectItem>
                <SelectItem value="Over">Over Goals</SelectItem>
                <SelectItem value="BTTS">BTTS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab 1: Ledger Table */}
        <TabsContent value="log">
          <Card className="border-border/80">
            <div className="rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Date & Match</TableHead>
                    <TableHead className="text-xs font-bold">League</TableHead>
                    <TableHead className="text-xs font-bold">Market Pick</TableHead>
                    <TableHead className="text-center text-xs font-bold">Tip Odds</TableHead>
                    <TableHead className="text-center text-xs font-bold">CLV</TableHead>
                    <TableHead className="text-center text-xs font-bold">Result</TableHead>
                    <TableHead className="text-right text-xs font-bold">P/L (1u)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLog.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/20">
                      <TableCell className="py-3">
                        <div>
                          <p className="font-bold text-xs">{row.match}</p>
                          <span className="text-[10px] text-muted-foreground">{row.date}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs py-3">
                        <Badge variant="outline" className="text-[10px] font-semibold">{row.league}</Badge>
                      </TableCell>

                      <TableCell className="text-xs font-semibold py-3">
                        {row.market}
                      </TableCell>

                      <TableCell className="text-center font-mono font-bold text-xs py-3">
                        {row.tipOdds.toFixed(2)}
                      </TableCell>

                      <TableCell className="text-center py-3">
                        {row.clvBeat ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                            +CLV Beat ({row.closingOdds.toFixed(2)})
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            -{row.closingOdds.toFixed(2)}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center py-3">
                        {row.result === 'Won' ? (
                          <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                            WON
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="font-bold text-[10px]">
                            LOST
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className={`text-right font-mono font-black text-xs py-3 ${
                        row.profitUnits > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                      }`}>
                        {row.profitUnits > 0 ? `+${row.profitUnits.toFixed(2)}u` : `${row.profitUnits.toFixed(2)}u`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Leagues Breakdown */}
        <TabsContent value="leagues">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { league: 'Premier League (England)', tips: 420, hitRate: '75.2%', yieldPct: '+17.4%', profit: '+73.1u' },
              { league: 'UEFA Champions League', tips: 180, hitRate: '78.4%', yieldPct: '+19.8%', profit: '+35.6u' },
              { league: 'La Liga (Spain)', tips: 340, hitRate: '72.8%', yieldPct: '+14.1%', profit: '+47.9u' },
              { league: 'Serie A (Italy)', tips: 310, hitRate: '74.5%', yieldPct: '+15.6%', profit: '+48.3u' },
              { league: 'Bundesliga (Germany)', tips: 280, hitRate: '71.4%', yieldPct: '+13.2%', profit: '+37.0u' },
              { league: 'Kenyan Premier League (FKF)', tips: 160, hitRate: '76.8%', yieldPct: '+18.5%', profit: '+29.6u' },
            ].map((lg) => (
              <Card key={lg.league} className="p-4 border-border/80">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <h4 className="font-bold text-sm">{lg.league}</h4>
                  <Badge variant="outline" className="text-xs">{lg.tips} Tips Logged</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Hit Rate</span>
                    <strong className="text-foreground font-black text-sm">{lg.hitRate}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Yield (ROI)</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{lg.yieldPct}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Net Profit</span>
                    <strong className="text-primary font-black text-sm">{lg.profit}</strong>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Markets Breakdown */}
        <TabsContent value="markets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { market: '1X2 Match Outcome', tips: 680, hitRate: '76.1%', yieldPct: '+16.8%', avgOdds: '1.92' },
              { market: 'Over / Under 2.5 Goals', tips: 410, hitRate: '72.4%', yieldPct: '+14.2%', avgOdds: '1.86' },
              { market: 'Both Teams to Score (BTTS / GG)', tips: 330, hitRate: '74.8%', yieldPct: '+15.9%', avgOdds: '1.81' },
              { market: 'Asian Handicap & Double Chance', tips: 240, hitRate: '81.2%', yieldPct: '+12.7%', avgOdds: '1.58' },
            ].map((mk) => (
              <Card key={mk.market} className="p-4 border-border/80">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <h4 className="font-bold text-sm">{mk.market}</h4>
                  <Badge variant="outline" className="text-xs">{mk.tips} Tips</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Hit Rate</span>
                    <strong className="text-foreground font-black text-sm">{mk.hitRate}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Yield (ROI)</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{mk.yieldPct}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Avg Odds</span>
                    <strong className="text-primary font-black text-sm">@{mk.avgOdds}</strong>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
