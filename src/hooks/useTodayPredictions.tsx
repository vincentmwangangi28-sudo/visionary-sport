import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
}

interface State {
  predictions: TodayPrediction[];
  loading: boolean;
  error: string | null;
  isPremium: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
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
      // supabase.functions.invoke automatically attaches the user's bearer token
      const { data, error: fnErr } = await supabase.functions.invoke("predict/today", {
        method: "GET",
      });
      if (fnErr) throw fnErr;
      setPredictions(data?.predictions ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  }, []);

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
  };
};
