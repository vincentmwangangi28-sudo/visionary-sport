import { Helmet } from 'react-helmet-async';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | PredictPro Guru</title>
        <meta name="description" content="Privacy Policy for PredictPro Guru. Learn how we collect, use, and protect your personal information." />
        <link rel="canonical" href="https://www.predictpro.guru/privacy" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 bg-gradient-hero bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>1. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>We collect information you provide directly to us, such as:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Account information (email, name)</li>
                  <li>Payment information (processed securely via M-Pesa)</li>
                  <li>Prediction history and preferences</li>
                  <li>Communications with our support team</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>2. Analytics and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>We use Google Analytics 4 (GA4) to understand how users interact with our service. GA4 collects:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Pages visited and time spent</li>
                  <li>Device and browser information</li>
                  <li>General location (country/city level)</li>
                  <li>Referral sources</li>
                </ul>
                <p><strong>Data Redaction:</strong> We have configured GA4 to automatically redact personally identifiable information (PII) from event parameters. Email addresses, phone numbers, and other personal identifiers are not stored in our analytics.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>3. Cookies</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>We use cookies and similar technologies for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential cookies:</strong> Required for site functionality and authentication</li>
                  <li><strong>Analytics cookies:</strong> Help us understand usage patterns (GA4)</li>
                  <li><strong>Advertising cookies:</strong> Used by Google AdSense to display relevant ads</li>
                </ul>
                <p>You can manage cookie preferences through your browser settings. Disabling cookies may affect site functionality.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>4. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>We use collected information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and improve our prediction services</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Send notifications about predictions and contests</li>
                  <li>Analyze usage to improve user experience</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>5. Data Security</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>We implement industry-standard security measures including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of data in transit (HTTPS)</li>
                  <li>Secure database storage with row-level security</li>
                  <li>Regular security audits and updates</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>6. Third-Party Services</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>We use the following third-party services:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Supabase:</strong> Database and authentication</li>
                  <li><strong>Google Analytics:</strong> Usage analytics</li>
                  <li><strong>Google AdSense:</strong> Advertising</li>
                  <li><strong>M-Pesa:</strong> Payment processing</li>
                </ul>
                <p>Each service has its own privacy policy governing data handling.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>7. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
                <p>Contact us at privacy@predictpro.guru to exercise these rights.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>8. Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>For privacy-related inquiries, please contact: privacy@predictpro.guru</p>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground mt-8">
              Last updated: January 6, 2026
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Privacy;
