import { useEffect, useRef } from 'react';

interface Props {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window { adsbygoogle: unknown[] }
}

export const AdBanner = ({ slot = '', format = 'auto', className = '', style }: Props) => {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch { /* AdSense not loaded yet */ }
  }, []);

  return (
    <div className={`adsense-container overflow-hidden ${className}`} style={style}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-1375386376692976"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

// Horizontal banner (728x90 leaderboard area) - real AdSense ad unit slot
export const AdBannerHorizontal = ({ className = '' }: { className?: string }) => (
  <AdBanner slot="3324487082" format="horizontal" className={`w-full min-h-[90px] ${className}`} />
);

// Rectangle (300x250 medium rectangle) - reuses the same ad unit; create a
// dedicated slot in AdSense if you want independent rectangle-format serving
export const AdBannerRect = ({ className = '' }: { className?: string }) => (
  <AdBanner slot="3324487082" format="rectangle" className={`min-h-[250px] ${className}`} />
);

// Fluid (responsive, fits container) - reuses the same ad unit
export const AdBannerFluid = ({ className = '' }: { className?: string }) => (
  <AdBanner slot="3324487082" format="fluid" className={`w-full ${className}`} />
);
