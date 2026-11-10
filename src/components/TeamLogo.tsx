import React, { useState, memo } from 'react';
import {
  resolveTeamIdentity,
  markLogoUrlFailed,
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
  variant?: 'crest' | 'jersey';
}

const SIZE_MAP: Record<string, { container: string; img: string; text: string; dim: number }> = {
  xs: { container: 'w-5 h-5 rounded-md p-0.5', img: 'w-3.5 h-3.5', text: 'text-[8px]', dim: 14 },
  sm: { container: 'w-7 h-7 rounded-lg p-0.5', img: 'w-5 h-5', text: 'text-[10px]', dim: 20 },
  md: { container: 'w-9 h-9 rounded-xl p-1', img: 'w-6.5 h-6.5', text: 'text-xs', dim: 26 },
  lg: { container: 'w-12 h-12 rounded-xl p-1.5', img: 'w-8.5 h-8.5', text: 'text-sm font-bold', dim: 34 },
  xl: { container: 'w-16 h-16 rounded-2xl p-2', img: 'w-11 h-11', text: 'text-base font-black', dim: 44 },
};

/**
 * Strips `/combiner/i?img=` from ESPN CDN URLs because `a.espncdn.com/robots.txt`
 * disallows `/combiner/`, which causes Googlebot URL Inspection to report "Other error" on images.
 */
export function sanitizeLogoCdnUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    if (rawUrl.includes('espncdn.com/combiner/i')) {
      const parsed = new URL(rawUrl);
      const imgPath = parsed.searchParams.get('img');
      if (imgPath && imgPath.startsWith('/')) {
        return `https://a.espncdn.com${imgPath}`;
      }
    }
  } catch {
    // ignore malformed URL
  }
  return rawUrl;
}

export interface TeamJerseyBadgeProps {
  team: string;
  league?: string | number | null;
  number?: number | string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

/**
 * Renders an official club jersey SVG icon using the club's primary, secondary,
 * and accent colors plus kit pattern (stripes, hoops, sleeves, sash, solid).
 */
export const TeamJerseyBadge: React.FC<TeamJerseyBadgeProps> = memo(
  ({ team, league, number, size = 'xs', className = '' }) => {
    const identity = resolveTeamIdentity(team, league);
    const dimClass =
      size === 'md' ? 'w-7 h-7' : size === 'sm' ? 'w-5 h-5' : 'w-4 h-4';

    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 select-none ${dimClass} ${className}`}
        title={`${identity.name} Official Kit (${identity.primaryColor})`}
      >
        <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-2xs" aria-hidden="true">
          {/* Main Jersey Body & Sleeves */}
          <path
            d="M11 5 L5 9 L8 15 L11 13 L11 31 L25 31 L25 13 L28 15 L31 9 L25 5 L21 8 L15 8 Z"
            fill={identity.primaryColor}
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.2"
          />
          {identity.kitPattern === 'stripes' && (
            <g fill={identity.secondaryColor} opacity="0.88">
              <rect x="13.5" y="8" width="2.5" height="22" />
              <rect x="19.5" y="8" width="2.5" height="22" />
            </g>
          )}
          {identity.kitPattern === 'hoops' && (
            <g fill={identity.secondaryColor} opacity="0.88">
              <rect x="11.5" y="12" width="13" height="3" />
              <rect x="11.5" y="19" width="13" height="3" />
              <rect x="11.5" y="26" width="13" height="2.5" />
            </g>
          )}
          {identity.kitPattern === 'sleeves' && (
            <g fill={identity.secondaryColor}>
              <path d="M11 5 L5 9 L8 15 L11 13 Z" />
              <path d="M25 5 L31 9 L28 15 L25 13 Z" />
            </g>
          )}
          {identity.kitPattern === 'sash' && (
            <polygon points="12,8 16,8 24,30 20,30" fill={identity.secondaryColor} opacity="0.9" />
          )}
          {/* Collar Trim */}
          <polygon points="14,5 18,9.5 22,5" fill={identity.accentColor} />
          {/* Number or Short Code */}
          <text
            x="18"
            y="22.5"
            textAnchor="middle"
            fill={identity.textColor}
            fontSize={number ? '9.5' : '6.8'}
            fontWeight="900"
            fontFamily="monospace"
          >
            {number ?? identity.shortName.slice(0, 3)}
          </text>
        </svg>
      </span>
    );
  }
);

TeamJerseyBadge.displayName = 'TeamJerseyBadge';

export const TeamLogo: React.FC<TeamLogoProps> = memo(({
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
  badgeOnly = false,
  variant = 'crest',
}) => {
  const team = rawTeam || teamName || '';
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const identity = resolveTeamIdentity(team, leagueId ?? league, logoUrl);
  const resolvedUrl =
    !badgeOnly && variant === 'crest' && !imageError && identity.logoUrl
      ? sanitizeLogoCdnUrl(identity.logoUrl)
      : null;

  const sizeConfig = typeof size === 'number'
    ? {
        container: `w-[${size}px] h-[${size}px] rounded-lg p-1`,
        img: `w-[${size - 8}px] h-[${size - 8}px]`,
        text: 'text-xs',
        dim: Math.max(12, size - 8),
      }
    : SIZE_MAP[size] || SIZE_MAP.md;

  if (variant === 'jersey') {
    const jerseySize = size === 'lg' || size === 'xl' ? 'md' : size === 'sm' ? 'sm' : 'xs';
    const jerseyEl = <TeamJerseyBadge team={team} league={leagueId ?? league} size={jerseySize} className={className} />;
    if (!showName) return jerseyEl;
    return (
      <div className="inline-flex items-center gap-2 max-w-full">
        {jerseyEl}
        <span className={`font-bold truncate text-foreground ${nameClassName}`}>{team}</span>
      </div>
    );
  }

  const logoElement = resolvedUrl ? (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none overflow-hidden transition-all duration-200 bg-card/90 dark:bg-zinc-900 border border-border/60 dark:border-zinc-800 shadow-2xs ring-1 ring-black/5 dark:ring-white/5 ${
        sizeConfig.container
      } ${className}`}
      title={identity.name}
    >
      <img
        src={resolvedUrl}
        alt={alt || `${identity.name} crest`}
        loading="lazy"
        decoding="async"
        width={sizeConfig.dim}
        height={sizeConfig.dim}
        referrerPolicy="no-referrer"
        className={`object-contain transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-85'
        } ${sizeConfig.img}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          markLogoUrlFailed(team, resolvedUrl);
          setImageError(true);
        }}
      />
    </div>
  ) : (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 select-none font-black tracking-tighter shadow-2xs border border-black/15 dark:border-white/15 ${
        sizeConfig.container
      } ${sizeConfig.text} font-mono leading-none ${className}`}
      style={{
        backgroundColor: identity.primaryColor,
        backgroundImage: `linear-gradient(135deg, ${identity.primaryColor} 0%, ${
          identity.secondaryColor === '#FFFFFF' ? '#0f172a' : identity.secondaryColor
        } 135%)`,
        color: identity.textColor,
      }}
      title={identity.name}
      aria-hidden="true"
    >
      {identity.shortName}
    </span>
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
});

TeamLogo.displayName = 'TeamLogo';

