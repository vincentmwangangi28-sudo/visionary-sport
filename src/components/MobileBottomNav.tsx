import { Link, useLocation } from 'react-router-dom';
import { Zap, Activity, Newspaper, Trophy, Search, BarChart2 } from 'lucide-react';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';

export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { openSearch, isOpen } = useUnifiedSearch();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-6 h-14">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Zap className={`h-4.5 w-4.5 ${pathname === '/' ? 'fill-primary/15' : ''}`} style={{ width: 18, height: 18 }} />
          <span className="text-[9px] font-medium leading-none">Predict</span>
        </Link>

        {/* Global Unified Search Trigger */}
        <button
          type="button"
          onClick={() => openSearch()}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          title="Search matches, leagues, teams, guides"
          aria-label="Search"
        >
          <Search className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          <span className="text-[9px] font-medium leading-none">Search</span>
        </button>

        <Link
          to="/live"
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${pathname === '/live' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Activity className={`h-4.5 w-4.5 ${pathname === '/live' ? 'fill-primary/15' : ''}`} style={{ width: 18, height: 18 }} />
          <span className="text-[9px] font-medium leading-none">Live</span>
        </Link>

        <Link
          to="/best-bets"
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${pathname === '/best-bets' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Trophy className={`h-4.5 w-4.5 ${pathname === '/best-bets' ? 'fill-primary/15' : ''}`} style={{ width: 18, height: 18 }} />
          <span className="text-[9px] font-medium leading-none">Best Bets</span>
        </Link>

        <Link
          to="/btts"
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${pathname === '/btts' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <BarChart2 className={`h-4.5 w-4.5 ${pathname === '/btts' ? 'fill-primary/15' : ''}`} style={{ width: 18, height: 18 }} />
          <span className="text-[9px] font-medium leading-none">BTTS</span>
        </Link>

        <Link
          to="/news"
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${pathname === '/news' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Newspaper className={`h-4.5 w-4.5 ${pathname === '/news' ? 'fill-primary/15' : ''}`} style={{ width: 18, height: 18 }} />
          <span className="text-[9px] font-medium leading-none">News</span>
        </Link>
      </div>
    </nav>
  );
};
