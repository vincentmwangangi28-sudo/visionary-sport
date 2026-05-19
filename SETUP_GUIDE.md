# Visionary Sport — Complete Automated Setup

A production-ready bash automation script that sets up **Visionary Sport** with Google OAuth, Supabase, secure webhooks, and end-to-end infrastructure.

## 🚀 Quick Start

```bash
bash setup-everything.sh
```

Run from your project root (where `package.json` is located).

---

## 📋 What This Script Does

### ✅ Step 1: Code Fixes & Architecture (3 min)
- **`.gitignore`** — Adds `.env` safety (never commit secrets)
- **`.env.example`** — Template for environment variables
- **`tsconfig.app.json`** — Strict TypeScript (`noImplicitAny`, `noUnusedLocals`, etc.)
- **`src/lib/queryKeys.ts`** — React Query cache key factory
- **`src/components/ErrorBoundary.tsx`** — Global error fallback UI
- **`src/components/SEO.tsx`** — Helmet OG meta tags
- **`src/hooks/useAuth.tsx`** — Google OAuth + email/password + profile sync
- **`src/pages/Auth.tsx`** — Beautiful auth page with Google button
- **`src/hooks/useLiveMatches.tsx`** — 30s cached live match feed
- **`src/hooks/usePredictions.tsx`** — Paginated predictions with realtime
- **`src/hooks/useFreeTierLimit.tsx`** — 3 free views/day enforcement
- **`src/components/PredictionCard.tsx`** — Confidence gauge + analytics
- **`src/lib/analytics.ts`** — Extends with prediction/payment/referral funnels
- **`supabase/functions/mpesa-webhook/index.ts`** — HMAC-SHA256 signature verification
- **`supabase/functions/update-prediction-results/index.ts`** — Cron task for match results
- **`supabase/migrations/**`** — DB indexes + Google OAuth trigger
- **`vitest.config.ts`** — Unit test setup with coverage
- **`SECRETS.md`** — Checklist for required environment variables

### ✅ Step 2: npm Install (2–5 min)
- Installs all dependencies silently
- Adds Vitest & testing libraries

### ✅ Step 3: Git Initialization (1 min)
- Initializes `.git` if needed
- Creates initial commit with all changes
- Removes any tracked `.env` files

### ✅ Step 4: GitHub Remote (1 min)
- Connects to your GitHub repo
- Pushes to `main` branch
- Handles existing remotes gracefully

### ✅ Step 5: Supabase Deployment (3–10 min)
- Runs database migrations (indexes + OAuth trigger)
- Deploys `update-prediction-results` edge function
- Generates & stores `MPESA_WEBHOOK_SECRET` and `CRON_SECRET`
- Shows you the secrets to save locally

### ✅ Step 6: Google OAuth Setup Guide (2 min)
- Prints step-by-step instructions for:
  - Creating OAuth 2.0 credentials in Google Cloud Console
  - Connecting them to Supabase
  - Rotating your anon key (because `.env` was staged to git)

---

## 🔐 Security Highlights

✅ **Authentication**
- Google OAuth with PKCE flow
- Email/password with Supabase Auth
- Auto profile sync from OAuth metadata

✅ **Payments (M-Pesa)**
- HMAC-SHA256 webhook signature verification
- Constant-time comparison (no timing attacks)

✅ **Code Quality**
- TypeScript strict mode
- React Query for cache consistency
- Error boundary for unhandled exceptions

---

## 🎯 Architecture

```
Frontend → Supabase Auth (Google/Email)
              ↓
         React Query Cache
              ↓
         Realtime Subscriptions
              ↓
         Edge Functions (Webhooks/Cron)
```

---

## 🚀 Next Steps

1. Run `bash setup-everything.sh`
2. Follow the interactive prompts
3. Deploy to Vercel
4. Configure M-Pesa webhook

---

## 📞 Support

- Check **SECRETS.md** for env var checklist
- Review Supabase logs in Dashboard
- Enable debug: `DEBUG=* npm run dev`
