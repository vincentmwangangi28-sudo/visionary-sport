import { describe, it, expect } from 'vitest';

// Mirror of the Deno edge function signature logic — pure JS for testability
async function computeHmac(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
  const computed = await computeHmac(secret, body);
  if (computed.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

describe('M-Pesa webhook signature verification', () => {
  it('accepts a valid signature', async () => {
    const body = JSON.stringify({ event: 'payment.success' });
    const sig = await computeHmac('test-secret', body);
    expect(await verifySignature('test-secret', body, sig)).toBe(true);
  });

  it('rejects a tampered body', async () => {
    const sig = await computeHmac('test-secret', '{"event":"payment.success"}');
    expect(await verifySignature('test-secret', '{"event":"payment.failed"}', sig)).toBe(false);
  });

  it('rejects a wrong secret', async () => {
    const body = JSON.stringify({ event: 'payment.success' });
    const sig = await computeHmac('correct-secret', body);
    expect(await verifySignature('wrong-secret', body, sig)).toBe(false);
  });
});
