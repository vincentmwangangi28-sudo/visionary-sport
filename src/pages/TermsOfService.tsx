import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, AlertTriangle, Scale, Coins, Ban, Mail } from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = 'May 1, 2026';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Helmet>
        <title>Terms of Service | PredictPro Kenya</title>
        <meta name="description" content="Read PredictPro's Terms of Service. Understand the rules, prediction coin policies, and user responsibilities when using our AI sports prediction platform." />
        <link rel="canonical" href="https://predictpro.guru/terms-of-service" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <Alert className="mb-8 border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDescription className="ml-2 font-medium">
              You must be 18 years or older to use PredictPro. Predictions are informational only and do not guarantee outcomes. Bet responsibly.
            </AlertDescription>
          </Alert>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                By accessing or using PredictPro ("the Service"), you agree to be bound by these Terms of Service. If you do
                not agree, do not use the Service.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />2. Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ul>
                <li>You must be at least 18 years old.</li>
                <li>You must comply with all local laws regarding sports betting in your jurisdiction.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3. Nature of Predictions</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                PredictPro provides AI-generated sports predictions for informational and entertainment purposes only.
                While we strive for high accuracy (currently ~87% verified), predictions are NOT guarantees. You acknowledge
                that all betting involves risk, and PredictPro is not liable for any financial losses incurred from acting on
                our predictions.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" />4. Prediction Coins & Payments</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ul>
                <li>Prediction coins are purchased via M-Pesa and used to unlock premium predictions.</li>
                <li>Coins are non-refundable and have no cash value.</li>
                <li>Coins do not expire unless your account is terminated for violation of these Terms.</li>
                <li>Pricing and coin packages may change with notice posted on the Shop page.</li>
                <li>Failed transactions are auto-reversed by Safaricom; contact support if a charge appears without coin credit.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Ban className="h-5 w-5 text-primary" />5. Prohibited Conduct</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>You agree NOT to:</p>
              <ul>
                <li>Resell, redistribute, or scrape predictions without written permission</li>
                <li>Use bots, scrapers, or automated tools to access the Service</li>
                <li>Create multiple accounts to abuse referral or bonus systems</li>
                <li>Attempt to bypass paywalls or manipulate coin balances</li>
                <li>Post abusive, illegal, or misleading content in chat or community features</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>6. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                All content, predictions, branding, and software on PredictPro are owned by us or our licensors and protected
                by copyright. You receive a limited, personal, non-transferable license to use the Service for its intended purpose.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>7. Disclaimer of Warranties</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                The Service is provided "AS IS" without warranties of any kind. We do not warrant uninterrupted access,
                error-free predictions, or specific accuracy outcomes for any individual match.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>8. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                To the maximum extent permitted by law, PredictPro shall not be liable for any indirect, incidental, or
                consequential damages, including but not limited to gambling losses, lost profits, or data loss.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>9. Account Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                We may suspend or terminate accounts that violate these Terms, with or without notice. You may delete your
                account at any time by contacting support.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>10. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                These Terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved in the courts
                of Nairobi, Kenya.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>11. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance
                of the revised Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />12. Contact</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Questions about these Terms? Email{' '}
                <a href="mailto:legal@predictpro.guru" className="text-primary">legal@predictpro.guru</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
