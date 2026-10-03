# Deployment Fixes

This deployment has been updated to:
- Use Bun as the package manager (matching `bun.lock`)
- Fix Vercel cron schedule to comply with Hobby plan limits (daily instead of every 30min)
- Use GitHub Actions secrets for Vercel authentication

## Required Secrets

Ensure these are configured in GitHub Actions:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`

## Deployment Workflow

The deploy workflow now:
1. ✅ Uses `oven-sh/setup-bun@v2` to set up Bun
2. ✅ Installs dependencies with `bun install --frozen-lockfile`
3. ✅ Builds with `bun run build`
4. ✅ Deploys to Supabase edge functions
5. ✅ Deploys to Vercel with production build
