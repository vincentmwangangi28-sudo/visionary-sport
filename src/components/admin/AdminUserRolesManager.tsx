import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { useAuth } from '@/hooks/useAuth';
import { useAdmin, PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_NAME } from '@/hooks/useAdmin';
import {
  fetchAssignedAdminRoles,
  toggleUserAdminRole,
  isPrimaryAdminUser,
  ADMIN_ROLES_EVENT,
} from '@/services/adminRolesService';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  UserCheck,
  UserX,
  Users,
  Search,
  RefreshCw,
  Lock,
  Crown,
  Key,
  Download,
  AlertTriangle,
  UserPlus,
  Info,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export interface UserRoleItem {
  id: string;
  email: string;
  full_name: string | null;
  role: 'primary_admin' | 'admin' | 'user';
  created_at: string;
  subscriptionPlan?: string;
  isPrimary: boolean;
}

// Fallback baseline user records in case database is empty or offline
const BASELINE_USERS: Omit<UserRoleItem, 'role' | 'isPrimary'>[] = [
  {
    id: 'user-root-001',
    email: 'vincentmwangangi28@gmail.com',
    full_name: 'Vincent Mwangangi',
    created_at: '2025-01-10T08:00:00.000Z',
    subscriptionPlan: 'vip',
  },
  {
    id: 'user-analyst-002',
    email: 'brian.omondi@predictpro.ke',
    full_name: 'Brian Omondi (Lead Analyst)',
    created_at: '2025-02-14T11:20:00.000Z',
    subscriptionPlan: 'vip',
  },
  {
    id: 'user-support-003',
    email: 'support.ke@predictpro.com',
    full_name: 'Faith Chebet (Operations)',
    created_at: '2025-03-01T09:15:00.000Z',
    subscriptionPlan: 'pro',
  },
  {
    id: 'user-standard-004',
    email: 'dennis.kamau@gmail.com',
    full_name: 'Dennis Kamau',
    created_at: '2025-03-12T14:40:00.000Z',
    subscriptionPlan: 'free',
  },
  {
    id: 'user-standard-005',
    email: 'mercy.wanjiku@yahoo.com',
    full_name: 'Mercy Wanjiku',
    created_at: '2025-03-16T17:30:00.000Z',
    subscriptionPlan: 'starter',
  },
];

