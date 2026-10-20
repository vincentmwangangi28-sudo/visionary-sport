import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  Trophy,
  Flame,
  Zap,
  Flag,
  Scale,
  RefreshCw,
  Lock,
  Calculator,
  ArrowLeftRight,
  Layers,
} from 'lucide-react';

interface MarketQuickItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const MARKET_QUICK_LINKS: MarketQuickItem[] = [
  { to: '/sure-win-predictions', label: 'Sure Wins (88%+)', icon: ShieldCheck },
  { to: '/rollover-bets-predictions', label: 'Rollover Challenge', icon: Flame },
  { to: '/daily-2-odds-predictions', label: 'Daily 2 / 3 / 5 Odds', icon: Trophy },
  { to: '/bet-builder-predictions', label: 'Bet Builder (SGP)', icon: Layers },
  { to: '/tomorrow-predictions', label: 'Tomorrow Picks', icon: Calendar },
  { to: '/weekend-predictions', label: 'Weekend Accas', icon: Trophy },
  { to: '/midweek-jackpot-predictions', label: 'Midweek Jackpot', icon: Trophy },
  { to: '/first-half-goals-predictions', label: '1H Over 0.5 Goals', icon: Flame },
  { to: '/second-half-goals-predictions', label: '2nd Half Goals', icon: Flame },
  { to: '/both-halves-predictions', label: 'Score Both Halves', icon: Flame },
  { to: '/over-1-5-goals-predictions', label: 'Over 1.5 Goals', icon: Flame },
  { to: '/over-under-predictions', label: 'Over 2.5 Goals', icon: Flame },
  { to: '/under-2-5-goals-predictions', label: 'Under 2.5 Goals', icon: Lock },
  { to: '/over-3-5-goals-predictions', label: 'Over 3.5 Goals', icon: Flame },
  { to: '/btts', label: 'BTTS (GG)', icon: Zap },
  { to: '/both-teams-to-score-and-win-predictions', label: 'BTTS & Win', icon: Zap },
  { to: '/anytime-goalscorer-predictions', label: 'Goalscorers (xG)', icon: Trophy },
  { to: '/corners-predictions', label: 'Corners O/U', icon: Flag },
  { to: '/cards-predictions', label: 'Cards & Bookings', icon: Flag },
  { to: '/asian-handicap-predictions', label: 'Asian Handicap', icon: Scale },
  { to: '/handicap-1x2-predictions', label: 'Euro Handicap (-1)', icon: Scale },
  { to: '/draw-no-bet-predictions', label: 'Draw No Bet', icon: RefreshCw },
  { to: '/win-to-nil-predictions', label: 'Win to Nil', icon: Lock },
  { to: '/value-bet-calculator', label: '+EV Calculator', icon: Calculator },
  { to: '/kelly-criterion-calculator', label: 'Kelly Staking', icon: Calculator },
  { to: '/parlay-calculator', label: 'Parlay Calc', icon: Calculator },
  { to: '/system-bet-calculator', label: 'System Bet (Trixie)', icon: Calculator },
  { to: '/dutching-calculator', label: 'Dutching Calc', icon: Calculator },
  { to: '/hedge-bet-calculator', label: 'Hedge / Cash-Out', icon: Calculator },
  { to: '/roi-yield-calculator', label: 'ROI & Yield Calc', icon: Calculator },
  { to: '/arbitrage-calculator', label: 'Surebet Arb Tool', icon: Calculator },
  { to: '/margin-calculator', label: 'No-Vig Margin', icon: Calculator },
  { to: '/odds-converter', label: 'Odds Converter', icon: ArrowLeftRight },
  { to: '/teams', label: 'Club xG & FDR Hub', icon: Flame },
];

export const MarketQuickStrip: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted-foreground/20">
      <nav
        aria-label="Specialized Betting Markets and Quantitative Calculators"
        className="flex items-center gap-2 min-w-max py-1"
      >
        {MARKET_QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium border whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary font-semibold'
                  : 'bg-card hover:bg-muted text-foreground border-border'
              }`}
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
