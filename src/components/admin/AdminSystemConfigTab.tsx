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
import { logAdminAction } from '@/services/adminAuditService';

export const AdminSystemConfigTab: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>(getSystemConfig());
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConfig(getSystemConfig());
  }, []);

  const handleChange = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    setSaving(true);
    try {
      saveSystemConfig(config, 'Vincent Mwangangi');
      logAdminAction({
        actorName: 'Vincent Mwangangi',
        actorEmail: 'vincentmwangangi28@gmail.com',
        category: 'config',
        action: 'Updated Platform System Configuration',
        details: `Saved live config: VIP=${config.vipGateEnforced ? 'Strict' : 'Off'}, Model=${config.geminiModel}, AutoPublish=${config.autoPublishPredictions}, SpinMultiplier=${config.spinWheelMultiplier}x, SignupCoins=${config.signupBonusCoins}`,
        severity: config.maintenanceMode ? 'warning' : 'info',
        ipAddress: '197.237.142.88 (Nairobi, KE)',
      });

      setIsDirty(false);
      toast.success('System configuration updated successfully', {
        description: 'New feature flags and engine parameters are active across the app.',
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
      </div>
    </div>
  );
};
