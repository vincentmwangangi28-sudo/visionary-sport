import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const SPORTS = [
  { id: 'tennis', label: '🎾 Tennis', matches: [
    { home: 'Jannik Sinner', away: 'Carlos Alcaraz', league: 'ATP Wimbledon', date: 'Today' },
    { home: 'Novak Djokovic', away: 'Daniil Medvedev', league: 'ATP French Open', date: 'Today' },
    { home: 'Iga Swiatek', away: 'Aryna Sabalenka', league: 'WTA Finals', date: 'Tomorrow' },
  ]},
  { id: 'basketball', label: '🏀 Basketball', matches: [
    { home: 'LA Lakers', away: 'Golden State Warriors', league: 'NBA', date: 'Today' },
    { home: 'Boston Celtics', away: 'Miami Heat', league: 'NBA Playoffs', date: 'Today' },
    { home: 'Denver Nuggets', away: 'Phoenix Suns', league: 'NBA', date: 'Tomorrow' },
  ]},
  { id: 'cricket', label: '🏏 Cricket', matches: [
    { home: 'India', away: 'England', league: 'ICC World Cup', date: 'Today' },
    { home: 'Australia', away: 'South Africa', league: 'ICC T20', date: 'Tomorrow' },
    { home: 'Pakistan', away: 'New Zealand', league: 'Test Series', date: 'Tomorrow' },
  ]},
  { id: 'rugby', label: '🏉 Rugby', matches: [
    { home: 'All Blacks', away: 'Springboks', league: 'Rugby Championship', date: 'Today' },
    { home: 'England', away: 'France', league: '6 Nations', date: 'Tomorrow' },
  ]},
];

interface Prediction { predicted_outcome?: string; prediction?: string; confidence?: number; confidence_score?: number; analysis?: string; reasoning?: string; home_odds?: number; draw_odds?: number; away_odds?: number; }

export default function OtherSports() {
  const [sport, setSport] = useState('tennis');
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const predict = async (match: { home: string; away: string; league: string }) => {
    const key = `${match.home}-${match.away}`;
    if (predictions[key]) return;
    setLoading(key);
    try {
      const { data } = await supabase.functions.invoke('generate-prediction', {
        body: { home_team: match.home, away_team: match.away, league: match.league, match_date: new Date().toISOString().split('T')[0] },
      });
      if (data?.prediction) setPredictions(p => ({ ...p, [key]: data.prediction }));
      else throw new Error('No prediction returned');
    } catch { toast.error('Failed to predict — try again'); }
    finally { setLoading(null); }
  };

  const current = SPORTS.find(s => s.id === sport)!;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Multi-Sport Predictions | PredictPro" description="AI predictions for tennis, basketball, cricket and rugby. Global sports coverage." />
      <Navbar />
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3"><Zap className="h-8 w-8 text-primary" />Multi-Sport Predictions</h1>
          <p className="text-muted-foreground mt-1">AI-powered predictions for tennis, basketball, cricket & rugby.</p>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {SPORTS.map(s => (
            <Button key={s.id} size="sm" variant={sport === s.id ? 'default' : 'outline'} onClick={() => setSport(s.id)}>
              {s.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {current.matches.map(match => {
            const key = `${match.home}-${match.away}`;
            const pred = predictions[key];
            const isLoading = loading === key;
            const outcome = pred?.predicted_outcome ?? pred?.prediction;
            const confidence = pred?.confidence_score ?? pred?.confidence;
            const analysis = pred?.analysis ?? pred?.reasoning;

            return (
              <Card key={key} className="hover:border-primary/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="outline" className="text-xs">{match.league}</Badge>
                    <span className="text-xs text-muted-foreground">{match.date}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg">{match.home} <span className="text-muted-foreground text-base font-normal">vs</span> {match.away}</p>
                      {pred && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={`${outcome === 'Home Win' ? 'bg-green-500' : outcome === 'Away Win' ? 'bg-red-500' : 'bg-amber-500'} text-white`}>
                              {outcome}
                            </Badge>
                            <span className="text-sm font-semibold text-primary">{confidence}%</span>
                          </div>
                          {analysis && <p className="text-xs text-muted-foreground">{analysis}</p>}
                          {pred.home_odds && (
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>1: <b>{pred.home_odds?.toFixed(2)}</b></span>
                              {pred.draw_odds && <span>X: <b>{pred.draw_odds?.toFixed(2)}</b></span>}
                              <span>2: <b>{pred.away_odds?.toFixed(2)}</b></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {!pred && (
                      <Button size="sm" onClick={() => predict(match)} disabled={isLoading} className="flex-shrink-0">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4 mr-1" />Predict</>}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
