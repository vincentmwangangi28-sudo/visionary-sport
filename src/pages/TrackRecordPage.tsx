import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { AuditedTrackRecord } from '@/components/AuditedTrackRecord';
import { ShieldCheck, Award } from 'lucide-react';
import { AdBannerHorizontal } from '@/components/AdBanner';

export default function TrackRecordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Audited Prediction Track Record & Yield (ROI) | PredictPro"
        description="Transparent, independently audited football prediction track record. Check our verified historical ROI %, CLV beat rate, hit rates, and league yields."
        keywords="verified football tipster, audited prediction track record, football betting ROI, closing line value beat rate, transparent betting ledger"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-24 pb-20 md:pb-12 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-black flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Audited Track Record & Yield
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete mathematical transparency. Explore our historical prediction ledger, closing line value (CLV) performance, and yield by league and market.
          </p>
        </div>

        <AuditedTrackRecord />

        <div className="my-8">
          <AdBannerHorizontal />
        </div>
      </main>

      <Footer />
    </div>
  );
}
