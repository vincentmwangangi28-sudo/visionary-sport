import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Target } from "lucide-react";

const FAQ = [
  { q: "How accurate are PredictPro's Premier League predictions?", a: "Our AI analyses form, head-to-head records, injuries and historical data to achieve an average accuracy of 74-87% on Premier League matches, depending on the confidence tier." },
  { q: "Are Premier League predictions free?", a: "Yes — all standard predictions are free. Premium subscribers get correct score predictions, higher-confidence picks and advanced H2H analysis." },
  { q: "Which Premier League teams are hardest to predict?", a: "Derby matches (Arsenal vs Chelsea, Man City vs Liverpool) and mid-table clashes tend to have lower confidence scores due to tactical unpredictability." },
  { q: "How often are predictions updated?", a: "Predictions are generated daily at 6AM EAT and updated whenever new team news, injuries or odds changes are detected." },
];

export default function PremierLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Premier League Predictions Today 2025/26 | Free AI Tips | PredictPro"
        description="Free Premier League predictions for today's matches. AI-powered tips with confidence scores, H2H stats and value bets. Arsenal, Man City, Liverpool, Chelsea predictions."
        canonical="/premier-league-predictions"
        keywords="Premier League predictions today, EPL predictions, Premier League tips today, Arsenal predictions, Man City tips, Liverpool predictions, Chelsea prediction, Premier League AI tips free"
        structuredData={{
          '@type': 'FAQPage',
          mainEntity: FAQ.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a }
          }))
        }}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-blue-600 text-white">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</Badge>
          <h1 className="text-4xl font-black mb-3">Premier League Predictions Today</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AI-powered EPL predictions updated daily. Get confidence scores, H2H history, 
            form guides and value bets for every Premier League match.
          </p>
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            {['Arsenal','Chelsea','Man City','Liverpool','Tottenham','Man United'].map(t => (
              <Badge key={t} variant="outline" className="cursor-pointer hover:bg-primary/10">{t}</Badge>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[{ icon: Target, v: '74-87%', l: 'EPL Accuracy' }, { icon: Zap, v: '380', l: 'Matches/Season' }, { icon: TrendingUp, v: '20', l: 'Teams Covered' }].map(({ icon: Icon, v, l }) => (
            <Card key={l}><CardContent className="p-4 text-center"><Icon className="h-5 w-5 mx-auto text-primary mb-1" /><p className="font-bold text-xl">{v}</p><p className="text-xs text-muted-foreground">{l}</p></CardContent></Card>
          ))}
        </div>

        <PredictionsDashboard />

        {/* FAQ for SEO */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Premier League Predictions FAQ</h2>
          <div className="space-y-4">
            {FAQ.map((f, i) => (
              <Card key={i}><CardContent className="p-5">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </CardContent></Card>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="mt-10 p-6 bg-muted/30 rounded-xl">
          <h3 className="font-semibold mb-4">More Prediction Markets</h3>
          <div className="flex flex-wrap gap-2">
            {[{ to: '/correct-score', label: 'Correct Score' }, { to: '/btts', label: 'BTTS Tips' }, { to: '/value-bets', label: 'Value Bets' }, { to: '/accumulator', label: 'Acca Builder' }, { to: '/best-bets', label: 'Best Bets Today' }].map(l => (
              <Link key={l.to} to={l.to}><Button variant="outline" size="sm">{l.label}</Button></Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
