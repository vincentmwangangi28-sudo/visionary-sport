import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkAndReinitializeStalledTasks,
  automatedSchedulerHealthCheck,
  getCronSchedulerStatus,
  getSchedulerInstance,
  _simulateStalledTaskForTesting,
} from '@/server/cronScheduler';

describe('Autonomous Cron Scheduler Automated Health-Check & Recovery', () => {
  beforeEach(() => {
    // Run an initial health check to clear any previous testing mutations
    checkAndReinitializeStalledTasks(0);
  });

  it('reports healthy status when tasks are within their scheduled intervals', () => {
    const report = checkAndReinitializeStalledTasks(60 * 60 * 1000);

    expect(report).toBeDefined();
    expect(report.thresholdMinutes).toBe(60);
    expect(typeof report.healthyCount).toBe('number');
    expect(report.healthyCount).toBeGreaterThan(0);
    expect(report.status).toBe('healthy');
    expect(report.stalledCount).toBe(0);
  });

  it('detects and re-initializes tasks that have been stalled in running state for > 60 minutes', () => {
    // Simulate 'settle-results' being stuck in running state for 75 minutes
    const simulated = _simulateStalledTaskForTesting('settle-results', 75);
    expect(simulated).toBe(true);

    const report = checkAndReinitializeStalledTasks(60 * 60 * 1000);

    expect(report.stalledCount).toBeGreaterThanOrEqual(1);
    const recovered = report.reinitializedTasks.find((t) => t.id === 'settle-results');
    expect(recovered).toBeDefined();
    expect(recovered?.reason).toContain('stuck in \'running\' state');
    expect(recovered?.previousStatus).toBe('running');
    expect(recovered?.actionTaken).toContain('Cleared execution lock');

    // Verify runtime state has been restored to idle with re-initialized schedule
    const status = getCronSchedulerStatus();
    const targetJob = status.activeJobs.find((j: any) => j.id === 'settle-results');
    expect(targetJob).toBeDefined();
    expect(targetJob?.lastStatus).toBe('idle');
    expect(targetJob?.lastError).toContain('Auto-recovered');
    expect(targetJob?.reinitializedCount).toBeGreaterThan(0);
  });

  it('supports custom inactivity thresholds', () => {
    // Simulate a 45-minute stall
    _simulateStalledTaskForTesting('value-bets', 45);

    // With 60-minute threshold, 45 minutes should NOT trigger stall
    const normalCheck = checkAndReinitializeStalledTasks(60 * 60 * 1000);
    expect(normalCheck.reinitializedTasks.some((t) => t.id === 'value-bets')).toBe(false);

    // With 30-minute threshold, 45 minutes MUST trigger stall recovery
    const strictCheck = checkAndReinitializeStalledTasks(30 * 60 * 1000);
    expect(strictCheck.reinitializedTasks.some((t) => t.id === 'value-bets')).toBe(true);

    const job = getCronSchedulerStatus().activeJobs.find((j: any) => j.id === 'value-bets');
    expect(job?.lastStatus).toBe('idle');
  });

  it('automatedSchedulerHealthCheck alias functions equivalently and embeds in scheduler status', () => {
    const aliasReport = automatedSchedulerHealthCheck(60 * 60 * 1000);
    expect(aliasReport).toBeDefined();
    expect(aliasReport.thresholdMinutes).toBe(60);

    const status = getCronSchedulerStatus();
    expect(status.healthCheck).toBeDefined();
    expect(status.healthCheck.thresholdMinutes).toBe(60);
    expect(typeof status.healthCheck.stalledCount).toBe('number');
  });
});
