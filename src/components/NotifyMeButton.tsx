import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';
import { MatchNotificationDialog } from '@/components/MatchNotificationDialog';
import { Bell, BellRing, Check, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotifyMeButtonProps {
  match: {
    id: string | number;
    home_team: string;
    away_team: string;
    league: string;
    match_date: string;
    home_logo?: string | null;
    away_logo?: string | null;
    prediction?: string;
    confidence?: number;
    home_odds?: number;
    draw_odds?: number;
    away_odds?: number;
  };
  variant?: 'button' | 'icon' | 'badge' | 'compact';
  size?: 'xs' | 'sm' | 'default' | 'lg';
  className?: string;
  openDialogOnClick?: boolean;
}

export const NotifyMeButton: React.FC<NotifyMeButtonProps> = ({
  match,
  variant = 'button',
  size = 'sm',
  className = '',
  openDialogOnClick = false,
}) => {
  const matchId = String(match.id);
  const { isSubscribed, toggleSubscribe } = useMatchNotifications();
  const subscribed = isSubscribed(matchId);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (openDialogOnClick || subscribed) {
      setDialogOpen(true);
    } else {
      toggleSubscribe({
        matchId,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        league: match.league,
        matchDate: match.match_date,
        homeLogo: match.home_logo,
        awayLogo: match.away_logo,
        prediction: match.prediction,
        confidence: match.confidence,
        odds: {
          home: match.home_odds,
          draw: match.draw_odds,
          away: match.away_odds,
        },
      });
    }
  };

  const handleOpenSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDialogOpen(true);
  };

  return (
    <>
      {variant === 'icon' ? (
        <Button
          type="button"
          variant={subscribed ? 'default' : 'outline'}
          size="icon"
          onClick={handleClick}
          title={subscribed ? 'Subscribed to match push alerts (Click to manage)' : 'Notify me for kickoff and full-time results'}
          aria-label={subscribed ? 'Manage match alerts' : 'Notify me for match results'}
          className={cn(
            'relative h-8 w-8 rounded-full transition-all flex-shrink-0',
            subscribed
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
              : 'hover:border-primary hover:text-primary',
            className
          )}
        >
          {subscribed ? (
            <BellRing className="h-4 w-4 animate-in zoom-in-50" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {subscribed && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
          )}
        </Button>
      ) : variant === 'badge' ? (
        <button
          type="button"
          onClick={handleClick}
          title={subscribed ? 'Subscribed (Click to customize)' : 'Click to enable match push alerts'}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border select-none',
            subscribed
              ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
              : 'bg-muted/60 border-border text-muted-foreground hover:text-foreground hover:border-primary/50',
            className
          )}
        >
          {subscribed ? (
            <>
              <BellRing className="h-3.5 w-3.5 text-primary" />
              <span>Subscribed</span>
              <Check className="h-3 w-3 text-primary ml-0.5" />
            </>
          ) : (
            <>
              <Bell className="h-3.5 w-3.5" />
              <span>Notify Me</span>
            </>
          )}
        </button>
      ) : variant === 'compact' ? (
        <div className="inline-flex items-center gap-1">
          <Button
            type="button"
            variant={subscribed ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleClick}
            className={cn(
              'h-7 px-2.5 text-xs font-bold gap-1.5 rounded-lg transition-all',
              subscribed
                ? 'bg-primary/15 text-primary hover:bg-primary/25 border-primary/30'
                : 'hover:border-primary hover:text-primary',
              className
            )}
          >
            {subscribed ? (
              <>
                <BellRing className="h-3.5 w-3.5 text-primary" />
                <span>Alerts On</span>
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5" />
                <span>Notify Me</span>
              </>
            )}
          </Button>
          {subscribed && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleOpenSettings}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              title="Customize match alerts"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5">
          <Button
            type="button"
            variant={subscribed ? 'default' : 'outline'}
            size={size === 'xs' ? 'sm' : size}
            onClick={handleClick}
            className={cn(
              'font-bold gap-2 transition-all shadow-sm',
              subscribed
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'hover:border-primary hover:text-primary',
              className
            )}
          >
            {subscribed ? (
              <>
                <BellRing className="h-4 w-4" />
                <span>Alerts Active</span>
                <Check className="h-3.5 w-3.5 opacity-80" />
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                <span>Notify Me</span>
              </>
            )}
          </Button>
          {subscribed && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleOpenSettings}
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
              title="Customize notification settings for this match"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Dialog for fine-tuning match alert preferences */}
      <MatchNotificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        match={match}
      />
    </>
  );
};
