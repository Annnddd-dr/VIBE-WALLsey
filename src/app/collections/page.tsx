import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const metadata = { title: 'All Collections' };

export default async function CollectionsIndex() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="container-page py-14">
      <p className="eyebrow">Browse</p>
      <h1 className="text-4xl mt-2 mb-10">All Collections</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((c) => (
          <Link key={c.slug} href={`/collections/${c.slug}`} className="relative aspect-square bg-line/40 rounded-sm flex items-end p-5 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
            <span className="relative z-10 text-paper font-display text-lg">{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
