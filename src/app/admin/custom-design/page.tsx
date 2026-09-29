import { format } from 'date-fns';
import { ExternalLink, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { RequestStatusControl } from './RequestStatusControl';

export default async function AdminCustomDesignPage() {
  const [total, requests] = await Promise.all([
    prisma.customDesignRequest.count(),
    prisma.customDesignRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        artworkUrl: true,
        size: true,
        quantity: true,
        notes: true,
        estimatedCost: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow">Print studio</p>
          <h1 className="mt-2 text-2xl font-display">Custom requests</h1>
          <p className="mt-1 text-xs text-ink/45">{total} request{total === 1 ? '' : 's'} received</p>
        </div>
        <Sparkles className="text-accent" size={22} aria-hidden="true" />
      </div>

      <div className="overflow-x-auto border border-line rounded-sm">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-line/30 text-left text-xs uppercase text-ink/55">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Artwork</th>
              <th className="px-4 py-3">Print</th>
              <th className="px-4 py-3">Estimate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-t border-line align-top">
                <td className="px-4 py-4">
                  <p className="font-medium">{request.name}</p>
                  <a className="mt-1 block text-xs text-accent hover:underline" href={`mailto:${request.email}`}>{request.email}</a>
                  <a className="mt-1 block text-xs text-ink/55 hover:text-ink" href={`tel:${request.phone}`}>{request.phone}</a>
                  {request.notes && <p className="mt-2 max-w-56 whitespace-pre-wrap text-xs leading-5 text-ink/55">{request.notes}</p>}
                </td>
                <td className="px-4 py-4">
                  <a href={request.artworkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                    View artwork <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </td>
                <td className="px-4 py-4 text-xs text-ink/65">
                  <p>{request.size === 'POLAROID' ? 'Polaroid' : request.size}</p>
                  <p className="mt-1">Qty {request.quantity}</p>
                </td>
                <td className="px-4 py-4 text-xs font-medium">{formatINR(request.estimatedCost)}</td>
                <td className="px-4 py-4"><RequestStatusControl id={request.id} initialStatus={request.status} /></td>
                <td className="px-4 py-4 text-xs text-ink/55">{format(request.createdAt, 'dd MMM yyyy')}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-14 text-center text-sm text-ink/45">No custom print requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {total > requests.length && <p className="mt-3 text-xs text-ink/45">Showing the latest {requests.length} of {total} requests.</p>}
    </div>
  );
}