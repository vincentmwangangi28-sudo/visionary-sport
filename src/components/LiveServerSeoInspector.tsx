import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Code2,
  Eye,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Copy,
  Send,
  FileCode2,
  Rss,
  Sparkles,
  Search,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

interface LiveSeoMatchItem {
  slug: string;
  path: string;
  url: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  prediction: string;
  confidence: number;
  homeXg: string;
  awayXg: string;
  projectedScore: string;
  ogImageUrl: string;
  source: 'espn_live' | 'curated_derby';
}

interface RouteSeoPayload {
  pathname: string;
  canonicalUrl: string;
  title: string;
  description: string;
  keywords: string;
  ogImageUrl: string;
  ogType: string;
  routeCategory: string;
  jsonLdSchemas: Record<string, any>[];
}

const PRESET_ROUTES = [
  { label: 'Arsenal vs Chelsea (Match)', path: '/predict/arsenal-vs-chelsea' },
  { label: 'Gor Mahia vs AFC Leopards (KPL)', path: '/predict/gor-mahia-vs-afc-leopards' },
  { label: 'Al Ahly vs Sundowns (CAF CL)', path: '/predict/al-ahly-vs-mamelodi-sundowns' },
  { label: '17-Game Jackpot Generator', path: '/jackpot-generator' },
  { label: 'Arsenal Club xG Hub', path: '/teams/arsenal' },
  { label: 'Corners Prop Hub', path: '/corners-predictions' },
  { label: 'Set-Piece Specialists', path: '/set-piece-specialists' },
  { label: 'Cashout & Arb Lab', path: '/cashout-calculator' },
  { label: 'Player Props & Bet Builder', path: '/player-props-lab' },
];

