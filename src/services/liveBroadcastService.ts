import { GeographicRegionId } from '@/services/geoRegionService';

export interface BroadcasterChannel {
  id: string;
  name: string;
  shortName: string;
  type: 'streaming' | 'tv_satellite' | 'free_to_air' | 'official_youtube';
  isFreeToAir: boolean;
  url: string;
  channelNumberOrNote?: string;
  regionLabel: string;
}

export interface MatchBroadcastInfo {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  isAvailableToWatch: boolean;
  hasFreeStream: boolean;
  primaryBroadcaster: BroadcasterChannel;
  regionalBroadcasters: BroadcasterChannel[];
  officialYoutubeSearchUrl: string;
  fifaPlusUrl: string;
}

export interface LiveVideoHighlightItem {
  title: string;
  competition: string;
  matchviewUrl: string;
  thumbnail: string;
  embedHtml?: string;
  date: string;
}

const REGIONAL_BROADCASTER_MAP: Record<string, Record<string, BroadcasterChannel[]>> = {
  east_africa: {
    'Premier League': [
      {
        id: 'showmax-pl-ea',
        name: 'Showmax Premier League',
        shortName: 'Showmax PL',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://www.showmax.com',
        channelNumberOrNote: 'Mobile & HD Live Stream',
        regionLabel: 'East Africa',
      },
      {
        id: 'supersport-pl-ea',
        name: 'SuperSport Premier League (DStv Stream)',
        shortName: 'SuperSport 203',
        type: 'tv_satellite',
        isFreeToAir: false,
        url: 'https://now.dstv.com',
        channelNumberOrNote: 'DStv Ch. 203 / GOtv Supa+',
        regionLabel: 'East Africa',
      },
      {
        id: 'kbc-fta',
        name: 'KBC Channel 1 / Y254 (Selected Saturday Match)',
        shortName: 'KBC FTA',
        type: 'free_to_air',
        isFreeToAir: true,
        url: 'https://www.kbc.co.ke',
        channelNumberOrNote: 'Free-to-Air Digital TV',
        regionLabel: 'Kenya / East Africa',
      },
    ],
    'FKF Premier League': [
      {
        id: 'azam-kpl',
        name: 'Azam TV / Azam Sports HD (AzamTV Max App)',
        shortName: 'Azam Sports HD',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://azamtvmax.com',
        channelNumberOrNote: 'Official KPL & Ligi Kuu Broadcaster',
        regionLabel: 'Kenya & Tanzania',
      },
      {
        id: 'kbc-kpl',
        name: 'KBC Channel 1 Live Football',
        shortName: 'KBC Channel 1',
        type: 'free_to_air',
        isFreeToAir: true,
        url: 'https://www.kbc.co.ke',
        channelNumberOrNote: 'Free-to-Air Terrestrial',
        regionLabel: 'Kenya',
      },
    ],
    'Tanzania NBC Premier League': [
      {
        id: 'azam-nbc',
        name: 'Azam Sports 1 HD (AzamTV Max)',
        shortName: 'Azam Sports 1 HD',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://azamtvmax.com',
        channelNumberOrNote: 'Azam TV Ch. 105 & Mobile App',
        regionLabel: 'Tanzania & East Africa',
      },
    ],
    'Champions League': [
      {
        id: 'supersport-ucl-ea',
        name: 'SuperSport Grandstand & Variety (DStv Stream)',
        shortName: 'SuperSport UCL',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://now.dstv.com',
        channelNumberOrNote: 'DStv Ch. 201 / 205',
        regionLabel: 'Sub-Saharan Africa',
      },
      {
        id: 'uefa-tv',
        name: 'UEFA.tv Official Match Centre & Clips',
        shortName: 'UEFA.tv',
        type: 'official_youtube',
        isFreeToAir: true,
        url: 'https://www.uefa.tv',
        channelNumberOrNote: 'Free Registration Stream & Extended Highlights',
        regionLabel: 'Global',
      },
    ],
    default: [
      {
        id: 'dstv-stream-ea',
        name: 'SuperSport Football (DStv Stream / GOtv)',
        shortName: 'SuperSport',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://now.dstv.com',
        channelNumberOrNote: 'DStv Ch. 202–207',
        regionLabel: 'Africa',
      },
      {
        id: 'fifaplus-free',
        name: 'FIFA+ Live Domestic & Continental Stream',
        shortName: 'FIFA+ Free',
        type: 'free_to_air',
        isFreeToAir: true,
        url: 'https://www.plus.fifa.com',
        channelNumberOrNote: '100% Free Official Web Stream',
        regionLabel: 'Global Free Stream',
      },
      {
        id: 'caftv-youtube',
        name: 'CAF TV / Official League YouTube Live',
        shortName: 'YouTube Live',
        type: 'official_youtube',
        isFreeToAir: true,
        url: 'https://www.youtube.com/@CAFTV',
        channelNumberOrNote: 'Free Live Stream & In-Play Clips',
        regionLabel: 'Global',
      },
    ],
  },
  uk_ireland: {
    'Premier League': [
      {
        id: 'sky-sports-uk',
        name: 'Sky Sports Main Event / Premier League (NOW TV)',
        shortName: 'Sky Sports PL',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://www.skysports.com/watch',
        channelNumberOrNote: 'Sky Ch. 401 / 402 & NOW App',
        regionLabel: 'UK & Ireland',
      },
      {
        id: 'tnt-sports-uk',
        name: 'TNT Sports 1 / discovery+',
        shortName: 'TNT Sports',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://www.discoveryplus.com/gb',
        channelNumberOrNote: 'discovery+ Live Stream',
        regionLabel: 'UK & Ireland',
      },
    ],
    default: [
      {
        id: 'tnt-uk-def',
        name: 'TNT Sports / discovery+ Football',
        shortName: 'TNT Sports',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://www.discoveryplus.com/gb',
        channelNumberOrNote: 'Live European & Domestic Coverage',
        regionLabel: 'UK & Ireland',
      },
      {
        id: 'bbc-iplayer-uk',
        name: 'BBC iPlayer / ITV X Live Football',
        shortName: 'BBC / ITVX Free',
        type: 'free_to_air',
        isFreeToAir: true,
        url: 'https://www.bbc.co.uk/iplayer',
        channelNumberOrNote: 'Free-to-Air UK Stream',
        regionLabel: 'UK',
      },
    ],
  },
  north_america: {
    'Premier League': [
      {
        id: 'peacock-us',
        name: 'Peacock / NBC Sports Live',
        shortName: 'Peacock',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://www.peacocktv.com/sports/premier-league',
        channelNumberOrNote: 'Live HD Stream & Multiview',
        regionLabel: 'USA',
      },
      {
        id: 'fubo-ca',
        name: 'FuboTV Premier League Stream',
        shortName: 'FuboTV',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://www.fubo.tv',
        channelNumberOrNote: 'USA & Canada Live Stream',
        regionLabel: 'North America',
      },
    ],
    'Champions League': [
      {
        id: 'paramount-us',
        name: 'Paramount+ / CBS Sports Golazo Network',
        shortName: 'Paramount+ / Golazo',
        type: 'streaming',
        isFreeToAir: true,
        url: 'https://www.paramountplus.com/shows/uefa-champions-league/',
        channelNumberOrNote: 'CBS Sports Golazo Free 24/7 Stream',
        regionLabel: 'USA',
      },
    ],
    default: [
      {
        id: 'espn-plus-us',
        name: 'ESPN+ Live Soccer Hub',
        shortName: 'ESPN+',
        type: 'streaming',
        isFreeToAir: false,
        url: 'https://plus.espn.com/soccer',
        channelNumberOrNote: 'La Liga, Bundesliga, FA Cup & EFL',
        regionLabel: 'North America',
      },
      {
        id: 'fifaplus-us',
        name: 'FIFA+ Free Global Match Stream',
        shortName: 'FIFA+ Free',
        type: 'free_to_air',
        isFreeToAir: true,
        url: 'https://www.plus.fifa.com',
        channelNumberOrNote: 'Free Live Stream',
        regionLabel: 'Global',
      },
    ],
  },
};

