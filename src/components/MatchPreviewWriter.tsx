import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Users, 
  Swords, 
  Target, 
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Trophy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MatchPreviewWriterProps {
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
}

interface TeamNews {
  form: string;
  keyPlayers: string[];
  injuries: string[];
  tactics: string;
}

interface HeadToHead {
  summary: string;
  lastMeetings: { result: string; date: string; venue: string }[];
  homeRecord: string;
}

interface KeyBattle {
  title: string;
  description: string;
}

interface Prediction {
  scoreline: string;
  winner: string;
  confidence: number;
  reasoning: string;
}

interface BettingInsight {
  market: string;
  tip: string;
  odds: string;
  value: string;
}

interface MatchPreview {
  headline: string;
  introduction: string;
  teamNews: {
    home: TeamNews;
    away: TeamNews;
  };
  headToHead: HeadToHead;
  tacticalAnalysis: string;
  keyBattles: KeyBattle[];
  prediction: Prediction;
  bettingInsights: BettingInsight[];
}

export const MatchPreviewWriter = ({ homeTeam, awayTeam, league, matchDate }: MatchPreviewWriterProps) => {
  const [preview, setPreview] = useState<MatchPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generatePreview = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-match-preview', {
        body: { homeTeam, awayTeam, league, matchDate }
      });

      if (error) throw error;
      
      if (data?.preview) {
        setPreview(data.preview);
        toast.success('Match preview generated!');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const getValueColor = (value: string) => {
    if (value.toLowerCase().includes('good') || value.toLowerCase().includes('great')) return 'bg-green-500/20 text-green-400';
    if (value.toLowerCase().includes('fair')) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-muted text-muted-foreground';
  };

  if (!preview && !isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">AI Match Preview</h3>
          <p className="text-muted-foreground mb-6">
            Generate a comprehensive pre-match article with tactical analysis, team news, and betting insights
          </p>
          <Button onClick={generatePreview} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Preview Article
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
        <CardContent className="p-6">
          <Badge className="mb-3 bg-primary/30 text-primary-foreground">{league}</Badge>
          <h2 className="text-2xl font-bold mb-2">{preview?.headline}</h2>
          <p className="text-muted-foreground">{preview?.introduction}</p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="teams" className="gap-1 text-xs sm:text-sm">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Teams</span>
          </TabsTrigger>
          <TabsTrigger value="h2h" className="gap-1 text-xs sm:text-sm">
            <Swords className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">H2H</span>
          </TabsTrigger>
          <TabsTrigger value="tactics" className="gap-1 text-xs sm:text-sm">
            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Tactics</span>
          </TabsTrigger>
          <TabsTrigger value="betting" className="gap-1 text-xs sm:text-sm">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Tips</span>
          </TabsTrigger>
        </TabsList>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Home Team */}
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  {homeTeam}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Recent Form</h4>
                  <p className="text-sm">{preview?.teamNews.home.form}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Players</h4>
                  <ul className="space-y-1">
                    {preview?.teamNews.home.keyPlayers.map((player, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-primary" />
                        {player}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Injuries</h4>
                  <ul className="space-y-1">
                    {preview?.teamNews.home.injuries.map((injury, i) => (
                      <li key={i} className="text-sm flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        {injury}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Expected Tactics</h4>
                  <p className="text-sm">{preview?.teamNews.home.tactics}</p>
                </div>
              </CardContent>
            </Card>

            {/* Away Team */}
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-accent" />
                  {awayTeam}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Recent Form</h4>
                  <p className="text-sm">{preview?.teamNews.away.form}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Players</h4>
                  <ul className="space-y-1">
                    {preview?.teamNews.away.keyPlayers.map((player, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-accent" />
                        {player}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Injuries</h4>
                  <ul className="space-y-1">
                    {preview?.teamNews.away.injuries.map((injury, i) => (
                      <li key={i} className="text-sm flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        {injury}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Expected Tactics</h4>
                  <p className="text-sm">{preview?.teamNews.away.tactics}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Head to Head Tab */}
        <TabsContent value="h2h">
          <Card className="bg-card/50">
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground">{preview?.headToHead.summary}</p>
              
              <div>
                <h4 className="font-semibold mb-3">Recent Meetings</h4>
                <div className="space-y-2">
                  {preview?.headToHead.lastMeetings.map((meeting, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{meeting.result}</span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{meeting.date}</span>
                        <Badge variant="outline" className="text-xs">{meeting.venue}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg">
                <h4 className="font-semibold mb-1">Home Record</h4>
                <p className="text-sm text-muted-foreground">{preview?.headToHead.homeRecord}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tactical Analysis Tab */}
        <TabsContent value="tactics" className="space-y-4">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Tactical Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{preview?.tacticalAnalysis}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Key Battles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {preview?.keyBattles.map((battle, i) => (
                <div key={i} className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-primary mb-1">{battle.title}</h4>
                  <p className="text-sm text-muted-foreground">{battle.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Prediction Card */}
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                AI Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold">{preview?.prediction.scoreline}</p>
                  <p className="text-muted-foreground">{preview?.prediction.winner} Win</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">{preview?.prediction.confidence}%</p>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{preview?.prediction.reasoning}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Betting Tips Tab */}
        <TabsContent value="betting">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Betting Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {preview?.bettingInsights.map((insight, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">{insight.market}</p>
                    <p className="font-semibold">{insight.tip}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">{insight.odds}</Badge>
                    <Badge className={getValueColor(insight.value)}>{insight.value}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Regenerate Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={generatePreview} disabled={isLoading} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Regenerate Preview
        </Button>
      </div>
    </div>
  );
};
