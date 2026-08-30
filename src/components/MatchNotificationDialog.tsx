import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { TeamLogo } from '@/components/TeamLogo';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';
import {
  Bell,
  BellRing,
  Clock,
  Radio,
  Trophy,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export interface MatchNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export const MatchNotificationDialog: React.FC<MatchNotificationDialogProps> = ({
  open,
  onOpenChange,
  match,
}) => {
  const matchId = String(match.id);
  const {
    isSubscribed,
    getSubscription,
    toggleSubscribe,
    updateOptions,
    permission,
    isSupported,
    requestPermission,
    testAlert,
    simulateResult,
  } = useMatchNotifications();

  const subscribed = isSubscribed(matchId);
  const existingSub = getSubscription(matchId);

  const [kickoffReminder, setKickoffReminder] = useState(true);
  const [liveScoreAlerts, setLiveScoreAlerts] = useState(true);
  const [finalResult, setFinalResult] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingSub) {
      setKickoffReminder(existingSub.options.kickoffReminder);
      setLiveScoreAlerts(existingSub.options.liveScoreAlerts);
      setFinalResult(existingSub.options.finalResult);
    } else {
      setKickoffReminder(true);
      setLiveScoreAlerts(true);
      setFinalResult(true);
    }
  }, [existingSub, open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (permission !== 'granted') {
        const perm = await requestPermission();
        if (perm === 'denied') {
          toast.error('Browser push permission is blocked. Please enable it in site settings.');
          setLoading(false);
          return;
        }
      }

      if (!subscribed) {
        await toggleSubscribe(
          {
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
          },
          { kickoffReminder, liveScoreAlerts, finalResult }
        );
      } else {
        updateOptions(matchId, { kickoffReminder, liveScoreAlerts, finalResult });
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = () => {
    toggleSubscribe({
      matchId,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      league: match.league,
      matchDate: match.match_date,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30">
              {match.league}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(match.match_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}{' '}
              ·{' '}
              {new Date(match.match_date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <DialogTitle className="text-xl font-black text-foreground pt-1">
            Match Push Notifications
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Get instant browser push notifications for kickoff reminders, live scores, and final match results.
          </DialogDescription>
        </DialogHeader>

        {/* Match Header with Logos */}
        <div className="bg-muted/40 rounded-xl p-3.5 border border-border/50 my-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TeamLogo team={match.home_team} logoUrl={match.home_logo} size="sm" />
              <span className="font-bold text-sm truncate">{match.home_team}</span>
            </div>
            <span className="text-xs font-black px-2 py-0.5 bg-muted rounded text-muted-foreground">
              VS
            </span>
            <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
              <span className="font-bold text-sm truncate">{match.away_team}</span>
              <TeamLogo team={match.away_team} logoUrl={match.away_logo} size="sm" />
            </div>
          </div>

          {match.prediction && (
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40 text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> AI Tip: <b className="text-foreground">{match.prediction}</b>
              </span>
              {match.confidence && (
                <Badge className="bg-primary/10 text-primary text-[10px] font-bold">
                  {match.confidence}% Confidence
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Browser Permission Status */}
        {!isSupported ? (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2.5 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Browser push notifications are not supported on this browser.</span>
          </div>
        ) : permission === 'denied' ? (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notifications Blocked</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Notifications are blocked in your browser settings. Click the lock/info icon in the address bar to allow notifications for PredictPro.
              </p>
            </div>
          </div>
        ) : permission === 'granted' ? (
          <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between text-xs text-green-700 dark:text-green-400">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              Browser Push Enabled
            </span>
            <button
              type="button"
              onClick={() => testAlert({ homeTeam: match.home_team, awayTeam: match.away_team, league: match.league, prediction: match.prediction, confidence: match.confidence })}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Send className="h-3 w-3" /> Test Push
            </button>
          </div>
        ) : (
          <div className="px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Permission required on subscribe</span>
            <Button
              size="sm"
              variant="outline"
              onClick={requestPermission}
              className="h-7 text-xs font-bold"
            >
              Allow Push
            </Button>
          </div>
        )}

        {/* Notification Options Toggles */}
        <div className="space-y-3 py-1">
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Kickoff Reminder</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Get an alert 15 minutes before the match with latest AI tips and odds.
              </p>
            </div>
            <Switch
              checked={kickoffReminder}
              onCheckedChange={setKickoffReminder}
              aria-label="Toggle kickoff reminder"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Live Score & Goal Alerts</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Real-time browser notifications when goals are scored in this match.
              </p>
            </div>
            <Switch
              checked={liveScoreAlerts}
              onCheckedChange={setLiveScoreAlerts}
              aria-label="Toggle live score alerts"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Full-Time Result & Tip Outcome</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Receive the final match score and AI prediction outcome (Won/Lost).
              </p>
            </div>
            <Switch
              checked={finalResult}
              onCheckedChange={setFinalResult}
              aria-label="Toggle full-time result alerts"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          {subscribed && (
            <Button
              type="button"
              variant="outline"
              onClick={handleUnsubscribe}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 w-full sm:w-auto"
            >
              Unsubscribe
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || (!kickoffReminder && !liveScoreAlerts && !finalResult)}
            className="w-full sm:flex-1 font-bold gap-2"
          >
            {loading ? (
              'Saving...'
            ) : subscribed ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Update Preferences
              </>
            ) : (
              <>
                <BellRing className="h-4 w-4" /> Subscribe to Match
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
