import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link, useSearchParams } from 'react-router-dom';
import { Coins, Gift, Ticket, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { redeemPromoCode, getPromoCodes } from '@/services/promoCodeService';
import { toast } from 'sonner';

export const CoinShop = () => {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const [searchParams] = useSearchParams();
  const [promoInput, setPromoInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const publicCodes = getPromoCodes().filter((c) => c.isActive);

  useEffect(() => {
    const codeFromUrl = searchParams.get('promo') || searchParams.get('code');
    if (codeFromUrl) {
      setPromoInput(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) {
      toast.error('Please enter a community bonus code.');
      return;
    }
    if (!user) {
      toast.error('Please sign in to your free account to claim community coins.');
      return;
    }

    setRedeeming(true);
    try {
      const result = await redeemPromoCode(promoInput.trim(), user.id, plan);
      if (result.success) {
        toast.success(result.message);
        setPromoInput('');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Unable to redeem code right now.');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          <h3 className="font-bold">Free Community Bonus Coins &amp; Vouchers</h3>
        </div>
        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30">
          100% Free Gamification Points · Never Sold
        </Badge>
      </div>

      {/* Free Ways to Earn Community Coins */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="border-border/70">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-amber-500 mb-1">🪙 Daily Spin</p>
            <p className="text-xs text-muted-foreground mb-3">Spin the free daily reward wheel every 24 hours</p>
            <Link to="/rewards">
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs font-bold">
                <Gift className="h-3.5 w-3.5 text-primary" />
                Open Daily Wheel
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-amber-500 mb-1">🪙 +50 Welcome</p>
            <p className="text-xs text-muted-foreground mb-3">Granted automatically to every free member account</p>
            <Link to={user ? '/dashboard' : '/auth'}>
              <Button size="sm" className="w-full gap-1.5 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                {user ? 'Active on Account' : 'Create Free Account'}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-amber-500 mb-1">🪙 Community Tips</p>
            <p className="text-xs text-muted-foreground mb-3">Share match forecasts &amp; climb the public leaderboard</p>
            <Link to="/tipsters">
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs font-bold">
                <Ticket className="h-3.5 w-3.5 text-primary" />
                Visit Tipsters Hub
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Redeem Voucher / Promo Code Box */}
      <Card className="border-border/80 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                <h4 className="font-bold text-sm">Redeem Free Community Promo Code</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter a community event code to add free bonus coins to your profile.
              </p>
            </div>

            <form onSubmit={handleRedeem} className="flex items-center gap-2">
              <Input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME100"
                className="h-9 w-40 font-mono uppercase text-xs"
              />
              <Button type="submit" size="sm" disabled={redeeming} className="h-9 gap-1.5 font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                {redeeming ? 'Claiming...' : 'Claim Free'}
              </Button>
            </form>
          </div>

          {publicCodes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground">Active free codes:</span>
              {publicCodes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPromoInput(c.code)}
                  className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {c.code} (+{c.coinsReward} 🪙)
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
