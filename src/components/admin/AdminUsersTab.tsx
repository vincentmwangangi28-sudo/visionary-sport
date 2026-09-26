import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, Users, Coins, RefreshCw, PlusCircle, Shield, Award, Download,
  Crown, Key, ShieldCheck, Lock, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin, PRIMARY_ADMIN_NAME, PRIMARY_ADMIN_EMAIL } from '@/hooks/useAdmin';
import { 
  fetchAssignedAdminRoles, 
  toggleUserAdminRole, 
  isPrimaryAdminUser, 
  ADMIN_ROLES_EVENT 
} from '@/services/adminRolesService';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  coins: number;
  created_at: string;
  updated_at: string;
  subscriptionPlan?: string;
}

export function AdminUsersTab() {
  const { user: currentAuthUser } = useAuth();
  const { isPrimaryAdmin } = useAdmin();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminRoles, setAdminRoles] = useState<Record<string, 'admin' | 'user'>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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
        .limit(100);

      if (profilesError) throw profilesError;

      // Get subscriptions
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('user_id, plan, status')
        .eq('status', 'active');

      const subsMap: Record<string, string> = {};
      (subsData || []).forEach(s => {
        subsMap[s.user_id] = s.plan;
      });

      const formatted = (profilesData || []).map(p => ({
        ...p,
        subscriptionPlan: subsMap[p.id] || 'free',
      }));

      // Ensure Vincent Mwangangi is included in the list
      const vincentExists = formatted.some(u => isPrimaryAdminUser(u.email));
      if (!vincentExists) {
        formatted.unshift({
          id: currentAuthUser?.id || 'root-vincent-primary',
          email: PRIMARY_ADMIN_EMAIL,
          full_name: PRIMARY_ADMIN_NAME,
          avatar_url: null,
          coins: 5000,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: new Date().toISOString(),
          subscriptionPlan: 'vip',
        });
      }

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
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, coins: newBalance } : u));
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
      const isTargetAdmin = adminRoles[roleToggleUser.id] === 'admin' || adminRoles[roleToggleUser.email.toLowerCase()] === 'admin';
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
      setAdminRoles(prev => ({
        ...prev,
        [roleToggleUser.id]: nextRole,
        [roleToggleUser.email.toLowerCase()]: nextRole,
      }));
      setRoleToggleUser(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle administrator role.');
    } finally {
      setRoleToggling(false);
    }
  };

  const filtered = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q)
    );
  });

  const totalCoinsInCirculation = users.reduce((acc, u) => acc + (u.coins || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Registered Users</div>
              <div className="text-xl font-bold">{users.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Coins In Circulation</div>
              <div className="text-xl font-bold">{totalCoinsInCirculation.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Active Subscriptions</div>
              <div className="text-xl font-bold">
                {users.filter(u => u.subscriptionPlan && u.subscriptionPlan !== 'free').length}
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
                User Profiles & Coin Economy Management
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect registered users, manage VIP tiers, and adjust coin balances.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const headers = ['User ID', 'Full Name', 'Email', 'Plan', 'Coin Balance', 'Created At'];
                  const rows = filtered.map(u => [
                    `"${u.id}"`,
                    `"${(u.full_name || '').replace(/"/g, '""')}"`,
                    `"${u.email}"`,
                    `"${u.subscriptionPlan || 'free'}"`,
                    `"${u.coins}"`,
                    `"${u.created_at}"`
                  ]);
                  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `predictpro_users_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  toast.success(`Exported ${filtered.length} user profiles as CSV`);
                }}
                className="h-8 gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading} className="h-8 gap-1.5 text-xs">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Users
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user by email or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">User Profile</th>
                    <th className="px-4 py-3">Authority / Role</th>
                    <th className="px-4 py-3">Subscription</th>
                    <th className="px-4 py-3">Coin Balance</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        Loading user accounts...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No user profiles matched your query.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user) => {
                      const isVincent = isPrimaryAdminUser(user.email);
                      const isUserAdmin = isVincent || adminRoles[user.id] === 'admin' || adminRoles[user.email.toLowerCase()] === 'admin';

                      return (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {user.full_name || 'Anonymous User'}
                              {isVincent && (
                                <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 gap-1 bg-amber-500/5">
                                  <Crown className="h-2.5 w-2.5" />
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isVincent ? (
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[10px]">
                                <Crown className="h-3 w-3" />
                                Root Admin
                              </Badge>
                            ) : isUserAdmin ? (
                              <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30 gap-1 text-[10px]">
                                <ShieldCheck className="h-3 w-3" />
                                Administrator
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                                Standard User
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {user.subscriptionPlan && user.subscriptionPlan !== 'free' ? (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30 capitalize bg-amber-500/5">
                                <Shield className="h-3 w-3 mr-1" />
                                {user.subscriptionPlan}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                                Free Tier
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 font-bold text-foreground">
                              <Coins className="h-3.5 w-3.5 text-amber-500" />
                              {user.coins.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Admin Role Toggle Button */}
                              {isVincent ? (
                                <span className="text-[10px] text-muted-foreground font-mono px-2 py-1 bg-muted/40 rounded border">
                                  Immutable
                                </span>
                              ) : isPrimaryAdmin ? (
                                <Button
                                  size="sm"
                                  variant={isUserAdmin ? "destructive" : "outline"}
                                  onClick={() => setRoleToggleUser(user)}
                                  className={`h-7 text-[11px] gap-1 ${
                                    !isUserAdmin ? "text-violet-600 border-violet-500/30 hover:bg-violet-500/10" : ""
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
                                  Role Locked
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
      <Dialog open={!!roleToggleUser} onOpenChange={open => !open && setRoleToggleUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-500" />
              Toggle Administrator Role
            </DialogTitle>
            <DialogDescription className="text-xs">
              Primary Administrator security authorization check for <span className="font-semibold text-foreground">{PRIMARY_ADMIN_NAME}</span>.
            </DialogDescription>
          </DialogHeader>

          {roleToggleUser && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl border bg-muted/40 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Account:</span>
                  <span className="font-mono font-medium text-foreground">{roleToggleUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium text-foreground">{roleToggleUser.full_name || 'Anonymous'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Status:</span>
                  {adminRoles[roleToggleUser.id] === 'admin' || adminRoles[roleToggleUser.email.toLowerCase()] === 'admin' ? (
                    <Badge className="bg-violet-500/20 text-violet-500 text-[10px]">Active Administrator</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Standard User</Badge>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="font-semibold text-foreground">Action to execute:</span>
                  {adminRoles[roleToggleUser.id] === 'admin' || adminRoles[roleToggleUser.email.toLowerCase()] === 'admin' ? (
                    <Badge variant="destructive" className="text-[10px]">Revoke Admin Privileges</Badge>
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
                  Only root administrator <span className="font-semibold text-foreground">{PRIMARY_ADMIN_NAME}</span> ({PRIMARY_ADMIN_EMAIL}) is permitted to change administrative privileges. This action is permanently logged to the audit trail.
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRoleToggleUser(null)} disabled={roleToggling}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={adminRoles[roleToggleUser.id] === 'admin' || adminRoles[roleToggleUser.email.toLowerCase()] === 'admin' ? "destructive" : "default"}
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
      <Dialog open={!!selectedUser} onOpenChange={open => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              Manage User Coin Balance
            </DialogTitle>
            <DialogDescription className="text-xs">
              Credit reward coins or set balance for <span className="font-semibold text-foreground">{selectedUser?.email}</span>.
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
              <span className="font-bold text-foreground text-sm flex items-center gap-1">
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
                onChange={e => setCoinAdjustment(Number(e.target.value))}
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
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
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
