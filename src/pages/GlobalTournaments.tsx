import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TeamLogo } from '@/components/TeamLogo';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Search,
} from 'lucide-react';

interface TournamentData {
  id: string;
  name: string;
  shortName: string;
  confederation: 'UEFA' | 'CAF' | 'CONMEBOL' | 'AFC' | 'CONCACAF' | 'FIFA';
  region: string;
  season: string;
  status: 'In Progress' | 'Upcoming' | 'Knockout Stage' | 'Qualifiers';
  defendingChampion: string;
  topFavorite: {
    team: string;
    probability: number;
    odds: number;
  };
  contenders: { team: string; prob: number; code: string }[];
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

const DOMESTIC_LEAGUES = [
  { name: 'Premier League', country: 'England', code: 'ENG', to: '/premier-league-predictions', leader: 'Liverpool', matches: 380 },
  { name: 'LaLiga', country: 'Spain', code: 'ESP', to: '/la-liga-predictions', leader: 'Real Madrid', matches: 380 },
  { name: 'Serie A', country: 'Italy', code: 'ITA', to: '/serie-a-predictions', leader: 'Inter Milan', matches: 380 },
  { name: 'Bundesliga', country: 'Germany', code: 'GER', to: '/bundesliga-predictions', leader: 'Bayern Munich', matches: 306 },
  { name: 'Ligue 1', country: 'France', code: 'FRA', to: '/ligue-1-predictions', leader: 'Paris Saint-Germain', matches: 306 },
  { name: 'FKF Premier League', country: 'Kenya', code: 'KEN', to: '/kpl-predictions', leader: 'Gor Mahia', matches: 306 },
  { name: 'Eredivisie', country: 'Netherlands', code: 'NED', to: '/eredivisie-predictions', leader: 'PSV Eindhoven', matches: 306 },
  { name: 'Major League Soccer', country: 'USA & Canada', code: 'MLS', to: '/mls-predictions', leader: 'Inter Miami', matches: 510 },
  { name: 'Brasileirão Série A', country: 'Brazil', code: 'BRA', to: '/brazilian-serie-a-predictions', leader: 'Palmeiras', matches: 380 },
  { name: 'Saudi Pro League', country: 'Saudi Arabia', code: 'KSA', to: '/saudi-pro-league-predictions', leader: 'Al Hilal', matches: 306 },
  { name: 'South Africa PSL', country: 'South Africa', code: 'RSA', to: '/south-africa-psl-predictions', leader: 'Mamelodi Sundowns', matches: 240 },
  { name: 'EFL Championship', country: 'England', code: 'EFL', to: '/championship-predictions', leader: 'Leeds United', matches: 552 },
];

const GLOBAL_TOURNAMENTS: TournamentData[] = [
  {
    id: 'ucl',
    name: 'UEFA Champions League',
    shortName: 'UCL',
    confederation: 'UEFA',
    region: 'Europe',
    season: '2025/2026',
    status: 'Knockout Stage',
    defendingChampion: 'Real Madrid',
    topFavorite: { team: 'Real Madrid', probability: 27, odds: 3.5 },
    contenders: [
      { team: 'Real Madrid', prob: 27, code: 'ESP' },
      { team: 'Manchester City', prob: 24, code: 'ENG' },
      { team: 'Bayern Munich', prob: 17, code: 'GER' },
      { team: 'Arsenal', prob: 14, code: 'ENG' },
    ],
    routePath: '/champions-league-predictions',
    keyDates: 'Final: May 30, 2026 (Munich)',
    totalTeams: 36,
    featuredMatches: [
      { home: 'Arsenal', away: 'Paris Saint-Germain', date: '19:00 UTC', stage: 'League Phase', tip: 'Arsenal Win', odds: 1.75 },
      { home: 'Bayer Leverkusen', away: 'AC Milan', date: '19:00 UTC', stage: 'League Phase', tip: 'BTTS - Yes', odds: 1.68 },
    ],
  },
  {
    id: 'afcon',
    name: 'Africa Cup of Nations',
    shortName: 'AFCON',
    confederation: 'CAF',
    region: 'Africa',
    season: '2026/2027',
    status: 'Qualifiers',
    defendingChampion: 'Ivory Coast',
    topFavorite: { team: 'Morocco', probability: 29, odds: 3.25 },
    contenders: [
      { team: 'Morocco', prob: 29, code: 'MAR' },
      { team: 'Nigeria', prob: 22, code: 'NGA' },
      { team: 'Senegal', prob: 20, code: 'SEN' },
      { team: 'Egypt', prob: 15, code: 'EGY' },
    ],
    routePath: '/afcon-predictions',
    keyDates: 'Hosts: Morocco',
    totalTeams: 24,
    featuredMatches: [
      { home: 'Guinea', away: 'Kenya', date: '16:00 UTC', stage: 'Group Qualifier', tip: 'Guinea Win', odds: 1.62 },
    ],
  },
  {
    id: 'libertadores',
    name: 'CONMEBOL Copa Libertadores',
    shortName: 'Libertadores',
    confederation: 'CONMEBOL',
    region: 'South America',
    season: '2026',
    status: 'In Progress',
    defendingChampion: 'Botafogo',
    topFavorite: { team: 'Palmeiras', probability: 26, odds: 3.75 },
    contenders: [
      { team: 'Palmeiras', prob: 26, code: 'BRA' },
      { team: 'Flamengo', prob: 23, code: 'BRA' },
      { team: 'River Plate', prob: 21, code: 'ARG' },
      { team: 'Fluminense', prob: 12, code: 'BRA' },
    ],
    routePath: '/copa-libertadores-predictions',
    keyDates: 'Final: Nov 28, 2026 (Buenos Aires)',
    totalTeams: 32,
    featuredMatches: [
      { home: 'Flamengo', away: 'River Plate', date: '23:30 UTC', stage: 'Round of 16', tip: 'Home Win', odds: 1.95 },
    ],
  },
  {
    id: 'worldcup',
    name: 'FIFA World Cup 2026 Qualifiers',
    shortName: 'World Cup 2026',
    confederation: 'FIFA',
    region: 'Global',
    season: '2026',
    status: 'Qualifiers',
    defendingChampion: 'Argentina',
    topFavorite: { team: 'France', probability: 22, odds: 4.5 },
    contenders: [
      { team: 'France', prob: 22, code: 'FRA' },
      { team: 'Argentina', prob: 20, code: 'ARG' },
      { team: 'England', prob: 18, code: 'ENG' },
      { team: 'Brazil', prob: 16, code: 'BRA' },
    ],
    routePath: '/world-cup-predictions',
    keyDates: 'Hosts: USA / Canada / Mexico',
    totalTeams: 48,
    featuredMatches: [
      { home: 'Brazil', away: 'Argentina', date: '22:00 UTC', stage: 'CONMEBOL Qualifier', tip: 'BTTS - Yes', odds: 1.88 },
    ],
  },
  {
    id: 'caf_cl',
    name: 'CAF Champions League',
    shortName: 'CAF CL',
    confederation: 'CAF',
    region: 'Africa',
    season: '2025/2026',
    status: 'Knockout Stage',
    defendingChampion: 'Al Ahly SC',
    topFavorite: { team: 'Al Ahly SC', probability: 34, odds: 2.75 },
    contenders: [
      { team: 'Al Ahly SC', prob: 34, code: 'EGY' },
      { team: 'Mamelodi Sundowns', prob: 28, code: 'RSA' },
      { team: 'Espérance de Tunis', prob: 18, code: 'TUN' },
      { team: 'TP Mazembe', prob: 10, code: 'COD' },
    ],
    routePath: '/afcon-predictions',
    keyDates: 'Two-legged Final: May 2026',
    totalTeams: 16,
    featuredMatches: [
      { home: 'Mamelodi Sundowns', away: 'Al Ahly SC', date: '15:00 UTC', stage: 'Semi-Final', tip: 'Under 2.5 Goals', odds: 1.62 },
    ],
  },
  {
    id: 'afc_cl',
    name: 'AFC Champions League Elite',
    shortName: 'AFC Elite',
    confederation: 'AFC',
    region: 'Asia & Middle East',
    season: '2025/2026',
    status: 'In Progress',
    defendingChampion: 'Al Ain',
    topFavorite: { team: 'Al Hilal', probability: 36, odds: 2.6 },
    contenders: [
      { team: 'Al Hilal', prob: 36, code: 'KSA' },
      { team: 'Al Nassr', prob: 25, code: 'KSA' },
      { team: 'Yokohama F. Marinos', prob: 16, code: 'JPN' },
      { team: 'Ulsan HD', prob: 12, code: 'KOR' },
    ],
    routePath: '/saudi-pro-league-predictions',
    keyDates: 'Finals Hub: Saudi Arabia',
    totalTeams: 24,
    featuredMatches: [
      { home: 'Al Hilal', away: 'Al Nassr', date: '18:30 UTC', stage: 'Quarter-Final', tip: 'Al Hilal Win & Over 2.5', odds: 2.25 },
    ],
  },
];

export default function GlobalTournaments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConfed, setSelectedConfed] = useState<string>('all');
  const { formatOdds } = useUserPreferences();

  const filteredTournaments = GLOBAL_TOURNAMENTS.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.topFavorite.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesConfed = selectedConfed === 'all' || t.confederation === selectedConfed;
    return matchesSearch && matchesConfed;
  });

  const filteredLeagues = DOMESTIC_LEAGUES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Football Leagues, Cups & Championships Directory | PredictPro"
        description="Browse Premier League, UEFA Champions League, LaLiga, Serie A, Bundesliga, AFCON, Copa Libertadores, and FIFA World Cup match previews and standings."
      />
      <Navbar />

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 flex-1 space-y-8">
        {/* Broadcast Header Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Competitions Directory · 40+ Leagues &amp; Cups
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Leagues, Cups &amp; International Tournaments
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Explore domestic league hubs, outright title probabilities, and upcoming fixtures across Europe, Africa, the Americas, and Asia.
            </p>
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search league, country, or club..."
              className="pl-9 h-9 text-xs bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Section 1: Major Domestic Leagues Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Major Domestic Leagues
            </h2>
            <Link to="/standings" className="text-xs font-semibold text-primary hover:underline">
              View All League Tables →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredLeagues.map((lg) => (
              <Link
                key={lg.to}
                to={lg.to}
                className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors flex items-center justify-between gap-3 group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-8 w-8 rounded-lg bg-muted font-mono text-[10px] font-bold text-foreground flex items-center justify-center shrink-0">
                    {lg.code}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {lg.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lg.country} · Leader: {lg.leader}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* Section 2: Continental & International Championships */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Continental &amp; World Championships
            </h2>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'UEFA', label: 'UEFA' },
                { id: 'CAF', label: 'CAF' },
                { id: 'CONMEBOL', label: 'CONMEBOL' },
                { id: 'CONCACAF', label: 'CONCACAF' },
                { id: 'AFC', label: 'AFC' },
                { id: 'FIFA', label: 'FIFA' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedConfed(c.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    selectedConfed === c.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTournaments.map((t) => (
              <Card
                key={t.id}
                className="border-border hover:border-primary/40 transition-colors flex flex-col justify-between overflow-hidden shadow-2xs"
              >
                <CardHeader className="pb-3 bg-muted/30 border-b border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {t.name}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-foreground">{t.confederation}</span>
                        <span>·</span>
                        <span>{t.region}</span>
                        <span>·</span>
                        <span className="font-mono text-primary font-semibold">{t.season}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-[11px] font-semibold shrink-0">
                      {t.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border border-border/60">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Holder</span>
                      <span className="font-bold text-foreground">{t.defendingChampion}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Schedule</span>
                      <span className="font-medium text-foreground truncate block">{t.keyDates}</span>
                    </div>
                  </div>

                  {/* Outright Contenders */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Title Contenders</span>
                      <span className="text-[11px] text-muted-foreground">Win Prob</span>
                    </div>

                    <div className="space-y-1.5">
                      {t.contenders.map((c) => (
                        <div key={c.team} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5">
                              <TeamLogo team={c.team} size="xs" badgeOnly />
                              <span className="text-foreground">{c.team}</span>
                            </span>
                            <span className="font-mono tabular-nums font-bold text-primary">{c.prob}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${c.prob}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Featured Match */}
                  {t.featuredMatches.length > 0 && (
                    <div className="pt-2 border-t border-border/60">
                      {t.featuredMatches.slice(0, 1).map((m, idx) => (
                        <div
                          key={idx}
                          className="bg-muted/20 p-2.5 rounded-lg border border-border/60 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate">
                              {m.home} v {m.away}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {m.stage} · {m.date}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-bold text-primary block">{m.tip}</span>
                            <span className="text-[11px] font-mono tabular-nums font-semibold text-foreground">
                              {formatOdds(m.odds)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link to={t.routePath || '/'}>
                    <Button className="w-full h-8 text-xs font-bold gap-1" variant="outline">
                      <span>Open {t.shortName} Hub</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
