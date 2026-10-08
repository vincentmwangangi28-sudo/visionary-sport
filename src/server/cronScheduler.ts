/**
 * PredictPro Autonomous Server-Side Cron Scheduler & Orchestrator
 *
 * Runs continuously in the background of the Node.js / dev server process.
 * Provides self-healing, crash-resistant execution of all automated pipelines:
 * - Telegram VIP Banker & Result Recap Broadcasts
 * - Match Settlements & Outcome Verifications
 * - +EV Value Bets & Odds Drift Scans
 * - SportPesa/Betika 17-Game Mega Jackpot Sync
 * - Dynamic Sitemap & Search Engine IndexNow Pings
 */

import fs from 'fs';
import path from 'path';
import { handleCronTask } from './cronApiHandler';

export interface ScheduledJobConfig {
  id: string;
  name: string;
  category: 'Settlement' | 'Predictions' | 'Marketing' | 'SEO' | 'System';
  intervalMs: number; // in milliseconds
  scheduleDisplay: string;
  targetUtcHour?: number; // for daily jobs (0-23)
  targetUtcMinute?: number; // for daily jobs (0-59)
  enabled: boolean;
}

export interface ScheduledJobRuntimeState {
  id: string;
  lastRun: string | null;
  lastDurationMs: number;
  lastStatus: 'idle' | 'running' | 'success' | 'error';
  lastError: string | null;
  nextRun: string;
  runCount: number;
  failCount: number;
  startedRunningAt?: string | null;
  lastActivityAt?: string | null;
  reinitializedCount?: number;
  lastReinitializedAt?: string | null;
}

export interface StalledTaskRecoveryDetail {
  id: string;
  name: string;
  reason: string;
  previousStatus: string;
  actionTaken: string;
  newNextRun: string;
  inactivityMinutes: number;
}

export interface HealthCheckResult {
  timestamp: string;
  thresholdMinutes: number;
  stalledCount: number;
  reinitializedTasks: StalledTaskRecoveryDetail[];
  healthyCount: number;
  status: 'healthy' | 'recovered_stalled_tasks';
}

export interface SchedulerAuditLog {
  id: string;
  jobId: string;
  timestamp: string;
  durationMs: number;
  status: string;
  success: boolean;
  error?: string;
}

const STATE_FILE_PATH = path.join(process.cwd(), '.data', 'cron-scheduler-state.json');

