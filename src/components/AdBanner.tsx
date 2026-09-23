import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
  responsive?: boolean;
}

// AdSense publisher ID for this site (matches the script tag in index.html)
const ADSENSE_CLIENT_ID = "ca-pub-1375386376692976";

/**
 * Manual ad-unit slot IDs, created in the AdSense dashboard
 * (Ads → By ad unit). Auto Ads is enabled site-wide, so any slot
 * left empty here simply doesn't render a manual unit — Google
 * still fills the page automatically. Paste the numeric slot IDs
 * here once the ad units exist in the AdSense dashboard.
 */
export const AD_SLOTS = {
  sidebar: "",
  footer: "",
  inContent: "",
} as const;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const AdBanner = ({
  slot,
  format = "auto",
  className,
  responsive = true,
}: AdBannerProps) => {
  useEffect(() => {
    // Ask AdSense to fill this specific unit once the script is available
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet (ad blockers, slow network) — ignore
    }
  }, []);

  const getAdStyles = () => {
    switch (format) {
      case "horizontal":
        return { width: "100%", height: "90px" };
      case "vertical":
        return { width: "160px", height: "600px" };
      case "rectangle":
        return { width: "300px", height: "250px" };
      default:
        return {};
    }
  };

  return (
    <div
      className={cn(
        "ad-container overflow-hidden bg-muted/30 rounded-lg border border-border/50",
        "flex items-center justify-center min-h-[90px]",
        className,
      )}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          ...(!responsive && getAdStyles()),
        }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={responsive ? "auto" : undefined}
        data-full-width-responsive={responsive ? "true" : undefined}
      />
    </div>
  );
};

// Sidebar Ad — renders only once a real AdSense slot ID is configured
export const SidebarAd = ({ className }: { className?: string }) =>
  AD_SLOTS.sidebar ? (
    <AdBanner
      slot={AD_SLOTS.sidebar}
      format="rectangle"
      className={cn("sticky top-4", className)}
    />
  ) : null;

// Footer Banner Ad
export const FooterAd = ({ className }: { className?: string }) =>
  AD_SLOTS.footer ? (
    <AdBanner
      slot={AD_SLOTS.footer}
      format="horizontal"
      className={cn("w-full max-w-4xl mx-auto", className)}
    />
  ) : null;

// In-Content Ad (between cards)
export const InContentAd = ({ className }: { className?: string }) =>
  AD_SLOTS.inContent ? (
    <AdBanner
      slot={AD_SLOTS.inContent}
      format="auto"
      className={cn("my-6", className)}
      responsive={true}
    />
  ) : null;
