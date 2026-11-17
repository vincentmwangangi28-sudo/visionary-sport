import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(__dirname, '../..');

describe('Google AdSense Program Policy Compliance & Post-Build Auditor', () => {
  it('executes scripts/audit-adsense-policy.mjs cleanly and generates a 100% COMPLIANT report', () => {
    const output = execSync('node scripts/audit-adsense-policy.mjs', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(output).toContain('Status: COMPLIANT (7/7 checks passed');

    const reportPath = path.join(ROOT, 'public', 'adsense-policy-audit.json');
    expect(fs.existsSync(reportPath)).toBe(true);

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(report.overallStatus).toBe('COMPLIANT');
    expect(report.scorePercent).toBe(100);
    expect(report.passedChecks).toBe(7);
    expect(report.totalChecks).toBe(7);
    expect(report.editorialWordCount).toBeGreaterThanOrEqual(450);
    expect(report.mainLinkCount).toBeLessThanOrEqual(50);
    expect(report.violations).toEqual([]);
  });

  it('wires node scripts/audit-adsense-policy.mjs into package.json build and audit:adsense scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts.build).toContain('node scripts/audit-adsense-policy.mjs');
    expect(pkg.scripts['audit:adsense']).toBe('node scripts/audit-adsense-policy.mjs');
  });

  it('ensures index.html loads adsbygoogle.js for Mediapartners-Google and on human interaction without blocking AdSense bots', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    expect(indexHtml).toContain('<meta name="google-adsense-account" content="ca-pub-1375386376692976" />');
    expect(indexHtml).toContain(
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1375386376692976'
    );
    expect(indexHtml).toContain('Mediapartners-Google|AdsBot-Google|Google-Display-Ads-Bot');
  });
});
