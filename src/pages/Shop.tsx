import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CoinShop } from '@/components/CoinShop';
import { CoinBalance } from '@/components/CoinBalance';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { InContentAd, FooterAd } from "@/components/AdBanner";

const Shop = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Coin Shop - PredictPro | Buy Prediction Coins</title>
        <meta name="description" content="Purchase prediction coins to unlock premium AI sports predictions and enter exciting contests. Secure M-Pesa payments." />
        <meta name="keywords" content="prediction coins, premium predictions, M-Pesa, buy coins, sports betting coins" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Balance Header */}
          {user && (
            <div className="flex justify-center">
              <CoinBalance />
            </div>
          )}

          {!user && (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Login to purchase coins and unlock premium predictions
              </p>
              <Button asChild>
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login to Continue
                </Link>
              </Button>
            </div>
          )}

          {/* Coin Shop */}
          <CoinShop />

          {/* Ad Section */}
          <div className="mt-8">
            <InContentAd />
          </div>

          {/* Footer Ad */}
          <div className="mt-8">
            <FooterAd />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Shop;
