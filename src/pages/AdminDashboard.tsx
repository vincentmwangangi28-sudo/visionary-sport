import { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Link } from 'react-router-dom';
import { 
  DollarSign, Sparkles, LayoutDashboard, Clock, ShieldCheck, 
  ShieldAlert, Zap, Users, AlertTriangle, LogIn, BarChart3, CheckCircle2, LogOut, Lock,
  Megaphone, Ticket, CheckCheck, Settings2, FileText, Activity, Key
} from 'lucide-react';
import { GeminiTelegramAutomationHub } from '@/components/GeminiTelegramAutomationHub';
import { AdminCronJobsManager } from '@/components/AdminCronJobsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab';
import { AdminPredictionsTab } from '@/components/admin/AdminPredictionsTab';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminErrorsTab } from '@/components/admin/AdminErrorsTab';
import { AdminRevenueTab } from '@/components/admin/AdminRevenueTab';
import { AdminTrendsVisualization } from '@/components/admin/AdminTrendsVisualization';
import { AdminBroadcastBannerManager } from '@/components/admin/AdminBroadcastBannerManager';
import { AdminPromoCodesManager } from '@/components/admin/AdminPromoCodesManager';
import { AdminAutoSettlerTab } from '@/components/admin/AdminAutoSettlerTab';
import { AdminSystemConfigTab } from '@/components/admin/AdminSystemConfigTab';
import { AdminAuditLogTab } from '@/components/admin/AdminAuditLogTab';
import { AdminDiagnosticsTab } from '@/components/admin/AdminDiagnosticsTab';
import { AdminUserRolesManager } from '@/components/admin/AdminUserRolesManager';

interface DailyStat {
  date: string;
  revenue: number;
  transactions: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { 
    isAdmin, 
    isPrimaryAdmin, 
    designatedAdminName, 
    designatedAdminEmail, 
    checking: adminChecking, 
    roleSource 
  } = useAdmin();
  
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [stats, setStats] = useState({
    mrr: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalPredictions: 0,
    errorCount: 0,
  });
  const [dailyData, setDailyData] = useState<DailyStat[]>([]);
  const [planBreakdown, setPlanBreakdown] = useState<{ plan: string; count: number; revenue: number }[]>([]);
  const [fetching, setFetching] = useState(true);

  const loadStats = useCallback(async () => {
    setFetching(true);
    try {
      // 1. Transactions & Revenue
      const { data: txData } = await supabase
        .from('transactions')
        .select('amount, created_at, type')
        .eq('status', 'completed');

      const transactions = txData ?? [];
      const totalRevenue = transactions.reduce((s, t) => s + (t.amount ?? 0), 0);

      // 2. Daily revenue (last 30 days)
      const now = new Date();
      const daily: Record<string, DailyStat> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        daily[key] = { date: key, revenue: 0, transactions: 0 };
      }
      transactions.forEach(t => {
        const key = t.created_at?.slice(0, 10);
        if (key && daily[key]) {
          daily[key].revenue += t.amount ?? 0;
          daily[key].transactions++;
        }
      });
      setDailyData(Object.values(daily));

      // 3. Subscriptions
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('plan, price_kes')
        .eq('status', 'active');

      const plans: Record<string, { count: number; revenue: number }> = {};
      (subs ?? []).forEach(s => {
        if (!plans[s.plan]) plans[s.plan] = { count: 0, revenue: 0 };
        plans[s.plan].count++;
        plans[s.plan].revenue += s.price_kes ?? 0;
      });
      const mrr = Object.values(plans).reduce((s, p) => s + p.revenue, 0);
      setPlanBreakdown(Object.entries(plans).map(([plan, v]) => ({ plan, ...v })));

      // 4. Profiles
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      // 5. Total Predictions
      const { count: predictionsCount } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true });

