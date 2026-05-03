import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PredictionMarket {
  id: string;
  market_key: string;
  market_label: string;
  market_value: string;
  confidence: number;
  is_premium: boolean;
  reasoning?: string | null;
  locked?: boolean;
}

export interface TodayPrediction {
  id: string;
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  sport: string;
  prediction?: string;
  confidence?: number;
  reasoning?: string;
  odds_value?: number | null;
  is_premium: boolean;
  result?: string | null;
  locked?: boolean;
  markets?: PredictionMarket[];
}

interface State {
  predictions: TodayPrediction[];
  loading: boolean;
  error: string | null;
  isPremium: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  generateMarkets: () => Promise<void>;
}

export const useTodayPredictions = (): State => {
  const [predictions, setPredictions] = useState<TodayPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkRole = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsPremium(false);
      setIsAdmin(false);
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const list = (roles ?? []).map((r: any) => r.role);
    setIsAdmin(list.includes("admin"));
    setIsPremium(list.includes("premium") || list.includes("admin"));
  }, []);

  const fetchToday = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("predict/today", {
        method: "GET",
      });
      if (fnErr) throw fnErr;
      const preds: TodayPrediction[] = data?.predictions ?? [];

      // Fetch markets for these predictions (RLS will hide premium ones for non-premium users)
      const ids = preds.map((p) => p.id);
      let marketsByPred: Record<string, PredictionMarket[]> = {};
      if (ids.length > 0) {
        const { data: markets } = await supabase
          .from("prediction_markets")
          .select("id, prediction_id, market_key, market_label, market_value, confidence, is_premium, reasoning")
          .in("prediction_id", ids);
        for (const m of (markets ?? []) as any[]) {
          (marketsByPred[m.prediction_id] ||= []).push(m);
        }
      }

      setPredictions(
        preds.map((p) => ({
          ...p,
          markets: marketsByPred[p.id] ?? [],
        })),
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  }, []);

  const generateMarkets = useCallback(async () => {
    await supabase.functions.invoke("generate-prediction-markets", { method: "POST", body: {} });
    await fetchToday();
  }, [fetchToday]);

  useEffect(() => {
    checkRole();
    fetchToday();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkRole();
      fetchToday();
    });
    return () => sub.subscription.unsubscribe();
  }, [checkRole, fetchToday]);

  return {
    predictions,
    loading,
    error,
    isPremium,
    isAdmin,
    refresh: fetchToday,
    generateMarkets,
  };
};
