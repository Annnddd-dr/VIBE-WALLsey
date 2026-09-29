import { prisma } from '@/lib/prisma';

/**
 * Admin-editable site configuration.
 * Values live in the StoreSetting table; each falls back to its env var
 * (or a hard default) when the row is absent. Admin -> Shipping writes rows,
 * and every reader on the site (pricing, cart, checkout) picks the change up
 * on the next request — no redeploy or restart needed.
 */

export const SETTING_KEYS = {
  freeShippingThreshold: 'shipping.freeShippingThreshold', // rupees
  flatShippingRate: 'shipping.flatShippingRate', // rupees
} as const;

const DEFAULTS: Record<string, number> = {
  [SETTING_KEYS.freeShippingThreshold]: 500,
  [SETTING_KEYS.flatShippingRate]: 99,
};

// Env fallback when the DB has no row (rupees).
function envFallback(key: string): number | undefined {
  switch (key) {
    case SETTING_KEYS.freeShippingThreshold:
      return process.env.FREE_SHIPPING_THRESHOLD_INR ? Number(process.env.FREE_SHIPPING_THRESHOLD_INR) : undefined;
    case SETTING_KEYS.flatShippingRate:
      return process.env.FLAT_SHIPPING_RATE_INR ? Number(process.env.FLAT_SHIPPING_RATE_INR) : undefined;
    default:
      return undefined;
  }
}

export async function getStoreSetting(key: string): Promise<number | null> {
  try {
    const row = await prisma.storeSetting.findUnique({ where: { key } });
    if (row) {
      const n = Number(row.value);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  } catch {
    // Table missing or DB hiccup — fall through to env/default.
  }
  const env = envFallback(key);
  if (env !== undefined) return env;
  return DEFAULTS[key] ?? null;
}

export async function setStoreSetting(key: string, value: number): Promise<void> {
  await prisma.storeSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
}

/** Shipping rates in rupees, resolved for the whole site. */
export async function getShippingRates(): Promise<{ freeShippingThreshold: number; flatShippingRate: number }> {
  const [freeShippingThreshold, flatShippingRate] = await Promise.all([
    getStoreSetting(SETTING_KEYS.freeShippingThreshold),
    getStoreSetting(SETTING_KEYS.flatShippingRate),
  ]);
  return {
    freeShippingThreshold: freeShippingThreshold ?? 500,
    flatShippingRate: flatShippingRate ?? 99,
  };
}
