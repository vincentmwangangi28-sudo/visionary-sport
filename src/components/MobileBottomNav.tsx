import { Link, useLocation } from 'react-router-dom';
import { Zap, Activity, Newspaper, Trophy, Target, BarChart2 } from 'lucide-react';

const NAV = [
  { to: '/',              label: 'Predict',  icon: Zap },
  { to: '/live',          label: 'Live',     icon: Activity },
  { to: '/best-bets',     label: 'Best Bets',icon: Trophy },
  { to: '/correct-score', label: 'Score',    icon: Target },
  { to: '/btts',          label: 'BTTS',     icon: BarChart2 },
  { to: '/news',          label: 'News',     icon: Newspaper },
];

export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-6 h-14">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <Icon className={`h-4.5 w-4.5 ${active ? 'fill-primary/15' : ''}`} style={{ width: 18, height: 18 }} />
              <span className="text-[9px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
