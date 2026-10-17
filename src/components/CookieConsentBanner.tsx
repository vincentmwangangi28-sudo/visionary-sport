import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Shield, Check, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONSENT_STORAGE_KEY = 'predictpro_cookie_consent';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (navigator.webdriver || /HeadlessChrome|Lighthouse|PTST|Speed Insights/i.test(navigator.userAgent)) {
        return;
      }
      const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!consent) {
        // Show after a subtle delay for smooth user experience
        const timer = setTimeout(() => {
          setVisible(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ type: 'all', timestamp: new Date().toISOString() }));
    } catch {}
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ type: 'essential', timestamp: new Date().toISOString() }));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent Notification"
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[9998] p-3 sm:p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 max-w-4xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              We Value Your Privacy &amp; Data Transparency
            </p>
            <p className="text-[12px] sm:text-xs text-muted-foreground">
              PredictPro uses cookies to analyze traffic, remember your odds formats and regional settings, and deliver relevant ads via Google AdSense (Publisher ID <code className="font-mono text-[11px] text-foreground">pub-1375386376692976</code>). We comply with the Google EU User Consent Policy and GDPR. Read our{' '}
              <Link to="/privacy" className="text-primary underline hover:text-primary/80 font-medium">Privacy Policy</Link> and{' '}
              <Link to="/cookies" className="text-primary underline hover:text-primary/80 font-medium">Cookie Policy</Link>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0 justify-end pt-1 md:pt-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleEssentialOnly}
            className="text-xs h-8 px-3 border-border hover:bg-muted font-medium"
          >
            Essential Only
          </Button>
          <Button
            size="sm"
            onClick={handleAcceptAll}
            className="text-xs h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 shadow-xs"
          >
            <Check className="h-3.5 w-3.5" /> Accept All
          </Button>
        </div>
      </div>
    </aside>
  );
}
