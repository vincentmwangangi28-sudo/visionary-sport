import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, FileText, CheckCircle2, AlertTriangle, ExternalLink, Mail, Globe } from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = 'October 13, 2026';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Privacy Policy & Data Protection Standards | PredictPro"
        description="Read how PredictPro protects user privacy, encrypts account information, and complies with GDPR and international data standards."
        canonical="/privacy"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl space-y-8" id="main-content">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              <Shield className="h-3.5 w-3.5 mr-1" /> Legal Compliance
            </Badge>
            <span className="text-xs text-muted-foreground">Effective &amp; Last Updated: {lastUpdated}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            PredictPro (&quot;predictpro.guru&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy and ensuring transparent handling of your personal data. This Privacy Policy details the types of information we collect, how it is used, and your rights regarding your personal data in full compliance with the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA/CPRA), and Google Publisher Policies.
          </p>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-500" /> Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              We encrypt communications via HTTPS/TLS and never sell your personal data to third parties.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Transparent Ads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              We partner with Google AdSense using standardized advertising cookies and provide full opt-out control.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" /> 18+ Platform
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Strictly for individuals 18 years of age or older. We never knowingly collect information from minors.
            </CardContent>
          </Card>
        </div>

        {/* 1. Controller & Scope */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
            Data Controller &amp; Scope
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              The data controller responsible for your personal data is PredictPro Quantitative Football Analytics (&quot;PredictPro&quot;), accessible via <Link to="/" className="text-primary hover:underline">https://predictpro.guru</Link>. If you have any inquiries regarding this policy or data processing practices, you may contact our Privacy Team directly at <a href="mailto:privacy@predictpro.guru" className="text-primary hover:underline font-medium">privacy@predictpro.guru</a> or <a href="mailto:support@predictpro.guru" className="text-primary hover:underline font-medium">support@predictpro.guru</a>.
            </p>
            <p>
              This Privacy Policy applies to all users accessing PredictPro across web browsers, progressive web applications (PWA), and mobile interfaces.
            </p>
          </div>
        </section>

        {/* 2. Google AdSense & Advertising Cookies Disclosure (CRITICAL FOR ADSENSE COMPLIANCE) */}
        <section className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            Google AdSense &amp; Third-Party Advertising Policy
          </h2>
          <div className="text-sm text-foreground/90 leading-relaxed space-y-3">
            <p>
              In accordance with Google Publisher Policies and the Google EU User Consent Policy, please note the following explicit disclosures regarding advertising on PredictPro:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Third-Party Advertising Vendors:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website or other websites on the Internet.
              </li>
              <li>
                <strong className="text-foreground">Google Advertising Cookies:</strong> Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to PredictPro and/or other sites across the World Wide Web.
              </li>
              <li>
                <strong className="text-foreground">User Opt-Out Mechanisms:</strong> Users may opt out of personalized advertising at any time by visiting the official Google Ads Settings portal: <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">Google Ads Settings <ExternalLink className="h-3 w-3 inline" /></a>.
              </li>
              <li>
                <strong className="text-foreground">Universal Industry Opt-Out:</strong> Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting the Digital Advertising Alliance consumer choice tool at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">aboutads.info/choices <ExternalLink className="h-3 w-3 inline" /></a> or the European Interactive Digital Advertising Alliance (EDAA) choice portal at <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">youronlinechoices.eu <ExternalLink className="h-3 w-3 inline" /></a>.
              </li>
              <li>
                <strong className="text-foreground">ads.txt and app-ads.txt Authorized Seller:</strong> PredictPro maintains an audited, publicly accessible <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">/ads.txt</code> and <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">/app-ads.txt</code> file identifying authorized digital ad sellers, including Google AdSense Publisher ID <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">pub-1375386376692976</code>.
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            Information We Collect
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>We collect information in the following categories:</p>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">A. Information Automatically Collected (Log Files &amp; Telemetry)</h3>
              <p>
                Like most standard websites, PredictPro utilizes server log files. Information recorded includes internet protocol (IP) addresses, browser type, internet service provider (ISP), date/time stamps, referring/exit pages, and number of clicks. This data is utilized solely to analyze aggregate trends, administer the platform, combat malicious automated traffic, and measure server performance. IP addresses are not linked to personally identifiable information in our standard analytics logs.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">B. Information You Provide Voluntarily</h3>
              <p>
                When you create a free member account, save favorite leagues, or submit feedback through our contact desk, you may provide your email address, display name, regional timezone preference, and notification settings. PredictPro is a 100% free open-access sports statistics publication and never requests or stores credit card, banking, or financial payment credentials.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Cookies & Web Beacons */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
            Cookies &amp; Web Beacons
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              PredictPro uses cookies to store user preferences (such as light/dark mode, odds display format, and favorite leagues), record user-specific information on page navigation, and customize content based on browser type.
            </p>
            <p>
              You can choose to disable cookies through your individual browser options. Detailed information about cookie management with specific web browsers can be found at the browsers&apos; respective websites. To learn more about our specific cookie categories, visit our dedicated <Link to="/cookies" className="text-primary hover:underline font-semibold">Cookie Policy</Link>.
            </p>
          </div>
        </section>

        {/* 5. GDPR Compliance */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">5</span>
            Your Rights Under GDPR (European Union &amp; UK Users)
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>Under the General Data Protection Regulation, every user is entitled to the following rights:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right of Access:</strong> You have the right to request copies of your personal data.</li>
              <li><strong>Right to Rectification:</strong> You have the right to request that we correct inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You have the right to request deletion of your personal data under certain conditions.</li>
              <li><strong>Right to Restrict Processing:</strong> You have the right to request that we limit how we process your personal data.</li>
              <li><strong>Right to Object:</strong> You have the right to object to our processing of your personal data for direct marketing or statistical analytics.</li>
              <li><strong>Right to Data Portability:</strong> You have the right to request transfer of your data to another organization.</li>
            </ul>
            <p>
              If you submit a data rights request, we have one month to respond to you. Please contact us at <a href="mailto:privacy@predictpro.guru" className="text-primary hover:underline">privacy@predictpro.guru</a>.
            </p>
          </div>
        </section>

        {/* 6. CCPA / CPRA California Rights */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">6</span>
            CCPA / CPRA Privacy Rights (California Residents)
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>Under the California Consumer Privacy Act (CCPA) and CPRA, California consumers have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Request disclosure of the categories and specific pieces of personal data collected about them.</li>
              <li>Request deletion of any personal data collected from the consumer.</li>
              <li><strong>Opt out of the sale or sharing of personal data:</strong> PredictPro does NOT sell personal data to third parties for monetary consideration.</li>
              <li>Not receive discriminatory treatment for exercising privacy rights.</li>
            </ul>
          </div>
        </section>

        {/* 7. Children's Information & 18+ Protection */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">7</span>
            18+ Age Restriction &amp; Protection of Minors
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              PredictPro provides quantitative sports statistics, Expected Goals (xG) forecasting, and educational betting odds analytics. Our service is strictly intended for individuals 18 years of age or older (or the applicable legal age of majority in your jurisdiction).
            </p>
            <p>
              We do not knowingly collect any Personal Identifiable Information from children or minors under the age of 18. If a parent or guardian believes that PredictPro has personal information of a child under 18 in its database, please contact us immediately at <a href="mailto:privacy@predictpro.guru" className="text-primary hover:underline">privacy@predictpro.guru</a> and we will promptly remove such information from our records.
            </p>
          </div>
        </section>

        {/* 8. Third-Party Links & Non-Affiliation */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">8</span>
            Third-Party Links &amp; Gambling Disclaimer
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              Our website may contain links to external third-party sites, including football news outlets, sports data sources, or licensed sportsbooks. We are not responsible for the privacy practices or content of external websites. PredictPro is NOT a bookmaker, does not take deposits or bets, and encourages all visitors to read the privacy statements of any linked site they visit.
            </p>
          </div>
        </section>

        {/* 9. Contact Us */}
        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Mail className="h-5 w-5 text-primary" /> Contact Our Privacy Office
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy, wish to exercise your data rights, or want to submit an inquiry, please contact our Data Protection Officer:
          </p>
          <div className="text-sm space-y-1 pt-2 font-mono text-foreground/90">
            <p>PredictPro Analytics — Privacy &amp; Compliance</p>
            <p>Email: <a href="mailto:privacy@predictpro.guru" className="text-primary hover:underline">privacy@predictpro.guru</a></p>
            <p>General Support: <a href="mailto:support@predictpro.guru" className="text-primary hover:underline">support@predictpro.guru</a></p>
            <p>Publisher ID: ca-pub-1375386376692976</p>
            <p>Location: Nairobi, Kenya / Global Digital Operations</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
