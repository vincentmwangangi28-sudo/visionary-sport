export interface SiteAnnouncement {
  id: string;
  enabled: boolean;
  headline: string;
  message: string;
  theme: 'promo' | 'info' | 'urgent' | 'vip';
  targetAudience: 'all' | 'free' | 'vip';
  ctaText?: string;
  ctaUrl?: string;
  dismissible: boolean;
  expiresAt?: string;
  updatedAt: string;
  author: string;
}

const STORAGE_KEY = 'predictpro_site_announcement';
const DISMISSED_KEY_PREFIX = 'predictpro_announcement_dismissed_';

export const DEFAULT_ANNOUNCEMENT: SiteAnnouncement = {
  id: 'announcement-1',
  enabled: true,
  headline: 'Weekend AI Banker Slate Ready!',
  message: 'Premier League & Champions League algorithmic value bets with 87% accuracy now live.',
  theme: 'promo',
  targetAudience: 'all',
  ctaText: 'View Banker Picks',
  ctaUrl: '/best-bets',
  dismissible: true,
  updatedAt: new Date().toISOString(),
  author: 'Vincent Mwangangi',
};

export function getSiteAnnouncement(): SiteAnnouncement {
  if (typeof window === 'undefined') return DEFAULT_ANNOUNCEMENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENT));
      return DEFAULT_ANNOUNCEMENT;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ANNOUNCEMENT;
  }
}

export function saveSiteAnnouncement(announcement: SiteAnnouncement): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(announcement));
    window.dispatchEvent(new CustomEvent('site-announcement-updated', { detail: announcement }));
  } catch {
    // Local storage safe error
  }
}

export function isAnnouncementDismissed(id: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`${DISMISSED_KEY_PREFIX}${id}`) === 'true';
}

export function dismissAnnouncement(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${DISMISSED_KEY_PREFIX}${id}`, 'true');
  window.dispatchEvent(new CustomEvent('site-announcement-dismissed', { detail: id }));
}

export function resetAnnouncementDismissal(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${DISMISSED_KEY_PREFIX}${id}`);
}
