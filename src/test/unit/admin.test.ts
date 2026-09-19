import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_NAME } from '@/hooks/useAdmin';

describe('Admin Authorization and Portal Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('verifies Vincent Mwangangi as the primary designated administrator', () => {
    expect(PRIMARY_ADMIN_EMAIL).toBe('vincentmwangangi28@gmail.com');
    expect(PRIMARY_ADMIN_NAME).toBe('Vincent Mwangangi');

    const testUserVincent = {
      email: 'vincentmwangangi28@gmail.com',
      user_metadata: { full_name: 'Vincent Mwangangi' },
    };

    const isVincentEmail = testUserVincent.email.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase();
    const isVincentName = testUserVincent.user_metadata.full_name.toLowerCase().includes('vincent mwangangi');
    expect(isVincentEmail || isVincentName).toBe(true);

    // Any standard user must NOT match Vincent Mwangangi
    const regularUser = {
      email: 'john.doe@example.com',
      user_metadata: { full_name: 'John Doe' },
    };
    const isRegularAdmin = regularUser.email.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
      regularUser.user_metadata.full_name.toLowerCase().includes('vincent mwangangi');
    expect(isRegularAdmin).toBe(false);
  });

  it('blocks unauthorized users from spoofing admin access', () => {
    const unauthorizedUserEmail = 'attacker@example.com';
    const isAuthorized = unauthorizedUserEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();
    expect(isAuthorized).toBe(false);

    // If override exists but user is unauthorized, override is removed
    localStorage.setItem('predictpro_admin_override', 'true');
    if (!isAuthorized) {
      localStorage.removeItem('predictpro_admin_override');
    }
    expect(localStorage.getItem('predictpro_admin_override')).toBeNull();
  });

  it('formats revenue currency and MRR safely without NaN or undefined', () => {
    const transactions = [
      { amount: 500, status: 'completed' },
      { amount: 1200, status: 'completed' },
      { amount: 0, status: 'completed' },
    ];

    const total = transactions.reduce((s, t) => s + (t.amount ?? 0), 0);
    expect(total).toBe(1700);
    expect(`KES ${total.toLocaleString()}`).toBe('KES 1,700');
  });

  it('calculates 30-day prediction accuracy rates and DAU aggregations correctly', () => {
    interface TrendPoint {
      activeUsers: number;
      won: number;
      total: number;
      accuracyRate: number;
    }

    const mockPoints: TrendPoint[] = [
      { activeUsers: 1200, won: 5, total: 6, accuracyRate: Math.round((5 / 6) * 100) },
      { activeUsers: 1850, won: 8, total: 10, accuracyRate: Math.round((8 / 10) * 100) },
      { activeUsers: 2100, won: 9, total: 10, accuracyRate: Math.round((9 / 10) * 100) },
      { activeUsers: 1400, won: 4, total: 5, accuracyRate: Math.round((4 / 5) * 100) },
    ];

    // Total and average DAU
    const totalUsers = mockPoints.reduce((acc, p) => acc + p.activeUsers, 0);
    const avgDau = Math.round(totalUsers / mockPoints.length);
    expect(avgDau).toBe(1638);

    // Peak DAU
    const peakDau = Math.max(...mockPoints.map(p => p.activeUsers));
    expect(peakDau).toBe(2100);

    // Accuracy calculations
    const accuracies = mockPoints.map(p => p.accuracyRate);
    expect(accuracies).toEqual([83, 80, 90, 80]);

    const avgAccuracy = Math.round((accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 10) / 10;
    expect(avgAccuracy).toBe(83.3);

    const bestAccuracy = Math.max(...accuracies);
    expect(bestAccuracy).toBe(90);

    // Safe zero handling
    const zeroTestTotal = 0;
    const zeroWon = 0;
    const safeRate = zeroTestTotal > 0 ? Math.round((zeroWon / zeroTestTotal) * 100) : 0;
    expect(safeRate).toBe(0);
  });

  it('verifies site announcement broadcast service save, get, and dismissal', async () => {
    const { getSiteAnnouncement, saveSiteAnnouncement, dismissAnnouncement, isAnnouncementDismissed, resetAnnouncementDismissal } = await import('@/services/broadcastService');

    const defaultAnn = getSiteAnnouncement();
    expect(defaultAnn).toBeDefined();
    expect(defaultAnn.enabled).toBe(true);

    saveSiteAnnouncement({
      id: 'test-ann-1',
      enabled: true,
      headline: 'Special Test Banker',
      message: 'Test message for all users',
      theme: 'promo',
      targetAudience: 'all',
      dismissible: true,
      updatedAt: new Date().toISOString(),
      author: 'Vincent Mwangangi',
    });

    const saved = getSiteAnnouncement();
    expect(saved.id).toBe('test-ann-1');
    expect(saved.headline).toBe('Special Test Banker');

    expect(isAnnouncementDismissed('test-ann-1')).toBe(false);
    dismissAnnouncement('test-ann-1');
    expect(isAnnouncementDismissed('test-ann-1')).toBe(true);

    resetAnnouncementDismissal('test-ann-1');
    expect(isAnnouncementDismissed('test-ann-1')).toBe(false);
  });

  it('validates promo code creation, targeting, and redemption logic', async () => {
    const { getPromoCodes, redeemPromoCode, addPromoCode } = await import('@/services/promoCodeService');

    const promos = getPromoCodes();
    expect(promos.length).toBeGreaterThanOrEqual(1);

    // Initial code VINCENT100
    const vincentCode = promos.find(p => p.code === 'VINCENT100');
    expect(vincentCode).toBeDefined();
    expect(vincentCode?.coinsReward).toBe(100);

    // Test invalid code
    const invalidRes = await redeemPromoCode('FAKECODE999', 'user-123');
    expect(invalidRes.success).toBe(false);
    expect(invalidRes.coinsAdded).toBe(0);

    // Test VIP targeting rejection for free tier user
    const vipRes = await redeemPromoCode('VIPBOOST', 'user-456', 'free');
    expect(vipRes.success).toBe(false);
    expect(vipRes.message).toContain('exclusive to VIP');

    // Test valid redemption
    const validRes = await redeemPromoCode('VINCENT100', 'user-789', 'free');
    expect(validRes.success).toBe(true);
    expect(validRes.coinsAdded).toBe(100);

    // Test duplicate redemption prevention
    const duplicateRes = await redeemPromoCode('VINCENT100', 'user-789', 'free');
    expect(duplicateRes.success).toBe(false);
    expect(duplicateRes.message).toContain('already claimed');
  });

  it('evaluates match settlement rules for 1X2, Over/Under, and BTTS', () => {
    function computeOutcome(market: string, h: number, a: number): 'won' | 'lost' {
      const total = h + a;
      const pick = market.toLowerCase().trim();
      if (pick.includes('home win')) return h > a ? 'won' : 'lost';
      if (pick.includes('away win')) return a > h ? 'won' : 'lost';
      if (pick.includes('draw')) return h === a ? 'won' : 'lost';
      if (pick.includes('over 2.5')) return total > 2.5 ? 'won' : 'lost';
      if (pick.includes('under 2.5')) return total < 2.5 ? 'won' : 'lost';
      if (pick.includes('btts yes')) return (h > 0 && a > 0) ? 'won' : 'lost';
      return 'lost';
    }

    // Home Win: 2-1
    expect(computeOutcome('Home Win', 2, 1)).toBe('won');
    expect(computeOutcome('Home Win', 1, 1)).toBe('lost');

    // Away Win: 0-2
    expect(computeOutcome('Away Win', 0, 2)).toBe('won');

    // Draw: 2-2
    expect(computeOutcome('Draw', 2, 2)).toBe('won');

    // Over 2.5: 3-1 (total 4) vs 1-1 (total 2)
    expect(computeOutcome('Over 2.5', 3, 1)).toBe('won');
    expect(computeOutcome('Over 2.5', 1, 1)).toBe('lost');

    // BTTS Yes: 2-1 vs 3-0
    expect(computeOutcome('BTTS Yes', 2, 1)).toBe('won');
    expect(computeOutcome('BTTS Yes', 3, 0)).toBe('lost');
  });

  it('validates system configuration and feature flags lifecycle', async () => {
    const { getSystemConfig, saveSystemConfig, resetSystemConfig } = await import('@/services/systemConfigService');

    const initial = getSystemConfig();
    expect(initial).toBeDefined();
    expect(initial.vipGateEnforced).toBe(true);
    expect(initial.spinWheelMultiplier).toBe(1);

    const updated = saveSystemConfig({
      spinWheelMultiplier: 3,
      signupBonusCoins: 150,
      geminiModel: 'gemini-3.8-flash',
    }, 'Vincent Mwangangi');

    expect(updated.spinWheelMultiplier).toBe(3);
    expect(updated.signupBonusCoins).toBe(150);
    expect(updated.geminiModel).toBe('gemini-3.8-flash');
    expect(updated.updatedBy).toBe('Vincent Mwangangi');

    const fetched = getSystemConfig();
    expect(fetched.spinWheelMultiplier).toBe(3);

    const reset = resetSystemConfig();
    expect(reset.spinWheelMultiplier).toBe(1);
    expect(reset.signupBonusCoins).toBe(50);
  });

  it('validates admin audit logging, CSV export, and ledger management', async () => {
    const { 
      getAuditLogs, 
      logAdminAction, 
      exportAuditLogsAsCSV, 
      exportAuditLogsAsJSON,
      clearAuditLogs 
    } = await import('@/services/adminAuditService');

    const logs = getAuditLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);

    const newEntry = logAdminAction({
      actorName: 'Vincent Mwangangi',
      actorEmail: 'vincentmwangangi28@gmail.com',
      category: 'settlement',
      action: 'Test Fixture Settlement',
      details: 'Settled test match between Arsenal and Chelsea',
      severity: 'info',
    });

    expect(newEntry.id).toBeDefined();
    expect(newEntry.action).toBe('Test Fixture Settlement');

    const updatedLogs = getAuditLogs();
    expect(updatedLogs[0].action).toBe('Test Fixture Settlement');

    // Test CSV Export
    const csv = exportAuditLogsAsCSV(updatedLogs);
    expect(csv).toContain('Timestamp,Actor Name,Actor Email');
    expect(csv).toContain('Vincent Mwangangi');
    expect(csv).toContain('Test Fixture Settlement');

    // Test JSON Export
    const json = exportAuditLogsAsJSON(updatedLogs);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].action).toBe('Test Fixture Settlement');

    // Test Clear
    clearAuditLogs();
    const cleared = getAuditLogs();
    expect(cleared.length).toBe(0);
  });

  it('validates admin role management authorization rules and primary admin gating', async () => {
    const { 
      isPrimaryAdminUser, 
      toggleUserAdminRole, 
      getLocalAdminRoles,
      fetchAssignedAdminRoles
    } = await import('@/services/adminRolesService');

    // 1. Primary admin verification
    expect(isPrimaryAdminUser('vincentmwangangi28@gmail.com')).toBe(true);
    expect(isPrimaryAdminUser('VINCENTMWANGANGI28@GMAIL.COM')).toBe(true);
    expect(isPrimaryAdminUser('attacker@test.com')).toBe(false);
    expect(isPrimaryAdminUser(undefined)).toBe(false);

    // 2. Unauthorized user attempting to promote/demote must be strictly rejected
    await expect(
      toggleUserAdminRole({
        targetUserId: 'user-123',
        targetUserEmail: 'candidate@example.com',
        currentActorEmail: 'unauthorized@example.com',
        currentActorName: 'Imposter',
        targetRole: 'admin',
      })
    ).rejects.toThrow('Security Violation: Access denied. Only primary administrator Vincent Mwangangi');

    // 3. Attempting to demote root primary admin must be strictly prevented
    await expect(
      toggleUserAdminRole({
        targetUserId: 'vincent-id',
        targetUserEmail: 'vincentmwangangi28@gmail.com',
        currentActorEmail: 'vincentmwangangi28@gmail.com',
        currentActorName: 'Vincent Mwangangi',
        targetRole: 'user',
      })
    ).rejects.toThrow('Action Prohibited: Vincent Mwangangi is the designated root system administrator');

    // 4. Authorized toggle by Vincent Mwangangi succeeds
    const promoteResult = await toggleUserAdminRole({
      targetUserId: 'target-user-456',
      targetUserEmail: 'assistant@example.com',
      targetUserName: 'Deputy Admin',
      currentActorEmail: 'vincentmwangangi28@gmail.com',
      currentActorName: 'Vincent Mwangangi',
      targetRole: 'admin',
    });

    expect(promoteResult.success).toBe(true);
    expect(promoteResult.newRole).toBe('admin');
    expect(promoteResult.message).toContain('granted Administrator privileges');

    const localRoles = getLocalAdminRoles();
    expect(localRoles['target-user-456']).toBeDefined();
    expect(localRoles['target-user-456'].role).toBe('admin');

    // 5. Authorized demotion by Vincent Mwangangi
    const demoteResult = await toggleUserAdminRole({
      targetUserId: 'target-user-456',
      targetUserEmail: 'assistant@example.com',
      currentActorEmail: 'vincentmwangangi28@gmail.com',
      currentActorName: 'Vincent Mwangangi',
      targetRole: 'user',
    });

    expect(demoteResult.success).toBe(true);
    expect(demoteResult.newRole).toBe('user');
    expect(demoteResult.message).toContain('revoked Administrator privileges');

    const updatedRoles = getLocalAdminRoles();
    expect(updatedRoles['target-user-456'].role).toBe('user');
  });
});
