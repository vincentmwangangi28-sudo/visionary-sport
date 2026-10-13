import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, AlertTriangle, CheckCircle2, Scale, Mail, ExternalLink } from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = 'October 13, 2026';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Terms of Service | PredictPro Quantitative Football Analytics"
        description="PredictPro Terms of Service: Read our terms governing platform access, informational analytics, 18+ eligibility, and Google AdSense compliance."
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl space-y-8" id="main-content">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              <Scale className="h-3.5 w-3.5 mr-1" /> Terms &amp; Conditions
            </Badge>
            <span className="text-xs text-muted-foreground">Last Updated: {lastUpdated}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Please read these Terms of Service (&quot;Terms&quot;, &quot;Agreement&quot;) carefully before accessing or using PredictPro (<Link to="/" className="text-primary hover:underline">https://predictpro.guru</Link>). By browsing, accessing, or using any feature of PredictPro, you agree to be bound by these Terms and our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        {/* Informational Disclaimer Banner */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-sm text-foreground">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Important Non-Bookmaker &amp; Informational Statistics Disclaimer
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              PredictPro is an independent sports analytics and statistical forecasting tool. We are <strong>NOT</strong> a bookmaker, sportsbook, or casino. We do not accept real-money bets or deposits. All AI predictions, Expected Goals (xG) statistics, Poisson matrices, and odds comparisons are provided strictly for educational, informational, and analytical research. Past statistical accuracy does not guarantee future sports outcomes.
            </p>
          </div>
        </div>

        {/* 1. Eligibility & 18+ Requirement */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
            18+ Age Requirement &amp; Eligibility
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              By accessing PredictPro, you represent and warrant that you are at least 18 years of age (or the applicable legal age of majority in your jurisdiction). PredictPro is strictly not intended for minors.
            </p>
            <p>
              You are responsible for ensuring that your access to sports analytics and sports media complies with all local laws and regulations applicable in your country, state, or province.
            </p>
          </div>
        </section>

        {/* 2. Educational & Informational Nature of Service */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            Nature of the Service &amp; No Financial Guarantees
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              PredictPro provides quantitative sports data, automated algorithmic evaluations, Poisson probability distribution calculations, and editorial previews.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>No prediction, tip, confidence percentage, or banker recommendation constitutes financial, betting, or investment advice.</li>
              <li>Sports events are inherently volatile and subject to unforeseen variables (injuries, weather, referee decisions, tactical shifts).</li>
              <li>You acknowledge that you use all information provided on PredictPro solely at your own discretion and risk. PredictPro accepts zero liability for any financial loss incurred from sports betting decisions.</li>
            </ul>
          </div>
        </section>

        {/* 3. User Accounts & Subscriptions */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            User Accounts, Coins &amp; VIP Subscriptions
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              When you create an account on PredictPro, you agree to maintain the security of your account credentials. You are solely responsible for all activity conducted through your account.
            </p>
            <p>
              PredictPro offers virtual prediction coins, gamification rewards, and optional VIP subscription tiers for advanced analytics. Virtual coins hold zero real-world monetary cash value and cannot be redeemed for fiat currency. VIP memberships are billed on a recurring or fixed period basis as described during checkout via authorized payment gateways (Stripe and Lipana M-Pesa).
            </p>
          </div>
        </section>

        {/* 4. Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
            Intellectual Property &amp; Acceptable Use
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              All proprietary algorithms, user interface designs, logos, software code, editorial blog articles, and proprietary analytical calculations on PredictPro are the intellectual property of PredictPro and are protected by applicable copyright and trademark laws.
            </p>
            <p>
              You agree not to scrape, reverse-engineer, mass-download, or redistribute PredictPro&apos;s data or predictions for commercial resale without prior written authorization.
            </p>
          </div>
        </section>

        {/* 5. Google AdSense & Third-Party Advertising */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">5</span>
            Advertising &amp; Third-Party Links
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              PredictPro displays online advertisements served by Google AdSense and authorized third-party ad exchanges. Advertisements are labeled in accordance with advertising industry standards. We do not endorse the products, services, or claims made in third-party advertisements.
            </p>
            <p>
              For details on how Google uses advertising cookies and how you can opt out of personalized ads, please consult our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
          </div>
        </section>

        {/* 6. Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">6</span>
            Disclaimer of Warranties &amp; Limitation of Liability
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              PREDICTPRO IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR ACCURACY OF SPORTS PROJECTIONS.
            </p>
            <p>
              IN NO EVENT SHALL PREDICTPRO, ITS OPERATORS, OR LICENSORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES (INCLUDING LOSS OF PROFITS OR FUNDS) RESULTING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM.
            </p>
          </div>
        </section>

        {/* 7. Responsible Gaming */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">7</span>
            Responsible Gaming Commitment
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              We strongly advocate for responsible gaming and mindful sports entertainment. If you choose to bet on sports with external licensed operators, always set strict loss limits and never bet money needed for living essentials.
            </p>
            <p>
              If gambling is causing distress to you or a loved one, access free confidential support at <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BeGambleAware.org</a>, call the UK National Gambling Helpline at <strong>0808 8020 133</strong>, or call the US Helpline at <strong>1-800-GAMBLER</strong>. Learn more on our dedicated <Link to="/responsible-gaming" className="text-primary hover:underline font-semibold">Responsible Gaming page</Link>.
            </p>
          </div>
        </section>

        {/* 8. Governing Law & Contact */}
        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Mail className="h-5 w-5 text-primary" /> Questions or Legal Inquiries
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have questions regarding these Terms of Service, please contact our Legal Team:
          </p>
          <div className="text-sm space-y-1 pt-2 font-mono text-foreground/90">
            <p>PredictPro Analytics Legal Office</p>
            <p>Email: <a href="mailto:support@predictpro.guru" className="text-primary hover:underline">support@predictpro.guru</a></p>
            <p>Website: https://predictpro.guru</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
