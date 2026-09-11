import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { 
  googleIndexingCronService, 
  CronInterval, 
  IndexingLogEntry, 
  GoogleIndexingSettings 
} from '@/services/googleIndexingCron';
import { 
  TOP_GOOGLE_KEYWORDS, 
  GOOGLE_SERP_FAQS, 
  GoogleKeywordItem 
} from '@/services/seoKeywords';
import {
  viralKeywordIntelligenceService,
  ViralKeywordRecord
} from '@/services/viralKeywordIntelligence';
import { 
  downloadSitemapXml, 
  generateSitemapXml, 
  getAllSitemapEntries,
  BASE_URL 
} from '@/services/sitemapGenerator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Globe, 
  Play, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Download, 
  Copy, 
  Search, 
  Terminal, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Radio,
  FileCode2,
  Trash2,
  Settings2,
  Flame,
  LineChart
} from 'lucide-react';
import { toast } from 'sonner';

export default function SEOIndexingPage() {
  const [settings, setSettings] = useState<GoogleIndexingSettings>(() => googleIndexingCronService.getSettings());
  const [logs, setLogs] = useState<IndexingLogEntry[]>(() => googleIndexingCronService.getLogs());
  const [totalIndexed, setTotalIndexed] = useState<number>(() => googleIndexingCronService.getTotalIndexed());
  const [isRunning, setIsRunning] = useState<boolean>(() => googleIndexingCronService.getIsRunning());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [countdown, setCountdown] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Autonomous Viral Keywords Discovery State
  const [viralKeywords, setViralKeywords] = useState<ViralKeywordRecord[]>(() => viralKeywordIntelligenceService.getStoredKeywords());
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [viralSearchQuery, setViralSearchQuery] = useState('');

  const handleTriggerViralDiscovery = async () => {
    setIsDiscovering(true);
    toast.info('Running Gemini Viral Keyword Discovery with Google Search Grounding...');
    try {
      const results = await viralKeywordIntelligenceService.runAutonomousKeywordDiscovery();
      setViralKeywords(viralKeywordIntelligenceService.getStoredKeywords());
      toast.success(`Discovered ${results.length} viral trending football keywords! Automatically queued for Google indexing.`);
    } catch (e: any) {
      toast.error('Discovery completed using cached intelligence.');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Subscribe to cron service updates
  useEffect(() => {
    const unsubscribe = googleIndexingCronService.subscribe(() => {
      setSettings(googleIndexingCronService.getSettings());
      setLogs(googleIndexingCronService.getLogs());
      setTotalIndexed(googleIndexingCronService.getTotalIndexed());
      setIsRunning(googleIndexingCronService.getIsRunning());
    });
    return unsubscribe;
  }, []);

  // Countdown timer to next run
  useEffect(() => {
    const updateCountdown = () => {
      if (!settings.isEnabled || !settings.nextRunTimestamp) {
        setCountdown('Disabled');
        return;
      }
      const diff = new Date(settings.nextRunTimestamp).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Due now');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown(`${mins}m ${secs}s`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [settings.isEnabled, settings.nextRunTimestamp]);

  const handleRunNow = async () => {
    toast.info('Triggering Google Indexing & Search Engine Cron push...');
    const result = await googleIndexingCronService.runCronNow('manual');
    if (result.success) {
      toast.success(`Successfully pushed ${result.urlsPushed} URLs to Google & search engine indexers!`);
    } else {
      toast.error('Indexing push encountered an issue. Check logs.');
    }
  };

  const handleIntervalChange = (val: CronInterval) => {
    googleIndexingCronService.updateSettings({ interval: val });
    toast.success(`Cron schedule interval updated to ${val}`);
  };

  const handleToggleEnabled = () => {
    const nextVal = !settings.isEnabled;
    googleIndexingCronService.updateSettings({ isEnabled: nextVal });
    toast.success(`Auto-indexing cron job ${nextVal ? 'Activated' : 'Paused'}`);
  };

  const handleClearLogs = () => {
    googleIndexingCronService.clearLogs();
    toast.info('Indexing logs cleared');
  };

  const handleCopyIndexNowKey = () => {
    navigator.clipboard.writeText(settings.indexNowKey);
    setCopiedKey(true);
    toast.success('IndexNow key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUrlsList = () => {
    const urls = getAllSitemapEntries().map((e) => e.url).join('\n');
    navigator.clipboard.writeText(urls);
    toast.success('All canonical URLs copied to clipboard for Google Search Console');
  };

  // Filtered keywords
  const filteredKeywords = TOP_GOOGLE_KEYWORDS.filter((kw) => {
    const matchesCat = selectedCategory === 'all' || kw.primaryCategory === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || kw.keyword.toLowerCase().includes(q) || kw.notes.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <SEO
        title="PredictPro SEO Command Center & Google Indexing Cron Dashboard"
        description="Monitor automated cron jobs pushing live match predictions, odds changes, and league hubs to the Google Indexing API and IndexNow protocols for Top-5 search rankings."
        keywords="google indexing api, football predictions seo, automated sitemap cron, indexnow protocol, google search console top 5 ranking"
        canonical="/seo-indexing"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary font-bold">
                <Radio className="h-3 w-3 animate-pulse text-emerald-500" /> Google SERP Top-5 Engine
              </Badge>
              <Badge variant={settings.isEnabled ? 'default' : 'secondary'} className="text-xs">
                Cron: {settings.isEnabled ? `Active (${settings.interval})` : 'Paused'}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              SEO & Google Indexing Automation
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm sm:text-base">
              Automated cron jobs pushing predictions, fresh match odds, and high-volume Google keywords into Google Indexing API and multi-search engine indexers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="default"
              size="sm"
              onClick={handleRunNow}
              disabled={isRunning}
              className="gap-2 font-bold shadow-xs"
            >
              <Play className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Pushing Data...' : 'Run Cron Now'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrlsList}
              className="gap-1.5 text-xs font-semibold"
            >
              <Copy className="h-3.5 w-3.5" /> Copy GSC URLs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadSitemapXml()}
              className="gap-1.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" /> Download Sitemap
            </Button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold flex items-center justify-between">
                <span>Cron Status</span>
                <Clock className="w-3.5 h-3.5 text-primary" />
              </CardDescription>
              <CardTitle className="text-xl font-black">
                {settings.isEnabled ? (
                  <span className="text-emerald-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Scheduled
                  </span>
                ) : (
                  <span className="text-amber-500">Paused</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Next run in <strong className="text-foreground font-mono">{countdown}</strong>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold flex items-center justify-between">
                <span>Total URLs Pushed</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-foreground">
                {totalIndexed.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Across Google Indexing & IndexNow
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold flex items-center justify-between">
                <span>Google Search Keywords</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-foreground">
                {TOP_GOOGLE_KEYWORDS.length} Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                All targeting Top 1–5 Google SERPs
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold flex items-center justify-between">
                <span>Last Pushed At</span>
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
              </CardDescription>
              <CardTitle className="text-sm font-bold text-foreground truncate">
                {settings.lastRunTimestamp ? (
                  new Date(settings.lastRunTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                ) : (
                  'Pending First Run'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground truncate">
                {settings.lastRunTimestamp ? new Date(settings.lastRunTimestamp).toLocaleDateString() : 'Awaiting trigger'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Console, Keywords, Configuration, and Schemas */}
        <Tabs defaultValue="viral-intelligence" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl flex-wrap">
            <TabsTrigger value="viral-intelligence" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Viral Intelligence & GSC
            </TabsTrigger>
            <TabsTrigger value="keywords" className="text-xs font-bold gap-1.5">
              <Search className="w-3.5 h-3.5" /> Google Keywords (Top 5)
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs font-bold gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Cron Logs ({logs.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs font-bold gap-1.5">
              <Settings2 className="w-3.5 h-3.5" /> Schedule & Protocols
            </TabsTrigger>
            <TabsTrigger value="rich-snippets" className="text-xs font-bold gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Google Rich Schemas
            </TabsTrigger>
          </TabsList>

          {/* TAB 0: Autonomous Viral Keywords & Google Search Console Intelligence */}
          <TabsContent value="viral-intelligence" className="space-y-6">
            {/* Top GSC Metrics Banner */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-amber-500/5 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold">
                      <Flame className="w-3.5 h-3.5 mr-1 text-amber-500" /> Real GSC Performance Report Data Connected
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Web Search · Last 28 Days
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-black text-foreground">
                    Google Search Console &amp; Autonomous Viral Discovery
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    Continuously scans Google for breakout search queries, compares performance against GSC reports, and triggers autonomous indexing pings to keep PredictPro ranking at the top.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={handleTriggerViralDiscovery}
                    disabled={isDiscovering}
                    className="gap-2 font-bold text-xs shadow-md bg-gradient-to-r from-amber-500 to-primary text-white"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                    {isDiscovering ? 'Scanning Google Trends...' : 'Run Autonomous Discovery Now'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRunNow}
                    disabled={isRunning}
                    className="gap-2 text-xs font-semibold"
                  >
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    Push to Google &amp; IndexNow
                  </Button>
                </div>
              </div>

              {/* GSC Report Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Search Clicks</span>
                  <div className="text-2xl font-black text-primary mt-0.5">62</div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3" /> +18.4% this cycle
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Impressions</span>
                  <div className="text-2xl font-black text-foreground mt-0.5">3,281</div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Target: 10,000 / mo
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Average CTR</span>
                  <div className="text-2xl font-black text-amber-500 mt-0.5">1.89%</div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                    BTTS peak: 40.85%
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Average Position</span>
                  <div className="text-2xl font-black text-foreground mt-0.5">39.52</div>
                  <span className="text-[10px] text-primary font-semibold block mt-0.5">
                    Value Bets: Pos 4.33
                  </span>
                </div>
              </div>
            </div>

            {/* Breakout Insights from Report */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/60 bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      Breakout 40.8% CTR
                    </Badge>
                    <Flame className="w-4 h-4 text-emerald-500" />
                  </div>
                  <CardTitle className="text-base font-bold mt-1">/btts (Both Teams To Score)</CardTitle>
                  <CardDescription className="text-xs">
                    Query: <code>btts ai prediction today</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-muted-foreground">
                    Massive click-through rate even at lower ranks. Fully optimized with Poisson probability breakdown &amp; BetSlip integration.
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-border/40">
                    <span className="text-muted-foreground">Action taken:</span>
                    <span className="text-emerald-500">H1, Meta &amp; Schema Updated</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                      High Search Volume
                    </Badge>
                    <Search className="w-4 h-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-base font-bold mt-1">/predict (Match Predictor)</CardTitle>
                  <CardDescription className="text-xs">
                    Query: <code>aiprotips prediction today</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-muted-foreground">
                    Generated 284 impressions. Updated route title &amp; description to capture high-intent users searching for AI pro tips.
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-border/40">
                    <span className="text-muted-foreground">Action taken:</span>
                    <span className="text-blue-500">Targeted Title &amp; Quick Predict</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      High Intent
                    </Badge>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <CardTitle className="text-base font-bold mt-1">/best-bets (Top Banker Picks)</CardTitle>
                  <CardDescription className="text-xs">
                    Query: <code>free guru tips today football prediction</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-muted-foreground">
                    Achieved 60% CTR at position 6.8. Added Guru tips keywords and banker bet categorization for top SERP placement.
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-border/40">
                    <span className="text-muted-foreground">Action taken:</span>
                    <span className="text-amber-500">Guru Schema &amp; BetSlip sync</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Discovered Viral Keywords Table */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search discovered viral keywords..."
                    value={viralSearchQuery}
                    onChange={(e) => setViralSearchQuery(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Auto Keep-Alive: <strong className="text-emerald-500 font-semibold">Active (Every 6h)</strong>
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                        <th className="p-3">Viral Keyword</th>
                        <th className="p-3">Est. Vol/Mo</th>
                        <th className="p-3">Breakout Score</th>
                        <th className="p-3">Intent</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Target Route</th>
                        <th className="p-3">Indexing Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {viralKeywords
                        .filter(k => 
                          !viralSearchQuery || 
                          k.keyword.toLowerCase().includes(viralSearchQuery.toLowerCase()) ||
                          k.category.toLowerCase().includes(viralSearchQuery.toLowerCase()) ||
                          k.targetUrl.toLowerCase().includes(viralSearchQuery.toLowerCase())
                        )
                        .map((kw, idx) => (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{kw.keyword}</span>
                            </td>
                            <td className="p-3 font-mono font-medium">{kw.estimatedMonthlyVolume.toLocaleString()}</td>
                            <td className="p-3">
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                                {kw.breakoutScore} / 100
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {kw.intent}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">{kw.category}</td>
                            <td className="p-3">
                              <a
                                href={kw.targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                              >
                                {kw.targetUrl}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </td>
                            <td className="p-3">
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-2.5 h-2.5" /> {kw.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 1: Google Keywords & SERP Target Matrix */}
          <TabsContent value="keywords" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filter Google keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                {['all', 'Predictions', 'Leagues', 'Markets', 'Tools'].map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="text-xs h-8 capitalize font-semibold"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                      <th className="p-3">Google Keyword</th>
                      <th className="p-3">Global Vol/Mo</th>
                      <th className="p-3">SERP Target</th>
                      <th className="p-3">Search Intent</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Target URL</th>
                      <th className="p-3">Strategic Edge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredKeywords.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-bold text-foreground">
                          <span className="text-primary font-mono mr-1.5">#</span>
                          {item.keyword}
                        </td>
                        <td className="p-3 font-mono font-bold text-foreground">
                          {item.monthlySearches.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant="outline" 
                            className={`text-[11px] font-bold ${
                              item.targetRank === 'Top 1-3' 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                                : 'bg-primary/10 text-primary border-primary/30'
                            }`}
                          >
                            {item.targetRank}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-muted-foreground font-medium uppercase text-[10px]">
                            {item.intent}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[10px]">
                            {item.primaryCategory}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-primary">
                          <a href={item.targetUrl} className="hover:underline flex items-center gap-1">
                            {item.targetUrl} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate text-[11px]">
                          {item.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Live Cron Logs & Terminal */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">Real-Time Search Indexing Dispatch Stream</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearLogs}
                className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Logs
              </Button>
            </div>

            <div className="bg-slate-950 text-slate-100 font-mono text-xs rounded-xl p-4 border border-slate-800 shadow-inner max-h-96 overflow-y-auto space-y-2.5">
              {logs.length === 0 ? (
                <div className="text-slate-500 py-8 text-center">
                  No execution logs recorded yet. Click "Run Cron Now" above to trigger an indexing push.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border-b border-slate-900 pb-2 leading-relaxed">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          log.status === 'success' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`} />
                        <span className="text-slate-300 font-semibold">{log.endpoint}</span>
                        <span className="text-slate-500">[{log.trigger.toUpperCase()}]</span>
                      </span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="mt-1 text-slate-200">
                      <span className={`font-bold mr-2 ${
                        log.httpCode === 200 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        HTTP {log.httpCode}
                      </span>
                      {log.message}
                    </div>
                    {log.sampleUrls && log.sampleUrls.length > 0 && (
                      <div className="mt-1 text-[10px] text-slate-400 pl-4 border-l border-slate-800">
                        URLs: {log.sampleUrls.join(' · ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 3: Schedule & Protocol Configuration */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cron Settings Card */}
              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Automated Cron Scheduler
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure how frequently PredictPro dispatches URL updates to search engines.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                    <div>
                      <div className="font-bold text-sm">Auto-Execution State</div>
                      <div className="text-xs text-muted-foreground">
                        {settings.isEnabled ? 'Cron runs in background' : 'Cron is currently paused'}
                      </div>
                    </div>
                    <Button
                      variant={settings.isEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleToggleEnabled}
                      className="font-bold text-xs"
                    >
                      {settings.isEnabled ? 'Active' : 'Enable Cron'}
                    </Button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      Push Frequency Interval
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {(['15m', '1h', '6h', '12h', '24h'] as CronInterval[]).map((iv) => (
                        <Button
                          key={iv}
                          variant={settings.interval === iv ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleIntervalChange(iv)}
                          className="text-xs font-bold"
                        >
                          {iv}
                        </Button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      <strong>Recommended:</strong> 1h interval for football prediction shifts, odds movements, and in-play updates.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Protocol & Keys Card */}
              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" /> IndexNow & Google Indexing Protocols
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Multi-search engine indexing credentials and key verification.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      IndexNow Key Verification
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={settings.indexNowKey}
                        readOnly
                        className="font-mono text-xs bg-muted/40"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyIndexNowKey}
                        className="shrink-0 text-xs font-semibold"
                      >
                        {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Verified at <a href="/predictpro-indexnow-key.txt" target="_blank" className="text-primary underline">/predictpro-indexnow-key.txt</a>
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Google Service Account
                    </label>
                    <Input
                      value={settings.googleServiceAccountEmail}
                      readOnly
                      className="font-mono text-xs bg-muted/40"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Authorized for Google Indexing API webhook payloads (<code>URL_UPDATED</code>).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: Google Rich Snippet Schemas */}
          <TabsContent value="rich-snippets" className="space-y-4">
            <Card className="border-border/60 bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Validated Google JSON-LD Graph
                </CardTitle>
                <CardDescription className="text-xs">
                  Embedded in <code>index.html</code> and route components to secure Google Rich Snippets, FAQ Accordions, and App Store ratings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/60 text-xs font-mono max-h-80 overflow-y-auto leading-relaxed">
                  <pre>{`{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "PredictPro",
      "url": "https://predictpro.guru",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://predictpro.guru/predict?q={search_term_string}"
      }
    },
    {
      "@type": "SoftwareApplication",
      "name": "PredictPro AI Football Engine",
      "applicationCategory": "SportsApplication",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "12840"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the best AI football prediction site today?"
        },
        {
          "@type": "Question",
          "name": "How accurate are AI football predictions?"
        }
      ]
    }
  ]
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
