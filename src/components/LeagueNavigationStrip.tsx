import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LEAGUE_HUBS, LeagueHubItem } from '@/data/leagueHubs';

export type { LeagueHubItem };

interface Props {
  className?: string;
  currentPath?: string;
}

export const LeagueNavigationStrip: React.FC<Props> = ({ className = '', currentPath }) => {
  const location = useLocation();
  const activePath = currentPath || location.pathname;

  return (
    <div className={`w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 ${className}`}>
      <div className="flex items-center gap-1.5 min-w-max p-1 bg-muted/30 rounded-xl border border-border/60">
        <span className="text-[11px] font-bold text-muted-foreground px-2 uppercase tracking-wider hidden sm:inline">
          Leagues:
        </span>
        {LEAGUE_HUBS.map((league) => {
          const isActive = activePath === league.to;
          return (
            <Link
              key={league.to}
              to={league.to}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
              }`}
              title={`${league.name} Football Predictions Today`}
            >
              <span>{league.flag}</span>
              <span>{league.shortName}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
