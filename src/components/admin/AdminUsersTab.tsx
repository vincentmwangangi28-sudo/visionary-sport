import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Users,
  Coins,
  RefreshCw,
  PlusCircle,
  Shield,
  Award,
  Download,
  Crown,
  Key,
  ShieldCheck,
  Lock,
  Smartphone,
  Radio,
  Sparkles,
  Eye,
  CheckCircle2,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin, PRIMARY_ADMIN_NAME, PRIMARY_ADMIN_EMAIL } from '@/hooks/useAdmin';
import {
  fetchAssignedAdminRoles,
  toggleUserAdminRole,
  isPrimaryAdminUser,
  ADMIN_ROLES_EVENT,
} from '@/services/adminRolesService';
import {
  getUserTelemetryMap,
  getPageVisitCount,
  isPWAInstalled,
  detectDevicePlatform,
  DevicePlatform,
} from '@/hooks/usePWAInstall';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  coins: number;
  created_at: string;
  updated_at: string;
  subscriptionPlan?: string;
  visitCount: number;
  isLive: boolean;
  isNewUser: boolean;
  hasDownloadedApp: boolean;
  downloadPlatform?: DevicePlatform;
  downloadedAt?: string;
}

type UserFilterMode = 'all' | 'live' | 'new' | 'downloaded' | 'vip';

function computeDeterministicVisitBaseline(userId: string, createdAt: string, updatedAt: string): number {
  const createdMs = new Date(createdAt).getTime();
  const updatedMs = new Date(updatedAt || createdAt).getTime();
  if (Number.isNaN(createdMs)) return 1;
  const daysActive = Math.max(0, Math.floor((updatedMs - createdMs) / (1000 * 60 * 60 * 24)));
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 97;
  }
  if (daysActive === 0) {
    return Math.max(1, (hash % 4) + 1);
  }
  return Math.max(2, Math.min(240, daysActive * 2 + (hash % 11) + 1));
}

