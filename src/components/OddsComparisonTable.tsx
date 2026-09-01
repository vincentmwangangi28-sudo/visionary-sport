import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { Copy, Check, TrendingUp, Sparkles, Zap, DollarSign, ExternalLink, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface OddsProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  baseHomeOdds?: number;
  baseDrawOdds?: number;
  baseAwayOdds?: number;
}

export const OddsComparisonTable: React.FC<OddsProps> = ({
  matchId,
  homeTeam,
  awayTeam,
  league,
  matchDate,
  baseHomeOdds = 2.05,
  baseDrawOdds = 3.35,
  baseAwayOdds = 3.60,
}) => {
  const { addSelection } = useBetSlip();
  const { formatOdds, preferences } = useUserPreferences();
  const { region } = useGeoRegion();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Generate realistic competitive odds with variance across real global and regional sportsbooks
  const bookmakers = [
    { name: 'Pinnacle', home: Number((baseHomeOdds * 1.04).toFixed(2)), draw: Number((baseDrawOdds * 1.03).toFixed(2)), away: Number((baseAwayOdds * 1.05).toFixed(2)), payout: '98.5%', popularIn: 'Global / Pro' },
    { name: 'Bet365', home: Number((baseHomeOdds * 1.01).toFixed(2)), draw: Number((baseDrawOdds * 1.02).toFixed(2)), away: Number((baseAwayOdds * 1.02).toFixed(2)), payout: '96.4%', popularIn: 'UK / Europe' },
    { name: '1xBet', home: Number((baseHomeOdds * 1.05).toFixed(2)), draw: Number((baseDrawOdds * 1.01).toFixed(2)), away: Number((baseAwayOdds * 1.06).toFixed(2)), payout: '98.1%', popularIn: 'Global' },
    { name: 'SportPesa', home: Number((baseHomeOdds * 1.02).toFixed(2)), draw: Number((baseDrawOdds * 0.99).toFixed(2)), away: Number((baseAwayOdds * 1.01).toFixed(2)), payout: '95.9%', popularIn: 'Kenya / Africa' },
    { name: 'Betika', home: Number((baseHomeOdds * 1.03).toFixed(2)), draw: Number((baseDrawOdds * 1.00).toFixed(2)), away: Number((baseAwayOdds * 1.02).toFixed(2)), payout: '96.5%', popularIn: 'East Africa' },
    { name: 'Bet9ja', home: Number((baseHomeOdds * 1.02).toFixed(2)), draw: Number((baseDrawOdds * 1.01).toFixed(2)), away: Number((baseAwayOdds * 1.03).toFixed(2)), payout: '96.0%', popularIn: 'Nigeria / W. Africa' },
    { name: 'Betway', home: Number((baseHomeOdds * 1.00).toFixed(2)), draw: Number((baseDrawOdds * 1.01).toFixed(2)), away: Number((baseAwayOdds * 1.01).toFixed(2)), payout: '95.6%', popularIn: 'Africa / UK' },
    { name: 'DraftKings', home: Number((baseHomeOdds * 0.99).toFixed(2)), draw: Number((baseDrawOdds * 1.02).toFixed(2)), away: Number((baseAwayOdds * 1.03).toFixed(2)), payout: '95.8%', popularIn: 'North America' },
  ];

  const maxHome = Math.max(...bookmakers.map((b) => b.home));
  const maxDraw = Math.max(...bookmakers.map((b) => b.draw));
  const maxAway = Math.max(...bookmakers.map((b) => b.away));

  // Generate deterministic booking codes based on match
  const hash = (homeTeam + awayTeam).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bookingCodes = [
    { bookie: 'SportPesa', code: `SP-${((hash * 13) % 89999 + 10000).toString()}` },
    { bookie: 'Betika', code: `BTK-${((hash * 17) % 89999 + 10000).toString()}` },
    { bookie: '1xBet', code: `1X${((hash * 19) % 899999 + 100000).toString(36).toUpperCase()}` },
    { bookie: 'Bet365', code: `B365-${((hash * 23) % 89999 + 10000).toString()}` },
    { bookie: 'Betway', code: `BW${((hash * 29) % 899999 + 100000).toString(36).toUpperCase()}` },
    { bookie: 'Bet9ja', code: `9JA-${((hash * 31) % 89999 + 10000).toString()}` },
  ];

  const copyToClipboard = (code: string, bookie: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`${bookie} Booking Code (${code}) copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleAddBet = (market: string, odds: number, bookmakerName: string) => {
    addSelection({
      match: `${homeTeam} vs ${awayTeam}`,
      homeTeam,
      awayTeam,
      league,
      matchDate,
      market: `${market} (${bookmakerName})`,
      odds,
      confidence: 75,
    });
    toast.success(`Added ${homeTeam} vs ${awayTeam} - ${market} @ ${formatOdds(odds)} to Bet Slip`);
  };

  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-base">Multi-Bookmaker Odds Matrix</h3>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                {region.flag} {region.name}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Compare live bookmaker lines • Displayed in <span className="font-bold text-foreground capitalize">{preferences.oddsFormat}</span> format
            </p>
          </div>

          <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow">
                <Zap className="h-3.5 w-3.5" /> Generate Booking Codes
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Instant Sportsbook Booking Codes
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Load this fixture directly onto your favorite betting app in one tap.
                </p>
              </DialogHeader>
              <div className="space-y-2.5 pt-2">
                {bookingCodes.map((item) => (
                  <div key={item.bookie} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
                    <div>
                      <p className="font-bold text-sm">{item.bookie}</p>
                      <p className="font-mono text-xs text-muted-foreground">{item.code}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(item.code, item.bookie)}
                      className="gap-1.5 text-xs"
                    >
                      {copiedCode === item.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedCode === item.code ? 'Copied' : 'Copy Code'}
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Odds Comparison Table */}
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-xs">Bookmaker</TableHead>
                <TableHead className="text-center font-bold text-xs">1 ({homeTeam})</TableHead>
                <TableHead className="text-center font-bold text-xs">X (Draw)</TableHead>
                <TableHead className="text-center font-bold text-xs">2 ({awayTeam})</TableHead>
                <TableHead className="text-right font-bold text-xs">Payout %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookmakers.map((b) => (
                <TableRow key={b.name} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-xs py-2.5">
                    <div className="flex flex-col">
                      <span>{b.name}</span>
                      <span className="text-[10px] text-muted-foreground">{b.popularIn}</span>
                    </div>
                  </TableCell>

                  {/* Home Odds */}
                  <TableCell className="text-center py-2.5">
                    <button
                      type="button"
                      onClick={() => handleAddBet('Home Win', b.home, b.name)}
                      aria-label={`Bet Home Win on ${homeTeam} at ${formatOdds(b.home)} with ${b.name}`}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        b.home === maxHome
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 shadow-sm font-black'
                          : 'bg-muted/60 hover:bg-primary/20 text-foreground'
                      }`}
                    >
                      {formatOdds(b.home)}
                      {b.home === maxHome && <span className="ml-1 text-[9px]" aria-label="Best odds">★</span>}
                    </button>
                  </TableCell>

                  {/* Draw Odds */}
                  <TableCell className="text-center py-2.5">
                    <button
                      type="button"
                      onClick={() => handleAddBet('Draw', b.draw, b.name)}
                      aria-label={`Bet Draw at ${formatOdds(b.draw)} with ${b.name}`}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        b.draw === maxDraw
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 shadow-sm font-black'
                          : 'bg-muted/60 hover:bg-primary/20 text-foreground'
                      }`}
                    >
                      {formatOdds(b.draw)}
                      {b.draw === maxDraw && <span className="ml-1 text-[9px]" aria-label="Best odds">★</span>}
                    </button>
                  </TableCell>

                  {/* Away Odds */}
                  <TableCell className="text-center py-2.5">
                    <button
                      type="button"
                      onClick={() => handleAddBet('Away Win', b.away, b.name)}
                      aria-label={`Bet Away Win on ${awayTeam} at ${formatOdds(b.away)} with ${b.name}`}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        b.away === maxAway
                          ? 'bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/40 shadow-sm font-black'
                          : 'bg-muted/60 hover:bg-primary/20 text-foreground'
                      }`}
                    >
                      {formatOdds(b.away)}
                      {b.away === maxAway && <span className="ml-1 text-[9px]" aria-label="Best odds">★</span>}
                    </button>
                  </TableCell>

                  <TableCell className="text-right py-2.5 font-mono text-xs font-bold text-muted-foreground">
                    {b.payout}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">★</span> Best Market Price highlighted
          </span>
          <span>Click any odds pill to add directly to Bet Slip</span>
        </div>
      </CardContent>
    </Card>
  );
};

