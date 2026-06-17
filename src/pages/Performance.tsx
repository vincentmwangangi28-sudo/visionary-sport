import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, Zap, Trophy, Plus, BarChart2, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface BetRecord { id: string; match: string; prediction: string; odds: number; stake: number; result: 'win' | 'loss' | 'pending'; profit: number; date: string; }

export default function Performance() {
  const { user } = useAuth();
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ match: '', prediction: '', odds: '', stake: '' });

  // Mock data for demo
  useEffect(() => {
    setBets([
      { id: '1', match: 'Arsenal vs Chelsea', prediction: 'Home Win', odds: 1.85, stake: 500, result: 'win', profit: 425, date: '2026-06-01' },
      { id: '2', match: 'Real Madrid vs Barcelona', prediction: 'Draw', odds: 3.20, stake: 300, result: 'loss', profit: -300, date: '2026-06-02' },
      { id: '3', match: 'Gor Mahia vs AFC Leopards', prediction: 'Home Win', odds: 2.00, stake: 200, result: 'win', profit: 200, date: '2026-06-03' },
      { id: '4', match: 'Bayern vs Dortmund', prediction: 'Home Win', odds: 1.70, stake: 400, result: 'win', profit: 280, date: '2026-06-04' },
      { id: '5', match: 'PSG vs Lyon', prediction: 'Home Win', odds: 1.40, stake: 500, result: 'pending', profit: 0, date: '2026-06-05' },
    ]);
  }, [user]);

  const wins = bets.filter(b => b.result === 'win').length;
  const losses = bets.filter(b => b.result === 'loss').length;
  const totalProfit = bets.reduce((s, b) => s + b.profit, 0);
  const totalStaked = bets.filter(b => b.result !== 'pending').reduce((s, b) => s + b.stake, 0);
  const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(1) : '0';
  const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  // Running P&L for chart
  const chartData = bets.filter(b => b.result !== 'pending').reduce((acc: { date: string; pnl: number }[], b, i) => {
    const prev = acc[i - 1]?.pnl ?? 0;
    acc.push({ date: b.date.slice(5), pnl: prev + b.profit });
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="My Betting Performance | Track Results | PredictPro" description="Track your football betting performance. Record bets, monitor P&L, win rate and ROI with PredictPro's personal betting tracker." canonical="/performance" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart2 className="h-8 w-8 text-primary" />My Performance</h1>
            <p className="text-muted-foreground mt-1">Track your betting history, P&L and win rate.</p>
          </div>
          <Button onClick={() => setShowAdd(s => !s)} className="gap-2"><Plus className="h-4 w-4" />Add Bet</Button>
        </div>

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

        {/* P&L Chart */}
        {chartData.length > 1 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">Running P&L (KES)</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-base">Bet History</CardTitle></CardHeader>
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
                </tr></thead>
                <tbody>
                  {bets.map(b => (
                    <tr key={b.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium truncate max-w-[150px]">{b.match}</td>
                      <td className="py-3 px-3 text-center"><Badge variant="outline" className="text-xs">{b.prediction}</Badge></td>
                      <td className="py-3 px-3 text-center hidden sm:table-cell">{b.odds.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center hidden sm:table-cell text-muted-foreground">KES {b.stake}</td>
                      <td className="py-3 px-3 text-center">
                        {b.result === 'win' ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : b.result === 'loss' ? <XCircle className="h-5 w-5 text-red-500 mx-auto" /> : <span className="text-xs text-amber-500 font-medium">Pending</span>}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${b.profit > 0 ? 'text-green-600' : b.profit < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {b.result === 'pending' ? '—' : `${b.profit > 0 ? '+' : ''}KES ${b.profit}`}
                      </td>
                    </tr>
                  ))}
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
