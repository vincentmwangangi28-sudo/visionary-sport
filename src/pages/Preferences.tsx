import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUserPreferences, RiskProfile } from '@/hooks/useUserPreferences';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { GeographicRegionId } from '@/services/geoRegionService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/services/i18n';
import { POPULAR_TIMEZONES } from '@/services/timezoneService';
import { ODDS_FORMATS, SupportedOddsFormat } from '@/services/oddsConverter';
import { REGIONAL_BOOKMAKERS } from '@/services/bookmakerBookingCodes';
import { toast } from '@/hooks/use-toast';
import {
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  Flame,
  CheckCircle2,
  Bell,
  Coins,
  Globe,
  RotateCcw,
  Sparkles,
  Wifi,
  WifiOff,
  DownloadCloud,
  HardDrive,
  Clock,
  Percent,
  Gauge,
  Check,
  MapPin,
} from 'lucide-react';

const AVAILABLE_LEAGUES = [
  'Premier League',
  'Champions League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'FKF Premier League',
  'AFCON',
  'MLS',
  'Saudi Pro League',
  'Brasileirão',
  'Eredivisie',
  'World Cup',
];

const AVAILABLE_MARKETS = [
  '1X2 (Match Winner)',
  'Over/Under 2.5',
  'BTTS (Both Teams to Score)',
  'Double Chance',
  'Draw No Bet',
  'Correct Score',
  'First Half 1X2',
  'Over/Under 1.5 Goals',
];

