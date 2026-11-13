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
import {
  detectDevicePlatform,
  downloadPlatformInstaller,
  getAndroidChromeIntentUrl,
  getPageVisitCount,
  recordPageVisit,
  isPromptDismissed,
  dismissPWAInstallPrompt,
} from '@/hooks/usePWAInstall';
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

  it('accurately detects Mobile (Android, iOS) and Desktop (Windows, macOS, Linux) platforms and generates OS installers', () => {
    const androidUa =
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
    const iosUa =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
    const winUa =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0';
    const macUa =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

    const androidInfo = detectDevicePlatform(androidUa);
    expect(androidInfo.platform).toBe('android');
    expect(androidInfo.isAndroid).toBe(true);
    expect(androidInfo.isMobile).toBe(true);
    expect(androidInfo.isDesktop).toBe(false);

    const iosInfo = detectDevicePlatform(iosUa);
    expect(iosInfo.platform).toBe('ios');
    expect(iosInfo.isIOS).toBe(true);
    expect(iosInfo.isMobile).toBe(true);

    const winInfo = detectDevicePlatform(winUa);
    expect(winInfo.platform).toBe('windows');
    expect(winInfo.browser).toBe('edge');
    expect(winInfo.isDesktop).toBe(true);

    const macInfo = detectDevicePlatform(macUa);
    expect(macInfo.platform).toBe('mac');
    expect(macInfo.browser).toBe('safari');
    expect(macInfo.isDesktop).toBe(true);

    expect(downloadPlatformInstaller('windows').filename).toBe('PredictPro-Windows-App.bat');
    expect(downloadPlatformInstaller('mac').filename).toBe('PredictPro-Mac-App.webloc');
    expect(downloadPlatformInstaller('linux').filename).toBe('PredictPro.desktop');
    expect(downloadPlatformInstaller('ios').filename).toBe('PredictPro-iOS.mobileconfig');
    expect(downloadPlatformInstaller('android').filename).toBe('PredictPro-App-Launcher.html');
    expect(getAndroidChromeIntentUrl()).toContain('intent://');
  });

  it('accurately tracks page visits and triggers the Get App prompt on or after the 3rd page visit', () => {
    localStorage.clear();
    sessionStorage.clear();

    // Initial state
    expect(getPageVisitCount()).toBe(0);

    // 1st visit on home page
    const visit1 = recordPageVisit('/');
    expect(visit1).toBe(1);
    expect(getPageVisitCount()).toBe(1);
    expect(visit1 >= 3).toBe(false);

    // Re-mount / duplicate components on the same page should NOT inflate visit count
    const visit1Repeat = recordPageVisit('/');
    expect(visit1Repeat).toBe(1);
    expect(getPageVisitCount()).toBe(1);

    // 2nd visit: user navigates to /live
    const visit2 = recordPageVisit('/live');
    expect(visit2).toBe(2);
    expect(getPageVisitCount()).toBe(2);
    expect(visit2 >= 3).toBe(false);

    // 3rd visit: user navigates to /match/123
    const visit3 = recordPageVisit('/match/123');
    expect(visit3).toBe(3);
    expect(getPageVisitCount()).toBe(3);
    expect(visit3 >= 3).toBe(true);

    // Prompt dismissal behavior
    expect(isPromptDismissed()).toBe(false);
    dismissPWAInstallPrompt(72);
    expect(isPromptDismissed()).toBe(true);
  });
});


