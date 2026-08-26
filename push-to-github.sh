#!/bin/bash
# ============================================================
# Push Visionary Sport to GitHub
# Usage: bash push-to-github.sh [github-repo-url]
# Example: bash push-to-github.sh https://github.com/yourname/visionary-sport.git
# ============================================================
set -e

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}→  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── 1. Get repo URL ──────────────────────────────────────────
REPO_URL="${1:-}"
if [ -z "$REPO_URL" ]; then
  # Try to read from existing remote
  EXISTING=$(git remote get-url origin 2>/dev/null || echo "")
  if [ -n "$EXISTING" ]; then
    REPO_URL="$EXISTING"
    echo -e "${YELLOW}Using existing remote: ${REPO_URL}${NC}"
  else
    echo -e "${BOLD}Enter your GitHub repo URL:${NC}"
    echo "  Example: https://github.com/yourname/visionary-sport.git"
    read -p "> " REPO_URL
    [ -z "$REPO_URL" ] && err "No repo URL provided."
  fi
fi

# ── 2. Init git if needed ────────────────────────────────────
if [ ! -d ".git" ]; then
  info "Initialising git repository..."
  git init
  git branch -M main
  ok "Git initialised"
fi

# ── 3. Set remote ────────────────────────────────────────────
if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REPO_URL"
  info "Remote updated to $REPO_URL"
else
  git remote add origin "$REPO_URL"
  info "Remote added: $REPO_URL"
fi

# ── 4. Verify .env is gitignored ─────────────────────────────
if git ls-files --error-unmatch .env &>/dev/null 2>&1; then
  info "Removing .env from git tracking..."
  git rm --cached .env
fi

# ── 5. Stage and commit ──────────────────────────────────────
info "Staging all changes..."
git add -A

# Check if there's anything to commit
if git diff --cached --quiet; then
  ok "Nothing new to commit — already up to date."
else
  git commit -m "feat: Google OAuth, ErrorBoundary, paginated predictions, DB indexes, secured cron/webhooks, tests

- Google OAuth login/signup via Supabase (signInWithGoogle in useAuth)
- OAuth profile sync: avatar + display name saved to profiles table
- Updated handle_new_user trigger to support Google metadata
- ErrorBoundary wrapping entire app
- Centralized queryKeys (src/lib/queryKeys.ts)
- useLiveMatches: React Query with 30s staleTime/refetchInterval
- usePredictions: paginated (10/page), prefetches next page
- PredictionCard: radial SVG confidence gauge (🟢🟡🔴)
- useFreeTierLimit hook: 3 free predictions/day for non-premium
- SEO component with Open Graph tags for WhatsApp sharing
- New edge function: update-prediction-results (closes result loop)
- mpesa-webhook: HMAC-SHA256 signature verification
- cron functions: CRON_SECRET header guard
- DB indexes: predictions, user_predictions, transactions
- Vitest setup with 3 unit test files
- GA4 funnel events: prediction_unlocked, payment_success, free_limit_hit
- TypeScript strict mode enabled
- .env removed from git, .env.example added"
  ok "Committed"
fi

# ── 6. Push ──────────────────────────────────────────────────
info "Pushing to GitHub (branch: main)..."
git push -u origin main

echo ""
echo -e "${BOLD}${GREEN}════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  Pushed to GitHub! 🚀                       ${NC}"
echo -e "${BOLD}${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Now enable Google OAuth in Supabase:${NC}"
echo "  1. Go to: Supabase Dashboard → Authentication → Providers → Google"
echo "  2. Toggle Google ON"
echo "  3. Paste your Google Client ID + Secret"
echo "     (Get them at: console.cloud.google.com → APIs & Services → Credentials)"
echo "  4. Add Authorized redirect URI in Google Console:"
echo "     https://<your-project>.supabase.co/auth/v1/callback"
echo ""
echo -e "${YELLOW}Then run:${NC}"
echo "  supabase db push                                    # apply migrations"
echo "  supabase functions deploy update-prediction-results # deploy new function"
echo "  supabase secrets set MPESA_WEBHOOK_SECRET=<random>"
echo "  supabase secrets set CRON_SECRET=<random>"
echo ""
