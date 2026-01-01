import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DailySpinWheel } from '@/components/DailySpinWheel';
import { ReferralProgram } from '@/components/ReferralProgram';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';
import { PredictionBundles } from '@/components/PredictionBundles';
import { InsuranceInfoCard } from '@/components/PredictionInsurance';
import { CoinBalance } from '@/components/CoinBalance';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Users, Crown, Package, Shield } from 'lucide-react';
import { InContentAd, FooterAd } from "@/components/AdBanner";

const Rewards = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Rewards & Subscriptions - PredictPro</title>
        <meta
          name="description"
          content="Earn free coins with daily spins, referrals, and premium subscriptions. Unlock unlimited predictions and exclusive features."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">Rewards & Subscriptions</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Earn free coins, invite friends, and unlock premium features to maximize your prediction success.
            </p>
          </div>

          {/* Balance */}
          {user && (
            <div className="flex justify-center">
              <CoinBalance />
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="free" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5">
              <TabsTrigger value="free" className="flex items-center gap-1">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Free</span>
              </TabsTrigger>
              <TabsTrigger value="referral" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Referral</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-1">
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Plans</span>
              </TabsTrigger>
              <TabsTrigger value="bundles" className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Bundles</span>
              </TabsTrigger>
              <TabsTrigger value="insurance" className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Insurance</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="free" className="space-y-6">
              <div className="max-w-md mx-auto">
                <DailySpinWheel />
              </div>
            </TabsContent>

            <TabsContent value="referral" className="space-y-6">
              <div className="max-w-md mx-auto">
                <ReferralProgram />
              </div>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6">
              <SubscriptionPlans />
            </TabsContent>

            <TabsContent value="bundles" className="space-y-6">
              <PredictionBundles />
            </TabsContent>

            <TabsContent value="insurance" className="space-y-6">
              <div className="max-w-md mx-auto">
                <InsuranceInfoCard />
              </div>
            </TabsContent>
          </Tabs>

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

export default Rewards;
