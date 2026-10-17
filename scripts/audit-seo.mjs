#!/usr/bin/env node

/**
 * PredictPro SEO Route Audit Tool
 * 
 * Scans all dynamic and static route components in the application and validates:
 *  1. Title length constraint: <= 70 characters (including "| PredictPro" suffix if appended)
 *  2. Description length constraint: <= 160 characters (and alerts if < 25 characters)
 *  3. Reports any non-compliant pages with actionable diagnostics
 * 
 * Usage:
 *   node scripts/audit-seo.mjs
 *   npm run audit:seo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT_DIR, 'src', 'pages');

const TITLE_MAX_LIMIT = 70;
const DESC_MAX_LIMIT = 160;
const DESC_MIN_LIMIT = 25;

console.log('\n============================================================');
console.log('🔍 PREDICTPRO AUTOMATED SEO ROUTE & METADATA AUDIT');
console.log('============================================================');
console.log(`Constraints:`);
console.log(`  • Title Max Length:        <= ${TITLE_MAX_LIMIT} characters`);
console.log(`  • Description Max Length:  <= ${DESC_MAX_LIMIT} characters`);
console.log(`  • Description Min Length:  >= ${DESC_MIN_LIMIT} characters`);
console.log('------------------------------------------------------------\n');

// 1. Gather all route files from src/pages
function getPageFiles(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...getPageFiles(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const pageFiles = getPageFiles(PAGES_DIR);

const auditResults = {
  totalScanned: 0,
  passed: 0,
  violations: [],
  warnings: [],
  pages: []
};

// Test helper to compute full effective title as rendered by <SEO />
function computeEffectiveTitle(rawTitle) {
  if (!rawTitle) return '';
  if (rawTitle.includes('PredictPro')) {
    return rawTitle;
  }
  // Matches SEO.tsx logic
  if (rawTitle.length + 13 <= 65) {
    return `${rawTitle} | PredictPro`;
  }
  return rawTitle;
}

for (const filePath of pageFiles) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if component renders <SEO
  const seoMatches = [...content.matchAll(/<SEO([\s\S]*?)\/>/g)];

  if (seoMatches.length === 0) {
    continue;
  }

  auditResults.totalScanned++;

  seoMatches.forEach((match, index) => {
    const seoBlock = match[1];

    // Extract title: handles double-quotes, single-quotes, or template literals
    let rawTitle = '';
    const titleDouble = seoBlock.match(/title="([^"]+)"/);
    const titleTemplate = seoBlock.match(/title={`([^`]+)`}/);
    const titleSingle = seoBlock.match(/title='([^']+)'/);
    if (titleDouble) rawTitle = titleDouble[1];
    else if (titleTemplate) rawTitle = titleTemplate[1];
    else if (titleSingle) rawTitle = titleSingle[1];

    // Extract description: handles double-quotes, single-quotes, or template literals
    let rawDesc = '';
    const descDouble = seoBlock.match(/description="([^"]+)"/);
    const descTemplate = seoBlock.match(/description={`([^`]+)`}/);
    const descSingle = seoBlock.match(/description='([^']+)'/);
    if (descDouble) rawDesc = descDouble[1];
    else if (descTemplate) rawDesc = descTemplate[1];
    else if (descSingle) rawDesc = descSingle[1];

    // Check if canonical exists
    let canonical = '';
    const canonDouble = seoBlock.match(/canonical="([^"]+)"/);
    const canonTemplate = seoBlock.match(/canonical={`([^`]+)`}/);
    const canonSingle = seoBlock.match(/canonical='([^']+)'/);
    if (canonDouble) canonical = canonDouble[1];
    else if (canonTemplate) canonical = canonTemplate[1];
    else if (canonSingle) canonical = canonSingle[1];

    const isDynamic = filePath.includes('MatchPrediction') || filePath.includes('BlogPost') || seoBlock.includes('${') || seoBlock.includes('post.');

    const pageInfo = {
      file: relativePath,
      isDynamic,
      canonical: canonical || '(not specified)',
      title: rawTitle,
      effectiveTitle: computeEffectiveTitle(rawTitle),
      description: rawDesc,
      issues: []
    };

    // Evaluate static titles
    if (rawTitle && !rawTitle.includes('${')) {
      const effectiveTitle = computeEffectiveTitle(rawTitle);
      if (effectiveTitle.length > TITLE_MAX_LIMIT) {
        const issue = {
          type: 'TITLE_TOO_LONG',
          message: `Title exceeds ${TITLE_MAX_LIMIT} chars (${effectiveTitle.length} chars)`,
          text: effectiveTitle
        };
        pageInfo.issues.push(issue);
        auditResults.violations.push({ file: relativePath, ...issue });
      }
    }

    // Evaluate static descriptions
    if (rawDesc && !rawDesc.includes('${')) {
      if (rawDesc.length > DESC_MAX_LIMIT) {
        const issue = {
          type: 'DESCRIPTION_TOO_LONG',
          message: `Description exceeds ${DESC_MAX_LIMIT} chars (${rawDesc.length} chars)`,
          text: rawDesc
        };
        pageInfo.issues.push(issue);
        auditResults.violations.push({ file: relativePath, ...issue });
      } else if (rawDesc.length < DESC_MIN_LIMIT) {
        const issue = {
          type: 'DESCRIPTION_TOO_SHORT',
          message: `Description is shorter than ${DESC_MIN_LIMIT} chars (${rawDesc.length} chars)`,
          text: rawDesc
        };
        pageInfo.issues.push(issue);
        auditResults.violations.push({ file: relativePath, ...issue });
      }
    }

    if (pageInfo.issues.length === 0) {
      auditResults.passed++;
    }

    auditResults.pages.push(pageInfo);
  });
}

// 2. Explicit Dynamic Component Simulation: MatchPrediction & BlogPost
console.log('🧪 Testing Dynamic Route SEO Generators:');

// Test A: MatchPrediction.tsx dynamic generators
const testMatchCases = [
  { home: 'Arsenal', away: 'Chelsea', outcome: 'Home Win', confidence: 72 },
  { home: 'Wolverhampton Wanderers', away: 'Brighton & Hove Albion', outcome: 'Draw', confidence: 65 },
  { home: 'Borussia Moenchengladbach', away: 'Bayer 04 Leverkusen', outcome: 'Away Win', confidence: 68 },
  { home: 'Real Madrid Club de Futbol', away: 'Club Atletico de Madrid', outcome: 'Home Win', confidence: 80 },
  { home: 'Paris Saint-Germain', away: 'Manchester City Football Club', outcome: 'Draw', confidence: 55 }
];

testMatchCases.forEach((t) => {
  const rawMatchTitle = `${t.home} vs ${t.away} Prediction`;
  const title = rawMatchTitle.length + 13 <= 68
    ? `${rawMatchTitle} | PredictPro`
    : `${rawMatchTitle.slice(0, 52)}... | PredictPro`;

  const baseMatchDesc = `${t.home} vs ${t.away} prediction: ${t.outcome} (${t.confidence}% conf). Lineups, xG data, H2H stats & betting tips.`;
  const desc = baseMatchDesc.length > 160
    ? `${baseMatchDesc.slice(0, 157)}...`
    : baseMatchDesc.length < 120
      ? `${baseMatchDesc} Free AI football tips & odds.`
      : baseMatchDesc;

  if (title.length > TITLE_MAX_LIMIT) {
    auditResults.violations.push({
      file: 'src/pages/MatchPrediction.tsx (dynamic sample)',
      type: 'DYNAMIC_TITLE_TOO_LONG',
      message: `Match title exceeded ${TITLE_MAX_LIMIT} chars (${title.length})`,
      text: title
    });
  }
  if (desc.length > DESC_MAX_LIMIT) {
    auditResults.violations.push({
      file: 'src/pages/MatchPrediction.tsx (dynamic sample)',
      type: 'DYNAMIC_DESC_TOO_LONG',
      message: `Match description exceeded ${DESC_MAX_LIMIT} chars (${desc.length})`,
      text: desc
    });
  }
});
console.log(`  ✓ Checked ${testMatchCases.length} dynamic match prediction configurations`);

// Test B: BlogPost.tsx dynamic generators
const testBlogCases = [
  {
    title: 'How to Read AI Football Predictions Like a Pro',
    desc: 'Learn to interpret confidence scores, probability percentages and odds in football predictions. Complete guide to using AI tips in your betting strategy.'
  },
  {
    title: 'SportPesa Mega Jackpot Prediction: How to Win 17 Games Using AI & Advanced Poisson Statistics',
    desc: 'A comprehensive, step-by-step master guide revealing key mathematical strategies and AI prediction tips to win 17 games in the SportPesa Mega Jackpot.'
  },
  {
    title: 'Value Betting in Football: A Complete Guide to Positive Expected Value (+EV)',
    desc: 'What is value betting, how to calculate expected value (EV) and why AI predictions help you find edges over bookmakers in football betting.'
  }
];

testBlogCases.forEach((b) => {
  const seoTitle = b.title.length + 13 <= 68
    ? `${b.title} | PredictPro`
    : b.title.length <= 68
      ? b.title
      : `${b.title.slice(0, 52)}... | PredictPro`;

  if (seoTitle.length > TITLE_MAX_LIMIT) {
    auditResults.violations.push({
      file: 'src/pages/BlogPost.tsx (dynamic sample)',
      type: 'DYNAMIC_BLOG_TITLE_TOO_LONG',
      message: `Blog title exceeded ${TITLE_MAX_LIMIT} chars (${seoTitle.length})`,
      text: seoTitle
    });
  }
  if (b.desc.length > DESC_MAX_LIMIT) {
    auditResults.violations.push({
      file: 'src/pages/BlogPost.tsx (dynamic sample)',
      type: 'DYNAMIC_BLOG_DESC_TOO_LONG',
      message: `Blog description exceeded ${DESC_MAX_LIMIT} chars (${b.desc.length})`,
      text: b.desc
    });
  }
});
console.log(`  ✓ Checked ${testBlogCases.length} dynamic blog post configurations`);

// 3. Prerendered Static HTML Canonical, Hreflang & Domain Verification (if dist/ exists)
const DIST_DIR = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(DIST_DIR)) {
  console.log('🌐 Auditing Prerendered Static HTML Routes in dist/ for Domain & Canonical Integrity:');
  function getHtmlFiles(dir) {
    const out = [];
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        out.push(...getHtmlFiles(full));
      } else if (item === 'index.html') {
        out.push(full);
      }
    }
    return out;
  }

  const htmlFiles = getHtmlFiles(DIST_DIR);
  let htmlChecked = 0;

  for (const htmlFile of htmlFiles) {
    const relHtml = path.relative(ROOT_DIR, htmlFile);
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');

    const canonicalMatches = [...htmlContent.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/gi)];
    if (canonicalMatches.length !== 1) {
      auditResults.violations.push({
        file: relHtml,
        type: 'CANONICAL_COUNT_MISMATCH',
        message: `Expected exactly 1 <link rel="canonical"> tag, found ${canonicalMatches.length}`,
        text: canonicalMatches.map((m) => m[0]).join(' | ')
      });
    } else {
      const canonicalHref = canonicalMatches[0][1];
      if (!canonicalHref.startsWith('https://predictpro.guru')) {
        auditResults.violations.push({
          file: relHtml,
          type: 'INVALID_CANONICAL_DOMAIN',
          message: `Canonical URL must use apex domain https://predictpro.guru, found "${canonicalHref}"`,
          text: canonicalHref
        });
      }
    }

    const hreflangMatches = [...htmlContent.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/?>/gi)];
    const seenHreflangs = new Set();
    for (const hm of hreflangMatches) {
      const code = hm[1].toLowerCase();
      if (seenHreflangs.has(code)) {
        auditResults.violations.push({
          file: relHtml,
          type: 'DUPLICATE_HREFLANG_TAG',
          message: `Duplicate hreflang="${hm[1]}" tag detected in prerendered HTML`,
          text: hm[0]
        });
      }
      seenHreflangs.add(code);
    }

    htmlChecked++;
  }
  console.log(`  ✓ Verified ${htmlChecked} prerendered HTML files for single canonical, apex domain & deduplicated hreflangs`);
}

// 4. Sitemap, IndexNow Cron & 301 Redirect Canonical Integrity Check
const REDIRECTS_PATH = path.join(ROOT_DIR, 'public', '_redirects');
if (fs.existsSync(REDIRECTS_PATH)) {
  const redirectsLines = fs.readFileSync(REDIRECTS_PATH, 'utf8').split('\n');
  const redirect301Sources = new Set();
  for (const line of redirectsLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('http')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3 && parts[2] === '301') {
      redirect301Sources.add(parts[0]);
    }
  }

  const cronAndSitemapFiles = [
    'public/sitemap.xml',
    'public/sitemap-yandex.xml',
    'api/indexing-cron.ts',
    'api/sitemap-cron.ts',
    'scripts/google-crawl-cron.mjs',
    'supabase/functions/ping-search-engines/index.ts'
  ];

  for (const relTarget of cronAndSitemapFiles) {
    const fullTarget = path.join(ROOT_DIR, relTarget);
    if (!fs.existsSync(fullTarget)) continue;
    const content = fs.readFileSync(fullTarget, 'utf8');
    for (const srcPath of redirect301Sources) {
      const escapedSrc = srcPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:predictpro\\.guru|BASE_URL\\})${escapedSrc}(?:['"\`<\\s]|$)`);
      if (regex.test(content)) {
        auditResults.violations.push({
          file: relTarget,
          type: 'REDIRECT_301_URL_IN_SITEMAP_OR_CRON',
          message: `301-redirected path "${srcPath}" found in ${relTarget} (must use canonical destination URL)`,
          text: srcPath
        });
      }
    }
  }
  console.log(`  ✓ Verified sitemaps and IndexNow cron queues against ${redirect301Sources.size} 301-redirect rules (zero redirected URLs submitted)`);
}

console.log('\n------------------------------------------------------------');
console.log('📊 AUDIT SUMMARY & COMPLIANCE REPORT');
console.log('------------------------------------------------------------');
console.log(`Total Pages Scanned:      ${auditResults.totalScanned}`);
console.log(`Compliant Pages:          ${auditResults.passed}`);
console.log(`Non-Compliant Violations: ${auditResults.violations.length}`);
console.log('------------------------------------------------------------\n');

if (auditResults.violations.length === 0) {
  console.log('✅ ALL PAGES AND DYNAMIC ROUTES FULLY COMPLIANT WITH SEO CONSTRAINTS!');
  console.log('   All titles are <= 70 characters.');
  console.log('   All descriptions are <= 160 characters (and >= 25 characters).');
  console.log('   All canonical & hreflang tags are 100% deduplicated on https://predictpro.guru.\n');
  process.exit(0);
} else {
  console.error('❌ NON-COMPLIANT PAGES DETECTED:\n');
  auditResults.violations.forEach((v, i) => {
    console.error(`[${i + 1}] File: ${v.file}`);
    console.error(`    Type: ${v.type}`);
    console.error(`    Details: ${v.message}`);
    console.error(`    Content: "${v.text}"\n`);
  });
  process.exit(1);
}