const JOB_DEFINITIONS: ScheduledJobConfig[] = [
  {
    id: 'settle-results',
    name: 'Prediction Results Settlement',
    category: 'Settlement',
    intervalMs: 30 * 60 * 1000, // 30 mins
    scheduleDisplay: '*/30 * * * * (Every 30 Mins)',
    enabled: true,
  },
  {
    id: 'value-bets',
    name: 'Value Bets (+EV) Scanner',
    category: 'Predictions',
    intervalMs: 20 * 60 * 1000, // 20 mins
    scheduleDisplay: '*/20 * * * * (Every 20 Mins)',
    enabled: true,
  },
  {
    id: 'odds-drift',
    name: 'Starting Lineups & Odds Drift',
    category: 'Predictions',
    intervalMs: 15 * 60 * 1000, // 15 mins
    scheduleDisplay: '*/15 * * * * (Every 15 Mins)',
    enabled: true,
  },
  {
    id: 'jackpot',
    name: 'SportPesa & Betika Direct Jackpot Sync',
    category: 'Predictions',
    intervalMs: 30 * 60 * 1000, // 30 mins
    scheduleDisplay: '*/30 * * * * (Every 30 Mins)',
    enabled: true,
  },
  {
    id: 'daily-predictions',
    name: 'Daily Predictions Batch Engine',
    category: 'Predictions',
    intervalMs: 24 * 60 * 60 * 1000,
    targetUtcHour: 4,
    targetUtcMinute: 0,
    scheduleDisplay: '0 4 * * * (Daily at 04:00 UTC)',
    enabled: true,
  },
  {
    id: 'telegram-broadcast',
    name: 'Morning VIP Telegram Banker Broadcast',
    category: 'Marketing',
    intervalMs: 24 * 60 * 60 * 1000,
    targetUtcHour: 7,
    targetUtcMinute: 0,
    scheduleDisplay: '0 7 * * * (Daily at 07:00 UTC)',
    enabled: true,
  },
  {
    id: 'evening-recap',
    name: 'Evening Results & Strike Rate Recap',
    category: 'Marketing',
    intervalMs: 24 * 60 * 60 * 1000,
    targetUtcHour: 22,
    targetUtcMinute: 0,
    scheduleDisplay: '0 22 * * * (Daily at 22:00 UTC)',
    enabled: true,
  },
  {
    id: 'standings',
    name: 'League Standings & Form Matrix',
    category: 'System',
    intervalMs: 24 * 60 * 60 * 1000,
    targetUtcHour: 2,
    targetUtcMinute: 0,
    scheduleDisplay: '0 2 * * * (Daily at 02:00 UTC)',
    enabled: true,
  },
  {
    id: 'subscription-reminders',
    name: 'VIP Subscription Expiry Radar',
    category: 'Marketing',
    intervalMs: 24 * 60 * 60 * 1000,
    targetUtcHour: 9,
    targetUtcMinute: 0,
    scheduleDisplay: '0 9 * * * (Daily at 09:00 UTC)',
    enabled: true,
  },
  {
    id: 'google-crawl',
    name: 'Search Engine Indexing & IndexNow',
    category: 'SEO',
    intervalMs: 4 * 60 * 60 * 1000, // 4 hours
    scheduleDisplay: '0 */4 * * * (Every 4 Hours)',
    enabled: true,
  },
  {
    id: 'sitemap',
    name: 'Dynamic XML Sitemap Generator',
    category: 'SEO',
    intervalMs: 24 * 60 * 60 * 1000,
    targetUtcHour: 3,
    targetUtcMinute: 0,
    scheduleDisplay: '0 3 * * * (Daily at 03:00 UTC)',
    enabled: true,
  },
  {
    id: 'cleanup',
    name: 'Database Cache & Stale Fixture Purge',
    category: 'System',
    intervalMs: 7 * 24 * 60 * 60 * 1000, // weekly
    scheduleDisplay: '0 3 * * 1 (Weekly)',
    enabled: true,
  },
];

class AutonomousCronScheduler {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private keepaliveTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private startedAt: string | null = null;
  private states = new Map<string, ScheduledJobRuntimeState>();
  private auditLogs: SchedulerAuditLog[] = [];
  private executingJobs = new Set<string>();
  private keepalivePings = 0;
  private lastKeepaliveAt: string | null = null;
  private lastKeepaliveStatus = 'initialized';
  private lastHealthCheck: HealthCheckResult | null = null;
  private tickCount = 0;

  constructor() {
    this.initStates();
    this.loadPersistedState();
    this.setupProcessResilience();
  }

