import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(__dirname, '../..');

describe('Google AdSense Program Policy Compliance & Post-Build Auditor', () => {
  it('executes scripts/audit-adsense-policy.mjs cleanly and generates a 100% COMPLIANT report across all 8 gates', () => {
    const output = execSync('node scripts/audit-adsense-policy.mjs', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(output).toContain('Status: COMPLIANT (8/8 checks passed');

    const reportPath = path.join(ROOT, 'public', 'adsense-policy-audit.json');
    expect(fs.existsSync(reportPath)).toBe(true);

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(report.overallStatus).toBe('COMPLIANT');
    expect(report.scorePercent).toBe(100);
    expect(report.passedChecks).toBe(8);
    expect(report.totalChecks).toBe(8);
    expect(report.editorialWordCount).toBeGreaterThanOrEqual(450);
    expect(report.mainLinkCount).toBeLessThanOrEqual(50);
    expect(report.violations).toEqual([]);

    // Verify Pillar 1: Prohibited Content Codebase Scan
    expect(report.prohibitedContentScan.filesScanned).toBeGreaterThan(400);
    expect(report.prohibitedContentScan.violationsFound).toBe(0);

    // Verify Pillar 2: Non-Compliant Ad Placements Scan
    expect(report.adPlacementScan.uiFilesScanned).toBeGreaterThan(200);
    expect(report.adPlacementScan.maxAdsPerPageAllowed).toBe(3);
    expect(report.adPlacementScan.adsInsideModalsCount).toBe(0);
    expect(report.adPlacementScan.deceptiveLabelCount).toBe(0);

    // Verify Pillar 3: Excessive Pop-Ups & Interstitials Scan
    expect(report.popupAndInterstitialScan.windowOpenOrAlertCount).toBe(0);
    expect(report.popupAndInterstitialScan.singleOverlayMutexActive).toBe(true);
    expect(report.popupAndInterstitialScan.mediapartnersExempted).toBe(true);
    expect(report.popupAndInterstitialScan.modalsDismissible).toBe(true);
  });

  it('wires node scripts/audit-adsense-policy.mjs into package.json build and audit:adsense scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts.build).toContain('node scripts/audit-adsense-policy.mjs');
    expect(pkg.scripts['audit:adsense']).toBe('node scripts/audit-adsense-policy.mjs');
  });

  it('ensures index.html contains the literal AdSense <script async src="...adsbygoogle.js?client=ca-pub-1375386376692976" crossorigin="anonymous"></script> inside <head></head>', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const headMatch = indexHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    expect(headMatch).not.toBeNull();
    const headHtml = headMatch ? headMatch[1] : '';
    expect(headHtml).toContain('<meta name="google-adsense-account" content="ca-pub-1375386376692976" />');
    expect(headHtml).toMatch(
      /<script\s+async\s+src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-1375386376692976"\s+crossorigin="anonymous"\s*><\/script>/i
    );
  });
});

