import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

// Minimal shape of the address components we consume (avoids needing
// @types/google.maps on the server).
interface AddressComponent {
  types: string[];
  long_name: string;
}

function pick(parts: AddressComponent[] | undefined, type: string): string {
  const c = parts?.find((p) => p.types.includes(type));
  return c?.long_name ?? '';
}

/**
 * GET /api/geo/reverse?lat=..&lng=..
 * Server-side proxy over Google's Geocoding API so the key never reaches the
 * browser. Results cached 24h in-process.
 */
export async function GET(req: NextRequest) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Geocoding is not configured on this deployment.' }, { status: 503 });
  }

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
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
    const r = await fetch(url, { next: { revalidate: 86400 } });
    const data = await r.json();

    if (data.status === 'REQUEST_DENIED') {
      // Key valid but the Geocoding API isn't enabled on the Google project
      // (or the key's API restrictions exclude it).
      console.error('[geo/reverse] REQUEST_DENIED:', data.error_message ?? 'no message');
      return NextResponse.json(
        { error: 'Address lookup is unavailable — the Geocoding API must be enabled for the server key.' },
        { status: 503 }
      );
    }
    if (data.status !== 'OK' || !data.results?.length) {
      return NextResponse.json({ error: 'No address found for that location.' }, { status: 404 });
    }

    // Prefer a street-level result; fall back to the first.
    const result =
      data.results.find((r: any) => r.types.includes('street_address')) ??
      data.results.find((r: any) => r.types.includes('premise')) ??
      data.results[0];

    const comps = result.address_components;
    const formatted: string = result.formatted_address;

    const payload = {
      line1: formatted,
      city: pick(comps, 'locality') || pick(comps, 'administrative_area_level_3') || pick(comps, 'administrative_area_level_2'),
      state: pick(comps, 'administrative_area_level_1'),
      pincode: pick(comps, 'postal_code'),
      label: formatted,
    };

    cache.set(cacheKey, { at: Date.now(), data: payload });
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[geo/reverse] failed:', err);
    return NextResponse.json({ error: 'Address lookup failed.' }, { status: 502 });
  }
}
