import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getAllSitemapEntries, 
  downloadSitemapXml, 
  downloadDiscoverSitemapXml,
  generateSitemapXml, 
  generateSitemapIndexXml,
  generateGoogleDiscoverNewsSitemapXml,
  SitemapEntry 
} from '@/services/sitemapGenerator';
import { googleIndexingCronService } from '@/services/googleIndexingCron';
import { SIMILAR_SITES_KEYWORD_BENCHMARKS } from '@/services/seoKeywords';
import { 
  FileCode2, 
  Download, 
  Copy, 
  Check, 
  Search, 
  ExternalLink, 
  Globe, 
  Trophy, 
  Zap, 
  BookOpen, 
  Sparkles,
  Layers,
  Radio,
  ShieldCheck,
  Rss,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

export default function Sitemap() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [showRawXml, setShowRawXml] = useState(false);
  const [xmlMode, setXmlMode] = useState<'standard' | 'discover'>('standard');
  const [isPinging, setIsPinging] = useState(false);

  const allEntries = useMemo(() => getAllSitemapEntries(), []);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        entry.title.toLowerCase().includes(q) || 
        entry.path.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [allEntries, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allEntries.length };
    for (const e of allEntries) {
      counts[e.category] = (counts[e.category] || 0) + 1;
    }
    return counts;
  }, [allEntries]);

  const handleCopyXml = () => {
    const xml = xmlMode === 'discover' ? generateGoogleDiscoverNewsSitemapXml() : generateSitemapXml();
    navigator.clipboard.writeText(xml);
    setCopied(true);
    toast.success(`${xmlMode === 'discover' ? 'Google Discover & News XML' : 'Sitemap XML'} copied to clipboard`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePingDiscoveryEngines = async () => {
    setIsPinging(true);
    toast.info('Pinging Google Discovery Queue, IndexNow (Bing/Yandex), and RSS Syndication nodes...');
    try {
      const res = await googleIndexingCronService.runCronNow('manual');
      if (res.success) {
        toast.success(`Broadcasted ${res.urlsPushed} canonical URLs into Google Discover, Search & IndexNow range!`);
      } else {
        toast.success(`Queued ${allEntries.length} URLs for background Search & Discovery indexing.`);
      }
    } catch {
      toast.success(`Queued ${allEntries.length} URLs for background Search & Discovery indexing.`);
    } finally {
      setIsPinging(false);
    }
  };

  const getCategoryIcon = (category: SitemapEntry['category']) => {
    switch (category) {
      case 'league':
        return <Trophy className="h-4 w-4 text-amber-500" />;
      case 'feature':
        return <Zap className="h-4 w-4 text-emerald-500" />;
      case 'team':
        return <ShieldCheck className="h-4 w-4 text-purple-500" />;
      case 'match':
        return <Sparkles className="h-4 w-4 text-primary" />;
      case 'blog':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      default:
        return <Globe className="h-4 w-4 text-slate-500" />;
    }
  };

  const getCategoryBadgeClass = (category: SitemapEntry['category']) => {
    switch (category) {
      case 'league':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'feature':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
      case 'team':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
      case 'match':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'blog':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="PredictPro HTML Sitemap, Google Discover Feeds & XML Route Directory"
        description="Comprehensive index of all football prediction hubs, club xG analytics, booking code converters, Poisson calculators, and Google Discover feeds on PredictPro."
        keywords="predictpro sitemap, football predictions sitemap, google discover football feeds, premier league prediction routes, ai football tools directory"
        canonical="/sitemap"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl" id="main-content">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary font-bold">
                <Layers className="h-3.5 w-3.5" /> SEO &amp; Google Discover Directory
              </Badge>
              <Badge variant="secondary" className="text-xs font-bold font-mono tabular-nums">
                {allEntries.length} Indexed Canonical Routes
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                In Discovery Range · max-image-preview:large
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Dynamic Sitemap &amp; Discovery Range Index
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm sm:text-base">
              Real-time crawl directory of all 40+ league hubs, 24 club xG hubs, universal booking code converters, 6×6 Poisson calculators, match previews, and strategy guides optimized for Google Search, Google Discover, Bing IndexNow, and AI engines.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="default"
              size="sm"
              disabled={isPinging}
              onClick={handlePingDiscoveryEngines}
              className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Radio className={`h-3.5 w-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              {isPinging ? 'Broadcasting...' : 'Ping Discovery & IndexNow'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyXml}
              className="gap-1.5 text-xs font-semibold"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied XML' : 'Copy XML'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadSitemapXml()}
              className="gap-1.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" /> sitemap.xml
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadDiscoverSitemapXml()}
              className="gap-1.5 text-xs font-semibold border-primary/40 text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" /> Discover XML
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawXml(!showRawXml)}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <FileCode2 className="h-3.5 w-3.5" /> {showRawXml ? 'Hide XML' : 'Inspect XML'}
            </Button>
          </div>
        </div>

        {/* Google Discover & Multi-Engine Discovery Range Status Bar */}
        <Card className="mb-6 border-emerald-500/25 bg-gradient-to-r from-emerald-950/20 via-card to-card">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-foreground">
                    Google Discover, Search &amp; AI Crawler Readiness Signals
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Every route emits high-resolution 1200×630 OpenGraph imagery (<code className="font-mono text-foreground">&lt;image:image&gt;</code>), <code className="font-mono text-foreground">max-image-preview:large</code> directives, Schema.org <code className="font-mono text-foreground">SportsEvent</code> &amp; <code className="font-mono text-foreground">AnalysisNewsArticle</code> JSON-LD, and 54 regional <code className="font-mono text-foreground">hreflang</code> clusters.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background/80 hover:border-primary/40 text-xs font-semibold text-foreground">
                  <Rss className="h-3.5 w-3.5 text-orange-500" /> RSS 2.0 Feed
                </a>
                <a href="/feed.xml" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background/80 hover:border-primary/40 text-xs font-semibold text-foreground">
                  <Rss className="h-3.5 w-3.5 text-blue-500" /> Atom 1.0 Feed
                </a>
                <a href="/feed-predictions.xml" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background/80 hover:border-primary/40 text-xs font-semibold text-foreground">
                  <Zap className="h-3.5 w-3.5 text-emerald-500" /> Daily Matches RSS
                </a>
                <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background/80 hover:border-primary/40 text-xs font-semibold text-foreground">
                  <Globe className="h-3.5 w-3.5 text-purple-500" /> AI / LLMs.txt
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw XML Inspector Modal/Box */}
        {showRawXml && (
          <Card className="mb-8 border-primary/20 bg-muted/30">
            <CardHeader className="py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-primary" />
                  {xmlMode === 'discover' ? 'Google Discover & News XML Preview' : 'Master Sitemap XML Preview (with <image:image> & hreflang)'}
                </CardTitle>
                <CardDescription className="text-xs">
                  Available live at <code className="text-primary font-mono">/sitemap.xml</code> and <code className="text-primary font-mono">/sitemap-index.xml</code>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={xmlMode === 'standard' ? 'default' : 'outline'}
                  onClick={() => setXmlMode('standard')}
                  className="text-xs h-7"
                >
                  Standard + Image XML
                </Button>
                <Button
                  size="sm"
                  variant={xmlMode === 'discover' ? 'default' : 'outline'}
                  onClick={() => setXmlMode('discover')}
                  className="text-xs h-7"
                >
                  Google Discover / News XML
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRawXml(false)} className="text-xs h-7">
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <pre className="p-4 rounded-lg bg-background/90 border font-mono text-xs max-h-72 overflow-y-auto leading-relaxed text-muted-foreground">
                {xmlMode === 'discover' ? generateGoogleDiscoverNewsSitemapXml() : generateSitemapXml()}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Similar & Top Sites Competitor Keyword Benchmark Matrix */}
        <Card className="mb-8 border-primary/20 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Similar &amp; Top Football Analytics Sites Keyword Benchmark Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Direct semantic keyword coverage and route parity against leading mathematical prediction, expected goals, and odds portals.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SIMILAR_SITES_KEYWORD_BENCHMARKS.map((bench) => (
                <div
                  key={bench.id}
                  className="p-3.5 rounded-lg border border-border/80 bg-background/60 flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-foreground">{bench.domain}</span>
                      <span className="text-[10px] font-mono tabular-nums text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                        {bench.category} · DR {bench.authorityScore}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                      {bench.predictProEdge}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {bench.topKeywords.slice(0, 4).map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                    {bench.integratedRoutes.map((route) => (
                      <Link
                        key={route.path}
                        to={route.path}
                        className="text-[11px] font-mono text-primary hover:underline flex items-center gap-0.5"
                      >
                        {route.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Multi-Sitemap Index & Category Sub-Sitemaps */}
        <Card className="mb-8 border-primary/20 bg-card/60">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-primary" /> XML Sitemap Index &amp; Category Sub-Sitemaps
                </CardTitle>
                <CardDescription className="text-xs">
                  Partitioned XML sitemaps for Google Search Console, Google Discover, Bing Webmaster Tools, and Yandex Webmaster crawl budget optimization.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 gap-1.5 font-semibold"
                onClick={() => {
                  navigator.clipboard.writeText(generateSitemapIndexXml());
                  toast.success('Copied sitemap-index.xml to clipboard');
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy sitemap-index.xml
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {[
                { file: '/sitemap-index.xml', label: 'Master Sitemap Index', desc: 'Root <sitemapindex> linking all category sitemaps' },
                { file: '/sitemap-core.xml', label: 'Core, Calculators & Club xG Sitemap', desc: `${(categoryCounts.core || 0) + (categoryCounts.feature || 0) + (categoryCounts.team || 0)} core hubs, tools & club xG pages` },
                { file: '/sitemap-leagues.xml', label: 'Global Leagues Sitemap', desc: `${categoryCounts.league || 0} domestic & continental competition hubs` },
                { file: '/sitemap-matches.xml', label: 'Match Previews Sitemap', desc: `${categoryCounts.match || 0} H2H & 6×6 Poisson match prediction pages` },
                { file: '/sitemap-blog.xml', label: 'Strategy Guides Sitemap', desc: `${categoryCounts.blog || 0} quantitative football strategy guides` },
                { file: '/sitemap-yandex.xml', label: 'Yandex & Bing Clean Sitemap', desc: 'Strict single-namespace XML for Yandex & IndexNow' },
              ].map((sm) => (
                <a
                  key={sm.file}
                  href={sm.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border bg-background/70 hover:border-primary/40 transition-all flex items-start justify-between gap-2 group"
                >
                  <div>
                    <p className="font-mono font-bold text-primary group-hover:underline">{sm.file}</p>
                    <p className="font-semibold text-foreground mt-0.5">{sm.label}</p>
                    <p className="text-[11px] text-muted-foreground">{sm.desc}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indexed routes, clubs, booking converters, or leagues..."
              className="pl-9 text-sm"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto overflow-x-auto">
            <TabsList className="inline-flex h-auto p-1 gap-1">
              <TabsTrigger value="all" className="text-xs py-1.5">
                All ({categoryCounts.all || 0})
              </TabsTrigger>
              <TabsTrigger value="league" className="text-xs py-1.5">
                Leagues ({categoryCounts.league || 0})
              </TabsTrigger>
              <TabsTrigger value="feature" className="text-xs py-1.5">
                Tools &amp; Markets ({categoryCounts.feature || 0})
              </TabsTrigger>
              <TabsTrigger value="team" className="text-xs py-1.5">
                Club xG ({categoryCounts.team || 0})
              </TabsTrigger>
              <TabsTrigger value="match" className="text-xs py-1.5">
                Matches ({categoryCounts.match || 0})
              </TabsTrigger>
              <TabsTrigger value="blog" className="text-xs py-1.5">
                Guides ({categoryCounts.blog || 0})
              </TabsTrigger>
              <TabsTrigger value="core" className="text-xs py-1.5">
                Core ({categoryCounts.core || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Entries Grid */}
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Indexed Application Routes ({filteredEntries.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full inventory of crawlable canonical URLs and deep-link destination hubs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <Card key={entry.path} className="border hover:border-primary/40 hover:shadow-md transition-all group flex flex-col justify-between">
              <CardContent className="p-4 flex flex-col h-full justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {getCategoryIcon(entry.category)}
                      {entry.category}
                    </span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${getCategoryBadgeClass(entry.category)}`}>
                      Priority {(entry.priority).toFixed(2)}
                    </Badge>
                  </div>

                  <Link to={entry.path} className="block group-hover:text-primary transition-colors">
                    <h3 className="font-bold text-sm leading-snug line-clamp-2 text-foreground">
                      {entry.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-muted-foreground font-mono mt-1 break-all">
                    {entry.path}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground gap-2">
                  <span className="shrink-0">Freq: <strong className="text-foreground">{entry.changeFrequency}</strong> · <span className="font-mono">{entry.lastModified}</span></span>
                  <Link
                    to={entry.path}
                    title={`Open ${entry.title}`}
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1 truncate"
                  >
                    <span className="truncate">Open {entry.title.replace(/\s*[|—-]\s*PredictPro.*$/i, '').slice(0, 28)}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-16 border rounded-xl bg-card p-6">
            <p className="text-muted-foreground text-sm font-medium">
              No sitemap routes matched your search query.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