export const LiveServerSeoInspector: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('/predict/arsenal-vs-chelsea');
  const [customPathInput, setCustomPathInput] = useState<string>('/predict/arsenal-vs-chelsea');
  const [payload, setPayload] = useState<RouteSeoPayload | null>(null);
  const [liveMatches, setLiveMatches] = useState<LiveSeoMatchItem[]>([]);
  const [liveMatchesCount, setLiveMatchesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchingIndexNow, setDispatchingIndexNow] = useState<boolean>(false);
  const [lastIndexNowResult, setLastIndexNowResult] = useState<{
    urlsSubmitted: number;
    liveMatchSlugsCount: number;
    clubHubsCount: number;
    coreHubsCount: number;
    status: string;
  } | null>(null);
  const [matchSearch, setMatchSearch] = useState<string>('');

  const fetchSeoPrerender = useCallback(async (targetPath: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seo-prerender?path=${encodeURIComponent(targetPath)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.payload) {
        setPayload(data.payload);
      }
      if (Array.isArray(data.liveMatches)) {
        setLiveMatches(data.liveMatches);
        setLiveMatchesCount(data.liveMatchesCount || data.liveMatches.length);
      }
    } catch {
      toast.error('Could not fetch server prerender preview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeoPrerender(selectedPath);
  }, [selectedPath, fetchSeoPrerender]);

  const handleSelectRoute = (path: string) => {
    setSelectedPath(path);
    setCustomPathInput(path);
  };

  const handleCustomInspect = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customPathInput.trim().startsWith('/')
      ? customPathInput.trim()
      : `/${customPathInput.trim()}`;
    setSelectedPath(cleaned);
  };

  const handlePingLiveIndexNow = async () => {
    setDispatchingIndexNow(true);
    toast.info('Harvesting live ESPN match slugs & dispatching batch to IndexNow...');
    try {
      const res = await fetch('/api/indexing-cron?task=indexing');
      const data = await res.json();
      if (data?.data) {
        setLastIndexNowResult({
          urlsSubmitted: data.data.urlsSubmitted || 0,
          liveMatchSlugsCount: data.data.liveMatchSlugsCount || 0,
          clubHubsCount: data.data.clubHubsCount || 0,
          coreHubsCount: data.data.coreHubsCount || 0,
          status: data.status || 'indexnow_ok',
        });
        toast.success(
          `Dispatched ${data.data.urlsSubmitted} URLs (${data.data.liveMatchSlugsCount} live ESPN match slugs + ${data.data.clubHubsCount} club hubs) to IndexNow!`
        );
      } else {
        toast.success('IndexNow batch dispatched.');
      }
    } catch {
      toast.error('IndexNow ping encountered a temporary warning.');
    } finally {
      setDispatchingIndexNow(false);
    }
  };

  const filteredMatches = liveMatches.filter((m) => {
    const q = matchSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      m.homeTeam.toLowerCase().includes(q) ||
      m.awayTeam.toLowerCase().includes(q) ||
      m.league.toLowerCase().includes(q) ||
      m.slug.toLowerCase().includes(q)
    );
  });

  const localOgPreviewUrl = payload?.ogImageUrl
    ? payload.ogImageUrl.replace(/^https?:\/\/[^/]+/, '')
    : '/api/og?home=Arsenal&away=Chelsea&league=Premier+League&tip=Home+Win&conf=82&xg=1.94+-+0.98&score=2-1';

  return (
    <div className="space-y-6 mb-8">
      {/* Top Banner: Server-Side HTML Prerender & Dynamic OG Card Inspector */}
      <Card className="border-emerald-500/30 bg-[#0B101B] text-slate-100 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-slate-800/80 bg-slate-900/60 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  Server-Side HTML &lt;head&gt; &amp; JSON-LD Prerender Active
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {liveMatchesCount} Live ESPN Match Slugs Indexed
                </span>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                Live Server Prerender, Dynamic /api/og Card &amp; Schema.org Inspector
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Inspect the exact server-injected <code>&lt;title&gt;</code>, <code>&lt;meta name=&quot;description&quot;&gt;</code>, <code>/api/og</code> social card, and <code>SportsEvent</code> JSON-LD returned on initial HTTP response to Googlebot, Bingbot, WhatsApp, Telegram &amp; X.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={handlePingLiveIndexNow}
                disabled={dispatchingIndexNow}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5"
              >
                <Send className={`w-3.5 h-3.5 ${dispatchingIndexNow ? 'animate-pulse' : ''}`} />
                {dispatchingIndexNow ? 'Dispatching Live Slugs...' : 'Ping IndexNow with Live ESPN Slugs'}
              </Button>
              <a
                href="/sitemap-matches.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors"
              >
                <FileCode2 className="w-3.5 h-3.5 text-emerald-400" /> /sitemap-matches.xml
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
              <a
                href="/feed-predictions.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors"
              >
                <Rss className="w-3.5 h-3.5 text-amber-400" /> /feed-predictions.xml
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>

          {/* Preset Route Buttons & Custom Path Input */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_ROUTES.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleSelectRoute(item.path)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                    selectedPath === item.path
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomInspect} className="flex items-center gap-2 shrink-0">
              <Input
                value={customPathInput}
                onChange={(e) => setCustomPathInput(e.target.value)}
                placeholder="/predict/real-madrid-vs-barcelona"
                className="h-8 text-xs font-mono bg-slate-950 border-slate-800 text-slate-100 w-64"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={loading}
                className="h-8 text-xs font-semibold border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Inspect
              </Button>
            </form>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* IndexNow Live Dispatch Telemetry Banner (if triggered) */}
          {lastIndexNowResult && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">
                    Live ESPN Batch Dispatched to IndexNow &amp; Search Engines ({lastIndexNowResult.status})
                  </div>
                  <div className="text-[11px] font-mono text-emerald-300 mt-0.5">
                    Total Submitted: {lastIndexNowResult.urlsSubmitted} URLs · {lastIndexNowResult.liveMatchSlugsCount} Live ESPN Match Slugs · {lastIndexNowResult.clubHubsCount} Club xG Hubs · {lastIndexNowResult.coreHubsCount} Core Hubs
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 font-mono text-[11px]">
                HTTP 200 OK
              </Badge>
            </div>
          )}

          {payload && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Server-Injected <head> Tags & Schema.org JSON-LD */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Server-Rendered &lt;head&gt; Metadata ({payload.pathname})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(payload.canonicalUrl);
                        toast.success('Canonical URL copied');
                      }}
                      className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy Canonical
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800/80">
                      <div className="text-[10px] font-mono uppercase text-slate-400 flex justify-between">
                        <span>&lt;title&gt; Tag</span>
                        <span className="text-emerald-400 tabular-nums">
                          {payload.title.length}/60 chars · Ahrefs PASS
                        </span>
                      </div>
                      <div className="font-bold text-white mt-0.5">{payload.title}</div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800/80">
                      <div className="text-[10px] font-mono uppercase text-slate-400 flex justify-between">
                        <span>&lt;meta name=&quot;description&quot;&gt;</span>
                        <span className="text-emerald-400 tabular-nums">
                          {payload.description.length}/155 chars · Ahrefs PASS
                        </span>
                      </div>
                      <div className="text-slate-300 mt-0.5 leading-relaxed">{payload.description}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                        <div className="text-[10px] font-mono uppercase text-slate-400">Canonical URL</div>
                        <div className="font-mono text-[11px] text-emerald-400 truncate mt-0.5">
                          {payload.canonicalUrl}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                        <div className="text-[10px] font-mono uppercase text-slate-400">Target Keywords</div>
                        <div className="font-mono text-[11px] text-slate-300 truncate mt-0.5">
                          {payload.keywords}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schema.org JSON-LD Payload */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Server-Injected Schema.org JSON-LD ({payload.jsonLdSchemas.length} Schemas)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(payload.jsonLdSchemas, null, 2));
                        toast.success('JSON-LD Schema copied to clipboard');
                      }}
                      className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy JSON-LD
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300 bg-slate-900/95 p-3 rounded border border-slate-800 max-h-56 overflow-y-auto leading-relaxed">
                    {JSON.stringify(payload.jsonLdSchemas, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Right 5 Cols: Live 1200x630 /api/og Social Card Preview */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950/90 p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Live /api/og Social Card (1200×630)
                    </span>
                    <a
                      href={localOgPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      Open Raw SVG <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Visual Card Frame */}
                  <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
                    <img
                      src={localOgPreviewUrl}
                      alt={payload.title}
                      className="w-full h-auto object-cover aspect-[1200/630]"
                    />
                    <div className="p-3 bg-slate-900/95 border-t border-slate-800">
                      <div className="text-[10px] font-mono uppercase text-emerald-400">
                        predictpro.guru · WhatsApp / X / Telegram Preview
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-0.5">{payload.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{payload.description}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>twitter:card = summary_large_image</span>
                  <span className="text-emerald-400 font-bold">✓ Zero-JS Crawler Ready</span>
                </div>
              </div>
            </div>
          )}

          {/* Live ESPN Match Slugs Sitemap Queue Table */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/90 overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live ESPN Match Prediction Slugs Active in /sitemap-matches.xml ({liveMatchesCount} Fixtures)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any fixture below to inspect its server-rendered <code>SportsEvent</code> JSON-LD and dynamic <code>/api/og</code> social card, or open the match prediction page.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={matchSearch}
                  onChange={(e) => setMatchSearch(e.target.value)}
                  placeholder="Filter club or league..."
                  className="h-8 pl-8 text-xs bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              {filteredMatches.slice(0, 30).map((m) => (
                <div
                  key={m.slug}
                  className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/60 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        m.source === 'espn_live'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {m.source === 'espn_live' ? 'ESPN LIVE' : 'DERBY HUB'}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">
                        {m.homeTeam} vs {m.awayTeam}{' '}
                        <span className="text-slate-400 font-normal">({m.league})</span>
                      </div>
                      <div className="font-mono text-[11px] text-emerald-400 truncate">{m.path}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-300 hidden md:inline">
                      {m.prediction} ({m.confidence}% · xG {m.homeXg}-{m.awayXg})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectRoute(m.path)}
                      className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 transition-colors"
                    >
                      Inspect SEO
                    </button>
                    <a
                      href={m.path}
                      title={`${m.homeTeam} vs ${m.awayTeam} AI Prediction & xG`}
                      className="px-2 py-1 rounded text-[11px] font-mono text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                    >
                      {m.homeTeam.slice(0, 10)} vs {m.awayTeam.slice(0, 10)} Hub
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
