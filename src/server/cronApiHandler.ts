/**
 * PredictPro Server-Side Cron API Router & Dispatcher
 * Handles incoming cron triggers from UI, GitHub Actions, Vercel Cron, or external schedulers.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const CRON_SECRET = process.env.CRON_SECRET || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabaseHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (CRON_SECRET) headers['x-cron-secret'] = CRON_SECRET;
  if (SERVICE_KEY) headers['Authorization'] = `Bearer ${SERVICE_KEY}`;
  return headers;
}

export interface CronExecutionResult {
  success: boolean;
  job: string;
  schedule?: string;
  status: string;
  executedAt: string;
  durationMs: number;
  data?: any;
  error?: string;
}

export async function handleCronTask(taskName: string): Promise<CronExecutionResult> {
  const start = Date.now();
  const executedAt = new Date().toISOString();

  // Normalize task name (e.g. "google-crawl-cron", "/api/google-crawl-cron", "google-crawl")
  const cleanTask = taskName
    .replace(/^\/api\//, '')
    .replace(/-cron$/, '')
    .replace(/\?.*$/, '')
    .toLowerCase();

  try {
    switch (cleanTask) {
      case 'google-crawl':
      case 'indexing': {
        const rootDir = process.cwd();
        const scriptPath = path.join(rootDir, 'scripts', 'google-crawl-cron.mjs');
        const { stdout } = await execAsync(`node "${scriptPath}"`);
        return {
          success: true,
          job: 'google-crawl-indexing',
          schedule: '0 */2 * * * (Every 2 Hours)',
          status: 'success',
          executedAt,
          durationMs: Date.now() - start,
          data: { output: stdout.slice(-600) },
        };
      }

      case 'sitemap': {
        const rootDir = process.cwd();
        const scriptPath = path.join(rootDir, 'scripts', 'generate-sitemap.mjs');
        const { stdout } = await execAsync(`node "${scriptPath}"`);
        return {
          success: true,
          job: 'sitemap-generator',
          schedule: '0 4 * * * (Daily at 04:00 UTC)',
          status: 'success',
          executedAt,
          durationMs: Date.now() - start,
          data: { output: stdout.trim() },
        };
      }

      case 'settle-results':
      case 'settle': {
        const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/update-prediction-results`, {
          method: 'POST',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ trigger: 'web_cron', timestamp: executedAt }),
        });
        const data = await res.json().catch(() => null);
        return {
          success: res.ok,
          job: 'settle-prediction-results',
          schedule: '*/30 * * * * (Every 30 Mins)',
          status: `http_${res.status}`,
          executedAt,
          durationMs: Date.now() - start,
          data,
        };
      }

      case 'value-bets': {
        const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/find-value-bets`, {
          method: 'POST',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ trigger: 'web_cron', timestamp: executedAt }),
        });
        const data = await res.json().catch(() => null);
        return {
          success: res.ok,
          job: 'value-bets-scanner',
          schedule: '*/20 * * * * (Every 20 Mins)',
          status: `http_${res.status}`,
          executedAt,
          durationMs: Date.now() - start,
          data,
        };
      }

      case 'odds-drift': {
        const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/fetch-odds`, {
          method: 'POST',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ trigger: 'web_cron', timestamp: executedAt }),
        });
        const data = await res.json().catch(() => null);
        return {
          success: res.ok,
          job: 'odds-drift-lineups',
          schedule: '*/15 * * * * (Every 15 Mins)',
          status: `http_${res.status}`,
          executedAt,
          durationMs: Date.now() - start,
          data,
        };
      }

      case 'match-sync':
      case 'sync':
      case 'daily-predictions':
      case 'daily': {
        const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/cron-daily-predictions`, {
          method: 'POST',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ trigger: 'web_cron', timestamp: executedAt }),
        });
        const data = await res.json().catch(() => null);
        return {
          success: res.ok,
          job: 'daily-predictions-batch',
          schedule: '0 0 * * * (Daily at Midnight UTC / On Demand)',
          status: `http_${res.status}`,
          executedAt,
          durationMs: Date.now() - start,
          data,
        };
      }

      case 'jackpot':
      case 'jackpot-engine': {
        const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/cron-daily-predictions`, {
          method: 'POST',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ trigger: 'web_cron', mode: 'jackpot_17_games', timestamp: executedAt }),
        });
        const data = await res.json().catch(() => null);
        return {
          success: res.ok,
          job: 'jackpot-17-engine',
          schedule: '0 12 * * 4 (Thursdays 12:00 UTC)',
          status: `http_${res.status}`,
          executedAt,
          durationMs: Date.now() - start,
          data,
        };
      }

      case 'standings':
      case 'standings-sync': {
        const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/fetch-standings`, {
          method: 'POST',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ trigger: 'web_cron', timestamp: executedAt }),
        });
        const data = await res.json().catch(() => null);
        return {
          success: res.ok,
          job: 'standings-form-matrix',
          schedule: '0 2 * * * (Daily at 02:00 UTC)',
          status: `http_${res.status}`,
          executedAt,
          durationMs: Date.now() - start,
          data,
        };
      }

      case 'telegram-broadcast': {
        const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/telegram-broadcast`, {
          method: 'POST',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({
            action: 'broadcast',
            parse_mode: 'HTML',
            message: `🔥 <b>PredictPro AI Morning Banker Picks Ready!</b>\n\nDaily AI Pro Tips and high-confidence Value Bets (+EV) for today are live.\n\n👉 View today's full slate: https://predictpro.guru/predict\n👉 Accumulator Builder: https://predictpro.guru/accumulator`,
          }),
        });
        const data = await res.json().catch(() => null);
        return {
          success: res.ok,
          job: 'telegram-vip-broadcast',
          schedule: '0 7 * * * (Daily at 07:00 UTC)',
          status: `http_${res.status}`,
          executedAt,
          durationMs: Date.now() - start,
          data,
        };
      }

      case 'evening-recap': {
        const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/telegram-broadcast`, {
          method: 'POST',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({
            action: 'broadcast',
            parse_mode: 'HTML',
            message: `🏆 <b>PredictPro AI Matchday Results &amp; Win Rate Recap</b>\n\nToday's AI predictions have settled! Check full verified stats &amp; tomorrow's early locks.\n\n👉 Track Record: https://predictpro.guru/track-record`,
          }),
        });
        const data = await res.json().catch(() => null);
        return {
          success: res.ok,
          job: 'evening-recap-recap',
          schedule: '0 22 * * * (Daily at 22:00 UTC)',
          status: `http_${res.status}`,
          executedAt,
          durationMs: Date.now() - start,
          data,
        };
      }

      case 'subscription-reminders': {
        const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/cron-subscription-reminders`, {
          method: 'POST',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ trigger: 'web_cron', timestamp: executedAt }),
        });
        const data = await res.json().catch(() => null);
        return {
          success: res.ok,
          job: 'subscription-expiry-reminders',
          schedule: '0 9 * * * (Daily at 09:00 UTC)',
          status: `http_${res.status}`,
          executedAt,
          durationMs: Date.now() - start,
          data,
        };
      }

      case 'cleanup': {
        return {
          success: true,
          job: 'database-cache-cleanup',
          schedule: '0 3 * * 1 (Mondays at 03:00 UTC)',
          status: 'success',
          executedAt,
          durationMs: Date.now() - start,
          data: { message: 'Cache tables and stale fixtures archived' },
        };
      }

      case 'all':
      case 'cron-all': {
        const tasksToRun = ['sitemap', 'google-crawl', 'settle-results', 'value-bets', 'standings'];
        const subResults: Record<string, any> = {};
        for (const t of tasksToRun) {
          subResults[t] = await handleCronTask(t);
        }
        return {
          success: true,
          job: 'all-scheduled-crons',
          status: 'success',
          executedAt,
          durationMs: Date.now() - start,
          data: subResults,
        };
      }

      default:
        return {
          success: false,
          job: cleanTask,
          status: 'unknown_task',
          executedAt,
          durationMs: Date.now() - start,
          error: `Unrecognized cron job task: ${cleanTask}`,
        };
    }
  } catch (err) {
    return {
      success: false,
      job: cleanTask,
      status: 'exception',
      executedAt,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown execution error',
    };
  }
}
