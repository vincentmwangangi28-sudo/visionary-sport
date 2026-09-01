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
import { CurrencySelector } from '@/components/CurrencySelector';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Wallet, TrendingUp, Shield, Calculator, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export default function BankrollManager() {
  const { currency, currencyConfig, format, responsibleGambling } = useCurrency();
  const { formatOdds } = useUserPreferences();

  const [bankroll, setBankroll] = useState('1000');
  const [stakePercent, setStakePercent] = useState([3]);
  const [odds, setOdds] = useState('2.00');
  const [confidence, setConfidence] = useState([65]);

  const numBankroll = parseFloat(bankroll) || 0;
  const numOdds = parseFloat(odds) || 1.01;
  const stake = (numBankroll * stakePercent[0]) / 100;
  const kellyFraction = ((numOdds - 1) * (confidence[0] / 100) - (1 - confidence[0] / 100)) / (numOdds - 1);
  const kellyStake = Math.max(0, (numBankroll * kellyFraction * 100)) / 100;
  const ev = stake * ((confidence[0] / 100) * (numOdds - 1) - (1 - confidence[0] / 100));
  const riskLevel = stakePercent[0] <= 2 ? 'low' : stakePercent[0] <= 5 ? 'medium' : 'high';

  const strategies = [
    { name: 'Conservative', percent: 1, desc: 'Slow growth, minimal capital risk', color: 'text-green-600' },
    { name: 'Flat Stake', percent: 2, desc: 'Fixed 2% per bet position', color: 'text-blue-600' },
    { name: 'Moderate', percent: 3, desc: 'Balanced risk to return profile', color: 'text-amber-600' },
    { name: 'Aggressive', percent: 5, desc: 'Fast growth, higher variance swing', color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Bankroll Manager & Kelly Criterion Calculator | PredictPro"
        description="Global betting bankroll manager supporting 16 currencies with Kelly Criterion, flat stake sizing, and variance calculators. Bet responsibly."
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              Bankroll Manager
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Protect your capital with algorithmic stake sizing. Global multi-currency simulation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Currency:</span>
            <CurrencySelector variant="outline" className="shadow-sm" />
          </div>
        </div>

        {/* Regional Responsible Gambling Notification */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex gap-3 min-w-0 flex-1">
            <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <p>
                <strong>Responsible Gambling ({responsibleGambling.region}):</strong> Set a budget you can afford to lose. Never chase losses.
              </p>
              <p className="font-semibold">{responsibleGambling.helpline}</p>
            </div>
          </div>
          {responsibleGambling.website && (
            <a
              href={responsibleGambling.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>{responsibleGambling.authority}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calculator */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                Stake Calculator ({currencyConfig.code})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="bankroll-input">Total Bankroll ({currencyConfig.code} - {currencyConfig.symbol})</Label>
                <Input
                  id="bankroll-input"
                  type="number"
                  value={bankroll}
                  onChange={(e) => setBankroll(e.target.value)}
                  aria-label={`Total Bankroll in ${currencyConfig.code}`}
                />
              </div>
              <div className="space-y-2">
                <Label id="stake-percent-label">
                  Stake per bet: <span className="text-primary font-bold">{stakePercent[0]}%</span> = {format(stake)}
                </Label>
                <Slider
                  value={stakePercent}
                  onValueChange={setStakePercent}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="w-full"
                  aria-labelledby="stake-percent-label"
                  aria-label="Stake percentage per bet"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5% Safe</span>
                  <span>5% Aggressive</span>
                  <span>10% Risky</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="decimal-odds-input">Odds</Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    Formatted: <b className="text-foreground">{formatOdds(numOdds)}</b>
                  </span>
                </div>
                <Input
                  id="decimal-odds-input"
                  type="number"
                  step="0.05"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  aria-label="Odds"
                />
              </div>
              <div className="space-y-2">
                <Label id="confidence-percent-label">
                  Model / Pick Confidence: <span className="text-primary font-bold">{confidence[0]}%</span>
                </Label>
                <Slider
                  value={confidence}
                  onValueChange={setConfidence}
                  min={30}
                  max={95}
                  step={1}
                  aria-labelledby="confidence-percent-label"
                  aria-label="Confidence percentage"
                />
              </div>

              {/* Results */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Recommended Stake</p>
                  <p className="text-lg font-black text-primary truncate mt-0.5">{format(stake)}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Kelly Criterion Stake</p>
                  <p className="text-lg font-bold text-foreground truncate mt-0.5">{format(kellyStake)}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${ev > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <p className="text-xs text-muted-foreground">Expected Value (EV)</p>
                  <p className={`text-lg font-bold ${ev > 0 ? 'text-green-600' : 'text-red-600'} truncate mt-0.5`}>
                    {ev > 0 ? '+' : ''}{format(ev)}
                  </p>
                </div>
                <div
                  className={`rounded-xl p-3 text-center ${
                    riskLevel === 'low'
                      ? 'bg-green-500/10'
                      : riskLevel === 'medium'
                      ? 'bg-amber-500/10'
                      : 'bg-red-500/10'
                  }`}
                >
                  <p className="text-xs text-muted-foreground">Risk Variance</p>
                  <p
                    className={`text-lg font-bold capitalize ${
                      riskLevel === 'low'
                        ? 'text-green-600'
                        : riskLevel === 'medium'
                        ? 'text-amber-600'
                        : 'text-red-600'
                    } mt-0.5`}
                  >
                    {riskLevel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy guide */}
          <div className="space-y-4">
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Staking Strategies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {strategies.map((s) => (
                  <div
                    key={s.name}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-muted/30 transition-colors ${
                      stakePercent[0] === s.percent ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setStakePercent([s.percent])}
                  >
                    <div>
                      <p className={`font-semibold text-sm ${s.color}`}>{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{s.percent}%</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {format((numBankroll * s.percent) / 100)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Capital Preservation Golden Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    'Never stake more than 5% on a single bet',
                    'Only wager capital you can afford to lose completely',
                    'Keep meticulous records of all bets and unit yield',
                    'Stick to your sizing plan — strictly avoid emotional loss-chasing',
                    'Take a mandatory 48-hour cool-off break after drawdown streaks',
                    'Regularly withdraw profits to lock in returns',
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{rule}</span>
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
