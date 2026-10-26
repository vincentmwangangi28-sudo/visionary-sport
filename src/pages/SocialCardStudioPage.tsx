import React, { useState, useMemo, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import {
  useAppLocale,
  generateMultilingualBroadcastText,
  type SupportedLocale,
} from '@/services/i18nLocalizationService';
import { getVerifiedBookingCodes } from '@/services/adminOverrideSyncService';
import { getClvSteamSignals } from '@/services/clvAndCopulaService';
import { toast } from 'sonner';
import {
  Download,
  Copy,
  Share2,
  Smartphone,
  Square,
  Sparkles,
  Check,
} from 'lucide-react';

export type SocialCardAspectRatio = '9:16' | '1:1';
export type SocialCardTemplateType =
  | 'DAILY_BANKERS'
  | 'BOOKING_CODES'
  | 'CLV_STEAM'
  | 'JACKPOT_17';
export type SocialCardThemeId = 'OBSIDIAN_EMERALD' | 'STADIUM_SLATE' | 'CLEAN_DAYLIGHT';

interface CardThemePalette {
  id: SocialCardThemeId;
  label: string;
  bgStart: string;
  bgEnd: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentText: string;
}

const CARD_THEMES: CardThemePalette[] = [
  {
    id: 'OBSIDIAN_EMERALD',
    label: 'Obsidian Emerald',
    bgStart: '#020617',
    bgEnd: '#0f172a',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    textPrimary: '#f8fafc',
    textMuted: '#94a3b8',
    accent: '#10b981',
    accentText: '#022c22',
  },
  {
    id: 'STADIUM_SLATE',
    label: 'Stadium Slate & Gold',
    bgStart: '#090d16',
    bgEnd: '#111827',
    cardBg: '#1f2937',
    cardBorder: '#374151',
    textPrimary: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#f59e0b',
    accentText: '#111827',
  },
  {
    id: 'CLEAN_DAYLIGHT',
    label: 'Clean Daylight Broadcast',
    bgStart: '#f8fafc',
    bgEnd: '#e2e8f0',
    cardBg: '#ffffff',
    cardBorder: '#cbd5e1',
    textPrimary: '#0f172a',
    textMuted: '#475569',
    accent: '#059669',
    accentText: '#ffffff',
  },
];

export const SocialCardStudioPage: React.FC = () => {
  const { locale, changeLocale, locales } = useAppLocale();
  const [aspectRatio, setAspectRatio] = useState<SocialCardAspectRatio>('9:16');
  const [templateType, setTemplateType] = useState<SocialCardTemplateType>('DAILY_BANKERS');
  const [themeId, setThemeId] = useState<SocialCardThemeId>('OBSIDIAN_EMERALD');
  const [customHeadline, setCustomHeadline] = useState('');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const activeTheme = useMemo(
    () => CARD_THEMES.find((t) => t.id === themeId) || CARD_THEMES[0],
    [themeId]
  );

  const curatedCodes = useMemo(() => getVerifiedBookingCodes(), []);
  const clvSignals = useMemo(() => getClvSteamSignals().slice(0, 4), []);

  const sporty = curatedCodes.find((c) =>
    c.bookmaker.toLowerCase().includes('sporty')
  );
  const onex = curatedCodes.find((c) => c.bookmaker.toLowerCase().includes('1x'));
  const bet9ja = curatedCodes.find((c) => c.bookmaker.toLowerCase().includes('bet9ja'));

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    []
  );

  const cardRows = useMemo(() => {
    if (templateType === 'BOOKING_CODES') {
      return [
        {
          title: `SportyBet Code: ${sporty?.code || 'BC7842Q'}`,
          subtitle: `${sporty?.legsCount || 4} Verified Bankers · Instant Load`,
          badge: `${Number(sporty?.totalOdds || 4.85).toFixed(2)} Odds`,
        },
        {
          title: `1xBet Code: ${onex?.code || '1X-9941A'}`,
          subtitle: `${onex?.legsCount || 5} Global Acca Legs · High Liquidity`,
          badge: `${Number(onex?.totalOdds || 6.40).toFixed(2)} Odds`,
        },
        {
          title: `Bet9ja Code: ${bet9ja?.code || 'B9J-5521K'}`,
          subtitle: '4 High-Probability European & CAF Picks',
          badge: `${Number(bet9ja?.totalOdds || 5.12).toFixed(2)} Odds`,
        },
        {
          title: 'Betika & SportPesa Universal Slip',
          subtitle: '1-Click Code Converter at predictpro.guru',
          badge: '100% Free',
        },
      ];
    }

    if (templateType === 'CLV_STEAM') {
      return clvSignals.map((sig) => ({
        title: `${sig.homeTeam} vs ${sig.awayTeam}`,
        subtitle: `${sig.market} · Open ${sig.openingOdds.toFixed(2)} → ${sig.currentBookieOdds.toFixed(2)}`,
        badge: `+${sig.clvBeatPct.toFixed(1)}% CLV`,
      }));
    }

    if (templateType === 'JACKPOT_17') {
      return [
        {
          title: 'Game 1: Arsenal vs Chelsea',
          subtitle: 'Locked Poisson Banker: Arsenal Win (1)',
          badge: '84% Conf',
        },
        {
          title: 'Game 2: Real Madrid vs Barcelona',
          subtitle: 'Double Chance Coverage: 1X (Home/Draw)',
          badge: '86% Conf',
        },
        {
          title: 'Game 3: Gor Mahia vs AFC Leopards',
          subtitle: 'Mashemeji Derby Banker: Gor Mahia (1)',
          badge: '83% Conf',
        },
        {
          title: 'Game 4: Bayern Munich vs Dortmund',
          subtitle: 'Locked Poisson Banker: Home Win (1)',
          badge: '88% Conf',
        },
      ];
    }

    // Default DAILY_BANKERS
    return [
      {
        title: 'Arsenal vs Chelsea',
        subtitle: 'Premier League · Over 2.5 Match Goals @ 1.72',
        badge: '86% Model',
      },
      {
        title: 'Real Madrid vs Barcelona',
        subtitle: 'La Liga · Both Teams to Score (Yes) @ 1.65',
        badge: '84% Model',
      },
      {
        title: 'Bayern Munich vs Dortmund',
        subtitle: 'Bundesliga · Bayern Win & Over 1.5 @ 1.64',
        badge: '88% Model',
      },
      {
        title: 'Gor Mahia vs AFC Leopards',
        subtitle: 'FKF Premier League · Gor Mahia Win (1) @ 1.75',
        badge: '83% Model',
      },
    ];
  }, [templateType, sporty, onex, bet9ja, clvSignals]);

  const defaultHeadline = useMemo(() => {
    if (customHeadline.trim()) return customHeadline.trim();
    if (templateType === 'BOOKING_CODES') return 'OFFICIAL BOOKING CODES CARD';
    if (templateType === 'CLV_STEAM') return 'SHARP STEAM & +CLV ALERTS';
    if (templateType === 'JACKPOT_17') return '17-GAME MEGA JACKPOT BRIEF';
    return 'DAILY QUANTITATIVE BANKERS';
  }, [customHeadline, templateType]);

  const broadcastCaption = useMemo(
    () =>
      generateMultilingualBroadcastText(locale, {
        dateLabel: todayLabel,
        sportyCode: sporty?.code || 'BC7842Q',
        sportyOdds: Number(sporty?.totalOdds || 4.85).toFixed(2),
        onexCode: onex?.code || '1X-9941A',
        onexOdds: Number(onex?.totalOdds || 6.40).toFixed(2),
        bet9jaCode: bet9ja?.code || 'B9J-5521K',
        bet9jaOdds: Number(bet9ja?.totalOdds || 5.12).toFixed(2),
        jackpotPool: 'KSh 348M / $2.7M',
      }),
    [locale, todayLabel, sporty, onex, bet9ja]
  );

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `predictpro-${templateType.toLowerCase()}-${aspectRatio.replace(':', 'x')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${aspectRatio} vector SVG card`);
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const width = 1080;
    const height = aspectRatio === '9:16' ? 1920 : 1080;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `predictpro-${templateType.toLowerCase()}-${width}x${height}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success(`Downloaded High-DPI (${width}×${height}) PNG Story Card`);
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      handleDownloadSvg();
    };
    img.src = url;
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(broadcastCaption);
      setCopiedCaption(true);
      toast.success('Copied localized WhatsApp/Telegram caption');
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch {
      toast.info('Caption ready to copy');
    }
  };

  const svgWidth = 1080;
  const svgHeight = aspectRatio === '9:16' ? 1920 : 1080;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Social Graphic & WhatsApp Story Card Studio (9:16 & 1:1) | PredictPro"
        description="Generate 1080p 9:16 WhatsApp Status / TikTok Story cards and 1:1 Telegram square graphics for daily football bankers, booking codes, and CLV alerts."
        canonical="/social-card-studio"
      />
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Viral Broadcast Studio</span>
              <span aria-hidden="true">·</span>
              <span>9:16 Story &amp; 1:1 Square</span>
              <span aria-hidden="true">·</span>
              <span>5 Languages</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Automated Social Graphic &amp; WhatsApp Story Studio
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Create instant 1080p social cards for WhatsApp Status, Telegram Channels, TikTok, and X with live booking codes, Poisson bankers, and 5-language captions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSvg}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export SVG</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadPng}
              className="gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download 1080p PNG ({aspectRatio})</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Columns: Configuration Controls & Localized Caption */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-5 rounded-xl border border-border bg-card space-y-4">
              <h2 className="text-sm font-bold text-foreground">1. Format &amp; Card Template</h2>

              {/* Aspect Ratio Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
                    aspectRatio === '9:16'
                      ? 'border-primary bg-primary/10 text-foreground font-bold'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Smartphone className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-bold">9:16 Story (1080×1920)</p>
                    <p className="text-[11px] text-muted-foreground">WhatsApp Status / TikTok</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
                    aspectRatio === '1:1'
                      ? 'border-primary bg-primary/10 text-foreground font-bold'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Square className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-bold">1:1 Square (1080×1080)</p>
                    <p className="text-[11px] text-muted-foreground">Telegram / X / Instagram</p>
                  </div>
                </button>
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground block">
                  Card Content Feed
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'DAILY_BANKERS', label: 'Daily 4-Leg Bankers' },
                      { id: 'BOOKING_CODES', label: 'SportyBet / 1xBet Codes' },
                      { id: 'CLV_STEAM', label: 'Sharp Steam (+CLV)' },
                      { id: 'JACKPOT_17', label: '17-Game Mega Jackpot' },
                    ] as const
                  ).map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplateType(tpl.id)}
                      className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer text-left ${
                        templateType === tpl.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground block">
                  Broadcast Color Theme
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {CARD_THEMES.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setThemeId(th.id)}
                      className={`px-2.5 py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer truncate ${
                        themeId === th.id
                          ? 'border-primary bg-primary/10 text-foreground font-bold'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Headline Override */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Custom Card Headline (Optional)
                </label>
                <input
                  type="text"
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  placeholder={defaultHeadline}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-xs"
                />
              </div>
            </div>

            {/* 5-Language Caption Box */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">
                  2. Companion Broadcast Caption ({locale.toUpperCase()})
                </h2>
                <div className="flex items-center gap-1">
                  {locales.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => changeLocale(l.code as SupportedLocale)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                        locale === l.code
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <pre className="p-3 rounded-lg bg-muted/50 border border-border text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                {broadcastCaption}
              </pre>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCaption}
                  className="flex-1 gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  {copiedCaption ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedCaption ? 'Copied Caption!' : 'Copy Caption Text'}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDownloadPng}
                  className="flex-1 gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Save Story PNG</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right 7 Columns: Live High-DPI Vector / Canvas Preview */}
          <div className="lg:col-span-7 p-6 rounded-xl border border-border bg-card flex flex-col items-center justify-center space-y-4">
            <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Live {aspectRatio} High-DPI Broadcast Card Preview
              </span>
              <span className="font-mono tabular-nums">
                {svgWidth} × {svgHeight} px
              </span>
            </div>

            <div
              className={`w-full flex justify-center items-center bg-muted/30 p-4 rounded-xl border border-border overflow-hidden ${
                aspectRatio === '9:16' ? 'max-w-[380px]' : 'max-w-[520px]'
              }`}
            >
              <svg
                ref={svgRef}
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto rounded-lg shadow-md"
                role="img"
                aria-label={`PredictPro ${defaultHeadline} social graphic`}
              >
                <defs>
                  <linearGradient id="cardBgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeTheme.bgStart} />
                    <stop offset="100%" stopColor={activeTheme.bgEnd} />
                  </linearGradient>
                </defs>

                {/* Canvas Background */}
                <rect width={svgWidth} height={svgHeight} fill="url(#cardBgGrad)" />

                {/* Top Brand Header */}
                <rect
                  x="60"
                  y={aspectRatio === '9:16' ? '80' : '50'}
                  width="960"
                  height={aspectRatio === '9:16' ? '190' : '140'}
                  rx="24"
                  fill={activeTheme.cardBg}
                  stroke={activeTheme.cardBorder}
                  strokeWidth="2"
                />
                <rect
                  x="96"
                  y={aspectRatio === '9:16' ? '116' : '78'}
                  width="64"
                  height="64"
                  rx="14"
                  fill={activeTheme.accent}
                />
                <text
                  x="128"
                  y={aspectRatio === '9:16' ? '158' : '120'}
                  textAnchor="middle"
                  fill={activeTheme.accentText}
                  fontFamily="sans-serif"
                  fontWeight="900"
                  fontSize="30"
                >
                  PP
                </text>
                <text
                  x="180"
                  y={aspectRatio === '9:16' ? '150' : '112'}
                  fill={activeTheme.textPrimary}
                  fontFamily="sans-serif"
                  fontWeight="800"
                  fontSize="36"
                >
                  PREDICTPRO.GURU
                </text>
                <text
                  x="180"
                  y={aspectRatio === '9:16' ? '186' : '146'}
                  fill={activeTheme.textMuted}
                  fontFamily="monospace"
                  fontWeight="600"
                  fontSize="22"
                >
                  {todayLabel} · 100% FREE QUANTITATIVE HUB
                </text>

                {/* Main Title Banner */}
                <text
                  x="60"
                  y={aspectRatio === '9:16' ? '345' : '248'}
                  fill={activeTheme.accent}
                  fontFamily="sans-serif"
                  fontWeight="900"
                  fontSize={aspectRatio === '9:16' ? '44' : '38'}
                >
                  {defaultHeadline}
                </text>

                {/* 4 Fixture / Code Rows */}
                {cardRows.map((row, idx) => {
                  const rowY =
                    aspectRatio === '9:16' ? 395 + idx * 290 : 285 + idx * 165;
                  const rowHeight = aspectRatio === '9:16' ? 255 : 145;
                  return (
                    <g key={idx}>
                      <rect
                        x="60"
                        y={rowY}
                        width="960"
                        height={rowHeight}
                        rx="22"
                        fill={activeTheme.cardBg}
                        stroke={activeTheme.cardBorder}
                        strokeWidth="2"
                      />
                      <text
                        x="100"
                        y={rowY + (aspectRatio === '9:16' ? 95 : 62)}
                        fill={activeTheme.textPrimary}
                        fontFamily="sans-serif"
                        fontWeight="800"
                        fontSize={aspectRatio === '9:16' ? '36' : '30'}
                      >
                        {row.title}
                      </text>
                      <text
                        x="100"
                        y={rowY + (aspectRatio === '9:16' ? 160 : 108)}
                        fill={activeTheme.textMuted}
                        fontFamily="monospace"
                        fontWeight="600"
                        fontSize={aspectRatio === '9:16' ? '26' : '22'}
                      >
                        {row.subtitle}
                      </text>
                      <rect
                        x="770"
                        y={rowY + (aspectRatio === '9:16' ? 75 : 40)}
                        width="210"
                        height={aspectRatio === '9:16' ? '76' : '64'}
                        rx="14"
                        fill={activeTheme.accent}
                      />
                      <text
                        x="875"
                        y={rowY + (aspectRatio === '9:16' ? 123 : 81)}
                        textAnchor="middle"
                        fill={activeTheme.accentText}
                        fontFamily="monospace"
                        fontWeight="900"
                        fontSize={aspectRatio === '9:16' ? '28' : '24'}
                      >
                        {row.badge}
                      </text>
                    </g>
                  );
                })}

                {/* Footer Strip */}
                <rect
                  x="60"
                  y={aspectRatio === '9:16' ? '1620' : '955'}
                  width="960"
                  height={aspectRatio === '9:16' ? '210' : '85'}
                  rx="20"
                  fill={activeTheme.cardBg}
                  stroke={activeTheme.accent}
                  strokeWidth="2"
                />
                <text
                  x="540"
                  y={aspectRatio === '9:16' ? '1705' : '1008'}
                  textAnchor="middle"
                  fill={activeTheme.textPrimary}
                  fontFamily="sans-serif"
                  fontWeight="800"
                  fontSize={aspectRatio === '9:16' ? '32' : '25'}
                >
                  SPORTYBET: {sporty?.code || 'BC7842Q'} · 1XBET: {onex?.code || '1X-9941A'} · PREDICTPRO.GURU
                </text>
                {aspectRatio === '9:16' && (
                  <text
                    x="540"
                    y="1765"
                    textAnchor="middle"
                    fill={activeTheme.accent}
                    fontFamily="monospace"
                    fontWeight="700"
                    fontSize="25"
                  >
                    POISSON xG · CLV STEAM · 17-GAME JACKPOT · 100% FREE
                  </text>
                )}
              </svg>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SocialCardStudioPage;
