import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { formatBytes, getAllTeamLogoUrls } from '@/services/offlineSyncService';

describe('Offline cache helpers and PWABuilder Report Card compliance', () => {
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
    expect(typeof result).toBe('boolean');
  });

  it('includes all 8 PWABuilder App Capabilities and recommended Manifest fields in /public/manifest.json', () => {
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Core identity
    expect(manifest.id).toBe('/');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.display).toBe('standalone');

    // All 8 PWABuilder App Capabilities:
    // 1. Shortcuts
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(4);
    // 2. File Handlers
    expect(Array.isArray(manifest.file_handlers)).toBe(true);
    expect(manifest.file_handlers[0].action).toBe('/bet-tracker');
    expect(manifest.file_handlers[0].accept['text/csv']).toContain('.csv');
    expect(manifest.file_handlers[0].accept['application/json']).toContain('.json');
    // 3. Launch Handler
    expect(manifest.launch_handler).toBeDefined();
    // 4. Protocol Handlers
    expect(Array.isArray(manifest.protocol_handlers)).toBe(true);
    expect(manifest.protocol_handlers[0].protocol).toBe('web+predictpro');
    // 5. Share Target
    expect(manifest.share_target).toBeDefined();
    expect(manifest.share_target.action).toBe('/code-converter');
    // 6. Widgets (with valid Adaptive Card template & data files on disk)
    expect(Array.isArray(manifest.widgets)).toBe(true);
    expect(manifest.widgets[0].ms_ac_template).toBe('/widgets/banker-template.json');
    expect(manifest.widgets[0].data).toBe('/widgets/banker-data.json');
    const templatePath = path.resolve(process.cwd(), 'public/widgets/banker-template.json');
    const dataPath = path.resolve(process.cwd(), 'public/widgets/banker-data.json');
    expect(fs.existsSync(templatePath)).toBe(true);
    expect(fs.existsSync(dataPath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(templatePath, 'utf-8')).type).toBe('AdaptiveCard');
    // 7. Edge Side Panel
    expect(manifest.edge_side_panel?.preferred_width).toBeGreaterThanOrEqual(360);
    // 8. Window Controls Overlay
    expect(manifest.display_override).toContain('window-controls-overlay');

    // Recommended & Optional Manifest fields
    expect(Array.isArray(manifest.scope_extensions)).toBe(true);
    expect(manifest.note_taking?.new_note_url).toBeDefined();
    expect(Array.isArray(manifest.screenshots)).toBe(true);
    expect(manifest.screenshots.some((s: { form_factor?: string }) => s.form_factor === 'wide')).toBe(true);
    expect(manifest.screenshots.some((s: { form_factor?: string }) => s.form_factor === 'narrow')).toBe(true);
  });

  it('implements all 6 PWABuilder Service Worker features in /public/sw.js and registers immediately for headless scanners', () => {
    const swPath = path.resolve(process.cwd(), 'public/sw.js');
    const swSource = fs.readFileSync(swPath, 'utf-8');

    // 1 & 2: Has Service Worker + Has Logic (install, activate, fetch)
    expect(swSource).toContain("self.addEventListener('install'");
    expect(swSource).toContain("self.addEventListener('activate'");
    expect(swSource).toContain("self.addEventListener('fetch'");
    // 3: Periodic Sync
    expect(swSource).toContain("self.addEventListener('periodicsync'");
    // 4: Background Sync
    expect(swSource).toContain("self.addEventListener('sync'");
    // 5: Push Notifications
    expect(swSource).toContain("self.addEventListener('push'");
    expect(swSource).toContain("self.addEventListener('notificationclick'");
    // 6: Offline Support (no navigator.onLine !== false guard blocking headless offline mode)
    expect(swSource).toContain('OFFLINE_HTML');
    expect(swSource).not.toContain('self.navigator.onLine !== false');

    // Verify index.html and main.tsx do not block HeadlessChrome / navigator.webdriver from registering /sw.js
    const mainTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/main.tsx'), 'utf-8');
    expect(mainTsx).toContain(".register('/sw.js'");
    expect(mainTsx).not.toContain('navigator.webdriver');

    // Verify Stale-While-Revalidate (SWR) strategy for both static assets and match data
    expect(swSource).toContain('function staleWhileRevalidateStaticAsset');
    expect(swSource).toContain('function staleWhileRevalidateMatchData');
    expect(swSource).toContain('function isMatchDataRequest');
    expect(swSource).toContain('function isStaticAssetRequest');
    expect(swSource).toContain("headers.set('x-sw-cache-strategy', 'stale-while-revalidate')");
    expect(swSource).toContain('event.waitUntil(networkRevalidatePromise)');
    expect(swSource).toContain('event.waitUntil(revalidatePromise)');
  });
});

