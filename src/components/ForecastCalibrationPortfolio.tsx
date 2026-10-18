import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Target, Activity, Plus, Trash2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export interface CalibrationRecord {
  id: string;
  match: string;
  league: string;
  forecast: string;
  predictedProb: number;
  projectedXg: string;
  actualScore: string;
  outcomeCorrect: boolean;
}

const DEFAULT_CALIBRATION_RECORDS: CalibrationRecord[] = [
  {
    id: 'cal-1',
    match: 'Arsenal vs Chelsea',
    league: 'Premier League',
    forecast: 'Home Win (1)',
    predictedProb: 78,
    projectedXg: '2.14 - 0.98',
    actualScore: '2 - 1',
    outcomeCorrect: true,
  },
  {
    id: 'cal-2',
    match: 'Real Madrid vs Barcelona',
    league: 'La Liga',
    forecast: 'Over 2.5 Goals',
    predictedProb: 74,
    projectedXg: '1.96 - 1.54',
    actualScore: '3 - 1',
    outcomeCorrect: true,
  },
  {
    id: 'cal-3',
    match: 'Gor Mahia vs AFC Leopards',
    league: 'FKF Premier League',
    forecast: 'Home Win (1)',
    predictedProb: 81,
    projectedXg: '1.72 - 0.68',
    actualScore: '1 - 0',
    outcomeCorrect: true,
  },
  {
    id: 'cal-4',
    match: 'Inter Milan vs AC Milan',
    league: 'Serie A',
    forecast: 'BTTS - Yes',
    predictedProb: 68,
    projectedXg: '1.65 - 1.32',
    actualScore: '1 - 1',
    outcomeCorrect: true,
  },
  {
    id: 'cal-5',
    match: 'Bayern Munich vs Borussia Dortmund',
    league: 'Bundesliga',
    forecast: 'Home Win (1)',
    predictedProb: 72,
    projectedXg: '2.28 - 1.41',
    actualScore: '2 - 2',
    outcomeCorrect: false,
  },
  {
    id: 'cal-6',
    match: 'Mamelodi Sundowns vs Orlando Pirates',
    league: 'South Africa PSL',
    forecast: 'Home or Draw (1X)',
    predictedProb: 84,
    projectedXg: '1.68 - 0.84',
    actualScore: '2 - 0',
    outcomeCorrect: true,
  },
];

export const ForecastCalibrationPortfolio: React.FC = () => {
  const [records, setRecords] = useState<CalibrationRecord[]>(DEFAULT_CALIBRATION_RECORDS);

  const stats = useMemo(() => {
    if (records.length === 0) {
      return { accuracyPct: 0, brierScore: '0.000', avgConf: 0, correctCount: 0 };
    }
    const correctCount = records.filter((r) => r.outcomeCorrect).length;
    const accuracyPct = Math.round((correctCount / records.length) * 100);
    const avgConf = Math.round(
      records.reduce((acc, r) => acc + r.predictedProb, 0) / records.length
    );

    // Brier score: 1/N * sum((p_i - o_i)^2) where o_i in {0, 1}
    const brierSum = records.reduce((acc, r) => {
      const p = r.predictedProb / 100;
      const o = r.outcomeCorrect ? 1 : 0;
      return acc + Math.pow(p - o, 2);
    }, 0);
    const brierScore = (brierSum / records.length).toFixed(3);

    return { accuracyPct, brierScore, avgConf, correctCount };
  }, [records]);

  const handleAddSampleForecast = () => {
    const newItem: CalibrationRecord = {
      id: `cal-${Date.now()}`,
      match: 'Liverpool vs Manchester City',
      league: 'Premier League',
      forecast: 'BTTS - Yes',
      predictedProb: 76,
      projectedXg: '1.82 - 1.64',
      actualScore: '2 - 1',
      outcomeCorrect: true,
    };
    setRecords((prev) => [newItem, ...prev]);
    toast.success('Logged fixture forecast to Model Calibration Ledger');
  };

  const handleRemove = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <Card className="border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary text-primary-foreground font-bold text-[10px] px-2 py-0.5">
                <BarChart3 className="h-3 w-3 mr-1" /> QUANTITATIVE MODEL CALIBRATION LEDGER
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                Brier Score: {stats.brierScore} (Optimal &lt; 0.180)
              </Badge>
            </div>
            <CardTitle className="text-lg font-black text-foreground">
              Personal Match Forecast &amp; Statistical Calibration Portfolio
            </CardTitle>
            <CardDescription className="text-xs">
              Evaluate model probability calibration against verified full-time scores using Brier Score accuracy and Expected Goals (xG) variance.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAddSampleForecast}
            className="gap-1.5 text-xs font-bold self-start sm:self-center shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Log Verified Forecast
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 space-y-4">
        {/* 4 Calibration KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-border/60 bg-background/70">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Forecast Accuracy
            </span>
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {stats.accuracyPct}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {stats.correctCount} / {records.length} Verified
            </span>
          </div>

          <div className="p-3 rounded-xl border border-border/60 bg-background/70">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Brier Calibration Score
            </span>
            <span className="text-xl font-black font-mono text-primary mt-0.5 block">
              {stats.brierScore}
            </span>
            <span className="text-[11px] text-muted-foreground">Probability Calibration</span>
          </div>

          <div className="p-3 rounded-xl border border-border/60 bg-background/70">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Mean Model Confidence
            </span>
            <span className="text-xl font-black font-mono text-foreground mt-0.5 block">
              {stats.avgConf}%
            </span>
            <span className="text-[11px] text-muted-foreground">Bivariate Poisson</span>
          </div>

          <div className="p-3 rounded-xl border border-border/60 bg-background/70">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Mean xG Error Delta
            </span>
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              ±0.24 xG
            </span>
            <span className="text-[11px] text-muted-foreground">90-Min Goal Expectancy</span>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase text-muted-foreground">
                <th className="py-2.5 px-3">Fixture &amp; Competition</th>
                <th className="py-2.5 px-3">Model Forecast</th>
                <th className="py-2.5 px-3 text-center">Confidence</th>
                <th className="py-2.5 px-3 text-center">Projected xG</th>
                <th className="py-2.5 px-3 text-center">FT Score</th>
                <th className="py-2.5 px-3 text-center">Calibration</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-muted/20">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-foreground">{rec.match}</div>
                    <div className="text-[10px] text-muted-foreground">{rec.league}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-primary">{rec.forecast}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">{rec.predictedProb}%</td>
                  <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{rec.projectedXg}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-black">{rec.actualScore}</td>
                  <td className="py-2.5 px-3 text-center">
                    {rec.outcomeCorrect ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Accurate
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                        Variance
                      </Badge>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(rec.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label={`Remove ${rec.match}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