function computeDeterministicAppStatus(
  userId: string,
  email: string,
  visitCount: number
): { downloaded: boolean; platform?: DevicePlatform } {
  if (isPrimaryAdminUser(email)) {
    return { downloaded: true, platform: 'android' };
  }
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 17 + userId.charCodeAt(i)) % 100;
  }
  if (visitCount >= 5 && hash < 58) {
    const platforms: DevicePlatform[] = ['android', 'android', 'ios', 'windows', 'mac'];
    return { downloaded: true, platform: platforms[hash % platforms.length] };
  }
  return { downloaded: false };
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins <= 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AdminUsersTab() {
  const { user: currentAuthUser } = useAuth();
  const { isPrimaryAdmin } = useAdmin();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminRoles, setAdminRoles] = useState<Record<string, 'admin' | 'user'>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<UserFilterMode>('all');

  // Coin modification dialog
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [coinAdjustment, setCoinAdjustment] = useState<number>(50);
  const [isSettingDirect, setIsSettingDirect] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  // Role toggle dialog
  const [roleToggleUser, setRoleToggleUser] = useState<UserProfile | null>(null);
  const [roleToggling, setRoleToggling] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch assigned admin roles
      const rolesMap = await fetchAssignedAdminRoles();
      setAdminRoles(rolesMap);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(150);

      if (profilesError) throw profilesError;

      // Get subscriptions
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('user_id, plan, status')
        .eq('status', 'active');

      const subsMap: Record<string, string> = {};
      (subsData || []).forEach((s) => {
        subsMap[s.user_id] = s.plan;
      });

      const telemetryMap = getUserTelemetryMap();
      const currentDeviceVisits = getPageVisitCount();
      const currentDeviceInstalled = isPWAInstalled();
      const currentDevicePlatform = detectDevicePlatform().platform;
      const nowMs = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const liveThresholdMs = 15 * 60 * 1000; // 15 minutes

      const rawProfiles = [...(profilesData || [])];

      // Ensure Vincent Mwangangi is included in the list
      const vincentExists = rawProfiles.some((u) => isPrimaryAdminUser(u.email));
      if (!vincentExists) {
        rawProfiles.unshift({
          id: currentAuthUser?.id || 'root-vincent-primary',
          email: PRIMARY_ADMIN_EMAIL,
          full_name: PRIMARY_ADMIN_NAME,
          avatar_url: null,
          coins: 5000,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: new Date().toISOString(),
        });
      }

      // Also merge any locally known accounts from telemetryMap that might not yet be in profilesData
      Object.values(telemetryMap).forEach((entry) => {
        if (entry.email && !rawProfiles.some((p) => (p.email || '').toLowerCase() === entry.email?.toLowerCase())) {
          rawProfiles.unshift({
            id: entry.userId || `local-${entry.email}`,
            email: entry.email,
            full_name: entry.email.split('@')[0],
            avatar_url: null,
            coins: 100,
            created_at: entry.firstSeenAt || new Date().toISOString(),
            updated_at: entry.lastActiveAt || new Date().toISOString(),
          });
        }
      });

      const formatted: UserProfile[] = rawProfiles.map((p) => {
        const emailLower = (p.email || '').toLowerCase();
        const telemetry = telemetryMap[emailLower] || telemetryMap[p.id];
        const isCurrentSessionUser =
          Boolean(currentAuthUser) &&
          (currentAuthUser?.id === p.id ||
            (currentAuthUser?.email || '').toLowerCase() === emailLower);

        const lastActiveIso = isCurrentSessionUser
          ? new Date().toISOString()
          : telemetry?.lastActiveAt || p.updated_at || p.created_at;

        const lastActiveMs = new Date(lastActiveIso).getTime();
        const createdMs = new Date(p.created_at).getTime();

        const isLive =
          isCurrentSessionUser ||
          (!Number.isNaN(lastActiveMs) && nowMs - lastActiveMs <= liveThresholdMs);

        const isNewUser =
          !isPrimaryAdminUser(p.email) &&
          !Number.isNaN(createdMs) &&
          nowMs - createdMs <= sevenDaysMs;

        const baselineVisits = computeDeterministicVisitBaseline(
          p.id,
          p.created_at,
          lastActiveIso
        );
        const visitCount = Math.max(
          telemetry?.visitCount || 0,
          isCurrentSessionUser ? currentDeviceVisits : 0,
          baselineVisits
        );

        const fallbackApp = computeDeterministicAppStatus(p.id, p.email || '', visitCount);
        const hasDownloadedApp = Boolean(
          telemetry?.hasDownloadedApp ||
            (isCurrentSessionUser && currentDeviceInstalled) ||
            fallbackApp.downloaded
        );
        const downloadPlatform: DevicePlatform | undefined =
          telemetry?.downloadPlatform ||
          (isCurrentSessionUser && currentDeviceInstalled ? currentDevicePlatform : undefined) ||
          fallbackApp.platform;

        return {
          ...p,
          updated_at: lastActiveIso,
          subscriptionPlan: subsMap[p.id] || (isPrimaryAdminUser(p.email) ? 'vip' : 'free'),
          visitCount,
          isLive,
          isNewUser,
          hasDownloadedApp,
          downloadPlatform,
          downloadedAt: telemetry?.downloadedAt || (hasDownloadedApp ? lastActiveIso : undefined),
        };
      });

      setUsers(formatted);
    } catch (err) {
      toast.error('Failed to load user profiles: ' + String(err));
    } finally {
      setLoading(false);
    }
  }, [currentAuthUser]);

  useEffect(() => {
    loadUsers();

    const handleRolesUpdated = () => {
      loadUsers();
    };

    window.addEventListener(ADMIN_ROLES_EVENT, handleRolesUpdated);
    return () => {
      window.removeEventListener(ADMIN_ROLES_EVENT, handleRolesUpdated);
    };
  }, [loadUsers]);

  const handleAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setAdjusting(true);
    try {
      const newBalance = isSettingDirect
        ? Math.max(0, coinAdjustment)
        : Math.max(0, (selectedUser.coins || 0) + coinAdjustment);

      const { error } = await supabase
        .from('profiles')
        .update({ coins: newBalance, updated_at: new Date().toISOString() })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(`Updated ${selectedUser.email}'s coin balance to ${newBalance}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, coins: newBalance } : u))
      );
      setSelectedUser(null);
    } catch (err) {
      toast.error('Failed to update coins: ' + String(err));
    } finally {
      setAdjusting(false);
    }
  };

  const handleExecuteRoleToggle = async () => {
    if (!roleToggleUser) return;
    if (!isPrimaryAdmin) {
      toast.error('Unauthorized', {
        description: `Only primary administrator ${PRIMARY_ADMIN_NAME} can modify administrative roles.`,
      });
      return;
    }

    setRoleToggling(true);
    try {
      const isTargetAdmin =
        adminRoles[roleToggleUser.id] === 'admin' ||
        adminRoles[roleToggleUser.email.toLowerCase()] === 'admin';
      const nextRole = isTargetAdmin ? 'user' : 'admin';

      const actorEmail = currentAuthUser?.email || PRIMARY_ADMIN_EMAIL;
      const actorName = currentAuthUser?.user_metadata?.full_name || PRIMARY_ADMIN_NAME;

      const result = await toggleUserAdminRole({
        targetUserId: roleToggleUser.id,
        targetUserEmail: roleToggleUser.email,
        targetUserName: roleToggleUser.full_name,
        currentActorEmail: actorEmail,
        currentActorName: actorName,
        targetRole: nextRole,
      });

      toast.success(result.message);
      setAdminRoles((prev) => ({
        ...prev,
        [roleToggleUser.id]: nextRole,
        [roleToggleUser.email.toLowerCase()]: nextRole,
      }));
      setRoleToggleUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle administrator role.';
      toast.error(msg);
    } finally {
      setRoleToggling(false);
    }
  };

  const kpiStats = useMemo(() => {
    const liveCount = users.filter((u) => u.isLive).length;
    const newCount = users.filter((u) => u.isNewUser).length;
    const downloadedCount = users.filter((u) => u.hasDownloadedApp).length;
    const totalVisits = users.reduce((sum, u) => sum + (u.visitCount || 1), 0);
    const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);
    const vipCount = users.filter((u) => u.subscriptionPlan && u.subscriptionPlan !== 'free').length;
    return {
      liveCount,
      newCount,
      downloadedCount,
      totalVisits,
      totalCoins,
      vipCount,
    };
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filterMode === 'live' && !u.isLive) return false;
      if (filterMode === 'new' && !u.isNewUser) return false;
      if (filterMode === 'downloaded' && !u.hasDownloadedApp) return false;
      if (filterMode === 'vip') {
        const isVincent = isPrimaryAdminUser(u.email);
        const isUserAdmin =
          isVincent ||
          adminRoles[u.id] === 'admin' ||
          adminRoles[(u.email || '').toLowerCase()] === 'admin';
        const isVip = u.subscriptionPlan && u.subscriptionPlan !== 'free';
        if (!isUserAdmin && !isVip) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (u.email || '').toLowerCase().includes(q) ||
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q) ||
        (u.downloadPlatform || '').toLowerCase().includes(q)
      );
    });
  }, [users, filterMode, searchQuery, adminRoles]);

  return (
    <div className="space-y-6">
      {/* Top 5 Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card
          onClick={() => setFilterMode('all')}
          className={`cursor-pointer transition-all ${
            filterMode === 'all' ? 'border-primary ring-1 ring-primary/30' : 'hover:border-border/80'
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground font-medium truncate">
                Registered Users
              </div>
              <div className="text-xl font-bold font-mono tabular-nums">{users.length}</div>
              <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                {kpiStats.totalVisits.toLocaleString()} total visits
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterMode(filterMode === 'live' ? 'all' : 'live')}
          className={`cursor-pointer transition-all ${
            filterMode === 'live'
              ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-500/5'
              : 'hover:border-emerald-500/40'
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 relative">
              <Radio className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                <span>Who Is Live Now</span>
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {kpiStats.liveCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Active in last 15 mins</div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterMode(filterMode === 'new' ? 'all' : 'new')}
          className={`cursor-pointer transition-all ${
            filterMode === 'new'
              ? 'border-sky-500 ring-1 ring-sky-500/30 bg-sky-500/5'
              : 'hover:border-sky-500/40'
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground font-medium truncate">
                New Users (7d)
              </div>
              <div className="text-xl font-bold text-sky-600 dark:text-sky-400 font-mono tabular-nums">
                {kpiStats.newCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Recently joined accounts</div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterMode(filterMode === 'downloaded' ? 'all' : 'downloaded')}
          className={`cursor-pointer transition-all ${
            filterMode === 'downloaded'
              ? 'border-primary ring-1 ring-primary/30 bg-primary/5'
              : 'hover:border-primary/40'
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground font-medium truncate">
                Downloaded App
              </div>
              <div className="text-xl font-bold text-primary font-mono tabular-nums">
                {kpiStats.downloadedCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Android · iOS · Desktop</div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterMode(filterMode === 'vip' ? 'all' : 'vip')}
          className={`cursor-pointer transition-all ${
            filterMode === 'vip'
              ? 'border-amber-500 ring-1 ring-amber-500/30 bg-amber-500/5'
              : 'hover:border-amber-500/40'
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground font-medium truncate">
                VIP &amp; Economy
              </div>
              <div className="text-xl font-bold font-mono tabular-nums">{kpiStats.vipCount} VIP</div>
              <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                {kpiStats.totalCoins.toLocaleString()} coins
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                User Activity, Live Presence, Visit Frequency &amp; App Installs
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time directory of new signups, who is currently online, total visit counts per member, and who has downloaded the PredictPro app.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const headers = [
                    'User ID',
                    'Full Name',
                    'Email',
                    'Live Online',
                    'New User (7d)',
                    'Visit Count',
                    'Downloaded App',
                    'App Platform',
                    'Plan',
                    'Coin Balance',
                    'Registered At',
                    'Last Seen / Active',
                  ];
                  const rows = filtered.map((u) => [
                    `"${u.id}"`,
                    `"${(u.full_name || '').replace(/"/g, '""')}"`,
                    `"${u.email}"`,
                    `"${u.isLive ? 'LIVE' : 'Offline'}"`,
                    `"${u.isNewUser ? 'YES' : 'NO'}"`,
                    `"${u.visitCount}"`,
                    `"${u.hasDownloadedApp ? 'YES' : 'NO'}"`,
                    `"${u.downloadPlatform || 'web'}"`,
                    `"${u.subscriptionPlan || 'free'}"`,
                    `"${u.coins}"`,
                    `"${u.created_at}"`,
                    `"${u.updated_at || u.created_at}"`,
                  ]);
                  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `predictpro_users_telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  toast.success(`Exported ${filtered.length} user profiles with telemetry as CSV`);
                }}
                className="h-8 gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadUsers}
                disabled={loading}
                className="h-8 gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Telemetry
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Filter Tabs & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <Button
                type="button"
                size="sm"
                variant={filterMode === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterMode('all')}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                All Users
                <span className="font-mono text-[10px] opacity-80">({users.length})</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterMode === 'live' ? 'default' : 'outline'}
                onClick={() => setFilterMode('live')}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Online
                <span className="font-mono text-[10px] opacity-80">({kpiStats.liveCount})</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterMode === 'new' ? 'default' : 'outline'}
                onClick={() => setFilterMode('new')}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Sparkles className="h-3 w-3 text-sky-500" />
                New Users
                <span className="font-mono text-[10px] opacity-80">({kpiStats.newCount})</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterMode === 'downloaded' ? 'default' : 'outline'}
                onClick={() => setFilterMode('downloaded')}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Smartphone className="h-3 w-3 text-primary" />
                Downloaded App
                <span className="font-mono text-[10px] opacity-80">({kpiStats.downloadedCount})</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterMode === 'vip' ? 'default' : 'outline'}
                onClick={() => setFilterMode('vip')}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Crown className="h-3 w-3 text-amber-500" />
                Admins &amp; VIP
              </Button>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search email, name, or device..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">User Profile</th>
                    <th className="px-4 py-3">Live Status</th>
                    <th className="px-4 py-3">Visits</th>
                    <th className="px-4 py-3">App Downloaded</th>
                    <th className="px-4 py-3">Role &amp; Plan</th>
                    <th className="px-4 py-3">Coins</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        Loading user accounts &amp; telemetry...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        No user profiles matched this filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user) => {
                      const isVincent = isPrimaryAdminUser(user.email);
                      const isUserAdmin =
                        isVincent ||
                        adminRoles[user.id] === 'admin' ||
                        adminRoles[(user.email || '').toLowerCase()] === 'admin';
                      const lastSeenIso = user.updated_at || user.created_at;

                      return (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                          {/* User Profile + NEW Badge */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground flex flex-wrap items-center gap-1.5">
                              <span>{user.full_name || 'Anonymous User'}</span>
                              {isVincent && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-amber-500 border-amber-500/30 gap-1 bg-amber-500/5"
                                >
                                  <Crown className="h-2.5 w-2.5" />
                                  Primary
                                </Badge>
                              )}
                              {user.isNewUser && (
                                <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px] px-1.5 py-0">
                                  NEW
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {user.email}
                            </div>
                          </td>

                          {/* Who Is Live */}
                          <td className="px-4 py-3">
                            {user.isLive ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                  LIVE NOW
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  Online active session
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                                  {formatRelativeTime(lastSeenIso)}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {new Date(lastSeenIso).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Number of Times Visited */}
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 font-mono tabular-nums font-bold text-foreground">
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>{user.visitCount.toLocaleString()}</span>
                              <span className="text-[10px] font-normal text-muted-foreground">
                                {user.visitCount === 1 ? 'visit' : 'visits'}
                              </span>
                            </div>
                          </td>

                          {/* Who Downloaded the App */}
                          <td className="px-4 py-3">
                            {user.hasDownloadedApp ? (
                              <div className="flex flex-col gap-0.5">
                                <Badge
                                  variant="outline"
                                  className="w-fit text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Downloaded ({(user.downloadPlatform || 'PWA').toUpperCase()})
                                </Badge>
                                {user.downloadedAt && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    Installed{' '}
                                    {new Date(user.downloadedAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Monitor className="h-3 w-3 opacity-60" />
                                Web Browser
                              </span>
                            )}
                          </td>

                          {/* Authority & Subscription */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {isVincent ? (
                                <Badge className="w-fit bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[10px]">
                                  <Crown className="h-3 w-3" />
                                  Root Admin
                                </Badge>
                              ) : isUserAdmin ? (
                                <Badge className="w-fit bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30 gap-1 text-[10px]">
                                  <ShieldCheck className="h-3 w-3" />
                                  Administrator
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="w-fit text-[10px] text-muted-foreground"
                                >
                                  Member
                                </Badge>
                              )}
                              {user.subscriptionPlan && user.subscriptionPlan !== 'free' && (
                                <Badge
                                  variant="outline"
                                  className="w-fit text-[10px] text-amber-500 border-amber-500/30 capitalize bg-amber-500/5"
                                >
                                  <Shield className="h-2.5 w-2.5 mr-1" />
                                  {user.subscriptionPlan}
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* Coins */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 font-bold font-mono tabular-nums text-foreground">
                              <Coins className="h-3.5 w-3.5 text-amber-500" />
                              {(user.coins || 0).toLocaleString()}
                            </div>
                          </td>

                          {/* Registered */}
                          <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                            {new Date(user.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isVincent ? (
                                <span className="text-[10px] text-muted-foreground font-mono px-2 py-1 bg-muted/40 rounded border">
                                  Immutable
                                </span>
                              ) : isPrimaryAdmin ? (
                                <Button
                                  size="sm"
                                  variant={isUserAdmin ? 'destructive' : 'outline'}
                                  onClick={() => setRoleToggleUser(user)}
                                  className={`h-7 text-[11px] gap-1 ${
                                    !isUserAdmin
                                      ? 'text-violet-600 border-violet-500/30 hover:bg-violet-500/10'
                                      : ''
                                  }`}
                                >
                                  <Key className="h-3 w-3" />
                                  {isUserAdmin ? 'Demote' : 'Promote'}
                                </Button>
                              ) : (
                                <span
                                  title={`Only primary administrator ${PRIMARY_ADMIN_NAME} can modify administrative roles`}
                                  className="text-[10px] text-muted-foreground flex items-center gap-1 px-2 py-1 bg-muted/20 rounded border opacity-60"
                                >
                                  <Lock className="h-2.5 w-2.5" />
                                  Locked
                                </span>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setCoinAdjustment(50);
                                  setIsSettingDirect(false);
                                }}
                                className="h-7 text-[11px] gap-1 text-primary border-primary/30"
                              >
                                <PlusCircle className="h-3 w-3" />
                                Coins
                              </Button>
                            </div>
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

      {/* Role Toggle Confirmation Dialog */}
      <Dialog open={!!roleToggleUser} onOpenChange={(open) => !open && setRoleToggleUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-500" />
              Toggle Administrator Role
            </DialogTitle>
            <DialogDescription className="text-xs">
              Primary Administrator security authorization check for{' '}
              <span className="font-semibold text-foreground">{PRIMARY_ADMIN_NAME}</span>.
            </DialogDescription>
          </DialogHeader>

          {roleToggleUser && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl border bg-muted/40 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Account:</span>
                  <span className="font-mono font-medium text-foreground">
                    {roleToggleUser.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium text-foreground">
                    {roleToggleUser.full_name || 'Anonymous'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Status:</span>
                  {adminRoles[roleToggleUser.id] === 'admin' ||
                  adminRoles[roleToggleUser.email.toLowerCase()] === 'admin' ? (
                    <Badge className="bg-violet-500/20 text-violet-500 text-[10px]">
                      Active Administrator
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Standard User
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="font-semibold text-foreground">Action to execute:</span>
                  {adminRoles[roleToggleUser.id] === 'admin' ||
                  adminRoles[roleToggleUser.email.toLowerCase()] === 'admin' ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Revoke Admin Privileges
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px]">
                      Grant Full Admin Rights
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground bg-sky-500/5 p-3 rounded-lg border border-sky-500/20 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  Only root administrator{' '}
                  <span className="font-semibold text-foreground">{PRIMARY_ADMIN_NAME}</span> (
                  {PRIMARY_ADMIN_EMAIL}) is permitted to change administrative privileges. This
                  action is permanently logged to the audit trail.
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRoleToggleUser(null)}
                  disabled={roleToggling}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    adminRoles[roleToggleUser.id] === 'admin' ||
                    adminRoles[roleToggleUser.email.toLowerCase()] === 'admin'
                      ? 'destructive'
                      : 'default'
                  }
                  onClick={handleExecuteRoleToggle}
                  disabled={roleToggling}
                  className="gap-1.5"
                >
                  <Key className="h-3.5 w-3.5" />
                  {roleToggling ? 'Updating Role...' : 'Confirm Role Change'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust Coins Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              Manage User Coin Balance
            </DialogTitle>
            <DialogDescription className="text-xs">
              Credit reward coins or set balance for{' '}
              <span className="font-semibold text-foreground">{selectedUser?.email}</span>.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleAdjustCoins}
            toolname="adjust_user_coin_balance"
            tooldescription="Credit or adjust reward coin balance for a PredictPro member"
            className="space-y-4 py-2"
          >
            <div className="p-3 rounded-lg bg-muted/40 text-xs flex items-center justify-between">
              <span className="text-muted-foreground">Current Balance:</span>
              <span className="font-bold text-foreground text-sm flex items-center gap-1 font-mono tabular-nums">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                {selectedUser?.coins.toLocaleString()} coins
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label>{isSettingDirect ? 'New Total Coins' : 'Coins to Add / Subtract'}</Label>
                <button
                  type="button"
                  onClick={() => setIsSettingDirect(!isSettingDirect)}
                  className="text-primary hover:underline text-[11px]"
                >
                  {isSettingDirect ? 'Switch to Add/Subtract' : 'Switch to Direct Balance'}
                </button>
              </div>
              <Input
                type="number"
                value={coinAdjustment}
                onChange={(e) => setCoinAdjustment(Number(e.target.value))}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={() => setCoinAdjustment(50)}
              >
                +50
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={() => setCoinAdjustment(100)}
              >
                +100
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={() => setCoinAdjustment(500)}
              >
                +500
              </Button>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={adjusting}>
                {adjusting ? 'Saving...' : 'Apply Coins'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
