import React from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Ticket,
  ArrowRightLeft,
  Activity,
  LineChart,
  Share2,
  GitBranch,
  Tv,
  SlidersHorizontal,
  Crosshair,
  Users,
  Bell,
  Wallet,
} from 'lucide-react';

const PRO_SPORTS_TOOLS = [
  {
    to: '/pro-command-center',
    title: 'Pro Matchday Command Center',
    tag: 'All-in-One Pro',
    desc: 'Unified Oddspedia steam curves, SofaScore Starting XI absence simulator, 75\'+ momentum alerts & rollover vault.',
    icon: Activity,
  },
  {
    to: '/bet-tracker',
    title: 'Bet Tracker & ROI Ledger',
    tag: 'ESPN Auto-Grade',
    desc: 'Track personal wagers, CLV edge, bankroll curve & auto-settle vs live ESPN full-time scores.',
    icon: LineChart,
  },
  {
    to: '/in-play-edge',
    title: 'In-Play Momentum & Late-Goal Radar',
    tag: "75'+ Alerts",
    desc: 'Live attacking pressure index, trailing-favorite xG spikes & remaining-minutes Poisson edge.',
    icon: Activity,
  },
  {
    to: '/social-card-studio',
    title: 'Social Slip & Card Studio',
    tag: 'PNG Export',
    desc: 'Export 1080×1350 WhatsApp, Telegram & X share cards with regional SportyBet/Betika codes.',
    icon: Share2,
  },
  {
    to: '/tournament-simulator',
    title: 'Tournament Group Simulator',
    tag: '10,000 Runs',
    desc: 'Interactive group-stage score overrides with Monte Carlo Top-2 & knockout qualification odds.',
    icon: GitBranch,
  },
  {
    to: '/live-multiview',
    title: 'Live 4-Match Multi-View',
    tag: '2×2 Grid',
    desc: 'Monitor 4 simultaneous live fixtures with real-time xG momentum bars and synchronized alerts.',
    icon: Tv,
  },
  {
    to: '/closing-line-value',
    title: 'Closing Line Value (CLV) Scanner',
    tag: 'Sharp Steam',
    desc: 'Compare opening vs current market odds, no-vig fair probabilities, and reverse line movement.',
    icon: SlidersHorizontal,
  },
  {
    to: '/sgp-builder',
    title: 'Correlated SGP Copula Builder',
    tag: 'Gaussian Copula',
    desc: 'Price multi-leg Same-Game Parlays with mathematical correlation matrices vs bookie quotes.',
    icon: Crosshair,
  },
  {
    to: '/community-slips',
    title: 'Community Copy-Bet Feed',
    tag: '1-Click Copy',
    desc: 'Copy verified high-ROI community accumulators and regional booking codes directly to your slip.',
    icon: Users,
  },
  {
    to: '/cashout-calculator',
    title: 'Acca Cash-Out & Live Hedge Calculator',
    tag: 'Profit Lock',
    desc: 'Audit bookmaker Cash-Out haircuts and calculate exact 2-way or 3-way final-leg counter-hedge stakes.',
    icon: SlidersHorizontal,
  },
  {
    to: '/arbitrage-finder',
    title: 'Cross-Bookmaker Implied Probability Matrix',
    tag: 'Margin Audit',
    desc: 'Compare 2-way and 3-way cross-market implied probability margins across SportyBet, Betika, Bet9ja, 1xBet, and Pinnacle.',
    icon: ArrowRightLeft,
  },
  {
    to: '/code-converter',
    title: 'Universal Booking Code Converter',
    tag: '7 Bookies',
    desc: 'Translate shared slip codes between SportyBet, Betika, SportPesa, Bet9ja, 1xBet, and Betway.',
    icon: Ticket,
  },
  {
    to: '/tipsters',
    title: 'Verified Tipsters & 30-Day Yield Hub',
    tag: 'CLV Ranked',
    desc: 'Follow verified quantitative analysts ranked by 30-day ROI, CLV beat rate, and 1-click VIP slip tailing.',
    icon: Users,
  },
  {
    to: '/player-props',
    title: 'Player Shots on Target & Referee Cards',
    tag: 'SOT & Cards',
    desc: 'Per-90 Poisson shots on target (1+ SOT, 2+ SOT) projections and referee booking strictness index.',
    icon: Crosshair,
  },
  {
    to: '/rollover-challenge',
    title: 'Compound Rollover & Profit-Skim Ladder',
    tag: 'Safe Skim',
    desc: 'Interactive 3-Day to 10-Day compound bankroll planner that skims daily profit into a protected vault.',
    icon: Wallet,
  },
  {
    to: '/asian-handicap-calculator',
    title: 'Quarter-Ball Asian Handicap Split Matrix',
    tag: '-0.25 / -0.75',
    desc: 'Exact 50/50 split-stake Half-Win, Half-Loss & Push payout matrix for Asian Handicap and 2.25/2.75 Goal Lines.',
    icon: SlidersHorizontal,
  },
  {
    to: '/syndicate-pools',
    title: '17-Game Jackpot Syndicates & Mini-Leagues',
    tag: 'Syndicate',
    desc: 'Pool multi-double Mega Jackpot permutation tickets or compete in private CLV Mini-Leagues with invite codes.',
    icon: Users,
  },
  {
    to: '/corner-stats-scanner',
    title: 'Corner Kick Tempo & Set-Piece Scanner',
    tag: 'O9.5 / 1H O4.5',
    desc: 'Per-90 wing-cross intensity, First-Half Over 4.5 Corners radar, and Poisson Corner Handicap value finder.',
    icon: Activity,
  },
  {
    to: '/cash-out-calculator',
    title: 'Cash-Out Equity & Live Hedge Optimizer',
    tag: 'Haircut Audit',
    desc: 'Expose hidden bookmaker Cash-Out haircuts (8%–18%) and calculate higher-paying DIY opposite hedges.',
    icon: SlidersHorizontal,
  },
  {
    to: '/referee-stats-scanner',
    title: 'Referee Discipline & Card Poisson Matrix',
    tag: 'Cards & PKs',
    desc: 'Per-90 referee yellow/red card profiler, booking points simulator, and derby card value scanner.',
    icon: Flame,
  },
  {
    to: '/player-props-lab',
    title: 'Player Shots on Target (SoT) & Goal Prop Lab',
    tag: '1+ / 2+ SoT',
    desc: 'Convert per-90 npxG, shot volume, and penalty duty into fair odds for 1+ SoT, 2+ SoT & Goalscorer markets.',
    icon: Crosshair,
  },
  {
    to: '/trixie-yankee-calculator',
    title: 'System Bet & Permutation Simulator',
    tag: 'Trixie / Yankee',
    desc: 'Fault-tolerant payout table for Trixie, Patent, Yankee, Lucky 15, Canadian, Heinz & k-of-n Round Robins.',
    icon: GitBranch,
  },
  {
    to: '/h2h',
    title: 'Dynamic Team H2H & Matchup Hub',
    tag: '10-Match H2H',
    desc: 'Compare head-to-head form, xG differential, BTTS %, and Poisson score grids across 10 historical meetings.',
    icon: Users,
  },
  {
    to: '/sharp-money-splits',
    title: 'Sharp Money & Public Betting Splits',
    tag: 'RLM Scanner',
    desc: 'Track ticket % vs money handle %, reverse line movement (RLM), and institutional sharp steam across 40+ leagues.',
    icon: ArrowRightLeft,
  },
];

