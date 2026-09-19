export type AuditCategory = 
  | 'predictions' 
  | 'settlement' 
  | 'promos' 
  | 'broadcast' 
  | 'users' 
  | 'config' 
  | 'security' 
  | 'automation';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  category: AuditCategory;
  action: string;
  details: string;
  severity: AuditSeverity;
  ipAddress?: string;
  targetId?: string;
}

const STORAGE_KEY = 'predictpro_admin_audit_logs_v1';
const AUDIT_EVENT = 'predictpro:admin-audit-logged';

const INITIAL_LOGS: AdminAuditEntry[] = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    actorName: 'Vincent Mwangangi',
    actorEmail: 'vincentmwangangi28@gmail.com',
    category: 'settlement',
    action: 'Auto-Settled Match Batch',
    details: 'Verified and resolved 6 fixtures across Premier League and La Liga. 5 WON, 1 LOST (83.3% accuracy rate).',
    severity: 'info',
    ipAddress: '197.237.142.88 (Nairobi, KE)',
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actorName: 'Vincent Mwangangi',
    actorEmail: 'vincentmwangangi28@gmail.com',
    category: 'promos',
    action: 'Created Promo Voucher',
    details: 'Issued code VINCENT100 granting 100 coins with 500 redemption cap and 30-day expiry.',
    severity: 'info',
    ipAddress: '197.237.142.88 (Nairobi, KE)',
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    actorName: 'Vincent Mwangangi',
    actorEmail: 'vincentmwangangi28@gmail.com',
    category: 'broadcast',
    action: 'Published Site Announcement',
    details: 'Broadcasted live promotional banner "VIP Weekend Banker Release" to all platform users.',
    severity: 'info',
    ipAddress: '197.237.142.88 (Nairobi, KE)',
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actorName: 'Vincent Mwangangi',
    actorEmail: 'vincentmwangangi28@gmail.com',
    category: 'automation',
    action: 'Triggered Gemini AI Batch Pipeline',
    details: 'Executed Daily Intelligence cron generating 14 high-confidence value bets across European leagues.',
    severity: 'info',
    ipAddress: 'Cloud Edge Cron (Auto)',
  },
  {
    id: 'audit-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    actorName: 'System Security Guard',
    actorEmail: 'security@predictpro.com',
    category: 'security',
    action: 'Enforced Root Admin Restriction',
    details: 'Non-admin user attempt to access /admin was safely intercepted and redirected to security gateway.',
    severity: 'warning',
    ipAddress: '41.89.22.105 (Mombasa, KE)',
  }
];

export function getAuditLogs(): AdminAuditEntry[] {
  if (typeof window === 'undefined') return INITIAL_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LOGS;
  }
}

export function logAdminAction(entry: Omit<AdminAuditEntry, 'id' | 'timestamp'>): AdminAuditEntry {
  const current = getAuditLogs();
  const newEntry: AdminAuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const updated = [newEntry, ...current].slice(0, 150); // Keep latest 150 entries

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(AUDIT_EVENT, { detail: newEntry }));
    } catch {
      // safe fallback
    }
  }

  return newEntry;
}

export function clearAuditLogs(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent(AUDIT_EVENT));
    } catch {
      // safe fallback
    }
  }
}

export function exportAuditLogsAsCSV(logs: AdminAuditEntry[]): string {
  const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Category', 'Action', 'Severity', 'Details', 'IP Address'];
  const rows = logs.map(l => [
    `"${l.timestamp}"`,
    `"${l.actorName.replace(/"/g, '""')}"`,
    `"${l.actorEmail.replace(/"/g, '""')}"`,
    `"${l.category}"`,
    `"${l.action.replace(/"/g, '""')}"`,
    `"${l.severity}"`,
    `"${l.details.replace(/"/g, '""')}"`,
    `"${(l.ipAddress || 'N/A').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportAuditLogsAsJSON(logs: AdminAuditEntry[]): string {
  return JSON.stringify(logs, null, 2);
}
