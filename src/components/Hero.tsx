import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
const heroStadium = "/hero-stadium.webp";
import { GeneratePredictionDialog } from "./GeneratePredictionDialog";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export const Hero = () => {
  const { user } = useAuth();
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = heroStadium;
    img.onload = () => setBgLoaded(true);
  }, []);

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0" aria-hidden="true">
        <img 
          src={heroStadium}
          alt=""
          fetchPriority="high"
          decoding="async"
          sizes="100vw"
          className={`w-full h-full object-cover transition-opacity duration-700 ${bgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setBgLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background"></div>
      </div>
      
      {!bgLoaded && (
        <div className="absolute inset-0 bg-gradient-to-b from-muted to-background" aria-hidden="true" />
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-primary">AI-Powered Predictions</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-bold tracking-tight"
          >
            Kenya's #1{" "}
            <span className="gradient-text-animated">
              AI Football Predictions
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
          >
            Get 85%+ accurate football betting tips with real-time match analysis, 
            confidence scores, and expert reasoning. Join 10K+ Kenyans winning with PredictPro.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
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
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto" 
            role="group" 
            aria-label="Platform statistics"
          >
            {[
              { value: "85%", label: "Accuracy Rate" },
              { value: "10K+", label: "Active Users" },
              { value: "50+", label: "Daily Predictions" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                className="space-y-2"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary" aria-label={`${stat.value} ${stat.label}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex items-center justify-center gap-2 pt-8 text-sm text-muted-foreground"
          >
            <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Trusted by professional bettors across Kenya</span>
          </motion.div>
        </div>
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-pulse-glow" aria-hidden="true"></div>
      <div className="absolute bottom-1/3 left-1/6 w-48 h-48 bg-secondary/10 rounded-full blur-3xl animate-pulse" aria-hidden="true"></div>
    </div>
  );
};
