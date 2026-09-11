import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Trophy, Sparkles, Share2, Copy, CheckCheck, Flame, ShieldCheck, HelpCircle } from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

interface JackpotGame {
  id: number;
  match: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: string;
  homeProb: number;
  drawProb: number;
  awayProb: number;
  recommendedPick: '1' | 'X' | '2';
  doubleChance: '1X' | 'X2' | '12' | '1' | '2';
  isBanker: boolean;
  scoreline: string;
}

const SPORTPESA_MEGA_17: JackpotGame[] = [
  { id: 1, match: 'Newcastle vs Everton', homeTeam: 'Newcastle', awayTeam: 'Everton', league: 'Premier League', kickoff: 'Sat 15:00', homeProb: 58, drawProb: 24, awayProb: 18, recommendedPick: '1', doubleChance: '1X', isBanker: true, scoreline: '2-1' },
  { id: 2, match: 'Fulham vs West Ham', homeTeam: 'Fulham', awayTeam: 'West Ham', league: 'Premier League', kickoff: 'Sat 15:00', homeProb: 44, drawProb: 31, awayProb: 25, recommendedPick: '1', doubleChance: '1X', isBanker: false, scoreline: '1-1' },
  { id: 3, match: 'Bournemouth vs Wolves', homeTeam: 'Bournemouth', awayTeam: 'Wolves', league: 'Premier League', kickoff: 'Sat 15:00', homeProb: 52, drawProb: 26, awayProb: 22, recommendedPick: '1', doubleChance: '1X', isBanker: false, scoreline: '2-1' },
  { id: 4, match: 'Torino vs Fiorentina', homeTeam: 'Torino', awayTeam: 'Fiorentina', league: 'Serie A', kickoff: 'Sat 17:00', homeProb: 32, drawProb: 38, awayProb: 30, recommendedPick: 'X', doubleChance: '1X', isBanker: false, scoreline: '1-1' },
  { id: 5, match: 'Sevilla vs Real Sociedad', homeTeam: 'Sevilla', awayTeam: 'Real Sociedad', league: 'La Liga', kickoff: 'Sat 17:30', homeProb: 39, drawProb: 33, awayProb: 28, recommendedPick: '1', doubleChance: '1X', isBanker: false, scoreline: '1-0' },
  { id: 6, match: 'Lens vs Nice', homeTeam: 'Lens', awayTeam: 'Nice', league: 'Ligue 1', kickoff: 'Sat 18:00', homeProb: 48, drawProb: 32, awayProb: 20, recommendedPick: '1', doubleChance: '1X', isBanker: false, scoreline: '1-0' },
  { id: 7, match: 'Hoffenheim vs Wolfsburg', homeTeam: 'Hoffenheim', awayTeam: 'Wolfsburg', league: 'Bundesliga', kickoff: 'Sat 18:30', homeProb: 42, drawProb: 28, awayProb: 30, recommendedPick: '1', doubleChance: '12', isBanker: false, scoreline: '2-2' },
  { id: 8, match: 'Mallorca vs Osasuna', homeTeam: 'Mallorca', awayTeam: 'Osasuna', league: 'La Liga', kickoff: 'Sat 20:00', homeProb: 45, drawProb: 35, awayProb: 20, recommendedPick: '1', doubleChance: '1X', isBanker: false, scoreline: '1-0' },
  { id: 9, match: 'Lazio vs Bologna', homeTeam: 'Lazio', awayTeam: 'Bologna', league: 'Serie A', kickoff: 'Sat 20:45', homeProb: 46, drawProb: 30, awayProb: 24, recommendedPick: '1', doubleChance: '1X', isBanker: false, scoreline: '2-1' },
  { id: 10, match: 'Tusker FC vs Bandari', homeTeam: 'Tusker FC', awayTeam: 'Bandari', league: 'Kenya Premier League', kickoff: 'Sun 14:00', homeProb: 55, drawProb: 28, awayProb: 17, recommendedPick: '1', doubleChance: '1X', isBanker: true, scoreline: '2-0' },
  { id: 11, match: 'Gor Mahia vs Posta Rangers', homeTeam: 'Gor Mahia', awayTeam: 'Posta Rangers', league: 'Kenya Premier League', kickoff: 'Sun 15:00', homeProb: 65, drawProb: 22, awayProb: 13, recommendedPick: '1', doubleChance: '1', isBanker: true, scoreline: '2-0' },
  { id: 12, match: 'Feyenoord vs AZ Alkmaar', homeTeam: 'Feyenoord', awayTeam: 'AZ Alkmaar', league: 'Eredivisie', kickoff: 'Sun 15:30', homeProb: 54, drawProb: 26, awayProb: 20, recommendedPick: '1', doubleChance: '1X', isBanker: false, scoreline: '3-1' },
  { id: 13, match: 'Atalanta vs Roma', homeTeam: 'Atalanta', awayTeam: 'Roma', league: 'Serie A', kickoff: 'Sun 17:00', homeProb: 47, drawProb: 29, awayProb: 24, recommendedPick: '1', doubleChance: '12', isBanker: false, scoreline: '2-1' },
  { id: 14, match: 'Villarreal vs Athletic Club', homeTeam: 'Villarreal', awayTeam: 'Athletic Club', league: 'La Liga', kickoff: 'Sun 17:30', homeProb: 40, drawProb: 31, awayProb: 29, recommendedPick: 'X', doubleChance: '1X', isBanker: false, scoreline: '1-1' },
  { id: 15, match: 'Rennes vs Marseille', homeTeam: 'Rennes', awayTeam: 'Marseille', league: 'Ligue 1', kickoff: 'Sun 19:45', homeProb: 36, drawProb: 29, awayProb: 35, recommendedPick: '2', doubleChance: 'X2', isBanker: false, scoreline: '1-2' },
  { id: 16, match: 'Sporting CP vs Braga', homeTeam: 'Sporting CP', awayTeam: 'Braga', league: 'Primeira Liga', kickoff: 'Sun 20:30', homeProb: 61, drawProb: 23, awayProb: 16, recommendedPick: '1', doubleChance: '1', isBanker: true, scoreline: '3-1' },
  { id: 17, match: 'Betis vs Valencia', homeTeam: 'Betis', awayTeam: 'Valencia', league: 'La Liga', kickoff: 'Sun 21:00', homeProb: 50, drawProb: 28, awayProb: 22, recommendedPick: '1', doubleChance: '1X', isBanker: false, scoreline: '2-0' },
];

