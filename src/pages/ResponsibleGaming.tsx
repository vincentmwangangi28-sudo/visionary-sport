import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Phone, Heart, Clock, DollarSign, Users, HelpCircle } from 'lucide-react';

export default function ResponsibleGaming() {
  const warningSignsData = [
    'Spending more money than you can afford to lose',
    'Betting to recover previous losses',
    'Borrowing money or selling possessions to gamble',
    'Neglecting work, school, or family responsibilities',
    'Feeling restless or irritable when not gambling',
    'Lying to family or friends about gambling habits',
    'Gambling to escape problems or negative feelings',
  ];

  const tipsData = [
    { icon: DollarSign, title: 'Set a Budget', desc: 'Only bet what you can afford to lose. Never use rent or bill money.' },
    { icon: Clock, title: 'Set Time Limits', desc: 'Decide how long you\'ll bet before you start. Take regular breaks.' },
    { icon: Users, title: 'Don\'t Bet Alone', desc: 'Share your betting activity with someone you trust.' },
    { icon: Heart, title: 'Balance Your Life', desc: 'Ensure betting doesn\'t replace other activities you enjoy.' },
  ];

  const resourcesData = [
    { name: 'Betting Control and Licensing Board Kenya', phone: '+254 20 271 4413' },
    { name: 'Gamblers Anonymous Kenya', phone: 'WhatsApp: +254 700 000 000' },
    { name: 'National Council on Problem Gambling', website: 'www.ncpgambling.org' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Helmet>
        <title>Responsible Gaming | PredictPro Kenya</title>
        <meta name="description" content="Responsible gambling practices: set limits, recognize warning signs and find help resources. Bet safely with PredictPro." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Responsible Gaming | PredictPro Kenya" />
        <meta property="og:description" content="Your guide to safe and responsible sports betting in Kenya. Tips, resources and support." />
        <meta property="og:url" content="https://visionary-sport.lovable.app/responsible-gaming" />
        <link rel="canonical" href="https://visionary-sport.lovable.app/responsible-gaming" />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Responsible Gaming</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Your wellbeing comes first. Bet smart, bet safe.
            </p>
          </div>

          {/* Age Warning */}
          <Alert className="mb-8 border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDescription className="ml-2 text-lg font-medium">
              You must be 18 years or older to use betting services in Kenya.
            </AlertDescription>
          </Alert>

          {/* Our Commitment */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Our Commitment to You
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                At PredictPro, we believe that sports betting should be entertaining and enjoyable. 
                While our AI predictions can help inform your decisions, we want to ensure you always 
                bet responsibly. Remember: our predictions are tools, not guarantees.
              </p>
              <p>
                We are committed to promoting responsible gambling and providing resources to help 
                you maintain healthy betting habits. If betting stops being fun, it's time to stop.
              </p>
            </CardContent>
          </Card>

          {/* Tips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {tipsData.map((tip, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <tip.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground">{tip.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Warning Signs */}
          <Card className="mb-8 border-orange-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Warning Signs of Problem Gambling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {warningSignsData.map((sign, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Help Resources */}
          <Card className="mb-8 border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-500" />
                Get Help & Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                If you or someone you know has a gambling problem, help is available:
              </p>
              <div className="space-y-4">
                {resourcesData.map((resource, index) => (
                  <div key={index} className="p-4 bg-background rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{resource.name}</p>
                      {resource.phone && (
                        <p className="text-sm text-primary">{resource.phone}</p>
                      )}
                      {resource.website && (
                        <p className="text-sm text-primary">{resource.website}</p>
                      )}
                    </div>
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Self-Exclusion */}
          <Card>
            <CardHeader>
              <CardTitle>Self-Exclusion Options</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                If you need to take a break from betting, you can request a self-exclusion 
                from your betting platforms. Contact customer support for any platform you 
                use, or reach out to the Betting Control and Licensing Board of Kenya for 
                nationwide exclusion options.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
