import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  isValidSupabaseUrl,
  isValidSupabaseAnonKey,
  resolveCurrentCredentials,
} from '@/integrations/supabase/client';
import { getCanonicalSiteOrigin, extractOAuthCodeFromInput } from '@/hooks/useAuth';

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
});
