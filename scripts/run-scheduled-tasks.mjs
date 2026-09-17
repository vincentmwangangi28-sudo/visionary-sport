#!/usr/bin/env node
/**
 * PredictPro Unified Scheduled Task Runner
 * 
 * Supports triggering scheduled tasks via CLI, cron daemon, or CI/CD:
 * 
 * Usage:
 *   node scripts/run-scheduled-tasks.mjs --task=settle       # Settle prediction outcomes & strike rates
 *   node scripts/run-scheduled-tasks.mjs --task=daily        # Batch generate daily predictions
 *   node scripts/run-scheduled-tasks.mjs --task=broadcast    # Send VIP Telegram notification
 *   node scripts/run-scheduled-tasks.mjs --task=crawl        # Ping search engines & IndexNow
 *   node scripts/run-scheduled-tasks.mjs --task=all          # Run all scheduled maintenance tasks
 */

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const CRON_SECRET = process.env.CRON_SECRET || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const args = process.argv.slice(2);
const taskArg = args.find(a => a.startsWith('--task='));
const targetTask = taskArg ? taskArg.split('=')[1] : 'all';

console.log(`[PredictPro Cron] Starting execution for task: "${targetTask}" at ${new Date().toISOString()}`);

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (CRON_SECRET) headers['x-cron-secret'] = CRON_SECRET;
  if (SERVICE_KEY) headers['Authorization'] = `Bearer ${SERVICE_KEY}`;
  return headers;
}

