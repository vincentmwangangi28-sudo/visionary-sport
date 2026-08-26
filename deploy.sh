#!/usr/bin/env bash
set -e

PROJECT_ID="yofhrfahhzsxbtuhuwqf"
REGION="eu-west-2"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       PredictPro — Full Deploy Script        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Check Supabase CLI is installed ─────────────────────────────────────
if ! command -v supabase &> /dev/null; then
  echo "▶ Installing Supabase CLI..."
  npm install -g supabase
fi

# ── 2. Login check ─────────────────────────────────────────────────────────
echo "▶ Checking Supabase login..."
if ! supabase projects list &>/dev/null; then
  echo "  Not logged in. Run: supabase login"
  exit 1
fi
echo "  ✓ Logged in"

# ── 3. Link project ────────────────────────────────────────────────────────
echo "▶ Linking to project $PROJECT_ID..."
supabase link --project-ref "$PROJECT_ID"
echo "  ✓ Linked"

# ── 4. Apply DB migrations ─────────────────────────────────────────────────
echo "▶ Pushing DB migrations..."
supabase db push
echo "  ✓ Migrations applied"

# ── 5. Set secrets ─────────────────────────────────────────────────────────
echo ""
echo "▶ Setting secrets..."

set_secret() {
  local KEY=$1
  local PROMPT=$2
  local DEFAULT=$3

  if supabase secrets list 2>/dev/null | grep -q "^$KEY"; then
    echo "  ✓ $KEY already set — skipping"
    return
  fi

  if [ -n "$DEFAULT" ]; then
    VALUE="$DEFAULT"
  else
    echo -n "  Enter $PROMPT: "
    read -r VALUE
  fi

  if [ -n "$VALUE" ]; then
    supabase secrets set "$KEY=$VALUE"
    echo "  ✓ $KEY set"
  else
    echo "  ⚠ $KEY skipped (empty)"
  fi
}

# Auto-generate random secrets
set_secret "MPESA_WEBHOOK_SECRET" "M-Pesa webhook secret" "$(openssl rand -hex 32)"
set_secret "CRON_SECRET" "Cron secret" "$(openssl rand -hex 32)"
set_secret "RESEND_API_KEY" "Resend API key (for subscription emails) — get one free at resend.com" ""
set_secret "LIPANA_SECRET_KEY" "Lipana API key (from lipana.dev dashboard)" ""
set_secret "LOVABLE_API_KEY" "AI gateway key (Gemini/Lovable)" ""
set_secret "X_RAPIDAPI_KEY" "RapidAPI key (API-Football)" ""

echo "  ✓ Secrets configured"

# ── 6. Deploy edge functions ───────────────────────────────────────────────
echo ""
echo "▶ Deploying edge functions..."

FUNCTIONS=(
  "generate-prediction"
  "fetch-live-matches"
  "fetch-upcoming-matches"
  "generate-daily-predictions"
  "fetch-user-performance"
  "mpesa-stk-push"
  "mpesa-webhook"
  "generate-sitemap"
  "fetch-api-football"
  "cron-hourly-fixtures"
  "cron-daily-predictions"
  "daily-predictions-automation"
  "update-prediction-results"
  "cron-subscription-reminders"
  "apply-referral-on-signup"
)

for FN in "${FUNCTIONS[@]}"; do
  echo -n "  Deploying $FN... "
  supabase functions deploy "$FN" --no-verify-jwt 2>/dev/null || \
  supabase functions deploy "$FN" 2>/dev/null && echo "✓" || echo "⚠ skipped"
done

echo ""
echo "▶ Scheduling cron jobs..."
cat << 'CRON'

  Add these schedules in Supabase Dashboard → Edge Functions → Schedules:

  Function                        Schedule          Description
  ──────────────────────────────  ────────────────  ──────────────────────────────────
  cron-hourly-fixtures            0 * * * *         Refresh live match data hourly
  cron-daily-predictions          0 6 * * *         Generate AI predictions at 6am
  cron-subscription-reminders     0 9 * * *         Email users 3 days before expiry
  update-prediction-results       0 23 * * *        Resolve finished match outcomes

CRON

# ── 7. Build front-end ─────────────────────────────────────────────────────
echo "▶ Building frontend..."
npm run build
echo "  ✓ Build successful"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║               Deploy Complete!               ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                              ║"
echo "║  ⚠  Manual steps remaining:                 ║"
echo "║                                              ║"
echo "║  1. Rotate Supabase anon key:                ║"
echo "║     Dashboard → Settings → API → Regenerate ║"
echo "║                                              ║"
echo "║  2. Enable Google OAuth:                     ║"
echo "║     Dashboard → Auth → Providers → Google   ║"
echo "║                                              ║"
echo "║  3. Add /admin role to your user:            ║"
echo "║     SQL: insert into user_roles(user_id,     ║"
echo "║     role) values('<your-uuid>','admin');      ║"
echo "║                                              ║"
echo "║  4. Set cron schedules in dashboard          ║"
echo "║     (see table above)                        ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
