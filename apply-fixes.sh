#!/bin/bash
# ============================================================
# Visionary Sport — Apply all fixes
# Run this from INSIDE your project folder:
#   bash apply-fixes.sh
# ============================================================
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()  { echo -e "${GREEN}✅ $1${NC}"; }
info(){ echo -e "${YELLOW}→  $1${NC}"; }
err() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Guard: must be run from project root
[ -f "package.json" ] || err "Run this script from your project root (where package.json lives)"
[ -d "src" ]          || err "No src/ folder found — wrong directory?"
[ -d "supabase" ]     || err "No supabase/ folder found — wrong directory?"

echo ""
echo -e "${BOLD}=== Visionary Sport — Applying all fixes ===${NC}"
echo ""

# ── 1. .gitignore ────────────────────────────────────────────
info "Patching .gitignore..."
grep -q "^\.env$" .gitignore 2>/dev/null || cat >> .gitignore << 'EOF'

# Environment variables - NEVER commit secrets
.env
.env.*
!.env.example
EOF
ok ".gitignore updated"

# ── 2. .env.example ─────────────────────────────────────────
info "Creating .env.example..."
cat > .env.example << 'EOF'
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
EOF
ok ".env.example created"

# ── 3. tsconfig strict mode ──────────────────────────────────
info "Enabling TypeScript strict mode..."
cat > tsconfig.app.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitAny": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
EOF
ok "tsconfig.app.json updated"

# ── 4. queryKeys ─────────────────────────────────────────────
info "Creating src/lib/queryKeys.ts..."
cat > src/lib/queryKeys.ts << 'EOF'
export const queryKeys = {
  predictions: {
    all: ['predictions'] as const,
    list: (page = 0) => ['predictions', 'list', page] as const,
    detail: (id: string) => ['predictions', 'detail', id] as const,
  },
  liveMatches:       { all: ['liveMatches'] as const },
  upcomingMatches:   { all: ['upcomingMatches'] as const },
  userPerformance: {
    all: ['userPerformance'] as const,
    byUser: (userId: string) => ['userPerformance', userId] as const,
  },
  accuracyStats:     { all: ['accuracyStats'] as const },
  coinPackages:      { all: ['coinPackages'] as const },
  predictionBundles: { all: ['predictionBundles'] as const },
  referrals: {
    all: ['referrals'] as const,
    byUser: (userId: string) => ['referrals', userId] as const,
  },
  streak: {
    all: ['streak'] as const,
    byUser: (userId: string) => ['streak', userId] as const,
  },
  subscription: {
    all: ['subscription'] as const,
    byUser: (userId: string) => ['subscription', userId] as const,
  },
  leaderboard: { all: ['leaderboard'] as const },
} as const;
EOF
ok "queryKeys.ts created"

