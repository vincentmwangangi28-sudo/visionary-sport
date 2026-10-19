import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tv,
  Play,
  Radio,
  Globe,
  ExternalLink,
  Video,
  CheckCircle2,
  Sparkles,
  Activity,
} from 'lucide-react';
import {
  getMatchBroadcastInfo,
  fetchLiveVideoHighlights,
  LiveVideoHighlightItem,
} from '@/services/liveBroadcastService';
import { GeographicRegionId } from '@/services/geoRegionService';

export interface WatchableMatchInput {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  homeScore: number;
  awayScore: number;
  minute: string;
  status: string;
  homeXG: number;
  awayXG: number;
  homePossession: number;
  awayPossession: number;
}

interface LiveStreamHubModalProps {
  match: WatchableMatchInput | null;
  regionId?: GeographicRegionId;
  onClose: () => void;
}

export const LiveStreamHubModal: React.FC<LiveStreamHubModalProps> = ({
  match,
  regionId = 'east_africa',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'live_cast' | 'broadcasters' | 'video_clips'>('live_cast');
  const [selectedRegion, setSelectedRegion] = useState<GeographicRegionId>(regionId);
  const [videoItems, setVideoItems] = useState<LiveVideoHighlightItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setSelectedRegion(regionId);
  }, [regionId]);

  // Animate the live 2D Match Cast ball & commentary ticker every 2.5 seconds
  useEffect(() => {
    if (!match) return;
    const interval = setInterval(() => {
      setTick((prev) => (prev + 1) % 6);
    }, 2500);
    return () => clearInterval(interval);
  }, [match]);

  useEffect(() => {
    if (!match) return;
    let mounted = true;
    setLoadingVideos(true);
    fetchLiveVideoHighlights(match.homeTeam, match.awayTeam, match.league)
      .then((items) => {
        if (mounted) setVideoItems(items);
      })
      .finally(() => {
        if (mounted) setLoadingVideos(false);
      });
    return () => {
      mounted = false;
    };
  }, [match]);

  if (!match) return null;

  const broadcastInfo = getMatchBroadcastInfo({
    matchId: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    regionId: selectedRegion,
  });

  // Simulated real-time ball coordinates & action commentary for the 2D Match Cast
  const castFrames = [
    {
      ballX: 50,
      ballY: 28,
      zone: 'Midfield Build-Up',
      team: match.homeTeam,
      commentary: `${match.homeTeam} circulating possession through the central pivot.`,
    },
    {
      ballX: 72,
      ballY: 18,
      zone: 'Final Third Progression',
      team: match.homeTeam,
      commentary: `${match.homeTeam} overlapping down the right flank into the attacking third.`,
    },
    {
      ballX: 86,
      ballY: 27,
      zone: 'Penalty Box Danger!',
      team: match.homeTeam,
      commentary: `Dangerous low cross into the 18-yard box by ${match.homeTeam}!`,
    },
    {
      ballX: 55,
      ballY: 36,
      zone: 'Counter-Attack Transition',
      team: match.awayTeam,
      commentary: `${match.awayTeam} wins the second ball and launches a rapid counter.`,
    },
    {
      ballX: 24,
      ballY: 22,
      zone: 'Away Attacking Zone',
      team: match.awayTeam,
      commentary: `${match.awayTeam} pressing high near the edge of the penalty area.`,
    },
    {
      ballX: 14,
      ballY: 29,
      zone: 'Shot / Set-Piece Pressure',
      team: match.awayTeam,
      commentary: `${match.awayTeam} tests the goalkeeper from inside the penalty box.`,
    },
  ];

  const currentFrame = castFrames[tick % castFrames.length];

  return (
    <Dialog open={!!match} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl" data-testid="live-stream-hub-modal">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Tv className="h-4 w-4" />
              </span>
              <DialogTitle className="text-base font-black">
                {match.homeTeam} vs {match.awayTeam}
              </DialogTitle>
            </div>
            <Badge className="bg-rose-600 text-white text-[10px] font-black animate-pulse">
              {match.minute} • {match.homeScore} - {match.awayScore}
            </Badge>
          </div>
          <DialogDescription className="text-xs flex items-center justify-between pt-1">
            <span>{match.league} — Live Match Broadcast &amp; Stream Center</span>
            {broadcastInfo.hasFreeStream && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ● Free Stream Available
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/80 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('live_cast')}
            className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'live_cast'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-rose-500" />
            <span>2D Live Cast</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('broadcasters')}
            className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'broadcasters'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-where-to-watch"
          >
            <Tv className="h-3.5 w-3.5 text-primary" />
            <span>TV &amp; Streams ({broadcastInfo.regionalBroadcasters.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video_clips')}
            className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'video_clips'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-video-highlights"
          >
            <Video className="h-3.5 w-3.5 text-emerald-500" />
            <span>Video Feeds</span>
          </button>
        </div>

        {/* TAB 1: 2D LIVE MATCH CAST */}
        {activeTab === 'live_cast' && (
          <div className="space-y-3">
            {/* Live Scoreboard Banner */}
            <div className="p-3 rounded-xl bg-slate-950 text-white border border-slate-800 flex items-center justify-between">
              <div className="text-left flex-1">
                <p className="text-xs font-extrabold truncate">{match.homeTeam}</p>
                <p className="text-[10px] text-emerald-400 font-mono">{match.homeXG} xG • {match.homePossession}% Poss</p>
              </div>
              <div className="px-4 text-center">
                <div className="text-xl font-black font-mono tracking-wider">
                  {match.homeScore} : {match.awayScore}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600/90 text-white font-bold">
                  {match.minute}
                </span>
              </div>
              <div className="text-right flex-1">
                <p className="text-xs font-extrabold truncate">{match.awayTeam}</p>
                <p className="text-[10px] text-sky-400 font-mono">{match.awayXG} xG • {match.awayPossession}% Poss</p>
              </div>
            </div>

            {/* Animated 2D Broadcast Pitch */}
            <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950">
              <svg viewBox="0 0 100 56" className="w-full h-44 block">
                {/* Pitch Markings */}
                <rect x="2" y="2" width="96" height="52" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <line x1="50" y1="2" x2="50" y2="54" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <circle cx="50" cy="28" r="7.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <rect x="2" y="13" width="14" height="30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <rect x="84" y="13" width="14" height="30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

                {/* Active Attack Radar Cone */}
                <circle
                  cx={currentFrame.ballX}
                  cy={currentFrame.ballY}
                  r="8"
                  fill="rgba(16, 185, 129, 0.18)"
                />
                <circle
                  cx={currentFrame.ballX}
                  cy={currentFrame.ballY}
                  r="4"
                  fill="rgba(16, 185, 129, 0.32)"
                />
                {/* Ball Position */}
                <circle
                  cx={currentFrame.ballX}
                  cy={currentFrame.ballY}
                  r="1.8"
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="0.7"
                />

                {/* Overlay Zone Label */}
                <text
                  x="50"
                  y="10"
                  fill="#ffffff"
                  fontSize="3.2"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {currentFrame.zone.toUpperCase()} — {currentFrame.team}
                </text>
              </svg>

              {/* Live Play-by-Play Ticker */}
              <div className="px-3 py-2 bg-black/75 border-t border-white/10 flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0 animate-pulse" />
                  <span className="truncate font-medium">{currentFrame.commentary}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-400/40 text-emerald-300 shrink-0 ml-2">
                  Live Tracker
                </Badge>
              </div>
            </div>

            {/* Quick Stream Launch Bar */}
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-primary" />
                <span>
                  Primary Live Broadcast:{' '}
                  <strong className="text-foreground">{broadcastInfo.primaryBroadcaster.name}</strong>
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('broadcasters')}
                className="h-7 text-[11px] font-bold"
              >
                All TV &amp; Stream Links →
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: OFFICIAL TV & STREAMING CHANNELS */}
        {activeTab === 'broadcasters' && (
          <div className="space-y-3">
            {/* Region Switcher */}
            <div className="flex items-center justify-between gap-2 flex-wrap bg-muted/30 p-2 rounded-xl border border-border/60">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" /> Broadcast Region:
              </span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'east_africa' as GeographicRegionId, label: '🌍 Africa (DStv / Showmax / Azam / FTA)' },
                  { id: 'uk_ireland' as GeographicRegionId, label: '🇬🇧 UK (Sky / TNT / BBC)' },
                  { id: 'north_america' as GeographicRegionId, label: '🇺🇸 Americas (Peacock / Paramount+)' },
                ].map((reg) => (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => setSelectedRegion(reg.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                      selectedRegion === reg.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {reg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcasters List */}
            <div className="space-y-2">
              {broadcastInfo.regionalBroadcasters.map((channel) => (
                <div
                  key={channel.id}
                  className="p-3 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-foreground">{channel.name}</span>
                      {channel.isFreeToAir ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1 inline" />
                          FREE STREAM / FTA
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          Official Broadcaster
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {channel.channelNumberOrNote} • {channel.regionLabel}
                    </p>
                  </div>

                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shrink-0"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Watch</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>

            {/* Official Free Global Streams Footer */}
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-bold text-emerald-700 dark:text-emerald-400">
                  Official Free Match Streams &amp; Live YouTube Feeds
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Check FIFA+ or official league YouTube channels for free live streams and real-time clips.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={broadcastInfo.fifaPlusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-background text-emerald-600 dark:text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1 hover:bg-emerald-500/10"
                >
                  FIFA+ Stream <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={broadcastInfo.officialYoutubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-[11px] inline-flex items-center gap-1 hover:bg-rose-700"
                >
                  YouTube Live <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VERIFIED VIDEO CLIPS & HIGHLIGHTS */}
        {activeTab === 'video_clips' && (
          <div className="space-y-3">
            {loadingVideos ? (
              <div className="py-8 text-center space-y-2">
                <Sparkles className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground font-semibold">
                  Fetching live video feeds &amp; official match clips...
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {videoItems.map((vid, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{vid.title}</p>
                      <p className="text-[11px] text-muted-foreground">{vid.competition}</p>
                    </div>
                    <a
                      href={vid.matchviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shrink-0"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Open Video</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
