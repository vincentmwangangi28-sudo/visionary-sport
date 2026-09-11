import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAutomatedAlerts } from '@/hooks/useAutomatedAlerts';
import { playAlertChime } from '@/utils/audioAlert';
import {
  BellRing,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Volume2,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  Pin,
  Globe,
} from 'lucide-react';

interface AutomatedAlertsSettingsCardProps {
  className?: string;
}

export const AutomatedAlertsSettingsCard: React.FC<AutomatedAlertsSettingsCardProps> = ({ className = '' }) => {
  const {
    config,
    updateConfig,
    permission,
    isPushSupported,
    enableBrowserPush,
    testAlert,
    evaluateNow,
  } = useAutomatedAlerts();

  const isGranted = permission === 'granted';

  return (
    <Card className={`border-border/70 shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" aria-hidden="true" />
              Automated Alerts & Proactive Match Engine
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Real-time automated alerts for your pinned clubs, global leagues, high-confidence banker picks, and positive expected value (+EV) opportunities.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isPushSupported && (
              <Badge
                variant="outline"
                className={
                  isGranted
                    ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10'
                }
              >
                {isGranted ? (
                  <span className="flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 className="h-3 w-3" /> Push Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-[11px]">
                    <AlertTriangle className="h-3 w-3" /> Push Inactive
                  </span>
                )}
              </Badge>
            )}

            <Badge variant="secondary" className="font-bold text-[11px]">
              {config.enabled ? 'Rules Running' : 'Muted'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Permission Callout if push not granted */}
        {isPushSupported && !isGranted && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
                Enable Native Browser Push Alerts
              </div>
              <p className="text-[11px] text-muted-foreground">
                Receive kickoff reminders, banker tips, and full-time scores even when your browser tab is closed.
              </p>
            </div>
            <Button
              size="sm"
              onClick={enableBrowserPush}
              className="gap-1.5 font-bold shrink-0 text-xs h-8"
            >
              <BellRing className="h-3.5 w-3.5" />
              Enable Push
            </Button>
          </div>
        )}

        {/* Master Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div>
            <Label htmlFor="master-automated-toggle" className="font-bold text-sm text-foreground cursor-pointer">
              Master Automated Alerts Engine
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Continuously monitors upcoming fixtures and odds movements in the background.
            </p>
          </div>
          <Switch
            id="master-automated-toggle"
            checked={config.enabled}
            onCheckedChange={(checked) => updateConfig({ enabled: checked })}
            aria-label="Toggle all automated alerts"
          />
        </div>

        {/* Rule Toggles Grid */}
        <div className="space-y-4 pt-1">
          {/* Rule 1: Pinned Clubs */}
          <div className="flex items-start justify-between gap-3 py-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-primary fill-primary/30" />
                <Label htmlFor="toggle-pinned-clubs" className="font-semibold text-sm text-foreground cursor-pointer">
                  Pinned Clubs Matchday Radar
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Automated reminders for any club pinned to your dashboard (Arsenal, Real Madrid, etc.) before kickoff and upon full-time results.
              </p>
            </div>
            <Switch
              id="toggle-pinned-clubs"
              disabled={!config.enabled}
              checked={config.alertOnPinnedClubs}
              onCheckedChange={(checked) => updateConfig({ alertOnPinnedClubs: checked })}
              aria-label="Toggle Pinned Clubs Alerts"
            />
          </div>

          {/* Rule 2: High Confidence Banker Picks */}
          <div className="flex items-start justify-between gap-3 py-1 border-t border-border/40 pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <Label htmlFor="toggle-banker-picks" className="font-semibold text-sm text-foreground cursor-pointer">
                  High-Confidence Banker Picks
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-alert whenever algorithm calculates confidence at or above your threshold.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground font-medium">Trigger threshold:</span>
                <select
                  disabled={!config.enabled || !config.alertOnHighConfidence}
                  value={config.minConfidenceThreshold}
                  onChange={(e) => updateConfig({ minConfidenceThreshold: Number(e.target.value) })}
                  className="h-7 text-xs bg-muted rounded-md px-2 border border-border text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Minimum Confidence Threshold"
                >
                  <option value={80}>≥ 80% (More picks)</option>
                  <option value={85}>≥ 85% (Balanced Bankers)</option>
                  <option value={90}>≥ 90% (Ultra-Safe Only)</option>
                </select>
              </div>
            </div>
            <Switch
              id="toggle-banker-picks"
              disabled={!config.enabled}
              checked={config.alertOnHighConfidence}
              onCheckedChange={(checked) => updateConfig({ alertOnHighConfidence: checked })}
              aria-label="Toggle Banker Picks Alerts"
            />
          </div>

          {/* Rule 3: Positive EV Value Bets */}
          <div className="flex items-start justify-between gap-3 py-1 border-t border-border/40 pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <Label htmlFor="toggle-value-bets" className="font-semibold text-sm text-foreground cursor-pointer">
                  Positive Expected Value (+EV) Alerts
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Get alerted when closing line value analysis spots an edge over standard bookmaker odds.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground font-medium">Minimum Edge:</span>
                <select
                  disabled={!config.enabled || !config.alertOnValueBets}
                  value={config.minValueEdgeThreshold}
                  onChange={(e) => updateConfig({ minValueEdgeThreshold: Number(e.target.value) })}
                  className="h-7 text-xs bg-muted rounded-md px-2 border border-border text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Minimum Value Edge Threshold"
                >
                  <option value={4}>+4% Statistical Edge</option>
                  <option value={6}>+6% Strong Value Edge</option>
                  <option value={8}>+8% Premium Mispriced Edge</option>
                </select>
              </div>
            </div>
            <Switch
              id="toggle-value-bets"
              disabled={!config.enabled}
              checked={config.alertOnValueBets}
              onCheckedChange={(checked) => updateConfig({ alertOnValueBets: checked })}
              aria-label="Toggle Value Bet Alerts"
            />
          </div>

          {/* Rule 4: Pinned Leagues Radar */}
          <div className="flex items-start justify-between gap-3 py-1 border-t border-border/40 pt-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <Label htmlFor="toggle-pinned-leagues" className="font-semibold text-sm text-foreground cursor-pointer">
                  Pinned Tournaments & Leagues Radar
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Notify me when key matches in my followed competitions (Champions League, Premier League, AFCON) are about to start.
              </p>
            </div>
            <Switch
              id="toggle-pinned-leagues"
              disabled={!config.enabled}
              checked={config.alertOnPinnedLeagues}
              onCheckedChange={(checked) => updateConfig({ alertOnPinnedLeagues: checked })}
              aria-label="Toggle Pinned Leagues Alerts"
            />
          </div>

          {/* Rule 5: Kickoff Lead Time Timing */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1 border-t border-border/40 pt-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">
                  Kickoff Reminder Timing
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                How far in advance of match kickoff you want the reminder sent.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[15, 30, 60].map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  size="sm"
                  variant={config.kickoffLeadMinutes === mins ? 'default' : 'outline'}
                  onClick={() => updateConfig({ kickoffLeadMinutes: mins })}
                  className="h-8 px-3 text-xs font-bold"
                >
                  {mins === 60 ? '1 hour' : `${mins}m`}
                </Button>
              ))}
            </div>
          </div>

          {/* Rule 6: Sound Chimes */}
          <div className="flex items-start justify-between gap-3 py-1 border-t border-border/40 pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <Label htmlFor="toggle-sound-alerts" className="font-semibold text-sm text-foreground cursor-pointer">
                  Auditory Alert Chimes
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Plays a pleasant audio tone whenever an automated match or banker tip alert is triggered.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => playAlertChime('value')}
                className="h-7 text-xs text-primary hover:text-primary px-2 gap-1 font-semibold"
              >
                <Volume2 className="h-3 w-3" /> Test Sound Chime
              </Button>
            </div>
            <Switch
              id="toggle-sound-alerts"
              checked={config.soundEnabled}
              onCheckedChange={(checked) => updateConfig({ soundEnabled: checked })}
              aria-label="Toggle Sound Alerts"
            />
          </div>

          {/* Rule 7: Daily Morning Digest */}
          <div className="flex items-start justify-between gap-3 py-1 border-t border-border/40 pt-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label htmlFor="toggle-daily-digest" className="font-semibold text-sm text-foreground cursor-pointer">
                  Daily Morning Digest (8:00 AM UTC)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Curated daily dispatch highlighting the top 3 value bets, banker accumulators, and highest edge markets.
              </p>
            </div>
            <Switch
              id="toggle-daily-digest"
              checked={config.dailyDigestEnabled}
              onCheckedChange={(checked) => updateConfig({ dailyDigestEnabled: checked })}
              aria-label="Toggle Daily Digest"
            />
          </div>
        </div>

        {/* Interactive Alert Test Lab */}
        <div className="rounded-xl bg-muted/40 border border-border/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-primary" />
              Automated Alert Test Lab
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={evaluateNow}
              className="h-7 text-[11px] font-bold"
            >
              Evaluate Active Fixtures Now
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Test how automated alerts appear across your device (push notification, sound effect, and in-app alert feed):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testAlert('pinned_club')}
              className="text-xs h-8 font-semibold justify-center hover:border-primary/50"
            >
              ⚽ Pinned Club
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testAlert('high_confidence')}
              className="text-xs h-8 font-semibold justify-center hover:border-amber-500/50 text-amber-600 dark:text-amber-400"
            >
              🔥 89% Banker
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testAlert('value_bet')}
              className="text-xs h-8 font-semibold justify-center hover:border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
            >
              ⚡ +EV Value
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testAlert('goal_alert')}
              className="text-xs h-8 font-semibold justify-center hover:border-red-500/50 text-red-600 dark:text-red-400"
            >
              🚨 Goal Flash
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