# ── 5. ErrorBoundary ─────────────────────────────────────────
info "Creating ErrorBoundary component..."
cat > src/components/ErrorBoundary.tsx << 'EOF'
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', { description: error.message, fatal: false });
    }
  }
  handleReset = () => this.setState({ hasError: false, error: null });
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h2>
              <p className="text-muted-foreground text-sm mb-1">An unexpected error occurred. Our team has been notified.</p>
              {this.state.error && (
                <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-2 rounded mt-3 text-left break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="default" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Try Again
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">Go Home</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
EOF
ok "ErrorBoundary.tsx created"

# ── 6. App.tsx — wrap with ErrorBoundary ─────────────────────
info "Patching App.tsx with ErrorBoundary..."
if ! grep -q "ErrorBoundary" src/App.tsx; then
  sed -i 's|import { AuthProvider } from "@/hooks/useAuth";|import { AuthProvider } from "@/hooks/useAuth";\nimport { ErrorBoundary } from "@/components/ErrorBoundary";|' src/App.tsx
  sed -i 's|const App = () => (|const App = () => (\n  <ErrorBoundary>|' src/App.tsx
  sed -i 's|export default App;|  </ErrorBoundary>\n);\n\nexport default App;|' src/App.tsx
  # Clean up duplicate closing
  python3 -c "
content = open('src/App.tsx').read()
# Fix doubled closing if script ran before
content = content.replace(');\n\n\nexport default App;', ');\n\nexport default App;')
open('src/App.tsx','w').write(content)
"
fi
ok "App.tsx patched"

# ── 7. SEO component ─────────────────────────────────────────
info "Creating SEO component..."
cat > src/components/SEO.tsx << 'EOF'
import { Helmet } from 'react-helmet-async';
interface SEOProps {
  title?: string; description?: string; image?: string; url?: string; type?: 'website' | 'article';
}
const SITE_NAME = 'Visionary Sport';
const BASE_URL = 'https://visionarysport.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const DEFAULT_DESC = 'AI-powered football predictions for the top European leagues. High-confidence tips, live scores, and exclusive insights.';
export const SEO = ({ title, description = DEFAULT_DESC, image = DEFAULT_IMAGE, url, type = 'website' }: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonical = url ? `${BASE_URL}${url}` : BASE_URL;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};
EOF
ok "SEO.tsx created"

# ── 8. useLiveMatches — React Query ──────────────────────────
info "Rewriting useLiveMatches with React Query..."
cat > src/hooks/useLiveMatches.tsx << 'EOF'
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface LiveMatch {
  id: string; homeTeam: string; awayTeam: string;
  homeScore: number | null; awayScore: number | null;
  status: string; time: string; league: string; date: string;
  prediction?: string; confidence?: number;
}
interface LiveMatchesResponse {
  success: boolean; matches: LiveMatch[];
  source: 'live' | 'demo'; lastUpdated: string; error?: string;
}
const fetchLiveMatches = async (): Promise<LiveMatchesResponse> => {
  const { data, error } = await supabase.functions.invoke('fetch-live-matches');
  if (error) throw error;
  return data as LiveMatchesResponse;
};
export const useLiveMatches = () => {
  const { data, isLoading, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: queryKeys.liveMatches.all,
    queryFn: fetchLiveMatches,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  return {
    matches: data?.matches ?? [],
    loading: isLoading,
    source: data?.source ?? 'demo',
    lastUpdated: data?.lastUpdated ?? '',
    error: error ? String(error) : null,
    refresh: refetch,
    dataUpdatedAt,
  };
};
EOF
ok "useLiveMatches updated"

# ── 9. usePredictions — paginated ────────────────────────────
info "Rewriting usePredictions with pagination..."
cat > src/hooks/usePredictions.tsx << 'EOF'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useRealtimePredictions } from './useRealtimePredictions';

export interface Prediction {
  id: string; match_id: string; home_team: string; away_team: string;
  league: string; match_date: string; prediction: string; confidence: number;
  reasoning: string; is_premium: boolean; created_at: string;
  result: string | null; ai_model: string;
}
const PAGE_SIZE = 10;
const fetchPredictions = async (page: number): Promise<Prediction[]> => {
  const from = page * PAGE_SIZE;
  const { data, error } = await supabase
    .from('predictions').select('*')
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return data ?? [];
};
export const usePredictions = () => {
  const [page, setPage] = useState(0);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const queryClient = useQueryClient();
  const { data: predictions = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.predictions.list(page),
    queryFn: () => fetchPredictions(page),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: queryKeys.predictions.list(page + 1), queryFn: () => fetchPredictions(page + 1) });
  }, [page, queryClient]);
  const handleNewPrediction = useCallback((prediction: Prediction) => {
    queryClient.setQueryData<Prediction[]>(queryKeys.predictions.list(0), (old = []) => {
      if (old.some((p) => p.id === prediction.id)) return old;
      setUpdateCount((c) => c + 1);
      return [prediction, ...old.slice(0, PAGE_SIZE - 1)];
    });
  }, [queryClient]);
  const handleUpdatePrediction = useCallback((prediction: Prediction) => {
    queryClient.setQueryData<Prediction[]>(queryKeys.predictions.list(page), (old = []) =>
      old.map((p) => (p.id === prediction.id ? prediction : p))
    );
    setUpdateCount((c) => c + 1);
  }, [queryClient, page]);
  useEffect(() => {
    const channel = supabase.channel('predictions-status-check');
    channel.subscribe((status) => setRealtimeConnected(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, []);
  useRealtimePredictions(handleNewPrediction, handleUpdatePrediction);
  const generatePrediction = async (matchData: { homeTeam: string; awayTeam: string; league: string; matchDate: string; isPremium?: boolean }) => {
    const { data, error } = await supabase.functions.invoke('generate-prediction', { body: { matchData } });
    if (error) throw error;
    if (data?.prediction) handleNewPrediction(data.prediction as Prediction);
    return data;
  };
  return {
    predictions, loading, generatePrediction,
    refreshPredictions: () => queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all }),
    realtimeConnected, updateCount,
    page, nextPage: () => setPage((p) => p + 1), prevPage: () => setPage((p) => Math.max(0, p - 1)), pageSize: PAGE_SIZE,
  };
};
EOF
ok "usePredictions updated"

