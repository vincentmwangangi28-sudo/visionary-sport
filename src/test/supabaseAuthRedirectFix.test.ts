import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  isValidSupabaseUrl,
  isValidSupabaseAnonKey,
  resolveCurrentCredentials,
} from '@/integrations/supabase/client';
import {
  getCanonicalSiteOrigin,
  extractOAuthCodeFromInput,
  savePersistedMemberUser,
  getPersistedMemberUser,
  hasKnownAccountOnDevice,
  getKnownAccountEmail,
} from '@/hooks/useAuth';
import type { User } from '@supabase/supabase-js';

describe('Supabase Placeholder & OAuth Redirect Typo Safeguards', () => {
  it('rejects placeholder URLs like https://your-project-id.supabase.co and typo domains', () => {
    expect(isValidSupabaseUrl('https://your-project-id.supabase.co')).toBe(false);
    expect(isValidSupabaseUrl('https://predicpro.guru')).toBe(false);
    expect(isValidSupabaseUrl('https://<project-ref>.supabase.co')).toBe(false);
    expect(isValidSupabaseUrl('')).toBe(false);
    expect(isValidSupabaseUrl(DEFAULT_SUPABASE_URL)).toBe(true);
  });

  it('rejects placeholder anon keys like your-anon-key', () => {
    expect(isValidSupabaseAnonKey('your-anon-key')).toBe(false);
    expect(isValidSupabaseAnonKey('placeholder')).toBe(false);
    expect(isValidSupabaseAnonKey(DEFAULT_SUPABASE_ANON_KEY)).toBe(true);
  });

  it('falls back to DEFAULT_SUPABASE_URL when env contains your-project-id.supabase.co', () => {
    const resolved = resolveCurrentCredentials({
      url: 'https://your-project-id.supabase.co',
      key: 'your-anon-key',
    });
    expect(resolved.url).toBe(DEFAULT_SUPABASE_URL);
    expect(resolved.key).toBe(DEFAULT_SUPABASE_ANON_KEY);
  });

  it('repairs predicpro.guru typo and normalizes predictpro.guru to https://www.predictpro.guru', () => {
    expect(getCanonicalSiteOrigin('https://predicpro.guru')).toBe('https://www.predictpro.guru');
    expect(getCanonicalSiteOrigin('https://www.predicpro.guru')).toBe('https://www.predictpro.guru');
    expect(getCanonicalSiteOrigin('https://predictpro.guru')).toBe('https://www.predictpro.guru');
    expect(getCanonicalSiteOrigin('https://www.predictpro.guru')).toBe('https://www.predictpro.guru');
    expect(
      getCanonicalSiteOrigin('https://ais-dev-utwwxl5ytt22cwj5s4o4rd-937574102702.europe-west2.run.app')
    ).toBe('https://ais-dev-utwwxl5ytt22cwj5s4o4rd-937574102702.europe-west2.run.app');
  });

  it('extracts PKCE authorization code from broken predicpro.guru/?code=... URLs and raw inputs', () => {
    const sampleCode = '93bcc669-3acf-4a84-8abd-58d3d5c4f3c2';
    expect(
      extractOAuthCodeFromInput(`https://predicpro.guru/?code=${sampleCode}`)
    ).toBe(sampleCode);
    expect(
      extractOAuthCodeFromInput(`https://www.predictpro.guru/?code=${sampleCode}&state=xyz`)
    ).toBe(sampleCode);
    expect(extractOAuthCodeFromInput(`?code=${sampleCode}`)).toBe(sampleCode);
    expect(extractOAuthCodeFromInput(sampleCode)).toBe(sampleCode);
    expect(extractOAuthCodeFromInput('   ')).toBeNull();
  });

  it('persists and auto-restores authenticated member session across visits without requiring re-login', () => {
    localStorage.clear();
    const mockUser = {
      id: 'user-123-abc',
      email: 'vipmember@predictpro.guru',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: 'VIP Member' },
    } as User;

    savePersistedMemberUser(mockUser);

    const restored = getPersistedMemberUser();
    expect(restored).not.toBeNull();
    expect(restored?.id).toBe('user-123-abc');
    expect(restored?.email).toBe('vipmember@predictpro.guru');
    expect(hasKnownAccountOnDevice()).toBe(true);
    expect(getKnownAccountEmail()).toBe('vipmember@predictpro.guru');
  });

  it('still remembers the user has an account even after explicit sign-out so Create Account popup is avoided', () => {
    localStorage.clear();
    const mockUser = {
      id: 'user-999-xyz',
      email: 'returning@predictpro.guru',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: { provider: 'email' },
      user_metadata: {},
    } as User;

    savePersistedMemberUser(mockUser);
    // Simulate explicit sign out
    localStorage.setItem('predictpro_explicit_signout_v1', 'true');
    localStorage.removeItem('predictpro_member_session_v1');

    // Should not auto-login after explicit sign-out, but MUST remember they already have an account
    expect(getPersistedMemberUser()).toBeNull();
    expect(hasKnownAccountOnDevice()).toBe(true);
    expect(getKnownAccountEmail()).toBe('returning@predictpro.guru');
  });
});

