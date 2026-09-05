import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download,
  Flame,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';

export interface BetRecord {
  id: string;
  date: string;
  match: string;
  selection: string;
  odds: number;
  stake: number;
  status: 'won' | 'lost' | 'pending';
  notes?: string;
}

const STORAGE_KEY = 'pp_bankroll_portfolio_bets_v1';

const DEFAULT_SAMPLE_BETS: BetRecord[] = [
  {
    id: 'bet-1',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    match: 'Arsenal vs Brighton',
    selection: 'Home Win',
    odds: 1.55,
    stake: 50,
    status: 'won',
  },
  {
    id: 'bet-2',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    match: 'Real Madrid vs Real Valladolid',
    selection: 'Over 2.5 Goals',
    odds: 1.62,
    stake: 60,
    status: 'won',
  },
  {
    id: 'bet-3',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    match: 'Chelsea vs Crystal Palace',
    selection: 'Home Win',
    odds: 1.60,
    stake: 40,
    status: 'lost',
  },
  {
    id: 'bet-4',
    date: new Date().toISOString().split('T')[0],
    match: 'Man City vs Brentford',
    selection: 'Home Win & Over 2.5',
    odds: 1.70,
    stake: 55,
    status: 'pending',
  },
];

export const BankrollPortfolioTracker = () => {
  const { format, currencyConfig } = useCurrency();
  const { formatOdds } = useUserPreferences();

  const [bets, setBets] = useState<BetRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_SAMPLE_BETS;
  });

  const [filter, setFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');
  const [openAddModal, setOpenAddModal] = useState(false);

  // Form State
  const [matchName, setMatchName] = useState('');
  const [selection, setSelection] = useState('');
  const [oddsInput, setOddsInput] = useState('1.85');
  const [stakeInput, setStakeInput] = useState('50');
  const [statusInput, setStatusInput] = useState<'won' | 'lost' | 'pending'>('pending');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
    } catch {
      // ignore
    }
  }, [bets]);

  // Analytics Metrics
  const stats = useMemo(() => {
    let totalStaked = 0;
    let totalReturned = 0;
    let wonCount = 0;
    let lostCount = 0;
    let pendingCount = 0;
    let wonOddsSum = 0;

    let currentStreak = 0;
    let currentStreakType: 'W' | 'L' | null = null;
    let maxWinStreak = 0;
    let tempWinStreak = 0;

    // Sort by date ascending for streak calculation
    const sorted = [...bets].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach((bet) => {
      totalStaked += bet.stake;
      if (bet.status === 'won') {
        wonCount++;
        totalReturned += bet.stake * bet.odds;
        wonOddsSum += bet.odds;

        tempWinStreak++;
        if (tempWinStreak > maxWinStreak) maxWinStreak = tempWinStreak;

        if (currentStreakType === 'W') currentStreak++;
        else { currentStreakType = 'W'; currentStreak = 1; }
      } else if (bet.status === 'lost') {
        lostCount++;
        tempWinStreak = 0;
        if (currentStreakType === 'L') currentStreak++;
        else { currentStreakType = 'L'; currentStreak = 1; }
      } else {
        pendingCount++;
      }
    });

    const settledCount = wonCount + lostCount;
    const settledStake = bets
      .filter((b) => b.status !== 'pending')
      .reduce((sum, b) => sum + b.stake, 0);

    const netProfit = totalReturned - settledStake;
    const roi = settledStake > 0 ? (netProfit / settledStake) * 100 : 0;
    const winRate = settledCount > 0 ? (wonCount / settledCount) * 100 : 0;
    const avgWonOdds = wonCount > 0 ? wonOddsSum / wonCount : 0;

    return {
      totalStaked,
      totalReturned,
      netProfit,
      roi,
      winRate,
      wonCount,
      lostCount,
      pendingCount,
      settledCount,
      avgWonOdds,
      streak: currentStreak > 0 ? `${currentStreak}${currentStreakType}` : 'None',
      maxWinStreak,
    };
  }, [bets]);

  const handleAddBet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchName.trim() || !selection.trim()) {
      toast.error('Please enter match and selection details');
      return;
    }

    const newBet: BetRecord = {
      id: `bet-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      match: matchName.trim(),
      selection: selection.trim(),
      odds: parseFloat(oddsInput) || 1.85,
      stake: parseFloat(stakeInput) || 50,
      status: statusInput,
    };

    setBets((prev) => [newBet, ...prev]);
    setMatchName('');
    setSelection('');
    setOpenAddModal(false);
    toast.success('Bet added to your portfolio');
  };

  const toggleBetStatus = (id: string) => {
    setBets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const nextStatus = b.status === 'pending' ? 'won' : b.status === 'won' ? 'lost' : 'pending';
        return { ...b, status: nextStatus };
      })
    );
  };

  const deleteBet = (id: string) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
    toast.info('Bet removed');
  };

  const exportCSV = () => {
    const headers = ['Date,Match,Selection,Odds,Stake,Status,ProfitLoss'];
    const rows = bets.map((b) => {
      const pl = b.status === 'won' ? (b.stake * b.odds - b.stake).toFixed(2) : b.status === 'lost' ? (-b.stake).toFixed(2) : '0';
      return `"${b.date}","${b.match}","${b.selection}",${b.odds},${b.stake},"${b.status}",${pl}`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `predictpro_bets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBets = bets.filter((b) => (filter === 'all' ? true : b.status === filter));

  return (
    <div className="space-y-6">
      {/* Portfolio Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            My Betting Portfolio & P&L Tracker
          </h2>
          <p className="text-xs text-muted-foreground">
            Track your personal returns, yields, and disciplined performance against PredictPro models.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>

          <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs font-bold">
                <Plus className="h-3.5 w-3.5" /> Log New Bet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Bet into Portfolio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBet} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bet-match">Fixture / Match</Label>
                  <Input
                    id="bet-match"
                    placeholder="e.g. Arsenal vs Liverpool"
                    value={matchName}
                    onChange={(e) => setMatchName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bet-selection">Selection / Market</Label>
                  <Input
                    id="bet-selection"
                    placeholder="e.g. Home Win or Over 2.5"
                    value={selection}
                    onChange={(e) => setSelection(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bet-odds">Odds</Label>
                    <Input
                      id="bet-odds"
                      type="number"
                      step="0.01"
                      min="1.01"
                      value={oddsInput}
                      onChange={(e) => setOddsInput(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bet-stake">Stake ({currencyConfig.symbol})</Label>
                    <Input
                      id="bet-stake"
                      type="number"
                      step="1"
                      min="1"
                      value={stakeInput}
                      onChange={(e) => setStakeInput(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Current Result</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['pending', 'won', 'lost'] as const).map((st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setStatusInput(st)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border capitalize transition-colors ${
                          statusInput === st
                            ? st === 'won'
                              ? 'bg-green-600 text-white border-green-600'
                              : st === 'lost'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setOpenAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="font-bold">
                    Save to Portfolio
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Net Profit / Loss
              {stats.netProfit >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
            </p>
            <p
              className={`text-xl font-black mt-1 ${
                stats.netProfit > 0
                  ? 'text-green-600 dark:text-green-400'
                  : stats.netProfit < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-foreground'
              }`}
            >
              {stats.netProfit > 0 ? '+' : ''}
              {format(stats.netProfit)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Across {stats.settledCount} settled wagers
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Yield / ROI
              <Percent className="h-3.5 w-3.5 text-primary" />
            </p>
            <p
              className={`text-xl font-black mt-1 ${
                stats.roi > 0
                  ? 'text-green-600 dark:text-green-400'
                  : stats.roi < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-foreground'
              }`}
            >
              {stats.roi > 0 ? '+' : ''}
              {stats.roi.toFixed(1)}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Capital efficiency rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Win Rate
              <span className="text-[11px] font-bold text-muted-foreground">
                {stats.wonCount}/{stats.settledCount}
              </span>
            </p>
            <p className="text-xl font-black text-foreground mt-1">
              {stats.winRate.toFixed(1)}%
            </p>
            <div className="w-full bg-muted h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-green-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, stats.winRate)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Active Streak
              <Flame className="h-4 w-4 text-amber-500" />
            </p>
            <p className="text-xl font-black text-foreground mt-1">
              {stats.streak}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Avg Won Odds: {formatOdds(stats.avgWonOdds || 1.0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bets List and Filters */}
      <Card className="border-border/70">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Logged Bets ({bets.length})
          </CardTitle>

          <div className="flex items-center gap-1 text-xs">
            {(['all', 'won', 'lost', 'pending'] as const).map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors ${
                  filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredBets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No bets found in this filter category.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredBets.map((bet) => {
                const profitLoss =
                  bet.status === 'won'
                    ? bet.stake * bet.odds - bet.stake
                    : bet.status === 'lost'
                    ? -bet.stake
                    : 0;

                return (
                  <div
                    key={bet.id}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">{bet.date}</span>
                        <Badge variant="outline" className="text-[10px] font-bold py-0">
                          {bet.selection}
                        </Badge>
                      </div>
                      <p className="font-bold text-sm text-foreground truncate">{bet.match}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 font-medium">
                        <span>Odds: <strong className="text-foreground">{formatOdds(bet.odds)}</strong></span>
                        <span>·</span>
                        <span>Stake: <strong className="text-foreground">{format(bet.stake)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p
                          className={`text-sm font-black ${
                            bet.status === 'won'
                              ? 'text-green-600'
                              : bet.status === 'lost'
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {bet.status === 'won' && `+${format(profitLoss)}`}
                          {bet.status === 'lost' && format(profitLoss)}
                          {bet.status === 'pending' && `Pot. +${format(bet.stake * bet.odds - bet.stake)}`}
                        </p>

                        <button
                          type="button"
                          onClick={() => toggleBetStatus(bet.id)}
                          title="Click to toggle status (Pending -> Won -> Lost)"
                          className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80"
                        >
                          {bet.status === 'won' && (
                            <span className="text-green-600 flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Won
                            </span>
                          )}
                          {bet.status === 'lost' && (
                            <span className="text-red-600 flex items-center gap-0.5">
                              <XCircle className="h-3 w-3" /> Lost
                            </span>
                          )}
                          {bet.status === 'pending' && (
                            <span className="text-amber-500 flex items-center gap-0.5">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteBet(bet.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
                        aria-label="Delete bet"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
