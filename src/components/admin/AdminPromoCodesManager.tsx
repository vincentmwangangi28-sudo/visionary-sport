import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  getPromoCodes, 
  addPromoCode, 
  togglePromoCodeActive, 
  deletePromoCode, 
  PromoCode 
} from '@/services/promoCodeService';
import { 
  Ticket, 
  Plus, 
  Coins, 
  Users, 
  CheckCircle2, 
  Copy, 
  Trash2, 
  Sparkles, 
  Crown,
  Share2,
  TrendingUp,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminPromoCodesManager() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [coinsReward, setCoinsReward] = useState(100);
  const [description, setDescription] = useState('');
  const [targetTier, setTargetTier] = useState<'all' | 'free' | 'vip'>('all');
  const [maxUses, setMaxUses] = useState(250);
  const [expiresAt, setExpiresAt] = useState('');

  const loadPromos = () => {
    setPromos(getPromoCodes());
  };

  useEffect(() => {
    loadPromos();
    const handleUpdate = () => loadPromos();
    window.addEventListener('promo-codes-updated', handleUpdate);
    return () => window.removeEventListener('promo-codes-updated', handleUpdate);
  }, []);

  const handleGenerateRandomCode = () => {
    const prefixes = ['VINCENT', 'BANKER', 'PREDICT', 'JACKPOT', 'ACCUM'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    setCode(`${randomPrefix}${randomNum}`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter or generate a code string.');
      return;
    }
    if (coinsReward <= 0) {
      toast.error('Coin reward must be greater than zero.');
      return;
    }

    addPromoCode({
      code: code.trim(),
      coinsReward,
      description: description.trim() || `Promo voucher worth ${coinsReward} coins.`,
      targetTier,
      maxUses: Number(maxUses) || 0,
      expiresAt: expiresAt || undefined,
      isActive: true,
      createdBy: 'Vincent Mwangangi',
    });

    toast.success(`Promo code ${code.toUpperCase()} successfully created!`);
    setIsCreating(false);
    setCode('');
    setDescription('');
    setCoinsReward(100);
    setMaxUses(250);
    setExpiresAt('');
  };

  const handleCopyShareLink = (codeStr: string) => {
    const url = `${window.location.origin}/shop?promo=${codeStr}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`Share link for ${codeStr} copied to clipboard!`);
    }).catch(() => {
      toast.info(`Promo code: ${codeStr}`);
    });
  };

  // Metrics
  const totalClaims = promos.reduce((sum, p) => sum + p.usedCount, 0);
  const totalCoinsDistributed = promos.reduce((sum, p) => sum + (p.usedCount * p.coinsReward), 0);
  const activeCodesCount = promos.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active Promo Vouchers</p>
              <p className="text-2xl font-bold tracking-tight mt-1">{activeCodesCount} <span className="text-xs font-normal text-muted-foreground">/ {promos.length}</span></p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Ticket className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Code Redemptions</p>
              <p className="text-2xl font-bold tracking-tight mt-1">{totalClaims.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Coins Distributed</p>
              <p className="text-2xl font-bold tracking-tight mt-1">🪙 {totalCoinsDistributed.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Coins className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Economy Authority</p>
              <p className="text-sm font-semibold tracking-tight mt-1 text-primary">Vincent Mwangangi</p>
              <p className="text-[10px] text-muted-foreground">Primary Administrator</p>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
              <Crown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table / Management Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Voucher & Promo Code Economy Hub
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Issue marketing promo codes, reward high-activity bettors, or run Telegram promotional giveaways.
              </CardDescription>
            </div>

            <Button 
              size="sm" 
              onClick={() => setIsCreating(!isCreating)}
              className="gap-1.5 text-xs font-semibold bg-primary"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Cancel Creation' : 'Create New Voucher'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Creation Form Collapse */}
          {isCreating && (
            <form
              onSubmit={handleCreate}
              toolname="create_promo_voucher"
              tooldescription="Create a new promotional coin voucher code for PredictPro users"
              className="p-4 rounded-xl border bg-muted/20 space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  New Promotional Voucher Specification
                </span>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateRandomCode}
                  className="h-7 text-xs gap-1"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  Generate Random Code
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Promo Code String</label>
                  <Input 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VINCENT2026"
                    className="text-xs uppercase font-mono font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Coins Granted on Claim</label>
                  <div className="relative">
                    <Input 
                      type="number"
                      min={10}
                      max={10000}
                      value={coinsReward}
                      onChange={(e) => setCoinsReward(Number(e.target.value))}
                      className="text-xs pl-8 font-semibold"
                      required
                    />
                    <span className="absolute left-2.5 top-2.5 text-xs text-amber-500">🪙</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Max Claim Limit (0 = Unlimited)</label>
                  <Input 
                    type="number"
                    min={0}
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Description / Purpose</label>
                  <Input 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Telegram Channel AFCON Giveaway"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Target Tier Access</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['all', 'free', 'vip'] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setTargetTier(tier)}
                        className={`py-1.5 px-2 rounded-lg border text-xs capitalize text-center transition-all ${
                          targetTier === tier 
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs' 
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tier === 'all' ? 'All Users' : tier === 'free' ? 'Free Only' : 'VIP Only'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCreating(false)} 
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  className="text-xs bg-primary font-semibold gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save & Publish Promo
                </Button>
              </div>
            </form>
          )}

          {/* Promo Codes List Table */}
          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Code & Details</th>
                    <th className="py-3 px-3">Coin Value</th>
                    <th className="py-3 px-3">Audience</th>
                    <th className="py-3 px-3">Redemption Progress</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {promos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No promo codes created yet. Click &quot;Create New Voucher&quot; to begin.
                      </td>
                    </tr>
                  ) : (
                    promos.map((p) => {
                      const pct = p.maxUses > 0 ? Math.min(100, Math.round((p.usedCount / p.maxUses) * 100)) : null;
                      return (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-foreground text-sm tracking-wider bg-muted/60 px-2 py-0.5 rounded border">
                                {p.code}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyShareLink(p.code)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                title="Copy shareable link"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                              {p.description}
                            </p>
                          </td>

                          <td className="py-3 px-3 font-semibold text-amber-500">
                            🪙 +{p.coinsReward.toLocaleString()}
                          </td>

                          <td className="py-3 px-3">
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] uppercase font-semibold ${
                                p.targetTier === 'vip' 
                                  ? 'border-purple-500/40 text-purple-400 bg-purple-500/5'
                                  : p.targetTier === 'free'
                                  ? 'border-sky-500/40 text-sky-400 bg-sky-500/5'
                                  : 'border-border text-muted-foreground'
                              }`}
                            >
                              {p.targetTier}
                            </Badge>
                          </td>

                          <td className="py-3 px-3 min-w-[140px]">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-medium text-foreground">{p.usedCount} used</span>
                              <span className="text-muted-foreground">
                                {p.maxUses > 0 ? `of ${p.maxUses}` : 'unlimited'}
                              </span>
                            </div>
                            {pct !== null && (
                              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    pct >= 90 ? 'bg-rose-500' : 'bg-primary'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={p.isActive}
                                onCheckedChange={() => togglePromoCodeActive(p.id)}
                              />
                              <span className={`text-[11px] font-medium ${p.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                {p.isActive ? 'Active' : 'Paused'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Delete promo code ${p.code}?`)) {
                                  deletePromoCode(p.id);
                                  toast.info(`Deleted promo code ${p.code}`);
                                }
                              }}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
