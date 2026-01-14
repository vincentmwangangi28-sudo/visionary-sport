import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Trophy, MessageSquare, BarChart3, Brain, FileText, Share2 } from 'lucide-react';
import { ExpertAnalysis } from '@/components/ExpertAnalysis';
import { FormAnalysisChart } from '@/components/FormAnalysisChart';
import { LiveMatchChat } from '@/components/LiveMatchChat';
import { SocialShare } from '@/components/SocialShare';
import { ShareableCard } from '@/components/ShareableCard';
import { MatchPreviewWriter } from '@/components/MatchPreviewWriter';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { usePredictions } from '@/hooks/usePredictions';

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { matches } = useLiveMatches();
  const { predictions } = usePredictions();

  // Find the match from live matches or predictions
  const liveMatch = matches.find(m => m.id === matchId);
  const prediction = predictions.find(p => p.match_id === matchId);

  const match = liveMatch || (prediction ? {
    id: prediction.match_id,
    homeTeam: prediction.home_team,
    awayTeam: prediction.away_team,
    league: prediction.league,
    time: new Date(prediction.match_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    homeScore: null,
    awayScore: null,
    status: 'Upcoming',
    prediction: prediction.prediction,
    confidence: prediction.confidence
  } : null);

  if (!match && !prediction) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Match Not Found</h1>
            <p className="text-muted-foreground mb-6">The match you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const matchTitle = `${match?.homeTeam || prediction?.home_team} vs ${match?.awayTeam || prediction?.away_team}`;
  const league = match?.league || prediction?.league || 'Football';

  // Structured data for SEO
  const sportsEventSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": matchTitle,
    "description": `AI predictions and expert analysis for ${matchTitle} in ${league}`,
    "startDate": prediction?.match_date || new Date().toISOString(),
    "location": {
      "@type": "Place",
      "name": league
    },
    "competitor": [
      {
        "@type": "SportsTeam",
        "name": match?.homeTeam || prediction?.home_team
      },
      {
        "@type": "SportsTeam",
        "name": match?.awayTeam || prediction?.away_team
      }
    ],
    "eventStatus": liveMatch ? "https://schema.org/EventScheduled" : "https://schema.org/EventScheduled"
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{matchTitle} - Match Analysis | PredictPro Guru</title>
        <meta name="description" content={`Get AI predictions, expert analysis, and live chat for ${matchTitle}. ${league} match details and betting tips.`} />
        <meta property="og:title" content={`${matchTitle} - AI Prediction | PredictPro Guru`} />
        <meta property="og:description" content={`Expert analysis and AI predictions for ${matchTitle}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${matchTitle} - AI Prediction`} />
        <link rel="canonical" href={`https://www.predictpro.guru/match/${matchId}`} />
        <script type="application/ld+json">
          {JSON.stringify(sportsEventSchema)}
        </script>
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Match Header */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-sm">
                  <Trophy className="w-3 h-3 mr-1" />
                  {league}
                </Badge>
                {liveMatch && (
                  <Badge variant="destructive" className="animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full mr-2" />
                    LIVE
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                <div className="text-right">
                  <h2 className="text-2xl md:text-4xl font-bold">{match?.homeTeam || prediction?.home_team}</h2>
                </div>
                <div className="text-center">
                  {liveMatch ? (
                    <div className="flex items-center gap-4 px-6 py-3 bg-background/50 rounded-xl backdrop-blur">
                      <span className="text-4xl font-bold text-primary">{liveMatch.homeScore ?? 0}</span>
                      <span className="text-2xl text-muted-foreground">:</span>
                      <span className="text-4xl font-bold text-primary">{liveMatch.awayScore ?? 0}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-xl">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-lg font-semibold">{match?.time || 'TBD'}</span>
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <h2 className="text-2xl md:text-4xl font-bold">{match?.awayTeam || prediction?.away_team}</h2>
                </div>
              </div>

              {/* AI Prediction Summary */}
              {(match?.prediction || prediction?.prediction) && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                    <span className="text-2xl">🔮</span>
                    <span className="font-semibold">AI Prediction:</span>
                    <span className="text-primary font-bold">{match?.prediction || prediction?.prediction}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary-glow"
                        style={{ width: `${match?.confidence || prediction?.confidence}%` }}
                      />
                    </div>
                    <span className="font-bold text-primary">{match?.confidence || prediction?.confidence}%</span>
                  </div>
                  <SocialShare 
                    title={matchTitle}
                    prediction={match?.prediction || prediction?.prediction || ''}
                    homeTeam={match?.homeTeam || prediction?.home_team || ''}
                    awayTeam={match?.awayTeam || prediction?.away_team || ''}
                    league={league}
                    confidence={match?.confidence || prediction?.confidence || 0}
                  />
                  <ShareableCard
                    homeTeam={match?.homeTeam || prediction?.home_team || ''}
                    awayTeam={match?.awayTeam || prediction?.away_team || ''}
                    league={league}
                    prediction={match?.prediction || prediction?.prediction || ''}
                    confidence={match?.confidence || prediction?.confidence || 0}
                    matchDate={prediction?.match_date}
                    variant="full"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="preview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
              <TabsTrigger value="preview" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Match Preview</span>
                <span className="sm:hidden">Preview</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Expert Analysis</span>
                <span className="sm:hidden">Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="form" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Form Analysis</span>
                <span className="sm:hidden">Form</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Live Chat</span>
                <span className="sm:hidden">Chat</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-6">
              <MatchPreviewWriter 
                homeTeam={match?.homeTeam || prediction?.home_team || ''} 
                awayTeam={match?.awayTeam || prediction?.away_team || ''}
                league={league}
                matchDate={prediction?.match_date || new Date().toISOString()}
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <ExpertAnalysis 
                matchId={matchId || ''} 
                homeTeam={match?.homeTeam || prediction?.home_team || ''} 
                awayTeam={match?.awayTeam || prediction?.away_team || ''}
                league={league}
                prediction={match?.prediction || prediction?.prediction || ''}
                confidence={match?.confidence || prediction?.confidence || 0}
              />
            </TabsContent>

            <TabsContent value="form" className="space-y-6">
              <FormAnalysisChart 
                homeTeam={match?.homeTeam || prediction?.home_team || ''} 
                awayTeam={match?.awayTeam || prediction?.away_team || ''}
              />
            </TabsContent>

            <TabsContent value="chat">
              <LiveMatchChat 
                matchId={matchId || ''} 
                homeTeam={match?.homeTeam || prediction?.home_team || ''}
                awayTeam={match?.awayTeam || prediction?.away_team || ''}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
