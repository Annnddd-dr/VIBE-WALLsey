'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/google-maps';

interface Props {
  destination: { city: string; state: string; pincode: string };
}

/**
 * Destination map on the tracking page — forward-geocodes the delivery area
 * (city + pincode) and renders a small interactive map with a pin. Deliberately
 * low-height and non-scrolling: it orients, it doesn't navigate.
 */
export function DestinationMap({ destination }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'unconfigured'>('loading');
  const [label, setLabel] = useState('');

  useEffect(() => {
    let cancelled = false;
    const q = [destination.city, destination.state, destination.pincode].filter(Boolean).join(', ');
    if (!q) {
      setState('error');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/geo/forward?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error();
        const geo = await res.json();
        if (cancelled) return;
        setLabel(geo.label ?? q);

        await loadGoogleMaps();
        if (cancelled || !divRef.current) return;

        const g = window as any;
        const map = new g.google.maps.Map(divRef.current, {
          center: { lat: geo.lat, lng: geo.lng },
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
          mapId: 'VIBEWALL_TRACKING',
        });
        const pin = document.createElement('div');
        pin.innerHTML =
          '<svg width="30" height="30" viewBox="0 0 24 24" fill="#3E7C4F" stroke="#14201A" stroke-width="1"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.6" fill="#14201A"/></svg>';
        new g.google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: geo.lat, lng: geo.lng },
          content: pin,
          title: 'Delivery destination',
        });
        setState('ready');
      } catch (err: any) {
        if (cancelled) return;
        setState(err?.message === 'MAPS_NOT_CONFIGURED' ? 'unconfigured' : 'error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [destination.city, destination.state, destination.pincode]);

  return (
    <div className="border border-line rounded-sm overflow-hidden bg-surface">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-line">
        <MapPin size={14} className="text-accent" />
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Delivering to</p>
        <p className="text-xs text-ink/70 ml-auto truncate max-w-[55%]">
          {destination.city}, {destination.pincode}
        </p>
      </div>
      <div className="relative h-48 sm:h-56 bg-line/30">
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center text-ink/40">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
        {state === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-ink/40 p-4 text-center">
            Map unavailable — your order is on its way to {destination.city} {destination.pincode}.
          </div>
        )}
        {state === 'unconfigured' && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-ink/40 p-4 text-center">
            Add <code className="font-mono mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to see the destination map.
          </div>
        )}
        <div ref={divRef} className={`w-full h-full ${state === 'ready' ? '' : 'invisible'}`} />
      </div>
      {state === 'ready' && label && (
        <p className="px-4 py-2.5 text-[11px] text-ink/50 border-t border-line truncate">{label}</p>
      )}
    </div>
  );
}
