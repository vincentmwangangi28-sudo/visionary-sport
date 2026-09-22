// Vercel Edge Middleware
// 1. Injects pp_country cookie for geo-based pricing on first paint (existing)
// 2. Injects per-route canonical Link header so Google indexes each page
//    individually instead of treating every URL as a duplicate of /
// Docs: https://vercel.com/docs/functions/edge-middleware
import { next } from '@vercel/edge';

export const config = {
  matcher: ['/((?!_vercel|api|.*\\.[\\w]+$).*)'],
};

// Canonical URL for every known route.
// For unknown routes (blog/:slug, etc.) the fallback uses the request path
// itself — always better than the old static index.html pointing everything at /.
const CANONICAL: Record<string, string> = {
  '/':                             'https://predictpro.guru/',
  '/premier-league-predictions':   'https://predictpro.guru/premier-league-predictions',
  '/champions-league-predictions': 'https://predictpro.guru/champions-league-predictions',
  '/la-liga-predictions':          'https://predictpro.guru/la-liga-predictions',
  '/bundesliga-predictions':       'https://predictpro.guru/bundesliga-predictions',
  '/serie-a-predictions':          'https://predictpro.guru/serie-a-predictions',
  '/ligue-1-predictions':          'https://predictpro.guru/ligue-1-predictions',
  '/kpl-predictions':              'https://predictpro.guru/kpl-predictions',
  '/jackpot-predictions':          'https://predictpro.guru/jackpot-predictions',
  '/us-soccer-predictions':        'https://predictpro.guru/us-soccer-predictions',
  '/btts':                         'https://predictpro.guru/btts',
  '/correct-score':                'https://predictpro.guru/correct-score',
  '/value-bets':                   'https://predictpro.guru/value-bets',
  '/live-scores':                  'https://predictpro.guru/live-scores',
  '/standings':                    'https://predictpro.guru/standings',
  '/upcoming':                     'https://predictpro.guru/upcoming',
  '/recommendations':              'https://predictpro.guru/recommendations',
  '/blog':                         'https://predictpro.guru/blog',
  '/pricing':                      'https://predictpro.guru/pricing',
  '/about':                        'https://predictpro.guru/about',
  '/sitemap':                      'https://predictpro.guru/sitemap',
};

export default function middleware(request: Request) {
  const url     = new URL(request.url);
  const path    = url.pathname.replace(/\/$/, '') || '/';
  const country = request.headers.get('x-vercel-ip-country') || 'US';

  const response = next();

  // Geo cookie — used by PaystackCheckoutButton for regional pricing
  response.headers.append(
    'Set-Cookie',
    `pp_country=${country}; Path=/; Max-Age=86400; SameSite=Lax`,
  );

  // Canonical Link header — Google treats this identically to <link rel="canonical">.
  // Fixes the root cause of zero Google indexation: every route was resolving to /.
  const canonical = CANONICAL[path] ?? `https://predictpro.guru${path}`;
  response.headers.set('Link', `<${canonical}>; rel="canonical"`);

  return response;
}
