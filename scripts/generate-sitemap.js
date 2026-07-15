const fs = require('fs');
const path = require('path');
const hostname = 'https://www.predictpro.guru';

// Static routes to include in sitemap. Extend or generate dynamically as needed.
const routes = [
  '/',
  '/value-bets',
  '/shop',
  '/predictions'
];

const urls = routes.map(r => `  <url><loc>${hostname}${r}</loc><changefreq>daily</changefreq></url>`).join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

fs.mkdirSync(path.resolve(__dirname, '../public'), { recursive: true });
fs.writeFileSync(path.resolve(__dirname, '../public/sitemap.xml'), xml);
console.info('sitemap written to public/sitemap.xml');