export const HomeProToolsGrid: React.FC = () => (
  <section
    aria-label="Professional Sports Analytics Tools and Bet Tracking"
    className="cv-auto container mx-auto max-w-7xl px-4 sm:px-6 py-8 border-t border-border/60"
  >
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Pro Quantitative Suite &amp; Bet Tracking
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
          Professional Sports Tools, In-Play Telemetry &amp; ROI Ledger
        </h2>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
        <Link to="/h2h" className="text-muted-foreground hover:text-foreground">
          Team H2H Matrix →
        </Link>
        <Link to="/arbitrage-finder" className="text-muted-foreground hover:text-foreground">
          Odds Line-Shopping →
        </Link>
        <Link to="/xpts-standings" className="text-muted-foreground hover:text-foreground">
          xPTS Justice Table →
        </Link>
        <Link to="/pitch-telemetry" className="text-muted-foreground hover:text-foreground">
          2D Shot Map &amp; xT →
        </Link>
        <Link
          to="/alert-center"
          className="text-emerald-800 dark:text-emerald-300 font-bold hover:underline inline-flex items-center gap-1"
        >
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          Telegram &amp; Push Alerts →
        </Link>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {PRO_SPORTS_TOOLS.map((tool) => {
        const Icon = tool.icon;
        return (
          <Link
            key={`${tool.to}-${tool.title}`}
            to={tool.to}
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                  {tool.tag}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {tool.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tool.desc}
              </p>
            </div>
            <div className="text-[11px] font-semibold text-primary">
              Launch Tool →
            </div>
          </Link>
        );
      })}
    </div>
  </section>
);

export default HomeProToolsGrid;
