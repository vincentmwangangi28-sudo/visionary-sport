import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ChevronLeft, Share2, Zap } from "lucide-react";
import { AdBannerHorizontal } from '@/components/AdBanner';
import { WhatsAppShare } from "@/components/WhatsAppShare";

const ARTICLES: Record<string, { title: string; description: string; keywords: string; category: string; readTime: string; date: string; content: string }> = {
  "how-to-read-football-predictions": {
    title: "How to Read AI Football Predictions Like a Pro",
    description: "Learn to interpret confidence scores, probability percentages and odds in football predictions. Complete guide to using AI tips in your betting strategy.",
    keywords: "how to read football predictions, confidence score meaning, football prediction probability, AI football tips guide",
    category: "Strategy", readTime: "5 min", date: "2026-06-04",
    content: `## What is a Confidence Score?

A confidence score is our AI's estimate of how certain it is about a prediction. A **74% confidence** on Arsenal to win means the AI has found strong statistical support — form, H2H, home advant[...]

**Confidence tiers:**
- **85-95%** — Sure Bet tier. Strong statistical consensus across all metrics.
- **70-84%** — High Value tier. Clear favourite with solid supporting data.
- **55-69%** — Good Pick tier. Slight statistical edge but match is competitive.

## Understanding Probability vs Odds

If our AI gives Arsenal a **70% probability** of winning and the bookmaker offers **2.10 odds** (implied probability: 47.6%), that's a **value bet** — the AI thinks Arsenal is more likely to win[...]

**Expected Value formula:**
> EV = (Probability × Decimal Odds) - 1
> EV = (0.70 × 2.10) - 1 = **+0.47** (47% edge)

Any positive EV is worth considering.

## How to Use Predictions Responsibly

1. **Never bet more than 2-5% of your bankroll** on a single prediction
2. Use the **accumulator builder** to combine high-confidence picks for bigger returns
3. Check the **value bets page** for statistical edges over bookmakers
4. Track your bets in the **performance dashboard**
5. Always compare with your own research — AI is a tool, not a guarantee

## What Makes Our AI Different

Most prediction sites use simple form tables. PredictPro's AI analyses:
- Last 5 matches form (W/D/L with goals scored/conceded)
- Head-to-head history (last 6 encounters)
- Home/away performance split
- League position and recent trajectory
- Odds movement (sharp money indicator)

The result is a confidence score backed by real data, not intuition.`
  },
  "value-betting-explained": {
    title: "Value Betting in Football: A Complete Guide",
    description: "What is value betting, how to calculate expected value (EV) and why AI predictions help you find edges over bookmakers in football betting.",
    keywords: "value betting football guide, expected value football betting, beating bookmakers football, positive EV bets football",
    category: "Strategy", readTime: "8 min", date: "2026-06-03",
    content: `## What is Value Betting?

Value betting means placing bets where the **true probability is higher than what the odds imply**. If a coin flip pays 2.10 instead of 2.00, every flip has positive expected value — you'd be +5[...]

Football is the same. When our AI calculates Arsenal have a 70% chance of winning but Betika offers 2.20 (implied: 45.5%), you have a **+54% edge** on that bet.

## How to Calculate Value

**Step 1:** Get the AI probability (e.g., 65%)
**Step 2:** Convert bookmaker odds to implied probability: 1 ÷ 2.30 = 43.5%  
**Step 3:** Compare: 65% > 43.5% = **VALUE BET** ✅

**Value % = (AI Prob × Odds - 1) × 100**
> (0.65 × 2.30 - 1) × 100 = **+49.5% value**

## Why Most Bettors Ignore Value

The psychological trap: a 65% confidence prediction sounds risky. But over 100 bets at +49.5% EV, the math guarantees profit. Short-term variance is normal — the key is long-term consistency.

## Using PredictPro's Value Bet Finder

Our **Value Bets** page automatically calculates EV for every prediction with odds. Green means strong value (>15%), amber means moderate (5-15%).

**Best value bet leagues:** La Liga and Bundesliga tend to offer the most bookmaker inefficiencies. EPL is heavily traded so edges are smaller.`
  },
  "kpl-betting-guide-kenya": {
    title: "Kenya Premier League Betting Guide 2026",
    description: "Complete guide to betting on KPL. Best teams to back, M-Pesa payment options, prediction accuracy and tips for Kenya Premier League matches.",
    keywords: "KPL betting guide, Kenya Premier League predictions, Gor Mahia betting, AFC Leopards tips, SportPesa KPL, Betika KPL, M-Pesa betting football Kenya",
    category: "KPL", readTime: "5 min", date: "2026-05-29",
    content: `## Kenya Premier League 2025/26 Overview

The KPL features 18 clubs competing across a 34-match season. The most-predicted teams are:
- **Gor Mahia** — Record champions, strong home form at Kasarani
- **AFC Leopards (Ingwe)** — The Mashemeji Derby rivalry drives huge betting interest
- **Tusker FC** — Consistent mid-table, reliable home results
- **Bandari FC** — Strong at Mbaraki, tough away fixture for any team

## How to Bet on KPL in Kenya

**Via M-Pesa:**
PredictPro accepts Safaricom M-Pesa via Lipana STK Push. For premium predictions, go to **Shop → M-Pesa → Enter your Safaricom number**. The STK push sends to your phone — enter your PIN an[...]

**Recommended platforms:** SportPesa, Betika, Odibets all cover KPL extensively.

## KPL Prediction Patterns

From our AI analysis of KPL data:
- **Home advantage is stronger in KPL** than European leagues (~68% home win rate for top 6 teams)
- **Mashemeji Derby (Gor vs AFC Leopards)** is highly unpredictable — draw probability is 35%
- **Over 2.5 goals** hits less frequently in KPL (average 2.1 goals/match vs EPL's 2.7)

## Responsible Gambling in Kenya

If gambling affects your life, call **0800 723 253** (Kenya Responsible Gambling helpline — free).`
  },
};

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    nodes.push(
      <ul key={`list-${nodes.length}`} className="ml-4 list-disc marker:text-muted-foreground">
        {listBuffer.map((item, idx) => (
          <li key={idx} className="text-muted-foreground my-1">{item}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2).replace(/\*\*(.*?)\*\*/g, (_, t) => t));
      return;
    }

    // Non-list line: flush any pending list
    flushList();

    if (line.startsWith('## ')) {
      nodes.push(<h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('> ')) {
      nodes.push(<blockquote key={i} className="border-l-4 border-primary pl-4 italic text-muted-foreground my-3">{line.slice(2)}</blockquote>);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      nodes.push(<p key={i} className="font-bold my-1">{line.replace(/\*\*/g, '')}</p>);
    } else if (line === '') {
      nodes.push(<div key={i} className="h-2" />);
    } else {
      nodes.push(<p key={i} className="text-muted-foreground leading-relaxed my-1.5" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />);
    }
  });

  // flush any trailing list
  if (listBuffer.length) flushList();

  return nodes;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? ARTICLES[slug] : null;

  if (!post) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Article not found</h1>
        <Link to="/blog"><Button>← Back to Blog</Button></Link>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${post.title} | PredictPro`} description={post.description} keywords={post.keywords} canonical={`/blog/${slug}`}>
      </SEO>
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-3xl">
        <Link to="/blog" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4" />Back to Blog
        </Link>
        <Badge className="mb-4">{post.category}</Badge>
        <h1 className="text-3xl font-black mb-4 leading-tight">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b">
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.readTime} read</span>
          <span>{new Date(post.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <WhatsAppShare text={`${post.title} — predictpro.guru/blog/${slug}`} className="ml-auto" />
        </div>
        <article className="prose-sm max-w-none">{renderMarkdown(post.content)}</article>

        <AdBannerHorizontal className="my-6" />
        {/* CTA */}
        <Card className="mt-10 border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Put Theory into Practice</h3>
            <p className="text-muted-foreground text-sm mb-4">Use our AI to find value bets right now.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/value-bets"><Button>Find Value Bets</Button></Link>
              <Link to="/best-bets"><Button variant="outline">Today's Best Bets</Button></Link>
            </div>
          </CardContent>
        </Card>

        {/* Related */}
        <div className="mt-8">
          <h3 className="font-semibold mb-4">Related Articles</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(ARTICLES).filter(([s]) => s !== slug).slice(0, 2).map(([s, a]) => (
              <Link key={s} to={`/blog/${s}`} className="group">
                <Card className="hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <Badge className="text-xs mb-2">{a.category}</Badge>
                    <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">{a.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
