import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUserPreferences, RiskProfile, OddsFormat } from '@/hooks/useUserPreferences';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
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
  HardDrive
} from 'lucide-react';

const AVAILABLE_LEAGUES = [
  'Premier League',
  'Champions League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'KPL',
  'AFCON',
  'MLS',
  'World Cup',
];

const AVAILABLE_MARKETS = [
  '1X2',
  'Over/Under 2.5',
  'BTTS',
  'Double Chance',
  'Correct Score',
  'Draw No Bet',
];

export default function Preferences() {
  const {
    preferences,
    updatePreferences,
    setRiskProfile,
    toggleFavoriteLeague,
    togglePreferredMarket,
    resetPreferences,
  } = useUserPreferences();

  const handleSave = () => {
    toast({
      title: 'Preferences Saved',
      description: `Your ${preferences.riskProfile.toUpperCase()} betting profile and feeds have been updated.`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Personalization & Risk Profile Settings | PredictPro"
        description="Customize your football prediction feed, configure risk appetite (Conservative, Balanced, Aggressive), favorite competitions, and odds formats."
        canonical="/preferences"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-8 max-w-4xl" tabIndex={-1}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-primary border-primary/30 gap-1.5 px-3 py-1 font-semibold text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                Personalized Algorithm Feed
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Phase 3 Retention
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Betting Strategy & Account Preferences
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tailor PredictPro to your specific risk tolerance, favorite football leagues, and odds formatting.
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
          {/* 1. Risk Profile Selection */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                1. Select Your Risk Tolerance Profile
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
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                      : 'border-border hover:border-amber-500/50 bg-muted/20'
                  }`}
                  aria-pressed={preferences.riskProfile === 'aggressive'}
                  aria-label="Select Aggressive Risk Profile"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-500/10 text-xs font-bold">
                      High Yield
                    </Badge>
                    {preferences.riskProfile === 'aggressive' && (
                      <CheckCircle2 className="h-4 w-4 text-amber-600" aria-hidden="true" />
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

          {/* 2. Favorite Competitions */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
                2. Favorite Leagues & Competitions
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

          {/* 3. Preferred Betting Markets */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
                3. Preferred Betting Markets
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

          {/* 4. Display & Formatting */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" aria-hidden="true" />
                4. Currency & Odds Formatting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Odds format */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Odds Format</Label>
                  <div className="flex gap-2" role="group" aria-label="Select odds format">
                    {(['decimal', 'fractional', 'american'] as OddsFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => updatePreferences({ oddsFormat: fmt })}
                        aria-label={`Set odds format to ${fmt}`}
                        aria-pressed={preferences.oddsFormat === fmt}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold capitalize border transition-all ${
                          preferences.oddsFormat === fmt
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/20 border-border hover:bg-muted'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Currency */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Primary Currency</Label>
                  <div className="flex gap-2" role="group" aria-label="Select primary currency">
                    {(['KES', 'USD', 'EUR', 'GBP', 'NGN'] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => updatePreferences({ defaultCurrency: curr })}
                        aria-label={`Set primary currency to ${curr}`}
                        aria-pressed={preferences.defaultCurrency === curr}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold border transition-all ${
                          preferences.defaultCurrency === curr
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/20 border-border hover:bg-muted'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Alerts & Notifications */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
                5. Alerts & Retention Digest
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

          {/* 6. Offline Match Mode & Service Worker Cache */}
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
            6. Offline Match Mode & Team Crests Cache
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
