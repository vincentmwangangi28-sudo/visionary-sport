import { describe, it, expect } from 'vitest';
import { formatBytes, getAllTeamLogoUrls } from '@/services/offlineSyncService';

describe('Offline cache helpers and storage utilities', () => {
  it('formats byte numbers accurately into human readable units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    expect(formatBytes(1024 * 1024 * 1024 * 2.1)).toBe('2.1 GB');
  });

  it('handles negative or invalid byte inputs safely', () => {
    expect(formatBytes(-100)).toBe('0 B');
    expect(formatBytes(NaN as unknown as number)).toBe('0 B');
  });

  it('collects canonical team logos for offline pre-caching', () => {
    const urls = getAllTeamLogoUrls();
    expect(Array.isArray(urls)).toBe(true);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every(u => u.startsWith('http'))).toBe(true);
  });

  it('safely handles triggerMatchDataRevalidation in environment without crashing', async () => {
    const { triggerMatchDataRevalidation } = await import('@/services/offlineSyncService');
    const result = await triggerMatchDataRevalidation();
    // In node/vitest environment without an active serviceWorker controller, it returns false safely
    expect(typeof result).toBe('boolean');
  });
});
