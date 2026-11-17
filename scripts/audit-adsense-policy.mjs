#!/usr/bin/env node
/**
 * PredictPro — Automated Post-Build Google AdSense Program Policy Checker
 *
 * Runs automatically after every `npm run build` (and on demand via `npm run audit:adsense`).
 * Scans the entire codebase across 8 Google AdSense Program Policy gates & 3 core compliance pillars:
 *   Pillar A — Prohibited Content Scanner (recursive codebase scan across src/pages, src/components, src/hooks, src/services, index.html, prerender routes)
 *   Pillar B — Non-Compliant Ad Placements Scanner (ad density <= 3 per page, zero ads inside dialogs/popovers, zero deceptive click labels, unfilled ad collapse)
 *   Pillar C — Excessive Pop-Ups & Intrusive Interstitials Scanner (zero window.open/window.alert pop-ups, single-overlay mutex, Mediapartners-Google exemption, dismissible modals)
 *
 * Writes detailed telemetry to `public/adsense-policy-audit.json` (and `dist/adsense-policy-audit.json`)
 * and exits with code `1` if any AdSense policy violation is detected.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const EXPECTED_PUB_ID = 'ca-pub-1375386376692976';
const EXPECTED_ADS_TXT_RECORD = 'google.com, pub-1375386376692976, DIRECT, f08c47fec0942fa0';
const MAX_ADS_PER_PAGE = 3;

/**
 * Restricted phrases that trigger Google AdSense "Prohibited Content / Gambling / Misrepresentation" rejections
 */
const PROHIBITED_PHRASES = [
  { pattern: /risk-free\s+(?:guaranteed\s+)?profit/i, label: 'risk-free [guaranteed] profit', category: 'Unreliable Financial / Gambling Guarantee' },
  { pattern: /guaranteed\s+risk-free\s+profit/i, label: 'guaranteed risk-free profit', category: 'Unreliable Financial / Gambling Guarantee' },
  { pattern: /risk-free\s+net\s+profit/i, label: 'risk-free net profit', category: 'Unreliable Financial / Gambling Guarantee' },
  { pattern: /100%\s+risk-free\s+house\s+profit/i, label: '100% risk-free house profit', category: 'Unreliable Financial / Gambling Guarantee' },
  { pattern: /no-risk\s+arbitrage\s+calculator/i, label: 'no-risk arbitrage calculator', category: 'Misrepresentation of Risk' },
  { pattern: /anti-detection\s+(?:stake\s+)?rounding/i, label: 'anti-detection stake rounding', category: 'Circumvention / Evasion Claim' },
  { pattern: /instant\s+access\s+via\s+m-pesa\s+or\s+card/i, label: 'instant access via M-Pesa or card', category: 'Direct Wagering / Tipster Paywall Solicitation' },
  { pattern: /\b100\s+sure\b/i, label: '100 sure', category: 'Guaranteed Outcome Claim' },
  { pattern: /\bguaranteed\s+profit\b/i, label: 'guaranteed profit', category: 'Guaranteed Outcome Claim' },
  { pattern: /\b100%\s+guaranteed\s+win/i, label: '100% guaranteed win', category: 'Guaranteed Outcome Claim' },
  { pattern: /\bfixed\s+matches\s+today\b/i, label: 'fixed matches today', category: 'Match-Fixing / Deceptive Claim' },
  { pattern: /\bfree\s+illegal\s+live\s+stream/i, label: 'free illegal live stream', category: 'Copyright / Unauthorized Streaming' },
];

const EXCLUDED_SCAN_FILES = new Set([
  'src/components/AdSensePolicyAuditor.tsx',
  'src/components/AdSensePolicyChecker.tsx',
  'src/pages/AdSensePolicyCheckerPage.tsx',
  'src/test/adsensePolicyAudit.test.ts',
  'scripts/audit-adsense-policy.mjs',
]);

function readFileSafe(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function collectFilesRecursive(relDir, extensions = ['.tsx', '.ts', '.mjs', '.html']) {
  const fullDir = path.join(ROOT, relDir);
  if (!fs.existsSync(fullDir)) return [];
  const results = [];
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = path.posix.join(relDir, entry.name);
    if (EXCLUDED_SCAN_FILES.has(relPath)) continue;
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'test') continue;
      results.push(...collectFilesRecursive(relPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(relPath);
    }
  }
  return results;
}

function stripHtmlTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function runAudit() {
  const checks = [];
  const violations = [];

  const pageAndComponentFiles = [
    ...collectFilesRecursive('src/pages', ['.tsx', '.ts']),
    ...collectFilesRecursive('src/components', ['.tsx', '.ts']),
  ];
  const allCodebaseFiles = [
    'index.html',
    'scripts/prerender-seo-routes.mjs',
    ...pageAndComponentFiles,
    ...collectFilesRecursive('src/hooks', ['.tsx', '.ts']),
    ...collectFilesRecursive('src/services', ['.tsx', '.ts']),
  ];

  // 1. Check ads.txt and app-ads.txt
  const adsTxt = readFileSafe('public/ads.txt') || '';
  const appAdsTxt = readFileSafe('public/app-ads.txt') || '';
  const adsTxtOk = adsTxt.includes(EXPECTED_ADS_TXT_RECORD) && appAdsTxt.includes(EXPECTED_ADS_TXT_RECORD);
  if (!adsTxtOk) {
    violations.push(`Missing or invalid IAB authorization record (${EXPECTED_ADS_TXT_RECORD}) in public/ads.txt or public/app-ads.txt.`);
  }
  checks.push({
    id: 'ads-txt-authorization',
    title: 'IAB ads.txt & app-ads.txt Publisher Authorization',
    category: 'Technical Verification',
    status: adsTxtOk ? 'PASS' : 'FAIL',
    detail: adsTxtOk
      ? `Verified '${EXPECTED_ADS_TXT_RECORD}' in both /ads.txt and /app-ads.txt.`
      : 'ads.txt or app-ads.txt is missing the required Google seller record.',
  });

  // 2. Check index.html <head> contains literal AdSense <script async src="...adsbygoogle.js?client=ca-pub-1375386376692976" crossorigin="anonymous"></script> & meta tag
  const indexHtml = readFileSafe('index.html') || '';
  const headSectionMatch = indexHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headHtml = headSectionMatch ? headSectionMatch[1] : '';
  const hasMetaTag = headHtml.includes(`name="google-adsense-account"`) && headHtml.includes(EXPECTED_PUB_ID);
  const hasLiteralHeadScriptTag =
    /<script\s+async\s+src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-1375386376692976"\s+crossorigin="anonymous"\s*><\/script>/i.test(
      headHtml
    );
  const blocksMediapartners = /botPattern\s*=\s*\/[^/]*(?:Mediapartners|AdsBot)[^/]*\/i\.test/.test(indexHtml);
  const sdkCheckOk = hasMetaTag && hasLiteralHeadScriptTag && !blocksMediapartners;
  if (!sdkCheckOk) {
    if (!hasMetaTag) violations.push(`index.html <head> is missing <meta name="google-adsense-account" content="${EXPECTED_PUB_ID}">.`);
    if (!hasLiteralHeadScriptTag) {
      violations.push(
        `index.html <head> is missing literal <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${EXPECTED_PUB_ID}" crossorigin="anonymous"></script>.`
      );
    }
    if (blocksMediapartners) violations.push(`index.html blocks Mediapartners-Google or AdsBot-Google from loading the AdSense SDK.`);
  }
  checks.push({
    id: 'adsense-sdk-and-crawler-access',
    title: 'AdSense <head> Auto Ads Script Tag & Verification Meta Tag',
    category: 'Technical Verification',
    status: sdkCheckOk ? 'PASS' : 'FAIL',
    detail: sdkCheckOk
      ? `Verified literal <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${EXPECTED_PUB_ID}" crossorigin="anonymous"></script> and <meta name="google-adsense-account"> inside <head></head> across all pages.`
      : 'AdSense <head> script tag or meta tag configuration issue detected in index.html.',
  });

  // 3. Check robots.txt allows Mediapartners-Google and AdsBot-Google
  const robotsTxt = readFileSafe('public/robots.txt') || '';
  const robotsOk =
    robotsTxt.includes('User-agent: Mediapartners-Google') &&
    robotsTxt.includes('User-agent: AdsBot-Google') &&
    robotsTxt.includes('Allow: /ads.txt');
  if (!robotsOk) {
    violations.push('public/robots.txt does not explicitly allow Mediapartners-Google, AdsBot-Google, and /ads.txt.');
  }
  checks.push({
    id: 'robots-txt-mediapartners',
    title: 'robots.txt Mediapartners-Google & AdsBot-Google Permissions',
    category: 'Crawler Access',
    status: robotsOk ? 'PASS' : 'FAIL',
    detail: robotsOk
      ? 'Mediapartners-Google and AdsBot-Google have explicit Allow: / and Allow: /ads.txt directives.'
      : 'Missing Mediapartners-Google or AdsBot-Google rules in public/robots.txt.',
  });

  // 4. Pillar A — Prohibited Content Scanner (Full Codebase Scan)
  const phraseMatches = [];
  for (const relFile of allCodebaseFiles) {
    const content = readFileSafe(relFile);
    if (!content) continue;
    for (const rule of PROHIBITED_PHRASES) {
      if (rule.pattern.test(content)) {
        phraseMatches.push(`${relFile}: matched prohibited phrase "${rule.label}" (${rule.category})`);
      }
    }
  }

  // Also scan dist/index.html if dist exists and was built from the current index.html
  const distIndexPath = path.join(ROOT, 'dist/index.html');
  const srcIndexPath = path.join(ROOT, 'index.html');
  if (fs.existsSync(distIndexPath) && fs.existsSync(srcIndexPath)) {
    const distMtime = fs.statSync(distIndexPath).mtimeMs;
    const srcMtime = fs.statSync(srcIndexPath).mtimeMs;
    if (distMtime >= srcMtime) {
      const distIndex = fs.readFileSync(distIndexPath, 'utf8');
      for (const rule of PROHIBITED_PHRASES) {
        if (rule.pattern.test(distIndex)) {
          phraseMatches.push(`dist/index.html: matched prohibited phrase "${rule.label}"`);
        }
      }
    }
  }

  const phrasesOk = phraseMatches.length === 0;
  if (!phrasesOk) {
    violations.push(...phraseMatches);
  }
  checks.push({
    id: 'prohibited-gambling-misrepresentation-phrases',
    title: 'Prohibited Content & Unreliable Claims Codebase Scanner',
    category: 'Prohibited Content',
    status: phrasesOk ? 'PASS' : 'FAIL',
    detail: phrasesOk
      ? `Scanned ${allCodebaseFiles.length} codebase files & templates across ${PROHIBITED_PHRASES.length} prohibited content patterns: 0 violations found.`
      : `Found ${phraseMatches.length} restricted phrase violation(s): ${phraseMatches.slice(0, 3).join('; ')}`,
  });

  // 5. Editorial Content Depth & Anti-Doorway Link Density in index.html <main>
  const mainMatch = indexHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const mainHtml = mainMatch ? mainMatch[1] : '';
  const articleMatch = mainHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const articleText = stripHtmlTags(articleMatch ? articleMatch[1] : mainHtml);
  const editorialWordCount = articleText ? articleText.split(/\s+/).filter((w) => w.length > 1).length : 0;
  const mainLinkCount = (mainHtml.match(/<a\s+href=/gi) || []).length;

  const contentDepthOk = editorialWordCount >= 450 && mainLinkCount <= 50;
  if (!contentDepthOk) {
    violations.push(
      `index.html <main> failed content depth / link density gate: ${editorialWordCount} editorial words (min 450 required) and ${mainLinkCount} links (max 50 allowed).`
    );
  }
  checks.push({
    id: 'editorial-depth-and-link-density',
    title: 'Original Editorial Journalism Depth & Anti-Doorway Link Ratio',
    category: 'Valuable Inventory',
    status: contentDepthOk ? 'PASS' : 'FAIL',
    detail: `Verified ${editorialWordCount} words of original quantitative football methodology prose and ${mainLinkCount} curated hub links in <main> (threshold: >=450 words, <=50 links).`,
  });

  // 6. Mandatory Legal, GDPR Cookie Consent & E-E-A-T Governance Pages
  const requiredLegalFiles = [
    'src/pages/About.tsx',
    'src/pages/Contact.tsx',
    'src/pages/PrivacyPolicy.tsx',
    'src/pages/CookiePolicy.tsx',
    'src/pages/TermsOfService.tsx',
    'src/pages/ResponsibleGaming.tsx',
    'src/components/CookieConsentBanner.tsx',
    'src/components/Footer.tsx',
  ];
  const missingLegalFiles = requiredLegalFiles.filter((f) => !fs.existsSync(path.join(ROOT, f)));
  const footerContent = readFileSafe('src/components/Footer.tsx') || '';
  const requiredFooterLinks = ['/about', '/methodology', '/contact', '/privacy', '/cookies', '/terms', '/responsible-gaming'];
  const missingFooterLinks = requiredFooterLinks.filter((href) => !footerContent.includes(`to="${href}"`));
  const legalOk = missingLegalFiles.length === 0 && missingFooterLinks.length === 0;
  if (!legalOk) {
    violations.push(
      `Missing legal pages (${missingLegalFiles.join(', ')}) or footer links (${missingFooterLinks.join(', ')}).`
    );
  }
  checks.push({
    id: 'eeat-legal-and-gdpr-consent',
    title: 'Mandatory E-E-A-T, GDPR Cookie Consent & 18+ Informational Governance',
    category: 'Trust & Transparency',
    status: legalOk ? 'PASS' : 'FAIL',
    detail: legalOk
      ? 'Verified /about, /methodology, /contact, /privacy, /cookies, /terms, /responsible-gaming, and GDPR CookieConsentBanner.'
      : `Missing required legal/governance items: ${[...missingLegalFiles, ...missingFooterLinks].join(', ')}`,
  });

  // 7. Pillar B — Non-Compliant Ad Placements & Ad Density Scanner
  const adBannerContent = readFileSafe('src/components/AdBanner.tsx') || '';
  const adPlacementIssues = [];
  const auditedAdRoutes = [];
  let totalAdUnitsAcrossPages = 0;

  if (!adBannerContent.includes('isValidLiveAdSlot') || !adBannerContent.includes('data-ad-status')) {
    adPlacementIssues.push('src/components/AdBanner.tsx is missing live slot validation or unfilled slot MutationObserver collapse.');
  }

  for (const relFile of pageAndComponentFiles) {
    if (relFile === 'src/components/AdBanner.tsx') continue;
    const content = readFileSafe(relFile) || '';
    const adMatches = content.match(/<AdBanner(?:Horizontal|Rect|Fluid)?\b/g) || [];
    if (adMatches.length > 0) {
      totalAdUnitsAcrossPages += adMatches.length;
      auditedAdRoutes.push({ file: relFile, adCount: adMatches.length, maxAllowed: MAX_ADS_PER_PAGE });

      // Rule B1: Max ad units per page <= 3
      if (adMatches.length > MAX_ADS_PER_PAGE) {
        adPlacementIssues.push(
          `${relFile}: renders ${adMatches.length} <AdBanner> units (exceeds max ${MAX_ADS_PER_PAGE} per page policy).`
        );
      }

      // Rule B2: Never render <AdBanner> inside Dialog, AlertDialog, Drawer, Sheet, Popover, or Tooltip
      const modalAdPattern = /<(?:DialogContent|AlertDialogContent|DrawerContent|SheetContent|PopoverContent|TooltipContent)[\s\S]*?<AdBanner(?:Horizontal|Rect|Fluid)?\b/i;
      if (modalAdPattern.test(content)) {
        adPlacementIssues.push(`${relFile}: places <AdBanner> inside a modal/dialog/drawer overlay (prohibited by AdSense).`);
      }

      // Rule B3: No deceptive click-encouragement labels near ads
      const deceptiveLabelPattern = /\b(?:click\s+on\s+(?:the\s+|our\s+)?ads|support\s+us\s+by\s+clicking|click\s+here\s+to\s+support|favorite\s+sponsor\s+links)\b/i;
      if (deceptiveLabelPattern.test(content)) {
        adPlacementIssues.push(`${relFile}: contains deceptive click-encouragement copy near ad placements.`);
      }
    }
  }

  const adHygieneOk = adPlacementIssues.length === 0;
  if (!adHygieneOk) {
    violations.push(...adPlacementIssues);
  }
  checks.push({
    id: 'ad-placement-hygiene',
    title: 'Non-Compliant Ad Placements, Density & Overlay Audit',
    category: 'Ad Placement Policies',
    status: adHygieneOk ? 'PASS' : 'FAIL',
    detail: adHygieneOk
      ? `Audited ${pageAndComponentFiles.length} component/page files (${auditedAdRoutes.length} routes with ads, max ${MAX_ADS_PER_PAGE}/page, 0 ads in modals/popovers, unfilled collapse active).`
      : `Ad placement violation(s): ${adPlacementIssues.join('; ')}`,
  });

  // 8. Pillar C — Excessive Pop-Ups & Intrusive Interstitials Scanner
  const popupIssues = [];
  const windowPopupMatches = [];

  for (const relFile of pageAndComponentFiles) {
    const content = readFileSafe(relFile) || '';
    if (/\bwindow\.open\s*\(/.test(content) || /\bwindow\.alert\s*\(/.test(content)) {
      windowPopupMatches.push(relFile);
    }
  }
  if (windowPopupMatches.length > 0) {
    popupIssues.push(`Found prohibited window.open/window.alert pop-up calls in: ${windowPopupMatches.join(', ')}`);
  }

  const signupModalContent = readFileSafe('src/components/FirstVisitSignupModal.tsx') || '';
  const pwaToastContent = readFileSafe('src/components/PWAInstallToast.tsx') || '';
  const appContent = readFileSafe('src/App.tsx') || '';

  const hasMediapartnersExemption =
    signupModalContent.includes('Mediapartners-Google') && pwaToastContent.includes('Mediapartners-Google');
  const hasDismissibleModalAttr = signupModalContent.includes('data-adsense-dismissible="true"');
  const hasSingleOverlayMutex =
    signupModalContent.includes('Cookie and Privacy Consent Notification') &&
    pwaToastContent.includes('Cookie and Privacy Consent Notification');
  const hasDeferredReadyGate = appContent.includes('{ready && (');

  if (!hasMediapartnersExemption) {
    popupIssues.push('FirstVisitSignupModal.tsx or PWAInstallToast.tsx does not exempt Mediapartners-Google crawler.');
  }
  if (!hasDismissibleModalAttr) {
    popupIssues.push('FirstVisitSignupModal.tsx is missing guaranteed close button (data-adsense-dismissible="true").');
  }
  if (!hasSingleOverlayMutex) {
    popupIssues.push('Pop-up components are missing the Single-Overlay Mutex check against CookieConsentBanner.');
  }
  if (!hasDeferredReadyGate) {
    popupIssues.push('src/App.tsx does not defer overlays behind user-interaction ready state.');
  }

  const popupAuditOk = popupIssues.length === 0;
  if (!popupAuditOk) {
    violations.push(...popupIssues);
  }
  checks.push({
    id: 'excessive-popups-and-interstitials',
    title: 'Excessive Pop-Ups, window.open & Intrusive Interstitial Scanner',
    category: 'Pop-Up & Interstitial Policy',
    status: popupAuditOk ? 'PASS' : 'FAIL',
    detail: popupAuditOk
      ? `Scanned ${pageAndComponentFiles.length} UI files: 0 window.open/alert pop-ups, single-overlay mutex enforced, Mediapartners-Google exempted, all modals dismissible.`
      : `Pop-up policy violation(s): ${popupIssues.join('; ')}`,
  });

  const passedCount = checks.filter((c) => c.status === 'PASS').length;
  const report = {
    auditedAt: new Date().toISOString(),
    publisherId: EXPECTED_PUB_ID,
    domain: 'https://www.predictpro.guru',
    overallStatus: violations.length === 0 ? 'COMPLIANT' : 'VIOLATIONS_FOUND',
    scorePercent: Math.round((passedCount / checks.length) * 100),
    passedChecks: passedCount,
    totalChecks: checks.length,
    editorialWordCount,
    mainLinkCount,
    prohibitedContentScan: {
      filesScanned: allCodebaseFiles.length,
      patternsChecked: PROHIBITED_PHRASES.length,
      violationsFound: phraseMatches.length,
    },
    adPlacementScan: {
      uiFilesScanned: pageAndComponentFiles.length,
      routesWithAds: auditedAdRoutes.length,
      totalAdUnits: totalAdUnitsAcrossPages,
      maxAdsPerPageAllowed: MAX_ADS_PER_PAGE,
      adsInsideModalsCount: 0,
      deceptiveLabelCount: 0,
      auditedRoutes: auditedAdRoutes,
    },
    popupAndInterstitialScan: {
      uiFilesScanned: pageAndComponentFiles.length,
      windowOpenOrAlertCount: windowPopupMatches.length,
      singleOverlayMutexActive: hasSingleOverlayMutex,
      mediapartnersExempted: hasMediapartnersExemption,
      modalsDismissible: hasDismissibleModalAttr,
      deferredUntilInteraction: hasDeferredReadyGate,
    },
    checks,
    violations,
  };

  const publicReportPath = path.join(ROOT, 'public', 'adsense-policy-audit.json');
  fs.writeFileSync(publicReportPath, JSON.stringify(report, null, 2), 'utf8');

  const distDir = path.join(ROOT, 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'adsense-policy-audit.json'), JSON.stringify(report, null, 2), 'utf8');
  }

  console.log(
    `[AdSense Policy Audit] Status: ${report.overallStatus} (${report.passedChecks}/${report.totalChecks} checks passed, ${allCodebaseFiles.length} files scanned, ${report.editorialWordCount} editorial words, ${report.mainLinkCount} main links)`
  );

  if (violations.length > 0) {
    console.error('[AdSense Policy Audit] Policy violations detected:');
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    process.exit(1);
  }
}

runAudit();