  private setupProcessResilience() {
    // Keep process alive and capture unhandled task rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.warn('[AutonomousCronScheduler] Caught unhandled rejection in background task:', reason);
    });
  }

  private ensureDataDir() {
    try {
      const dir = path.dirname(STATE_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {}
  }

  private calculateInitialNextRun(config: ScheduledJobConfig): string {
    const now = new Date();

    if (config.targetUtcHour !== undefined) {
      const next = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        config.targetUtcHour,
        config.targetUtcMinute || 0,
        0
      ));
      if (next.getTime() <= now.getTime()) {
        next.setUTCDate(next.getUTCDate() + 1);
      }
      return next.toISOString();
    }

    return new Date(now.getTime() + config.intervalMs).toISOString();
  }

  private initStates() {
    for (const def of JOB_DEFINITIONS) {
      this.states.set(def.id, {
        id: def.id,
        lastRun: null,
        lastDurationMs: 0,
        lastStatus: 'idle',
        lastError: null,
        nextRun: this.calculateInitialNextRun(def),
        runCount: 0,
        failCount: 0,
        startedRunningAt: null,
        lastActivityAt: null,
        reinitializedCount: 0,
        lastReinitializedAt: null,
      });
    }
  }

  private loadPersistedState() {
    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (data.states && Array.isArray(data.states)) {
          for (const s of data.states) {
            const current = this.states.get(s.id);
            if (current) {
              this.states.set(s.id, {
                ...current,
                lastRun: s.lastRun || null,
                lastDurationMs: s.lastDurationMs || 0,
                lastStatus: s.lastStatus === 'running' ? 'idle' : s.lastStatus || 'idle',
                lastError: s.lastError || null,
                nextRun: s.nextRun || current.nextRun,
                runCount: s.runCount || 0,
                failCount: s.failCount || 0,
                startedRunningAt: null, // Clear running lock on reload to prevent artificial stalls
                lastActivityAt: s.lastActivityAt || s.lastRun || null,
                reinitializedCount: s.reinitializedCount || 0,
                lastReinitializedAt: s.lastReinitializedAt || null,
              });
            }
          }
        }
        if (data.auditLogs && Array.isArray(data.auditLogs)) {
          this.auditLogs = data.auditLogs.slice(0, 50);
        }
      }
    } catch {}
  }

  private persistState() {
    this.ensureDataDir();
    try {
      const serialized = {
        updatedAt: new Date().toISOString(),
        isRunning: this.isRunning,
        startedAt: this.startedAt,
        states: Array.from(this.states.values()),
        auditLogs: this.auditLogs.slice(0, 30),
      };
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(serialized, null, 2), 'utf-8');
    } catch {}
  }

  private calculateNextRun(config: ScheduledJobConfig): string {
    const now = new Date();
    if (config.targetUtcHour !== undefined) {
      const next = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        config.targetUtcHour,
        config.targetUtcMinute || 0,
        0
      ));
      return next.toISOString();
    }
    return new Date(now.getTime() + config.intervalMs).toISOString();
  }

  public async runJob(jobId: string, isManual = false): Promise<any> {
    const def = JOB_DEFINITIONS.find((j) => j.id === jobId);
    if (!def) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (this.executingJobs.has(jobId)) {
      return { status: 'already_running', jobId };
    }

    const nowIso = new Date().toISOString();
    this.executingJobs.add(jobId);
    const state = this.states.get(jobId)!;
    state.lastStatus = 'running';
    state.startedRunningAt = nowIso;
    state.lastActivityAt = nowIso;
    this.persistState();

    const start = Date.now();
    try {
      const result = await handleCronTask(jobId);
      const durationMs = Date.now() - start;
      const completedIso = new Date().toISOString();

      state.lastRun = completedIso;
      state.lastActivityAt = completedIso;
      state.startedRunningAt = null;
      state.lastDurationMs = durationMs;
      state.lastStatus = result.success ? 'success' : 'error';
      state.lastError = result.success ? null : (result.error || 'Execution returned false');
      state.runCount += 1;
      if (!result.success) {
        state.failCount += 1;
      }
      state.nextRun = this.calculateNextRun(def);

      this.auditLogs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        jobId,
        timestamp: completedIso,
        durationMs,
        status: result.status || (result.success ? 'ok' : 'failed'),
        success: result.success,
        error: result.error,
      });
      if (this.auditLogs.length > 50) this.auditLogs.pop();

      this.persistState();
      return result;
    } catch (err: any) {
      const durationMs = Date.now() - start;
      const errMsg = err?.message || 'Unexpected exception during execution';
      const errorIso = new Date().toISOString();

      state.lastRun = errorIso;
      state.lastActivityAt = errorIso;
      state.startedRunningAt = null;
      state.lastDurationMs = durationMs;
      state.lastStatus = 'error';
      state.lastError = errMsg;
      state.runCount += 1;
      state.failCount += 1;
      // Reschedule next attempt with 3-minute backoff if failed, otherwise normal
      state.nextRun = new Date(Date.now() + 3 * 60 * 1000).toISOString();

      this.auditLogs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        jobId,
        timestamp: errorIso,
        durationMs,
        status: 'exception',
        success: false,
        error: errMsg,
      });
      if (this.auditLogs.length > 50) this.auditLogs.pop();

      this.persistState();
      return { success: false, error: errMsg, jobId };
    } finally {
      this.executingJobs.delete(jobId);
      state.startedRunningAt = null;
    }
  }

  /**
   * Automated health-check function that attempts to re-initialize stalled tasks
   * if they haven't reported activity for over 60 minutes (or specified threshold).
   *
   * Scans all scheduled jobs to identify:
   * 1. Jobs stuck in 'running' status or locked in executingJobs for > 60 minutes.
   * 2. Jobs whose scheduled nextRun is overdue by > 60 minutes without completing.
   * 3. Periodic recurring jobs (interval <= 60m) with no activity for > 60 minutes.
   *
   * Auto-reinitialization actions:
   * - Unlocks execution mutex (removes from executingJobs).
   * - Resets status from 'running' to 'idle'.
   * - Records diagnostic reason in state.lastError and audit log.
   * - Increments reinitializedCount and sets lastReinitializedAt.
   * - Resets nextRun to current timestamp (now) to immediately resume execution.
   * - Triggers background re-execution attempt if scheduler is active.
   */
  public checkAndReinitializeStalledTasks(maxInactivityMs: number = 60 * 60 * 1000): HealthCheckResult {
    const now = Date.now();
    const thresholdMinutes = Math.max(1, Math.round(maxInactivityMs / (60 * 1000)));
    const reinitializedTasks: StalledTaskRecoveryDetail[] = [];

    for (const def of JOB_DEFINITIONS) {
      if (!def.enabled) continue;
      const state = this.states.get(def.id);
      if (!state) continue;

      let isStalled = false;
      let stallReason = '';
      let inactivityMinutes = 0;

      // 1. Stuck in 'running' state or holding the lock for > maxInactivityMs
      const isExecuting = this.executingJobs.has(def.id) || state.lastStatus === 'running';
      if (isExecuting) {
        const runningStartMs = state.startedRunningAt
          ? new Date(state.startedRunningAt).getTime()
          : (state.lastActivityAt ? new Date(state.lastActivityAt).getTime() : (state.lastRun ? new Date(state.lastRun).getTime() : (this.startedAt ? new Date(this.startedAt).getTime() : now - maxInactivityMs - 1000)));

        const elapsedMs = now - runningStartMs;
        if (elapsedMs > maxInactivityMs) {
          isStalled = true;
          inactivityMinutes = Math.round(elapsedMs / 60000);
          stallReason = `Task was stuck in 'running' state for ${inactivityMinutes} minutes (exceeded ${thresholdMinutes}m limit)`;
        }
      }

      // 2. Scheduled nextRun is overdue by > maxInactivityMs
      if (!isStalled && state.nextRun) {
        const nextRunMs = new Date(state.nextRun).getTime();
        if (!isNaN(nextRunMs) && now - nextRunMs > maxInactivityMs) {
          isStalled = true;
          inactivityMinutes = Math.round((now - nextRunMs) / 60000);
          stallReason = `Scheduled run was overdue by ${inactivityMinutes} minutes without executing`;
        }
      }

      // 3. Regular periodic tasks (interval <= maxInactivityMs) with no activity for > maxInactivityMs
      if (!isStalled && def.intervalMs <= maxInactivityMs) {
        const lastActiveMs = state.lastActivityAt
          ? new Date(state.lastActivityAt).getTime()
          : (state.lastRun ? new Date(state.lastRun).getTime() : (this.startedAt ? new Date(this.startedAt).getTime() : 0));

        if (lastActiveMs > 0 && now - lastActiveMs > maxInactivityMs) {
          isStalled = true;
          inactivityMinutes = Math.round((now - lastActiveMs) / 60000);
          stallReason = `No activity reported for ${inactivityMinutes} minutes (expected every ${Math.round(def.intervalMs / 60000)}m)`;
        }
      }

      // 4. Recover stalled task
      if (isStalled) {
        const previousStatus = state.lastStatus;

        // Clear locks and reset execution state
        this.executingJobs.delete(def.id);
        state.startedRunningAt = null;
        state.lastStatus = 'idle';
        state.lastError = `Auto-recovered: Stalled for ${inactivityMinutes}m (${stallReason})`;
        state.reinitializedCount = (state.reinitializedCount || 0) + 1;
        state.lastReinitializedAt = new Date().toISOString();
        state.lastActivityAt = new Date().toISOString();

        // Re-initialize nextRun to immediate execution
        state.nextRun = new Date(now).toISOString();

        const detail: StalledTaskRecoveryDetail = {
          id: def.id,
          name: def.name,
          reason: stallReason,
          previousStatus,
          actionTaken: 'Cleared execution lock, reset status to idle, and re-initialized schedule to resume immediately',
          newNextRun: state.nextRun,
          inactivityMinutes,
        };
        reinitializedTasks.push(detail);

        // Attempt non-blocking re-execution if scheduler is currently running
        if (this.isRunning) {
          this.runJob(def.id).catch((err) => {
            console.warn(`[AutonomousCronScheduler] Re-initialized execution for ${def.id} failed:`, err);
          });
        }

        // Record health-check audit log
        this.auditLogs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          jobId: def.id,
          timestamp: new Date().toISOString(),
          durationMs: 0,
          status: 'reinitialized_stalled_task',
          success: true,
          error: stallReason,
        });
        if (this.auditLogs.length > 50) this.auditLogs.pop();
      }
    }

    if (reinitializedTasks.length > 0) {
      console.log(`[AutonomousCronScheduler] Health-check recovered ${reinitializedTasks.length} stalled task(s):`, reinitializedTasks.map(t => `${t.id} (${t.inactivityMinutes}m)`));
      this.persistState();
    }

    const result: HealthCheckResult = {
      timestamp: new Date().toISOString(),
      thresholdMinutes,
      stalledCount: reinitializedTasks.length,
      reinitializedTasks,
      healthyCount: JOB_DEFINITIONS.length - reinitializedTasks.length,
      status: reinitializedTasks.length > 0 ? 'recovered_stalled_tasks' : 'healthy',
    };

    this.lastHealthCheck = result;
    return result;
  }

  private async tick() {
    if (!this.isRunning) return;

    this.tickCount += 1;
    // Automated health check every 10 ticks (every 5 minutes)
    if (this.tickCount % 10 === 0) {
      try {
        this.checkAndReinitializeStalledTasks();
      } catch (err) {
        console.warn('[AutonomousCronScheduler] Automated tick health-check error:', err);
      }
    }

    const now = Date.now();
    for (const def of JOB_DEFINITIONS) {
      if (!def.enabled) continue;
      const state = this.states.get(def.id);
      if (!state) continue;

      const nextMs = new Date(state.nextRun).getTime();
      if (now >= nextMs && !this.executingJobs.has(def.id)) {
        // Trigger non-blocking execution
        this.runJob(def.id).catch(() => {});
      }
    }
  }

  private async performKeepalivePing() {
    this.keepalivePings += 1;
    this.lastKeepaliveAt = new Date().toISOString();
    try {
      // Local keepalive ping to maintain Node event loop
      const localRes = await fetch('http://localhost:3000/api/health', {
        headers: { 'X-Keepalive-Agent': 'PredictPro-Autonomous-Sentinel' },
      }).catch(() => null);

      if (localRes && localRes.ok) {
        this.lastKeepaliveStatus = `healthy_http_${localRes.status}`;
      } else {
        this.lastKeepaliveStatus = 'local_ping_standby';
      }

      // External health ping if live site or external URL is configured
      const externalUrl = process.env.APP_URL || process.env.SITE_URL || 'https://predictpro.guru';
      if (externalUrl && !externalUrl.includes('localhost')) {
        fetch(`${externalUrl}/api/health`, {
          method: 'GET',
          headers: { 'X-Keepalive-Agent': 'PredictPro-Autonomous-Sentinel' },
        }).catch(() => {});
      }
    } catch (err: any) {
      this.lastKeepaliveStatus = `ping_error: ${err.message}`;
    }
  }

  public start(): boolean {
    if (this.isRunning) return true;

    this.isRunning = true;
    this.startedAt = new Date().toISOString();
    console.log('[AutonomousCronScheduler] Starting 24/7 background cron orchestrator');

    // Initial tick after 10s warmup
    setTimeout(() => {
      this.tick();
      this.performKeepalivePing();
      this.checkAndReinitializeStalledTasks();
    }, 10000);

    // Heartbeat every 30 seconds
    this.timer = setInterval(() => {
      this.tick();
    }, 30 * 1000);

    // 24/7 Keepalive Ping every 3 minutes so server containers NEVER go idle
    this.keepaliveTimer = setInterval(() => {
      this.performKeepalivePing();
    }, 3 * 60 * 1000);

    // Automated 60-min Inactivity Sentinel: checks every 5 minutes
    this.healthCheckTimer = setInterval(() => {
      try {
        this.checkAndReinitializeStalledTasks();
      } catch (err) {
        console.warn('[AutonomousCronScheduler] Health check interval failed:', err);
      }
    }, 5 * 60 * 1000);

    this.persistState();
    return true;
  }

  public stop(): boolean {
    if (!this.isRunning) return false;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    console.log('[AutonomousCronScheduler] Paused background cron orchestrator');
    this.persistState();
    return true;
  }

  public getStatus() {
    const jobsList = JOB_DEFINITIONS.map((def) => {
      const state = this.states.get(def.id);
      return {
        ...def,
        ...state,
      };
    });

    const totalRuns = Array.from(this.states.values()).reduce((acc, s) => acc + s.runCount, 0);
    const totalFails = Array.from(this.states.values()).reduce((acc, s) => acc + s.failCount, 0);

    const uptimeMs = this.startedAt ? Date.now() - new Date(this.startedAt).getTime() : 0;
    const uptimeMinutes = Math.floor(uptimeMs / 60000);

    return {
      running: this.isRunning,
      startedAt: this.startedAt,
      uptimeMinutes,
      heartbeatIntervalMs: 30000,
      keepalive: {
        totalPings: this.keepalivePings,
        lastPingAt: this.lastKeepaliveAt,
        status: this.lastKeepaliveStatus,
        pingIntervalMinutes: 3,
      },
      healthCheck: {
        lastCheckAt: this.lastHealthCheck?.timestamp || null,
        status: this.lastHealthCheck?.status || 'healthy',
        stalledCount: this.lastHealthCheck?.stalledCount || 0,
        thresholdMinutes: this.lastHealthCheck?.thresholdMinutes || 60,
        reinitializedTasks: this.lastHealthCheck?.reinitializedTasks || [],
      },
      totalJobs: JOB_DEFINITIONS.length,
      totalRuns,
      totalFails,
      activeJobs: jobsList,
      recentLogs: this.auditLogs.slice(0, 15),
    };
  }

  /**
   * Diagnostic / unit-testing helper: puts a job into a stalled state with custom inactivity
   */
  public _simulateStalledTaskForTesting(jobId: string, minutesAgo: number): boolean {
    const state = this.states.get(jobId);
    if (!state) return false;
    const pastIso = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    state.lastStatus = 'running';
    state.startedRunningAt = pastIso;
    state.lastActivityAt = pastIso;
    this.executingJobs.add(jobId);
    return true;
  }
}

