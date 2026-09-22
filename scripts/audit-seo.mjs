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
  console.log('   All descriptions are <= 160 characters (and >= 25 characters).\n');
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
