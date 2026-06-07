import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Prediction {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  prediction: string;
  confidence: number;
  reasoning: string;
  is_premium: boolean;
  result: string | null;
}

export const useRealtimePredictionsSubscription = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchPredictions = async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('match_date', { ascending: true })
        .limit(20);

      if (!error && data) {
        setPredictions(data);
      }
      setLoading(false);
    };

    fetchPredictions();

    // Subscribe to realtime changes
    const channel: RealtimeChannel = supabase
      .channel('predictions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'predictions',
        },
        (payload) => {
          console.log('New prediction:', payload.new);
          setPredictions((prev) => [payload.new as Prediction, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'predictions',
        },
        (payload) => {
          console.log('Updated prediction:', payload.new);
          setPredictions((prev) =>
            prev.map((p) => (p.id === (payload.new as Prediction).id ? (payload.new as Prediction) : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { predictions, loading };
};

export const useRealtimeContests = () => {
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('status', 'active')
        .order('end_date', { ascending: true });

      if (!error && data) {
        setContests(data);
      }
      setLoading(false);
    };

    fetchContests();

    const channel = supabase
      .channel('contests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contests',
        },
        (payload) => {
          console.log('Contest change:', payload);
          if (payload.eventType === 'INSERT') {
            setContests((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setContests((prev) =>
              prev.map((c) => (c.id === payload.new.id ? payload.new : c))
            );
          } else if (payload.eventType === 'DELETE') {
            setContests((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { contests, loading };
};

export const useRealtimeProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();

    const channel = supabase
      .channel(`${user.id}:profile`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload.new);
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { profile, loading };
};

export const useRealtimeTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setTransactions(data);
      }
      setLoading(false);
    };

    fetchTransactions();

    const channel = supabase
      .channel(`transactions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New transaction:', payload.new);
          setTransactions((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Transaction updated:', payload.new);
          setTransactions((prev) =>
            prev.map((t) => (t.id === payload.new.id ? payload.new : t))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { transactions, loading };
};

export const useRealtimeLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .order('rank', { ascending: true })
        .limit(100);

      if (!error && data) {
        setLeaderboard(data);
      }
      setLoading(false);
    };

    fetchLeaderboard();

    // Subscribe to contest_entries changes which affects leaderboard
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contest_entries',
        },
        () => {
          // Refetch leaderboard when entries change
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { leaderboard, loading };
};
