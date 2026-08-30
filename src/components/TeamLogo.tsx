import React, { useState } from 'react';
import { getTeamLogoUrl, getTeamInitialsAndColor } from '@/services/teamLogos';

export interface TeamLogoProps {
  team: string;
  logoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showName?: boolean;
  nameClassName?: string;
  alt?: string;
  badgeOnly?: boolean;
}

const SIZE_MAP: Record<string, { container: string; img: string; text: string }> = {
  xs: { container: 'w-4 h-4', img: 'w-4 h-4', text: 'text-[9px]' },
  sm: { container: 'w-6 h-6', img: 'w-6 h-6', text: 'text-[10px]' },
  md: { container: 'w-8 h-8', img: 'w-8 h-8', text: 'text-xs' },
  lg: { container: 'w-12 h-12', img: 'w-12 h-12', text: 'text-sm' },
  xl: { container: 'w-16 h-16', img: 'w-16 h-16', text: 'text-base font-black' },
};

export const TeamLogo: React.FC<TeamLogoProps> = ({
  team,
  logoUrl,
  size = 'md',
  className = '',
  showName = false,
  nameClassName = '',
  alt,
}) => {
  const [imageError, setImageError] = useState(false);
  const resolvedUrl = !imageError ? getTeamLogoUrl(team, logoUrl) : null;
  const { initials, bgColor, textColor } = getTeamInitialsAndColor(team);

  const sizeConfig = typeof size === 'number'
    ? { container: `w-[${size}px] h-[${size}px]`, img: `w-[${size}px] h-[${size}px]`, text: 'text-xs' }
    : SIZE_MAP[size] || SIZE_MAP.md;

  const logoElement = (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 rounded-full select-none overflow-hidden transition-transform duration-200 ${
        sizeConfig.container
      } ${className}`}
      title={team}
    >
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={alt || `${team} crest`}
          loading="lazy"
          className={`object-contain w-full h-full p-0.5 drop-shadow-sm ${sizeConfig.img}`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-bold font-mono tracking-tighter shadow-inner rounded-full border border-white/20"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          <span className={sizeConfig.text}>{initials}</span>
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
      <span className={`font-bold truncate ${nameClassName}`}>{team}</span>
    </div>
  );
};
