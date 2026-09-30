import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  Globe,
  Lock,
  FileCheck2,
  Copy,
  CheckCircle2,
  BookOpen,
  Scale,
  HeartHandshake,
} from 'lucide-react';
import { toast } from 'sonner';

const HELPLINES = [
  {
    region: 'United Kingdom & Global',
    organization: 'BeGambleAware & GamCare',
    contact: '0808 8020 133 (Free 24/7 National Gambling Helpline)',
    website: 'https://www.begambleaware.org',
    description: 'Free, confidential information, counseling, and support for anyone affected by gambling harms.',
  },
  {
    region: 'United States & North America',
    organization: 'National Council on Problem Gambling (NCPG)',
    contact: '1-800-GAMBLER (1-800-522-4700) · Text 800GAM',
    website: 'https://www.ncpgambling.org',
    description: '24/7 confidential national helpline connecting individuals and families with local support resources.',
  },
  {
    region: 'Kenya & East Africa',
    organization: 'Responsible Gaming Kenya (BCLB Support)',
    contact: '0800 722 200 (Toll-Free Helpline)',
    website: 'https://www.gamblingtherapy.org',
    description: 'Dedicated support, self-exclusion guidance, and counseling for East African residents.',
  },
  {
    region: 'International Multilingual Support',
    organization: 'Gambling Therapy (Gordon Moody)',
    contact: '24/7 Live Support & International Forums',
    website: 'https://www.gamblingtherapy.org',
    description: 'Global online support service offering practical advice and emotional support in 30+ languages.',
  },
];

