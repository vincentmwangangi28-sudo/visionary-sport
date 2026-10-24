import React, { useState, memo } from 'react';
import { TeamLogo } from '@/components/TeamLogo';

export interface PlayerAvatarProps {
  playerId?: number;
  name: string;
  team?: string;
  photoUrl?: string | null;
  rating?: number;
  jerseyNumber?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showClubBadge?: boolean;
  showRatingBadge?: boolean;
  className?: string;
}

const KNOWN_PLAYER_HEADSHOTS: Record<string, string> = {
  'erling haaland': 'https://media.api-sports.io/football/players/1100.png',
  'haaland': 'https://media.api-sports.io/football/players/1100.png',
  'kylian mbappé': 'https://media.api-sports.io/football/players/278.png',
  'kylian mbappe': 'https://media.api-sports.io/football/players/278.png',
  'mbappe': 'https://media.api-sports.io/football/players/278.png',
  'mohamed salah': 'https://media.api-sports.io/football/players/306.png',
  'salah': 'https://media.api-sports.io/football/players/306.png',
  'bukayo saka': 'https://media.api-sports.io/football/players/1460.png',
  'saka': 'https://media.api-sports.io/football/players/1460.png',
  'harry kane': 'https://media.api-sports.io/football/players/184.png',
  'kane': 'https://media.api-sports.io/football/players/184.png',
  'jude bellingham': 'https://media.api-sports.io/football/players/129718.png',
  'bellingham': 'https://media.api-sports.io/football/players/129718.png',
  'lamine yamal': 'https://media.api-sports.io/football/players/386828.png',
  'yamal': 'https://media.api-sports.io/football/players/386828.png',
  'rodri': 'https://media.api-sports.io/football/players/44.png',
  'victor osimhen': 'https://media.api-sports.io/football/players/2780.png',
  'osimhen': 'https://media.api-sports.io/football/players/2780.png',
  'robert lewandowski': 'https://media.api-sports.io/football/players/521.png',
  'lewandowski': 'https://media.api-sports.io/football/players/521.png',
  'lautaro martínez': 'https://media.api-sports.io/football/players/217.png',
  'lautaro martinez': 'https://media.api-sports.io/football/players/217.png',
  'viktor gyökeres': 'https://media.api-sports.io/football/players/18979.png',
  'viktor gyokeres': 'https://media.api-sports.io/football/players/18979.png',
  'cole palmer': 'https://media.api-sports.io/football/players/152982.png',
  'palmer': 'https://media.api-sports.io/football/players/152982.png',
  'vinícius júnior': 'https://media.api-sports.io/football/players/762.png',
  'vinicius junior': 'https://media.api-sports.io/football/players/762.png',
  'ademola lookman': 'https://media.api-sports.io/football/players/18766.png',
  'lookman': 'https://media.api-sports.io/football/players/18766.png',
  'achraf hakimi': 'https://media.api-sports.io/football/players/9.png',
  'hakimi': 'https://media.api-sports.io/football/players/9.png',
  'serhou guirassy': 'https://media.api-sports.io/football/players/21393.png',
  'guirassy': 'https://media.api-sports.io/football/players/21393.png',
  'martin odegaard': 'https://media.api-sports.io/football/players/37127.png',
  'odegaard': 'https://media.api-sports.io/football/players/37127.png',
  'declan rice': 'https://media.api-sports.io/football/players/2937.png',
  'rice': 'https://media.api-sports.io/football/players/2937.png',
  'william saliba': 'https://media.api-sports.io/football/players/22090.png',
  'saliba': 'https://media.api-sports.io/football/players/22090.png',
  'kai havertz': 'https://media.api-sports.io/football/players/978.png',
  'havertz': 'https://media.api-sports.io/football/players/978.png',
  'gabriel martinelli': 'https://media.api-sports.io/football/players/127769.png',
  'martinelli': 'https://media.api-sports.io/football/players/127769.png',
  'david raya': 'https://media.api-sports.io/football/players/19465.png',
  'raya': 'https://media.api-sports.io/football/players/19465.png',
  'virgil van dijk': 'https://media.api-sports.io/football/players/290.png',
  'van dijk': 'https://media.api-sports.io/football/players/290.png',
  'alisson': 'https://media.api-sports.io/football/players/280.png',
  'trent alexander-arnold': 'https://media.api-sports.io/football/players/283.png',
  'alexander-arnold': 'https://media.api-sports.io/football/players/283.png',
  'luis diaz': 'https://media.api-sports.io/football/players/2489.png',
  'diaz': 'https://media.api-sports.io/football/players/2489.png',
  'darwin nunez': 'https://media.api-sports.io/football/players/51617.png',
  'nunez': 'https://media.api-sports.io/football/players/51617.png',
  'alexis mac allister': 'https://media.api-sports.io/football/players/6716.png',
  'mac allister': 'https://media.api-sports.io/football/players/6716.png',
  'dominik szoboszlai': 'https://media.api-sports.io/football/players/1096.png',
  'szoboszlai': 'https://media.api-sports.io/football/players/1096.png',
};

