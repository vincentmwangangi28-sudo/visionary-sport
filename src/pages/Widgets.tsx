import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingUp,
  BarChart3,
  Globe,
  Share2,
  Radio,
  FileCode,
} from 'lucide-react';
import { toast } from 'sonner';

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultHeight: number;
  previewUrl: string;
}

const WIDGET_TYPES: WidgetConfig[] = [
  {
    id: 'banker',
    name: 'Banker Bet of the Day',
    description: 'Displays the single highest-confidence AI football banker pick for today with win probability and odds.',
    icon: <Zap className="h-4 w-4 text-emerald-500" />,
    defaultHeight: 320,
    previewUrl: '/embed/banker',
  },
  {
    id: 'live-scores',
    name: 'Live Scores & In-Play xG Ticker',
    description: 'Sub-15s live football scoreboard with in-play win probabilities and minute momentum.',
    icon: <Radio className="h-4 w-4 text-rose-500" />,
    defaultHeight: 400,
    previewUrl: '/embed/live-scores',
  },
  {
    id: 'btts',
    name: 'Both Teams to Score (BTTS) Radar',
    description: 'Top Poisson-calculated BTTS Yes/No matches with expected goal expectancy (xG) metrics.',
    icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
    defaultHeight: 380,
    previewUrl: '/embed/btts',
  },
  {
    id: 'jackpot',
    name: 'Mega Jackpot 17-Game AI Combinations',
    description: '17-game SportPesa and Betika jackpot banker picks and Double Chance combination tables.',
    icon: <Sparkles className="h-4 w-4 text-purple-500" />,
    defaultHeight: 460,
    previewUrl: '/embed/jackpot',
  },
  {
    id: 'value-bets',
    name: '+EV Value Bets Radar',
    description: 'Positive Expected Value (+EV) football bets comparing true model odds against bookmaker lines.',
    icon: <BarChart3 className="h-4 w-4 text-blue-500" />,
    defaultHeight: 380,
    previewUrl: '/embed/value-bets',
  },
];

