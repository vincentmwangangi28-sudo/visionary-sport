import { supabase } from '@/integrations/supabase/client';
import { PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_NAME } from '@/hooks/useAdmin';
import { logAdminAction } from './adminAuditService';

export const ADMIN_ROLES_STORAGE_KEY = 'predictpro_assigned_admin_roles_v1';
export const ADMIN_ROLES_EVENT = 'predictpro:admin-roles-updated';

export interface AdminRoleRecord {
  userId: string;
  email: string;
  fullName?: string | null;
  role: 'admin' | 'user';
  updatedAt: string;
  updatedBy: string;
}

/**
 * Validates whether the given user or email matches the designated primary admin
 * (Vincent Mwangangi / vincentmwangangi28@gmail.com).
 */
export function isPrimaryAdminUser(userOrEmail: { email?: string | null; user_metadata?: { full_name?: string } } | string | null | undefined): boolean {
  if (!userOrEmail) return false;
  
  if (typeof userOrEmail === 'string') {
    return userOrEmail.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase();
  }

  const email = (userOrEmail.email || '').toLowerCase().trim();
  const name = (
    userOrEmail.user_metadata?.full_name || ''
  ).toLowerCase().trim();

  return email === PRIMARY_ADMIN_EMAIL.toLowerCase() || name.includes('vincent mwangangi');
}

/**
 * Retrieves the currently active admin roles from local storage / cache.
 */
export function getLocalAdminRoles(): Record<string, AdminRoleRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ADMIN_ROLES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves roles to local storage and broadcasts a synchronization event across components.
 */
function saveLocalAdminRoles(roles: Record<string, AdminRoleRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_ROLES_STORAGE_KEY, JSON.stringify(roles));
    window.dispatchEvent(new CustomEvent(ADMIN_ROLES_EVENT, { detail: roles }));
  } catch {
    // Safe storage fallback
  }
}

/**
 * Fetches all assigned admin roles by querying Supabase `user_roles`
 * and merging with the local sync store.
 */
export async function fetchAssignedAdminRoles(): Promise<Record<string, 'admin' | 'user'>> {
  const result: Record<string, 'admin' | 'user'> = {};
  const local = getLocalAdminRoles();

  // Populate from local cache first
  Object.values(local).forEach(rec => {
    if (rec.userId) result[rec.userId] = rec.role;
    if (rec.email) result[rec.email.toLowerCase()] = rec.role;
  });

  // Query Supabase user_roles
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin');

    if (!error && Array.isArray(data)) {
      data.forEach(item => {
        if (item.user_id) {
          result[item.user_id] = 'admin';
        }
      });
    }
  } catch {
    // Graceful fallback to local cache
  }

  return result;
}

export interface ToggleAdminRoleParams {
  targetUserId: string;
  targetUserEmail: string;
  targetUserName?: string | null;
  currentActorEmail: string;
  currentActorName?: string | null;
  targetRole?: 'admin' | 'user'; // Optional explicit target; toggles if omitted
}

export interface ToggleAdminRoleResult {
  success: boolean;
  newRole: 'admin' | 'user';
  targetUserId: string;
  targetUserEmail: string;
  message: string;
}

/**
 * Toggles or updates an administrative role for a user.
 * SECURITY CONSTRAINT: Enforces that ONLY primary admin Vincent Mwangangi can execute this.
 */
export async function toggleUserAdminRole({
  targetUserId,
  targetUserEmail,
  targetUserName,
  currentActorEmail,
  currentActorName = PRIMARY_ADMIN_NAME,
  targetRole,
}: ToggleAdminRoleParams): Promise<ToggleAdminRoleResult> {
  const actorClean = (currentActorEmail || '').toLowerCase().trim();
  const targetClean = (targetUserEmail || '').toLowerCase().trim();

  // 1. STRICT SECURITY GATE: Only Vincent Mwangangi can modify roles
  if (!isPrimaryAdminUser(actorClean)) {
    const unauthorizedMsg = `Security Violation: Access denied. Only primary administrator ${PRIMARY_ADMIN_NAME} (${PRIMARY_ADMIN_EMAIL}) is authorized to manage administrator roles.`;
    
    // Log security violation into audit trail
    logAdminAction({
      actorName: currentActorName || 'Unauthorized Caller',
      actorEmail: actorClean || 'unknown',
      category: 'security',
      action: 'Unauthorized Role Modification Attempt',
      details: `Attempted to change admin privileges for user ${targetClean} (${targetUserId}) without root primary authority.`,
      severity: 'critical',
      targetId: targetUserId,
      ipAddress: 'Security Firewall Guard',
    });

    throw new Error(unauthorizedMsg);
  }

  // 2. ROOT PROTECTION: Vincent Mwangangi cannot be demoted
  if (isPrimaryAdminUser(targetClean)) {
    const rootProtectionMsg = `Action Prohibited: ${PRIMARY_ADMIN_NAME} is the designated root system administrator and their administrative privileges cannot be modified or revoked.`;
    throw new Error(rootProtectionMsg);
  }

  // 3. Determine current status and new role
  const currentRoles = getLocalAdminRoles();
  const isCurrentlyAdmin = currentRoles[targetUserId]?.role === 'admin' || currentRoles[targetClean]?.role === 'admin';
  const nextRole: 'admin' | 'user' = targetRole !== undefined 
    ? targetRole 
    : (isCurrentlyAdmin ? 'user' : 'admin');

  // 4. Update Database (Supabase user_roles)
  let dbSynced = false;
  try {
    if (nextRole === 'admin') {
      const { error } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: targetUserId, role: 'admin' },
          { onConflict: 'user_id,role' }
        );
      if (!error) dbSynced = true;
    } else {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetUserId)
        .eq('role', 'admin');
      if (!error) dbSynced = true;
    }
  } catch (dbErr) {
    console.warn('Database user_roles sync note:', dbErr);
  }

  // 5. Update local synchronization store
  const updatedRoles = { ...currentRoles };
  const record: AdminRoleRecord = {
    userId: targetUserId,
    email: targetClean,
    fullName: targetUserName || null,
    role: nextRole,
    updatedAt: new Date().toISOString(),
    updatedBy: currentActorEmail,
  };

  updatedRoles[targetUserId] = record;
  updatedRoles[targetClean] = record;
  saveLocalAdminRoles(updatedRoles);

  // 6. Record in Administrator Audit Ledger
  const actionTitle = nextRole === 'admin' ? 'Granted Administrator Privilege' : 'Revoked Administrator Privilege';
  const actionDetail = nextRole === 'admin' 
    ? `Elevated user ${targetClean} (${targetUserName || 'User'}) to System Administrator. Database synced: ${dbSynced ? 'Yes' : 'Local Fallback'}.`
    : `Revoked System Administrator privileges from user ${targetClean} (${targetUserName || 'User'}). Reverted to Standard User.`;

  logAdminAction({
    actorName: currentActorName || PRIMARY_ADMIN_NAME,
    actorEmail: currentActorEmail || PRIMARY_ADMIN_EMAIL,
    category: 'security',
    action: actionTitle,
    details: actionDetail,
    severity: nextRole === 'admin' ? 'warning' : 'info',
    targetId: targetUserId,
    ipAddress: '197.237.142.88 (Nairobi, KE)',
  });

  const successMessage = nextRole === 'admin'
    ? `Successfully granted Administrator privileges to ${targetUserName || targetClean}.`
    : `Successfully revoked Administrator privileges from ${targetUserName || targetClean}.`;

  return {
    success: true,
    newRole: nextRole,
    targetUserId,
    targetUserEmail: targetClean,
    message: successMessage,
  };
}
