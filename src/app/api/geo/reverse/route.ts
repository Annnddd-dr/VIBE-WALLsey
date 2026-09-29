import { NextRequest, NextResponse } from 'next/server';
import { googleReverse, osmReverse } from '@/lib/geocode';

const Schema = {
  lat: (v: string | null) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= -90 && n <= 90 ? n : null;
  },
  lng: (v: string | null) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= -180 && n <= 180 ? n : null;
  },
};

// Tiny in-process cache — repeated lookups (same delivery area) are free.
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
 * GET /api/geo/reverse?lat=..&lng=..
 * Server-side reverse geocoding proxy. Tries the Google Geocoding API first
 * (key stays server-side) and falls back to keyless OpenStreetMap so pin-drop
 * address autofill keeps working if the Geocoding API isn't activated on the
 * key. Results cached 24h in-process.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many lookups. Please try again shortly.' }, { status: 429 });
  }

  const lat = Schema.lat(req.nextUrl.searchParams.get('lat'));
  const lng = Schema.lng(req.nextUrl.searchParams.get('lng'));
  if (lat === null || lng === null) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 });
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const result = (key ? await googleReverse(lat, lng, key) : null) ?? (await osmReverse(lat, lng));
    if (!result) {
      return NextResponse.json({ error: 'No address found for that location.' }, { status: 404 });
    }
    cache.set(cacheKey, { at: Date.now(), data: result });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[geo/reverse] failed:', err);
    return NextResponse.json({ error: 'Address lookup failed.' }, { status: 502 });
  }
}
