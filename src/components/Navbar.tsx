import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  ChevronDown,
  Shield,
  Sun,
  Moon,
  LogOut,
  User,
  Ticket,
  Flame,
  Calculator,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences, OddsFormat } from '@/hooks/useUserPreferences';
import { UnifiedSearchTrigger } from '@/components/UnifiedSearchTrigger';

const MAJOR_COMPETITIONS = [
  { to: '/premier-league-predictions', label: 'Premier League', country: 'England' },
  { to: '/champions-league-predictions', label: 'UEFA Champions League', country: 'Europe' },
  { to: '/la-liga-predictions', label: 'LaLiga', country: 'Spain' },
  { to: '/serie-a-predictions', label: 'Serie A', country: 'Italy' },
  { to: '/bundesliga-predictions', label: 'Bundesliga', country: 'Germany' },
  { to: '/ligue-1-predictions', label: 'Ligue 1', country: 'France' },
  { to: '/europa-league-predictions', label: 'UEFA Europa League', country: 'Europe' },
  { to: '/kpl-predictions', label: 'FKF Premier League', country: 'Kenya' },
  { to: '/mls-predictions', label: 'Major League Soccer', country: 'USA' },
  { to: '/afcon-predictions', label: 'AFCON & CAF', country: 'Africa' },
];

const BETTING_HUB_TOOLS = [
  { to: '/best-bets', label: "Today's Banker Picks", tag: '80%+ Conf' },
  { to: '/bet-tracker', label: 'Personal Bet Tracker & ROI Ledger', tag: 'ESPN Sync' },
  { to: '/in-play-edge', label: 'In-Play Momentum & Late-Goal Radar', tag: "75'+ Edge" },
  { to: '/social-card-studio', label: 'Social Slip & Card Studio', tag: 'PNG Studio' },
  { to: '/tournament-simulator', label: 'Tournament Group Simulator', tag: '10k Runs' },
  { to: '/live-multiview', label: 'Live 4-Match Multi-View', tag: '2x2 Grid' },
  { to: '/closing-line-value', label: 'Closing Line Value (CLV) Scanner', tag: 'CLV Steam' },
  { to: '/sgp-builder', label: 'Correlated SGP Copula Builder', tag: 'Copula' },
  { to: '/pitch-telemetry', label: '2D Pitch Shot Map & xT Hub', tag: '2D Pitch' },
  { to: '/xpts-standings', label: 'Expected Points (xPTS) Table', tag: 'Justice' },
  { to: '/bracket-simulator', label: 'Knockout Bracket Simulator', tag: 'Bracket' },
  { to: '/community-slips', label: 'Community Copy-Bet Feed', tag: 'Copy Slips' },
  { to: '/cashout-calculator', label: 'Acca Cash-Out & Live Hedge Calc', tag: 'Hedge Lock' },
  { to: '/arbitrage-finder', label: 'Multi-Bookie Arbitrage Matrix', tag: 'Surebets' },
  { to: '/code-converter', label: 'Universal Booking Code Converter', tag: '7 Bookies' },
  { to: '/tipsters', label: 'Verified Tipsters & 30D Yield Hub', tag: 'CLV Ranked' },
  { to: '/player-props', label: 'Player Shots (SOT) & Referee Cards', tag: 'Props' },
  { to: '/rollover-challenge', label: 'Compound Rollover & Profit-Skim Ladder', tag: 'Safe Skim' },
  { to: '/asian-handicap-calculator', label: 'Quarter-Ball Asian Handicap Matrix', tag: '-0.25 / -0.75' },
  { to: '/syndicate-pools', label: '17-Game Jackpot Syndicates & Mini-Leagues', tag: 'Syndicate' },
  { to: '/corner-stats-scanner', label: 'Corner Kick Tempo & Poisson Scanner', tag: 'Corners' },
  { to: '/cash-out-calculator', label: 'Cash-Out Equity & Haircut Auditor', tag: 'Equity Audit' },
  { to: '/referee-stats-scanner', label: 'Referee Discipline & Card Matrix', tag: 'Cards & PKs' },
  { to: '/player-props-lab', label: 'Player Shots (SoT) & Goal Prop Lab', tag: '1+ / 2+ SoT' },
  { to: '/trixie-yankee-calculator', label: 'System Bet & Permutation Simulator', tag: 'Yankee / Heinz' },
  { to: '/h2h', label: 'Dynamic Team H2H & Matchup Hub', tag: '10-Match H2H' },
  { to: '/odds-comparison', label: 'Bookmaker Odds Line-Shopping Hub', tag: '6 Bookies' },
  { to: '/pick-em-challenge', label: "Daily 5-Match Pick'em", tag: '+50 Coins' },
  { to: '/alert-center', label: 'Telegram & Push Alert Hub', tag: 'Live Alerts' },
  { to: '/referrals', label: 'Invite Friends & Earn Coins', tag: 'VIP Perks' },
];

