import React, { useState, memo } from 'react';

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

const PALETTE = [
  '#991b1b',
  '#1e3a8a',
  '#065f46',
  '#5b21b6',
  '#78350f',
  '#115e59',
  '#881337',
  '#1e40af',
  '#14532d',
  '#312e81',
];

function computeTeamInitialsAndColor(teamName: string): {
  initials: string;
  bgColor: string;
  textColor: string;
} {
  const clean = (teamName || 'FC').trim();
  const words = clean.split(/[\s-]+/).filter(Boolean);
  let initials = 'FC';
  if (words.length === 1) {
    initials = words[0].slice(0, 3).toUpperCase();
  } else if (words.length >= 2) {
    const filtered = words.filter(
      (w) => !['fc', 'cf', 'sc', 'ac', 'afc', 'de', 'real', 'club'].includes(w.toLowerCase())
    );
    const target = filtered.length >= 2 ? filtered : words;
    initials = (target[0][0] + target[1][0]).toUpperCase();
  }
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) | 0;
  }
  const bgColor = PALETTE[Math.abs(hash) % PALETTE.length];
  return { initials, bgColor, textColor: '#ffffff' };
}

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

export const TeamLogo: React.FC<TeamLogoProps> = memo(({
  team: rawTeam,
  teamName,
  logoUrl,
  size = 'md',
  className = '',
  showName = false,
  nameClassName = '',
  alt,
  badgeOnly = false,
}) => {
  const team = rawTeam || teamName || '';
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Avoid loading 500x500px uncached third-party ESPN PNGs; only load explicit non-ESPN custom URLs when requested
  const sanitizedCustom = !badgeOnly && !imageError && logoUrl ? sanitizeLogoCdnUrl(logoUrl) : null;
  const resolvedUrl =
    sanitizedCustom && !sanitizedCustom.includes('espncdn.com') ? sanitizedCustom : null;

  const { initials, bgColor, textColor } = computeTeamInitialsAndColor(team);

  const sizeConfig = typeof size === 'number'
    ? {
        container: `w-[${size}px] h-[${size}px] rounded-lg p-1`,
        img: `w-[${size - 8}px] h-[${size - 8}px]`,
        text: 'text-xs',
        dim: Math.max(12, size - 8),
      }
    : SIZE_MAP[size] || SIZE_MAP.md;

  const logoElement = resolvedUrl ? (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none overflow-hidden transition-all duration-200 bg-card/90 dark:bg-zinc-900 border border-border/60 dark:border-zinc-800 shadow-2xs ring-1 ring-black/5 dark:ring-white/5 ${
        sizeConfig.container
      } ${className}`}
      title={team}
    >
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
        onError={() => {
          setImageError(true);
        }}
      />
    </div>
  ) : (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 select-none font-black tracking-tighter shadow-2xs border border-black/10 dark:border-white/10 ${
        sizeConfig.container
      } ${sizeConfig.text} font-mono leading-none ${className}`}
      style={{
        backgroundColor: bgColor,
        backgroundImage: `linear-gradient(135deg, ${bgColor} 0%, #111827 120%)`,
        color: textColor,
      }}
      title={team}
      aria-hidden="true"
    >
      {initials}
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
