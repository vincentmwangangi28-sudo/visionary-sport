import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  getSiteAnnouncement, 
  saveSiteAnnouncement, 
  resetAnnouncementDismissal, 
  SiteAnnouncement 
} from '@/services/broadcastService';
import { 
  Megaphone, 
  Sparkles, 
  Info, 
  AlertTriangle, 
  Crown, 
  Eye, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  ArrowRight,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminBroadcastBannerManager() {
  const [form, setForm] = useState<SiteAnnouncement>(getSiteAnnouncement);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm(getSiteAnnouncement());
  }, []);

  const handleChange = <K extends keyof SiteAnnouncement>(key: K, value: SiteAnnouncement[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
    setDirty(true);
  };

  const handleSave = () => {
    const updated: SiteAnnouncement = {
      ...form,
      id: `announcement-${Date.now()}`,
      updatedAt: new Date().toISOString(),
      author: 'Vincent Mwangangi',
    };
    saveSiteAnnouncement(updated);
    setForm(updated);
    setDirty(false);
    toast.success('Site-wide broadcast banner published immediately!');
  };

  const handleResetDismissals = () => {
    resetAnnouncementDismissal(form.id);
    toast.success('Dismissal state reset. The banner is now visible again for all users.');
  };

  const applyTemplate = (tpl: {
    headline: string;
    message: string;
    theme: SiteAnnouncement['theme'];
    ctaText: string;
    ctaUrl: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      ...tpl,
      enabled: true,
      updatedAt: new Date().toISOString(),
    }));
    setDirty(true);
    toast.info(`Applied template: "${tpl.headline}"`);
  };

  return (
    <div className="space-y-6">
      {/* Live Preview Card */}
      <Card className="border-border/80 overflow-hidden shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Live Visitor Preview</CardTitle>
            </div>
            <Badge variant={form.enabled ? 'default' : 'outline'} className="text-xs">
              {form.enabled ? 'Status: Active Live' : 'Status: Paused'}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            This is an exact visual representation of the banner as seen by users at the top of the application.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 bg-muted/10">
          {form.enabled ? (
            <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs transition-all ${
              form.theme === 'promo'
                ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-background text-emerald-100 border-emerald-500/40'
                : form.theme === 'info'
                ? 'bg-gradient-to-r from-sky-950 via-sky-900 to-background text-sky-100 border-sky-500/40'
                : form.theme === 'urgent'
                ? 'bg-gradient-to-r from-amber-950 via-amber-900 to-background text-amber-100 border-amber-500/40'
                : 'bg-gradient-to-r from-purple-950 via-violet-900 to-background text-purple-100 border-purple-500/40'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="p-1.5 rounded-lg bg-black/20 flex-shrink-0">
                  {form.theme === 'promo' && <Sparkles className="h-4 w-4 text-emerald-400" />}
                  {form.theme === 'info' && <Info className="h-4 w-4 text-sky-400" />}
                  {form.theme === 'urgent' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                  {form.theme === 'vip' && <Crown className="h-4 w-4 text-amber-400" />}
                </div>

                <div className="min-w-0">
                  <div className="font-bold text-white tracking-tight">{form.headline || 'Your Headline Here'}</div>
                  <div className="text-white/80 line-clamp-1">{form.message || 'Your announcement copy goes here...'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {form.ctaText && (
                  <Button size="sm" className="h-7 text-xs px-2.5 gap-1 shadow-xs pointer-events-none">
                    <span>{form.ctaText}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
                {form.dismissible && (
                  <span className="text-[10px] text-white/50 px-1.5 py-0.5 border border-white/20 rounded">
                    Dismissible [X]
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              Broadcast banner is currently disabled. Toggle &quot;Enable Site-wide Broadcast&quot; below to display.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Site-Wide Announcement & Broadcast Dispatcher
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Published by Administrator <strong className="text-foreground">Vincent Mwangangi</strong>. Instantly alert all users regarding banker picks, coin promos, or matchday tips.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border px-3 py-1.5 rounded-lg bg-muted/30">
                <span className="text-xs font-medium">Broadcast Active:</span>
                <Switch
                  checked={form.enabled}
                  onCheckedChange={(val) => handleChange('enabled', val)}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!dirty}
                size="sm"
                className="gap-1.5 text-xs font-semibold bg-primary"
              >
                <Save className="h-3.5 w-3.5" />
                Publish Changes
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Preset Quick Templates */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Instant Broadcast Templates:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate({
                  headline: 'Weekend Banker Tips Ready!',
                  message: 'Premier League & Champions League algorithmic picks with 87% accuracy live now.',
                  theme: 'promo',
                  ctaText: 'View Banker Picks',
                  ctaUrl: '/best-bets',
                })}
                className="text-xs justify-start h-auto py-2 flex-col items-start gap-0.5"
              >
                <span className="font-semibold text-emerald-500">🔥 Matchday Bankers</span>
                <span className="text-[10px] text-muted-foreground">Premier League & UCL picks</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate({
                  headline: 'Weekend 50% Bonus Coins Promo!',
                  message: 'Top up any coin pack today and receive 50% extra coins instantly on M-Pesa.',
                  theme: 'promo',
                  ctaText: 'Claim Coins',
                  ctaUrl: '/shop',
                })}
                className="text-xs justify-start h-auto py-2 flex-col items-start gap-0.5"
              >
                <span className="font-semibold text-amber-500">🪙 50% Coin Bonus</span>
                <span className="text-[10px] text-muted-foreground">Reward promo top-ups</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate({
                  headline: 'VIP Correct Score Acca Locked',
                  message: 'High-odds 4-fold accumulator with AI probability distribution ready for VIP members.',
                  theme: 'vip',
                  ctaText: 'Unlock VIP Acca',
                  ctaUrl: '/accumulator',
                })}
                className="text-xs justify-start h-auto py-2 flex-col items-start gap-0.5"
              >
                <span className="font-semibold text-purple-500">👑 VIP Acca Drop</span>
                <span className="text-[10px] text-muted-foreground">High-odds accumulator</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate({
                  headline: 'Live Odds Drift Detected',
                  message: 'Significant market movement observed across 8 European matches. Check value bets.',
                  theme: 'urgent',
                  ctaText: 'Inspect Drifts',
                  ctaUrl: '/dropping-odds',
                })}
                className="text-xs justify-start h-auto py-2 flex-col items-start gap-0.5"
              >
                <span className="font-semibold text-rose-500">⚡ Market Odds Alert</span>
                <span className="text-[10px] text-muted-foreground">Sharp line movements</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Headline Text</label>
              <Input
                value={form.headline}
                onChange={(e) => handleChange('headline', e.target.value)}
                placeholder="e.g. Weekend Banker Tips Ready!"
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold">Visual Theme Style</label>
              <div className="grid grid-cols-4 gap-2">
                {(['promo', 'info', 'urgent', 'vip'] as SiteAnnouncement['theme'][]).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => handleChange('theme', theme)}
                    className={`py-1.5 px-2 rounded-lg border text-xs capitalize font-medium text-center transition-all ${
                      form.theme === theme
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold">Announcement Message</label>
            <Textarea
              value={form.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Describe the update, offer, or matchday tip in 1-2 engaging sentences..."
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Target Audience</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['all', 'free', 'vip'] as SiteAnnouncement['targetAudience'][]).map((aud) => (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => handleChange('targetAudience', aud)}
                    className={`py-1.5 px-2 rounded-lg border text-xs capitalize text-center ${
                      form.targetAudience === aud
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {aud === 'all' ? 'All Users' : aud === 'free' ? 'Free Only' : 'VIP Only'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold">Action Button Label (Optional)</label>
              <Input
                value={form.ctaText || ''}
                onChange={(e) => handleChange('ctaText', e.target.value)}
                placeholder="e.g. View Banker Picks"
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold">Action Button Destination (URL / Path)</label>
              <Input
                value={form.ctaUrl || ''}
                onChange={(e) => handleChange('ctaUrl', e.target.value)}
                placeholder="e.g. /best-bets or /shop"
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.dismissible}
                  onCheckedChange={(val) => handleChange('dismissible', val)}
                />
                <span className="text-xs text-muted-foreground">Allow visitors to dismiss [X]</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetDismissals}
                className="h-7 text-xs gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Un-dismiss for all visitors
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={!dirty}
              className="gap-1.5 text-xs font-semibold bg-primary"
            >
              <Save className="h-3.5 w-3.5" />
              Publish Broadcast Live
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
