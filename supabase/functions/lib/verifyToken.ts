import { importJWK, jwtVerify, type JWTVerifyResult } from 'https://esm.sh/jose@4.16.1';

// Public ES256 JWK provided for v3 tokens
export const V3_JWK = {
  kty: 'EC',
  crv: 'P-256',
  alg: 'ES256',
  kid: '3ffd6733-fda8-4c50-a118-82352da9d3be',
  x: 'CVpenURWn5AGAhm-jw-ImMFnejeOuhWw4vFywCDqDTk',
  y: 'DBYjpdXMtnHYkn3BFN2MRSZafo1pB4_CwLGDfvkz5mE',
  key_ops: ['verify'],
  ext: true,
};

/**
 * Verify a JWT using the v3 ES256 JWK. Returns the payload on success.
 * Throws on verification failure.
 */
export async function verifyWithV3(token: string): Promise<Record<string, unknown>> {
  const key = await importJWK(V3_JWK as any, V3_JWK.alg as string);
  const result: JWTVerifyResult = await jwtVerify(token, key as any);
  return result.payload as Record<string, unknown>;
}

/**
 * Lightweight compat verifier: try v3 (ES256) when token header matches, otherwise return null.
 * This does NOT replace your existing Supabase auth checks — it provides a fallback to
 * extract a user identifier (sub) from v3 tokens so functions can continue working.
 */
export async function verifyTokenCompat(token: string): Promise<{ version: 'v3'; payload: Record<string, unknown> } | null> {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const headerJson = Buffer.from(parts[0], 'base64').toString();
    const header = JSON.parse(headerJson);
    if (header?.alg === 'ES256' && header?.kid === V3_JWK.kid) {
      try {
        const payload = await verifyWithV3(token);
        return { version: 'v3', payload };
      } catch (e) {
        // verification failed for v3 token
        console.warn('v3 JWT verification failed:', (e as Error).message);
        return null;
      }
    }
  } catch (e) {
    // ignore header parse errors
  }
  return null;
}
