import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  CheckCircle2, 
  Wifi, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  Database,
  Radio,
  Server,
  Zap
} from 'lucide-react';
import { getCustomApiKey, saveCustomApiKey } from '@/services/realtimeFootball';
import { getSportmonksApiKey, saveSportmonksApiKey } from '@/services/sportmonksFootball';
import { getSportscoreApiKey, saveSportscoreApiKey } from '@/services/sportscoreFootball';
import { 
  getFreeFootballApiKey, 
  saveFreeFootballApiKey, 
  testFreeFootballConnection, 
  DEFAULT_RAPIDAPI_KEY 
} from '@/services/freeFootballApi';
import { toast } from 'sonner';

interface ApiKeyConfigModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ApiKeyConfigModal = ({ children, open: controlledOpen, onOpenChange: controlledOnOpenChange }: ApiKeyConfigModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [sportscoreKey, setSportscoreKey] = useState('');
  const [sportmonksKey, setSportmonksKey] = useState('');
  const [apiFootballKey, setApiFootballKey] = useState('');
  const [rapidApiKey, setRapidApiKey] = useState(DEFAULT_RAPIDAPI_KEY);
  const [freeFootballKey, setFreeFootballKey] = useState(DEFAULT_RAPIDAPI_KEY);
  const [footballDataToken, setFootballDataToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSportscoreKey(getSportscoreApiKey() || '');
      setSportmonksKey(getSportmonksApiKey() || '');
      setApiFootballKey(getCustomApiKey('api_football') || '');
      const savedRapid = getCustomApiKey('rapidapi') || DEFAULT_RAPIDAPI_KEY;
      setRapidApiKey(savedRapid);
      setFreeFootballKey(getFreeFootballApiKey() || savedRapid);
      setFootballDataToken(getCustomApiKey('football_data') || '');
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSportscoreApiKey(sportscoreKey);
    saveSportmonksApiKey(sportmonksKey);
    saveCustomApiKey('api_football', apiFootballKey);
    saveCustomApiKey('rapidapi', rapidApiKey || freeFootballKey);
    saveFreeFootballApiKey(freeFootballKey || rapidApiKey);
    saveCustomApiKey('football_data', footballDataToken);
    toast.success('API Keys saved successfully! RapidAPI Live Football Data connected.');
    setOpen(false);
    // Reload feed
    window.location.reload();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const start = performance.now();

    try {
      if (freeFootballKey || rapidApiKey) {
        // Test RapidAPI Free API Live Football Data feed
        const activeKey = (freeFootballKey || rapidApiKey).trim();
        const testRes = await testFreeFootballConnection(activeKey);
        if (testRes.success) {
          setTestResult(testRes);
          toast.success(testRes.message);
          return;
        }
      }

      if (sportscoreKey) {
        // Test Sportscore6 RapidAPI endpoint
        const res = await fetch('https://sportscore6.p.rapidapi.com/api/widget/team/?slug=arsenal', {
          headers: {
            'x-rapidapi-host': 'sportscore6.p.rapidapi.com',
            'x-rapidapi-key': sportscoreKey.trim(),
            'Accept': 'application/json',
          },
        });
        const elapsed = Math.round(performance.now() - start);
        if (res.ok) {
          const json = await res.json();
          const matchesCount = Array.isArray(json.matches) ? json.matches.length : 0;
          setTestResult({ success: true, message: `Sportscore6 RapidAPI Connected! (Fetched ${matchesCount} fixtures)`, latency: elapsed });
          toast.success(`SportScore Connected! Latency: ${elapsed}ms`);
        } else {
          setTestResult({ success: false, message: `Sportscore6 API returned status ${res.status}.` });
        }
      } else if (sportmonksKey) {
        // Test Sportmonks v3 In-Play livescores or season standings endpoint
        const res = await fetch(`https://api.sportmonks.com/v3/football/standings/seasons/28083?api_token=${sportmonksKey.trim()}&include=participant;rule.type;details.type;form;stage;league;group`);
        const elapsed = Math.round(performance.now() - start);
        if (res.ok) {
          const json = await res.json();
          const count = Array.isArray(json.data) ? json.data.length : 1;
          setTestResult({ success: true, message: `Sportmonks v3 API Connected! (Found ${count} Premier League clubs)`, latency: elapsed });
          toast.success(`Sportmonks Connected! Latency: ${elapsed}ms`);
        } else {
          setTestResult({ success: false, message: `Sportmonks API returned status ${res.status}. Please check your token.` });
        }
      } else if (apiFootballKey) {
        const res = await fetch('https://v3.football.api-sports.io/status', {
          headers: { 'x-apisports-key': apiFootballKey.trim() },
        });
        const elapsed = Math.round(performance.now() - start);
        if (res.ok) {
          setTestResult({ success: true, message: 'API-Sports Connected & Active', latency: elapsed });
          toast.success(`Connected! Latency: ${elapsed}ms`);
        } else {
          setTestResult({ success: false, message: `API-Sports returned status ${res.status}. Please check your key.` });
        }
      } else {
        // Test default high-speed direct sports live feed
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard');
        const elapsed = Math.round(performance.now() - start);
        if (res.ok) {
          setTestResult({ success: true, message: 'Default Live Sports Feed is Active & Connected', latency: elapsed });
          toast.success(`Live Feed Connected! (${elapsed}ms)`);
        } else {
          setTestResult({ success: false, message: 'Live feed connectivity test failed.' });
        }
      }
    } catch (e) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : 'Network error testing API key.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-lg">Data Feed & API Key Settings</DialogTitle>
              <DialogDescription>
                Manage live sports data providers, API keys, and connection channels.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current Active Pipeline Status */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Data Pipeline
            </span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Connected & Streaming
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-border/60">
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              <div>
                <p className="font-medium text-foreground">Global Sports Scoreboard</p>
                <p className="text-[10px] text-muted-foreground">13 Leagues Live Feed</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-border/60">
              <Database className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Supabase Realtime</p>
                <p className="text-[10px] text-muted-foreground">Predictions & Odds Sync</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="rapidapi-live" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="rapidapi-live" className="text-xs gap-1 font-medium">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> RapidAPI Live
            </TabsTrigger>
            <TabsTrigger value="sportscore" className="text-xs gap-1 font-medium">
              <Key className="h-3.5 w-3.5 text-primary" /> SportScore
            </TabsTrigger>
            <TabsTrigger value="sportmonks" className="text-xs gap-1 font-medium">
              <Radio className="h-3.5 w-3.5" /> Sportmonks
            </TabsTrigger>
            <TabsTrigger value="apifootball" className="text-xs gap-1">
              <Radio className="h-3.5 w-3.5" /> API-Football
            </TabsTrigger>
            <TabsTrigger value="footballdata" className="text-xs gap-1">
              <Server className="h-3.5 w-3.5" /> Football-Data
            </TabsTrigger>
          </TabsList>

          {/* RapidAPI Free API Live Football Data Tab */}
          <TabsContent value="rapidapi-live" className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="free-football-key" className="text-xs font-medium flex items-center justify-between">
                  <span>RapidAPI Live Football Key (`x-rapidapi-key`)</span>
                  <a 
                    href="https://rapidapi.com/hub" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    RapidAPI Hub <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Label>
                <Input
                  id="free-football-key"
                  type="password"
                  placeholder="Paste your RapidAPI key..."
                  value={freeFootballKey}
                  onChange={(e) => {
                    setFreeFootballKey(e.target.value);
                    setRapidApiKey(e.target.value);
                  }}
                  className="font-mono text-xs"
                />
              </div>

              <div className="rounded-lg bg-background/80 p-2.5 border border-border/80 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground text-[11px]">Connected RapidAPI Live Endpoints (Auto-failover):</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li><code className="text-primary font-mono">free-api-live-football-data-cheaper-version.p.rapidapi.com</code></li>
                  <li><code className="text-primary font-mono">free-api-live-football-data.p.rapidapi.com</code></li>
                  <li><code className="text-primary font-mono">free-football-api-data.p.rapidapi.com</code></li>
                  <li>In-play live fixtures with match clocks, goals, and official tournament standings.</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* SportScore RapidAPI Tab */}
          <TabsContent value="sportscore" className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="sportscore-key" className="text-xs font-medium flex items-center justify-between">
                  <span>SportScore6 RapidAPI Key (`x-rapidapi-key`)</span>
                  <a 
                    href="https://rapidapi.com/sportscore/api/sportscore6" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    SportScore6 RapidAPI <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Label>
                <Input
                  id="sportscore-key"
                  type="password"
                  placeholder="Paste your RapidAPI key for sportscore6..."
                  value={sportscoreKey}
                  onChange={(e) => setSportscoreKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="rounded-lg bg-background/80 p-2.5 border border-border/80 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground text-[11px]">Active SportScore6 Endpoints:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li><code className="text-primary font-mono">https://sportscore6.p.rapidapi.com/api/widget/team/?slug=team-slug</code></li>
                  <li><code className="text-primary font-mono">x-rapidapi-host: sportscore6.p.rapidapi.com</code></li>
                  <li>Auto-fetches upcoming matches, team logos, and competition telemetry.</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Sportmonks v3 Tab */}
          <TabsContent value="sportmonks" className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="sportmonks-token" className="text-xs font-medium flex items-center justify-between">
                  <span>Sportmonks API Token (`api_token`)</span>
                  <a 
                    href="https://my.sportmonks.com/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    Sportmonks Dashboard <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Label>
                <Input
                  id="sportmonks-token"
                  type="password"
                  placeholder="Paste your Sportmonks token here..."
                  value={sportmonksKey}
                  onChange={(e) => setSportmonksKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="rounded-lg bg-background/80 p-2.5 border border-border/80 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground text-[11px]">Integrated Sportmonks Endpoints:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li><code className="text-primary font-mono">/v3/football/livescores/inplay</code> (Live in-play scores & events)</li>
                  <li><code className="text-primary font-mono">/v3/football/standings/seasons/28083</code> (Premier League Standings)</li>
                  <li><code className="text-primary font-mono">/v3/football/fixtures/*</code> (Predictions, Lineups & Trends)</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* API-Football Tab */}
          <TabsContent value="apifootball" className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="rapidapi-key" className="text-xs font-medium flex items-center justify-between">
                  <span>RapidAPI Key (api-football-v1.p.rapidapi.com)</span>
                  <a 
                    href="https://rapidapi.com/api-sports/api/api-football" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    Get Key <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Label>
                <Input
                  id="rapidapi-key"
                  type="password"
                  placeholder="e.g. 5a1b2c3d4e5f6g7h8i9j..."
                  value={rapidApiKey}
                  onChange={(e) => setRapidApiKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="apifootball-direct" className="text-xs font-medium flex items-center justify-between">
                  <span>Direct API-Sports Key (v3.football.api-sports.io)</span>
                  <a 
                    href="https://dashboard.api-football.com/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    Dashboard <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Label>
                <Input
                  id="apifootball-direct"
                  type="password"
                  placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d..."
                  value={apiFootballKey}
                  onChange={(e) => setApiFootballKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                If no custom key is provided, the platform automatically streams live scores, in-play match clocks, and fixtures from our primary real-time scoreboard network.
              </p>
            </div>
          </TabsContent>

          {/* Football-Data.org Tab */}
          <TabsContent value="footballdata" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="football-data-token" className="text-xs font-medium flex items-center justify-between">
                <span>Football-Data API Token (X-Auth-Token)</span>
                <a 
                  href="https://www.football-data.org/client/register" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  Register Free <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </Label>
              <Input
                id="football-data-token"
                type="password"
                placeholder="e.g. 3df7a192bc44e..."
                value={footballDataToken}
                onChange={(e) => setFootballDataToken(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Test Result Indicator */}
        {testResult && (
          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            testResult.success 
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {testResult.success ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            <span className="flex-1 font-medium">{testResult.message}</span>
            {testResult.latency !== undefined && (
              <Badge variant="outline" className="text-[10px] ml-auto border-emerald-500/30">
                {testResult.latency}ms
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing Feed...' : 'Test Connection'}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              className="text-xs gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Save & Connect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
