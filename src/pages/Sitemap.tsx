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
  generateSitemapXml, 
  SitemapEntry 
} from '@/services/sitemapGenerator';
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
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

export default function Sitemap() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [showRawXml, setShowRawXml] = useState(false);

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
    const xml = generateSitemapXml();
    navigator.clipboard.writeText(xml);
    setCopied(true);
    toast.success('Sitemap XML copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const getCategoryIcon = (category: SitemapEntry['category']) => {
    switch (category) {
      case 'league':
        return <Trophy className="h-4 w-4 text-amber-500" />;
      case 'feature':
        return <Zap className="h-4 w-4 text-emerald-500" />;
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
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'feature':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'match':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'blog':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="PredictPro HTML Sitemap & XML Directory | All Indexed Football Routes"
        description="Comprehensive index of all available football prediction hubs, match previews, AI betting tools, statistics, and strategy guides on PredictPro."
        keywords="predictpro sitemap, football predictions sitemap, premier league prediction routes, ai betting tools directory"
        url="https://predictpro.guru/sitemap"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary font-bold">
                <Layers className="h-3.5 w-3.5" /> SEO Site Directory
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {allEntries.length} Indexed Routes
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Dynamic Sitemap & Crawl Index
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm sm:text-base">
              Automatically mapped index of all available league hubs, match predictions, tools, and tactical betting guides for search engines and users.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
              variant="default"
              size="sm"
              onClick={() => downloadSitemapXml()}
              className="gap-1.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" /> Download sitemap.xml
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawXml(!showRawXml)}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <FileCode2 className="h-3.5 w-3.5" /> {showRawXml ? 'Hide XML' : 'View XML'}
            </Button>
          </div>
        </div>

        {/* Raw XML Inspector Modal/Box */}
        {showRawXml && (
          <Card className="mb-8 border-primary/20 bg-muted/30">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-primary" /> Generated sitemap.xml Preview
                </CardTitle>
                <CardDescription className="text-xs">
                  Available live at <code className="text-primary font-mono">/sitemap.xml</code>
                </CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowRawXml(false)} className="text-xs">
                Close
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <pre className="p-4 rounded-lg bg-background/90 border font-mono text-xs max-h-72 overflow-y-auto leading-relaxed text-muted-foreground">
                {generateSitemapXml()}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indexed routes, teams, or leagues..."
              className="pl-9 text-sm"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 gap-1">
              <TabsTrigger value="all" className="text-xs py-1.5">
                All ({categoryCounts.all || 0})
              </TabsTrigger>
              <TabsTrigger value="league" className="text-xs py-1.5">
                Leagues ({categoryCounts.league || 0})
              </TabsTrigger>
              <TabsTrigger value="feature" className="text-xs py-1.5">
                Tools ({categoryCounts.feature || 0})
              </TabsTrigger>
              <TabsTrigger value="match" className="text-xs py-1.5">
                Matches ({categoryCounts.match || 0})
              </TabsTrigger>
              <TabsTrigger value="blog" className="text-xs py-1.5">
                Blog ({categoryCounts.blog || 0})
              </TabsTrigger>
              <TabsTrigger value="core" className="text-xs py-1.5">
                Core ({categoryCounts.core || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Entries Grid */}
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

                <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                  <span>Freq: <strong className="text-foreground">{entry.changeFrequency}</strong></span>
                  <Link
                    to={entry.path}
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                  >
                    Visit <ExternalLink className="h-3 w-3" />
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
