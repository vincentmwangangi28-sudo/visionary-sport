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

// Horizontal banner (728x90 leaderboard area)
export const AdBannerHorizontal = ({ className = '' }: { className?: string }) => (
  <AdBanner slot="auto" format="horizontal" className={`w-full min-h-[90px] ${className}`} />
);

// Rectangle (300x250 medium rectangle)
export const AdBannerRect = ({ className = '' }: { className?: string }) => (
  <AdBanner slot="auto" format="rectangle" className={`min-h-[250px] ${className}`} />
);

// Fluid (responsive, fits container)
export const AdBannerFluid = ({ className = '' }: { className?: string }) => (
  <AdBanner slot="auto" format="fluid" className={`w-full ${className}`} />
);
