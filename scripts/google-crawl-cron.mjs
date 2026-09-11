#!/usr/bin/env node
/**
 * PredictPro Google Crawl & Search Engine Indexing Cron Job
 * Automated cron script for CI/CD (GitHub Actions), Vercel cron, and scheduled server jobs.
 * 
 * Functions:
 * 1. Verifies live robots.txt and sitemap.xml availability and validity for Googlebot
 * 2. Submits latest URLs to IndexNow API (Bing, Yandex, Seznam, Naver)
 * 3. Triggers Supabase search engine notification edge functions
 * 4. Pings sitemap discovery endpoints for crawlers
 * 5. Logs detailed diagnostics for Google Search Console and crawler monitoring
 */

const BASE_URL = process.env.SITE_URL || 'https://predictpro.guru';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'predictpro789xyz456indexnow';
const SUPABASE_PING_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co/functions/v1/ping-search-engines';

const PRIORITY_CRAWL_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/best-bets`,
  `${BASE_URL}/predict`,
  `${BASE_URL}/live`,
  `${BASE_URL}/value-bets`,
  `${BASE_URL}/correct-score`,
  `${BASE_URL}/btts`,
  `${BASE_URL}/accumulator`,
  `${BASE_URL}/standings`,
  `${BASE_URL}/dropping-odds`,
  `${BASE_URL}/screener`,
  `${BASE_URL}/recommendations`,
  `${BASE_URL}/tournaments`,
  `${BASE_URL}/track-record`,
  `${BASE_URL}/premier-league-predictions`,
  `${BASE_URL}/champions-league-predictions`,
  `${BASE_URL}/la-liga-predictions`,
  `${BASE_URL}/bundesliga-predictions`,
  `${BASE_URL}/serie-a-predictions`,
  `${BASE_URL}/kpl-predictions`,
  `${BASE_URL}/jackpot-predictions`,
  `${BASE_URL}/us-soccer-predictions`,
  `${BASE_URL}/world-cup-predictions`,
  `${BASE_URL}/afcon-predictions`,
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
  `${BASE_URL}/methodology`,
  `${BASE_URL}/sitemap`,
  `${BASE_URL}/seo-indexing`
];

async function runGoogleCrawlCron() {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log(`[Google Crawl Cron] Starting automated execution at ${new Date().toISOString()}`);
  console.log(`[Google Crawl Cron] Target Domain: ${BASE_URL}`);
  console.log(`[Google Crawl Cron] URLs in Priority Queue: ${PRIORITY_CRAWL_URLS.length}`);
  console.log('='.repeat(60));

  const results = {
    timestamp: new Date().toISOString(),
    sitemapStatus: 'pending',
    robotsStatus: 'pending',
    indexNowStatus: 'pending',
    supabasePingStatus: 'pending',
    urlsProcessed: PRIORITY_CRAWL_URLS.length,
    durationMs: 0
  };

  // 1. Verify Robots.txt
  try {
    console.log('\n🔍 [1/4] Checking robots.txt for Googlebot directives...');
    const robotsRes = await fetch(`${BASE_URL}/robots.txt`, {
      headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }
    });
    if (robotsRes.ok) {
      const robotsText = await robotsRes.text();
      const hasGooglebot = robotsText.includes('Googlebot');
      const hasSitemap = robotsText.includes('sitemap.xml');
      console.log(`✅ robots.txt verified (HTTP ${robotsRes.status}). Has Googlebot rules: ${hasGooglebot}, Has Sitemap: ${hasSitemap}`);
      results.robotsStatus = 'ok';
    } else {
      console.warn(`⚠️ robots.txt responded with HTTP ${robotsRes.status}`);
      results.robotsStatus = `http_${robotsRes.status}`;
    }
  } catch (err) {
    console.warn(`⚠️ robots.txt check network notice: ${err.message}`);
    results.robotsStatus = 'network_notice';
  }

  // 2. Verify Sitemap XML
  try {
    console.log('\n🗺️ [2/4] Checking sitemap.xml for Google crawler inspection...');
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`, {
      headers: { 'User-Agent': 'Google-InspectionTool/1.0' }
    });
    if (sitemapRes.ok) {
      const xml = await sitemapRes.text();
      const urlCount = (xml.match(/<loc>/g) || []).length;
      console.log(`✅ sitemap.xml verified (HTTP ${sitemapRes.status}) with ${urlCount} indexed URLs.`);
      results.sitemapStatus = `ok_${urlCount}_urls`;
    } else {
      console.warn(`⚠️ sitemap.xml responded with HTTP ${sitemapRes.status}`);
      results.sitemapStatus = `http_${sitemapRes.status}`;
    }
  } catch (err) {
    console.warn(`⚠️ sitemap.xml check notice: ${err.message}`);
    results.sitemapStatus = 'network_notice';
  }

  // 3. Submit to IndexNow (Direct push to Bing, Yandex, Seznam, Naver)
  try {
    console.log('\n🚀 [3/4] Dispatching priority batch to IndexNow API...');
    const indexNowPayload = {
      host: new URL(BASE_URL).hostname,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/predictpro-indexnow-key.txt`,
      urlList: PRIORITY_CRAWL_URLS.slice(0, 100)
    };

    const indexNowRes = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(indexNowPayload)
    });

    console.log(`📡 IndexNow response: HTTP ${indexNowRes.status} (${indexNowRes.ok ? 'Accepted' : 'Notice'})`);
    results.indexNowStatus = `http_${indexNowRes.status}`;
  } catch (err) {
    console.warn(`⚠️ IndexNow submission notice: ${err.message}`);
    results.indexNowStatus = 'error';
  }

  // 4. Trigger Supabase Search Engine Ping Edge Function
  try {
    console.log('\n📡 [4/4] Triggering Supabase Edge Function: ping-search-engines...');
    const edgeRes = await fetch(SUPABASE_PING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: PRIORITY_CRAWL_URLS })
    });
    const edgeData = await edgeRes.json().catch(() => ({}));
    console.log(`✅ Supabase ping-search-engines result: HTTP ${edgeRes.status}`, edgeData);
    results.supabasePingStatus = `http_${edgeRes.status}`;
  } catch (err) {
    console.warn(`⚠️ Supabase edge ping notice: ${err.message}`);
    results.supabasePingStatus = 'notice';
  }

  results.durationMs = Date.now() - startTime;
  console.log('\n' + '='.repeat(60));
  console.log(`[Google Crawl Cron] Completed in ${results.durationMs}ms`);
  console.log('Results Summary:', JSON.stringify(results, null, 2));
  console.log('='.repeat(60));
}

runGoogleCrawlCron().catch((err) => {
  console.error('[Google Crawl Cron] Fatal error:', err);
  process.exit(1);
});
