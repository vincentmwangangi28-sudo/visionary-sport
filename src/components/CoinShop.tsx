import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Gift, Sparkles, Zap, Crown, Star } from 'lucide-react';
import { useCoinPackages, CoinPackage } from '@/hooks/useCoinPackages';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const CoinShop = () => {
  const { packages, loading } = useCoinPackages();
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [phone, setPhone] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to purchase coins",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPackage || !phone) {
      toast({
        title: "Missing Information",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);

    try {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phone,
          amount: selectedPackage.price_kes,
          purpose: 'coin_purchase',
          metadata: {
            package_id: selectedPackage.id,
            package_name: selectedPackage.name,
            coins: selectedPackage.coins + selectedPackage.bonus_coins,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Payment Initiated! 📱",
          description: "Check your phone to complete the M-Pesa payment",
        });
        setIsDialogOpen(false);
        setPhone('');
      } else {
        throw new Error(data?.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
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

              <Dialog open={isDialogOpen && selectedPackage?.id === pkg.id} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setSelectedPackage(null);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    variant={pkg.is_popular ? "default" : "outline"}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setIsDialogOpen(true);
                    }}
                  >
                    Buy Now
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-amber-500" />
                      Purchase {pkg.name}
                    </DialogTitle>
                    <DialogDescription>
                      Get {pkg.coins + pkg.bonus_coins} coins for KES {pkg.price_kes}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">M-Pesa Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="0712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the phone number registered with M-Pesa
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Base Coins</span>
                        <span>{pkg.coins}</span>
                      </div>
                      {pkg.bonus_coins > 0 && (
                        <div className="flex justify-between text-sm text-green-500">
                          <span>Bonus Coins</span>
                          <span>+{pkg.bonus_coins}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total Coins</span>
                        <span>{pkg.coins + pkg.bonus_coins}</span>
                      </div>
                      <div className="flex justify-between font-bold text-primary">
                        <span>Amount</span>
                        <span>KES {pkg.price_kes}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handlePurchase}
                      disabled={isPurchasing || !phone}
                    >
                      {isPurchasing ? 'Processing...' : 'Pay with M-Pesa'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>💡 Coins can be used to unlock premium predictions and enter contests</p>
        <p>🔒 Secure payments via M-Pesa</p>
      </div>
    </div>
  );
};