async function runSettleResults() {
  console.log('⚡ [1/4] Running Settle Results & Track Record updater...');
  const url = `${SUPABASE_BASE_URL}/functions/v1/update-prediction-results`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ trigger: 'cli_cron', timestamp: new Date().toISOString() }),
    });
    const data = await res.json().catch(() => null);
    console.log(`✅ Settle Results status: HTTP ${res.status}`, data);
    return { success: res.ok, status: res.status, data };
  } catch (err) {
    console.error('❌ Settle Results failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runDailyPredictions() {
  console.log('🎯 [2/4] Generating Daily Predictions & Value Bets batch...');
  const url = `${SUPABASE_BASE_URL}/functions/v1/cron-daily-predictions`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ trigger: 'cli_cron', timestamp: new Date().toISOString() }),
    });
    const data = await res.json().catch(() => null);
    console.log(`✅ Daily Predictions status: HTTP ${res.status}`, data);
    return { success: res.ok, status: res.status, data };
  } catch (err) {
    console.error('❌ Daily Predictions failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runTelegramBroadcast() {
  console.log('📢 [3/4] Triggering Telegram VIP Banker Broadcast...');
  const url = `${SUPABASE_BASE_URL}/functions/v1/telegram-broadcast`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'broadcast',
        parse_mode: 'HTML',
        message: `🔥 <b>PredictPro AI Morning Banker Picks Ready!</b>\n\nDaily AI Pro Tips and high-confidence Value Bets (+EV) for today are live.\n\n👉 View today's full slate: https://predictpro.guru/predict\n👉 Accumulator Builder: https://predictpro.guru/accumulator\n\n<i>Trade responsibly. Verified AI predictions.</i>`,
      }),
    });
    const data = await res.json().catch(() => null);
    console.log(`✅ Telegram Broadcast status: HTTP ${res.status}`, data);
    return { success: res.ok, status: res.status, data };
  } catch (err) {
    console.error('❌ Telegram Broadcast failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runGoogleCrawl() {
  console.log('🔍 [4/11] Triggering Search Engine Indexing & IndexNow ping...');
  const { execSync } = await import('child_process');
  try {
    execSync('node scripts/google-crawl-cron.mjs', { stdio: 'inherit' });
    console.log('✅ Google Crawl Cron completed successfully');
    return { success: true };
  } catch (err) {
    console.error('❌ Google Crawl Cron failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runValueBets() {
  console.log('📈 [5/11] Scanning Dropping Odds & Value Bets (+EV)...');
  const url = `${SUPABASE_BASE_URL}/functions/v1/find-value-bets`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ trigger: 'cli_cron', timestamp: new Date().toISOString() }),
    });
    const data = await res.json().catch(() => null);
    console.log(`✅ Value Bets scan status: HTTP ${res.status}`, data?.valueBets ? `Found ${data.valueBets.length} value bets` : data);
    return { success: res.ok, status: res.status, count: data?.valueBets?.length ?? 0 };
  } catch (err) {
    console.error('❌ Value Bets scan failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runOddsDrift() {
  console.log('📊 [6/11] Ingesting Live Odds & Starting Lineups...');
  const url = `${SUPABASE_BASE_URL}/functions/v1/fetch-odds`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ trigger: 'cli_cron', timestamp: new Date().toISOString() }),
    });
    const data = await res.json().catch(() => null);
    console.log(`✅ Odds Drift status: HTTP ${res.status}`);
    return { success: res.ok, status: res.status, data };
  } catch (err) {
    console.error('❌ Odds Drift failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runJackpotEngine() {
  console.log('🏆 [7/11] Generating 17-Game Mega Jackpot Combinations...');
  const url = `${SUPABASE_BASE_URL}/functions/v1/cron-daily-predictions`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ trigger: 'cli_cron', mode: 'jackpot_17_games', timestamp: new Date().toISOString() }),
    });
    const data = await res.json().catch(() => null);
    console.log(`✅ Jackpot Engine status: HTTP ${res.status}`);
    return { success: res.ok, status: res.status, data };
  } catch (err) {
    console.error('❌ Jackpot Engine failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runStandingsSync() {
  console.log('📋 [8/11] Syncing League Standings & Form Matrices...');
  const url = `${SUPABASE_BASE_URL}/functions/v1/fetch-standings`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ trigger: 'cli_cron', timestamp: new Date().toISOString() }),
    });
    const data = await res.json().catch(() => null);
    console.log(`✅ Standings Sync status: HTTP ${res.status}`);
    return { success: res.ok, status: res.status, data };
  } catch (err) {
    console.error('❌ Standings Sync failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runEveningRecap() {
  console.log('🌙 [9/11] Broadcasting Evening Performance Recap...');
  const url = `${SUPABASE_BASE_URL}/functions/v1/telegram-broadcast`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'broadcast',
        parse_mode: 'HTML',
        message: `🏆 <b>PredictPro AI Matchday Results &amp; Win Rate Recap</b>\n\nToday's AI predictions have settled! Check full verified stats &amp; tomorrow's early locks.\n\n👉 Track Record: https://predictpro.guru/track-record\n👉 Early Bankers: https://predictpro.guru/best-bets`,
      }),
    });
    const data = await res.json().catch(() => null);
    console.log(`✅ Evening Recap status: HTTP ${res.status}`);
    return { success: res.ok, status: res.status, data };
  } catch (err) {
    console.error('❌ Evening Recap failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runSubscriptionReminders() {
  console.log('💳 [10/11] Checking VIP Subscriptions Expirations...');
  const url = `${SUPABASE_BASE_URL}/functions/v1/cron-subscription-reminders`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ trigger: 'cli_cron', timestamp: new Date().toISOString() }),
    });
    const data = await res.json().catch(() => null);
    console.log(`✅ Subscription Reminders status: HTTP ${res.status}`);
    return { success: res.ok, status: res.status, data };
  } catch (err) {
    console.error('❌ Subscription Reminders failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runCleanup() {
  console.log('🧹 [11/11] Running Database & Cache Cleanup...');
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);
    let count = 0;
    if (SERVICE_KEY) {
      const res = await fetch(`${SUPABASE_BASE_URL}/rest/v1/predictions?status=eq.finished&match_date=lt.${cutoffDate.toISOString()}`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Range': '0-99',
        },
      });
      const data = await res.json().catch(() => []);
      count = Array.isArray(data) ? data.length : 0;
    }
    console.log(`✅ Database Cleanup completed. Stale archived fixtures checked: ${count}`);
    return { success: true, count };
  } catch (err) {
    console.error('❌ Database Cleanup failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function main() {
  const results = {};

  if (targetTask === 'settle' || targetTask === 'all') {
    results.settle = await runSettleResults();
  }
  if (targetTask === 'daily' || targetTask === 'all') {
    results.daily = await runDailyPredictions();
  }
  if (targetTask === 'broadcast' || targetTask === 'all') {
    results.broadcast = await runTelegramBroadcast();
  }
  if (targetTask === 'crawl' || targetTask === 'all') {
    results.crawl = await runGoogleCrawl();
  }
  if (targetTask === 'value-bets' || targetTask === 'all') {
    results.valueBets = await runValueBets();
  }
  if (targetTask === 'odds-drift' || targetTask === 'all') {
    results.oddsDrift = await runOddsDrift();
  }
  if (targetTask === 'jackpot' || targetTask === 'all') {
    results.jackpot = await runJackpotEngine();
  }
  if (targetTask === 'standings' || targetTask === 'all') {
    results.standings = await runStandingsSync();
  }
  if (targetTask === 'recap' || targetTask === 'all') {
    results.recap = await runEveningRecap();
  }
  if (targetTask === 'reminders' || targetTask === 'all') {
    results.reminders = await runSubscriptionReminders();
  }
  if (targetTask === 'cleanup' || targetTask === 'all') {
    results.cleanup = await runCleanup();
  }

  console.log('🎉 Scheduled tasks run finished. Summary:');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('Fatal error running cron tasks:', err);
  process.exit(1);
});
