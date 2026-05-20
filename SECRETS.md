# Required Supabase Secrets

Set via: `supabase secrets set KEY=value`

| Secret | Required | Description |
|--------|----------|-------------|
| `LOVABLE_API_KEY` | ✅ | AI gateway key for Gemini |
| `X_RAPIDAPI_KEY` | ✅ | API-Football / RapidAPI key |
| `MPESA_WEBHOOK_SECRET` | ✅ | HMAC secret from Safaricom/Lipana dashboard |
| `CRON_SECRET` | ✅ | Random string — protects cron endpoints |
| `FOOTBALL_DATA_API_TOKEN` | Optional | football-data.org token |

## After setup, deploy the new edge function:
```bash
supabase functions deploy update-prediction-results
supabase db push
```

## ⚠️  Rotate your Supabase anon key
Your old .env was committed to git. Go to:
Supabase Dashboard → Project Settings → API → Regenerate anon key