interface KitPalette {
  primary: string;
  secondary: string;
  accent: string;
  pattern: 'solid' | 'stripes' | 'sleeves';
}

function getClubKitPalette(team = ''): KitPalette {
  const lower = team.toLowerCase();
  if (lower.includes('manchester city') || lower.includes('man city')) {
    return { primary: '#38bdf8', secondary: '#0284c7', accent: '#ffffff', pattern: 'solid' };
  }
  if (lower.includes('real madrid')) {
    return { primary: '#f8fafc', secondary: '#cbd5e1', accent: '#eab308', pattern: 'solid' };
  }
  if (lower.includes('arsenal')) {
    return { primary: '#dc2626', secondary: '#ffffff', accent: '#fef08a', pattern: 'sleeves' };
  }
  if (lower.includes('liverpool') || lower.includes('bayern') || lower.includes('al ahly') || lower.includes('manchester united')) {
    return { primary: '#b91c1c', secondary: '#991b1b', accent: '#fbbf24', pattern: 'solid' };
  }
  if (lower.includes('barcelona')) {
    return { primary: '#1d4ed8', secondary: '#b91c1c', accent: '#facc15', pattern: 'stripes' };
  }
  if (lower.includes('inter')) {
    return { primary: '#1d4ed8', secondary: '#0f172a', accent: '#38bdf8', pattern: 'stripes' };
  }
  if (lower.includes('ac milan')) {
    return { primary: '#dc2626', secondary: '#111827', accent: '#ffffff', pattern: 'stripes' };
  }
  if (lower.includes('chelsea') || lower.includes('psg') || lower.includes('paris')) {
    return { primary: '#1d4ed8', secondary: '#1e3a8a', accent: '#ef4444', pattern: 'solid' };
  }
  if (lower.includes('gor mahia') || lower.includes('sporting') || lower.includes('celtic')) {
    return { primary: '#059669', secondary: '#065f46', accent: '#ffffff', pattern: 'stripes' };
  }
  if (lower.includes('galatasaray')) {
    return { primary: '#b91c1c', secondary: '#d97706', accent: '#fde047', pattern: 'stripes' };
  }
  if (lower.includes('dortmund') || lower.includes('kaizer chiefs') || lower.includes('sundowns')) {
    return { primary: '#eab308', secondary: '#111827', accent: '#ffffff', pattern: 'solid' };
  }
  return { primary: '#10b981', secondary: '#047857', accent: '#ffffff', pattern: 'solid' };
}

const SIZE_CLASSES: Record<
  NonNullable<PlayerAvatarProps['size']>,
  { wrapper: string; dim: number; clubSize: 'xs' | 'sm'; text: string }
