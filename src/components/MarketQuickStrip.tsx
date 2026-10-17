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
} from 'lucide-react';

interface MarketQuickItem {
  to: string;
  label: string;
  badge?: string;
  icon: React.ElementType;
}

const MARKET_QUICK_LINKS: MarketQuickItem[] = [
  { to: '/sure-win-predictions', label: 'Sure Wins', badge: '88%+', icon: ShieldCheck },
  { to: '/tomorrow-predictions', label: 'Tomorrow Picks', icon: Calendar },
  { to: '/weekend-predictions', label: 'Weekend Accas', icon: Trophy },
  { to: '/over-1-5-goals-predictions', label: 'Over 1.5 Goals', icon: Flame },
  { to: '/over-under-predictions', label: 'Over 2.5 Goals', icon: Flame },
  { to: '/btts', label: 'BTTS (GG)', icon: Zap },
  { to: '/corners-predictions', label: 'Corners O/U', icon: Flag },
  { to: '/cards-predictions', label: 'Cards & Bookings', icon: Flag },
  { to: '/asian-handicap-predictions', label: 'Asian Handicap', icon: Scale },
  { to: '/draw-no-bet-predictions', label: 'Draw No Bet', icon: RefreshCw },
  { to: '/win-to-nil-predictions', label: 'Win to Nil', icon: Lock },
  { to: '/value-bet-calculator', label: '+EV Calculator', icon: Calculator },
  { to: '/kelly-criterion-calculator', label: 'Kelly Staking', icon: Calculator },
  { to: '/arbitrage-calculator', label: 'Surebet Arb Tool', icon: Calculator },
  { to: '/odds-converter', label: 'Odds Converter', icon: ArrowLeftRight },
];

export const MarketQuickStrip: React.FC = () => {
  const location = useLocation();

  return (
    <div className="container mx-auto px-4 max-w-6xl">
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
                className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                    : 'bg-card/70 hover:bg-primary/10 text-foreground border-border/70 hover:border-primary/40'
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-black">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
