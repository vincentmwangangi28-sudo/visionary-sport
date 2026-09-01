import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { useCurrency } from '@/hooks/useCurrency';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/services/i18n';
import { POPULAR_TIMEZONES, getDeviceTimezone } from '@/services/timezoneService';
import { SUPPORTED_ODDS_FORMATS, SupportedOddsFormat } from '@/services/oddsConverter';
import { SupportedCurrencyCode } from '@/services/currencyService';
import {
  Globe,
  Languages,
  Clock,
  Percent,
  Coins,
  MapPin,
  Check,
  RotateCcw,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

interface GlobalSettingsModalProps {
  children?: React.ReactNode;
  defaultTab?: 'region' | 'language' | 'currency' | 'timezone' | 'odds';
  triggerClassName?: string;
}

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({
  children,
  defaultTab = 'region',
  triggerClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const {
    preferences,
    setLanguage,
    setTimezone,
    setOddsFormat,
    toggleDataSaver,
  } = useUserPreferences();

  const {
    region,
    regionId,
    setRegion,
    allRegions,
    isAutoDetected,
  } = useGeoRegion();

  const {
    currency,
    currencyConfig,
    setCurrency,
    allCurrencies,
  } = useCurrency();

  const deviceTz = getDeviceTimezone();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={`h-8 gap-1.5 px-2.5 text-xs font-semibold border-primary/30 hover:border-primary/60 bg-background/80 ${triggerClassName}`}
            aria-label="Open Global Preferences"
          >
            <span className="text-sm">{region.flag}</span>
            <span className="font-mono font-bold text-foreground">{currencyConfig.code}</span>
            <span className="text-muted-foreground">•</span>
            <span className="uppercase text-[11px] font-bold text-primary">{preferences.language}</span>
            <SlidersHorizontal className="h-3 w-3 text-muted-foreground ml-0.5" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Global Personalization Center
            </DialogTitle>
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
              {region.flag} {region.name}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Configure region, language, currency, timezone & odds formats across all algorithms.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full mt-3">
          <TabsList className="grid grid-cols-5 w-full h-10 p-1 bg-muted/60">
            <TabsTrigger value="region" className="text-xs gap-1 data-[state=active]:font-bold">
              <MapPin className="h-3.5 w-3.5 hidden sm:inline" /> Region
            </TabsTrigger>
            <TabsTrigger value="currency" className="text-xs gap-1 data-[state=active]:font-bold">
              <Coins className="h-3.5 w-3.5 hidden sm:inline" /> Currency
            </TabsTrigger>
            <TabsTrigger value="language" className="text-xs gap-1 data-[state=active]:font-bold">
              <Languages className="h-3.5 w-3.5 hidden sm:inline" /> Language
            </TabsTrigger>
            <TabsTrigger value="timezone" className="text-xs gap-1 data-[state=active]:font-bold">
              <Clock className="h-3.5 w-3.5 hidden sm:inline" /> Timezone
            </TabsTrigger>
            <TabsTrigger value="odds" className="text-xs gap-1 data-[state=active]:font-bold">
              <Percent className="h-3.5 w-3.5 hidden sm:inline" /> Odds
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GEOGRAPHIC REGION */}
          <TabsContent value="region" className="space-y-4 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Determines which domestic and continental leagues appear at the top of your feeds.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRegion('auto');
                  toast.success('Reset to Auto-Detected Region');
                }}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Auto
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {allRegions.map((r) => {
                const isSelected = regionId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRegion(r.id);
                      toast.success(`Region updated to ${r.name}`);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30 font-bold'
                        : 'border-border hover:border-primary/40 bg-muted/10'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{r.flag}</span>
                        <span className="text-xs font-bold text-foreground truncate">{r.name}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                        {r.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.topLeagues.slice(0, 3).map((l) => (
                          <span
                            key={l.name}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-1 mt-1" />}
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: MULTI-CURRENCY */}
          <TabsContent value="currency" className="space-y-4 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Set your staking & bankroll currency for calculators, multi-builders, and subscriptions.
              </p>
              <Badge variant="outline" className="text-xs font-mono font-bold text-primary">
                Current: {currencyConfig.code} ({currencyConfig.symbol})
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {allCurrencies.map((c) => {
                const isSelected = currency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCurrency(c.code as SupportedCurrencyCode);
                      toast.success(`Currency switched to ${c.code} (${c.name})`);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/40 bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl">{c.flag}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold">{c.code}</span>
                          <span className="text-[11px] text-muted-foreground">({c.symbol})</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{c.name}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 3: LANGUAGE */}
          <TabsContent value="language" className="space-y-4 pt-3">
            <p className="text-xs text-muted-foreground">
              Select your preferred language. Includes native translation dictionaries with RTL support.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = preferences.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code as SupportedLanguage);
                      toast.success(`Language set to ${lang.name} (${lang.nativeName})`);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/40 bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{lang.nativeName}</span>
                          <span className="text-xs text-muted-foreground">({lang.name})</span>
                        </div>
                        {lang.direction === 'rtl' && (
                          <span className="text-[10px] text-primary font-medium">RTL Layout</span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 4: TIMEZONE */}
          <TabsContent value="timezone" className="space-y-4 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                All match kickoff times and in-play clocks convert to this timezone automatically.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTimezone('auto');
                  toast.success('Timezone reset to Auto-Detect');
                }}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Auto ({deviceTz})
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  setTimezone('auto');
                  toast.success('Set to Device Auto-Detect');
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  preferences.timezone === 'auto'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30 font-bold'
                    : 'border-border hover:border-primary/40 bg-muted/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">📍 Auto-Detect Device Time</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{deviceTz}</p>
                </div>
                {preferences.timezone === 'auto' && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>

              {POPULAR_TIMEZONES.map((tz) => {
                const isSelected = preferences.timezone === tz.iana;
                return (
                  <button
                    key={tz.iana}
                    type="button"
                    onClick={() => {
                      setTimezone(tz.iana);
                      toast.success(`Timezone updated to ${tz.label}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30 font-bold'
                        : 'border-border hover:border-primary/40 bg-muted/10'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">{tz.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-primary font-mono">{tz.offset}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{tz.region}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 5: ODDS FORMAT & DATA SAVER */}
          <TabsContent value="odds" className="space-y-4 pt-3">
            <p className="text-xs text-muted-foreground">
              Select how betting lines and probabilities are displayed across all prediction tables.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SUPPORTED_ODDS_FORMATS.map((fmt) => {
                const isSelected = preferences.oddsFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setOddsFormat(fmt.id as SupportedOddsFormat);
                      toast.success(`Odds format set to ${fmt.name}`);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30 font-bold'
                        : 'border-border hover:border-primary/40 bg-muted/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{fmt.name}</span>
                        <span className="text-xs font-mono text-primary font-black bg-primary/10 px-1.5 py-0.5 rounded">
                          {fmt.example}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{fmt.description}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {/* Performance & Data Saver */}
            <div className="pt-3 border-t flex items-center justify-between bg-muted/30 p-3 rounded-xl">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> Data Saver & Bandwidth Mode
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Reduces polling rate and pauses high-res imagery for faster mobile browsing.
                </p>
              </div>
              <Switch
                checked={preferences.dataSaverMode}
                onCheckedChange={toggleDataSaver}
                aria-label="Toggle data saver mode"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-4 mt-2 border-t flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Settings persist across your browser session.
          </span>
          <Button size="sm" onClick={() => setOpen(false)} className="h-8 px-4 text-xs font-bold">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
