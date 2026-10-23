import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cookie, Shield, Eye, Settings, ExternalLink, Mail, CheckCircle2 } from 'lucide-react';

export default function CookiePolicy() {
  const lastUpdated = 'October 13, 2026';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Cookie Policy & Advertising Transparency | PredictPro"
        description="Detailed overview of cookies utilized on PredictPro for session security, language preferences, Google AdSense ads, and performance telemetry."
        canonical="/cookies"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl space-y-8" id="main-content">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              <Cookie className="h-3.5 w-3.5 mr-1" /> Cookie Governance
            </Badge>
            <span className="text-xs text-muted-foreground">Effective Date: {lastUpdated}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Cookie Policy</h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            This Cookie Policy explains how PredictPro (&quot;predictpro.guru&quot;, &quot;we&quot;, &quot;us&quot;) uses cookies and similar tracking technologies when you visit our quantitative football analytics platform. This policy is designed to comply with the European Union ePrivacy Directive, GDPR, and Google AdSense publisher requirements.
          </p>
        </div>

        {/* 1. What Are Cookies */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
            What Are Cookies?
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              Cookies are small text files placed on your computer, smartphone, or tablet when you visit a website. Cookies are widely used by web publishers to make websites function efficiently, retain your user preferences across visits, provide secure authentication, and supply analytical data to the website owners.
            </p>
            <p>
              Cookies can be &quot;persistent&quot; (remaining on your device until a set expiration date or until manually deleted) or &quot;session&quot; cookies (deleted as soon as you close your browser).
            </p>
          </div>
        </section>

        {/* 2. Categories of Cookies We Use */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            Categories of Cookies We Use
          </h2>

          <div className="grid gap-4">
            <Card className="border-border/60 bg-card/60">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2 text-foreground">
                    <Shield className="h-4 w-4 text-emerald-500" /> 1. Strictly Necessary &amp; Security Cookies
                  </span>
                  <Badge variant="secondary" className="text-xs">Always Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                These cookies are required for the basic technical operation of PredictPro. They enable core functions such as user login authentication (via Supabase), security token validation, CSRF attack prevention, and remembering your dark/light theme setting. The website cannot function correctly without these cookies.
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2 text-foreground">
                    <Settings className="h-4 w-4 text-primary" /> 2. Preference &amp; Functionality Cookies
                  </span>
                  <Badge variant="outline" className="text-xs">Functional</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                These cookies allow PredictPro to remember user-specific choices you make across sessions, such as your selected odds format (Decimal vs Fractional vs American), regional currency (USD, EUR, GBP, KES), selected language, and customized notification preferences.
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2 text-foreground">
                    <Eye className="h-4 w-4 text-blue-500" /> 3. Performance &amp; Analytics Cookies
                  </span>
                  <Badge variant="outline" className="text-xs">Analytics</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                We use Google Analytics 4 (GA4) and aggregated telemetry to understand how visitors engage with PredictPro. These cookies collect anonymous metrics such as page response times, most-viewed fixtures, bounce rates, and navigation paths. This data helps us optimize platform speed, detect broken links, and refine our Expected Goals (xG) calculators.
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2 text-foreground">
                    <Cookie className="h-4 w-4 text-amber-500" /> 4. Google AdSense &amp; Advertising Cookies
                  </span>
                  <Badge className="bg-primary text-primary-foreground text-xs">Advertising</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  PredictPro partners with Google AdSense (Publisher ID <code className="bg-muted px-1 rounded font-mono">pub-1375386376692976</code>) to serve digital advertisements that sustain our free prediction algorithms.
                </p>
                <p>
                  Google uses cookies to serve ads based on your prior visits to our site or other sites on the Internet. Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. Managing & Opting Out */}
        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            How You Can Control and Opt Out of Cookies
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              You have multiple tools to control and configure your cookie preferences:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Google Ads Personalization Settings:</strong> You can manage or disable personalized ads delivered by Google at any time by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold inline-flex items-center gap-1">Google Ads Settings <ExternalLink className="h-3 w-3 inline" /></a>.
              </li>
              <li>
                <strong className="text-foreground">Digital Advertising Alliance (DAA):</strong> Opt out of third-party advertising cookies across all participating companies at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold inline-flex items-center gap-1">aboutads.info/choices <ExternalLink className="h-3 w-3 inline" /></a>.
              </li>
              <li>
                <strong className="text-foreground">European Users (EDAA):</strong> European residents can configure preferences at <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold inline-flex items-center gap-1">youronlinechoices.eu <ExternalLink className="h-3 w-3 inline" /></a>.
              </li>
              <li>
                <strong className="text-foreground">Browser Settings:</strong> You can configure your browser to block all cookies or notify you when a cookie is being sent:
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-xs">
                  <li><strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Third-party cookies</li>
                  <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
                  <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Block all cookies</li>
                  <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions</li>
                </ul>
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Contact */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Mail className="h-5 w-5 text-primary" /> Questions About Cookies?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions regarding our use of cookies or tracking technologies, please contact our Privacy Office at <a href="mailto:vincentmwangangiz@gmail.com" className="text-primary hover:underline font-medium">vincentmwangangiz@gmail.com</a> or call <a href="tel:+254721418238" className="text-primary hover:underline font-medium">+254721418238</a>, or review our full <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