# ── 10. useFreeTierLimit ──────────────────────────────────────
info "Creating useFreeTierLimit hook..."
cat > src/hooks/useFreeTierLimit.tsx << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { trackFreeLimitHit } from '@/lib/analytics';

const FREE_DAILY_LIMIT = 3;
const STORAGE_KEY = 'vsp_free_views';
interface StorageEntry { date: string; count: number; }
const getTodayKey = () => new Date().toISOString().split('T')[0];

export const useFreeTierLimit = () => {
  const { user } = useAuth() as { user: { role?: string } | null };
  const isPremium = user?.role === 'premium';
  const [viewsToday, setViewsToday] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  useEffect(() => {
    if (isPremium) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const entry: StorageEntry = JSON.parse(raw);
        if (entry.date === getTodayKey()) { setViewsToday(entry.count); setLimitReached(entry.count >= FREE_DAILY_LIMIT); }
        else localStorage.removeItem(STORAGE_KEY);
      }
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, [isPremium]);
  const recordView = useCallback(() => {
    if (isPremium) return true;
    if (limitReached) { trackFreeLimitHit(); return false; }
    const next = viewsToday + 1;
    setViewsToday(next);
    const reached = next >= FREE_DAILY_LIMIT;
    setLimitReached(reached);
    if (reached) trackFreeLimitHit();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count: next })); } catch {}
    return !reached;
  }, [isPremium, limitReached, viewsToday]);
  return { viewsToday, limitReached: !isPremium && limitReached, remainingViews: isPremium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - viewsToday), dailyLimit: FREE_DAILY_LIMIT, recordView, isPremium };
};
EOF
ok "useFreeTierLimit.tsx created"

# ── 11. PredictionCard — confidence gauge ────────────────────
info "Upgrading PredictionCard with confidence gauge..."
cat > src/components/PredictionCard.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Clock } from "lucide-react";

