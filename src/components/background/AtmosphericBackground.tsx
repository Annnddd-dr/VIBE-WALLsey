'use client';

import { usePathname } from 'next/navigation';
import { HalftoneBackground } from './HalftoneBackground';

/**
 * Global atmospheric environment — editorial halftone print screening.
 *
 * One fixed full-viewport canvas of an animated AM dot screen:
 *   - dot radius encodes tone with an area-true sqrt mapping
 *   - dots merge into rich solids; shadows sparkle with white diamonds
 *   - a second ink screen at a moire-safe angle adds a duotone overprint
 *   - pigment-aware: deep ink on warm paper (light), luminous dots on dark
 *     stock (dark)
 *   - the cursor acts as a soft ink-press bloom
 *   - fixed, pointer-events: none, behind all UI (z-index: -10)
 *   - Not rendered under /admin — the panel stays a quiet, professional SaaS.
 */
export function AtmosphericBackground() {
  const pathname = usePathname() || '';
  if (pathname.startsWith('/admin')) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed -inset-16 -z-10 overflow-hidden"
    >
      <HalftoneBackground />
    </div>
  );
}
