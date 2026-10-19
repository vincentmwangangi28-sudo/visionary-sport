import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent } from '@/components/ui/card';
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
  MatchVideoHighlight,
} from '@/services/apiFootballHighlights';
import { getMatchBroadcastInfo } from '@/services/liveBroadcastService';
import { LiveStreamHubModal } from '@/components/LiveStreamHubModal';
import { useGeoRegion } from '@/hooks/useGeoRegion';
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
  X,
  ChevronRight,
  Radio,
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

const FALLBACK_PITCH_SVG_DATA_URI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'><rect width='640' height='360' fill='%23064e3b'/><rect x='24' y='24' width='592' height='312' fill='none' stroke='%2310b981' stroke-width='2' stroke-opacity='0.5'/><line x1='320' y1='24' x2='320' y2='336' stroke='%2310b981' stroke-width='2' stroke-opacity='0.5'/><circle cx='320' cy='180' r='48' fill='none' stroke='%2310b981' stroke-width='2' stroke-opacity='0.5'/></svg>";

export default function Highlights() {
  const { toast } = useToast();
  const { region } = useGeoRegion();
  const [highlights, setHighlights] = useState<MatchVideoHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Active Video Preview State
  const [activeHighlight, setActiveHighlight] = useState<MatchVideoHighlight | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalHighlight, setModalHighlight] = useState<MatchVideoHighlight | null>(null);
  const [streamHubMatch, setStreamHubMatch] = useState<MatchVideoHighlight | null>(null);

  const playerRef = useRef<HTMLDivElement>(null);

  const loadHighlights = useCallback(async (force: boolean = false) => {
    setLoading(true);
    try {
      const data = await fetchApiFootballHighlights({ forceRefresh: force });
      setHighlights(data);
      setActiveHighlight((prev) => (prev ? prev : data.length > 0 ? data[0] : null));
    } catch (err) {
      console.error('Error fetching highlights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights]);

  const filteredHighlights = useMemo(() => {
    let list = [...highlights];

    if (selectedLeague !== 'All') {
      const target = selectedLeague.toLowerCase();
      list = list.filter((item) => {
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
        (item) =>
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
      } catch {
        // fallback to clipboard
      }
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

  const handlePlayNext = () => {
    if (!activeHighlight || filteredHighlights.length === 0) return;
    const currentIndex = filteredHighlights.findIndex((h) => h.id === activeHighlight.id);
    const nextIndex = (currentIndex + 1) % filteredHighlights.length;
    setActiveHighlight(filteredHighlights[nextIndex]);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Official Football Match Video Highlights, Live TV & Stream Hub"
        description="Watch verified football match video highlights, goal clips, and official TV/streaming broadcasts from Premier League, Champions League, La Liga, and KPL."
        canonical="/highlights"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-8 pb-24 md:pb-16 max-w-6xl flex-1 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <p className="text-xs font-semibold text-primary mb-1">
              ScoreBat Video Feed · FIFA+ Free Streams · Regional Broadcast Directory ({region.flag} {region.name})
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Film className="h-7 w-7 text-primary shrink-0" />
              <span>Official Match Video Highlights &amp; Broadcast Center</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Stream official match video recaps, extended goal clips, and check regional live TV / streaming channels.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {activeHighlight && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStreamHubMatch(activeHighlight)}
                className="gap-1.5 text-xs h-9 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-bold whitespace-nowrap"
                data-testid="open-broadcast-guide-btn"
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Live TV &amp; Stream Directory</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadHighlights(true)}
              disabled={loading}
              className="h-9 px-3 gap-1.5 text-xs whitespace-nowrap"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Feed</span>
            </Button>
          </div>
        </div>

        {/* Dynamic Featured Video Preview Showcase */}
        {activeHighlight && (
          <div ref={playerRef} className="scroll-mt-24">
            <Card className="border border-border/80 overflow-hidden bg-card">
              <div className="p-3 sm:p-4 bg-muted/30 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 font-bold text-primary">
                    <Tv className="h-4 w-4" /> Official Match Video Player
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-semibold text-foreground">{activeHighlight.competition}</span>
                  {activeHighlight.badge && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{activeHighlight.badge}</span>
                    </>
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
                      <span className="font-bold text-sm sm:text-base">{activeHighlight.homeTeam}</span>
                      {activeHighlight.homeScore !== null && activeHighlight.awayScore !== null ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-mono tabular-nums font-black text-sm">
                          {activeHighlight.homeScore} - {activeHighlight.awayScore}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold px-2">vs</span>
                      )}
                      <span className="font-bold text-sm sm:text-base">{activeHighlight.awayTeam}</span>
                      <TeamLogo team={activeHighlight.awayTeam} logoUrl={activeHighlight.awayLogo} size="sm" />
                    </div>

                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-2">
                      {activeHighlight.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(activeHighlight.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {activeHighlight.duration && <span>· Duration: {activeHighlight.duration}</span>}
                      {activeHighlight.venue && (
                        <span className="flex items-center gap-1">
                          · <MapPin className="h-3 w-3" /> {activeHighlight.venue}
                        </span>
                      )}
                      {(() => {
                        const bInfo = getMatchBroadcastInfo({
                          matchId: activeHighlight.id,
                          homeTeam: activeHighlight.homeTeam,
                          awayTeam: activeHighlight.awayTeam,
                          league: activeHighlight.competition,
                          regionId: region.id,
                        });
                        return (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            · TV/Stream: {bInfo.primaryBroadcaster.name}
                          </span>
                        );
                      })()}
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
                      onClick={() => setStreamHubMatch(activeHighlight)}
                    >
                      <Tv className="h-3.5 w-3.5 text-emerald-600" />
                      Where to Watch Live
                    </Button>
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
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search highlights by club, derby, or league..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-card border-border/80"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-auto font-mono tabular-nums">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{filteredHighlights.length} match videos available</span>
            </div>
          </div>

          {/* League Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {LEAGUES.map((league) => {
              const isSelected = selectedLeague === league;
              return (
                <button
                  key={league}
                  type="button"
                  onClick={() => setSelectedLeague(league)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
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
              No official video previews match your search filter &ldquo;{searchQuery}&rdquo;. Try selecting another league or resetting your query.
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
            {filteredHighlights.map((h) => {
              const isActive = activeHighlight?.id === h.id;
              const bInfo = getMatchBroadcastInfo({
                matchId: h.id,
                homeTeam: h.homeTeam,
                awayTeam: h.awayTeam,
                league: h.competition,
                regionId: region.id,
              });
              return (
                <Card
                  key={h.id}
                  onClick={() => handleSelectHighlight(h)}
                  className={`group cursor-pointer overflow-hidden transition-all duration-150 border flex flex-col justify-between ${
                    isActive
                      ? 'ring-2 ring-primary border-primary bg-card/95'
                      : 'hover:border-primary/50 bg-card'
                  }`}
                >
                  <div>
                    {/* Video Thumbnail Header */}
                    <div className="relative aspect-video bg-muted/60 overflow-hidden">
                      <img
                        src={h.thumbnail || FALLBACK_PITCH_SVG_DATA_URI}
                        alt={h.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_PITCH_SVG_DATA_URI;
                        }}
                      />

                      {/* Video Player Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                        <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                          <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                        </div>
                      </div>

                      {/* Top Competition Label */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-bold">
                          {h.competition}
                        </span>
                      </div>

                      {/* Bottom Duration Badge */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        {h.duration && (
                          <span className="px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono tabular-nums text-white">
                            {h.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content & Match Details */}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamLogo team={h.homeTeam} logoUrl={h.homeLogo} size="xs" />
                          <span className="text-xs font-semibold truncate">{h.homeTeam}</span>
                        </div>
                        {h.homeScore !== null && h.awayScore !== null ? (
                          <span className="text-xs font-bold text-primary font-mono tabular-nums px-1.5 py-0.5 rounded bg-primary/10 flex-shrink-0">
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

                      <h3 className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                        {h.title}
                      </h3>

                      <p className="text-[11px] text-muted-foreground truncate">
                        {bInfo.primaryBroadcaster.shortName} ·{' '}
                        {new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </CardContent>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-4 pb-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStreamHubMatch(h);
                      }}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Tv className="h-3 w-3" />
                      <span>TV &amp; Streams</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={isActive ? 'default' : 'secondary'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectHighlight(h);
                        }}
                        className="h-7 px-2.5 text-[11px] gap-1 font-bold"
                      >
                        <Play className="h-3 w-3" />
                        {isActive ? 'Playing' : 'Watch Clip'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleOpenModal(h, e)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Open Fullscreen Player"
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
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {modalHighlight.competition} ·{' '}
                      {new Date(modalHighlight.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <DialogTitle className="text-base sm:text-lg font-bold">
                      {modalHighlight.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {modalHighlight.homeTeam} vs {modalHighlight.awayTeam} · Official Video Highlights
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

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

              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/20">
                <div className="flex items-center gap-3">
                  <TeamLogo team={modalHighlight.homeTeam} logoUrl={modalHighlight.homeLogo} size="xs" />
                  <span className="font-semibold">{modalHighlight.homeTeam}</span>
                  {modalHighlight.homeScore !== null && modalHighlight.awayScore !== null && (
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold">
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

      {/* Live Stream & Regional TV Directory Modal */}
      {streamHubMatch && (
        <LiveStreamHubModal
          match={{
            id: streamHubMatch.id,
            homeTeam: streamHubMatch.homeTeam,
            awayTeam: streamHubMatch.awayTeam,
            league: streamHubMatch.competition,
            homeScore: streamHubMatch.homeScore ?? 1,
            awayScore: streamHubMatch.awayScore ?? 1,
            minute: 'FT',
            status: 'finished',
            homeXG: 1.68,
            awayXG: 1.14,
            homePossession: 54,
            awayPossession: 46,
          }}
          regionId={region.id}
          onClose={() => setStreamHubMatch(null)}
        />
      )}

      <Footer />
    </div>
  );
}
