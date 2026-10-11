import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getKeepaliveTelemetry,
  triggerKeepalivePulse,
  isClientSentinelEnabled,
  setClientSentinelEnabled,
  KEEPALIVE_STORAGE_KEY,
  KEEPALIVE_CONFIG_KEY,
  KEEPALIVE_EVENT,
} from '@/services/siteKeepaliveService';

describe('Site Keepalive Sentinel Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides default telemetry structure when storage is empty', () => {
    const telemetry = getKeepaliveTelemetry();
    expect(telemetry.totalPings).toBe(0);
    expect(telemetry.lastPingAt).toBeNull();
    expect(telemetry.supabaseProtected).toBe(true);
    expect(telemetry.lastStatus).toBe('initializing');
    expect(Array.isArray(telemetry.history)).toBe(true);
  });

  it('manages client sentinel enabled toggle correctly in localStorage', () => {
    expect(isClientSentinelEnabled()).toBe(true);
    setClientSentinelEnabled(false);
    expect(isClientSentinelEnabled()).toBe(false);
    expect(localStorage.getItem(KEEPALIVE_CONFIG_KEY)).toBe('false');

    setClientSentinelEnabled(true);
    expect(isClientSentinelEnabled()).toBe(true);
    expect(localStorage.getItem(KEEPALIVE_CONFIG_KEY)).toBe('true');
  });

  it('executes keepalive pulse and records telemetry with latency', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', service: 'PredictPro' }),
    });

    const result = await triggerKeepalivePulse('unit_test');
    expect(result.success).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.timestamp).toBe('string');

    const updated = getKeepaliveTelemetry();
    expect(updated.totalPings).toBe(1);
    expect(updated.lastStatus).toBe('active');
    expect(updated.lastPingAt).toBe(result.timestamp);
    expect(updated.history.length).toBe(1);
    expect(updated.history[0].source).toBe('unit_test');
  });

  it('dispatches custom event on pulse completion', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });

    let eventFired = false;
    let eventDetail: any = null;

    const listener = (e: any) => {
      eventFired = true;
      eventDetail = e.detail;
    };

    window.addEventListener(KEEPALIVE_EVENT, listener);

    await triggerKeepalivePulse('event_test');

    expect(eventFired).toBe(true);
    expect(eventDetail).toBeDefined();
    expect(eventDetail.totalPings).toBeGreaterThan(0);

    window.removeEventListener(KEEPALIVE_EVENT, listener);
  });

  it('handles offline fallback gracefully without throwing uncaught exceptions', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const result = await triggerKeepalivePulse('offline_test');
    expect(result).toBeDefined();
    expect(typeof result.latencyMs).toBe('number');
    expect(typeof result.timestamp).toBe('string');

    const updated = getKeepaliveTelemetry();
    expect(updated.totalPings).toBeGreaterThan(0);
    expect(updated.history.length).toBeGreaterThan(0);
  });
});
