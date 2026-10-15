import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('src/pages').filter(f => f.endsWith('.tsx'));
const pageData = [];

for (const f of files) {
  const content = fs.readFileSync(path.join('src/pages', f), 'utf8');
  const seoBlocks = Array.from(content.matchAll(/<SEO([\s\S]*?)\/>/g));
  if (seoBlocks.length === 0) {
    pageData.push({ file: f, title: '(NO SEO TAG)', desc: '(NO SEO TAG)' });
    continue;
  }
  seoBlocks.forEach((b, idx) => {
    const raw = b[1];
    let title = (raw.match(/title="([^"]+)"/) || [])[1] || (raw.match(/title={`([^`]+)`}/) || [])[1] || (raw.match(/title={([^}]+)}/) || [])[1] || '';
    let desc = (raw.match(/description="([^"]+)"/) || [])[1] || (raw.match(/description={`([^`]+)`}/) || [])[1] || (raw.match(/description={([^}]+)}/) || [])[1] || '';
    pageData.push({ file: f + (seoBlocks.length > 1 ? '#' + idx : ''), title, desc });
  });
}

const titles = {};
const descs = {};
pageData.forEach(p => {
  if (p.title) {
    titles[p.title] = titles[p.title] || [];
    titles[p.title].push(p.file);
  }
  if (p.desc) {
    descs[p.desc] = descs[p.desc] || [];
    descs[p.desc].push(p.file);
  }
});

console.log('--- Duplicate titles across pages ---');
console.log(Object.entries(titles).filter(([t, l]) => l.length > 1));
console.log('--- Duplicate descriptions across pages ---');
console.log(Object.entries(descs).filter(([d, l]) => l.length > 1));
console.log('--- Missing or empty titles ---');
console.log(pageData.filter(p => !p.title || p.title === '(NO SEO TAG)'));
console.log('--- Missing or empty descs ---');
console.log(pageData.filter(p => !p.desc || p.desc === '(NO SEO TAG)'));
