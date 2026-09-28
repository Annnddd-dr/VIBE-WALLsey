import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { AddressFormModal } from './AddressFormModal';
import { AddressCard } from './AddressCard';
import { MapPin } from 'lucide-react';

export default async function AddressesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="eyebrow">Shipping</p>
          <h1 className="text-2xl lg:text-3xl font-display mt-2">Saved Addresses</h1>
        </div>
        <AddressFormModal />
      </div>

      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <AddressCard key={addr.id} address={addr} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-line rounded-sm bg-surface p-8">
          <div className="w-12 h-12 rounded-full bg-line/30 flex items-center justify-center mx-auto mb-3 text-ink/30">
            <MapPin size={20} />
          </div>
          <h3 className="text-base font-display text-ink mb-1">No addresses saved</h3>
          <p className="text-xs text-ink/50 mb-5 max-w-xs mx-auto">
            Save your delivery addresses for a faster 1-click checkout experience.
          </p>
          <AddressFormModal />
        </div>
      )}
    </div>
  );
}
