import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Database, Mail, UserCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = 'May 1, 2026';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Helmet>
        <title>Privacy Policy | PredictPro Kenya</title>
        <meta name="description" content="Read PredictPro's Privacy Policy. Learn how we collect, use, and protect your personal data when using our AI sports prediction platform." />
        <link rel="canonical" href="https://predictpro.guru/privacy-policy" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                PredictPro ("we", "us", "our") respects your privacy and is committed to protecting your personal data.
                This Privacy Policy explains how we collect, use, and safeguard information when you use our AI-powered sports
                prediction platform at predictpro.guru.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" />Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ul>
                <li><strong>Account data:</strong> email address, display name, and authentication credentials.</li>
                <li><strong>Usage data:</strong> predictions viewed, predictions unlocked, coin balance, streaks, and badges.</li>
                <li><strong>Payment data:</strong> M-Pesa phone number and transaction references (we never store card numbers or PINs).</li>
                <li><strong>Communication data:</strong> WhatsApp number, SMS opt-in status, and email subscription preferences.</li>
                <li><strong>Device & analytics data:</strong> IP address, browser type, device, and aggregated usage events (PII redacted in GA4).</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" />How We Use Your Data</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ul>
                <li>Provide AI predictions, accuracy tracking, and personalized recommendations.</li>
                <li>Process M-Pesa payments and credit prediction coins to your account.</li>
                <li>Send transactional notifications (predictions, results, payment confirmations).</li>
                <li>Improve model accuracy and detect fraud or abuse.</li>
                <li>Comply with Kenyan legal obligations including BCLB requirements.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Data Security & Storage</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Your data is stored on encrypted infrastructure with row-level security policies. Sensitive operations
                require server-side validation. We retain data only as long as necessary to provide the service or comply
                with legal obligations.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>We integrate with the following providers strictly to deliver our service:</p>
              <ul>
                <li>Football-Data.org, API-Sports, TheSportsDB — match fixtures and results</li>
                <li>M-Pesa (Safaricom) — payment processing</li>
                <li>Twilio — WhatsApp & SMS notifications</li>
                <li>Resend — email delivery</li>
                <li>Google AdSense & Analytics — advertising and aggregated analytics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>Under Kenya's Data Protection Act (2019) and applicable laws, you have the right to:</p>
              <ul>
                <li>Access, correct, or delete your personal data</li>
                <li>Withdraw consent for marketing communications at any time</li>
                <li>Request data portability</li>
                <li>Lodge a complaint with the Office of the Data Protection Commissioner (Kenya)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cookies</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                We use essential cookies for authentication and session management, and analytics cookies (Google Analytics)
                to understand how the platform is used. You can disable non-essential cookies via your browser settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                For privacy questions or to exercise your rights, contact us at{' '}
                <a href="mailto:privacy@predictpro.guru" className="text-primary">privacy@predictpro.guru</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
