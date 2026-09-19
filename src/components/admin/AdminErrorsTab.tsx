import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, RefreshCw, Trash2, Search, Bug, Terminal, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';

interface ErrorLogItem {
  id: string;
  created_at: string;
  error_message: string;
  error_stack: string | null;
  component_stack: string | null;
  error_type: string | null;
  url: string | null;
  user_id: string | null;
  user_agent: string | null;
  severity: string | null;
  metadata: Record<string, unknown> | null;
}

export function AdminErrorsTab() {
  const [logs, setLogs] = useState<ErrorLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<ErrorLogItem | null>(null);
  const [copied, setCopied] = useState(false);

  const loadErrorLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data || []) as ErrorLogItem[]);
    } catch {
      // Table might be empty or fallback
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadErrorLogs();
  }, [loadErrorLogs]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all error logs?')) return;
    try {
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast.success('Error logs cleared successfully');
      setLogs([]);
    } catch {
      // local reset fallback
      setLogs([]);
      toast.info('Logs reset in current view');
    }
  };

  const handleCopyLog = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopied(true);
    toast.success('Error details copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (log.error_message || '').toLowerCase().includes(q) ||
      (log.url || '').toLowerCase().includes(q) ||
      (log.error_stack || '').toLowerCase().includes(q);

    const matchesSeverity = 
      severityFilter === 'all' || 
      (log.severity || 'error').toLowerCase() === severityFilter.toLowerCase();

    const matchesType = 
      typeFilter === 'all' || 
      (log.error_type || '').toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesSeverity && matchesType;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Runtime Exceptions & Error Log Monitor
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time capture of unhandled exceptions, React ErrorBoundary catches, and API drops.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadErrorLogs} disabled={loading} className="h-8 gap-1.5 text-xs">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {logs.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleClearLogs} className="h-8 gap-1.5 text-xs">
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Logs
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search error message, URL or stack trace..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="fatal">Fatal</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44 h-9 text-xs">
                  <SelectValue placeholder="Error Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Error Types</SelectItem>
                  <SelectItem value="react_boundary">React Boundary</SelectItem>
                  <SelectItem value="network_error">Network Error</SelectItem>
                  <SelectItem value="chunk_load_error">Chunk Load Error</SelectItem>
                  <SelectItem value="unhandled_exception">Unhandled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">Severity & Type</th>
                    <th className="px-4 py-3">Error Message</th>
                    <th className="px-4 py-3">Source Route</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        Loading error telemetry...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Bug className="h-8 w-8 text-muted-foreground/50 mb-1" />
                          <p className="font-semibold text-foreground">No errors recorded</p>
                          <p className="text-[11px]">The application is currently running smoothly with zero logged exceptions.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((log) => {
                      const sev = (log.severity || 'error').toLowerCase();
                      const isFatal = sev === 'fatal';
                      const isWarn = sev === 'warn';

                      return (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] uppercase font-bold ${
                                  isFatal
                                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                    : isWarn
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                }`}
                              >
                                {sev}
                              </Badge>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {log.error_type || 'error'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-medium max-w-md truncate text-foreground">
                            {log.error_message}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] max-w-xs truncate">
                            {log.url ? new URL(log.url, 'https://predictpro.app').pathname : '/'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedLog(log)}
                              className="h-7 text-[11px] gap-1"
                            >
                              <Terminal className="h-3 w-3" />
                              Inspect
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

      {/* Detail Inspector Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={open => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                Error Trace Inspector
              </DialogTitle>
              <Button size="sm" variant="outline" onClick={handleCopyLog} className="h-7 text-xs gap-1.5">
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </Button>
            </div>
            <DialogDescription className="text-xs font-mono break-all pt-1 text-rose-500">
              {selectedLog?.error_message}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-xs font-mono pt-2">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 font-sans">
                <div>
                  <span className="text-muted-foreground text-[11px]">Type:</span>{' '}
                  <span className="font-semibold">{selectedLog.error_type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Severity:</span>{' '}
                  <span className="font-semibold uppercase">{selectedLog.severity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Timestamp:</span>{' '}
                  <span>{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Route:</span>{' '}
                  <span className="truncate block">{selectedLog.url}</span>
                </div>
              </div>

              {selectedLog.error_stack && (
                <div className="space-y-1">
                  <div className="text-[11px] font-sans font-semibold text-muted-foreground">Error Stack Trace</div>
                  <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-200 text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border/40">
                    {selectedLog.error_stack}
                  </pre>
                </div>
              )}

              {selectedLog.component_stack && (
                <div className="space-y-1">
                  <div className="text-[11px] font-sans font-semibold text-muted-foreground">React Component Tree</div>
                  <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-300 text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border/40">
                    {selectedLog.component_stack}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div className="space-y-1">
                  <div className="text-[11px] font-sans font-semibold text-muted-foreground">Client User Agent</div>
                  <div className="p-2 rounded-lg bg-muted text-[11px] break-all">
                    {selectedLog.user_agent}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
