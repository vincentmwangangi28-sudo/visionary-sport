import React, { useEffect, useRef, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import {
  getAdSenseConfig,
  subscribeAdSenseConfig,
  isValidLiveAdSlot,
  AdSenseConfig,
} from '@/services/adsenseService';

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
  * - Never renders empty "Advertisement" labels or fake slot IDs during AdSense account review.
  * - Safely initializes window.adsbygoogle only when a verified live slot ID is configured.
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
  const [adFilled, setAdFilled] = useState(false);
  const [adUnfilled, setAdUnfilled] = useState(false);
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeAdSenseConfig((next) => setAdConfig(next));
    return unsub;
  }, []);

  const activeSlot =
    slot ||
    (format === 'rectangle'
      ? adConfig.slots.rectangle
      : format === 'horizontal'
      ? adConfig.slots.horizontal
      : format === 'fluid'
      ? adConfig.slots.feed
      : adConfig.slots.horizontal);

  const hasValidSlot = isValidLiveAdSlot(activeSlot);

  useEffect(() => {
    if (isPremium || !adConfig.enabled || adConfig.testMode || !hasValidSlot) {
      return;
    }

    if (pushedRef.current) return;

    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && adRef.current && adRef.current.innerHTML.trim() === '') {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          pushedRef.current = true;
        }
      } catch {
        setAdUnfilled(true);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isPremium, adConfig.enabled, adConfig.testMode, hasValidSlot]);

  useEffect(() => {
    const el = adRef.current;
    if (!el || !hasValidSlot) return;

    const observer = new MutationObserver(() => {
      const status = el.getAttribute('data-ad-status');
      if (status === 'filled') {
        setAdFilled(true);
        setAdUnfilled(false);
      } else if (status === 'unfilled') {
        setAdUnfilled(true);
        setAdFilled(false);
      }
    });

    observer.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });
    return () => observer.disconnect();
  }, [hasValidSlot]);

  if (isPremium || !adConfig.enabled) {
    return null;
  }

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
          <span>
            Pub: <strong className="font-mono text-foreground">{adConfig.publisherId}</strong>
          </span>
          <span>•</span>
          <span>
            Slot: <strong className="font-mono text-foreground">{activeSlot || 'Auto Ads'}</strong>
          </span>
          <span>•</span>
          <span>
            Format: <strong className="font-mono text-foreground">{format}</strong>
          </span>
        </div>
      </div>
    );
  }

  // Rely on Google AdSense Auto Ads (loaded in index.html <head>) when no manual slot ID is set or if unfilled
  if (!hasValidSlot || adUnfilled) {
    return null;
  }

  return (
    <div
      className={`ad-container w-full overflow-hidden flex flex-col items-center justify-center transition-all ${
        adFilled ? 'my-3' : 'my-0'
      } ${className}`}
      style={style}
    >
      {adFilled && (
        <div className="w-full text-right mb-1">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold pr-1">
            Advertisement
          </span>
        </div>
      )}

      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          textAlign: 'center',
          width: '100%',
          ...style,
        }}
        data-ad-client={adConfig.publisherId}
        data-ad-slot={activeSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      />
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
