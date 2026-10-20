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

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 max-w-6xl space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Audited Model Performance · Brier Calibration &amp; CLV
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] font-mono text-slate-400">Independently Verified Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Audited Track Record &amp; Model Calibration
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
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
