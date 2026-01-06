import { Helmet } from 'react-helmet-async';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | PredictPro Guru</title>
        <meta name="description" content="Terms of Service for PredictPro Guru - AI-powered sports prediction platform. Read our terms and conditions for using our services." />
        <link rel="canonical" href="https://www.predictpro.guru/terms" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 bg-gradient-hero bg-clip-text text-transparent">
              Terms of Service
            </h1>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>By accessing and using PredictPro Guru ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
                <p>The Service is intended for users who are at least 18 years of age. By using the Service, you represent and warrant that you are at least 18 years old.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>2. Description of Service</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>PredictPro Guru provides AI-powered sports predictions, analysis, and related content for informational and entertainment purposes only. Our predictions are generated using machine learning algorithms and historical data.</p>
                <p><strong>Important:</strong> Our predictions are not guaranteed to be accurate and should not be used as the sole basis for any gambling or betting decisions.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>3. Responsible Gaming</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>PredictPro Guru promotes responsible gaming. We strongly advise users to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Only bet what you can afford to lose</li>
                  <li>Set betting limits and stick to them</li>
                  <li>Never chase losses</li>
                  <li>Seek help if gambling becomes a problem</li>
                </ul>
                <p>If you or someone you know has a gambling problem, please contact a gambling helpline in your country.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>4. User Accounts</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>To access certain features, you may need to create an account. You are responsible for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>5. Payments and Refunds</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>Payments for premium features are processed through M-Pesa and other supported payment methods. All purchases of virtual coins are final and non-refundable unless required by applicable law.</p>
                <p>Subscription plans may be cancelled at any time, but refunds will not be issued for partial billing periods.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>6. Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>All content on PredictPro Guru, including predictions, analysis, graphics, and software, is the property of PredictPro Guru or its licensors and is protected by intellectual property laws.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>7. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>PredictPro Guru is not liable for any losses incurred as a result of using our predictions or services. The Service is provided "as is" without warranties of any kind.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>8. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>For questions about these Terms of Service, please contact us at: support@predictpro.guru</p>
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

export default Terms;