export default function Widgets() {
  const [selectedWidget, setSelectedWidget] = useState<string>('banker');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [width, setWidth] = useState<'100%' | '480px' | '320px'>('100%');
  const [copied, setCopied] = useState<boolean>(false);

  const active = WIDGET_TYPES.find((w) => w.id === selectedWidget) || WIDGET_TYPES[0];

  const embedCode = `<!-- PredictPro AI Football Predictions Widget (Free Embed) -->
<div class="predictpro-widget-container" style="max-width: ${width}; width: 100%; margin: 12px auto; font-family: system-ui, -apple-system, sans-serif;">
  <iframe
    src="https://predictpro.guru/embed/${active.id}?theme=${theme}"
    width="100%"
    height="${active.defaultHeight}"
    frameborder="0"
    scrolling="no"
    loading="lazy"
    style="border-radius: 12px; border: 1px solid ${theme === 'dark' ? '#27272a' : '#e4e4e7'}; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"
    title="PredictPro ${active.name}">
  </iframe>
  <div style="font-size: 11px; text-align: center; margin-top: 6px; color: #71717a;">
    Football Predictions &amp; xG Stats by 
    <a href="https://predictpro.guru" target="_blank" rel="noopener" style="color: #10b981; font-weight: 600; text-decoration: none;">
      PredictPro AI Football Predictions
    </a>
  </div>
</div>`;

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Widget embed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="Free Embeddable AI Football Predictions Widgets & Odds Feeds"
        description="Embed live AI football predictions, banker bets, and Expected Goals (xG) widgets on your sports blog or website for free with high-DA backlink attribution."
        canonical="/widgets"
        keywords="embed football predictions widget, sports blog widget, soccer odds iframe, free football prediction widget, live score widget"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-6xl space-y-10">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-semibold">
            <Code2 className="w-3.5 h-3.5 mr-1" /> Webmaster &amp; Publisher Tools
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Free Embeddable AI Football Predictions Widgets
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Enhance your sports blog, betting community, or news portal with live AI football predictions, Poisson Expected Goals (xG), and daily banker picks. Free, responsive, and light on page speed.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border bg-card">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-foreground">Zero Maintenance</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Widgets auto-refresh daily fixtures, kickoff times, odds, and settlement outcomes automatically.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-card">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                <Globe className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-foreground">High-Quality Domain Authority</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Join hundreds of verified publishers sharing quantitative football analytics and Google Discover-friendly data.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-card">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-foreground">Responsive &amp; Fast</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Lightweight iframe sandbox under 45KB gzip. Zero third-party tracker bloat on your parent domain.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Widget Configurator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">1. Choose Widget Type</CardTitle>
                <CardDescription>Select the football data feed you want to embed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {WIDGET_TYPES.map((widget) => {
                  const isSelected = selectedWidget === widget.id;
                  return (
                    <button
                      key={widget.id}
                      onClick={() => setSelectedWidget(widget.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="mt-0.5">{widget.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm flex items-center justify-between">
                          <span>{widget.name}</span>
                          {isSelected && <Badge variant="secondary" className="text-[10px]">Active</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {widget.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">2. Styling &amp; Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className="justify-start gap-2"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700" /> Dark Mode
                    </Button>
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                      className="justify-start gap-2"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-100 border border-zinc-300" /> Light Mode
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Container Width
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={width === '100%' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setWidth('100%')}
                      className="text-xs"
                    >
                      Responsive
                    </Button>
                    <Button
                      variant={width === '480px' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setWidth('480px')}
                      className="text-xs"
                    >
                      Medium (480px)
                    </Button>
                    <Button
                      variant={width === '320px' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setWidth('320px')}
                      className="text-xs"
                    >
                      Sidebar (320px)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Code Column */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">Live Widget Preview</CardTitle>
                  <CardDescription>Interactive view exactly as it appears on your website</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/30 rounded-2xl border border-dashed flex justify-center">
                  <div style={{ maxWidth: width, width: '100%' }}>
                    {/* Embedded preview mockup */}
                    <div className={`rounded-xl border p-5 shadow-sm transition-all ${
                      theme === 'dark' ? 'bg-zinc-950 text-white border-zinc-800' : 'bg-white text-zinc-900 border-zinc-200'
                    }`}>
                      <div className="flex items-center justify-between pb-3 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="font-black text-sm tracking-tight">PredictPro AI</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                          {active.name}
                        </Badge>
                      </div>

                      <div className="py-4 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold">Arsenal vs Chelsea</span>
                          <span className="text-emerald-500 font-extrabold">87% Confidence</span>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex justify-between items-center">
                          <span className="font-semibold text-emerald-400">AI Selection: Arsenal Win (1X2)</span>
                          <span className="font-black">Odd: 1.95</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                          <span>Expected Goals: 2.14 vs 0.98</span>
                          <span>Poisson Score: 2-0</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50 text-[10px] text-center text-muted-foreground">
                        Live AI football prediction powered by{' '}
                        <span className="text-emerald-500 font-bold">PredictPro</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-center mt-2 text-muted-foreground">
                      Powered by{' '}
                      <a href="https://predictpro.guru" className="text-primary font-semibold hover:underline">
                        PredictPro AI Football Predictions
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Embed Code Snippet */}
            <Card className="border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">HTML / Iframe Embed Code</CardTitle>
                  <CardDescription>Paste this snippet into your HTML or CMS (WordPress, Webflow, Ghost)</CardDescription>
                </div>
                <Button size="sm" onClick={copyCode} className="gap-1.5">
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy Code'}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-xl bg-zinc-950 text-zinc-100 text-xs font-mono overflow-x-auto border border-zinc-800 leading-relaxed whitespace-pre-wrap">
                  {embedCode}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Backlinks & Syndication Details */}
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-xl">Open Data Feeds &amp; Syndication APIs</CardTitle>
            <CardDescription>
              In addition to widgets, access our structured RSS, Atom, and OpenAPI feeds for automated sports data ingestion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between group"
            >
              <div className="space-y-1">
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-amber-500" /> RSS 2.0 Feed
                </span>
                <p className="text-xs text-muted-foreground">/rss.xml — Strategy articles &amp; guides</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            <a
              href="/feed-predictions.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between group"
            >
              <div className="space-y-1">
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-rose-500" /> Daily Predictions Feed
                </span>
                <p className="text-xs text-muted-foreground">/feed-predictions.xml — Matchday tips</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            <a
              href="/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between group"
            >
              <div className="space-y-1">
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <Code2 className="h-4 w-4 text-blue-500" /> OpenAPI Catalog
                </span>
                <p className="text-xs text-muted-foreground">/openapi.json — Machine-readable endpoints</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