// Global persistent singleton instance across module reloads
const globalRef = global as unknown as { __predictProCronScheduler?: AutonomousCronScheduler };

export function getSchedulerInstance(): AutonomousCronScheduler {
  if (!globalRef.__predictProCronScheduler) {
    globalRef.__predictProCronScheduler = new AutonomousCronScheduler();
  }
  return globalRef.__predictProCronScheduler;
}

export function startAutonomousScheduler(): boolean {
  return getSchedulerInstance().start();
}

export function stopAutonomousScheduler(): boolean {
  return getSchedulerInstance().stop();
}

export function getCronSchedulerStatus() {
  return getSchedulerInstance().getStatus();
}

export function triggerSchedulerJob(jobId: string) {
  return getSchedulerInstance().runJob(jobId, true);
}

/**
 * Automated health-check function that attempts to re-initialize stalled tasks
 * if they haven't reported activity for over 60 minutes.
 */
export function checkAndReinitializeStalledTasks(maxInactivityMs?: number): HealthCheckResult {
  return getSchedulerInstance().checkAndReinitializeStalledTasks(maxInactivityMs);
}

export function automatedSchedulerHealthCheck(maxInactivityMs?: number): HealthCheckResult {
  return getSchedulerInstance().checkAndReinitializeStalledTasks(maxInactivityMs);
}

export function _simulateStalledTaskForTesting(jobId: string, minutesAgo: number): boolean {
  return getSchedulerInstance()._simulateStalledTaskForTesting(jobId, minutesAgo);
}
