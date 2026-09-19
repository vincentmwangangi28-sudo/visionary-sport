import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getSiteAnnouncement, 
  dismissAnnouncement, 
  isAnnouncementDismissed, 
  SiteAnnouncement 
} from '@/services/broadcastService';
import { useSubscription } from '@/hooks/useSubscription';
import { Sparkles, Info, AlertTriangle, Crown, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SiteAnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<SiteAnnouncement>(getSiteAnnouncement);
  const [dismissed, setDismissed] = useState(false);
  const { isPremium } = useSubscription();

  const updateState = () => {
    const current = getSiteAnnouncement();
    setAnnouncement(current);
    setDismissed(isAnnouncementDismissed(current.id));
  };

  useEffect(() => {
    updateState();

    const handleUpdate = () => updateState();
    window.addEventListener('site-announcement-updated', handleUpdate);
    window.addEventListener('site-announcement-dismissed', handleUpdate);

    return () => {
      window.removeEventListener('site-announcement-updated', handleUpdate);
      window.removeEventListener('site-announcement-dismissed', handleUpdate);
    };
  }, []);

  if (!announcement || !announcement.enabled || dismissed) {
    return null;
  }

  // Check expiration date
  if (announcement.expiresAt) {
    const expireTime = new Date(announcement.expiresAt).getTime();
    if (!isNaN(expireTime) && Date.now() > expireTime) {
      return null;
    }
  }

  // Audience targeting
  if (announcement.targetAudience === 'vip' && !isPremium) {
    return null;
  }
  if (announcement.targetAudience === 'free' && isPremium) {
    return null;
  }

  const handleDismiss = () => {
    dismissAnnouncement(announcement.id);
    setDismissed(true);
  };

  // Theme styles
  const themeConfig = {
    promo: {
      bg: 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-background/95 text-emerald-100 border-emerald-500/30',
      icon: Sparkles,
      iconColor: 'text-emerald-400',
      btnVariant: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs',
      badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    },
    info: {
      bg: 'bg-gradient-to-r from-sky-950/80 via-sky-900/60 to-background/95 text-sky-100 border-sky-500/30',
      icon: Info,
      iconColor: 'text-sky-400',
      btnVariant: 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs',
      badge: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    },
    urgent: {
      bg: 'bg-gradient-to-r from-amber-950/85 via-amber-900/65 to-background/95 text-amber-100 border-amber-500/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      btnVariant: 'bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-xs',
      badge: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    },
    vip: {
      bg: 'bg-gradient-to-r from-violet-950/85 via-purple-900/65 to-background/95 text-purple-100 border-purple-500/30',
      icon: Crown,
      iconColor: 'text-amber-400',
      btnVariant: 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs',
      badge: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    },
  }[announcement.theme || 'promo'];

  const IconComponent = themeConfig.icon;

  return (
    <aside
      aria-label="Site announcement"
      className={`relative z-40 w-full border-b backdrop-blur-md px-4 py-2 text-xs shadow-xs animate-in slide-in-from-top duration-300 ${themeConfig.bg}`}
    >
      <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1 rounded-md bg-black/20 flex-shrink-0">
            <IconComponent className={`h-4 w-4 ${themeConfig.iconColor}`} />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
            {announcement.headline && (
              <span className="font-bold tracking-tight text-white flex-shrink-0">
                {announcement.headline}
              </span>
            )}
            <span className="text-white/80 line-clamp-1">
              {announcement.message}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {announcement.ctaText && announcement.ctaUrl && (
            <Link to={announcement.ctaUrl}>
              <Button
                size="sm"
                className={`h-7 text-[11px] px-2.5 gap-1 rounded-md transition-all ${themeConfig.btnVariant}`}
              >
                <span>{announcement.ctaText}</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}

          {announcement.dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="p-1 rounded-md text-white/60 hover:text-white hover:bg-black/20 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