export default function Preferences() {
  const {
    preferences,
    updatePreferences,
    setLanguage,
    setTimezone,
    setOddsFormat,
    setDataSaver,
    setRiskProfile,
    toggleFavoriteLeague,
    togglePreferredMarket,
    resetPreferences,
    t,
  } = useUserPreferences();

  const { region, regionId, setRegion, allRegions, isAutoDetected } = useGeoRegion();

  const handleSave = () => {
    toast({
      title: 'Preferences Saved',
      description: `Your global preferences and ${preferences.riskProfile.toUpperCase()} betting profile have been updated.`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Global Customization & Betting Profile Settings | PredictPro"
        description="Configure your language, kickoff timezone, odds format, regional bookmaker, risk profile, and favorite leagues on PredictPro AI."
        canonical="/preferences"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-8 max-w-4xl" tabIndex={-1}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-primary border-primary/30 gap-1.5 px-3 py-1 font-semibold text-xs">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                {t('pref.title', 'Global Platform & AI Customization')}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Worldwide Engine
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t('pref.title', 'Global Preferences & Strategy')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('pref.subtitle', 'Configure language, kickoff timezones, odds format, and bookmakers.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetPreferences} className="gap-1.5 text-xs" aria-label="Reset to default preferences">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset Defaults
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs" aria-label="Save all preferences">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Save Settings
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Global Localization & Region Settings */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
                1. {t('nav.language', 'Language')} & Internationalization
              </CardTitle>
              <CardDescription className="text-xs">
                Choose your preferred interface language.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = preferences.language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code as SupportedLanguage)}
                      aria-pressed={isSelected}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary/30 font-bold'
                          : 'border-border hover:border-primary/40 bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{lang.flag}</span>
                        <div>
                          <div className="text-xs font-bold text-foreground">{lang.nativeName}</div>
                          <div className="text-[10px] text-muted-foreground">{lang.name}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 2. Kickoff Timezone Engine */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                2. {t('nav.timezone', 'Kickoff Timezone Engine')}
              </CardTitle>
              <CardDescription className="text-xs">
                All match start times, live countdowns, and alerts are adjusted to this timezone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {POPULAR_TIMEZONES.map((tz) => {
                  const isSelected = preferences.timezone === tz.value;
                  return (
                    <button
                      key={tz.value}
                      type="button"
                      onClick={() => setTimezone(tz.value)}
                      aria-pressed={isSelected}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary/30 font-bold'
                          : 'border-border hover:border-primary/40 bg-muted/10'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 truncate">
                          <span>{tz.flag}</span>
                          <span className="truncate">{tz.label}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                            {tz.offset}
                          </Badge>
                          <span className="truncate">{tz.region}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 3. Geographic Region & Domestic League Priority */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                  3. Geographic Region & Domestic League Priority
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    {isAutoDetected ? '📍 Auto-Detected' : '⚙️ Custom Selected'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRegion('auto')}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Auto Detect
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">
                Automatically determines which domestic and continental leagues are prioritized at the top of LiveScores and Predictions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {allRegions.map((r) => {
                  const isSelected = regionId === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRegion(r.id)}
                      aria-pressed={isSelected}
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
                            <span key={l.name} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
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
            </CardContent>
          </Card>

          {/* 4. Global Odds System & Regional Bookmakers */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" aria-hidden="true" />
                4. {t('nav.odds_format', 'Global Odds Format')} & Bookmakers
              </CardTitle>
              <CardDescription className="text-xs">
                Select how odds values are rendered across all algorithm tables and your default bookmaker.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Odds formats */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Odds Format
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ODDS_FORMATS.map((fmt) => {
                    const isSelected = preferences.oddsFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setOddsFormat(fmt.id as SupportedOddsFormat)}
                        aria-pressed={isSelected}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary/30 font-bold'
                            : 'border-border hover:border-primary/40 bg-muted/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{fmt.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                        <div className="text-[11px] text-primary font-mono mt-0.5">{fmt.example}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{fmt.region}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Regional Bookmaker */}
              <div className="space-y-2 border-t pt-3">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Default Regional Bookmaker (for 1-Click Code Generation)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REGIONAL_BOOKMAKERS.map((b) => {
                    const isSelected = preferences.defaultBookmaker === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => updatePreferences({ defaultBookmaker: b.id })}
                        aria-pressed={isSelected}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary/30 font-bold'
                            : 'border-border hover:border-primary/40 bg-muted/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{b.flag}</span>
                          <span className="truncate">{b.name}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Data Saver / Performance Optimizer */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" aria-hidden="true" />
                  5. {t('nav.data_saver', 'Data Saver & Bandwidth Optimizer')}
                </CardTitle>
                <Switch
                  checked={preferences.dataSaverMode}
                  onCheckedChange={(checked) => setDataSaver(checked)}
                  aria-label="Toggle Data Saver Mode"
                />
              </div>
              <CardDescription className="text-xs">
                {t('pref.data_saver_desc', 'Optimizes payload sizes, reduces background polling, and lazy loads high-res crests for low-speed mobile connections.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 border rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold">
                  <span>Data Saver Status</span>
                  <Badge variant={preferences.dataSaverMode ? 'default' : 'outline'} className="text-[10px]">
                    {preferences.dataSaverMode ? 'ACTIVE (Saving Data)' : 'DISABLED (Full Assets)'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Ideal for cellular roaming, intermittent connections in emerging markets, or mobile data plans.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 6. Risk Profile Selection */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                6. Risk Tolerance Profile
              </CardTitle>
              <CardDescription className="text-xs">
                This dictates which picks are highlighted on your homepage and daily notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3">
                {/* Conservative */}
                <button
                  type="button"
                  onClick={() => setRiskProfile('conservative')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    preferences.riskProfile === 'conservative'
                      ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500/30'
                      : 'border-border hover:border-green-500/50 bg-muted/20'
                  }`}
                  aria-pressed={preferences.riskProfile === 'conservative'}
                  aria-label="Select Conservative Risk Profile"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-500/10 text-xs font-bold">
                      Safe & Steady
                    </Badge>
                    {preferences.riskProfile === 'conservative' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-foreground">Conservative Profile</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Prioritizes 75%+ confidence single bets (1.30–1.70 odds). Designed for low drawdown and steady growth.
                  </p>
                </button>

                {/* Balanced */}
                <button
                  type="button"
                  onClick={() => setRiskProfile('balanced')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    preferences.riskProfile === 'balanced'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50 bg-muted/20'
                  }`}
                  aria-pressed={preferences.riskProfile === 'balanced'}
                  aria-label="Select Balanced Risk Profile"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant="outline" className="border-primary text-primary bg-primary/10 text-xs font-bold">
                      Recommended
                    </Badge>
                    {preferences.riskProfile === 'balanced' && (
                      <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-foreground">Balanced Profile</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Optimal balance of value and probability (1.60–2.20 odds) with +EV mathematical edge.
                  </p>
                </button>

                {/* Aggressive */}
                <button
                  type="button"
                  onClick={() => setRiskProfile('aggressive')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    preferences.riskProfile === 'aggressive'
                      ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/30'
                      : 'border-border hover:border-red-500/50 bg-muted/20'
                  }`}
                  aria-pressed={preferences.riskProfile === 'aggressive'}
                  aria-label="Select Aggressive Risk Profile"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant="outline" className="border-red-500 text-red-600 bg-red-500/10 text-xs font-bold">
                      High Multipliers
                    </Badge>
                    {preferences.riskProfile === 'aggressive' && (
                      <CheckCircle2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-foreground">Aggressive Profile</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Focuses on high-yield multi-leg accumulators, underdog value edges, and correct score multipliers (2.20+ odds).
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 7. Favorite Competitions */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
                7. Favorite Leagues & Global Competitions
              </CardTitle>
              <CardDescription className="text-xs">
                Select the leagues you follow most closely to prioritize them across dashboards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LEAGUES.map((league) => {
                  const isSelected = preferences.favoriteLeagues.includes(league);
                  return (
                    <button
                      key={league}
                      type="button"
                      onClick={() => toggleFavoriteLeague(league)}
                      aria-pressed={isSelected}
                      aria-label={`Toggle favorite league: ${league}`}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {isSelected ? `✓ ${league}` : `+ ${league}`}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 8. Preferred Betting Markets */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
                8. Preferred Betting Markets
              </CardTitle>
              <CardDescription className="text-xs">
                Toggle your preferred bet types for personalized multi-builder selections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_MARKETS.map((market) => {
                  const isSelected = preferences.preferredMarkets.includes(market);
                  return (
                    <button
                      key={market}
                      type="button"
                      onClick={() => togglePreferredMarket(market)}
                      aria-pressed={isSelected}
                      aria-label={`Toggle preferred market: ${market}`}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {isSelected ? `✓ ${market}` : `+ ${market}`}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 9. Alerts & Notifications */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
                9. Alerts & Retention Digest
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-sm font-semibold">Daily Top Picks Morning Digest</div>
                  <div className="text-xs text-muted-foreground">Receive top high-confidence predictions at 8:00 AM UTC.</div>
                </div>
                <Switch
                  checked={preferences.dailyDigestEnabled}
                  onCheckedChange={(c) => updatePreferences({ dailyDigestEnabled: c })}
                  aria-label="Toggle Daily Digest"
                />
              </div>

              <div className="flex items-center justify-between py-1 border-t border-border/60 pt-3">
                <div>
                  <div className="text-sm font-semibold">Kickoff Value Odds Alerts</div>
                  <div className="text-xs text-muted-foreground">Get notified 1 hour prior to kickoff when bookmaker lines move into positive value (+EV).</div>
                </div>
                <Switch
                  checked={preferences.kickoffAlertsEnabled}
                  onCheckedChange={(c) => updatePreferences({ kickoffAlertsEnabled: c })}
                  aria-label="Toggle Kickoff Alerts"
                />
              </div>
            </CardContent>
          </Card>

          {/* 9. Offline Match Mode & Service Worker Cache */}
          <OfflineCacheSettingsCard />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function OfflineCacheSettingsCard() {
  const { isOnline, hasCachedData, lastSyncedAt, syncOfflineData, isSyncing } = useNetworkStatus();

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" aria-hidden="true" />
            9. Offline Match Mode & Crests Cache
          </CardTitle>
          <Badge variant="outline" className={isOnline ? "text-green-500 border-green-500/30 bg-green-500/10" : "text-amber-500 border-amber-500/30 bg-amber-500/10"}>
            {isOnline ? (
              <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Online</span>
            ) : (
              <span className="flex items-center gap-1"><WifiOff className="h-3 w-3" /> Offline (Cache Active)</span>
            )}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Service Worker caches critical fixture predictions, AI algorithm insights, and high-definition team logos locally so you can research match tips without internet or on intermittent cellular connections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/30 border border-border/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Offline Cache Snapshot Status</span>
              {hasCachedData ? (
                <Badge className="bg-green-600 text-white text-[10px] py-0 px-2 font-bold">
                  ✓ Ready for Offline
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[10px]">
                  Needs First Sync
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastSyncedAt
                ? `Last synchronized: ${new Date(lastSyncedAt).toLocaleDateString()} at ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Initial pre-warming cache ready on network connection.'}
            </p>
          </div>

          <Button
            onClick={syncOfflineData}
            disabled={isSyncing || !isOnline}
            size="sm"
            className="gap-2 shrink-0 font-bold"
          >
            <DownloadCloud className={`h-4 w-4 ${isSyncing ? 'animate-bounce' : ''}`} />
            {isSyncing ? 'Caching Matches...' : 'Download Latest for Offline'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
