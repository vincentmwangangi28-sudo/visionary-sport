import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import heroStadium from "@/assets/hero-stadium.jpg";
import { GeneratePredictionDialog } from "./GeneratePredictionDialog";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

export const Hero = () => {
  const { user } = useAuth();
  const [bgLoaded, setBgLoaded] = useState(false);

  // Preload hero image
  useEffect(() => {
    const img = new Image();
    img.src = heroStadium;
    img.onload = () => setBgLoaded(true);
  }, []);

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay - LCP optimized with responsive sizes */}
      <div className="absolute inset-0" aria-hidden="true">
        <img 
          src={heroStadium}
          alt=""
          fetchPriority="high"
          decoding="async"
          sizes="100vw"
          className={`w-full h-full object-cover transition-opacity duration-500 ${bgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setBgLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background"></div>
      </div>
      
      {/* Placeholder while loading */}
      {!bgLoaded && (
        <div className="absolute inset-0 bg-gradient-to-b from-muted to-background" aria-hidden="true" />
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-primary">AI-Powered Predictions</span>
          </div>

          {/* Main Heading - H1 for SEO */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Kenya's #1{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              AI Football Predictions
            </span>
          </h1>

          {/* Subheading with keywords */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Get 85%+ accurate football betting tips with real-time match analysis, 
            confidence scores, and expert reasoning. Join 10K+ Kenyans winning with PredictPro.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            {user ? (
              <GeneratePredictionDialog />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Link to="/auth" aria-label="Start your free trial">
                  <Button variant="hero" size="lg" className="group">
                    Start Your Free Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">No credit card required • 100 free coins to start</p>
              </div>
            )}
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => document.getElementById('predictions')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label="View today's predictions"
            >
              View Today's Predictions
            </Button>
          </div>

          {/* Stats with semantic markup */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto" role="group" aria-label="Platform statistics">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary animate-counter" aria-label="85% accuracy rate">85%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary animate-counter" aria-label="Over 10,000 active users">10K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary animate-counter" aria-label="50+ daily predictions">50+</div>
              <div className="text-sm text-muted-foreground">Daily Predictions</div>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 pt-8 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Trusted by professional bettors across Kenya</span>
          </div>
        </div>
      </div>

      {/* Animated gradient orb - reduced for performance */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-pulse-glow" aria-hidden="true"></div>
    </div>
  );
};
