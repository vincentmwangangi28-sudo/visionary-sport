import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { DollarSign, Users, TrendingUp, ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface DailyStat { date: string; revenue: number; transactions: number; }

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ mrr: 0, totalRevenue: 0, activeUsers: 0, totalTransactions: 0 });
  const [dailyData, setDailyData] = useState<DailyStat[]>([]);
  const [planBreakdown, setPlanBreakdown] = useState<{ plan: string; count: number; revenue: number }[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    // Check admin role
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
  }, [isAdmin]);

  const loadStats = async () => {
    setFetching(true);
    try {
      // Total revenue & transactions from completed payments
      const { data: txData } = await supabase
        .from('transactions').select('amount, created_at, type')
        .eq('status', 'completed');

      const transactions = txData ?? [];
      const totalRevenue = transactions.reduce((s, t) => s + (t.amount ?? 0), 0);

      // Daily revenue (last 30 days)
      const now = new Date();
      const daily: Record<string, DailyStat> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        daily[key] = { date: key, revenue: 0, transactions: 0 };
      }
      transactions.forEach(t => {
        const key = t.created_at?.slice(0, 10);
        if (key && daily[key]) { daily[key].revenue += t.amount ?? 0; daily[key].transactions++; }
      });
      setDailyData(Object.values(daily));

      // Active subscriptions MRR & plan breakdown
      const { data: subs } = await supabase
        .from('subscriptions').select('plan, price_kes').eq('status', 'active');
      const plans: Record<string, { count: number; revenue: number }> = {};
      (subs ?? []).forEach(s => {
        if (!plans[s.plan]) plans[s.plan] = { count: 0, revenue: 0 };
        plans[s.plan].count++;
        plans[s.plan].revenue += s.price_kes ?? 0;
      });
      const mrr = Object.values(plans).reduce((s, p) => s + p.revenue, 0);
      setPlanBreakdown(Object.entries(plans).map(([plan, v]) => ({ plan, ...v })));

      // Active users (last 30 days via profiles)
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: activeUsers } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      setStats({ mrr, totalRevenue, activeUsers: activeUsers ?? 0, totalTransactions: transactions.length });
    } finally { setFetching(false); }
  };

  if (loading || isAdmin === null) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (isAdmin === false) return <Navigate to="/" replace />;

  const StatCard = ({ icon: Icon, label, value, sub }: { icon: typeof DollarSign; label: string; value: string; sub?: string }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3"><Icon className="h-6 w-6 text-primary" /></div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">Revenue Dashboard</h1>

        {fetching ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : stats.totalTransactions === 0 ? (
          <EmptyState icon={TrendingUp} title="No revenue data yet" description="Transactions will appear here once users start making payments." />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={DollarSign} label="MRR" value={`KES ${stats.mrr.toLocaleString()}`} sub="Monthly recurring revenue" />
              <StatCard icon={TrendingUp} label="Total Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} sub="All time" />
              <StatCard icon={Users} label="Active Users" value={stats.activeUsers.toLocaleString()} sub="Last 30 days" />
              <StatCard icon={ShoppingCart} label="Transactions" value={stats.totalTransactions.toLocaleString()} sub="Completed payments" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Daily Revenue (30 days)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Plan Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={planBreakdown} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="plan" tick={{ fontSize: 12 }} width={50} />
                      <Tooltip formatter={(v: number) => [v, 'Subscribers']} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
