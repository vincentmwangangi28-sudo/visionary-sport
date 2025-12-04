import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
  responsive?: boolean;
}

// Your AdSense client ID
const ADSENSE_CLIENT_ID = "ca-pub-1375386376692976";

export const AdBanner = ({ 
  slot, 
  format = "auto", 
  className,
  responsive = true 
}: AdBannerProps) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only push ads if AdSense script is loaded
    try {
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
      }
    } catch (error) {
      console.log("AdSense not loaded yet");
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
      ref={adRef}
      className={cn(
        "ad-container overflow-hidden bg-muted/30 rounded-lg border border-border/50",
        "flex items-center justify-center min-h-[90px]",
        className
      )}
    >
      {/* Placeholder for development - shows ad dimensions */}
      <div className="text-center p-4 text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
            Ad Space
          </span>
        </div>
        <p className="text-xs">
          {format === "horizontal" && "728x90 Leaderboard"}
          {format === "vertical" && "160x600 Skyscraper"}
          {format === "rectangle" && "300x250 Medium Rectangle"}
          {format === "auto" && "Responsive Ad Unit"}
        </p>
      </div>

      {/* 
        Uncomment this when AdSense is approved:
        
        <ins
          className="adsbygoogle"
          style={{ 
            display: "block",
            ...(!responsive && getAdStyles())
          }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={responsive ? "auto" : undefined}
          data-full-width-responsive={responsive ? "true" : undefined}
        />
      */}
    </div>
  );
};

// Sidebar Ad Component
export const SidebarAd = ({ className }: { className?: string }) => (
  <AdBanner 
    slot="sidebar-1" 
    format="rectangle" 
    className={cn("sticky top-4", className)} 
  />
);

// Footer Banner Ad
export const FooterAd = ({ className }: { className?: string }) => (
  <AdBanner 
    slot="footer-banner" 
    format="horizontal" 
    className={cn("w-full max-w-4xl mx-auto", className)} 
  />
);

// In-Content Ad (between cards)
export const InContentAd = ({ className }: { className?: string }) => (
  <AdBanner 
    slot="in-content" 
    format="auto" 
    className={cn("my-6", className)} 
    responsive={true}
  />
);
