import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePersonalizedDashboard } from '@/hooks/usePersonalizedDashboard';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { PinnedTeamCard } from '@/components/PinnedTeamCard';
import { PinnedLeagueCard } from '@/components/PinnedLeagueCard';
import { PinSelectionModal } from '@/components/PinSelectionModal';
import { useAutomatedAlerts } from '@/hooks/useAutomatedAlerts';
import { TeamLogo } from '@/components/TeamLogo';
import { Link } from 'react-router-dom';
import {
  Pin,
  Shield,
  Trophy,
  SlidersHorizontal,
  Calendar,
  Sparkles,
  Plus,
  PlusCircle,
  TrendingUp,
  UserCheck,
  LogIn,
  Layers,
  Flame,
  ArrowRight,
  Activity,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  BellRing,
  Radio,
  Volume2,
  Send,
} from 'lucide-react';

export default function PersonalizedDashboard() {
  const {
    isAuthenticated,
    user,
    pinnedLeagues,
    pinnedTeams,
    pinnedTeamStatsList,
    pinnedLeagueOverviews,
    personalizedMatches,
    unpinLeague,
    unpinTeam,
    resetPins,
  } = usePersonalizedDashboard();

  const { addSelection } = useBetSlip();
  const { formatOdds, formatKickoff, getKickoffRelative } = useUserPreferences();
  const {
    config: alertConfig,
    permission: pushPermission,
    testAlert,
    enableBrowserPush,
  } = useAutomatedAlerts();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'teams' | 'leagues' | 'matches'>('all');

  // Display user name or fallback
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Pro Bettor';

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Personalized Match Dashboard | Pinned Leagues & Team Stats | PredictPro"
        description="Your tailored football dashboard. Pin your preferred leagues, track real-time club form, clean sheets, and receive AI prediction alerts for your favorite teams."
        keywords="personalized football dashboard, pinned leagues, team stats tracker, football form guide, AI match predictions favorite teams"
      />

      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 py-20 pb-24 md:pb-12 max-w-7xl flex-1">
        {/* HERO / WELCOME HEADER */}
        <div className="mb-6 rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold px-2.5 py-1 gap-1.5 bg-primary/10 text-primary border-primary/20"
                >
                  <Pin className="h-3.5 w-3.5 fill-primary/30" />
                  Personalized Command Center
                </Badge>

                {isAuthenticated ? (
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Cloud Synced ({user?.email})
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5"
                  >
                    Guest Preview Mode
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Welcome back, {displayName}
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Your custom match headquarters with quick access to your pinned leagues, club form
                analytics, and tailor-made AI prediction insights.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap flex-shrink-0">
              <Button
                onClick={() => setModalOpen(true)}
                className="gap-2 font-bold text-xs sm:text-sm shadow-sm"
              >
                <Pin className="h-4 w-4" />
                Customize Pins
              </Button>

              {!isAuthenticated && (
                <Link to="/auth">
                  <Button variant="outline" className="gap-2 text-xs sm:text-sm">
                    <LogIn className="h-4 w-4" />
                    Sign In to Sync
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Guest notice banner */}
          {!isAuthenticated && (
            <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>
                  <strong>Tip:</strong> Create a free account to permanently sync your pinned
                  leagues and team stats across all your phones and laptops.
                </span>
              </div>
              <Link to="/auth">
                <Button size="sm" variant="outline" className="h-7 text-xs font-semibold whitespace-nowrap">
                  Sign In Now
                </Button>
              </Link>
            </div>
          )}

          {/* Quick Stats Badges Bar */}
          <div className="mt-5 pt-4 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-background/80 border border-border/40">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Pinned Clubs</p>
                <p className="text-base font-black text-foreground">{pinnedTeams.length} Selected</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-background/80 border border-border/40">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Pinned Leagues</p>
                <p className="text-base font-black text-foreground">{pinnedLeagues.length} Selected</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-background/80 border border-border/40">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Tailored Matches</p>
                <p className="text-base font-black text-foreground">{personalizedMatches.length} Upcoming</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/80 border border-border/40">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Shortcuts</p>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="text-xs font-bold text-primary hover:underline block text-left"
                >
                  Manage Pins &rarr;
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(true)}
                className="h-8 w-8 text-primary"
                title="Add More Pins"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* AUTOMATED ALERTS STATUS & CONTROLS */}
        <div className="mb-6 rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-foreground">
                  Automated Matchday Alerts Active
                </span>
                <Badge
                  variant="outline"
                  className={
                    pushPermission === 'granted'
                      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold'
                      : 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px] font-bold'
                  }
                >
                  {pushPermission === 'granted' ? 'Native Push Active' : 'In-App & Audio Only'}
                </Badge>
                {alertConfig.soundEnabled && (
                  <Badge variant="secondary" className="text-[10px] font-semibold gap-1">
                    <Volume2 className="h-2.5 w-2.5" /> Audio Chimes
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitoring {pinnedTeams.length} clubs & {pinnedLeagues.length} tournaments. Kickoff alerts fire {alertConfig.kickoffLeadMinutes}m prior, plus {alertConfig.minConfidenceThreshold}%+ banker picks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {pushPermission !== 'granted' && (
              <Button
                variant="outline"
                size="sm"
                onClick={enableBrowserPush}
                className="h-8 text-xs font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10"
              >
                <Radio className="h-3 w-3 animate-pulse" />
                Enable Push
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => testAlert('pinned_club')}
              className="h-8 text-xs font-semibold gap-1.5"
              title="Dispatches a test match alert to verify sound and push"
            >
              <Send className="h-3 w-3" />
              Test Alert
            </Button>
            <Link to="/preferences">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
                title="Configure alert rules, thresholds, and lead times"
              >
                Rules &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {/* DASHBOARD VIEWS NAVIGATION */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="space-y-6"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-2">
            <TabsList className="h-10 p-1 bg-muted/60">
              <TabsTrigger value="all" className="text-xs font-semibold gap-1.5 px-3">
                <Layers className="h-3.5 w-3.5" />
                All Pinned
              </TabsTrigger>
              <TabsTrigger value="teams" className="text-xs font-semibold gap-1.5 px-3">
                <Shield className="h-3.5 w-3.5" />
                Team Stats ({pinnedTeams.length})
              </TabsTrigger>
              <TabsTrigger value="leagues" className="text-xs font-semibold gap-1.5 px-3">
                <Trophy className="h-3.5 w-3.5" />
                Leagues ({pinnedLeagues.length})
              </TabsTrigger>
              <TabsTrigger value="matches" className="text-xs font-semibold gap-1.5 px-3">
                <Calendar className="h-3.5 w-3.5" />
                Personalized Matches ({personalizedMatches.length})
              </TabsTrigger>
            </TabsList>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="text-xs h-8 gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5 text-primary" />
              Add Clubs or Leagues
            </Button>
          </div>

          {/* TAB 1: ALL PINNED (OVERVIEW) */}
          <TabsContent value="all" className="space-y-8 mt-0">
            {/* PINNED TEAMS SECTION */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Pinned Club Performance</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  className="text-xs text-primary hover:text-primary gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Club
                </Button>
              </div>

              {pinnedTeamStatsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedTeamStatsList.map((team) => (
                    <PinnedTeamCard key={team.name} team={team} onUnpin={unpinTeam} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed">
                  <Shield className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <h3 className="font-bold text-sm">No Clubs Pinned Yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Pin your favorite football clubs to track their win rate, clean sheets, and next AI
                    match projections.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setModalOpen(true)}
                    className="mt-4 gap-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Select Favorite Clubs
                  </Button>
                </Card>
              )}
            </section>

            {/* PINNED LEAGUES SECTION */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-foreground">Pinned Leagues Snapshot</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  className="text-xs text-primary hover:text-primary gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add League
                </Button>
              </div>

              {pinnedLeagueOverviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedLeagueOverviews.map((league) => (
                    <PinnedLeagueCard key={league.name} league={league} onUnpin={unpinLeague} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed">
                  <Trophy className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <h3 className="font-bold text-sm">No Leagues Pinned Yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Pin competitions like the Premier League, Champions League, La Liga or KPL for quick
                    table & fixture tracking.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setModalOpen(true)}
                    className="mt-4 gap-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Select Favorite Leagues
                  </Button>
                </Card>
              )}
            </section>

            {/* PERSONALIZED MATCH FEED PREVIEW */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    Matches for Your Pinned Selections ({personalizedMatches.length})
                  </h2>
                </div>
                <Link
                  to="/"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  View All Predictions <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {personalizedMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {personalizedMatches.slice(0, 6).map((match) => (
                    <div
                      key={match.id}
                      className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{match.league}</span>
                          {match.isPinnedTeamMatch && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30">
                              Pinned Team
                            </Badge>
                          )}
                          {match.isPinnedLeagueMatch && !match.isPinnedTeamMatch && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              Pinned League
                            </Badge>
                          )}
                        </div>
                        <span>
                          {formatKickoff(match.match_date, { includeDate: true, includeWeekday: false })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamLogo teamName={match.home_team} className="w-7 h-7 object-contain" />
                          <span className="font-bold text-xs sm:text-sm truncate">
                            {match.home_team}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground px-2">VS</span>
                        <div className="flex items-center gap-2 min-w-0 justify-end">
                          <span className="font-bold text-xs sm:text-sm truncate text-right">
                            {match.away_team}
                          </span>
                          <TeamLogo teamName={match.away_team} className="w-7 h-7 object-contain" />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Badge className="text-[10px] font-semibold bg-primary text-primary-foreground">
                            {match.predicted_outcome || match.prediction || 'Match Winner'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {match.confidence_score ?? match.confidence ?? 75}% Conf
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            addSelection({
                              match: `${match.home_team} vs ${match.away_team}`,
                              homeTeam: match.home_team,
                              awayTeam: match.away_team,
                              league: match.league,
                              market: match.predicted_outcome || match.prediction || 'Match Winner',
                              odds: match.home_odds || 1.85,
                              confidence: match.confidence_score ?? match.confidence ?? 75,
                            })
                          }
                          className="h-7 px-2.5 text-[10px] font-semibold gap-1"
                        >
                          <PlusCircle className="h-3 w-3 text-primary" />
                          Add ({formatOdds(match.home_odds || 1.85)})
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-xs text-muted-foreground">
                    No upcoming fixtures found for your current pinned selections right now.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setModalOpen(true)}
                    className="mt-3 text-xs"
                  >
                    Pin More Clubs or Leagues
                  </Button>
                </Card>
              )}
            </section>
          </TabsContent>

          {/* TAB 2: TEAMS ONLY */}
          <TabsContent value="teams" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Pinned Club Stats Tracker</h2>
                <p className="text-xs text-muted-foreground">
                  Form guides, win rates, clean sheet frequency, and tactical metrics.
                </p>
              </div>
              <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Pin More Clubs
              </Button>
            </div>

            {pinnedTeamStatsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedTeamStatsList.map((team) => (
                  <PinnedTeamCard key={team.name} team={team} onUnpin={unpinTeam} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border-dashed">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-bold text-sm">No Clubs Pinned Yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Click below to pin your favorite teams and track their detailed statistics.
                </p>
                <Button size="sm" onClick={() => setModalOpen(true)} className="mt-4 text-xs">
                  Choose Clubs
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* TAB 3: LEAGUES ONLY */}
          <TabsContent value="leagues" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Pinned League Standings & Matchdays</h2>
                <p className="text-xs text-muted-foreground">
                  Track top clubs, goal differences, and matchday progression.
                </p>
              </div>
              <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Pin More Leagues
              </Button>
            </div>

            {pinnedLeagueOverviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedLeagueOverviews.map((league) => (
                  <PinnedLeagueCard key={league.name} league={league} onUnpin={unpinLeague} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border-dashed">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-bold text-sm">No Leagues Pinned Yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Pin competitions to monitor league standings and upcoming rounds.
                </p>
                <Button size="sm" onClick={() => setModalOpen(true)} className="mt-4 text-xs">
                  Choose Leagues
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* TAB 4: PERSONALIZED MATCHES FEED */}
          <TabsContent value="matches" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Your Custom Match Schedule</h2>
                <p className="text-xs text-muted-foreground">
                  Filtered exclusively to matches involving your pinned clubs or pinned leagues.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setModalOpen(true)} className="text-xs">
                Manage Pinned Items
              </Button>
            </div>

            {personalizedMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {personalizedMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{match.league}</span>
                        {match.isPinnedTeamMatch && (
                          <Badge className="text-[9px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30">
                            Pinned Team
                          </Badge>
                        )}
                        {match.isPinnedLeagueMatch && !match.isPinnedTeamMatch && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            Pinned League
                          </Badge>
                        )}
                      </div>
                      <span>
                        {formatKickoff(match.match_date, { includeDate: true, includeWeekday: false })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TeamLogo teamName={match.home_team} className="w-8 h-8 object-contain" />
                        <span className="font-bold text-sm truncate">{match.home_team}</span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground px-2">VS</span>
                      <div className="flex items-center gap-2 min-w-0 justify-end">
                        <span className="font-bold text-sm truncate text-right">{match.away_team}</span>
                        <TeamLogo teamName={match.away_team} className="w-8 h-8 object-contain" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge className="text-[10px] font-semibold bg-primary text-primary-foreground">
                          {match.predicted_outcome || match.prediction || 'Match Winner'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {match.confidence_score ?? match.confidence ?? 75}% Conf
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          addSelection({
                            match: `${match.home_team} vs ${match.away_team}`,
                            homeTeam: match.home_team,
                            awayTeam: match.away_team,
                            league: match.league,
                            market: match.predicted_outcome || match.prediction || 'Match Winner',
                            odds: match.home_odds || 1.85,
                            confidence: match.confidence_score ?? match.confidence ?? 75,
                          })
                        }
                        className="h-7 px-2.5 text-[10px] font-semibold gap-1"
                      >
                        <PlusCircle className="h-3 w-3 text-primary" />
                        Add to Slip ({formatOdds(match.home_odds || 1.85)})
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border-dashed">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-bold text-sm">No Upcoming Matches for Pinned Items</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Try pinning more clubs or leagues to expand your personalized schedule feed.
                </p>
                <Button size="sm" onClick={() => setModalOpen(true)} className="mt-4 text-xs">
                  Pin More Items
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Pin Selection Modal */}
      <PinSelectionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
