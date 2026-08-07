### What I changed
- Planned changes will replace mock fallbacks with real API calls to API-Football (via RapidAPI) in Supabase functions and wire odds where available.
- I will also update the PredictionCard UI to surface Correct Score & Double Chance prominently on mobile device cards.

### Migration notes
- New environment variables required in Vercel/Supabase project settings:
  - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  - RAPIDAPI_KEY
  - CRON_SECRET
  - VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID (optional for triggering deploys)

### Next steps
- I need repo write permission to push workflow and code changes, or you can merge my branch when I open the PR.
- If you prefer, I can instead prepare patches for you to apply locally.
