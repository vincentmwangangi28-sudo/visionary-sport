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
  Share2,
  Send,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

interface MarketQuickItem {
  to: string;
  label: string;
  badge?: string;
  icon: React.ElementType;
}

const MARKET_QUICK_LINKS: MarketQuickItem[] = [
  { to: '/sure-win-predictions', label: 'Sure Wins', badge: '88%+', icon: ShieldCheck },
  { to: '/rollover-bets-predictions', label: 'Rollover Challenge', badge: '1.55x', icon: Flame },
  { to: '/daily-2-odds-predictions', label: 'Sure 2 / 3 / 5 Odds', badge: 'Daily', icon: Trophy },
  { to: '/bet-builder-predictions', label: 'Bet Builder (SGP)', icon: Layers },
  { to: '/tomorrow-predictions', label: 'Tomorrow Picks', icon: Calendar },
  { to: '/weekend-predictions', label: 'Weekend Accas', icon: Trophy },
  { to: '/midweek-jackpot-predictions', label: 'Midweek Jackpot', badge: '13/15', icon: Trophy },
  { to: '/first-half-goals-predictions', label: '1H Over 0.5 Goals', badge: 'Fast', icon: Flame },
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
];

export const MarketQuickStrip: React.FC = () => {
  const location = useLocation();

  const viralMessage =
    '🔥 Free AI Football Banker Picks Today (88%+ Strike Rate): Sure 2 Odds, 7-Day Rollover & 17-Game Jackpot Slips -> https://predictpro.guru';

  return (
    <div className="container mx-auto px-4 max-w-6xl space-y-1.5">
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
                  <span className="ml-0.5 px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Viral Community Share Bar for Organic Word-of-Mouth Growth */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
          <span>
            <strong className="text-foreground">Share Today&apos;s Free AI Banker Slip</strong> with your WhatsApp or Telegram group:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              window.location.href = `https://wa.me/?text=${encodeURIComponent(viralMessage)}`;
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-semibold transition-colors cursor-pointer"
          >
            <Share2 className="w-3 h-3" /> WhatsApp Share
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = `https://t.me/share/url?url=${encodeURIComponent('https://predictpro.guru')}&text=${encodeURIComponent(viralMessage)}`;
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-800 dark:text-sky-300 font-semibold transition-colors cursor-pointer"
          >
            <Send className="w-3 h-3" /> Telegram Share
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(viralMessage);
              toast.success('Invite link & daily slip copied to clipboard!');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-colors cursor-pointer"
          >
            Copy Invite Link
          </button>
        </div>
      </div>
    </div>
  );
};