export const Navbar = () => {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { selections, totalOdds, setIsOpen } = useBetSlip();
  const { preferences, setOddsFormat } = useUserPreferences();

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [leaguesOpen, setLeaguesOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const leaguesRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    if (typeof document === 'undefined') return;
    const nextDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextDark);
    setIsDark(nextDark);
    try {
      localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (leaguesRef.current && !leaguesRef.current.contains(e.target as Node)) {
        setLeaguesOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cycleOddsFormat = () => {
    const order: OddsFormat[] = ['decimal', 'probabilities', 'fractional', 'american'];
    const next = order[(order.indexOf(preferences.oddsFormat) + 1) % order.length];
    setOddsFormat(next);
  };

  const oddsLabel: Record<OddsFormat, string> = {
    probabilities: '% Prob',
    decimal: 'DEC',
    fractional: 'FRAC',
    american: 'US',
  };

  const primaryLinks = [
    { to: '/', label: 'Matches', active: pathname === '/' || pathname === '/upcoming' },
    { to: '/live', label: 'Live Scores', active: pathname === '/live', isLive: true },
    { to: '/best-bets', label: 'Banker Picks', active: pathname === '/best-bets', isHot: true },
    { to: '/bet-tracker', label: 'Bet Tracker', active: pathname === '/bet-tracker' },
    { to: '/in-play-edge', label: 'In-Play Edge', active: pathname === '/in-play-edge' },
    { to: '/standings', label: 'Standings', active: pathname === '/standings' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur border-b border-border">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Brand Identity + Primary Navigation */}
        <div className="flex items-center gap-6 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="PredictPro Home">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Activity className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              Predict<span className="text-primary">Pro</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-4" aria-label="Primary Navigation">
            {primaryLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={item.active ? 'page' : undefined}
                className={`py-1 text-sm font-medium transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                  item.active
                    ? 'border-primary text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.isLive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
                )}
                {item.isHot && (
                  <Flame className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                )}
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Competitions Dropdown */}
            <div className="relative" ref={leaguesRef}>
              <button
                type="button"
                onClick={() => {
                  setLeaguesOpen((prev) => !prev);
                  setToolsOpen(false);
                }}
                aria-expanded={leaguesOpen}
                aria-haspopup="true"
                className="py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Leagues</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${leaguesOpen ? 'rotate-180' : ''}`} />
              </button>

              {leaguesOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-lg p-2 z-50"
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Major Competitions
                  </div>
                  <div className="space-y-0.5">
                    {MAJOR_COMPETITIONS.map((comp) => (
                      <Link
                        key={comp.to}
                        to={comp.to}
                        role="menuitem"
                        onClick={() => setLeaguesOpen(false)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <span className="truncate">{comp.label}</span>
                        <span className="text-[11px] text-muted-foreground">{comp.country}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-between px-2.5 py-1">
                    <Link
                      to="/tournaments"
                      onClick={() => setLeaguesOpen(false)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      All 40+ Leagues →
                    </Link>
                    <Link
                      to="/blog"
                      onClick={() => setLeaguesOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Guides
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Betting Hub & Booking Tools Dropdown */}
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                onClick={() => {
                  setToolsOpen((prev) => !prev);
                  setLeaguesOpen(false);
                }}
                aria-expanded={toolsOpen}
                aria-haspopup="true"
                className="py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Calculator className="h-3.5 w-3.5 text-primary" />
                <span>Markets &amp; Tools</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-80 max-h-[75vh] overflow-y-auto rounded-xl border border-border bg-card shadow-lg p-2 z-50"
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Betting Markets &amp; Pro Tools</span>
                    <span className="font-mono text-[10px] text-primary">{BETTING_HUB_TOOLS.length} Hubs</span>
                  </div>
                  <div className="space-y-0.5">
                    {BETTING_HUB_TOOLS.map((tool) => (
                      <Link
                        key={tool.to}
                        to={tool.to}
                        role="menuitem"
                        onClick={() => setToolsOpen(false)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors gap-2"
                      >
                        <span className="truncate">{tool.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold shrink-0">
                          {tool.tag}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-between px-2.5 py-1">
                    <Link
                      to="/sitemap"
                      onClick={() => setToolsOpen(false)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      All 153 Integrated Hubs →
                    </Link>
                    <Link
                      to="/booking-codes"
                      onClick={() => setToolsOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Booking Codes
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Zone 2: Interactive Bet Slip Button, Rewards, Odds Toggle & Auth */}
        <div className="flex items-center gap-2 shrink-0">
          <UnifiedSearchTrigger variant="compact" />

          {/* Interactive Bet Slip & Booking Code Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            data-testid="navbar-betslip-trigger"
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
              selections.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                : 'bg-background hover:bg-muted text-foreground border-border'
            }`}
            title="Open Bet Slip & Booking Code Generator"
          >
            <Ticket className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bet Slip</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                selections.length > 0
                  ? 'bg-white/20 text-white font-black'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {selections.length}
            </span>
            {selections.length > 0 && (
              <span className="hidden md:inline font-mono text-[11px] text-emerald-100">
                @{totalOdds.toFixed(2)}
              </span>
            )}
          </button>

          {/* Daily Spin & Rewards */}
          <Link
            to="/rewards"
            className="hidden xl:inline-flex items-center gap-1 h-9 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-colors"
            title="Daily Spin Wheel & Free Coins"
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Rewards</span>
          </Link>

          {/* Odds / Probability Format Selector */}
          <button
            type="button"
            onClick={cycleOddsFormat}
            title="Switch display format (Decimal Odds / % Probability)"
            aria-label={`Display format: ${oddsLabel[preferences.oddsFormat]}`}
            className="hidden sm:inline-flex items-center justify-center h-9 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-mono font-medium text-foreground transition-colors cursor-pointer"
          >
            {oddsLabel[preferences.oddsFormat]}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
          </button>

          {isAdmin && (
            <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex h-9 px-3 text-xs gap-1.5">
              <Link to="/admin">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Admin</span>
              </Link>
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium gap-1.5">
                <Link to="/my-dashboard" title="Saved Matches & Preferences">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button asChild variant="default" size="sm" className="h-9 px-3.5 text-xs font-semibold">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