const BETIKA_MIDWEEK_15: JackpotGame[] = SPORTPESA_MEGA_17.slice(0, 15);
const MOZZART_GRAND_16: JackpotGame[] = SPORTPESA_MEGA_17.slice(1, 17);
const SPORTYBET_NIGERIA_12: JackpotGame[] = SPORTPESA_MEGA_17.slice(0, 12);

export default function JackpotPredictions() {
  const [activeJackpot, setActiveJackpot] = useState<'sportpesa' | 'betika' | 'mozzart' | 'sportybet'>('sportpesa');
  const [coverageMode, setCoverageMode] = useState<'bankers' | 'double_chance'>('bankers');
  const [copied, setCopied] = useState(false);
  const { addSelection, setIsOpen } = useBetSlip();

  const getActiveGames = (): JackpotGame[] => {
    switch (activeJackpot) {
      case 'sportpesa': return SPORTPESA_MEGA_17;
      case 'betika': return BETIKA_MIDWEEK_15;
      case 'mozzart': return MOZZART_GRAND_16;
      case 'sportybet': return SPORTYBET_NIGERIA_12;
    }
  };

  const currentGames = getActiveGames();
  const bankerCount = currentGames.filter(g => g.isBanker).length;

  const handleCopySlip = () => {
    const text = `🏆 PredictPro ${activeJackpot.toUpperCase()} Jackpot Prediction (${currentGames.length} Games)\n\n` +
      currentGames.map((g, i) => `${i + 1}. ${g.homeTeam} vs ${g.awayTeam} -> Pick: ${coverageMode === 'double_chance' ? g.doubleChance : g.recommendedPick} (${g.scoreline})`).join('\n') +
      `\n\n🎯 AI Banker Count: ${bankerCount}\n🇰🇪 🇳🇬 Generated free on https://predictpro.guru/jackpot-predictions`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Jackpot picks copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `🏆 *PredictPro ${activeJackpot.toUpperCase()} Jackpot Picks* (${currentGames.length} Games)\n\n` +
      currentGames.map((g, i) => `*${i + 1}.* ${g.homeTeam} vs ${g.awayTeam}\n👉 Pick: *${coverageMode === 'double_chance' ? g.doubleChance : g.recommendedPick}* | Pred: ${g.scoreline} ${g.isBanker ? '⭐ BANKER' : ''}`).join('\n\n') +
      `\n\n🔥 *Free AI Analysis & Bonus Target:* https://predictpro.guru/jackpot-predictions`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const handleLoadAllToSlip = () => {
    currentGames.forEach(g => {
      addSelection({
        id: `jackpot-${activeJackpot}-${g.id}`,
        match: `${g.homeTeam} vs ${g.awayTeam}`,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        league: g.league,
        market: coverageMode === 'double_chance' ? `Double Chance ${g.doubleChance}` : `1X2: ${g.recommendedPick}`,
        odds: g.recommendedPick === '1' ? +(100 / g.homeProb).toFixed(2) : g.recommendedPick === 'X' ? +(100 / g.drawProb).toFixed(2) : +(100 / g.awayProb).toFixed(2),
        confidence: g.recommendedPick === '1' ? g.homeProb : g.recommendedPick === 'X' ? g.drawProb : g.awayProb,
      });
    });
    setIsOpen(true);
    toast.success(`Loaded all ${currentGames.length} jackpot selections into your bet slip!`);
  };

  const jackpotFaqSchema = {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does PredictPro generate SportPesa and Betika jackpot predictions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PredictPro applies Poisson distribution and expected goals (xG) modeling to all 17 SportPesa and 15 Betika jackpot games. The algorithm identifies high-confidence banker matches and flags volatile fixtures where double chances (1X, X2) are mathematically required to secure cash bonus payouts.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I win jackpot bonuses using AI football predictions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Major jackpots (SportPesa 17, Betika 15, Mozzart 16) pay substantial bonus prizes starting at 12, 13, and 14 correct predictions. Using AI to secure the 4-6 undisputed banker games frees up double-chance combinations for the volatile mid-tier matches.'
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SportPesa & Betika Mega Jackpot Prediction Today (17 Games) | PredictPro"
        description="Free SportPesa Mega Jackpot prediction (17 games), Betika Midweek & Grand jackpot tips, and Mozzart Super Grand picks. AI banker games, double chance analysis, and bonus combinations."
        canonical="/jackpot-predictions"
        keywords="sportpesa mega jackpot prediction today, betika midweek jackpot prediction, betika grand jackpot prediction, mozzart super grand jackpot, sportybet jackpot nigeria, jackpot bonus predictions 17 games"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Jackpot Predictions', item: '/jackpot-predictions' }
        ]}
        structuredData={jackpotFaqSchema}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center text-xs text-muted-foreground gap-2 mb-4">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Jackpot Predictions</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3 flex-wrap">
            <Badge className="bg-red-700 text-white text-xs px-3 py-1 font-bold">🇰🇪 Kenya</Badge>
            <Badge className="bg-emerald-700 text-white text-xs px-3 py-1 font-bold">🇳🇬 Nigeria</Badge>
            <Badge variant="outline" className="text-xs">Bonus Target: 12-16 Correct</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">
            Mega Jackpot Predictions Today
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Algorithmically vetted combinations for SportPesa Mega Jackpot (17), Betika Midweek (15), Mozzart Super Grand (16), and SportyBet Nigeria.
          </p>
        </div>

        {/* Jackpot Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <Button
            variant={activeJackpot === 'sportpesa' ? 'default' : 'outline'}
            onClick={() => setActiveJackpot('sportpesa')}
            className="text-xs font-bold"
          >
            🏆 SportPesa Mega (17 Games)
          </Button>
          <Button
            variant={activeJackpot === 'betika' ? 'default' : 'outline'}
            onClick={() => setActiveJackpot('betika')}
            className="text-xs font-bold"
          >
            ⭐ Betika Midweek (15 Games)
          </Button>
          <Button
            variant={activeJackpot === 'mozzart' ? 'default' : 'outline'}
            onClick={() => setActiveJackpot('mozzart')}
            className="text-xs font-bold"
          >
            🎯 Mozzart Grand (16 Games)
          </Button>
          <Button
            variant={activeJackpot === 'sportybet' ? 'default' : 'outline'}
            onClick={() => setActiveJackpot('sportybet')}
            className="text-xs font-bold"
          >
            🇳🇬 SportyBet Super 12
          </Button>
        </div>

        {/* Action Panel */}
        <div className="p-4 rounded-xl bg-card border shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-muted-foreground">Pick Strategy:</span>
            <Button
              size="sm"
              variant={coverageMode === 'bankers' ? 'default' : 'outline'}
              onClick={() => setCoverageMode('bankers')}
              className="h-8 text-xs font-bold"
            >
              Pure Banker (1X2)
            </Button>
            <Button
              size="sm"
              variant={coverageMode === 'double_chance' ? 'default' : 'outline'}
              onClick={() => setCoverageMode('double_chance')}
              className="h-8 text-xs font-bold"
            >
              Double Chance Hedge
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopySlip}
              className="h-8 text-xs gap-1.5 font-medium"
            >
              {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy 17 Picks'}
            </Button>
            <Button
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-8 text-xs gap-1.5 font-bold bg-green-600 hover:bg-green-700 text-white"
            >
              <Share2 className="h-3.5 w-3.5" />
              WhatsApp Share
            </Button>
            <Button
              size="sm"
              onClick={handleLoadAllToSlip}
              className="h-8 text-xs gap-1.5 font-bold"
            >
              <Trophy className="h-3.5 w-3.5" />
              Load to Bet Slip
            </Button>
          </div>
        </div>

        {/* Jackpot Game Table */}
        <div className="space-y-3 mb-10">
          {currentGames.map((g, index) => (
            <Card key={g.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold text-muted-foreground">{g.league}</span>
                      <span className="text-[11px] text-muted-foreground">· {g.kickoff}</span>
                      {g.isBanker && (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] py-0 px-1.5">
                          <Flame className="h-2.5 w-2.5 mr-0.5" /> Banker
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {g.homeTeam} <span className="text-muted-foreground font-normal">vs</span> {g.awayTeam}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                  {/* 1X2 Probabilities */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={`px-2 py-0.5 rounded ${g.recommendedPick === '1' ? 'bg-primary/20 font-bold text-primary' : 'bg-muted'}`}>
                      1: {g.homeProb}%
                    </span>
                    <span className={`px-2 py-0.5 rounded ${g.recommendedPick === 'X' ? 'bg-primary/20 font-bold text-primary' : 'bg-muted'}`}>
                      X: {g.drawProb}%
                    </span>
                    <span className={`px-2 py-0.5 rounded ${g.recommendedPick === '2' ? 'bg-primary/20 font-bold text-primary' : 'bg-muted'}`}>
                      2: {g.awayProb}%
                    </span>
                  </div>

                  {/* AI Pick & Projected Score */}
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-primary">
                      Pick: {coverageMode === 'double_chance' ? g.doubleChance : g.recommendedPick}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Pred: {g.scoreline}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SEO Content & Strategy Guide */}
        <div className="p-6 rounded-xl bg-muted/30 border space-y-4 text-sm text-muted-foreground mb-10">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            AI Strategy for Winning SportPesa and Betika Jackpot Bonuses
          </h2>
          <p>
            Winning a 15, 16, or 17-game football jackpot outright is one of the highest-variance wagers in sports betting. However, consistent bettors target the lucrative <strong>cash bonuses</strong> (typically awarded for 12, 13, 14, 15, and 16 correct games).
          </p>
          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-background rounded-lg border">
              <span className="font-bold text-foreground block mb-1">1. Lock the Bankers</span>
              <p className="text-xs">Identify the 4-6 fixtures with &gt;60% statistical probability to leave budget for hedging volatile games.</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <span className="font-bold text-foreground block mb-1">2. Double Chance 1X &amp; X2</span>
              <p className="text-xs">In mid-table encounters with under 2.5 goal profiles, hedging with 1X or X2 prevents single-goal heartbreak.</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <span className="font-bold text-foreground block mb-1">3. Track Sharp Money</span>
              <p className="text-xs">Odds drift 2 hours before kickoff often indicates key player rotations that invalidate public betting patterns.</p>
            </div>
          </div>
        </div>

        {/* Related Hub Links */}
        <div className="p-4 rounded-xl bg-card border flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-medium text-muted-foreground">Explore More PredictPro Services:</span>
          <div className="flex flex-wrap gap-2">
            <Link to="/kpl-predictions"><Button variant="outline" size="sm">🇰🇪 KPL Predictions</Button></Link>
            <Link to="/predict"><Button variant="outline" size="sm">AI Pro Tips Today</Button></Link>
            <Link to="/btts"><Button variant="outline" size="sm">BTTS Predictions</Button></Link>
            <Link to="/value-bets"><Button variant="outline" size="sm">Value Bets (+EV)</Button></Link>
            <Link to="/accumulator"><Button variant="outline" size="sm">Acca Builder</Button></Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