export function getMatchBroadcastInfo(params: {
  matchId?: string | number | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  league?: string | null;
  regionId?: GeographicRegionId;
}): MatchBroadcastInfo {
  const matchId = String(params?.matchId ?? 'live-match');
  const homeTeam = String(params?.homeTeam ?? 'Home Club');
  const awayTeam = String(params?.awayTeam ?? 'Away Club');
  const league = String(params?.league ?? 'Football Competition');
  const regionId = params?.regionId ?? 'east_africa';

  const bucketKey =
    regionId === 'uk_ireland'
      ? 'uk_ireland'
      : regionId === 'north_america' || regionId === 'latin_america'
      ? 'north_america'
      : 'east_africa';

  const regionCatalog = REGIONAL_BROADCASTER_MAP[bucketKey] || REGIONAL_BROADCASTER_MAP.east_africa;

  let matchedChannels: BroadcasterChannel[] | undefined;
  const sortedEntries = Object.entries(regionCatalog).sort((a, b) => b[0].length - a[0].length);
  const leagueLower = league.toLowerCase();
  for (const [leagueKey, channels] of sortedEntries) {
    if (leagueKey !== 'default' && leagueLower.includes(leagueKey.toLowerCase())) {
      matchedChannels = channels;
      break;
    }
  }

  const regionalBroadcasters = matchedChannels || regionCatalog.default;
  const primaryBroadcaster = regionalBroadcasters[0];
  const hasFreeStream = regionalBroadcasters.some((b) => b.isFreeToAir);

  const searchQuery = encodeURIComponent(`${homeTeam} vs ${awayTeam} ${league} live stream highlights`);
  const officialYoutubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
  const fifaPlusUrl = 'https://www.plus.fifa.com';

  return {
    matchId,
    homeTeam,
    awayTeam,
    league,
    isAvailableToWatch: true,
    hasFreeStream,
    primaryBroadcaster,
    regionalBroadcasters,
    officialYoutubeSearchUrl,
    fifaPlusUrl,
  };
}

