import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, Search, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { resolveReclaimed404Redirect } from "@/services/ahrefsOpportunitiesService";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const reclaimedTarget = useMemo(() => {
    return resolveReclaimed404Redirect(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (reclaimedTarget) {
      navigate(reclaimedTarget, { replace: true });
    } else {
      console.warn("404: non-existent route:", location.pathname);
    }
  }, [reclaimedTarget, navigate, location.pathname]);

  if (reclaimedTarget) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <SEO
          title="Redirecting to Canonical Hub | PredictPro"
          description="Preserving link equity and redirecting to the canonical predictive analytics page."
          noIndex={true}
        />
        <div className="text-center max-w-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Reclaiming Link Equity</h1>
          <p className="text-sm text-muted-foreground">
            Redirecting to <span className="font-mono text-emerald-500">{reclaimedTarget}</span>...
          </p>
          <Link to={reclaimedTarget}>
            <Button size="sm" className="gap-2 mt-2">
              Continue to {reclaimedTarget} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Page Not Found (404) | Browse Football Predictions"
        description="The requested page could not be found. Browse our daily AI football predictions, banker bets, and live scores."
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
