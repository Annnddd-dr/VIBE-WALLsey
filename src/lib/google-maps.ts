let loadPromise: Promise<void> | null = null;

/**
 * Loads the Google Maps JS API once per page. Resolves when
 * `google.maps` is usable. No-ops to a rejected promise when no key
 * is configured so callers can degrade gracefully.
 */
export function loadGoogleMaps(): Promise<void> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error('MAPS_NOT_CONFIGURED'));
  if (typeof window === 'undefined') return Promise.reject(new Error('NO_WINDOW'));
  const g = window as any;
  if (g.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // `loading=async` mode REQUIRES a callback — without it the bootstrap
    // resolves `s.onload` before `google.maps.importLibrary` is installed,
    // and callers race a half-initialized API.
    const CB = '__vibewallMapsLoaded';
    (window as any)[CB] = () => resolve();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=marker&loading=async&callback=${CB}`;
    s.async = true;
    s.onerror = () => {
      loadPromise = null;
      delete (window as any)[CB];
      reject(new Error('MAPS_LOAD_FAILED'));
    };
    document.head.appendChild(s);
  });
  return loadPromise;
}

export interface GeoParts {
  line1: string;
  city: string;
  state: string;
  pincode: string;
  label: string;
}

/**
 * Reverse-geocode via our server proxy (keeps the Geocoding key server-side
 * and lets us cache/rate-limit).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoParts> {
  const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error('Could not look up that address.');
  return res.json();
}
