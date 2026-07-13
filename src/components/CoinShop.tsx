import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Coins, Gift, Zap } from 'lucide-react';

const COIN_PACKS = [
  { coins: 100, price: 50, label: 'Starter Pack', popular: false },
  { coins: 500, price: 200, label: 'Value Pack', popular: true },
  { coins: 1500, price: 500, label: 'Pro Pack', popular: false },
];

export const CoinShop = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-2">
      <Coins className="h-5 w-5 text-amber-500"/>
      <h3 className="font-bold">Coin Packs</h3>
    </div>
    <div className="grid sm:grid-cols-3 gap-3">
      {COIN_PACKS.map(pack => (
        <Card key={pack.coins} className={pack.popular ? 'border-primary/40 bg-primary/5' : ''}>
          <CardContent className="p-4 text-center">
            {pack.popular && <Badge className="mb-2 bg-primary text-primary-foreground text-xs">Most Popular</Badge>}
            <p className="text-3xl font-black text-amber-500 mb-1">🪙 {pack.coins}</p>
            <p className="text-sm text-muted-foreground mb-1">{pack.label}</p>
            <p className="font-bold text-lg mb-3">KES {pack.price}</p>
            <Link to="/rewards"><Button size="sm" variant={pack.popular ? 'default' : 'outline'} className="w-full gap-1.5">
              <Zap className="h-3.5 w-3.5"/>Buy
            </Button></Link>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-2">Or earn coins for free</p>
      <Link to="/rewards"><Button variant="outline" size="sm" className="gap-2"><Gift className="h-4 w-4"/>Daily Spin Wheel</Button></Link>
    </div>
  </div>
);