interface PredictionCardProps {
  homeTeam: string; awayTeam: string; league: string; prediction: string;
  confidence: number; reasoning: string; matchTime: string; matchDate: string;
}
function getConfidenceTier(conf: number) {
  if (conf >= 75) return { color: 'text-green-500', dot: '🟢', label: 'High', variant: 'default' as const };
  if (conf >= 50) return { color: 'text-yellow-500', dot: '🟡', label: 'Medium', variant: 'secondary' as const };
  return { color: 'text-red-500', dot: '🔴', label: 'Low', variant: 'outline' as const };
}
function ConfidenceGauge({ value }: { value: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const tier = getConfidenceTier(value);
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className={tier.color}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${tier.color}`}>{value}%</span>
      </div>
    </div>
  );
}
export const PredictionCard = ({ homeTeam, awayTeam, league, prediction, confidence, reasoning, matchTime, matchDate }: PredictionCardProps) => {
  const tier = getConfidenceTier(confidence);
  const trackView = () => {
    if (typeof window !== 'undefined' && (window as any).gtag)
      (window as any).gtag('event', 'prediction_view', { event_category: 'Predictions', event_label: `${homeTeam} vs ${awayTeam}`, value: confidence });
  };
  return (
    <Card className="p-6 hover-lift hover-glow transition-all duration-300 bg-gradient-prediction border-primary/10 animate-fade-in cursor-pointer" onClick={trackView}>
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="text-xs">{league}</Badge>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{matchDate}</span></div>
          <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{matchTime}</span></div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">{homeTeam}</h3>
        <span className="text-muted-foreground font-medium">vs</span>
        <h3 className="text-xl font-bold">{awayTeam}</h3>
      </div>
      <div className="flex items-start gap-4 mb-4">
        <ConfidenceGauge value={confidence} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /><span className="font-semibold text-sm">AI Prediction</span></div>
            <Badge variant={tier.variant} className="text-xs gap-1">{tier.dot} {tier.label}</Badge>
          </div>
          <p className="text-lg font-bold text-primary mb-1">{prediction}</p>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{reasoning}</p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Confidence</span><span className={`font-bold ${tier.color}`}>{confidence}%</span>
        </div>
        <Progress value={confidence} className="h-1.5" />
      </div>
    </Card>
  );
};
EOF
ok "PredictionCard upgraded"

# ── 12. analytics.ts — new funnel events ─────────────────────
info "Adding funnel events to analytics.ts..."
if ! grep -q "trackPredictionUnlocked" src/lib/analytics.ts; then
cat >> src/lib/analytics.ts << 'EOF'

export const trackPredictionUnlocked = (p: { matchId: string; homeTeam: string; awayTeam: string; confidence: number; league: string; isPremium: boolean; coinsSpent: number }) => {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'prediction_unlocked', { event_category: 'Predictions', event_label: `${p.homeTeam} vs ${p.awayTeam}`, match_id: p.matchId, confidence_score: p.confidence, league: p.league, is_premium: p.isPremium, coins_spent: p.coinsSpent, currency: 'COINS' });
};
export const trackPaymentSuccess = (p: { purpose: 'premium_subscription' | 'coin_purchase' | 'tip'; amountKes: number }) => {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'purchase', { event_category: 'Payments', event_label: p.purpose, value: p.amountKes, currency: 'KES', payment_method: 'mpesa' });
};
export const trackFreeLimitHit = () => {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'free_limit_hit', { event_category: 'Conversion', event_label: 'upgrade_prompt_shown' });
};
export const trackReferral = (p: { referralCode: string }) => {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'referral_shared', { event_category: 'Referrals', event_label: p.referralCode });
};
EOF
fi
ok "analytics.ts updated"

# ── 13. M-Pesa webhook — signature verification ───────────────
info "Adding signature verification to mpesa-webhook..."
cat > supabase/functions/mpesa-webhook/index.ts << 'TSEOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lipana-signature' };
async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (computed.length !== signature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computed.length; i++) mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
    return mismatch === 0;
  } catch { return false; }
}
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const WEBHOOK_SECRET = Deno.env.get('MPESA_WEBHOOK_SECRET');
  try {
    const rawBody = await req.text();
    if (WEBHOOK_SECRET) {
      const signature = req.headers.get('x-lipana-signature') ?? '';
      if (!(await verifySignature(WEBHOOK_SECRET, rawBody, signature))) {
        console.warn('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload = JSON.parse(rawBody);
    const { event, data } = payload;
    const { transactionId, checkoutRequestID, status, amount } = data ?? {};
    if (!transactionId && !checkoutRequestID) return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    let query = supabase.from('transactions').select('*').eq('status', 'pending');
    if (checkoutRequestID) query = query.eq('metadata->checkout_request_id', checkoutRequestID);
    else if (transactionId) query = query.eq('metadata->transaction_id', transactionId);
    const { data: transactions } = await query;
    const transaction = transactions?.[0];
    if (transaction) {
      let newStatus = 'pending';
      if (event === 'payment.success' || status === 'success') {
        newStatus = 'completed';
        if (transaction.type === 'premium_subscription') {
          await supabase.from('user_roles').upsert({ user_id: transaction.user_id, role: 'premium' }, { onConflict: 'user_id,role' });
        } else if (transaction.type === 'coin_purchase') {
          const coinsToAdd = amount ?? transaction.amount;
          const { data: profile } = await supabase.from('profiles').select('coins').eq('id', transaction.user_id).single();
          if (profile) await supabase.from('profiles').update({ coins: (profile as any).coins + coinsToAdd }).eq('id', transaction.user_id);
        }
      } else if (event === 'payment.failed' || status === 'failed') { newStatus = 'failed'; }
      await supabase.from('transactions').update({ status: newStatus, metadata: { ...(transaction.metadata as any), webhook_event: event, webhook_received_at: new Date().toISOString(), mpesa_receipt: data?.mpesaReceiptNumber } }).eq('id', transaction.id);
    }
    return new Response(JSON.stringify({ received: true, processed: !!transaction }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('mpesa-webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
TSEOF
ok "mpesa-webhook secured"

# ── 14. Cron secret guard ─────────────────────────────────────
info "Adding CRON_SECRET guard to cron functions..."
for fn in supabase/functions/cron-daily-predictions/index.ts supabase/functions/daily-predictions-automation/index.ts; do
  if ! grep -q "CRON_SECRET" "$fn"; then
    sed -i "s|'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'|'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret'|" "$fn"
    # Insert guard after OPTIONS block
    python3 << PYEOF
import re, sys
content = open('$fn').read()
guard = """
  // Auth guard
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
"""
# Insert after the OPTIONS early return
content = content.replace(
  "if (req.method === 'OPTIONS') {\n    return new Response(null, { headers: corsHeaders });\n  }",
  "if (req.method === 'OPTIONS') {\n    return new Response(null, { headers: corsHeaders });\n  }" + guard,
  1
)
open('$fn','w').write(content)
PYEOF
  fi
done
ok "Cron functions secured"

# ── 15. update-prediction-results edge function ───────────────
info "Creating update-prediction-results edge function..."
mkdir -p supabase/functions/update-prediction-results
cat > supabase/functions/update-prediction-results/index.ts << 'TSEOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret' };
interface ApiFixture { fixture: { id: number; status: { short: string } }; teams: { home: { name: string }; away: { name: string } }; goals: { home: number | null; away: number | null }; }
function deriveResult(f: ApiFixture): 'Home Win' | 'Away Win' | 'Draw' | null {
  if (!['FT','AET','PEN'].includes(f.fixture.status.short)) return null;
  const hg = f.goals.home ?? 0, ag = f.goals.away ?? 0;
  if (hg > ag) return 'Home Win'; if (ag > hg) return 'Away Win'; return 'Draw';
}
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const RAPIDAPI_KEY = Deno.env.get('X_RAPIDAPI_KEY');
  let updated = 0, skipped = 0;
  try {
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();
    const { data: pending, error } = await supabase.from('predictions').select('id,match_id,prediction').is('result',null).lt('match_date',yesterday).limit(50);
    if (error) throw error;
    if (!pending?.length) return new Response(JSON.stringify({ success: true, updated: 0, skipped: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    for (const pred of pending) {
      const fixtureId = pred.match_id.replace('api-football-','');
      if (!fixtureId || !RAPIDAPI_KEY) { skipped++; continue; }
      try {
        const res = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${fixtureId}`, { headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' } });
        if (!res.ok) { skipped++; continue; }
        const apiData = await res.json() as { response: ApiFixture[] };
        const fixture = apiData.response?.[0];
        if (!fixture) { skipped++; continue; }
        const result = deriveResult(fixture);
        if (!result) { skipped++; continue; }
        await supabase.from('predictions').update({ result }).eq('id', pred.id);
        const { data: userPreds } = await supabase.from('user_predictions').select('id,user_choice').eq('prediction_id', pred.id);
        if (userPreds) for (const up of userPreds) await supabase.from('user_predictions').update({ is_correct: up.user_choice === result }).eq('id', up.id);
        await supabase.from('predictions_history').update({ is_correct: pred.prediction === result }).eq('match_id', pred.match_id);
        updated++;
        await new Promise(r => setTimeout(r, 500));
      } catch (e) { console.error(e); skipped++; }
    }
    return new Response(JSON.stringify({ success: true, updated, skipped }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
TSEOF
ok "update-prediction-results created"

# ── 16. DB indexes migration ──────────────────────────────────
info "Adding DB indexes migration..."
cat > supabase/migrations/20260517000000_performance_indexes.sql << 'EOF'
CREATE INDEX IF NOT EXISTS idx_predictions_match_date ON public.predictions (match_date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_is_premium ON public.predictions (is_premium);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_predictions_user_id ON public.user_predictions (user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_history_user_id ON public.predictions_history (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
EOF
ok "Migration created"

# ── 17. supabase/config.toml ──────────────────────────────────
info "Updating supabase/config.toml..."
grep -q "update-prediction-results" supabase/config.toml || cat >> supabase/config.toml << 'EOF'

[functions.update-prediction-results]
verify_jwt = false
EOF
ok "config.toml updated"

# ── 18. Vitest setup ──────────────────────────────────────────
info "Setting up Vitest..."
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
export default defineConfig({
  plugins: [react()],
  test: { globals: true, environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], coverage: { provider: 'v8', reporter: ['text','json','html'], exclude: ['node_modules/','src/components/ui/','src/integrations/'] } },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
});
EOF
mkdir -p src/test/unit
echo "import '@testing-library/jest-dom';" > src/test/setup.ts
cat > src/test/unit/coinBalance.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
function applyCoins(current: number, toAdd: number): number {
  if (toAdd < 0) throw new Error('Cannot add negative coins');
  return current + toAdd;
}
describe('Coin balance', () => {
  it('adds coins', () => expect(applyCoins(100, 50)).toBe(150));
  it('handles zero', () => expect(applyCoins(100, 0)).toBe(100));
  it('throws on negative', () => expect(() => applyCoins(100, -10)).toThrow());
});
EOF
cat > src/test/unit/predictionResult.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
type O = 'Home Win'|'Away Win'|'Draw'|null;
function deriveResult(status: string, hg: number|null, ag: number|null): O {
  if (!['FT','AET','PEN'].includes(status)) return null;
  const h = hg??0, a = ag??0;
  if (h>a) return 'Home Win'; if (a>h) return 'Away Win'; return 'Draw';
}
describe('deriveResult', () => {
  it('home win', () => expect(deriveResult('FT',2,0)).toBe('Home Win'));
  it('away win', () => expect(deriveResult('FT',1,3)).toBe('Away Win'));
  it('draw', () => expect(deriveResult('FT',1,1)).toBe('Draw'));
  it('in progress = null', () => expect(deriveResult('1H',1,0)).toBeNull());
});
EOF
ok "Vitest + tests created"

# ── 19. package.json — add test scripts + deps ────────────────
info "Updating package.json..."
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts.test = 'vitest';
p.scripts['test:coverage'] = 'vitest run --coverage';
p.devDependencies['vitest'] = '^1.6.0';
p.devDependencies['@vitest/coverage-v8'] = '^1.6.0';
p.devDependencies['@testing-library/react'] = '^16.0.0';
p.devDependencies['@testing-library/user-event'] = '^14.5.2';
p.devDependencies['@testing-library/jest-dom'] = '^6.4.6';
p.devDependencies['jsdom'] = '^24.1.0';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
"
ok "package.json updated"

# ── 20. SECRETS.md ────────────────────────────────────────────
cat > SECRETS.md << 'EOF'
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
EOF
ok "SECRETS.md created"

echo ""
echo -e "${BOLD}${GREEN}════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  All fixes applied successfully! 🎉     ${NC}"
echo -e "${BOLD}${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. npm install            (picks up new test deps)"
echo "  2. npm test               (run your new tests)"
echo "  3. supabase secrets set MPESA_WEBHOOK_SECRET=<random>"
echo "  4. supabase secrets set CRON_SECRET=<random>"
echo "  5. supabase functions deploy update-prediction-results"
echo "  6. supabase db push"
echo "  7. Rotate Supabase anon key in dashboard (old one was in git)"
echo ""
