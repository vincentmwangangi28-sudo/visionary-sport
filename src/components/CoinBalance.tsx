import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Coins } from 'lucide-react';
import { Card } from './ui/card';

export const CoinBalance = () => {
  const { user } = useAuth();
  const [coins, setCoins] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadCoins();

    // Subscribe to real-time coin updates
    const channel = supabase
      .channel('coin-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Coin balance updated:', payload);
          setCoins(payload.new.coins);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadCoins = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCoins(data.coins);
    } catch (error) {
      console.error('Error loading coins:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="px-4 py-2 bg-gradient-victory hover-glow">
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary-foreground animate-pulse-glow" />
        <span className="font-bold text-primary-foreground">
          {loading ? '...' : coins.toLocaleString()}
        </span>
      </div>
    </Card>
  );
};
