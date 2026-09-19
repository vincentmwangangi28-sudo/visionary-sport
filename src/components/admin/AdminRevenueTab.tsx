import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, ShoppingCart, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { EmptyState } from '@/components/EmptyState';
import { toast } from 'sonner';

interface DailyStat {
  date: string;
  revenue: number;
  transactions: number;
}

interface RevenueProps {
  stats: {
    mrr: number;
    totalRevenue: number;
    activeUsers: number;
    totalTransactions: number;
  };
  dailyData: DailyStat[];
  planBreakdown: { plan: string; count: number; revenue: number }[];
  fetching: boolean;
}

export function AdminRevenueTab({ stats, dailyData, planBreakdown, fetching }: RevenueProps) {
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (stats.totalTransactions === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No revenue data recorded yet"
        description="Transactions and M-Pesa payments will appear here once processed."
      />
    );
  }

  const StatCard = ({ icon: Icon, label, value, sub }: { icon: typeof DollarSign; label: string; value: string; sub?: string }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="MRR" value={`KES ${stats.mrr.toLocaleString()}`} sub="Monthly recurring revenue" />
        <StatCard icon={TrendingUp} label="Total Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} sub="All time collected" />
        <StatCard icon={Users} label="Active Users" value={stats.activeUsers.toLocaleString()} sub="Last 30-day activity" />
        <StatCard icon={ShoppingCart} label="Transactions" value={stats.totalTransactions.toLocaleString()} sub="Completed payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Daily Revenue Trend (Last 30 Days)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const headers = ['Date', 'Revenue (KES)', 'Transactions'];
                const rows = dailyData.map(d => [`"${d.date}"`, `"${d.revenue}"`, `"${d.transactions}"`]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `predictpro_revenue_daily_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                toast.success('Exported daily revenue report as CSV');
              }}
              className="h-8 gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export Revenue CSV
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
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
          <CardHeader>
            <CardTitle className="text-base">Subscribers by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={planBreakdown} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="plan" tick={{ fontSize: 12 }} width={70} />
                <Tooltip formatter={(v: number) => [v, 'Subscribers']} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
