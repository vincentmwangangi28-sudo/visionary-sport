import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Search, Download, Trash2, Filter, ShieldCheck, 
  AlertTriangle, Info, Clock, User, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getAuditLogs, 
  clearAuditLogs, 
  exportAuditLogsAsCSV, 
  exportAuditLogsAsJSON, 
  AdminAuditEntry, 
  AuditCategory, 
  AuditSeverity 
} from '@/services/adminAuditService';

export const AdminAuditLogTab: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  useEffect(() => {
    setLogs(getAuditLogs());
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const handleExportCSV = () => {
    const csvContent = exportAuditLogsAsCSV(filteredLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `predictpro_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported as CSV');
  };

  const handleExportJSON = () => {
    const jsonContent = exportAuditLogsAsJSON(filteredLogs);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `predictpro_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported as JSON');
  };

  const handleClear = () => {
    if (confirm('Clear local administrative audit log entries?')) {
      clearAuditLogs();
      setLogs([]);
      toast.info('Audit trail cleared');
    }
  };

  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" /> Critical</Badge>;
      case 'warning':
        return <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/40 text-amber-500 bg-amber-500/10"><AlertTriangle className="h-3 w-3" /> Warning</Badge>;
      case 'info':
      default:
        return <Badge variant="outline" className="text-[10px] gap-1 border-sky-500/40 text-sky-500 bg-sky-500/10"><Info className="h-3 w-3" /> Info</Badge>;
    }
  };

  const getCategoryColor = (cat: AuditCategory) => {
    switch (cat) {
      case 'settlement': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      case 'promos': return 'text-primary border-primary/30 bg-primary/10';
      case 'broadcast': return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
      case 'security': return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
      case 'automation': return 'text-violet-500 border-violet-500/30 bg-violet-500/10';
      case 'config': return 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10';
      default: return 'text-muted-foreground border-border/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Admin Audit Trail & Security Ledger</h2>
              <Badge variant="outline" className="text-[10px] font-semibold text-emerald-500 border-emerald-500/30">
                Immutable
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprehensive chronological log of administrator actions, settlements, promo grants, and security validations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV} 
            className="text-xs h-9 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportJSON} 
            className="text-xs h-9 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>JSON</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear} 
            className="text-xs h-9 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/80">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit trail by action, keyword, actor, or IP address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {(['all', 'settlement', 'promos', 'broadcast', 'config', 'automation', 'security'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Stream */}
      <Card className="border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">Activity Records</CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {filteredLogs.length} Events
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Signed by Vincent Mwangangi</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No audit records match your current filter query.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold px-1.5 py-0.5 ${getCategoryColor(log.category)}`}>
                      {log.category}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">{log.action}</span>
                    {getSeverityBadge(log.severity)}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {log.details}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-primary" />
                      <span className="font-medium text-foreground">{log.actorName}</span>
                      <span className="text-muted-foreground/70">({log.actorEmail})</span>
                    </span>
                    {log.ipAddress && (
                      <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground">
                        {log.ipAddress}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/70">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
