import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Gift, Copy, Check, Users, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { WhatsAppShare } from '@/components/WhatsAppShare';

export const ReferralCard = () => {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [uses, setUses] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      // Fetch or create referral code
      let { data: existing } = await supabase
        .from('referral_codes')
        .select('code, uses_count')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing) {
        const newCode = `PP${user.id.slice(0, 6).toUpperCase()}`;
        const { data: created } = await supabase
          .from('referral_codes')
          .insert({ user_id: user.id, code: newCode })
          .select('code, uses_count')
          .maybeSingle();
        existing = created;
      }

      if (existing) {
        setCode(existing.code);
        setUses(existing.uses_count ?? 0);
      }

      const { data: earned } = await supabase
        .from('referrals')
        .select('coins_earned')
        .eq('referrer_id', user.id);
      setTotalEarned((earned ?? []).reduce((s, r) => s + (r.coins_earned ?? 0), 0));
      setLoading(false);
    })();
  }, [user?.id]);

  if (!user) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-5 text-center">
          <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="font-semibold mb-1">Refer Friends, Earn Coins</p>
          <p className="text-sm text-muted-foreground mb-3">Sign in to get your referral link and start earning.</p>
        </CardContent>
      </Card>
    );
  }

  const link = code ? `https://predictpro.guru/auth?ref=${code}` : '';

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Refer &amp; Earn</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Share your link. When a friend signs up and subscribes, you both get <b className="text-foreground">50 coins</b>.
        </p>

        {loading ? (
          <div className="h-10 bg-muted rounded-lg animate-pulse" />
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <Input readOnly value={link} className="text-xs font-mono" aria-label="Your referral link" />
              <Button size="icon" variant="outline" onClick={copy} aria-label="Copy referral link">
                {copied ? <Check className="h-4 w-4 text-green-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              </Button>
            </div>

            <div className="flex gap-3 mb-4">
              <WhatsAppShare text={`Join me on PredictPro for free AI football predictions! 🔮⚽ ${link}`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/60 rounded-lg p-3 text-center">
                <Users className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-black">{uses}</p>
                <p className="text-xs text-muted-foreground">Referred</p>
              </div>
              <div className="bg-background/60 rounded-lg p-3 text-center">
                <span className="text-base">🪙</span>
                <p className="text-lg font-black">{totalEarned}</p>
                <p className="text-xs text-muted-foreground">Coins Earned</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
