import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, Zap, Trophy, Plus, BarChart2, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { AccuracyTrendChart } from '@/components/AccuracyTrendChart';

interface BetRecord {
  id: string;
  match: string;
  prediction: string;
  odds: number;
  stake: number;
  result: 'win' | 'loss' | 'pending';
  profit: number;
  date: string;
}

const STORAGE_KEY = 'predictpro_user_bets';

const getRelativeDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const INITIAL_SAMPLE_BETS: BetRecord[] = [
  { id: '1', match: 'Arsenal vs Chelsea', prediction: 'Home Win', odds: 1.85, stake: 500, result: 'win', profit: 425, date: getRelativeDateStr(2) },
  { id: '2', match: 'Real Madrid vs Barcelona', prediction: 'Draw', odds: 3.20, stake: 300, result: 'loss', profit: -300, date: getRelativeDateStr(5) },
  { id: '3', match: 'Gor Mahia vs AFC Leopards', prediction: 'Home Win', odds: 2.00, stake: 200, result: 'win', profit: 200, date: getRelativeDateStr(8) },
  { id: '4', match: 'Bayern vs Dortmund', prediction: 'Home Win', odds: 1.70, stake: 400, result: 'win', profit: 280, date: getRelativeDateStr(12) },
  { id: '5', match: 'PSG vs Lyon', prediction: 'Home Win', odds: 1.40, stake: 500, result: 'win', profit: 200, date: getRelativeDateStr(15) },
  { id: '6', match: 'Liverpool vs Man City', prediction: 'Over 2.5', odds: 1.65, stake: 450, result: 'win', profit: 292, date: getRelativeDateStr(18) },
  { id: '7', match: 'Inter Milan vs Juventus', prediction: 'BTTS (Yes)', odds: 1.90, stake: 350, result: 'win', profit: 315, date: getRelativeDateStr(22) },
  { id: '8', match: 'Shabana vs Tusker FC', prediction: 'Away Win', odds: 2.15, stake: 250, result: 'loss', profit: -250, date: getRelativeDateStr(25) },
];

