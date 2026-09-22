import React, { useEffect, useRef, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { getAdSenseConfig, subscribeAdSenseConfig, AdSenseConfig } from '@/services/adsenseService';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  layoutKey?: string;
  className?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
}

/**
 * Universal Google AdSense Banner Component
 * - Automatically hides for VIP / active paid subscribers.
 * - Safely initializes window.adsbygoogle in client-side React SPA lifecycle.
 * - Supports responsive breakpoints and prevents duplicate script execution or push errors.
 * - Features test fallback simulation in test/staging modes.
 */
export const AdBanner: React.FC<AdBannerProps> = ({
  slot,
  format = 'auto',
  layoutKey,
  className = '',
  style,
  responsive = true,
}) => {
  const { isPremium } = useSubscription();
  const [adConfig, setAdConfig] = useState<AdSenseConfig>(getAdSenseConfig);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  // Keep ad configuration reactive to live toggles
  useEffect(() => {
    const unsub = subscribeAdSenseConfig((next) => setAdConfig(next));
    return unsub;
  }, []);

  // Subscribers on active VIP plans enjoy an ad-free experience
  const isVipUser = isPremium();

  const activeSlot = slot || (
    format === 'rectangle' ? adConfig.slots.rectangle :
    format === 'horizontal' ? adConfig.slots.horizontal :
    format === 'fluid' ? adConfig.slots.feed :
    adConfig.slots.horizontal
  );

  useEffect(() => {
    // If VIP or AdSense disabled globally, do not inject
    if (isVipUser || !adConfig.enabled) {
      return;
    }

    if (pushedRef.current) return;

    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
        // Delay slightly to ensure element is attached to DOM
        const timer = setTimeout(() => {
          try {
            if (adRef.current && adRef.current.innerHTML.trim() === '') {
              window.adsbygoogle?.push({});
              pushedRef.current = true;
              setAdLoaded(true);
            }
          } catch (e) {
            console.warn('[AdSense] Push notice:', e);
            setAdError(true);
          }
        }, 150);

        return () => clearTimeout(timer);
      }
    } catch {
      setAdError(true);
    }
  }, [isVipUser, adConfig.enabled, activeSlot]);

  if (isVipUser || !adConfig.enabled) {
    return null;
  }

  // If in test mode, display clean high-contrast preview slot
  if (adConfig.testMode) {
    return (
      <div 
        className={`w-full border border-dashed border-primary/40 bg-muted/20 rounded-xl p-3 my-4 flex flex-col items-center justify-center text-center select-none ${className}`}
        style={style}
      >
        <span className="text-[10px] font-mono font-bold tracking-widest text-primary/70 uppercase">
          Advertisement • Google AdSense Preview
        </span>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          <span>Pub: <strong className="font-mono text-foreground">{adConfig.publisherId}</strong></span>
          <span>•</span>
          <span>Slot: <strong className="font-mono text-foreground">{activeSlot}</strong></span>
          <span>•</span>
          <span>Format: <strong className="font-mono text-foreground">{format}</strong></span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`ad-container w-full overflow-hidden flex flex-col items-center justify-center my-3 transition-all ${className}`}
      style={style}
    >
      <div className="w-full text-right mb-1">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold pr-1">
          Advertisement
        </span>
      </div>

      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          textAlign: 'center',
          minHeight: format === 'rectangle' ? '250px' : '90px',
          width: '100%',
          ...style,
        }}
        data-ad-client={adConfig.publisherId}
        data-ad-slot={activeSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      />

      {adError && null}
    </div>
  );
};

export const AdBannerHorizontal: React.FC<{ className?: string; slot?: string }> = ({ className, slot }) => (
  <AdBanner format="horizontal" slot={slot} className={className} />
);

export const AdBannerRect: React.FC<{ className?: string; slot?: string }> = ({ className, slot }) => (
  <AdBanner format="rectangle" slot={slot} className={className} />
);

export const AdBannerFluid: React.FC<{ className?: string; slot?: string; layoutKey?: string }> = ({ className, slot, layoutKey }) => (
  <AdBanner format="fluid" slot={slot} layoutKey={layoutKey} className={className} />
);