      // 6. Captured Errors
      const { count: errorsCount } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true });

      setStats({
        mrr,
        totalRevenue,
        activeUsers: activeUsers ?? 0,
        totalTransactions: transactions.length,
        totalPredictions: predictionsCount ?? 8,
        errorCount: errorsCount ?? 0,
      });
    } catch {
      // Fallback safe state
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin, loadStats]);

  if (authLoading || adminChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs text-muted-foreground">Authenticating Administrator Privileges...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated or not an admin, show strict security gateway card
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-28 max-w-lg flex flex-col items-center justify-center">
          <Card className="w-full text-center border-rose-500/30 shadow-xl overflow-hidden">
            <div className="h-1.5 bg-rose-500 w-full" />
            <CardContent className="p-8 space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
                <Lock className="h-7 w-7" />
              </div>
              
              <div className="space-y-1.5">
                <Badge variant="outline" className="text-[11px] text-rose-500 border-rose-500/30 bg-rose-500/5 mb-1">
                  Access Restricted
                </Badge>
                <h2 className="text-xl font-bold tracking-tight">Admin Operations Terminal</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  PredictPro operations hub is locked and restricted to designated administrator <strong className="text-foreground">{designatedAdminName}</strong> ({designatedAdminEmail}).
                </p>
              </div>

              {user ? (
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Account:</span>
                    <span className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">Unauthorized</span>
                  </div>
                  <div className="font-semibold text-foreground font-mono truncate">{user.email}</div>
                  <div className="text-[11px] text-muted-foreground">
                    This account lacks administrative authorization. To avoid unauthorized modifications, access is strictly blocked.
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-muted/40 text-xs text-muted-foreground border">
                  You are not currently authenticated. Please sign in as <strong>{designatedAdminName}</strong> to continue.
                </div>
              )}

              <div className="space-y-2.5 pt-2">
                {!user ? (
                  <Link to="/auth" className="block w-full">
                    <Button className="w-full gap-2 text-xs bg-primary hover:bg-primary/90">
                      <LogIn className="h-4 w-4" />
                      Sign In as {designatedAdminName}
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full gap-2 text-xs border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                    onClick={async () => {
                      await signOut();
                      window.location.href = '/auth';
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out & Switch Account
                  </Button>
                )}
                
                <Link to="/" className="block w-full">
                  <Button variant="ghost" className="w-full text-xs">
                    Return to Predictions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Operations & Control</h1>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 gap-1 bg-emerald-500/5 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                {designatedAdminName} (Admin)
              </Badge>
              {isPrimaryAdmin && (
                <Badge variant="outline" className="text-sky-500 border-sky-500/30 gap-1 bg-sky-500/5 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" />
                  Root Administrator
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Designated administrator terminal: <span className="font-semibold text-foreground">{user?.email}</span>. Live platform telemetry, Gemini AI automations, match prediction publishing, and error monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Admin Session: <strong className="text-foreground">{designatedAdminName}</strong>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-xl bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="overview" className="gap-2 text-xs">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Overview</span>
              </TabsTrigger>

              <TabsTrigger value="trends" className="gap-2 text-xs">
                <BarChart3 className="h-3.5 w-3.5 text-sky-500" />
                <span>Trends & DAU</span>
              </TabsTrigger>

              <TabsTrigger value="predictions" className="gap-2 text-xs">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Predictions</span>
              </TabsTrigger>

              <TabsTrigger value="settler" className="gap-2 text-xs">
                <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Auto-Settler</span>
              </TabsTrigger>

              <TabsTrigger value="broadcasts" className="gap-2 text-xs">
                <Megaphone className="h-3.5 w-3.5 text-amber-500" />
                <span>Broadcasts</span>
              </TabsTrigger>

              <TabsTrigger value="promos" className="gap-2 text-xs">
                <Ticket className="h-3.5 w-3.5 text-primary" />
                <span>Promo Vouchers</span>
              </TabsTrigger>

              <TabsTrigger value="users" className="gap-2 text-xs">
                <Users className="h-3.5 w-3.5 text-violet-500" />
                <span>Users & Coins</span>
              </TabsTrigger>

              <TabsTrigger value="roles" className="gap-2 text-xs">
                <Key className="h-3.5 w-3.5 text-amber-500" />
                <span>Admin Roles</span>
              </TabsTrigger>

              <TabsTrigger value="revenue" className="gap-2 text-xs">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                <span>Revenue</span>
              </TabsTrigger>

              <TabsTrigger value="automation" className="gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>AI & Telegram</span>
              </TabsTrigger>

              <TabsTrigger value="crons" className="gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                <span>Cron Jobs</span>
              </TabsTrigger>

              <TabsTrigger value="config" className="gap-2 text-xs">
                <Settings2 className="h-3.5 w-3.5 text-primary" />
                <span>Feature Flags</span>
              </TabsTrigger>

              <TabsTrigger value="audit" className="gap-2 text-xs">
                <FileText className="h-3.5 w-3.5 text-violet-500" />
                <span>Audit Trail</span>
              </TabsTrigger>

              <TabsTrigger value="diagnostics" className="gap-2 text-xs">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                <span>Diagnostics</span>
              </TabsTrigger>

              <TabsTrigger value="errors" className="gap-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <span>Errors ({stats.errorCount})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <AdminOverviewTab 
              stats={stats} 
              onRefresh={loadStats} 
              fetching={fetching} 
              onNavigateTab={setActiveTab} 
            />
          </TabsContent>

          {/* Trends & Accuracy Tab */}
          <TabsContent value="trends" className="space-y-6">
            <AdminTrendsVisualization onViewPredictions={() => setActiveTab('predictions')} />
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <AdminPredictionsTab />
          </TabsContent>

          {/* Match Auto-Settler Tab */}
          <TabsContent value="settler" className="space-y-6">
            <AdminAutoSettlerTab />
          </TabsContent>

          {/* Broadcasts & Banners Tab */}
          <TabsContent value="broadcasts" className="space-y-6">
            <AdminBroadcastBannerManager />
          </TabsContent>

          {/* Promo Vouchers & Economy Tab */}
          <TabsContent value="promos" className="space-y-6">
            <AdminPromoCodesManager />
          </TabsContent>

          {/* Users & Economy Tab */}
          <TabsContent value="users" className="space-y-6">
            <AdminUsersTab />
          </TabsContent>

          {/* Admin Roles & Privileges Tab */}
          <TabsContent value="roles" className="space-y-6">
            <AdminUserRolesManager />
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <AdminRevenueTab 
              stats={stats} 
              dailyData={dailyData} 
              planBreakdown={planBreakdown} 
              fetching={fetching} 
            />
          </TabsContent>

          {/* AI & Telegram Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <GeminiTelegramAutomationHub />
          </TabsContent>

          {/* Cron Jobs Tab */}
          <TabsContent value="crons" className="space-y-6">
            <AdminCronJobsManager />
          </TabsContent>

          {/* Feature Flags & System Config Tab */}
          <TabsContent value="config" className="space-y-6">
            <AdminSystemConfigTab />
          </TabsContent>

          {/* Admin Audit Trail & Ledger Tab */}
          <TabsContent value="audit" className="space-y-6">
            <AdminAuditLogTab />
          </TabsContent>

          {/* System Health & Diagnostics Tab */}
          <TabsContent value="diagnostics" className="space-y-6">
            <AdminDiagnosticsTab />
          </TabsContent>

          {/* Error Logs Tab */}
          <TabsContent value="errors" className="space-y-6">
            <AdminErrorsTab />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