> = {
  xs: { wrapper: 'w-6 h-6 rounded-full', dim: 24, clubSize: 'xs', text: 'text-[9px]' },
  sm: { wrapper: 'w-9 h-9 rounded-full', dim: 36, clubSize: 'xs', text: 'text-[10px]' },
  md: { wrapper: 'w-12 h-12 rounded-2xl', dim: 48, clubSize: 'xs', text: 'text-xs' },
  lg: { wrapper: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl', dim: 64, clubSize: 'sm', text: 'text-sm' },
  xl: { wrapper: 'w-20 h-20 rounded-2xl', dim: 80, clubSize: 'sm', text: 'text-base' },
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = memo(
  ({
    playerId,
    name,
    team = '',
    photoUrl,
    rating,
    jerseyNumber,
    size = 'lg',
    showClubBadge = true,
    showRatingBadge = false,
    className = '',
  }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    const normalizedName = (name || '').trim().toLowerCase();
    const resolvedPhotoUrl =
      photoUrl ||
      KNOWN_PLAYER_HEADSHOTS[normalizedName] ||
      (playerId && playerId < 9000
        ? `https://media.api-sports.io/football/players/${playerId}.png`
        : null);

    const kit = getClubKitPalette(team);
    const sizeCfg = SIZE_CLASSES[size] || SIZE_CLASSES.lg;
    const initials = (name || 'P')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');

    const hash = normalizedName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const skinTones = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
    const skinColor = skinTones[hash % skinTones.length];
    const hairColors = ['#111827', '#27272a', '#451a03', '#78350f', '#d97706'];
    const hairColor = hairColors[(hash * 3) % hairColors.length];

    return (
      <div className={`relative inline-flex flex-shrink-0 select-none ${className}`}>
        <div
          className={`relative overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-border/80 dark:border-slate-700/80 shadow-xs flex items-end justify-center ${sizeCfg.wrapper}`}
          title={`${name}${team ? ` (${team})` : ''}`}
        >
          {/* Ambient Stadium Rim Glow */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 25%, ${kit.primary}, transparent 72%)`,
            }}
          />

          {/* Illustrated Athletic Kit & Portrait Backdrop (always rendered as base & zero-broken-image fallback) */}
          <svg
            viewBox="0 0 64 64"
            className={`w-full h-full transition-opacity duration-200 ${
              resolvedPhotoUrl && !imgFailed && imgLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100'
            }`}
            aria-hidden="true"
          >
            {/* Kit Shoulders & Torso */}
            <path
              d="M10 64 C10 47, 20 42, 32 42 C44 42, 54 47, 54 64 Z"
              fill={kit.primary}
            />
            {kit.pattern === 'stripes' && (
              <g fill={kit.secondary} opacity="0.85">
                <rect x="21" y="43" width="5" height="21" />
                <rect x="30" y="42" width="5" height="22" />
                <rect x="39" y="43" width="5" height="21" />
              </g>
            )}
            {kit.pattern === 'sleeves' && (
              <g fill={kit.secondary}>
                <path d="M10 64 C10 51, 15 46, 21 44 L21 64 Z" />
                <path d="M54 64 C54 51, 49 46, 43 44 L43 64 Z" />
              </g>
            )}
            {/* V-Neck Collar */}
            <polygon points="26,42 32,49 38,42" fill={kit.accent} opacity="0.9" />
            {/* Neck */}
            <rect x="28" y="34" width="8" height="10" rx="3" fill={skinColor} />
            {/* Head */}
            <ellipse cx="32" cy="25" rx="10.5" ry="12" fill={skinColor} />
            {/* Hair Silhouette */}
            <path
              d="M21.5 23 C21.5 14, 26 11, 32 11 C38 11, 42.5 14, 42.5 23 C40 18, 36 16.5, 32 16.5 C28 16.5, 24 18, 21.5 23 Z"
              fill={hairColor}
            />
            {/* Subtle Initials or Jersey Number on Kit Chest */}
            <text
              x="32"
              y="59"
              textAnchor="middle"
              fill={kit.primary === '#f8fafc' ? '#0f172a' : '#ffffff'}
              className="font-mono font-black"
              fontSize="10"
            >
              {jerseyNumber ? `#${jerseyNumber}` : initials}
            </text>
          </svg>

          {/* Official Player Headshot Photo */}
          {resolvedPhotoUrl && !imgFailed && (
            <img
              src={resolvedPhotoUrl}
              alt={`${name} football player portrait`}
              width={sizeCfg.dim}
              height={sizeCfg.dim}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgFailed(true)}
              className={`relative z-10 w-full h-full object-cover object-top transition-opacity duration-200 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>

        {/* Mini Club Badge Overlay (Bottom-Right) */}
        {showClubBadge && team && size !== 'xs' && (
          <div className="absolute -bottom-1 -right-1 z-20 rounded-full ring-2 ring-background shadow-xs">
            <TeamLogo team={team} size={sizeCfg.clubSize} />
          </div>
        )}

        {/* Optional Rating Pill Overlay (Top-Left) */}
        {showRatingBadge && typeof rating === 'number' && (
          <span
            className="absolute -top-1.5 -left-1.5 z-20 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-mono tabular-nums text-[10px] font-black leading-none shadow-xs ring-1 ring-background"
            title={`Season Rating: ${rating.toFixed(1)}`}
          >
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  }
);

PlayerAvatar.displayName = 'PlayerAvatar';
