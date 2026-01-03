import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Gift, Sparkles, Zap, Crown, Star } from 'lucide-react';
import { useCoinPackages, CoinPackage } from '@/hooks/useCoinPackages';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const LIPANA_PAYMENT_LINK = 'https://lipana.dev/pay/visionary-sport-bet';

export const CoinShop = () => {
  const { packages, loading } = useCoinPackages();
  const { user } = useAuth();

  const getPackageIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'starter pack':
        return <Coins className="h-8 w-8 text-amber-500" />;
      case 'value pack':
        return <Star className="h-8 w-8 text-yellow-500" />;
      case 'pro pack':
        return <Zap className="h-8 w-8 text-orange-500" />;
      case 'elite pack':
        return <Crown className="h-8 w-8 text-purple-500" />;
      default:
        return <Coins className="h-8 w-8 text-amber-500" />;
    }
  };

  const handlePurchase = (pkg: CoinPackage) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to purchase coins",
        variant: "destructive",
      });
      return;
    }

    // Open Lipana payment page in new tab
    window.open(LIPANA_PAYMENT_LINK, '_blank');
    
    toast({
      title: "Payment Page Opened!",
      description: `Complete your KES ${pkg.price_kes} payment for ${pkg.coins + pkg.bonus_coins} coins`,
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse bg-muted/50">
            <CardHeader className="h-32" />
            <CardContent className="h-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          Coin Shop
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </h2>
        <p className="text-muted-foreground">
          Purchase coins to unlock premium predictions and enter contests
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl ${
              pkg.is_popular ? 'ring-2 ring-primary' : ''
            }`}
          >
            {pkg.is_popular && (
              <Badge className="absolute top-2 right-2 bg-primary">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2">{getPackageIcon(pkg.name)}</div>
              <CardTitle className="text-lg">{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">
                  {pkg.coins.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">coins</span>
                </div>
                
                {pkg.bonus_coins > 0 && (
                  <div className="flex items-center justify-center gap-1 text-green-500">
                    <Gift className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      +{pkg.bonus_coins} bonus coins!
                    </span>
                  </div>
                )}
              </div>

              <div className="text-2xl font-bold">
                KES {pkg.price_kes.toLocaleString()}
              </div>

              <Button 
                className="w-full" 
                variant={pkg.is_popular ? "default" : "outline"}
                onClick={() => handlePurchase(pkg)}
              >
                Buy Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Coins can be used to unlock premium predictions and enter contests</p>
        <p>Secure payments via M-Pesa</p>
      </div>
    </div>
  );
};
