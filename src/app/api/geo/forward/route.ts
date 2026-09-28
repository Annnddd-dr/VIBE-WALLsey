import { NextRequest, NextResponse } from 'next/server';

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
 * delivery map on the tracking page. Key stays server-side; cached 24h.
 */
export async function GET(req: NextRequest) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Geocoding is not configured.' }, { status: 503 });
  }

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
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q + ', India')}&region=in&key=${key}`;
    const r = await fetch(url, { next: { revalidate: 86400 } });
    const data = await r.json();

    if (data.status === 'REQUEST_DENIED') {
      console.error('[geo/forward] REQUEST_DENIED:', data.error_message ?? 'no message');
      return NextResponse.json(
        { error: 'Address lookup is unavailable — the Geocoding API must be enabled for the server key.' },
        { status: 503 }
      );
    }
    if (data.status !== 'OK' || !data.results?.length) {
      return NextResponse.json({ error: 'Location not found.' }, { status: 404 });
    }

    const first = data.results[0];
    const payload = {
      lat: first.geometry.location.lat,
      lng: first.geometry.location.lng,
      label: first.formatted_address,
    };
    cache.set(cacheKey, { at: Date.now(), data: payload });
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[geo/forward] failed:', err);
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 502 });
  }
}