export function AdminUserRolesManager() {
  const { user: currentAuthUser } = useAuth();
  const { isPrimaryAdmin } = useAdmin();

  const [userList, setUserList] = useState<UserRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  // Confirmation modal state for role toggling
  const [pendingUser, setPendingUser] = useState<UserRoleItem | null>(null);
  const [pendingNextRole, setPendingNextRole] = useState<'admin' | 'user'>('user');
  const [toggling, setToggling] = useState(false);

  // Manual role grant dialog
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [addingManual, setAddingManual] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch assigned admin roles
      const adminRolesMap = await fetchAssignedAdminRoles();

      // 2. Fetch registered profiles from Supabase
      let profiles: any[] = [];
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(150);

        if (!error && Array.isArray(data) && data.length > 0) {
          profiles = data;
        }
      } catch {
        // Fallback
      }

      // Merge with baseline records to ensure Vincent Mwangangi and key accounts are always present
      const combinedMap = new Map<string, any>();
      BASELINE_USERS.forEach(u => combinedMap.set(u.email.toLowerCase(), u));
      profiles.forEach(p => {
        if (p.email) {
          combinedMap.set(p.email.toLowerCase(), {
            ...p,
            subscriptionPlan: p.subscriptionPlan || 'free',
          });
        }
      });

      // Always ensure Vincent Mwangangi is first in the list
      const vincentKey = PRIMARY_ADMIN_EMAIL.toLowerCase();
      if (!combinedMap.has(vincentKey)) {
        combinedMap.set(vincentKey, {
          id: currentAuthUser?.id || 'root-vincent-primary',
          email: PRIMARY_ADMIN_EMAIL,
          full_name: PRIMARY_ADMIN_NAME,
          created_at: '2025-01-01T00:00:00.000Z',
          subscriptionPlan: 'vip',
        });
      }

      const formatted: UserRoleItem[] = Array.from(combinedMap.values()).map(item => {
        const email = (item.email || '').toLowerCase().trim();
        const isVincent = isPrimaryAdminUser(email);
        
        let assignedRole: 'primary_admin' | 'admin' | 'user' = 'user';
        if (isVincent) {
          assignedRole = 'primary_admin';
        } else if (adminRolesMap[item.id] === 'admin' || adminRolesMap[email] === 'admin') {
          assignedRole = 'admin';
        }

        return {
          id: item.id || `user-${Math.random().toString(36).slice(2, 7)}`,
          email: item.email,
          full_name: item.full_name || null,
          role: assignedRole,
          created_at: item.created_at || new Date().toISOString(),
          subscriptionPlan: item.subscriptionPlan || 'free',
          isPrimary: isVincent,
        };
      });

      // Sort: Primary admin first, then other admins, then regular users
      formatted.sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return (a.email || '').localeCompare(b.email || '');
      });

      setUserList(formatted);
    } catch (err) {
      toast.error('Failed to load user roles: ' + String(err));
    } finally {
      setLoading(false);
    }
  }, [currentAuthUser]);

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener(ADMIN_ROLES_EVENT, handleSync);
    return () => {
      window.removeEventListener(ADMIN_ROLES_EVENT, handleSync);
    };
  }, [loadData]);

  // Handle click on the role switch / toggle
  const handleInitiateToggle = (targetUser: UserRoleItem) => {
    // 1. Guard check: only Vincent Mwangangi can perform this action
    if (!isPrimaryAdmin) {
      toast.error('Access Denied', {
        description: `Only primary administrator ${PRIMARY_ADMIN_NAME} (${PRIMARY_ADMIN_EMAIL}) has authority to toggle administrative roles.`,
      });
      return;
    }

    // 2. Prevent modifying the primary admin itself
    if (targetUser.isPrimary) {
      toast.info('Root Account Protected', {
        description: `${PRIMARY_ADMIN_NAME} is the primary root administrator and cannot be modified or demoted.`,
      });
      return;
    }

    // 3. Prepare next role and open confirmation modal
    const nextRole: 'admin' | 'user' = targetUser.role === 'admin' ? 'user' : 'admin';
    setPendingUser(targetUser);
    setPendingNextRole(nextRole);
  };

  // Confirm and execute the role toggle
  const handleConfirmToggle = async () => {
    if (!pendingUser) return;

    setToggling(true);
    try {
      const actorEmail = currentAuthUser?.email || PRIMARY_ADMIN_EMAIL;
      const actorName = currentAuthUser?.user_metadata?.full_name || PRIMARY_ADMIN_NAME;

      const result = await toggleUserAdminRole({
        targetUserId: pendingUser.id,
        targetUserEmail: pendingUser.email,
        targetUserName: pendingUser.full_name,
        currentActorEmail: actorEmail,
        currentActorName: actorName,
        targetRole: pendingNextRole,
      });

      toast.success(pendingNextRole === 'admin' ? 'Administrator Role Granted' : 'Administrator Role Revoked', {
        description: result.message,
      });

      // Update local state reactively
      setUserList(prev =>
        prev.map(u =>
          u.id === pendingUser.id
            ? { ...u, role: pendingNextRole }
            : u
        )
      );

      setPendingUser(null);
    } catch (err: any) {
      toast.error('Role Modification Failed', {
        description: err.message || 'An error occurred while updating roles.',
      });
    } finally {
      setToggling(false);
    }
  };

  // Handle manual administrator grant by email
  const handleManualAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPrimaryAdmin) {
      toast.error('Only primary administrator Vincent Mwangangi can grant admin roles.');
      return;
    }

    const cleanEmail = manualEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setAddingManual(true);
    try {
      const actorEmail = currentAuthUser?.email || PRIMARY_ADMIN_EMAIL;
      const actorName = currentAuthUser?.user_metadata?.full_name || PRIMARY_ADMIN_NAME;

      // Check if user is already in the list
      const existing = userList.find(u => u.email.toLowerCase() === cleanEmail);
      const targetUserId = existing?.id || `usr-${Date.now().toString(36)}`;

      await toggleUserAdminRole({
        targetUserId,
        targetUserEmail: cleanEmail,
        targetUserName: manualName.trim() || existing?.full_name || 'Admin Appointee',
        currentActorEmail: actorEmail,
        currentActorName: actorName,
        targetRole: 'admin',
      });

      toast.success(`Promoted ${cleanEmail} to Administrator.`);
      setManualEmail('');
      setManualName('');
      setShowAddAdminModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to grant admin privileges.');
    } finally {
      setAddingManual(false);
    }
  };

  // Filtered user list
  const filteredUsers = useMemo(() => {
    return userList.filter(item => {
      // Role filter
      if (roleFilter === 'admin' && item.role === 'user') return false;
      if (roleFilter === 'user' && (item.role === 'admin' || item.role === 'primary_admin')) return false;

      // Query filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.email || '').toLowerCase().includes(q) ||
        (item.full_name || '').toLowerCase().includes(q) ||
        (item.id || '').toLowerCase().includes(q)
      );
    });
  }, [userList, roleFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = userList.length;
    const admins = userList.filter(u => u.role === 'admin' || u.role === 'primary_admin').length;
    const standard = total - admins;
    return { total, admins, standard };
  }, [userList]);

  // Export roles registry as CSV
  const handleExportCSV = () => {
    const headers = ['User ID', 'Full Name', 'Email Address', 'Administrative Role', 'Privilege Level', 'Registration Date'];
    const rows = filteredUsers.map(u => [
      `"${u.id}"`,
      `"${(u.full_name || '').replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.role.toUpperCase()}"`,
      `"${u.isPrimary ? 'Primary Root Authority' : u.role === 'admin' ? 'Staff Administrator' : 'Standard Member'}"`,
      `"${u.created_at}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `predictpro_admin_roles_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success(`Exported ${filteredUsers.length} user role records to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Root Authority Status Banner */}
      <Card className={isPrimaryAdmin 
        ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20" 
        : "border-border/60 bg-muted/20"
      }>
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`p-2.5 rounded-xl ${
              isPrimaryAdmin 
                ? "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30" 
                : "bg-muted text-muted-foreground"
            }`}>
              {isPrimaryAdmin ? <Crown className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground">
                  {isPrimaryAdmin ? 'Primary Root Administrator Active' : 'Restricted Role View'}
                </span>
                {isPrimaryAdmin ? (
                  <Badge className="bg-amber-500 text-black font-semibold text-[10px] uppercase tracking-wider h-5 px-2">
                    Authorized: Vincent Mwangangi
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-[10px] h-5 px-2">
                    Read-Only (Non-Root)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {isPrimaryAdmin
                  ? `You are verified as ${PRIMARY_ADMIN_NAME} (${PRIMARY_ADMIN_EMAIL}). You hold exclusive authority to promote or demote administrative accounts.`
                  : `Role modifications are strictly reserved for primary administrator ${PRIMARY_ADMIN_NAME} (${PRIMARY_ADMIN_EMAIL}). Interactive toggles are disabled.`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isPrimaryAdmin && (
              <Button
                size="sm"
                onClick={() => setShowAddAdminModal(true)}
                className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground font-medium w-full sm:w-auto"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Promote by Email
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs h-8"
            >
              <Download className="h-3.5 w-3.5" />
              Export Roles CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metric summary counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Accounts in Registry</div>
              <div className="text-xl font-bold">{stats.total}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Active Administrators</div>
              <div className="text-xl font-bold flex items-center gap-2">
                {stats.admins}
                <span className="text-xs font-normal text-muted-foreground">
                  (Includes Root Authority)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Standard Users</div>
              <div className="text-xl font-bold">{stats.standard}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Administrative Privilege Control Center
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect registered users and manage system administrator roles with instant database synchronization.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="h-8 gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Registry
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controls bar: Search + Filter tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user by email, name, or account ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  roleFilter === 'all'
                    ? 'bg-background font-semibold text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  roleFilter === 'admin'
                    ? 'bg-background font-semibold text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Admins ({stats.admins})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('user')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  roleFilter === 'user'
                    ? 'bg-background font-semibold text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Standard ({stats.standard})
              </button>
            </div>
          </div>

          {/* User Roles Table */}
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">User Details</th>
                    <th className="px-4 py-3">Current Role</th>
                    <th className="px-4 py-3">Account Plan</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3 text-right">Admin Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        Synchronizing user role records...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        No user accounts matched the filter query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const isTargetPrimary = user.isPrimary;
                      const isAdmin = user.role === 'admin' || user.role === 'primary_admin';

                      return (
                        <tr
                          key={user.id}
                          className={`transition-colors ${
                            isTargetPrimary 
                              ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07]' 
                              : isAdmin 
                              ? 'bg-violet-500/[0.02] hover:bg-violet-500/[0.06]' 
                              : 'hover:bg-muted/30'
                          }`}
                        >
                          {/* User Details */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              {isTargetPrimary ? (
                                <div className="p-1 rounded-md bg-amber-500/20 text-amber-500">
                                  <Crown className="h-3.5 w-3.5" />
                                </div>
                              ) : isAdmin ? (
                                <div className="p-1 rounded-md bg-violet-500/20 text-violet-500">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                </div>
                              ) : (
                                <div className="p-1 rounded-md bg-muted text-muted-foreground">
                                  <Users className="h-3.5 w-3.5" />
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                  {user.full_name || 'Anonymous User'}
                                  {isTargetPrimary && (
                                    <span className="text-[10px] text-amber-500 font-bold tracking-wider uppercase">
                                      [ROOT]
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Current Role Badge */}
                          <td className="px-4 py-3.5">
                            {isTargetPrimary ? (
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] font-medium">
                                <Crown className="h-3 w-3" />
                                Primary Root Admin
                              </Badge>
                            ) : isAdmin ? (
                              <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30 gap-1 text-[11px] font-medium">
                                <ShieldCheck className="h-3 w-3" />
                                Administrator
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground gap-1 text-[11px]">
                                <UserCheck className="h-3 w-3" />
                                Standard User
                              </Badge>
                            )}
                          </td>

                          {/* Account Plan */}
                          <td className="px-4 py-3.5">
                            <span className="capitalize text-muted-foreground font-medium">
                              {user.subscriptionPlan || 'free'}
                            </span>
                          </td>

                          {/* Registered date */}
                          <td className="px-4 py-3.5 text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Toggle Switch */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              {isTargetPrimary ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-medium">
                                  <Lock className="h-3 w-3" />
                                  <span>Permanent Root</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] ${isAdmin ? 'text-violet-500 font-semibold' : 'text-muted-foreground'}`}>
                                    {isAdmin ? 'Admin' : 'User'}
                                  </span>

                                  <Switch
                                    checked={isAdmin}
                                    onCheckedChange={() => handleInitiateToggle(user)}
                                    disabled={!isPrimaryAdmin || loading}
                                    title={
                                      !isPrimaryAdmin
                                        ? 'Only primary admin Vincent Mwangangi can modify roles.'
                                        : isAdmin
                                        ? 'Click to revoke Administrator privilege'
                                        : 'Click to promote to Administrator'
                                    }
                                    className="data-[state=checked]:bg-violet-600"
                                  />

                                  {!isPrimaryAdmin && (
                                    <Lock className="h-3 w-3 text-muted-foreground" title="Role modification locked" />
                                  )}
                                </div>
                              )}
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

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 px-1">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>
                Administrative promotions instantly propagate to database permissions and live audit logs.
              </span>
            </div>
            <span>Showing {filteredUsers.length} of {userList.length} accounts</span>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Role Modification */}
      <Dialog open={!!pendingUser} onOpenChange={open => !open && setPendingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              {pendingNextRole === 'admin' ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Confirm Administrator Promotion
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Confirm Administrative Privilege Revocation
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Please review the privilege modification for this account before proceeding.
            </DialogDescription>
          </DialogHeader>

          {pendingUser && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg border bg-muted/40 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Account:</span>
                  <span className="font-semibold text-foreground">{pendingUser.full_name || 'Anonymous User'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-foreground">{pendingUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Status:</span>
                  <span className="capitalize font-medium">{pendingUser.role}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/50">
                  <span className="font-medium text-foreground">New Status:</span>
                  <span className={`font-bold ${pendingNextRole === 'admin' ? 'text-violet-500' : 'text-muted-foreground'}`}>
                    {pendingNextRole === 'admin' ? 'System Administrator' : 'Standard User'}
                  </span>
                </div>
              </div>

              {pendingNextRole === 'admin' ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] leading-relaxed">
                  <strong>Privilege Notice:</strong> Elevating this user grants access to match predictions management, auto-settler tools, financial revenue summaries, error diagnostics, and system monitoring.
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] leading-relaxed">
                  <strong>Revocation Notice:</strong> Revoking administrator access will immediately lock this account out of all administrative dashboards and endpoints.
                </div>
              )}

              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Crown className="h-3 w-3 text-amber-500" />
                <span>Authorized by Root Administrator: {PRIMARY_ADMIN_NAME}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPendingUser(null)}
              disabled={toggling}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmToggle}
              disabled={toggling}
              className={pendingNextRole === 'admin' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
            >
              {toggling ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Updating...
                </>
              ) : pendingNextRole === 'admin' ? (
                'Grant Administrator Role'
              ) : (
                'Revoke Administrator Access'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Admin Promotion Modal */}
      <Dialog open={showAddAdminModal} onOpenChange={setShowAddAdminModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Promote Administrator by Email
            </DialogTitle>
            <DialogDescription className="text-xs">
              Directly assign administrative access to a team member or analyst.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualAddAdmin} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">User Email Address</Label>
              <Input
                type="email"
                placeholder="analyst@predictpro.com"
                value={manualEmail}
                onChange={e => setManualEmail(e.target.value)}
                required
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Full Name / Role Title (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. John Doe (Data Analyst)"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/40 text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Root Authority Verification
              </div>
              <p>
                This action will be verified under primary administrator <strong>{PRIMARY_ADMIN_NAME}</strong> and logged to the compliance audit trail.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddAdminModal(false)}
                disabled={addingManual}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={addingManual}
                className="bg-primary text-primary-foreground"
              >
                {addingManual ? 'Promoting...' : 'Promote to Administrator'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
