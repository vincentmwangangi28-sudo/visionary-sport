import React, { useState, useEffect } from 'react';
import {
  getTeamLogoWithLeague,
  fetchAndCacheTeamLogoByLeague,
  getTeamInitialsAndColor,
} from '@/services/teamLogos';

export interface TeamLogoProps {
  team?: string;
  teamName?: string;
  logoUrl?: string | null;
  leagueId?: number | string | null;
  league?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showName?: boolean;
  nameClassName?: string;
  alt?: string;
  badgeOnly?: boolean;
}

const SIZE_MAP: Record<string, { container: string; img: string; text: string; dim: number }> = {
  xs: { container: 'w-5 h-5 rounded-md p-0.5', img: 'w-3.5 h-3.5', text: 'text-[8px]', dim: 14 },
  sm: { container: 'w-7 h-7 rounded-lg p-0.5', img: 'w-5 h-5', text: 'text-[10px]', dim: 20 },
  md: { container: 'w-9 h-9 rounded-xl p-1', img: 'w-6.5 h-6.5', text: 'text-xs', dim: 26 },
  lg: { container: 'w-12 h-12 rounded-xl p-1.5', img: 'w-8.5 h-8.5', text: 'text-sm font-bold', dim: 34 },
  xl: { container: 'w-16 h-16 rounded-2xl p-2', img: 'w-11 h-11', text: 'text-base font-black', dim: 44 },
};

export const TeamLogo: React.FC<TeamLogoProps> = ({
  team: rawTeam,
  teamName,
  logoUrl,
  leagueId,
  league,
  size = 'md',
  className = '',
  showName = false,
  nameClassName = '',
  alt,
}) => {
  const team = rawTeam || teamName || '';
  const effectiveLeague = leagueId ?? league ?? null;
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [asyncLogoUrl, setAsyncLogoUrl] = useState<string | null>(null);

  // Synchronous resolution path using league context and multi-tier memory cache
  const syncUrl = !imageError && team ? getTeamLogoWithLeague(team, effectiveLeague, logoUrl) : null;
  const resolvedUrl = !imageError ? (syncUrl || asyncLogoUrl) : null;
  const { initials, bgColor, textColor } = getTeamInitialsAndColor(team);

  // Intelligent background fetch & cache if not already found synchronously
  useEffect(() => {
    let isMounted = true;
    setImageError(false);

    if (team) {
      fetchAndCacheTeamLogoByLeague(team, effectiveLeague, logoUrl).then((fetched) => {
        if (isMounted && fetched && fetched !== syncUrl) {
          setAsyncLogoUrl(fetched);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [team, effectiveLeague, logoUrl, syncUrl]);

  const sizeConfig = typeof size === 'number'
    ? { container: `w-[${size}px] h-[${size}px] rounded-lg p-1`, img: `w-[${size - 8}px] h-[${size - 8}px]`, text: 'text-xs', dim: Math.max(12, size - 8) }
    : SIZE_MAP[size] || SIZE_MAP.md;

  const logoElement = (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none overflow-hidden transition-all duration-200 bg-card/90 dark:bg-zinc-900 border border-border/60 dark:border-zinc-800 shadow-2xs ring-1 ring-black/5 dark:ring-white/5 ${
        sizeConfig.container
      } ${className}`}
      title={team}
    >
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={alt || `${team} crest`}
          loading="lazy"
          decoding="async"
          width={sizeConfig.dim}
          height={sizeConfig.dim}
          referrerPolicy="no-referrer"
          className={`object-contain transition-opacity duration-200 ${
            loaded ? 'opacity-100' : 'opacity-80'
          } ${sizeConfig.img}`}
          onLoad={() => setLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center font-black tracking-tighter rounded-md shadow-xs relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${bgColor} 0%, #111827 120%)`,
            color: textColor,
          }}
        >
          {/* Subtle shield highlight ring */}
          <div className="absolute inset-0 bg-white/10 opacity-40 pointer-events-none" />
          <span className={`${sizeConfig.text} font-mono relative z-10 leading-none drop-shadow-xs`}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );

  if (!showName) {
    return logoElement;
  }

  return (
    <div className="inline-flex items-center gap-2 max-w-full">
      {logoElement}
      <span className={`font-bold truncate text-foreground ${nameClassName}`}>{team}</span>
    </div>
  );
};
