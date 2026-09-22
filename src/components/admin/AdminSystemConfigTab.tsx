import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings2, ShieldAlert, Cpu, Sparkles, Send, Coins, RotateCcw, 
  Save, AlertTriangle, CheckCircle2, Lock, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getSystemConfig, 
  saveSystemConfig, 
  resetSystemConfig, 
  SystemConfig 
} from '@/services/systemConfigService';
import { 
  getAdSenseConfig, 
  saveAdSenseConfig, 
  verifyAdsTxtStatus, 
  AdSenseConfig 
} from '@/services/adsenseService';
import { logAdminAction } from '@/services/adminAuditService';

export const AdminSystemConfigTab: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>(getSystemConfig());
  const [adConfig, setAdConfig] = useState<AdSenseConfig>(getAdSenseConfig());
  const [adsTxtChecking, setAdsTxtChecking] = useState(false);
  const [adsTxtResult, setAdsTxtResult] = useState<{ valid: boolean; status: number; message: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConfig(getSystemConfig());
    setAdConfig(getAdSenseConfig());
  }, []);

  const handleChange = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleAdConfigChange = <K extends keyof AdSenseConfig>(key: K, value: AdSenseConfig[K]) => {
    setAdConfig(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSlotChange = (slotKey: keyof AdSenseConfig['slots'], value: string) => {
    setAdConfig(prev => ({
      ...prev,
      slots: { ...prev.slots, [slotKey]: value.trim() },
    }));
    setIsDirty(true);
  };

  const handleCheckAdsTxt = async () => {
    setAdsTxtChecking(true);
    try {
      const res = await verifyAdsTxtStatus();
      if (res.valid) {
        setAdsTxtResult({
          valid: true,
          status: res.status,
          message: `Verified: ${res.foundEntry}`,
        });
        toast.success('ads.txt is active and valid for Google AdSense!');
      } else {
        setAdsTxtResult({
          valid: false,
          status: res.status,
          message: res.error || 'Verification failed',
        });
        toast.error('ads.txt verification warning', {
          description: res.error,
        });
      }
    } catch (e: any) {
      toast.error('Failed to verify ads.txt', { description: e?.message });
    } finally {
      setAdsTxtChecking(false);
    }
  };

  const handleSave = () => {
    setSaving(true);
    try {
      saveSystemConfig(config, 'Vincent Mwangangi');
      saveAdSenseConfig(adConfig);
      logAdminAction({
        actorName: 'Vincent Mwangangi',
        actorEmail: 'vincentmwangangi28@gmail.com',
        category: 'config',
        action: 'Updated Platform System Configuration & AdSense',
        details: `Saved live config: VIP=${config.vipGateEnforced ? 'Strict' : 'Off'}, Model=${config.geminiModel}, AdSense=${adConfig.enabled ? 'Enabled' : 'Disabled'}, PubID=${adConfig.publisherId}`,
        severity: config.maintenanceMode ? 'warning' : 'info',
        ipAddress: '197.237.142.88 (Nairobi, KE)',
      });

      setIsDirty(false);
      toast.success('System & AdSense configuration updated successfully', {
        description: 'New parameters and ad slots are active across all pages.',
      });
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all system feature flags to factory defaults?')) {
      const reset = resetSystemConfig();
      setConfig(reset);
      setIsDirty(false);
      logAdminAction({
        actorName: 'Vincent Mwangangi',
        actorEmail: 'vincentmwangangi28@gmail.com',
        category: 'config',
        action: 'Reset System Configuration',
        details: 'Restored factory default configuration for PredictPro.',
        severity: 'warning',
        ipAddress: '197.237.142.88 (Nairobi, KE)',
      });
      toast.info('Settings restored to default');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Settings2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Platform Feature Flags & Engine Config</h2>
              <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                Vincent Mwangangi
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live switches for VIP locks, Gemini AI models, auto-dispatch pipelines, and coin economy rates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="text-xs h-9 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </Button>

          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={!isDirty || saving}
            className="text-xs h-9 gap-1.5 font-medium shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}</span>
          </Button>
        </div>
      </div>

      {/* Emergency / Maintenance Mode Warning (if active) */}
      {config.maintenanceMode && (
        <Card className="border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">Maintenance Mode Active</div>
                <div className="text-xs text-muted-foreground">{config.maintenanceMessage}</div>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-8 border-amber-500/30 text-amber-600 dark:text-amber-400"
              onClick={() => {
                handleChange('maintenanceMode', false);
              }}
            >
              Disable Mode
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Access Control & VIP Gates */}
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-violet-500" />
              <CardTitle className="text-sm font-semibold">Access Control & VIP Security</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Govern user gating for premium VIP predictions and guest browsing rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/30">
              <div className="space-y-0.5 pr-2">
                <Label className="text-xs font-medium cursor-pointer">Enforce Strict VIP Gate</Label>
                <p className="text-[11px] text-muted-foreground">
                  Lock premium Banker & VIP picks behind active paid subscriptions.
                </p>
              </div>
              <Switch
                checked={config.vipGateEnforced}
                onCheckedChange={(checked) => handleChange('vipGateEnforced', checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/30">
              <div className="space-y-0.5 pr-2">
                <Label className="text-xs font-medium cursor-pointer">Allow Guest Browsing</Label>
                <p className="text-[11px] text-muted-foreground">
                  Non-logged-in users can view public predictions and stats.
                </p>
              </div>
              <Switch
                checked={config.allowGuestPredictionsView}
                onCheckedChange={(checked) => handleChange('allowGuestPredictionsView', checked)}
              />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-medium">Max Daily Free Picks Per Non-VIP</Label>
                <span className="font-semibold text-primary">{config.maxDailyFreePicks} picks</span>
              </div>
              <Input
                type="number"
                min={1}
                max={20}
                value={config.maxDailyFreePicks}
                onChange={(e) => handleChange('maxDailyFreePicks', parseInt(e.target.value) || 5)}
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Gemini AI & Automation Hub */}
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-sky-500" />
              <CardTitle className="text-sm font-semibold">Gemini AI Engine & Automation</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Configure underlying AI models and automated dispatch pipelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Active Gemini Model Engine</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.8-flash'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleChange('geminiModel', m)}
                    className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                      config.geminiModel === m 
                        ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs' 
                        : 'border-border/60 hover:bg-muted/50 text-muted-foreground text-xs'
                    }`}
                  >
                    <div className="text-[11px] font-semibold truncate">{m}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {m.includes('3.8') ? 'Next-Gen' : m.includes('pro') ? 'Deep Analysis' : 'High Speed'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/30">
              <div className="space-y-0.5 pr-2">
                <Label className="text-xs font-medium cursor-pointer">Auto-Publish AI Predictions</Label>
                <p className="text-[11px] text-muted-foreground">
                  Directly publish generated predictions to the live feed without manual draft review.
                </p>
              </div>
              <Switch
                checked={config.autoPublishPredictions}
                onCheckedChange={(checked) => handleChange('autoPublishPredictions', checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/30">
              <div className="space-y-0.5 pr-2">
                <Label className="text-xs font-medium cursor-pointer">Telegram Instant Broadcast</Label>
                <p className="text-[11px] text-muted-foreground">
                  Automatically forward VIP Banker picks to the official Telegram channel.
                </p>
              </div>
              <Switch
                checked={config.telegramAutoBroadcast}
                onCheckedChange={(checked) => handleChange('telegramAutoBroadcast', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Economy & Gamification */}
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold">Coins Economy & Rewards</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tune coin incentives, signup grants, and daily wheel spin multipliers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-medium">Daily Wheel Spin Multiplier</Label>
                <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 font-semibold">
                  {config.spinWheelMultiplier}x Boost
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((multiplier) => (
                  <button
                    key={multiplier}
                    type="button"
                    onClick={() => handleChange('spinWheelMultiplier', multiplier)}
                    className={`py-2 px-3 rounded-lg border text-center transition-all ${
                      config.spinWheelMultiplier === multiplier
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'border-border/60 hover:bg-muted/50 text-xs text-muted-foreground'
                    }`}
                  >
                    <div className="text-xs font-bold">{multiplier}x Normal</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {multiplier === 1 ? 'Standard' : multiplier === 2 ? 'Weekend 2x' : 'Mega Promo 3x'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-medium">Welcome Signup Bonus Coins</Label>
                <span className="font-semibold text-primary">{config.signupBonusCoins} Coins</span>
              </div>
              <Input
                type="number"
                min={0}
                max={500}
                step={10}
                value={config.signupBonusCoins}
                onChange={(e) => handleChange('signupBonusCoins', parseInt(e.target.value) || 0)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Credited automatically into new user wallets upon email verification.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-medium">Min Banker Confidence Level</Label>
                <span className="font-semibold text-emerald-500">{config.minBankerConfidence}%</span>
              </div>
              <Input
                type="number"
                min={70}
                max={99}
                value={config.minBankerConfidence}
                onChange={(e) => handleChange('minBankerConfidence', parseInt(e.target.value) || 85)}
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Maintenance & Emergency Switch */}
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              <CardTitle className="text-sm font-semibold">Maintenance Mode & Resilience</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Gracefully throttle platform interactions during database upgrades.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/30">
              <div className="space-y-0.5 pr-2">
                <Label className="text-xs font-medium cursor-pointer text-rose-500 font-semibold">
                  Enable Maintenance Mode
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Displays maintenance notice to public visitors while allowing Vincent Mwangangi admin access.
                </p>
              </div>
              <Switch
                checked={config.maintenanceMode}
                onCheckedChange={(checked) => handleChange('maintenanceMode', checked)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Public Maintenance Message</Label>
              <Input
                value={config.maintenanceMessage}
                onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                placeholder="Message shown to users during upgrades..."
                className="h-9 text-xs"
              />
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Last Updated:</span>
                <span className="font-mono text-[11px]">{new Date(config.updatedAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Authorized Modifier:</span>
                <span className="font-medium text-foreground">{config.updatedBy}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Section 5: Google AdSense & Monetization Architecture */}
        <Card className="border-border/80 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Google AdSense &amp; Ads.txt Monetization Architecture</CardTitle>
              </div>
              <Badge variant={adConfig.enabled ? 'default' : 'secondary'} className="text-[10px]">
                {adConfig.enabled ? 'AdSense Active' : 'AdSense Disabled'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Manage live Google publisher client IDs, responsive ad slot identifiers, test simulation mode, and ads.txt crawler compliance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/30">
                <div className="space-y-0.5 pr-2">
                  <Label className="text-xs font-medium cursor-pointer">Enable AdSense Globally</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Renders Google ad slots for non-VIP guest visitors. VIP users are automatically ad-free.
                  </p>
                </div>
                <Switch
                  checked={adConfig.enabled}
                  onCheckedChange={(checked) => handleAdConfigChange('enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/30">
                <div className="space-y-0.5 pr-2">
                  <Label className="text-xs font-medium cursor-pointer">Test / Preview Mode</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Displays styled placeholder banners indicating slots without triggering real ad impressions.
                  </p>
                </div>
                <Switch
                  checked={adConfig.testMode}
                  onCheckedChange={(checked) => handleAdConfigChange('testMode', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">AdSense Publisher ID (ca-pub-XXXXXXXXXX)</Label>
                <Input
                  value={adConfig.publisherId}
                  onChange={(e) => handleAdConfigChange('publisherId', e.target.value.trim())}
                  placeholder="ca-pub-1375386376692976"
                  className="h-9 text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Must match the client ID in <code className="text-foreground font-mono">/ads.txt</code> and <code className="text-foreground font-mono">index.html</code>.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Horizontal Leaderboard Slot ID</Label>
                <Input
                  value={adConfig.slots.horizontal}
                  onChange={(e) => handleSlotChange('horizontal', e.target.value)}
                  placeholder="9842105432"
                  className="h-9 text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Used on Match Predictor, BTTS, Best Bets, and News.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Medium Rectangle Slot ID</Label>
                <Input
                  value={adConfig.slots.rectangle}
                  onChange={(e) => handleSlotChange('rectangle', e.target.value)}
                  placeholder="8743209123"
                  className="h-9 text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Used in sidebar widgets and post content breaks.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">In-Feed Responsive Slot ID</Label>
                <Input
                  value={adConfig.slots.feed}
                  onChange={(e) => handleSlotChange('feed', e.target.value)}
                  placeholder="6543210987"
                  className="h-9 text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Integrated between list items and prediction cards.
                </p>
              </div>
            </div>

            {/* Ads.txt Live Health Check */}
            <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Google Ads.txt Crawler Status</span>
                  {adsTxtResult ? (
                    adsTxtResult.valid ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                        HTTP {adsTxtResult.status} • Valid &amp; Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">
                        HTTP {adsTxtResult.status} • Discrepancy
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Not Checked Yet
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCheckAdsTxt}
                    disabled={adsTxtChecking}
                    className="h-8 text-xs gap-1.5"
                  >
                    <RefreshCw className={`h-3 w-3 ${adsTxtChecking ? 'animate-spin' : ''}`} />
                    {adsTxtChecking ? 'Verifying...' : 'Verify /ads.txt'}
                  </Button>
                  <a
                    href="/ads.txt"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Open /ads.txt
                  </a>
                </div>
              </div>

              {adsTxtResult && (
                <p className={`text-[11px] font-mono p-2 rounded-md ${
                  adsTxtResult.valid ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-destructive/10 text-destructive'
                }`}>
                  {adsTxtResult.message}
                </p>
              )}

              <p className="text-[11px] text-muted-foreground">
                Googlebot and Mediapartners-Google require <code className="text-foreground font-mono">google.com, pub-1375386376692976, DIRECT, f08c47fec0942fa0</code> at the domain root with standard <code className="text-foreground font-mono">text/plain</code> headers to avoid earnings-at-risk flags.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
