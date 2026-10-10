import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  checkAdminsTableStatus,
  CustomAdminUser,
  AdminsTableStatus,
  SUPABASE_ADMINS_TABLE_SQL,
  CUSTOM_ADMINS_UPDATED_EVENT,
  ROOT_ADMIN_RECORD,
} from '@/services/customAdminsService';
import {
  ShieldCheck,
  Shield,
  RefreshCw,
  Database,
  Code2,
  Copy,
  Check,
  Download,
  Lock,
  Crown,
  Info,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminCustomAdminsManager() {
  const { user: currentAuthUser } = useAuth();
  const { isPrimaryAdmin } = useAdmin();

  const [admins, setAdmins] = useState<CustomAdminUser[]>([ROOT_ADMIN_RECORD]);
  const [loading, setLoading] = useState(false);
  const [tableStatus, setTableStatus] = useState<AdminsTableStatus | null>(null);
  const [statusChecking, setStatusChecking] = useState(false);

  // SQL Schema Modal State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Load data
  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminsFromSupabase();
      setAdmins(result.admins);
    } catch {
      setAdmins([ROOT_ADMIN_RECORD]);
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

  // Copy SQL schema script
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_ADMINS_TABLE_SQL);
    setCopiedSql(true);
    toast.success('Supabase SQL schema script copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Email', 'Full Name', 'Role', 'Access Level', 'Notes'];
    const rows = admins.map(a => [
      `"${a.id}"`,
      `"${a.email}"`,
      `"${(a.full_name || '').replace(/"/g, '""')}"`,
      `"${a.role}"`,
      '"Sole System Administrator - Full Platform Access"',
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `predictpro_sole_admin_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success('Exported sole administrator profile to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Overview & Single Admin Architecture Banner */}
      <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30 shrink-0">
              <Crown className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-foreground">
                  Sole Administrator Architecture: Vincent Mwangangi
                </h3>
                <Badge className="bg-amber-500 text-black font-semibold text-[11px] gap-1 px-2">
                  <ShieldCheck className="h-3 w-3" />
                  Only 1 Admin Active
                </Badge>
                {tableStatus?.isTableReady ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 text-[11px] font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Supabase &lsquo;admins&rsquo; Table Synced ({tableStatus.latencyMs}ms)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 gap-1 text-[11px]">
                    <Database className="h-3 w-3" />
                    Table Configured (Vincent Mwangangi)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Exactly one administrator (<strong className="text-foreground">{PRIMARY_ADMIN_NAME}</strong> &mdash;{' '}
                <span className="font-mono text-foreground">{PRIMARY_ADMIN_EMAIL}</span>) is authorized to manage all
                PredictPro systems: database connections, match publishing, auto-settler, Google indexing, cron jobs, and telemetry.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSqlModalOpen(true)}
              className="gap-1.5 text-xs h-9 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <Code2 className="h-3.5 w-3.5" />
              Supabase SQL
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadAdmins();
                checkStatus();
                toast.info('Verified sole administrator status in Supabase');
              }}
              disabled={loading || statusChecking}
              className="gap-1.5 text-xs h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading || statusChecking ? 'animate-spin' : ''}`} />
              Verify Sync
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

      {/* Main Single Admin Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Sole Authorized Platform Administrator
              </CardTitle>
              <CardDescription className="text-xs">
                PredictPro access control is restricted exclusively to Vincent Mwangangi. All protected admin routes require this login.
              </CardDescription>
            </div>

            <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-xs px-2.5 py-1 gap-1.5 self-start sm:self-auto font-medium">
              <Lock className="h-3 w-3" />
              Single Administrator Mode (Locked)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-3">Role &amp; Authority</th>
                  <th className="py-3 px-3">Protected Routes Clearance</th>
                  <th className="py-3 px-3">Operational Scope</th>
                  <th className="py-3 px-4 text-right">Access Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {admins.map(admin => (
                  <tr key={admin.id || admin.email} className="hover:bg-muted/30 transition-colors">
                    {/* Admin Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30">
                          <Crown className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground text-sm">
                              {admin.full_name || PRIMARY_ADMIN_NAME}
                            </span>
                            <Badge className="bg-amber-500 text-black font-semibold text-[9px] uppercase px-1.5 py-0 h-4">
                              Sole Administrator
                            </Badge>
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {admin.email}
                          </div>
                          <p className="text-[10px] text-muted-foreground italic">
                            Only authorized user managing all platform capabilities
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role & Authority */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-semibold tracking-wider border-amber-500/40 text-amber-500 bg-amber-500/5"
                        >
                          Root Super Admin
                        </Badge>
                        <div className="text-[10px] text-muted-foreground">
                          Permanent Single Authority
                        </div>
                      </div>
                    </td>

                    {/* Protected Routes Access */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500 font-semibold">
                            /admin
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-500 font-semibold">
                            /seo-indexing
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Exclusive Clearance
                        </span>
                      </div>
                    </td>

                    {/* Operational Scope */}
                    <td className="py-3.5 px-3 text-muted-foreground text-[11px]">
                      <div className="space-y-0.5">
                        <div className="text-foreground font-medium">Full System Ownership</div>
                        <div className="text-[10px] text-muted-foreground">
                          Database, Cron, AI, Telegram, Settle, Economy
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25">
                        <Lock className="h-3.5 w-3.5" />
                        Root Protected
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* System Control Matrix */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Capabilities Exclusively Managed by Vincent Mwangangi:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Supabase &amp; Database Config</span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Autonomous Cron Schedulers</span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Google Indexing &amp; SEO Tools</span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Gemini AI Predictions &amp; Odds</span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Telegram Match Broadcasts</span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Revenue &amp; M-Pesa Telemetry</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SQL Setup Schema Modal */}
      <Dialog open={isSqlModalOpen} onOpenChange={setIsSqlModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Code2 className="h-4 w-4 text-sky-500" />
              Supabase &lsquo;admins&rsquo; Table Setup Script
            </DialogTitle>
            <DialogDescription className="text-xs">
              Run this SQL script in your Supabase Dashboard SQL Editor to establish the custom &lsquo;admins&rsquo; table configured exclusively for Vincent Mwangangi.
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
                <li>Paste and click <strong>Run</strong>. Then click &ldquo;Verify Sync&rdquo; in this dashboard.</li>
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