/**
 * Fetches verified live football video clips and highlights from ScoreBat's free public video API
 * with an instant deterministic fallback if offline or rate-limited.
 */
export async function fetchLiveVideoHighlights(
  homeTeam?: string,
  awayTeam?: string,
  league?: string
): Promise<LiveVideoHighlightItem[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://www.scorebat.com/video-api/v3/', {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const responseItems: Array<{
        title?: string;
        competition?: string;
        matchviewUrl?: string;
        thumbnail?: string;
        date?: string;
        videos?: Array<{ embed?: string }>;
      }> = Array.isArray(json?.response) ? json.response : [];

      if (responseItems.length > 0) {
        const qHome = (homeTeam || '').toLowerCase();
        const qAway = (awayTeam || '').toLowerCase();
        const qLeague = (league || '').toLowerCase();

        const filtered = responseItems.filter((item) => {
          const t = (item.title || '').toLowerCase();
          const c = (item.competition || '').toLowerCase();
          return (
            (qHome && t.includes(qHome)) ||
            (qAway && t.includes(qAway)) ||
            (qLeague && c.includes(qLeague))
          );
        });

        const listToUse = filtered.length > 0 ? filtered.slice(0, 4) : responseItems.slice(0, 4);
        return listToUse.map((item) => ({
          title: item.title || `${homeTeam || 'Featured'} vs ${awayTeam || 'Match'}`,
          competition: item.competition || league || 'Official Match Feed',
          matchviewUrl:
            item.matchviewUrl ||
            `https://www.youtube.com/results?search_query=${encodeURIComponent(
              `${homeTeam || ''} vs ${awayTeam || ''} highlights`
            )}`,
          thumbnail: item.thumbnail || '',
          embedHtml: item.videos?.[0]?.embed,
          date: item.date || new Date().toISOString(),
        }));
      }
    }
  } catch {
    // Fallback to curated official links below
  }

  const label = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : 'Live Football Matchday';
  const query = encodeURIComponent(`${label} ${league || ''} official live highlights`);
  return [
    {
      title: `${label} — Official Live Match Centre & Extended Highlights`,
      competition: league || 'International Broadcast Feed',
      matchviewUrl: `https://www.youtube.com/results?search_query=${query}`,
      thumbnail: '',
      date: new Date().toISOString(),
    },
    {
      title: `${league || 'Top Flight'} — FIFA+ & Official Broadcaster Stream Directory`,
      competition: league || 'Global Stream Network',
      matchviewUrl: 'https://www.plus.fifa.com',
      thumbnail: '',
      date: new Date().toISOString(),
    },
  ];
}
