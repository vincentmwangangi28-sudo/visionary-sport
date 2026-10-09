import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin, PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_NAME } from '@/hooks/useAdmin';
import {
  fetchAdminsFromSupabase,
  addAdminToSupabase,
  removeAdminFromSupabase,
  checkAdminsTableStatus,
  CustomAdminUser,
  AdminsTableStatus,
  SUPABASE_ADMINS_TABLE_SQL,
  CUSTOM_ADMINS_UPDATED_EVENT,
} from '@/services/customAdminsService';
import {
  ShieldCheck,
  Shield,
  ShieldAlert,
  UserPlus,
  Trash2,
  RefreshCw,
  Search,
  Database,
  Code2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Lock,
  Crown,
  KeyRound,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminCustomAdminsManager() {
  const { user: currentAuthUser } = useAuth();
  const { isPrimaryAdmin } = useAdmin();

  const [admins, setAdmins] = useState<CustomAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableStatus, setTableStatus] = useState<AdminsTableStatus | null>(null);
  const [statusChecking, setStatusChecking] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Add Admin Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [newNotes, setNewNotes] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Remove Admin Modal State
  const [pendingRemovalAdmin, setPendingRemovalAdmin] = useState<CustomAdminUser | null>(null);
  const [removingAdmin, setRemovingAdmin] = useState(false);

  // SQL Schema Modal State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Load data from Supabase custom admins table
  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminsFromSupabase();
      setAdmins(result.admins);
      if (result.error && !result.fromDatabase) {
        // Table not yet initialized in Supabase
        checkStatus();
      }
    } catch (err: any) {
      toast.error('Failed to load admins: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    setStatusChecking(true);
    try {
      const status = await checkAdminsTableStatus();
      setTableStatus(status);
    } catch {
      // safe fallback
    } finally {
      setStatusChecking(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
    checkStatus();

    const handleSync = () => {
      loadAdmins();
    };

    window.addEventListener(CUSTOM_ADMINS_UPDATED_EVENT, handleSync);
    return () => {
      window.removeEventListener(CUSTOM_ADMINS_UPDATED_EVENT, handleSync);
    };
  }, [loadAdmins, checkStatus]);

  // Handle adding new authorized admin
  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (admins.some(a => a.email.toLowerCase() === cleanEmail)) {
      toast.error('This email is already an authorized administrator.');
      return;
    }

    setAddingAdmin(true);
    try {
      const actor = currentAuthUser?.email || PRIMARY_ADMIN_EMAIL;
      const res = await addAdminToSupabase({
        email: cleanEmail,
        full_name: newName.trim() || null,
        role: newRole,
        added_by: actor,
        notes: newNotes.trim() || 'Added via Admin Dashboard',
      });

      toast.success(res.message);
      setNewEmail('');
      setNewName('');
      setNewNotes('');
      setNewRole('admin');
      setIsAddModalOpen(false);
      await loadAdmins();
      await checkStatus();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add administrator.');
    } finally {
      setAddingAdmin(false);
    }
  };

  // Handle removing authorized admin
  const handleConfirmRemoval = async () => {
    if (!pendingRemovalAdmin) return;

    if (pendingRemovalAdmin.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      toast.error('Root administrator cannot be removed.');
      setPendingRemovalAdmin(null);
      return;
    }

    setRemovingAdmin(true);
    try {
      const actor = currentAuthUser?.email || PRIMARY_ADMIN_EMAIL;
      const res = await removeAdminFromSupabase(pendingRemovalAdmin.id || pendingRemovalAdmin.email, actor);
      toast.success(res.message);
      setPendingRemovalAdmin(null);
      await loadAdmins();
      await checkStatus();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove administrator.');
    } finally {
      setRemovingAdmin(false);
    }
  };

  // Copy SQL schema script
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_ADMINS_TABLE_SQL);
    setCopiedSql(true);
    toast.success('Supabase SQL schema script copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Email', 'Full Name', 'Role', 'Added By', 'Created At', 'Notes'];
    const rows = filteredAdmins.map(a => [
      `"${a.id}"`,
      `"${a.email}"`,
      `"${(a.full_name || '').replace(/"/g, '""')}"`,
      `"${a.role}"`,
      `"${a.added_by || ''}"`,
      `"${a.created_at}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `predictpro_supabase_admins_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success(`Exported ${filteredAdmins.length} admin records.`);
  };

  // Filtered admins
  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => {
      // Role filter
      if (roleFilter !== 'all' && admin.role !== roleFilter) return false;

      // Query filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        admin.email.toLowerCase().includes(q) ||
        (admin.full_name || '').toLowerCase().includes(q) ||
        (admin.role || '').toLowerCase().includes(q) ||
        (admin.notes || '').toLowerCase().includes(q)
      );
    });
  }, [admins, roleFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Overview & Supabase Connection Status Card */}
      <Card className="border-sky-500/25 bg-sky-500/5 dark:bg-sky-950/20">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/30 shrink-0">
              <Database className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-foreground">
                  Custom &lsquo;admins&rsquo; Table in Supabase
                </h3>
                {tableStatus?.isTableReady ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 text-[11px] font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Supabase Table Live ({tableStatus.latencyMs}ms)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 gap-1 text-[11px]">
                    <AlertTriangle className="h-3 w-3" />
                    Local Sync Active (Setup Table)
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[11px]">
                  {admins.length} Authorized Admin{admins.length === 1 ? '' : 's'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Users listed below are authorized to access protected admin routes (
                <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">/admin</code>,{' '}
                <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">/seo-indexing</code>
                ). Changes synchronize with the Supabase database.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Authorized Admin
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSqlModalOpen(true)}
              className="gap-1.5 text-xs h-9 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
            >
              <Code2 className="h-3.5 w-3.5" />
              SQL Schema
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadAdmins();
                checkStatus();
                toast.info('Refreshed Supabase admins table records');
              }}
              disabled={loading || statusChecking}
              className="gap-1.5 text-xs h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading || statusChecking ? 'animate-spin' : ''}`} />
              Sync
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs h-9 text-muted-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Admin Management Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Authorized Admin Directory
              </CardTitle>
              <CardDescription className="text-xs">
                Manage accounts granted administrative clearance to access protected routes.
              </CardDescription>
            </div>

            {/* Search and Role Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search admin email or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs w-full sm:w-56"
                />
              </div>

              <select
                aria-label="Filter administrators by role"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="h-8 text-xs px-2.5 rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Roles ({admins.length})</option>
                <option value="super_admin">Super Admins</option>
                <option value="admin">Standard Admins</option>
                <option value="analyst_admin">Analyst Admins</option>
                <option value="operations_admin">Operations Admins</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
              <p className="text-xs text-muted-foreground">Querying Supabase &lsquo;admins&rsquo; table...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="py-10 text-center space-y-3 border rounded-xl bg-muted/20">
              <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto" />
              <div className="space-y-1">
                <div className="text-sm font-semibold">No Matching Admins Found</div>
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? 'Try clearing your search query.' : 'Add your first authorized administrator to Supabase.'}
                </p>
              </div>
              <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-1.5 text-xs">
                <UserPlus className="h-3.5 w-3.5" />
                Add Administrator
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-3">Role & Clearance</th>
                    <th className="py-3 px-3">Protected Access</th>
                    <th className="py-3 px-3">Added Details</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAdmins.map(admin => {
                    const isVincent =
                      admin.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

                    return (
                      <tr key={admin.id || admin.email} className="hover:bg-muted/30 transition-colors">
                        {/* Admin Name & Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isVincent
                                  ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30'
                                  : 'bg-primary/10 text-primary ring-1 ring-primary/20'
                              }`}
                            >
                              {isVincent ? (
                                <Crown className="h-4 w-4" />
                              ) : (
                                (admin.full_name || admin.email)[0].toUpperCase()
                              )}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-foreground text-xs truncate max-w-[180px] sm:max-w-none">
                                  {admin.full_name || 'System Administrator'}
                                </span>
                                {isVincent && (
                                  <Badge className="bg-amber-500 text-black font-semibold text-[9px] uppercase px-1.5 py-0 h-4">
                                    Root Admin
                                  </Badge>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                                <span>{admin.email}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(admin.email);
                                    toast.success('Email copied');
                                  }}
                                  className="text-muted-foreground/60 hover:text-foreground p-0.5"
                                  title="Copy email"
                                >
                                  <Copy className="h-2.5 w-2.5" />
                                </button>
                              </div>
                              {admin.notes && (
                                <p className="text-[10px] text-muted-foreground italic truncate max-w-xs">
                                  {admin.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role & Clearance */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-semibold tracking-wider ${
                                isVincent
                                  ? 'border-amber-500/40 text-amber-500 bg-amber-500/5'
                                  : admin.role === 'super_admin'
                                  ? 'border-violet-500/40 text-violet-500 bg-violet-500/5'
                                  : 'border-emerald-500/40 text-emerald-500 bg-emerald-500/5'
                              }`}
                            >
                              {admin.role.replace('_', ' ')}
                            </Badge>
                            <div className="text-[10px] text-muted-foreground">
                              {isVincent ? 'Permanent Root Authority' : 'Supabase Table Clearance'}
                            </div>
                          </div>
                        </td>

                        {/* Protected Routes Access */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500 font-medium">
                                /admin
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-500 font-medium">
                                /seo-indexing
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Active Route Access
                            </span>
                          </div>
                        </td>

                        {/* Added Details */}
                        <td className="py-3.5 px-3 text-muted-foreground text-[11px]">
                          <div className="space-y-0.5">
                            <div>Added by: <strong className="text-foreground">{admin.added_by || 'System'}</strong></div>
                            <div className="text-[10px] flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(admin.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          {isVincent ? (
                            <div className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-medium px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                              <Lock className="h-3 w-3" />
                              Protected
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPendingRemovalAdmin(admin)}
                              className="h-7 text-xs border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 gap-1 px-2.5"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Administrator Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4 text-primary" />
              Add Authorized Administrator
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a new user to the custom &lsquo;admins&rsquo; table in Supabase. This will grant them immediate access to protected admin routes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAdminSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-medium">
                Email Address <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="e.g. operations@predictpro.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                className="text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Must match the email address the user signs in with.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-name" className="text-xs font-medium">
                Full Name (Optional)
              </Label>
              <Input
                id="admin-name"
                placeholder="e.g. Brian Omondi"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-role" className="text-xs font-medium">
                Administrative Role
              </Label>
              <select
                id="admin-role"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="admin">Administrator (Full Access)</option>
                <option value="super_admin">Super Administrator</option>
                <option value="analyst_admin">Analyst Administrator (Predictions & Odds)</option>
                <option value="operations_admin">Operations Administrator (Support & Economy)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-notes" className="text-xs font-medium">
                Notes / Clearance Justification
              </Label>
              <Input
                id="admin-notes"
                placeholder="e.g. Appointed lead analyst for Premier League operations"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border text-[11px] space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Protected Route Clearance:
              </div>
              <p className="text-muted-foreground">
                Adding this record writes to <code className="font-mono text-[10px]">public.admins</code> in Supabase. The user can immediately view <code className="font-mono text-[10px]">/admin</code> and <code className="font-mono text-[10px]">/seo-indexing</code>.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={addingAdmin}
                className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {addingAdmin ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    Authorize Admin
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Modal */}
      <Dialog open={!!pendingRemovalAdmin} onOpenChange={open => !open && setPendingRemovalAdmin(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-rose-500">
              <AlertTriangle className="h-4 w-4" />
              Revoke Administrator Access
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to remove this user from the custom &lsquo;admins&rsquo; table?
            </DialogDescription>
          </DialogHeader>

          {pendingRemovalAdmin && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5">
                <div className="text-muted-foreground">Revoking access for:</div>
                <div className="font-bold text-foreground text-sm">{pendingRemovalAdmin.full_name || 'Admin User'}</div>
                <div className="font-mono text-muted-foreground">{pendingRemovalAdmin.email}</div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                This will delete the record from the Supabase <code className="font-mono text-[11px]">admins</code> table. The user will immediately be blocked from accessing <code className="font-mono text-[11px]">/admin</code> and all protected administrator routes.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPendingRemovalAdmin(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={removingAdmin}
              onClick={handleConfirmRemoval}
              className="text-xs gap-1.5"
            >
              {removingAdmin ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Revoke Admin Clearance
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SQL Setup Schema Modal */}
      <Dialog open={isSqlModalOpen} onOpenChange={setIsSqlModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Code2 className="h-4 w-4 text-sky-500" />
              Supabase &lsquo;admins&rsquo; Table Setup Script
            </DialogTitle>
            <DialogDescription className="text-xs">
              Run this SQL script in your Supabase Dashboard SQL Editor to establish the custom &lsquo;admins&rsquo; table with Row Level Security (RLS) and policies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5 text-xs">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-sky-500" />
                Quick 3-Step Setup Instructions:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Copy the SQL script below.</li>
                <li>Go to your Supabase Project Dashboard &rarr; <strong>SQL Editor</strong>.</li>
                <li>Paste and click <strong>Run</strong>. Then click &ldquo;Sync&rdquo; in this dashboard to verify.</li>
              </ol>
            </div>

            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-neutral-950 text-neutral-100 font-mono text-[11px] overflow-x-auto max-h-72 border border-border/40">
                {SUPABASE_ADMINS_TABLE_SQL}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopySql}
                className="absolute top-2.5 right-2.5 gap-1.5 text-xs h-7 shadow"
              >
                {copiedSql ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy SQL
                  </>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSqlModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCopySql}
              className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Script
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
