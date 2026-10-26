import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Sparkles,
  LayoutGrid,
  Ticket,
  Flame,
} from 'lucide-react';
import { getVerifiedBookingCodes } from '@/services/adminOverrideSyncService';
import { toast } from 'sonner';

type PartnerWidgetType = 'MOTD_XG_CARD' | 'BOOKING_CODE_MINI' | 'TOP5_TICKER';
type PartnerWidgetTheme = 'DARK_OBSIDIAN' | 'EMERALD_TERMINAL' | 'LIGHT_BROADCAST';

export const AdminPartnerWidgetStudioTab: React.FC = () => {
  const [widgetType, setWidgetType] = useState<PartnerWidgetType>('MOTD_XG_CARD');
  const [theme, setTheme] = useState<PartnerWidgetTheme>('DARK_OBSIDIAN');
  const [partnerRefId, setPartnerRefId] = useState<string>('goal_africa_blog');
  const [leagueFilter, setLeagueFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bookingCodes = useMemo(() => getVerifiedBookingCodes(), []);

  const embedPath = useMemo(() => {
    const slug =
      widgetType === 'MOTD_XG_CARD'
        ? 'motd-xg'
        : widgetType === 'BOOKING_CODE_MINI'
        ? 'booking-codes'
        : 'daily-bankers';
    return `https://predictpro.guru/embed/${slug}?theme=${theme.toLowerCase()}&league=${encodeURIComponent(
      leagueFilter
    )}&ref=${encodeURIComponent(partnerRefId || 'partner')}`;
  }, [widgetType, theme, leagueFilter, partnerRefId]);

  const iframeHtmlSnippet = useMemo(() => {
    const height = widgetType === 'TOP5_TICKER' ? 380 : 320;
    const anchorText =
      widgetType === 'MOTD_XG_CARD'
        ? 'Football xG Predictions & Poisson Score Matrix by PredictPro'
        : widgetType === 'BOOKING_CODE_MINI'
        ? 'Free SportyBet, 1xBet & Bet9ja Booking Code Converter by PredictPro'
        : 'Daily Sure Football Predictions & Value Bets by PredictPro';

    return `<!-- PredictPro.guru Quantitative Football Widget + SEO Backlink -->
<div style="max-width:480px;width:100%;font-family:system-ui,-apple-system,sans-serif;">
  <iframe
    src="${embedPath}"
    width="100%"
    height="${height}"
    style="border:1px solid rgba(16,185,129,0.28);border-radius:14px;overflow:hidden;background:#090d16;"
    loading="lazy"
    title="PredictPro Live Football Analytics Widget"
  ></iframe>
  <div style="text-align:right;padding:4px 6px 0;font-size:11px;">
    <a href="https://predictpro.guru?utm_source=widget&utm_campaign=${encodeURIComponent(
      partnerRefId || 'partner'
    )}" target="_blank" rel="dofollow" style="color:#10b981;text-decoration:none;font-weight:600;">
      ⚡ ${anchorText}
    </a>
  </div>
</div>`;
  }, [embedPath, widgetType, partnerRefId]);

  const wordpressShortcodeSnippet = useMemo(() => {
    return `[predictpro_widget type="${widgetType.toLowerCase()}" theme="${theme.toLowerCase()}" league="${leagueFilter}" ref="${partnerRefId}"]`;
  }, [widgetType, theme, leagueFilter, partnerRefId]);

  const handleCopy = async (id: string, text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(`Copied ${label} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Clipboard copy failed');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-sky-500/30 bg-sky-500/5">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Code2 className="h-4 w-4 text-sky-500" />
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Embeddable Partner Widgets &amp; SEO Backlink Studio
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] text-sky-500 border-sky-500/30 font-mono"
              >
                ORGANIC DOFOLLOW DOMAIN AUTHORITY BUILDER
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Generate ready-to-paste HTML `&lt;iframe&gt;` widgets for partner football blogs, news portals, and tipster websites. Every embed includes a high-authority `rel=&quot;dofollow&quot;` SEO backlink to `https://predictpro.guru`.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleCopy('top-iframe', iframeHtmlSnippet, 'Complete HTML Widget + SEO Backlink')}
            className="gap-1.5 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shrink-0"
          >
            {copiedId === 'top-iframe' ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copy Embed HTML
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 5 COLS: Widget Customizer */}
        <Card className="lg:col-span-5 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              1. Configure Partner Widget &amp; Attribution
            </CardTitle>
            <CardDescription className="text-xs">
              Customize widget mode, visual theme, competition filter, and partner referral ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <span className="font-semibold text-foreground block">Select Widget Module</span>
              <div className="grid grid-cols-1 gap-1.5">
                {(
                  [
                    {
                      id: 'MOTD_XG_CARD',
                      label: '🔥 Match of the Day (MOTD) xG & 6×6 Score Card',
                      desc: 'Shows live expected goals, 1X2 probabilities & top exact score.',
                    },
                    {
                      id: 'BOOKING_CODE_MINI',
                      label: '🎟️ Universal Booking Code Mini-Converter',
                      desc: 'Displays verified SportyBet, 1xBet, Bet9ja & Betway codes.',
                    },
                    {
                      id: 'TOP5_TICKER',
                      label: '📊 Top 5 Daily High-Confidence Picks Table',
                      desc: 'Compact table of daily >82% probability bankers & Kelly stakes.',
                    },
                  ] as { id: PartnerWidgetType; label: string; desc: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setWidgetType(item.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      widgetType === item.id
                        ? 'bg-primary/15 border-primary text-foreground'
                        : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <p className="font-bold text-xs">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-foreground block">Visual Theme</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'DARK_OBSIDIAN', label: 'Obsidian' },
                    { id: 'EMERALD_TERMINAL', label: 'Emerald' },
                    { id: 'LIGHT_BROADCAST', label: 'Light' },
                  ] as { id: PartnerWidgetTheme; label: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                      theme === t.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500 font-bold'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">League Filter</label>
                <select
                  value={leagueFilter}
                  onChange={(e) => setLeagueFilter(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground"
                >
                  <option value="ALL">All Top Leagues</option>
                  <option value="EPL">Premier League</option>
                  <option value="UCL">Champions League</option>
                  <option value="LALIGA">La Liga</option>
                  <option value="CAF">Africa / FKF / NPFL</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Partner Ref Tag</label>
                <input
                  type="text"
                  value={partnerRefId}
                  onChange={(e) => setPartnerRefId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-muted/50 border border-border font-mono text-xs text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT 7 COLS: Live Interactive Widget Preview + Copy Snippets */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  2. Live Partner Widget Preview
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[10px]">
                  480px Responsive Container
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`rounded-2xl border p-4 space-y-3 transition-all ${
                  theme === 'LIGHT_BROADCAST'
                    ? 'bg-white text-slate-900 border-slate-200'
                    : theme === 'EMERALD_TERMINAL'
                    ? 'bg-emerald-950/90 text-white border-emerald-500/40'
                    : 'bg-slate-950 text-white border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between border-b border-current/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                      PP
                    </span>
                    <span className="font-extrabold text-xs tracking-tight">
                      PredictPro.guru Quantitative Feed
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400">
                    LIVE POISSON xG
                  </span>
                </div>

                {widgetType === 'MOTD_XG_CARD' && (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-sm">Arsenal vs Chelsea</p>
                        <p className="text-[11px] opacity-75">
                          Premier League · Sim xG: 2.18 – 1.12
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                        Over 2.5 Goals (86%)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] pt-1">
                      <div className="p-1.5 rounded bg-current/5">1: 58.4%</div>
                      <div className="p-1.5 rounded bg-current/5">X: 22.1%</div>
                      <div className="p-1.5 rounded bg-current/5">2: 19.5%</div>
                    </div>
                  </div>
                )}

                {widgetType === 'BOOKING_CODE_MINI' && (
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {bookingCodes.slice(0, 4).map((bc) => (
                      <div
                        key={bc.id}
                        className="p-2 rounded-lg bg-current/5 border border-current/10 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] opacity-70 block">{bc.bookmaker}</span>
                          <span className="font-black text-emerald-400">{bc.code}</span>
                        </div>
                        <span className="font-bold text-xs">{bc.totalOdds.toFixed(2)}x</span>
                      </div>
                    ))}
                  </div>
                )}

                {widgetType === 'TOP5_TICKER' && (
                  <div className="space-y-1.5 text-xs">
                    {[
                      { match: 'Arsenal vs Chelsea', pick: 'Over 2.5 Goals', prob: '86%', odds: '1.72' },
                      { match: 'Real Madrid vs Barcelona', pick: 'BTTS — Yes', prob: '84%', odds: '1.65' },
                      { match: 'Bayern vs Dortmund', pick: 'Home & Over 1.5', prob: '88%', odds: '1.64' },
                    ].map((row) => (
                      <div
                        key={row.match}
                        className="flex items-center justify-between py-1.5 px-2 rounded bg-current/5"
                      >
                        <span className="font-semibold">{row.match}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-emerald-400 font-bold">{row.pick}</span>
                          <span>@{row.odds}</span>
                          <span className="text-[10px] opacity-75">({row.prob})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-1 border-t border-current/10 flex items-center justify-between text-[11px]">
                  <span className="opacity-70 font-mono">ref={partnerRefId}</span>
                  <span className="text-emerald-400 font-semibold">
                    ⚡ Powered by PredictPro.guru (dofollow)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">
                  Ready-to-Paste HTML `&lt;iframe&gt;` + Dofollow Backlink Snippet
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopy('wp-short', wordpressShortcodeSnippet, 'WordPress Shortcode')
                    }
                    className="h-7 text-xs gap-1"
                  >
                    {copiedId === 'wp-short' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    WP Shortcode
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleCopy('html-embed', iframeHtmlSnippet, 'HTML Embed Code')
                    }
                    className="h-7 text-xs gap-1 font-bold"
                  >
                    {copiedId === 'html-embed' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy HTML Code
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {iframeHtmlSnippet}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
