/**
 * Cloudflare Pages Function - Universal API Router for /api/*
 * Handles incoming API requests and routes them to native serverless handlers.
 * Compatible with Cloudflare Workers / Pages Functions runtime.
 */

import footballHandler from '../../api/football';
import healthHandler from '../../api/health';
import geminiTasksHandler from '../../api/gemini-tasks';
import ahrefsHandler from '../../api/ahrefs-analytics';
import pagespeedHandler from '../../api/pagespeed-insights';
import ogHandler from '../../api/og';
import mcpHandler from '../../api/mcp';
import telegramBroadcastHandler from '../../api/telegram-broadcast';
import jackpotsHandler from '../../api/jackpots';
import keepaliveHandler from '../../api/keepalive';
import markdownHandler from '../../api/markdown';
import dailyPredictionsCronHandler from '../../api/daily-predictions-cron';
import liveMomentumCronHandler from '../../api/live-momentum-cron';
import oddsDriftCronHandler from '../../api/odds-drift-cron';
import settleResultsCronHandler from '../../api/settle-results-cron';
import indexingCronHandler from '../../api/indexing-cron';
import bookingCodesCronHandler from '../../api/booking-codes-cron';
import cleanupCronHandler from '../../api/cleanup-cron';
import eveningRecapCronHandler from '../../api/evening-recap-cron';
import googleCrawlCronHandler from '../../api/google-crawl-cron';
import jackpotCronHandler from '../../api/jackpot-cron';
import refereePropsCronHandler from '../../api/referee-props-cron';
import sitemapCronHandler from '../../api/sitemap-cron';
import standingsCronHandler from '../../api/standings-cron';
import subscriptionRemindersCronHandler from '../../api/subscription-reminders-cron';
import valueBetsCronHandler from '../../api/value-bets-cron';

type ApiHandler = (request: Request) => Promise<Response>;

const ROUTE_MAP: Record<string, ApiHandler> = {
  'football': footballHandler,
  'highlights': footballHandler,
  'health': healthHandler,
  'status': healthHandler,
  'gemini-tasks': geminiTasksHandler,
  'ahrefs-analytics': ahrefsHandler,
  'pagespeed-insights': pagespeedHandler,
  'og': ogHandler,
  'mcp': mcpHandler,
  'a2a': mcpHandler,
  'telegram-broadcast': telegramBroadcastHandler,
  'telegram-config': telegramBroadcastHandler,
  'jackpots': jackpotsHandler,
  'keepalive': keepaliveHandler,
  'markdown': markdownHandler,
  'daily-predictions-cron': dailyPredictionsCronHandler,
  'live-momentum-cron': liveMomentumCronHandler,
  'odds-drift-cron': oddsDriftCronHandler,
  'settle-results-cron': settleResultsCronHandler,
  'indexing-cron': indexingCronHandler,
  'ping-search-engines': indexingCronHandler,
  'booking-codes-cron': bookingCodesCronHandler,
  'cleanup-cron': cleanupCronHandler,
  'evening-recap-cron': eveningRecapCronHandler,
  'google-crawl-cron': googleCrawlCronHandler,
  'jackpot-cron': jackpotCronHandler,
  'referee-props-cron': refereePropsCronHandler,
  'sitemap-cron': sitemapCronHandler,
  'standings-cron': standingsCronHandler,
  'subscription-reminders-cron': subscriptionRemindersCronHandler,
  'value-bets-cron': valueBetsCronHandler,
};

export async function onRequest(context: {
  request: Request;
  env?: Record<string, any>;
  params?: Record<string, string | string[]>;
}): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);

  // Extract path segment after /api/
  const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const routeKey = segments[0] || '';

  const handler = ROUTE_MAP[routeKey];
  if (!handler) {
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: `API route /api/${routeKey} not found`,
        status: 404,
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    return await handler(request);
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: err?.message || 'Error processing API request',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
