// Vercel Serverless / Edge Function: Google Crawl Cron
import handler from './indexing-cron.js';

export const config = {
  runtime: 'edge',
};

export default handler;

