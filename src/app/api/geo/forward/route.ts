import { NextRequest, NextResponse } from 'next/server';
import { googleForward, osmForward } from '@/lib/geocode';

const cache = new Map<string, { at: number; data: unknown }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || e.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  e.count += 1;
  return e.count > 120;
}

/**
 * GET /api/geo/forward?q=600001
 * Forward geocoding (PIN code / area text → coordinates), used to center the
 * delivery map on the tracking page. Tries the Google Geocoding API first
 * (server-side key) and falls back to keyless OpenStreetMap so lookups keep
 * working if the Geocoding API isn't activated on the key. Cached 24h.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many lookups.' }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 4 || q.length > 120) {
    return NextResponse.json({ error: 'Provide a pincode or area to look up.' }, { status: 400 });
  }

  const cacheKey = `f:${q.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const result = (key ? await googleForward(q, key) : null) ?? (await osmForward(q));
    if (!result) {
      return NextResponse.json({ error: 'Location not found.' }, { status: 404 });
    }
    cache.set(cacheKey, { at: Date.now(), data: result });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[geo/forward] failed:', err);
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 502 });
  }
}
