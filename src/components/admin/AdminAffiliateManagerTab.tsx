import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Copy,
  CheckCircle2,
  ExternalLink,
  TrendingUp,
  Download,
  RefreshCw,
  Globe,
} from 'lucide-react';
import {
  getAffiliatePartners,
  saveAffiliatePartners,
  DEFAULT_AFFILIATE_PARTNERS,
  type AffiliatePartnerConfig,
} from '@/services/adminOverrideSyncService';
import { toast } from 'sonner';

export const AdminAffiliateManagerTab: React.FC = () => {
  const [partners, setPartners] = useState<AffiliatePartnerConfig[]>(() => getAffiliatePartners());

  const updatePartner = (bookmakerId: string, patch: Partial<AffiliatePartnerConfig>) => {
    const next = partners.map((p) => (p.bookmakerId === bookmakerId ? { ...p, ...patch } : p));
    setPartners(next);
    saveAffiliatePartners(next);
  };

  const handleResetDefaults = () => {
    setPartners(DEFAULT_AFFILIATE_PARTNERS);
    saveAffiliatePartners(DEFAULT_AFFILIATE_PARTNERS);
    toast.success('Reset affiliate partner links to default configurations');
  };

  const handleExportCsv = () => {
    const header = 'Bookmaker,Region,PromoCode,AffiliateURL,CPARateUSD,OutboundClicks,EstPipelineUSD\n';
    const rows = partners
      .map(
        (p) =>
          `"${p.name}","${p.region}","${p.promoCode}","${p.affiliateUrl}",${p.cpaRateUsd},${p.clicks},${(
            p.clicks *
            0.032 *
            p.cpaRateUsd
          ).toFixed(2)}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictpro-affiliate-conversions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported Affiliate Partner Conversion Ledger CSV');
  };

  const totals = useMemo(() => {
    const totalClicks = partners.reduce((acc, p) => acc + (p.clicks || 0), 0);
    const estFtds = Math.round(totalClicks * 0.032);
    const estRevenueUsd = partners.reduce(
      (acc, p) => acc + Math.round((p.clicks || 0) * 0.032) * (p.cpaRateUsd || 30),
      0
    );
    return { totalClicks, estFtds, estRevenueUsd };
  }, [partners]);

  return (
    <div className="space-y-6">
      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">
                Total Outbound Slip &amp; Code Clicks
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                {totals.totalClicks.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Tracked across /slip-generator &amp; /booking-code-converter
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">
                Projected FTD Conversions (3.2% CR)
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                {totals.estFtds.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Geo-matched regional sportsbook signups
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-500">
              <Globe className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">
                Estimated CPA Pipeline Value
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-500 mt-1">
                ${totals.estRevenueUsd.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Based on configured bookmaker CPA rates
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Registry Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Geo-Targeted Bookmaker Affiliate Links &amp; Promo Code Registry
              </CardTitle>
              <CardDescription className="text-xs">
                Paste your official affiliate tracking URLs (<code>?btag=...</code>, <code>?aff=...</code>) and promo codes. Visitors automatically see the partner matching their region.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetDefaults} className="h-8 text-xs gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
              </Button>
              <Button size="sm" onClick={handleExportCsv} className="h-8 text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" /> Export CSV Ledger
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {partners.map((partner) => (
            <div
              key={partner.bookmakerId}
              className="rounded-xl border bg-card p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-sm font-bold text-foreground">{partner.name}</span>
                  <span aria-hidden="true" className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{partner.region}</span>
                  <span aria-hidden="true" className="text-muted-foreground">·</span>
                  <span className="font-mono tabular-nums text-emerald-500 font-semibold">
                    {partner.clicks.toLocaleString()} clicks
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={partner.active}
                      onChange={(e) =>
                        updatePartner(partner.bookmakerId, { active: e.target.checked })
                      }
                      className="rounded border-border"
                    />
                    <span className="font-medium">
                      {partner.active ? 'Active on Public Slips' : 'Paused'}
                    </span>
                  </label>
                  <a
                    href={partner.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Test Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Affiliate Tracking URL (?btag= / ?aff=)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={partner.affiliateUrl}
                      onChange={(e) =>
                        updatePartner(partner.bookmakerId, { affiliateUrl: e.target.value })
                      }
                      className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(partner.affiliateUrl);
                        toast.success(`Copied ${partner.name} affiliate URL`);
                      }}
                      className="h-8 px-2.5 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Promo / Bonus Code
                  </label>
                  <input
                    type="text"
                    value={partner.promoCode}
                    onChange={(e) =>
                      updatePartner(partner.bookmakerId, { promoCode: e.target.value.toUpperCase() })
                    }
                    className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    CPA Rate ($ USD)
                  </label>
                  <input
                    type="number"
                    value={partner.cpaRateUsd}
                    onChange={(e) =>
                      updatePartner(partner.bookmakerId, {
                        cpaRateUsd: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex-1">
                  <input
                    type="text"
                    value={partner.bonusOffer}
                    onChange={(e) =>
                      updatePartner(partner.bookmakerId, { bonusOffer: e.target.value })
                    }
                    placeholder="Welcome bonus headline..."
                    className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs"
                  />
                </div>
                <span className="text-[11px] text-emerald-500 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto-saved &amp; live
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
