import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { googleIndexingCronService } from '@/services/googleIndexingCron';
import { geminiDailyCronService } from '@/services/geminiDailyCron';
import { checkTelegramBotStatus, broadcastCustomMessage } from '@/services/telegramTasksService';

describe('Network Resilience & Circuit Breaker Guards', () => {
  const originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalOnLine) {
      Object.defineProperty(navigator, 'onLine', originalOnLine);
    } else {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        get: () => true,
      });
    }
    vi.restoreAllMocks();
  });

  it('short-circuits callEdgeFn immediately when navigator.onLine is false', async () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => false,
    });
    const fetchSpy = vi.spyOn(global, 'fetch');

    await expect(callEdgeFn('cron-daily-predictions', { test: true })).rejects.toThrow(
      /skipped while browser is offline/i
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips background auto indexing cron when browser is offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => false,
    });
    const fetchSpy = vi.spyOn(global, 'fetch');

    const res = await googleIndexingCronService.runCronNow('auto');
    expect(res.success).toBe(false);
    expect(res.urlsPushed).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('generates fallback daily AI digest without network calls when browser is offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => false,
    });
    const fetchSpy = vi.spyOn(global, 'fetch');

    const digest = await geminiDailyCronService.generateDailyDigest([]);
    expect(digest).toBeDefined();
    expect(typeof digest.headline).toBe('string');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns simulated standby status in telegramTasksService when browser is offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => false,
    });
    const fetchSpy = vi.spyOn(global, 'fetch');

    const botStatus = await checkTelegramBotStatus('@predictproAi');
    expect(botStatus.success).toBe(false);

    const broadcastRes = await broadcastCustomMessage('Test offline alert');
    expect(broadcastRes.success).toBe(false);
    expect(broadcastRes.simulated).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
