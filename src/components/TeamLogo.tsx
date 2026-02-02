import { useState } from 'react';
import { getTeamLogoUrl } from '@/lib/teamLogos';
import { cn } from '@/lib/utils';

interface TeamLogoProps {
  teamName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

export const TeamLogo = ({ teamName, size = 'md', className, showName = false }: TeamLogoProps) => {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getTeamLogoUrl(teamName);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
  };

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs",
        sizeClasses[size],
        className
      )}>
        {getInitials(teamName)}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={logoUrl}
        alt={`${teamName} logo`}
        className={cn(
          "object-contain rounded-full bg-white/10",
          sizeClasses[size]
        )}
        loading="lazy"
        onError={() => setHasError(true)}
      />
      {showName && (
        <span className="font-medium text-sm truncate">{teamName}</span>
      )}
    </div>
  );
};

export default TeamLogo;
