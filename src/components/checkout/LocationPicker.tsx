'use client';

import { useRef, useState, useEffect } from 'react';
import { MapPin, Loader2, Crosshair, X } from 'lucide-react';
import { loadGoogleMaps, reverseGeocode, GeoParts } from '@/lib/google-maps';

interface Props {
  onResolved: (parts: GeoParts & { lat: number; lng: number }) => void;
  onClear?: () => void;
}

/**
 * Google Maps location picker used on checkout.
 *
 * - "Use my current location" asks for browser geolocation permission,
 *   centers an Advanced-Marker pin and reverse-geocodes to autofill the form.
 * - The map is fully interactive: drag the pin or click the map to refine.
 * - Gracefully degrades to a plain "use GPS" button when the Maps key
 *   isn't configured (no broken UI).
 */
export function LocationPicker({ onResolved, onClear }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  // Map is visible by default on checkout — no hidden toggle required.
  const [open, setOpen] = useState(true);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Init the map only when the panel is opened.
  useEffect(() => {
    if (!open || mapsReady || mapsError) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;
        const g = window as any;
        // Raster renderer (no mapId): works without WebGL, so low-end Android
        // webviews and in-app browsers get a working map too.
        const map = new g.google.maps.Map(mapDivRef.current, {
          center: pos ?? { lat: 13.0827, lng: 80.2707 }, // default: Chennai
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        const marker = new g.google.maps.Marker({
          map,
          position: pos ?? { lat: 13.0827, lng: 80.2707 },
          draggable: true,
          title: 'Delivery location',
          icon: {
            url:
              'data:image/svg+xml;charset=UTF-8,' +
              encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill="#3E7C4F" stroke="#14201A" stroke-width="1"/><circle cx="12" cy="9" r="2.6" fill="#14201A"/></svg>'
              ),
            scaledSize: new g.google.maps.Size(34, 34),
            anchor: new g.google.maps.Point(17, 32),
          },
        });
        markerRef.current = marker;

        marker.addListener('dragend', (e: any) => {
          const p = { lat: e.latLng.lat(), lng: e.lng ?? e.latLng.lng() };
          setPos(p);
          resolveAddress(p);
        });
        map.addListener('click', (e: any) => {
          if (!e.latLng) return;
          const p = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          setPos(p);
          marker.position = p;
          resolveAddress(p);
        });

        setMapsReady(true);
      })
      .catch((err) => {
        console.error('[LocationPicker] Maps init failed:', err);
        setMapsError(err.message === 'MAPS_NOT_CONFIGURED' ? 'not-configured' : 'load-failed');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function resolveAddress(p: { lat: number; lng: number }) {
    setResolving(true);
    setError(null);
    try {
      const parts = await reverseGeocode(p.lat, p.lng);
      setLabel(parts.label);
      onResolved({ ...parts, ...p });
    } catch (err: any) {
      setError(err.message ?? 'Address lookup failed.');
    } finally {
      setResolving(false);
    }
  }

  function requestCurrentLocation() {
    setError(null);
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location detection.');
      return;
    }
    setLocating(true);
    // Watchdog: some embedded browsers (in-app webviews) never answer the
    // permission request at all — fall back to the map instead of spinning.
    let settled = false;
    const watchdog = setTimeout(() => {
      if (settled) return;
      settled = true;
      setLocating(false);
      setError('Location is taking too long — pick the spot on the map instead.');
      setOpen(true);
    }, 14000);
    navigator.geolocation.getCurrentPosition(
      async (gps) => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        const p = { lat: gps.coords.latitude, lng: gps.coords.longitude };
        setPos(p);
        setOpen(true);
        // Pan the (possibly still-initializing) map to the GPS fix.
        const wait = setInterval(() => {
          if (mapRef.current && markerRef.current) {
            mapRef.current.setCenter(p);
            markerRef.current.position = p;
            clearInterval(wait);
          }
        }, 150);
        setTimeout(() => clearInterval(wait), 6000);
        await resolveAddress(p);
        setLocating(false);
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission was denied. You can pick the spot on the map instead.');
          setOpen(true);
        } else {
          setError('Could not get your location. Try picking it on the map.');
          setOpen(true);
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  function confirmPin() {
    if (!pos) return;
    setOpen(false);
    // resolveAddress already pushed the latest position upward.
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={requestCurrentLocation} disabled={locating} className="btn btn-ghost text-xs gap-2 py-2 px-3 border-line">
          {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} className="text-accent" />}
          {locating ? 'Finding you…' : 'Use my current location'}
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-ink/40 hover:text-ink underline">
          {open ? 'Hide map' : 'Show map'}
        </button>
        {label && !open && (
          <button type="button" onClick={() => { setLabel(null); setPos(null); onClear?.(); }} className="text-xs text-ink/40 hover:text-red-600 flex items-center gap-1">
            <X size={12} /> clear
          </button>
        )}
      </div>

      {label && (
        <p className="mt-2 text-xs flex items-start gap-1.5 text-ink/70">
          <MapPin size={13} className="text-accent shrink-0 mt-0.5" />
          <span className="line-clamp-2">{label}</span>
        </p>
      )}
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}

      {open && (
        <div className="mt-3 border border-line rounded-sm overflow-hidden bg-surface">
          {mapsError ? (
            <div className="p-4 text-xs text-ink/60">
              {mapsError === 'not-configured' ? (
                <>
                  Map preview is unavailable — add <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable it.
                  GPS autofill still works in the browser where allowed.
                </>
              ) : (
                <>The map failed to load. GPS autofill may still work — or type the address manually.</>
              )}
            </div>
          ) : (
            <>
              <div ref={mapDivRef} className="w-full h-64 sm:h-72 bg-line/30" />
              <div className="p-3 flex items-center justify-between gap-3 bg-surface border-t border-line">
                <p className="text-[11px] text-ink/50">{resolving ? 'Looking up address…' : 'Drag the pin or tap the map to refine the spot.'}</p>
                <button type="button" onClick={confirmPin} disabled={!pos || resolving} className="btn btn-primary text-xs py-1.5 px-3">
                  Use this location
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
