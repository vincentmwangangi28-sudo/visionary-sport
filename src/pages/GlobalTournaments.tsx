import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { GlobalSettingsModal } from '@/components/GlobalSettingsModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Globe,
  Calendar,
  Sparkles,
  TrendingUp,
  Flame,
  Award,
  ChevronRight,
  Search,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';

interface TournamentData {
  id: string;
  name: string;
  shortName: string;
  confederation: 'UEFA' | 'CAF' | 'CONMEBOL' | 'AFC' | 'CONCACAF' | 'FIFA';
  region: string;
  flag: string;
  season: string;
  status: 'In Progress' | 'Upcoming' | 'Knockout Stage' | 'Qualifiers';
  defendingChampion: string;
  topFavorite: {
    team: string;
    probability: number;
    odds: number;
  };
  contenders: { team: string; prob: number; flag: string }[];
  routePath?: string;
  keyDates: string;
  totalTeams: number;
  featuredMatches: {
    home: string;
    away: string;
    date: string;
    stage: string;
    tip: string;
    odds: number;
  }[];
}

const GLOBAL_TOURNAMENTS: TournamentData[] = [
  {
    id: 'ucl',
    name: 'UEFA Champions League',
    shortName: 'UCL',
    confederation: 'UEFA',
    region: 'Europe',
    flag: '🇪🇺',
    season: '2025/2026',
    status: 'Knockout Stage',
    defendingChampion: 'Real Madrid',
    topFavorite: { team: 'Real Madrid', probability: 27, odds: 3.5 },
    contenders: [
      { team: 'Real Madrid', prob: 27, flag: '🇪🇸' },
      { team: 'Manchester City', prob: 24, flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { team: 'Bayern Munich', prob: 17, flag: '🇩🇪' },
      { team: 'Arsenal', prob: 14, flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    ],
    routePath: '/champions-league-predictions',
    keyDates: 'Final: May 30, 2026 (Munich)',
    totalTeams: 36,
    featuredMatches: [
      { home: 'Real Madrid', away: 'Manchester City', date: 'Tomorrow, 20:00', stage: 'Quarter-Final', tip: 'Over 2.5 Goals', odds: 1.82 },
      { home: 'Bayern Munich', away: 'Arsenal', date: 'Thu, 20:00', stage: 'Quarter-Final', tip: 'BTTS - Yes', odds: 1.75 },
    ],
  },
  {
    id: 'afcon',
    name: 'Africa Cup of Nations',
    shortName: 'AFCON',
    confederation: 'CAF',
    region: 'Africa',
    flag: '🌍',
    season: '2025/2026',
    status: 'In Progress',
    defendingChampion: 'Ivory Coast',
    topFavorite: { team: 'Morocco', probability: 29, odds: 3.25 },
    contenders: [
      { team: 'Morocco', prob: 29, flag: '🇲🇦' },
      { team: 'Nigeria', prob: 22, flag: '🇳🇬' },
      { team: 'Senegal', prob: 20, flag: '🇸🇳' },
      { team: 'Egypt', prob: 15, flag: '🇪🇬' },
    ],
    routePath: '/afcon-predictions',
    keyDates: 'Tournament Hosts: Morocco',
    totalTeams: 24,
    featuredMatches: [
      { home: 'Morocco', away: 'Nigeria', date: 'Sat, 19:00', stage: 'Semi-Final', tip: 'Morocco Draw No Bet', odds: 1.68 },
      { home: 'Senegal', away: 'Egypt', date: 'Sun, 21:00', stage: 'Semi-Final', tip: 'Under 2.5 Goals', odds: 1.55 },
    ],
  },
  {
    id: 'libertadores',
    name: 'CONMEBOL Copa Libertadores',
    shortName: 'Libertadores',
    confederation: 'CONMEBOL',
    region: 'South America',
    flag: '🌎',
    season: '2026',
    status: 'In Progress',
    defendingChampion: 'Botafogo',
    topFavorite: { team: 'Palmeiras', probability: 26, odds: 3.75 },
    contenders: [
      { team: 'Palmeiras', prob: 26, flag: '🇧🇷' },
      { team: 'Flamengo', prob: 23, flag: '🇧🇷' },
      { team: 'River Plate', prob: 21, flag: '🇦🇷' },
      { team: 'Fluminense', prob: 12, flag: '🇧🇷' },
    ],
    routePath: '/predictions',
    keyDates: 'Final: Nov 28, 2026 (Buenos Aires)',
    totalTeams: 32,
    featuredMatches: [
      { home: 'Flamengo', away: 'River Plate', date: 'Wed, 23:30', stage: 'Round of 16', tip: 'Home Win', odds: 1.95 },
      { home: 'Palmeiras', away: 'São Paulo', date: 'Thu, 01:30', stage: 'Round of 16', tip: 'Palmeiras & Under 3.5', odds: 2.10 },
    ],
  },
  {
    id: 'worldcup',
    name: 'FIFA World Cup 2026 Qualifiers',
    shortName: 'World Cup 2026',
    confederation: 'FIFA',
    region: 'Global',
    flag: '🏆',
    season: '2026',
    status: 'Qualifiers',
    defendingChampion: 'Argentina',
    topFavorite: { team: 'France', probability: 22, odds: 4.5 },
    contenders: [
      { team: 'France', prob: 22, flag: '🇫🇷' },
      { team: 'Argentina', prob: 20, flag: '🇦🇷' },
      { team: 'England', prob: 18, flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { team: 'Brazil', prob: 16, flag: '🇧🇷' },
    ],
    routePath: '/world-cup-predictions',
    keyDates: 'Hosts: USA / Canada / Mexico',
    totalTeams: 48,
    featuredMatches: [
      { home: 'Brazil', away: 'Argentina', date: 'Next Fri, 22:00', stage: 'CONMEBOL Qualifier', tip: 'BTTS - Yes', odds: 1.88 },
      { home: 'Kenya', away: 'Ivory Coast', date: 'Next Sat, 16:00', stage: 'CAF Qualifier', tip: 'Ivory Coast Win', odds: 1.45 },
    ],
  },
  {
    id: 'caf_cl',
    name: 'CAF Champions League',
    shortName: 'CAF CL',
    confederation: 'CAF',
    region: 'Africa',
    flag: '🌍',
    season: '2025/2026',
    status: 'Knockout Stage',
    defendingChampion: 'Al Ahly SC',
    topFavorite: { team: 'Al Ahly SC', probability: 34, odds: 2.75 },
    contenders: [
      { team: 'Al Ahly SC', prob: 34, flag: '🇪🇬' },
      { team: 'Mamelodi Sundowns', prob: 28, flag: '🇿🇦' },
      { team: 'Espérance de Tunis', prob: 18, flag: '🇹🇳' },
      { team: 'TP Mazembe', prob: 10, flag: '🇨🇩' },
    ],
    routePath: '/predictions',
    keyDates: 'Two-legged Final: May 2026',
    totalTeams: 16,
    featuredMatches: [
      { home: 'Mamelodi Sundowns', away: 'Al Ahly SC', date: 'Sat, 15:00', stage: 'Semi-Final', tip: 'Under 2.5 Goals', odds: 1.62 },
    ],
  },
  {
    id: 'afc_cl',
    name: 'AFC Champions League Elite',
    shortName: 'AFC Elite',
    confederation: 'AFC',
    region: 'Asia & Middle East',
    flag: '🌏',
    season: '2025/2026',
    status: 'In Progress',
    defendingChampion: 'Al Ain',
    topFavorite: { team: 'Al Hilal', probability: 36, odds: 2.6 },
    contenders: [
      { team: 'Al Hilal', prob: 36, flag: '🇸🇦' },
      { team: 'Al Nassr', prob: 25, flag: '🇸🇦' },
      { team: 'Yokohama F. Marinos', prob: 16, flag: '🇯🇵' },
      { team: 'Ulsan HD', prob: 12, flag: '🇰🇷' },
    ],
    routePath: '/predictions',
    keyDates: 'Finals Hub: Saudi Arabia',
    totalTeams: 24,
    featuredMatches: [
      { home: 'Al Hilal', away: 'Al Nassr', date: 'Tue, 18:30', stage: 'Quarter-Final', tip: 'Al Hilal Win & Over 2.5', odds: 2.25 },
    ],
  },
  {
    id: 'concacaf_cc',
    name: 'CONCACAF Champions Cup',
    shortName: 'CONCACAF CC',
    confederation: 'CONCACAF',
    region: 'North & Central America',
    flag: '🌎',
    season: '2026',
    status: 'In Progress',
    defendingChampion: 'Pachuca',
    topFavorite: { team: 'Club América', probability: 28, odds: 3.4 },
    contenders: [
      { team: 'Club América', prob: 28, flag: '🇲🇽' },
      { team: 'Inter Miami CF', prob: 24, flag: '🇺🇸' },
      { team: 'Columbus Crew', prob: 19, flag: '🇺🇸' },
      { team: 'Monterrey', prob: 17, flag: '🇲🇽' },
    ],
    routePath: '/predictions',
    keyDates: 'Final: June 2026',
    totalTeams: 27,
    featuredMatches: [
      { home: 'Club América', away: 'Inter Miami CF', date: 'Wed, 02:00', stage: 'Semi-Final', tip: 'Both Teams to Score', odds: 1.70 },
    ],
  },
];

export default function GlobalTournaments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConfed, setSelectedConfed] = useState<string>('all');
  const { region } = useGeoRegion();
  const { formatOdds } = useUserPreferences();
  const { currencyConfig } = useCurrency();

  const filteredTournaments = GLOBAL_TOURNAMENTS.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.topFavorite.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesConfed = selectedConfed === 'all' || t.confederation === selectedConfed;
    return matchesSearch && matchesConfed;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Global Football Tournaments & Continental Championships | PredictPro"
        description="Comprehensive tournament predictions for UEFA Champions League, AFCON, Copa Libertadores, AFC Champions League, FIFA World Cup Qualifiers, and CONCACAF."
      />
      <Navbar />

      <main className="container mx-auto px-4 py-24 pb-20 md:pb-12 max-w-6xl flex-1">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-card/60 p-6 rounded-2xl border border-border/70 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-primary-foreground font-bold gap-1 text-xs">
                <Trophy className="h-3.5 w-3.5" /> Continental & World Hub
              </Badge>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                {region.flag} {region.name} Priority
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <Globe className="h-7 w-7 text-primary" />
              Global Tournaments & Title Probabilities
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Real-time AI probability models, bracket trajectories, and value picks for marquee continental & international football championships.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <GlobalSettingsModal triggerClassName="h-9 px-3.5 font-bold shadow-sm" />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-none">
            {[
              { id: 'all', label: 'All Championships', flag: '🌐' },
              { id: 'UEFA', label: 'UEFA (Europe)', flag: '🇪🇺' },
              { id: 'CAF', label: 'CAF (Africa)', flag: '🌍' },
              { id: 'CONMEBOL', label: 'CONMEBOL (S. America)', flag: '🌎' },
              { id: 'CONCACAF', label: 'CONCACAF (N. America)', flag: '🌎' },
              { id: 'AFC', label: 'AFC (Asia/ME)', flag: '🌏' },
              { id: 'FIFA', label: 'FIFA World Cup', flag: '🏆' },
            ].map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={selectedConfed === c.id ? 'default' : 'outline'}
                onClick={() => setSelectedConfed(c.id)}
                className="text-xs h-8 gap-1.5 flex-shrink-0 font-medium"
              >
                <span>{c.flag}</span>
                <span>{c.label}</span>
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 flex-shrink-0">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tournament, team..."
              className="pl-9 h-8 text-xs bg-muted/30"
            />
          </div>
        </div>

        {/* Tournament Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {filteredTournaments.map((t) => (
            <Card
              key={t.id}
              className="border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden group shadow-sm hover:shadow-md"
            >
              <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{t.flag}</span>
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                        {t.name}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-foreground">{t.confederation}</span>
                        <span>•</span>
                        <span>{t.region}</span>
                        <span>•</span>
                        <span className="text-primary font-bold">{t.season}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={t.status === 'Knockout Stage' ? 'default' : 'secondary'}
                    className="text-[11px] font-bold"
                  >
                    {t.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
                {/* Defending Champion & Key Dates */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-2.5 rounded-xl border border-border/30">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Reigning Champion</span>
                    <span className="font-bold flex items-center gap-1 text-foreground">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      {t.defendingChampion}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Timeline & Info</span>
                    <span className="font-medium text-foreground truncate block">{t.keyDates}</span>
                  </div>
                </div>

                {/* AI Probability Engine Radar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      AI Title Win Probability
                    </span>
                    <span className="text-[11px] text-muted-foreground">Outright Favorites</span>
                  </div>

                  <div className="space-y-1.5">
                    {t.contenders.map((c) => (
                      <div key={c.team} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            <span>{c.flag}</span>
                            <span>{c.team}</span>
                          </span>
                          <span className="font-mono font-bold text-primary">{c.prob}%</span>
                        </div>
                        <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-emerald-500 h-full rounded-full transition-all duration-700"
                            style={{ width: `${c.prob}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Featured Upcoming Match */}
                {t.featuredMatches.length > 0 && (
                  <div className="pt-2 border-t border-border/40">
                    <div className="text-[11px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-red-500" /> Key Marquee Fixture
                    </div>
                    {t.featuredMatches.slice(0, 1).map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-card p-2.5 rounded-lg border border-border/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-foreground">
                            {m.home} vs {m.away}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {m.stage} • {m.date}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30">
                            {m.tip}
                          </Badge>
                          <div className="text-[11px] font-mono font-bold text-foreground mt-0.5">
                            @{formatOdds(m.odds)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action CTA */}
                <div className="pt-2">
                  <Link to={t.routePath || '/predictions'}>
                    <Button className="w-full h-9 text-xs font-bold gap-1.5" variant="default">
                      <span>View {t.shortName} Predictions & Match Center</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Global Competitions Quick Index Footer */}
        <Card className="border-border/70 bg-gradient-to-br from-card/80 to-muted/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Looking for Regional Domestic Leagues?
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Access Premier League, La Liga, Serie A, Bundesliga, KPL, NPFL, PSL, MLS, and Brasileirão in our Predictions Hub.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link to="/premier-league-predictions">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    🏴󠁧󠁢󠁥󠁮󠁧󠁿 EPL
                  </Button>
                </Link>
                <Link to="/la-liga-predictions">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    🇪🇸 La Liga
                  </Button>
                </Link>
                <Link to="/kpl-predictions">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    🇰🇪 KPL
                  </Button>
                </Link>
                <Link to="/afcon-predictions">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    🌍 AFCON
                  </Button>
                </Link>
                <Link to="/champions-league-predictions">
                  <Button variant="default" size="sm" className="text-xs h-8">
                    🏆 UCL Hub
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
