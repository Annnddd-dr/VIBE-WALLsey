import { NextRequest, NextResponse } from 'next/server';
import { estimateShippingForPincode } from '@/lib/shipping';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get('pincode') || '';

  if (!pincode) {
    return NextResponse.json({ error: 'PIN code is required.' }, { status: 400 });
  }

  const result = estimateShippingForPincode(pincode);
  if (!result) {
    return NextResponse.json(
      { error: 'Please enter a valid 6-digit Indian PIN code.' },
      { status: 400 }
    );
  }

  return NextResponse.json(result);
}
