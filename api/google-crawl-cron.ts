// Vercel Serverless / Edge Function: Google Crawl Cron
// Re-exports the shared indexing handler. The explicit .js extension is
// required because tsconfig uses moduleResolution node16/nodenext, where
// relative ESM imports must carry an extension (TS2835). It still resolves
// to ./indexing-cron.ts at build time.
export { default, config } from './indexing-cron.js';
