import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VideoHighlightListSkeleton } from '@/components/PredictionCardSkeleton';
import {
  fetchApiFootballHighlights,
  testApiFootballHighlightsConnection,
  saveApiFootballApiKey,
  getApiFootballApiKey,
  MatchVideoHighlight,
  ApiFootballConnectionResult,
} from '@/services/apiFootballHighlights';
import {
  Film,
  Play,
  ExternalLink,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tv,
  Maximize2,
  Share2,
  Calendar,
  MapPin,
  CheckCircle2,
  X,
  Volume2,
  Sparkles,
  KeyRound,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const LEAGUES = [
  'All',
  'Premier League',
  'Champions League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'KPL',
];

const LEAGUE_BADGE_COLORS: Record<string, string> = {
  'Premier League': 'bg-purple-600 text-white border-purple-500/40',
  'Champions League': 'bg-blue-700 text-white border-blue-500/40',
  'La Liga': 'bg-amber-600 text-white border-amber-500/40',
  'Bundesliga': 'bg-red-600 text-white border-red-500/40',
  'Serie A': 'bg-emerald-700 text-white border-emerald-500/40',
  'Ligue 1': 'bg-blue-600 text-white border-blue-400/40',
  'KPL': 'bg-green-600 text-white border-green-500/40',
};

export default function Highlights() {
  const { toast } = useToast();
  const [highlights, setHighlights] = useState<MatchVideoHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic Active Video Preview State
  const [activeHighlight, setActiveHighlight] = useState<MatchVideoHighlight | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalHighlight, setModalHighlight] = useState<MatchVideoHighlight | null>(null);
  
  // API-Football Settings & Status Dialog
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ApiFootballConnectionResult | null>(null);

  const playerRef = useRef<HTMLDivElement>(null);

  const loadHighlights = useCallback(async (force: boolean = false) => {
    setLoading(true);
    try {
      const data = await fetchApiFootballHighlights({ forceRefresh: force });
      setHighlights(data);
      setActiveHighlight(prev => (prev ? prev : (data.length > 0 ? data[0] : null)));
    } catch (err) {
      console.error('Error fetching API-Football highlights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHighlights();
    const stored = getApiFootballApiKey();
    if (stored) {
      setApiKeyInput(stored);
    }
  }, [loadHighlights]);

  // Filtered highlights based on league & search query
  const filteredHighlights = useMemo(() => {
    let list = [...highlights];

    if (selectedLeague !== 'All') {
      const target = selectedLeague.toLowerCase();
      list = list.filter(item => {
        const comp = item.competition.toLowerCase();
        if (target === 'premier league') return comp.includes('premier league') || comp.includes('epl');
        if (target === 'champions league') return comp.includes('champions league') || comp.includes('ucl');
        if (target === 'la liga') return comp.includes('la liga') || comp.includes('laliga');
        if (target === 'serie a') return comp.includes('serie a');
        if (target === 'bundesliga') return comp.includes('bundesliga');
        if (target === 'ligue 1') return comp.includes('ligue 1');
        if (target === 'kpl') return comp.includes('kpl') || comp.includes('kenya');
        return comp.includes(target);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        item =>
          item.homeTeam.toLowerCase().includes(query) ||
          item.awayTeam.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.competition.toLowerCase().includes(query)
      );
    }

    return list;
  }, [highlights, selectedLeague, searchQuery]);

  const handleSelectHighlight = (highlight: MatchVideoHighlight, scrollToPlayer: boolean = true) => {
    setActiveHighlight(highlight);
    if (scrollToPlayer && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenModal = (highlight: MatchVideoHighlight, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalHighlight(highlight);
    setIsModalOpen(true);
  };

  const handleShare = async (highlight: MatchVideoHighlight, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareData = {
      title: highlight.title,
      text: `Watch official highlights: ${highlight.title} on PredictPro`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(highlight.videoUrl || window.location.href);
      toast({
        title: 'Video link copied!',
        description: 'Match highlights link copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Share Highlights',
        description: highlight.title,
      });
    }
  };

  const handleTestKey = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await testApiFootballHighlightsConnection(apiKeyInput);
      setConnectionResult(res);
      if (res.success) {
        toast({
          title: 'API-Football Connected',
          description: res.message,
        });
      }
    } catch (e: any) {
      setConnectionResult({
        success: false,
        message: e?.message || 'Connection failed. Please check network/key.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveKey = () => {
    saveApiFootballApiKey(apiKeyInput);
    toast({
      title: 'API Configuration Saved',
      description: 'Custom key stored. Refreshing official highlights pipeline...',
    });
    setIsKeyDialogOpen(false);
    loadHighlights(true);
  };

  // Move to next highlight in list
  const handlePlayNext = () => {
    if (!activeHighlight || filteredHighlights.length === 0) return;
    const currentIndex = filteredHighlights.findIndex(h => h.id === activeHighlight.id);
    const nextIndex = (currentIndex + 1) % filteredHighlights.length;
    setActiveHighlight(filteredHighlights[nextIndex]);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Official Football Match Video Highlights & Tactical Recap | PredictPro"
        description="Watch verified football match video highlights, goal previews, and official extended clips dynamically from Premier League, Champions League, La Liga, and global tournaments."
        canonical="/highlights"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-20 pb-24 md:pb-16 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 gap-1 text-xs px-2.5 py-0.5">
                <Sparkles className="h-3 w-3" /> API-Football Video Hub
              </Badge>
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Dynamic Player Active
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Film className="h-7 w-7 text-primary" /> Official Match Video Highlights
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Stream official match video previews, goal clips, and extended recaps directly in-app.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsKeyDialogOpen(true)}
              className="gap-1.5 text-xs h-9 border-border/80 hover:bg-accent"
            >
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              API-Football Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadHighlights(true)}
              disabled={loading}
              className="h-9 px-3 gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Dynamic Featured Video Preview Showcase */}
        {activeHighlight && (
          <div ref={playerRef} className="mb-8 scroll-mt-24">
            <Card className="border border-border/70 shadow-xl overflow-hidden bg-gradient-to-b from-card to-card/95">
              <div className="p-3 sm:p-4 bg-muted/40 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 font-semibold text-primary">
                    <Tv className="h-4 w-4" /> Official Match Video Preview
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <Badge className={`${LEAGUE_BADGE_COLORS[activeHighlight.competition] || 'bg-primary text-white'} text-[11px]`}>
                    {activeHighlight.competition}
                  </Badge>
                  {activeHighlight.badge && (
                    <Badge variant="outline" className="border-border/60 text-muted-foreground text-[10px]">
                      {activeHighlight.badge}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenModal(activeHighlight)}
                    className="h-7 px-2 text-xs gap-1 hover:text-primary"
                    title="Expand to Fullscreen Modal"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Expanded View</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlayNext}
                    className="h-7 px-2 text-xs gap-1 hover:text-primary"
                  >
                    <span>Next Match</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* 16:9 Dynamic Video Player Embed */}
              <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                <iframe
                  key={activeHighlight.id}
                  src={activeHighlight.embedUrl}
                  title={activeHighlight.title}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="eager"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                />
              </div>

              {/* Active Player Metadata & Quick Controls */}
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <TeamLogo team={activeHighlight.homeTeam} logoUrl={activeHighlight.homeLogo} size="sm" />
                      <span className="font-bold text-sm sm:text-base">
                        {activeHighlight.homeTeam}
                      </span>
                      {activeHighlight.homeScore !== null && activeHighlight.awayScore !== null ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-sm">
                          {activeHighlight.homeScore} - {activeHighlight.awayScore}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold px-2">vs</span>
                      )}
                      <span className="font-bold text-sm sm:text-base">
                        {activeHighlight.awayTeam}
                      </span>
                      <TeamLogo team={activeHighlight.awayTeam} logoUrl={activeHighlight.awayLogo} size="sm" />
                    </div>

                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-2">
                      {activeHighlight.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(activeHighlight.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {activeHighlight.duration && (
                        <span>• Duration: {activeHighlight.duration}</span>
                      )}
                      {activeHighlight.venue && (
                        <span className="flex items-center gap-1">
                          • <MapPin className="h-3 w-3" /> {activeHighlight.venue}
                        </span>
                      )}
                    </div>

                    {activeHighlight.summary && (
                      <p className="text-xs text-muted-foreground/90 line-clamp-2 pt-1 border-t border-border/40">
                        {activeHighlight.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-9"
                      onClick={() => handleShare(activeHighlight)}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </Button>
                    <a
                      href={activeHighlight.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button size="sm" className="gap-1.5 text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Full Broadcast
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search highlights by club, derby, or league..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm bg-card border-border/80"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-auto">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{filteredHighlights.length} match highlights available</span>
            </div>
          </div>

          {/* League Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {LEAGUES.map(league => {
              const isSelected = selectedLeague === league;
              return (
                <button
                  key={league}
                  onClick={() => setSelectedLeague(league)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/70'
                  }`}
                >
                  {league}
                </button>
              );
            })}
          </div>
        </div>

        {/* Highlights Video Grid */}
        {loading ? (
          <VideoHighlightListSkeleton count={6} />
        ) : filteredHighlights.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border/80 bg-card/50">
            <Film className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-foreground mb-1">No match highlights found</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              No official video previews match your search filter "{searchQuery}". Try selecting another league or resetting your query.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedLeague('All');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHighlights.map(h => {
              const isActive = activeHighlight?.id === h.id;
              return (
                <Card
                  key={h.id}
                  onClick={() => handleSelectHighlight(h)}
                  className={`group cursor-pointer overflow-hidden transition-all duration-200 border hover:shadow-lg flex flex-col justify-between ${
                    isActive
                      ? 'ring-2 ring-primary border-primary bg-card/90 shadow-md'
                      : 'hover:border-primary/50 bg-card'
                  }`}
                >
                  <div>
                    {/* Video Thumbnail Header */}
                    <div className="relative aspect-video bg-muted/60 overflow-hidden">
                      <img
                        src={h.thumbnail}
                        alt={h.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />

                      {/* Video Player Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-red-600/90 group-hover:bg-red-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                          <Play className="h-5 w-5 text-white ml-0.5" />
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <Badge className={`${LEAGUE_BADGE_COLORS[h.competition] || 'bg-primary text-white'} text-[10px] font-semibold shadow-sm`}>
                          {h.competition}
                        </Badge>
                      </div>

                      {/* Bottom Duration Badge */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        {h.duration && (
                          <span className="px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white tracking-wider">
                            {h.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content & Match Details */}
                    <CardContent className="p-4">
                      {/* Teams & Score Preview */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamLogo team={h.homeTeam} logoUrl={h.homeLogo} size="xs" />
                          <span className="text-xs font-semibold truncate">{h.homeTeam}</span>
                        </div>
                        {h.homeScore !== null && h.awayScore !== null ? (
                          <span className="text-xs font-bold text-primary font-mono px-1.5 py-0.5 rounded bg-primary/10 flex-shrink-0">
                            {h.homeScore} - {h.awayScore}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">vs</span>
                        )}
                        <div className="flex items-center gap-2 min-w-0 justify-end">
                          <span className="text-xs font-semibold truncate text-right">{h.awayTeam}</span>
                          <TeamLogo team={h.awayTeam} logoUrl={h.awayLogo} size="xs" />
                        </div>
                      </div>

                      {/* Highlight Title */}
                      <h3 className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {h.title}
                      </h3>

                      {h.summary && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                          {h.summary}
                        </p>
                      )}
                    </CardContent>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-4 pb-3 pt-1 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-[11px]">
                      {new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={isActive ? 'default' : 'secondary'}
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectHighlight(h);
                        }}
                        className="h-7 px-2 text-[11px] gap-1"
                      >
                        <Play className="h-3 w-3" />
                        {isActive ? 'Playing' : 'Preview'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={e => handleOpenModal(h, e)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Open Modal"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Expanded Video Preview Modal Lightbox */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border border-border">
          {modalHighlight && (
            <div>
              <DialogHeader className="p-4 pb-2 border-b border-border/60">
                <div className="flex items-center justify-between gap-3 pr-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${LEAGUE_BADGE_COLORS[modalHighlight.competition] || 'bg-primary text-white'} text-[10px]`}>
                        {modalHighlight.competition}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(modalHighlight.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <DialogTitle className="text-base sm:text-lg font-bold">
                      {modalHighlight.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {modalHighlight.homeTeam} vs {modalHighlight.awayTeam} • Official Video Highlights
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* 16:9 Modal Video Embed Frame */}
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={modalHighlight.embedUrl}
                  title={modalHighlight.title}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                />
              </div>

              {/* Modal Footer Info */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/20">
                <div className="flex items-center gap-3">
                  <TeamLogo team={modalHighlight.homeTeam} logoUrl={modalHighlight.homeLogo} size="xs" />
                  <span className="font-semibold">{modalHighlight.homeTeam}</span>
                  {modalHighlight.homeScore !== null && modalHighlight.awayScore !== null && (
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      {modalHighlight.homeScore} - {modalHighlight.awayScore}
                    </span>
                  )}
                  <span className="font-semibold">{modalHighlight.awayTeam}</span>
                  <TeamLogo team={modalHighlight.awayTeam} logoUrl={modalHighlight.awayLogo} size="xs" />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    onClick={() => handleShare(modalHighlight)}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                  <a href={modalHighlight.videoUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="h-8 text-xs gap-1 bg-primary text-primary-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Full Player
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* API-Football Configuration Dialog */}
      <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-primary" /> API-Football Integration Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure your direct API-Football or RapidAPI credentials to stream live match video highlights and official fixture endpoints.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Info className="h-3.5 w-3.5 text-primary" /> Multi-Source Highlights Pipeline
              </div>
              <p className="text-muted-foreground">
                PredictPro natively integrates API-Football, ESPN scoreboards, and official broadcaster video feeds. Adding your custom key connects your private quota tier.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                API-Football / RapidAPI Key
              </label>
              <Input
                type="password"
                placeholder="Paste API-Football or RapidAPI key here..."
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                className="text-xs font-mono h-9"
              />
              <p className="text-[11px] text-muted-foreground">
                Supports <code className="text-primary font-mono">api-football-v1.p.rapidapi.com</code> or direct <code className="text-primary font-mono">v3.football.api-sports.io</code>.
              </p>
            </div>

            {connectionResult && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  connectionResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  {connectionResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  {connectionResult.success ? 'Connection Successful' : 'Connection Failed'}
                </div>
                <p className="mt-1">{connectionResult.message}</p>
                {connectionResult.latency && (
                  <p className="text-[10px] opacity-80 mt-1">Latency: {connectionResult.latency}ms</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestKey}
                disabled={testingConnection}
                className="text-xs h-9 gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsKeyDialogOpen(false)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveKey}
                  className="text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save & Connect
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
