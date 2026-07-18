import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FAQ = [
  { q: "Who will win World Cup 2026?", a: "Our AI gives Brazil and France the highest probability based on squad depth, recent form and historical World Cup performance." },
  { q: "Where is World Cup 2026 hosted?", a: "FIFA World Cup 2026 is co-hosted by USA, Canada and Mexico — the first three-nation edition featuring 48 teams." },
  { q: "Are World Cup 2026 predictions free?", a: "Yes — all standard predictions are free. Premium unlocks correct score tips and advanced H2H analysis." },
  { q: "How accurate are the predictions?", a: "Our AI achieved 76% accuracy on World Cup 2022 group stage vs the 65% industry benchmark." },
];

export default function WorldCupPredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="World Cup 2026 Predictions | Free AI Tips | PredictPro"
        description="Free FIFA World Cup 2026 predictions. Group stage tips, knockout analysis, odds and correct scores for all 48 teams. USA, Canada and Mexico hosting."
        canonical="/world-cup-predictions"
        keywords="World Cup 2026 predictions, FIFA World Cup tips, who will win World Cup 2026, World Cup betting tips, World Cup 2026 odds"
        structuredData={{ '@type': 'FAQPage', mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-amber-500 text-white px-4 py-1.5">🏆 FIFA World Cup 2026</Badge>
          <h1 className="text-4xl font-black mb-3">World Cup 2026 Predictions</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">AI predictions for every World Cup 2026 match. Group stage, knockouts and final — powered by Google Gemini AI.</p>
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            {['Brazil','France','Argentina','England','Spain','Germany','Portugal','Netherlands'].map(t=><Badge key={t} variant="outline">{t}</Badge>)}
          </div>
        </div>
        <PredictionsDashboard />
        <section className="mt-14">
          <h2 className="text-2xl font-bold mb-6">World Cup 2026 FAQ</h2>
          <div className="space-y-4">{FAQ.map((f,i)=><Card key={i}><CardContent className="p-5"><h3 className="font-semibold mb-2">{f.q}</h3><p className="text-sm text-muted-foreground">{f.a}</p></CardContent></Card>)}</div>
        </section>
        <div className="mt-10 p-6 bg-muted/30 rounded-xl">
          <h3 className="font-semibold mb-3">More Predictions</h3>
          <div className="flex flex-wrap gap-2">
            {[{to:'/premier-league-predictions',l:'Premier League'},{to:'/champions-league-predictions',l:'UCL'},{to:'/afcon-predictions',l:'AFCON'},{to:'/best-bets',l:'Best Bets'},{to:'/standings',l:'Standings'}].map(l=><Link key={l.to} to={l.to}><Button variant="outline" size="sm">{l.l}</Button></Link>)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
