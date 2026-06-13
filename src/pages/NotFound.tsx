import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, Search, Zap } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Page Not Found | PredictPro"
        description="The page you're looking for doesn't exist. Browse our AI football predictions, live scores and betting tools."
        canonical={location.pathname}
        noIndex={true}
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-4">⚽</div>
          <h1 className="text-4xl font-black mb-2">404</h1>
          <p className="text-xl text-muted-foreground mb-2">This page took a wrong turn</p>
          <p className="text-sm text-muted-foreground mb-8">
            The page <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{location.pathname}</code> doesn't exist. 
            Let's get you back on pitch.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/"><Button className="gap-2"><Home className="h-4 w-4" />Home</Button></Link>
            <Link to="/best-bets"><Button variant="outline" className="gap-2"><Zap className="h-4 w-4" />Best Bets</Button></Link>
            <Link to="/predict"><Button variant="outline" className="gap-2"><Search className="h-4 w-4" />Predictor</Button></Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
