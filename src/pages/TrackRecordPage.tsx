import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { AuditedTrackRecord } from '@/components/AuditedTrackRecord';
import { ForecastCalibrationPortfolio } from '@/components/ForecastCalibrationPortfolio';
import { ShieldCheck } from 'lucide-react';
import { AdBannerHorizontal } from '@/components/AdBanner';

export default function TrackRecordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Audited Prediction Track Record & Calibration | PredictPro"
        description="Transparent, independently audited football prediction track record. Check our verified Brier calibration score, CLV beat rate, hit rates, and league accuracy."
        keywords="verified football analytics, audited prediction track record, brier score calibration, closing line value beat rate, transparent statistical ledger"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-24 pb-20 md:pb-12 max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Audited Track Record &amp; Model Calibration
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete mathematical transparency. Explore our historical prediction ledger, Brier score probability calibration, and performance by league and market.
          </p>
        </div>

        <AuditedTrackRecord />

        <ForecastCalibrationPortfolio />

        <div className="my-8">
          <AdBannerHorizontal />
        </div>
      </main>

      <Footer />
    </div>
  );
}