export default function Performance() {
  const { user } = useAuth();
  const [bets, setBets] = useState<BetRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SAMPLE_BETS;
  });

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    match: '',
    prediction: 'Home Win',
    odds: '1.95',
    stake: '500',
    result: 'pending' as 'win' | 'loss' | 'pending',
  });

  const saveBets = (newBets: BetRecord[]) => {
    setBets(newBets);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBets));
    } catch (e) {
      console.warn('Failed to save bets to localStorage:', e);
    }
  };

  const handleAddBet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.match.trim()) {
      toast.error('Please enter the match name (e.g. Arsenal vs Chelsea)');
      return;
    }
    const odds = parseFloat(form.odds) || 1.0;
    const stake = parseFloat(form.stake) || 100;
    let profit = 0;
    if (form.result === 'win') {
      profit = Math.round(stake * (odds - 1));
    } else if (form.result === 'loss') {
      profit = -stake;
    }

    const newRecord: BetRecord = {
      id: `bet-${Date.now()}`,
      match: form.match.trim(),
      prediction: form.prediction,
      odds,
      stake,
      result: form.result,
      profit,
      date: new Date().toISOString().split('T')[0],
    };

    const updated = [newRecord, ...bets];
    saveBets(updated);
    toast.success('Bet logged successfully!');
    setForm({ match: '', prediction: 'Home Win', odds: '1.95', stake: '500', result: 'pending' });
    setShowAdd(false);
  };

  const handleUpdateResult = (id: string, newResult: 'win' | 'loss' | 'pending') => {
    const updated = bets.map(b => {
      if (b.id !== id) return b;
      let profit = 0;
      if (newResult === 'win') profit = Math.round(b.stake * (b.odds - 1));
      else if (newResult === 'loss') profit = -b.stake;
      return { ...b, result: newResult, profit };
    });
    saveBets(updated);
    toast.success('Bet status updated');
  };

  const handleDeleteBet = (id: string) => {
    const updated = bets.filter(b => b.id !== id);
    saveBets(updated);
    toast.info('Bet removed');
  };

  const wins = bets.filter(b => b.result === 'win').length;
  const losses = bets.filter(b => b.result === 'loss').length;
  const totalProfit = bets.reduce((s, b) => s + b.profit, 0);
  const totalStaked = bets.filter(b => b.result !== 'pending').reduce((s, b) => s + b.stake, 0);
  const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(1) : '0';
  const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  // Running P&L for chart
  const resolvedBets = [...bets].filter(b => b.result !== 'pending').reverse();
  const chartData = resolvedBets.reduce((acc: { date: string; pnl: number }[], b, i) => {
    const prev = acc[i - 1]?.pnl ?? 0;
    acc.push({ date: b.date.slice(5), pnl: prev + b.profit });
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="My Betting Performance | Track Results | PredictPro" description="Track your football betting performance. Record bets, monitor P&L, win rate and ROI with PredictPro's personal betting tracker." canonical="/performance" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart2 className="h-8 w-8 text-primary" />My Performance</h1>
            <p className="text-muted-foreground mt-1">Track your betting history, live P&L, ROI and bankroll progression.</p>
          </div>
          <Button onClick={() => setShowAdd(s => !s)} className="gap-2"><Plus className="h-4 w-4" />{showAdd ? 'Close Form' : 'Add Bet'}</Button>
        </div>

        {/* Add Bet Form Card */}
        {showAdd && (
          <Card className="mb-6 border-primary/40 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> Log a New Bet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBet} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2">
                  <label htmlFor="bet-match-input" className="text-xs font-semibold text-muted-foreground block mb-1">Match / Fixture</label>
                  <Input
                    id="bet-match-input"
                    placeholder="e.g. Arsenal vs Chelsea"
                    value={form.match}
                    onChange={e => setForm(f => ({ ...f, match: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="bet-market-select" className="text-xs font-semibold text-muted-foreground block mb-1">Market / Pick</label>
                  <Select value={form.prediction} onValueChange={v => setForm(f => ({ ...f, prediction: v }))}>
                    <SelectTrigger id="bet-market-select" aria-label="Select market or pick"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home Win">Home Win</SelectItem>
                      <SelectItem value="Draw">Draw</SelectItem>
                      <SelectItem value="Away Win">Away Win</SelectItem>
                      <SelectItem value="BTTS (Yes)">BTTS (Yes)</SelectItem>
                      <SelectItem value="Over 2.5">Over 2.5</SelectItem>
                      <SelectItem value="Under 2.5">Under 2.5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="bet-odds-input" className="text-xs font-semibold text-muted-foreground block mb-1">Odds</label>
                  <Input
                    id="bet-odds-input"
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={form.odds}
                    onChange={e => setForm(f => ({ ...f, odds: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="bet-stake-input" className="text-xs font-semibold text-muted-foreground block mb-1">Stake (KES)</label>
                  <Input
                    id="bet-stake-input"
                    type="number"
                    step="10"
                    min="10"
                    value={form.stake}
                    onChange={e => setForm(f => ({ ...f, stake: e.target.value }))}
                    required
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="gap-1.5"><CheckCircle className="h-4 w-4" aria-hidden="true" />Save Record</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Trophy, label: 'Win Rate', value: `${winRate}%`, color: winRate >= 55 ? 'text-green-500' : 'text-amber-500', bg: 'bg-green-500/10' },
            { icon: TrendingUp, label: 'Total P&L', value: `KES ${totalProfit.toLocaleString()}`, color: totalProfit >= 0 ? 'text-green-500' : 'text-red-500', bg: totalProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10' },
            { icon: Target, label: 'ROI', value: `${roi}%`, color: parseFloat(roi) >= 0 ? 'text-green-500' : 'text-red-500', bg: 'bg-primary/10' },
            { icon: Zap, label: 'Total Bets', value: bets.length, color: 'text-primary', bg: 'bg-primary/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <Card key={label}><CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}><Icon className={`h-5 w-5 ${color}`} /></div>
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent></Card>
          ))}
        </div>

        {/* 30-Day Accuracy Trend Recharts Visualizer */}
        <AccuracyTrendChart bets={bets} />

        {/* P&L Chart */}
        {chartData.length > 1 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">Running P&L Progression (KES)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`KES ${v}`, 'P&L']} />
                  <Line type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Bet history */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Bet History & Records ({bets.length})</CardTitle>
            {bets.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { if (confirm('Reset tracking history?')) saveBets([]); }} className="text-xs text-muted-foreground hover:text-destructive h-7">
                Reset
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left py-2 px-4">Match</th>
                  <th className="text-center py-2 px-3">Pick</th>
                  <th className="text-center py-2 px-3 hidden sm:table-cell">Odds</th>
                  <th className="text-center py-2 px-3 hidden sm:table-cell">Stake</th>
                  <th className="text-center py-2 px-3">Result</th>
                  <th className="text-right py-2 px-4">P&L</th>
                  <th className="text-center py-2 px-2">Action</th>
                </tr></thead>
                <tbody>
                  {bets.map(b => (
                    <tr key={b.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium truncate max-w-[150px]">{b.match}</td>
                      <td className="py-3 px-3 text-center"><Badge variant="outline" className="text-xs">{b.prediction}</Badge></td>
                      <td className="py-3 px-3 text-center hidden sm:table-cell">{b.odds.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center hidden sm:table-cell text-muted-foreground">KES {b.stake}</td>
                      <td className="py-3 px-3 text-center">
                        {b.result === 'win' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-3.5 w-3.5" /> Won
                          </span>
                        ) : b.result === 'loss' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                            <XCircle className="h-3.5 w-3.5" /> Lost
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleUpdateResult(b.id, 'win')} aria-label={`Mark bet for ${b.match} as won`} className="h-6 px-1.5 text-xs text-green-600 hover:bg-green-100 dark:hover:bg-green-950">✓</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleUpdateResult(b.id, 'loss')} aria-label={`Mark bet for ${b.match} as lost`} className="h-6 px-1.5 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-950">✕</Button>
                          </div>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${b.profit > 0 ? 'text-green-600' : b.profit < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {b.result === 'pending' ? '—' : `${b.profit > 0 ? '+' : ''}KES ${b.profit}`}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteBet(b.id)} aria-label={`Delete bet record for ${b.match}`} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {bets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                        No bet records found. Click "Add Bet" above to log your first wager.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted/30 rounded-xl flex items-center justify-between gap-4 flex-wrap">
          <div><p className="font-semibold">Want better picks?</p><p className="text-sm text-muted-foreground">Upgrade to unlock high-confidence predictions and value bets.</p></div>
          <Link to="/shop"><Button className="gap-2"><Trophy className="h-4 w-4" />Upgrade to Pro</Button></Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

