import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { AdSensePolicyChecker } from '@/components/AdSensePolicyChecker';

export default function AdSensePolicyCheckerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="AdSense Policy & Build Compliance Checker | PredictPro"
        description="Post-build and real-time Google AdSense Program Policy compliance checker auditing prohibited content, ad placements, and pop-up governance across PredictPro."
        canonical="/adsense-policy-checker"
        noIndex={true}
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'AdSense Program Policy Checker' },
          ]}
        />
        <AdSensePolicyChecker />
      </main>

      <Footer />
    </div>
  );
}
