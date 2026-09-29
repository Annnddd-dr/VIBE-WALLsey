/**
 * Server-side geocoding helpers.
 *
 * Primary: Google Geocoding REST API (requires the Geocoding API to be
 * enabled on the key's Cloud project). Fallback: OpenStreetMap Nominatim
 * (keyless) so address lookups keep working even when the Google key is
 * missing, restricted, or the Geocoding API isn't activated. Callers are
 * provider-agnostic — they just get the first successful result.
 */

const OSM_UA = 'VIBEWALLseyy/1.0 (poster store; contact: owner@vibewallsey.com)';

export interface ForwardResult {
  lat: number;
  lng: number;
  label: string;
}

export interface ReverseResult {
  line1: string;
  city: string;
  state: string;
  pincode: string;
  label: string;
}

// ---------------------------------------------------------------- Google --

interface GoogleGeocodeResponse {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address: string;
    types: string[];
    address_components?: Array<{ types: string[]; long_name: string }>;
    geometry: { location: { lat: number; lng: number } };
  }>;
}

function pick(parts: Array<{ types: string[]; long_name: string }> | undefined, type: string): string {
  const c = parts?.find((p) => p.types.includes(type));
  return c?.long_name ?? '';
}

export async function googleForward(q: string, key: string): Promise<ForwardResult | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    q + ', India'
  )}&region=in&key=${key}`;
  const r = await fetch(url, { next: { revalidate: 86400 } });
  const data = (await r.json()) as GoogleGeocodeResponse;
  if (data.status !== 'OK' || !data.results?.length) {
    console.warn(
      `[geocode] Google forward status=${data.status}${data.error_message ? ` (${data.error_message})` : ''}`
    );
    return null;
  }
  const first = data.results[0];
  return { lat: first.geometry.location.lat, lng: first.geometry.location.lng, label: first.formatted_address };
}

export async function googleReverse(lat: number, lng: number, key: string): Promise<ReverseResult | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
  const r = await fetch(url, { next: { revalidate: 86400 } });
  const data = (await r.json()) as GoogleGeocodeResponse;
  if (data.status !== 'OK' || !data.results?.length) {
    console.warn(
      `[geocode] Google reverse status=${data.status}${data.error_message ? ` (${data.error_message})` : ''}`
    );
    return null;
  }
  // Prefer a street-level result; fall back to the first.
  const result =
    data.results.find((x) => x.types.includes('street_address')) ??
    data.results.find((x) => x.types.includes('premise')) ??
    data.results[0];
  const comps = result.address_components;
  const formatted = result.formatted_address;
  return {
    line1: formatted,
    city:
      pick(comps, 'locality') ||
      pick(comps, 'administrative_area_level_3') ||
      pick(comps, 'administrative_area_level_2'),
    state: pick(comps, 'administrative_area_level_1'),
    pincode: pick(comps, 'postal_code'),
    label: formatted,
  };
}

// ------------------------------------------------- OpenStreetMap fallback --

interface NominatimSearchHit {
  lat: string;
  lon: string;
  display_name: string;
}

interface NominatimReverseHit {
  error?: string;
  display_name?: string;
  address?: Record<string, string>;
}

async function osmFetch(url: string): Promise<Response> {
  // Nominatim requires a descriptive User-Agent; the browser default is blocked.
  return fetch(url, {
    headers: { 'User-Agent': OSM_UA, 'Accept-Language': 'en' },
    next: { revalidate: 86400 },
  });
}

export async function osmForward(q: string): Promise<ForwardResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`;
  const r = await osmFetch(url);
  if (!r.ok) return null;
  const rows = (await r.json()) as NominatimSearchHit[];
  const hit = Array.isArray(rows) ? rows[0] : null;
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, label: hit.display_name ?? q };
}

export async function osmReverse(lat: number, lng: number): Promise<ReverseResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const r = await osmFetch(url);
  if (!r.ok) return null;
  const hit = (await r.json()) as NominatimReverseHit;
  if (!hit || hit.error || !hit.display_name) return null;
  const a = hit.address ?? {};
  const city = a.city || a.town || a.village || a.state_district || a.county || '';
  return {
    line1: hit.display_name,
    city,
    state: a.state ?? '',
    pincode: a.postcode ?? '',
    label: hit.display_name,
  };
}
