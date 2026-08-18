// Vercel Edge Middleware — framework-agnostic (works for Vite/static too, not Next.js-only).
// Docs: https://vercel.com/docs/functions/edge-middleware
// Reads the visitor's country from Vercel's edge geo header (present on every
// request regardless of framework) and drops it in a cookie so
// PaystackCheckoutButton can price correctly on first paint, with zero
// client-side geolocation roundtrip.
import { next } from '@vercel/edge';

export const config = {
  matcher: '/((?!_vercel|api|.*\\.[\\w]+$).*)',
};

export default function middleware(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') || 'US';

  const response = next();
  response.headers.append(
    'Set-Cookie',
    `pp_country=${country}; Path=/; Max-Age=86400; SameSite=Lax`
  );
  return response;
}
