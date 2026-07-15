/**
 * App runtime config
 * - Reads VERIFY_JWT from the environment
 * - Defaults to false so production remains operational while we debug JWT shape
 */
export const VERIFY_JWT = process.env.VERIFY_JWT === 'true';
export const APP_CANONICAL_HOST = process.env.APP_CANONICAL_HOST ?? 'www.predictpro.guru';

if (typeof window === 'undefined') {
  // Node/server startup log
  // eslint-disable-next-line no-console
  console.info(`[config] VERIFY_JWT=${VERIFY_JWT} APP_CANONICAL_HOST=${APP_CANONICAL_HOST}`);
}