export default function ResponsibleGaming() {
  const appealStatement = `Google Ads Destination & Policy Compliance Statement (Customer ID: 250-331-9949 | Campaign: Search-1 [23467443261]):
1. Informational Sports Statistics Only: PredictPro (https://predictpro.guru) is an independent football data science, Expected Goals (xG), and Bivariate Poisson statistical modeling platform. We are NOT a bookmaker, casino, or real-money gambling operator, and users cannot place real-money bets or deposits on our website.
2. No Gambling Vouchers or Affiliate Wagering: Our landing pages do not promote real-money casino games, slots, bingo, or bookmaker bonus codes, nor do we claim guaranteed financial returns.
3. Prominent Responsible Gambling & 18+ Minor Protection: Every landing page displays a clear 18+ age restriction ("Never Intended for Minors"), responsible gambling guidelines, and direct links to international helplines (BeGambleAware.org, GamCare 0808 8020 133, NCPG 1-800-GAMBLER, and Responsible Gaming KE 0800 722 200) at https://predictpro.guru/responsible-gaming.`;

  const compliantAdCopy = `Google Ads Compliant Responsive Search Ad (RSA) Copy — Campaign: Search-1 [23467443261]
Final URL: https://predictpro.guru/

Headlines (Max 30 chars each — No restricted gambling terms):
• PredictPro AI Football Stats
• Daily Football xG Analytics
• AI Match Outcome Probabilities
• 40+ Global Football Leagues
• Expected Goals (xG) Forecasts
• Poisson Football Match Model
• Head-to-Head (H2H) Data Hub
• Live Football Match Telemetry

Descriptions (Max 90 chars each — Informational & 18+ Compliant):
• Independent AI football statistics, Expected Goals (xG) models & H2H match data. 18+ Only.
• Explore Bivariate Poisson scoreline probabilities & team form across 40+ global leagues.
• Quantitative football analytics & tactical match previews. Informational only, 18+.`;

  const handleCopyAppeal = () => {
    navigator.clipboard.writeText(appealStatement);
    toast.success('Google Ads appeal justification copied to clipboard!');
  };

  const handleCopyAdCopy = () => {
    navigator.clipboard.writeText(compliantAdCopy);
    toast.success('Compliant Google Ads headlines & descriptions copied!');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between text-foreground">
      <SEO
        title="Responsible Gaming, 18+ Minor Protection & Analytics Disclaimer | PredictPro"
        description="PredictPro Responsible Gambling Policy, 18+ minor protection standards, international support helplines, and informational sports statistics disclaimer."
        canonical="/responsible-gaming"
        keywords="responsible gambling policy, 18+ age restriction, sports statistics disclaimer, begambleaware, gamcare helpline, predictpro compliance"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-24 pb-20 md:pb-14 max-w-5xl space-y-8">
        {/* Hero Compliance Header */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-card to-card p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-rose-600 text-white font-black px-3 py-1 text-xs">
              18+ ONLY · NEVER FOR MINORS
            </Badge>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Responsible Gambling &amp; Informational Analytics Standard
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
            Responsible Gambling Policy, Minor Protection &amp; Informational Analytics Disclaimer
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
            PredictPro (<code className="font-mono text-foreground">predictpro.guru</code>) is committed to responsible sports analytics, strict protection of minors (18+), and full transparency regarding the mathematical and informational nature of our football statistical models.
          </p>
        </div>

        {/* Core Legal & Operational Declarations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Scale className="w-5 h-5" />
              </div>
              <CardTitle className="text-base font-bold">
                1. Informational &amp; Statistical Platform Only
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                <strong className="text-foreground">PredictPro is NOT a bookmaker, sportsbook, or gambling operator.</strong> We do not accept real-money wagers, deposits, or bets of any kind on this website or application.
              </p>
              <p>
                All Expected Goals (xG) metrics, Bivariate Poisson scoreline distributions, and probability percentages are published strictly for informational, statistical research, and entertainment purposes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <CardTitle className="text-base font-bold">
                2. Strict 18+ Minor Protection Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                <strong className="text-foreground">Our content is strictly intended for adults aged 18 years and older</strong> (or 21+ where required by local jurisdiction). We never target minors in our content or marketing.
              </p>
              <p>
                We strongly encourage parents and guardians to use device-level filtering software such as <strong>Net Nanny</strong>, <strong>CyberPatrol</strong>, or <strong>BetBlocker</strong> to prevent underage access to sports odds data.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <CardTitle className="text-base font-bold">
                3. No Guaranteed Outcomes Warning
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                Football is inherently unpredictable. Mathematical probability models and historical strike rates <strong className="text-foreground">never guarantee future results or financial profit</strong>.
              </p>
              <p>
                Users who choose to engage with licensed third-party sportsbooks in their jurisdiction do so entirely at their own discretion and must abide by local laws.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Responsible Gambling Principles */}
        <Card className="border-border/80 bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-extrabold flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-500" />
              Core Principles for Responsible Sports Engagement
            </CardTitle>
            <CardDescription className="text-xs">
              If you choose to participate in sports wagering within a regulated jurisdiction, always follow these essential safeguards:
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Never Treat Wagering as Income
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Sports predictions and statistical models should be viewed purely as entertainment and quantitative analysis—never as a way to earn a living or pay off debts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Set Strict Time &amp; Financial Limits
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Establish a fixed entertainment budget before a matchweek begins and never exceed it, regardless of statistical confidence or perceived market edge.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Never Chase Losses
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Increasing stake sizes after an unexpected match result leads to rapid drawdown. Always take regular breaks and utilize self-exclusion tools if needed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Verify Local Jurisdiction Laws
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Online sports wagering laws vary by country and state. It is your responsibility to ensure compliance with all applicable regulations in your location.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* International Helplines Directory */}
        <Card className="border-border/80 bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-extrabold flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-primary" />
              Free &amp; Confidential Responsible Gambling Helplines (24/7)
            </CardTitle>
            <CardDescription className="text-xs">
              If you or someone you know is experiencing difficulties related to gambling, immediate confidential help is available free of charge:
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HELPLINES.map((item) => (
              <div
                key={item.organization}
                className="p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between space-y-3"
              >
                <div>
                  <Badge variant="outline" className="text-[10px] font-bold mb-1.5">
                    {item.region}
                  </Badge>
                  <h3 className="font-bold text-sm text-foreground">{item.organization}</h3>
                  <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    {item.contact}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div>
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" /> Visit Official Support Portal ({item.website.replace('https://', '')})
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Google Ads Policy & Destination Compliance Summary */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-bold mb-1">
                  Google Ads Policy &amp; Destination Verification
                </Badge>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-primary" />
                  Advertiser &amp; Destination Compliance Verification
                </CardTitle>
                <CardDescription className="text-xs">
                  Documentation for Google Ads policy review teams (Customer ID: 250-331-9949 · Campaign: Search-1 [23467443261])
                </CardDescription>
              </div>
              <Button size="sm" onClick={handleCopyAppeal} className="gap-1.5 text-xs font-bold">
                <Copy className="w-3.5 h-3.5" /> Copy Appeal Statement
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <pre className="p-3.5 rounded-xl bg-muted/50 border border-border/70 font-mono text-[11px] whitespace-pre-wrap text-foreground leading-relaxed">
              {appealStatement}
            </pre>

            <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-primary block">
                    Fix Disapproved Ad Copy · Campaign: Search-1 [23467443261]
                  </span>
                  <h3 className="font-bold text-foreground text-xs sm:text-sm">
                    Ready-to-Paste Compliant Responsive Search Ad (RSA) Headlines &amp; Descriptions
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Replacing restricted gambling terms (“betting tips”, “value bets”, “sure win”) in your ad creative automatically resubmits the ad for approval.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleCopyAdCopy} className="gap-1.5 text-xs font-bold">
                  <Copy className="w-3.5 h-3.5" /> Copy Compliant Ad Copy
                </Button>
              </div>
              <pre className="p-3 rounded-lg bg-background border border-border/60 font-mono text-[11px] whitespace-pre-wrap text-foreground leading-relaxed">
                {compliantAdCopy}
              </pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-background border border-border/60">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Step 1 · Destination Ready</span>
                <p className="font-bold text-foreground mt-0.5">18+ &amp; Responsible Gambling Live</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Hero section, footer, and static HTML root display 18+ age restriction, responsible gambling helplines &amp; non-bookmaker notice.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/60">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Step 2 · Edit Ad or Certify</span>
                <p className="font-bold text-foreground mt-0.5">Update RSA Copy or Apply</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Paste the statistical ad copy above to auto-resubmit, or apply for{' '}
                  <a
                    href="https://support.google.com/adspolicy/answer/6018017"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline font-semibold"
                  >
                    Google Ads Gambling Certification
                  </a>
                  .
                </p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/60">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Step 3 · Submit Appeal</span>
                <p className="font-bold text-foreground mt-0.5">Policy Manager &rarr; Appeal</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  In Google Ads Policy Manager (ID: 250-331-9949), hover over the Status column of Search-1 [23467443261] and click Appeal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" /> Return to Football Analytics Hub
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Questions regarding compliance? Contact <a href="mailto:support@predictpro.guru" className="text-primary underline font-semibold">support@predictpro.guru</a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
