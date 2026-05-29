import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Shield, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';

export default function BankrollManager() {
  const [bankroll, setBankroll] = useState('10000');
  const [stakePercent, setStakePercent] = useState([3]);
  const [odds, setOdds] = useState('2.00');
  const [confidence, setConfidence] = useState([65]);
  const [sessions, setSessions] = useState('30');

  const stake = (parseFloat(bankroll) * stakePercent[0]) / 100;
  const kellyFraction = ((parseFloat(odds) - 1) * (confidence[0] / 100) - (1 - confidence[0] / 100)) / (parseFloat(odds) - 1);
  const kellyStake = Math.max(0, (parseFloat(bankroll) * kellyFraction * 100)) / 100;
  const ev = stake * ((confidence[0] / 100) * (parseFloat(odds) - 1) - (1 - confidence[0] / 100));
  const riskLevel = stakePercent[0] <= 2 ? 'low' : stakePercent[0] <= 5 ? 'medium' : 'high';

  const strategies = [
    { name: 'Conservative', percent: 1, desc: 'Slow growth, minimal risk', color: 'text-green-600' },
    { name: 'Flat Stake', percent: 2, desc: 'Fixed 2% per bet', color: 'text-blue-600' },
    { name: 'Moderate', percent: 3, desc: 'Balanced risk/reward', color: 'text-amber-600' },
    { name: 'Aggressive', percent: 5, desc: 'Fast growth, higher variance', color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Bankroll Manager | PredictPro" description="Manage your betting bankroll with Kelly Criterion, flat stake, and variance calculators. Bet responsibly." />
      <Navbar />
      <main className="container mx-auto px-4 py-24 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3"><Wallet className="h-8 w-8 text-primary" />Bankroll Manager</h1>
          <p className="text-muted-foreground mt-1">Protect your capital with proper stake sizing. The tools that serious bettors use.</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 flex gap-3">
          <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-400">Responsible gambling: Set a budget you can afford to lose. Never chase losses. Take breaks. If gambling affects your life, call the <strong>Kenya Responsible Gambling helpline: 0800 723 253</strong></p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calculator */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" />Stake Calculator</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Total Bankroll (KES)</Label>
                <Input type="number" value={bankroll} onChange={e => setBankroll(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Stake per bet: <span className="text-primary font-bold">{stakePercent[0]}%</span> = KES {stake.toLocaleString('en-KE', { maximumFractionDigits: 0 })}</Label>
                <Slider value={stakePercent} onValueChange={setStakePercent} min={0.5} max={10} step={0.5} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>0.5% Safe</span><span>5% Aggressive</span><span>10% Risky</span></div>
              </div>
              <div className="space-y-1.5">
                <Label>Decimal Odds</Label>
                <Input type="number" step="0.05" value={odds} onChange={e => setOdds(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Your Confidence: <span className="text-primary font-bold">{confidence[0]}%</span></Label>
                <Slider value={confidence} onValueChange={setConfidence} min={30} max={95} step={1} />
              </div>

              {/* Results */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Your Stake</p>
                  <p className="text-xl font-bold text-primary">KES {stake.toLocaleString('en-KE', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Kelly Stake</p>
                  <p className="text-xl font-bold">KES {kellyStake.toLocaleString('en-KE', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${ev > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <p className="text-xs text-muted-foreground">Expected Value</p>
                  <p className={`text-xl font-bold ${ev > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ev > 0 ? '+' : ''}KES {Math.abs(ev).toFixed(0)}
                  </p>
                </div>
                <div className={`rounded-lg p-3 text-center ${riskLevel === 'low' ? 'bg-green-500/10' : riskLevel === 'medium' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                  <p className="text-xs text-muted-foreground">Risk Level</p>
                  <p className={`text-xl font-bold capitalize ${riskLevel === 'low' ? 'text-green-600' : riskLevel === 'medium' ? 'text-amber-600' : 'text-red-600'}`}>{riskLevel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy guide */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-5 w-5 text-primary" />Staking Strategies</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {strategies.map(s => (
                  <div key={s.name} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors ${stakePercent[0] === s.percent ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setStakePercent([s.percent])}>
                    <div>
                      <p className={`font-semibold ${s.color}`}>{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{s.percent}%</p>
                      <p className="text-xs text-muted-foreground">KES {((parseFloat(bankroll) * s.percent) / 100).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-green-500" />Golden Rules</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    'Never stake more than 5% on a single bet',
                    'Only bet what you can afford to lose',
                    'Keep records of all bets and results',
                    'Stick to your staking plan — no chasing losses',
                    'Take a break after 5 consecutive losses',
                    'Withdraw profits regularly',
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />{rule}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
