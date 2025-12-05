import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePredictionBundles } from '@/hooks/usePredictionBundles';
import { useAuth } from '@/hooks/useAuth';
import { Package, Loader2, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export const PredictionBundles = () => {
  const { user } = useAuth();
  const { bundles, loading } = usePredictionBundles();

  const handlePurchase = (bundleId: string) => {
    toast.info('Bundle purchase coming soon!');
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Prediction Bundles
        </h2>
        <p className="text-muted-foreground mt-2">
          Buy predictions in bulk and save more!
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bundles.map((bundle, index) => {
          const isBestValue = index === bundles.length - 1;
          const originalPrice = Math.round(
            bundle.priceKes / (1 - bundle.discountPercent / 100)
          );

          return (
            <Card
              key={bundle.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${
                isBestValue ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
            >
              {bundle.discountPercent > 0 && (
                <Badge className="absolute top-2 right-2 bg-red-500">
                  -{bundle.discountPercent}%
                </Badge>
              )}

              {isBestValue && (
                <div className="absolute top-2 left-2">
                  <Badge variant="default" className="bg-amber-500">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2 pt-8">
                <CardTitle className="text-lg">{bundle.name}</CardTitle>
                <CardDescription>
                  {bundle.predictionsCount} Premium Predictions
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  {bundle.discountPercent > 0 && (
                    <span className="text-sm text-muted-foreground line-through mr-2">
                      KES {originalPrice}
                    </span>
                  )}
                  <span className="text-2xl font-bold">KES {bundle.priceKes}</span>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  KES {Math.round(bundle.priceKes / bundle.predictionsCount)} per prediction
                </div>

                {!user ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/auth">
                      <Lock className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePurchase(bundle.id)}
                    className={`w-full ${isBestValue ? 'bg-gradient-to-r from-amber-500 to-orange-500' : ''}`}
                    variant={isBestValue ? 'default' : 'outline'}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Purchase
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
