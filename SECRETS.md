# PredictPro — Secrets & Environment Setup

## GitHub Actions Secrets
Add these at: **github.com/vincentmwangangi28-sudo/visionary-sport → Settings → Secrets → Actions → New repository secret**

| Secret Name | Value | Where to get it |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | `sbp_xxxx` | supabase.com → Account → Access Tokens → Generate |
| `SUPABASE_PROJECT_ID` | `yofhrfahhzsxbtuhuwqf` | Already known |
| `VITE_SUPABASE_URL` | `https://yofhrfahhzsxbtuhuwqf.supabase.co` | Already known |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Dashboard → Settings → API → anon key |
| `MPESA_WEBHOOK_SECRET` | _(auto-generated on first deploy)_ | Run `openssl rand -hex 32` |
| `CRON_SECRET` | _(auto-generated on first deploy)_ | Run `openssl rand -hex 32` |
| `LIPANA_SECRET_KEY` | `lip_xxx` | lipana.dev → Dashboard → API Keys |
| `LOVABLE_API_KEY` | `sk-xxx` | Your Gemini/Lovable API key |
| `X_RAPIDAPI_KEY` | `xxx` | rapidapi.com → My Apps → API-Football |
| `RESEND_API_KEY` | `re_xxx` | resend.com → API Keys (free tier available) |

## How to get a Supabase Access Token
1. Go to **supabase.com** and sign in
2. Click your avatar (top right) → **Account**
3. Click **Access Tokens** → **Generate new token**
4. Name it "GitHub Actions" and copy it (starts with `sbp_`)
5. Add it as `SUPABASE_ACCESS_TOKEN` in GitHub secrets

## Supabase Cron Schedules
After first deploy, add these in: **Supabase Dashboard → Edge Functions → Schedules**

| Function | Cron | Description |
|---|---|---|
| `cron-hourly-fixtures` | `0 * * * *` | Refresh live matches every hour |
| `cron-daily-predictions` | `0 6 * * *` | Generate AI predictions at 6am |
| `cron-subscription-reminders` | `0 9 * * *` | Email expiry reminders at 9am |
| `update-prediction-results` | `0 23 * * *` | Resolve match outcomes at 11pm |

## Make yourself Admin
Run this SQL in **Supabase Dashboard → SQL Editor** (replace with your user UUID):
```sql
insert into user_roles (user_id, role) values ('<your-uuid>', 'admin')
on conflict do nothing;
```
Find your UUID: Supabase Dashboard → Auth → Users → click your email

## Rotate Supabase Anon Key (important!)
Old key was committed to git. Go to:
**Supabase Dashboard → Project Settings → API → Reveal → Regenerate**
Then update `VITE_SUPABASE_ANON_KEY` in GitHub secrets.
