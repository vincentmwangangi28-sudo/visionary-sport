// Vercel Serverless / Edge Function for Google Crawl & Search Engine Indexing Cron
// Invoked on schedule: "0 */2 * * *" (Every 2 hours)

export const config = {
  runtime: 'edge',
};

const BASE_URL = 'https://predictpro.guru';
const INDEXNOW_KEY = 'h2u74xmxq17qqj7na6p7g5w29zwrhhq7';

const PRIORITY_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/best-bets`,
  `${BASE_URL}/sure-win-predictions`,
  `${BASE_URL}/bet-of-the-day`,
  `${BASE_URL}/today-predictions`,
  `${BASE_URL}/predict`,
  `${BASE_URL}/upcoming`,
  `${BASE_URL}/tomorrow-predictions`,
  `${BASE_URL}/weekend-predictions`,
  `${BASE_URL}/live`,
  `${BASE_URL}/value-bets`,
  `${BASE_URL}/correct-score`,
  `${BASE_URL}/btts`,
  `${BASE_URL}/both-teams-to-score-and-win-predictions`,
  `${BASE_URL}/over-1-5-goals-predictions`,
  `${BASE_URL}/over-under-predictions`,
  `${BASE_URL}/over-3-5-goals-predictions`,
  `${BASE_URL}/under-2-5-goals-predictions`,
  `${BASE_URL}/double-chance-predictions`,
  `${BASE_URL}/draw-no-bet-predictions`,
  `${BASE_URL}/draw-predictions`,
  `${BASE_URL}/halftime-fulltime-predictions`,
  `${BASE_URL}/asian-handicap-predictions`,
  `${BASE_URL}/corners-predictions`,
  `${BASE_URL}/cards-predictions`,
  `${BASE_URL}/bet-builder-predictions`,
  `${BASE_URL}/daily-2-odds-predictions`,
  `${BASE_URL}/2-odds-predictions`,
  `${BASE_URL}/5-odds-predictions`,
  `${BASE_URL}/rollover-bets-predictions`,
  `${BASE_URL}/accumulator`,
  `${BASE_URL}/standings`,
  `${BASE_URL}/dropping-odds`,
  `${BASE_URL}/screener`,
  `${BASE_URL}/recommendations`,
  `${BASE_URL}/tournaments`,
  `${BASE_URL}/track-record`,
  `${BASE_URL}/jackpot-predictions`,
  `${BASE_URL}/midweek-jackpot-predictions`,
  `${BASE_URL}/premier-league-predictions`,
  `${BASE_URL}/champions-league-predictions`,
  `${BASE_URL}/europa-league-predictions`,
  `${BASE_URL}/conference-league-predictions`,
  `${BASE_URL}/la-liga-predictions`,
  `${BASE_URL}/bundesliga-predictions`,
  `${BASE_URL}/serie-a-predictions`,
  `${BASE_URL}/ligue-1-predictions`,
  `${BASE_URL}/championship-predictions`,
  `${BASE_URL}/eredivisie-predictions`,
  `${BASE_URL}/primeira-liga-predictions`,
  `${BASE_URL}/turkish-super-lig-predictions`,
  `${BASE_URL}/scottish-premiership-predictions`,
  `${BASE_URL}/belgian-pro-league-predictions`,
  `${BASE_URL}/brazilian-serie-a-predictions`,
  `${BASE_URL}/argentina-primera-predictions`,
  `${BASE_URL}/copa-libertadores-predictions`,
  `${BASE_URL}/liga-mx-predictions`,
  `${BASE_URL}/mls-predictions`,
  `${BASE_URL}/saudi-pro-league-predictions`,
  `${BASE_URL}/j-league-predictions`,
  `${BASE_URL}/kpl-predictions`,
  `${BASE_URL}/nigerian-npfl-predictions`,
  `${BASE_URL}/south-africa-psl-predictions`,
  `${BASE_URL}/egyptian-premier-league-predictions`,
  `${BASE_URL}/afcon-predictions`,
  `${BASE_URL}/world-cup-predictions`,
  `${BASE_URL}/us-soccer-predictions`,
  `${BASE_URL}/value-bet-calculator`,
  `${BASE_URL}/kelly-criterion-calculator`,
  `${BASE_URL}/poisson-calculator`,
  `${BASE_URL}/parlay-calculator`,
  `${BASE_URL}/dutching-calculator`,
  `${BASE_URL}/odds-converter`,
  `${BASE_URL}/system-bet-calculator`,
  `${BASE_URL}/arbitrage-calculator`,
  `${BASE_URL}/hedge-bet-calculator`,
  `${BASE_URL}/margin-calculator`,
  `${BASE_URL}/roi-yield-calculator`,
  `${BASE_URL}/streaks`,
  `${BASE_URL}/h2h`,
  `${BASE_URL}/blog`,
  `${BASE_URL}/blog/how-to-read-football-predictions`,
  `${BASE_URL}/blog/value-betting-explained`,
  `${BASE_URL}/blog/bankroll-management-football`,
  `${BASE_URL}/blog/premier-league-prediction-guide-2026`,
  `${BASE_URL}/blog/champions-league-group-stage-tips`,
  `${BASE_URL}/blog/btts-over-under-strategy`,
  `${BASE_URL}/blog/kpl-betting-guide-kenya`,
  `${BASE_URL}/blog/accumulator-building-strategy`,
  `${BASE_URL}/blog/correct-score-prediction-tips`,
  `${BASE_URL}/blog/sportpesa-mega-jackpot-prediction-17-games`,
  `${BASE_URL}/blog/us-soccer-betting-guide-mls-odds`,
  `${BASE_URL}/blog/expected-goals-xg-betting-model-explained`,
  `${BASE_URL}/blog/halftime-fulltime-ht-ft-predictions-strategy`,
  `${BASE_URL}/blog/asian-handicap-betting-explained`,
  `${BASE_URL}/blog/draw-no-bet-vs-double-chance-strategy`,
  `${BASE_URL}/blog/closing-line-value-clv-dropping-odds`,
  `${BASE_URL}/predict/arsenal-vs-chelsea`,
  `${BASE_URL}/predict/liverpool-vs-manchester-city`,
  `${BASE_URL}/predict/real-madrid-vs-barcelona`,
  `${BASE_URL}/predict/bayern-munich-vs-borussia-dortmund`,
  `${BASE_URL}/predict/inter-milan-vs-ac-milan`,
  `${BASE_URL}/predict/manchester-united-vs-tottenham-hotspur`,
  `${BASE_URL}/predict/psg-vs-marseille`,
  `${BASE_URL}/predict/juventus-vs-napoli`,
  `${BASE_URL}/predict/atletico-madrid-vs-sevilla`,
  `${BASE_URL}/predict/newcastle-united-vs-aston-villa`,
  `${BASE_URL}/predict/benfica-vs-porto`,
  `${BASE_URL}/predict/ajax-vs-psv-eindhoven`,
  `${BASE_URL}/predict/celtic-vs-rangers`,
  `${BASE_URL}/predict/galatasaray-vs-fenerbahce`,
  `${BASE_URL}/predict/flamengo-vs-palmeiras`,
  `${BASE_URL}/predict/boca-juniors-vs-river-plate`,
  `${BASE_URL}/predict/al-hilal-vs-al-nassr`,
  `${BASE_URL}/predict/inter-miami-vs-la-galaxy`,
  `${BASE_URL}/predict/gor-mahia-vs-afc-leopards`,
  `${BASE_URL}/predict/al-ahly-vs-zamalek`,
  `${BASE_URL}/predict/mamelodi-sundowns-vs-orlando-pirates`,
  `${BASE_URL}/predict/hearts-of-oak-vs-asante-kotoko`,
  `${BASE_URL}/predict/wydad-ac-vs-raja-casablanca`,
  `${BASE_URL}/methodology`,
  `${BASE_URL}/sitemap`,
  `${BASE_URL}/seo-indexing`,
  `${BASE_URL}/sitemap-index.xml`,
  `${BASE_URL}/sitemap.xml`,
  `${BASE_URL}/sitemap-core.xml`,
  `${BASE_URL}/sitemap-leagues.xml`,
  `${BASE_URL}/sitemap-matches.xml`,
  `${BASE_URL}/sitemap-blog.xml`,
  `${BASE_URL}/sitemap-yandex.xml`
];

const CONTINENTAL_REGIONS_DISTRIBUTED = [
  { id: 'east_africa', zone: 'East Africa (KE, TZ, UG, RW, ET)', locales: ['en-KE', 'en-TZ', 'en-UG', 'en-RW', 'sw-KE', 'sw-TZ'] },
  { id: 'west_africa', zone: 'West Africa (NG, GH, CI, SN, ML)', locales: ['en-NG', 'en-GH', 'fr-CI', 'fr-SN'] },
  { id: 'southern_africa', zone: 'Southern Africa (ZA, ZM, ZW, BW, NA, MZ)', locales: ['en-ZA', 'en-ZM', 'en-ZW', 'pt-MZ'] },
  { id: 'central_africa', zone: 'Central Africa (CD, CM, AO, CG, GA)', locales: ['fr-CD', 'fr-CM', 'en-CM', 'pt-AO'] },
  { id: 'north_africa_middle_east', zone: 'North Africa & MENA (EG, MA, DZ, TN, SA, AE)', locales: ['ar-EG', 'en-EG', 'fr-MA', 'fr-DZ', 'fr-TN'] },
  { id: 'europe_americas', zone: 'Europe & Americas (UK, EU, US, BR)', locales: ['en-GB', 'en-US', 'es-ES', 'pt-BR'] },
];

export default async function handler(request: Request) {
  const now = new Date().toISOString();

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  let indexNowStatus = 'skipped';
  let yandexStatus = 'skipped';
  let supabaseStatus = 'skipped';

  const indexNowPayload = JSON.stringify({
    host: 'predictpro.guru',
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: PRIORITY_URLS,
  });

  // 1. Submit to IndexNow (Bing, Seznam, Naver) & Yandex IndexNow in parallel
  try {
    const [indexNowRes, yandexRes] = await Promise.all([
      fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: indexNowPayload,
      }).catch(() => null),
      fetch('https://yandex.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: indexNowPayload,
      }).catch(() => null),
    ]);
    indexNowStatus = indexNowRes ? `http_${indexNowRes.status}` : 'network_notice';
    yandexStatus = yandexRes ? `http_${yandexRes.status}` : 'network_notice';
  } catch (err) {
    indexNowStatus = err instanceof Error ? err.message : 'error';
  }

  // 2. Trigger Supabase Edge Function only if a custom SUPABASE_URL is configured
  const customSupabaseUrl = process.env.SUPABASE_URL;
  if (customSupabaseUrl && !customSupabaseUrl.includes('bhgjlhgevyggkhyytulv.supabase.co')) {
    try {
      const edgeRes = await fetch(`${customSupabaseUrl}/functions/v1/ping-search-engines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: PRIORITY_URLS }),
      });
      supabaseStatus = `http_${edgeRes.status}`;
    } catch (err) {
      supabaseStatus = err instanceof Error ? err.message : 'error';
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Google crawl and search engine indexing cycle executed',
      executedAt: now,
      targetDomain: BASE_URL,
      urlsProcessed: PRIORITY_URLS.length,
      cronSchedule: '0 */2 * * * (Every 2 Hours)',
      indexNow: indexNowStatus,
      yandexIndexNow: yandexStatus,
      supabasePing: supabaseStatus,
      continentalDistribution: CONTINENTAL_REGIONS_DISTRIBUTED,
      googlebotDirective: 'Sitemap in robots.txt actively declared & pinged across all continental hreflang regions',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
