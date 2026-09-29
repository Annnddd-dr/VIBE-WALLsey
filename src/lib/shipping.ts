import { addBusinessDays, format } from 'date-fns';
import { getShippingRates } from '@/lib/store-settings';

export interface ShippingEstimateResult {
  pincode: string;
  serviceable: boolean;
  city: string;
  state: string;
  zone: 'METRO' | 'TIER_1' | 'STANDARD';
  minDays: number;
  maxDays: number;
  deliveryRange: string;
  codAvailable: boolean;
  courier: string;
  freeShippingThreshold: number;
}

const PIN_PREFIX_MAP: Record<string, { state: string; city: string; zone: 'METRO' | 'TIER_1' | 'STANDARD' }> = {
  '56': { state: 'Karnataka', city: 'Bangalore Metro', zone: 'METRO' },
  '57': { state: 'Karnataka', city: 'Mangalore / Mysore', zone: 'TIER_1' },
  '58': { state: 'Karnataka', city: 'Hubli / Belgaum', zone: 'TIER_1' },
  '59': { state: 'Karnataka', city: 'North Karnataka', zone: 'STANDARD' },
  '40': { state: 'Maharashtra', city: 'Mumbai Metro', zone: 'METRO' },
  '41': { state: 'Maharashtra', city: 'Pune / Western MH', zone: 'TIER_1' },
  '42': { state: 'Maharashtra', city: 'Nashik / Jalgaon', zone: 'TIER_1' },
  '43': { state: 'Maharashtra', city: 'Aurangabad', zone: 'STANDARD' },
  '44': { state: 'Maharashtra', city: 'Nagpur', zone: 'TIER_1' },
  '11': { state: 'Delhi NCR', city: 'Delhi / Gurgaon / Noida', zone: 'METRO' },
  '12': { state: 'Haryana', city: 'Faridabad / Panipat', zone: 'TIER_1' },
  '13': { state: 'Haryana', city: 'Ambala / Kurukshetra', zone: 'STANDARD' },
  '14': { state: 'Punjab', city: 'Ludhiana / Jalandhar', zone: 'TIER_1' },
  '16': { state: 'Chandigarh', city: 'Chandigarh Tri-city', zone: 'TIER_1' },
  '60': { state: 'Tamil Nadu', city: 'Chennai Metro', zone: 'METRO' },
  '62': { state: 'Tamil Nadu', city: 'Madurai', zone: 'TIER_1' },
  '64': { state: 'Tamil Nadu', city: 'Coimbatore', zone: 'TIER_1' },
  '50': { state: 'Telangana', city: 'Hyderabad Metro', zone: 'METRO' },
  '51': { state: 'Andhra Pradesh', city: 'Tirupati / Rayalaseema', zone: 'STANDARD' },
  '52': { state: 'Andhra Pradesh', city: 'Vijayawada / Guntur', zone: 'TIER_1' },
  '53': { state: 'Andhra Pradesh', city: 'Visakhapatnam', zone: 'TIER_1' },
  '70': { state: 'West Bengal', city: 'Kolkata Metro', zone: 'METRO' },
  '38': { state: 'Gujarat', city: 'Ahmedabad / Gandhinagar', zone: 'TIER_1' },
  '39': { state: 'Gujarat', city: 'Surat / Vadodara', zone: 'TIER_1' },
  '30': { state: 'Rajasthan', city: 'Jaipur', zone: 'TIER_1' },
  '20': { state: 'Uttar Pradesh', city: 'Ghaziabad / Western UP', zone: 'TIER_1' },
  '22': { state: 'Uttar Pradesh', city: 'Lucknow / Kanpur', zone: 'TIER_1' },
  '68': { state: 'Kerala', city: 'Kochi / Ernakulam', zone: 'TIER_1' },
  '69': { state: 'Kerala', city: 'Trivandrum', zone: 'TIER_1' },
};

export async function estimateShippingForPincode(pincode: string): Promise<ShippingEstimateResult | null> {
  const cleanPin = pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return null;
  }

  const prefix = cleanPin.slice(0, 2);
  const location = PIN_PREFIX_MAP[prefix] || {
    state: 'India',
    city: 'All India Destination',
    zone: 'STANDARD' as const,
  };

  let minDays = 5;
  let maxDays = 7;

  if (location.zone === 'METRO') {
    minDays = 2;
    maxDays = 3;
  } else if (location.zone === 'TIER_1') {
    minDays = 3;
    maxDays = 5;
  }

  const now = new Date();
  const minDate = addBusinessDays(now, minDays);
  const maxDate = addBusinessDays(now, maxDays);

  const deliveryRange = `${format(minDate, 'EEE, d MMM')} – ${format(maxDate, 'EEE, d MMM')}`;

  return {
    pincode: cleanPin,
    serviceable: true,
    city: location.city,
    state: location.state,
    zone: location.zone,
    minDays,
    maxDays,
    deliveryRange,
    codAvailable: true,
    courier: location.zone === 'METRO' ? 'BlueDart Express Air' : 'Delhivery Surface Premium',
    freeShippingThreshold: (await getShippingRates()).freeShippingThreshold * 100,
  };
}
