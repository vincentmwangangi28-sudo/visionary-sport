import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link, useSearchParams } from 'react-router-dom';
import { Coins, Gift, Zap, Ticket, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { redeemPromoCode } from '@/services/promoCodeService';
import { toast } from 'sonner';

const COIN_PACKS = [
  { coins: 100, price: 50, label: 'Starter Pack', popular: false },
  { coins: 500, price: 200, label: 'Value Pack', popular: true },
  { coins: 1500, price: 500, label: 'Pro Pack', popular: false },
];

export const CoinShop = () => {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const [searchParams] = useSearchParams();
  const [promoInput, setPromoInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const codeFromUrl = searchParams.get('promo') || searchParams.get('code');
    if (codeFromUrl) {
      setPromoInput(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) {
      toast.error('Please enter a voucher or promo code.');
      return;
    }
    if (!user) {
      toast.error('Please sign in to redeem promo voucher coins.');
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
      <div className="flex items-center gap-2 mb-2">
        <Coins className="h-5 w-5 text-amber-500" />
        <h3 className="font-bold">Coin Packs</h3>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {COIN_PACKS.map((pack) => (
          <Card key={pack.coins} className={pack.popular ? 'border-primary/40 bg-primary/5' : ''}>
            <CardContent className="p-4 text-center">
              {pack.popular && (
                <Badge className="mb-2 bg-primary text-primary-foreground text-xs">
                  Most Popular
                </Badge>
              )}
              <p className="text-3xl font-black text-amber-500 mb-1">🪙 {pack.coins}</p>
              <p className="text-sm text-muted-foreground mb-1">{pack.label}</p>
              <p className="font-bold text-lg mb-3">KES {pack.price}</p>
              <Link to="/rewards">
                <Button
                  size="sm"
                  variant={pack.popular ? 'default' : 'outline'}
                  className="w-full gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Buy
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Redeem Voucher / Promo Code Box */}
      <Card className="border-border/80 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Have a Promo Voucher Code?</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Redeem official codes issued by administrator Vincent Mwangangi for bonus prediction coins.
              </p>
            </div>

            <form
              onSubmit={handleRedeem}
              toolname="redeem_predictpro_promo_code"
              tooldescription="Redeem a PredictPro promotional voucher code for bonus prediction coins"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Input
                name="promoCode"
                aria-label="Promo voucher code"
                toolparamdescription="Uppercase promotional voucher code to redeem for bonus coins"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="e.g. VINCENT100"
                className="h-8 text-xs font-mono uppercase font-bold w-full sm:w-44"
              />
              <Button
                type="submit"
                size="sm"
                disabled={redeeming}
                className="h-8 text-xs font-semibold px-3 bg-primary gap-1 flex-shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {redeeming ? 'Redeeming...' : 'Claim'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Or earn coins for free</p>
        <Link to="/rewards">
          <Button variant="outline" size="sm" className="gap-2">
            <Gift className="h-4 w-4" />
            Daily Spin Wheel
          </Button>
        </Link>
      </div>
    </div>
  );
};
