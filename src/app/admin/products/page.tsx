import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { ProductListFilters } from './ProductListFilters';
import { ProductActions } from './ProductActions';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; category?: string };
}) {
  const { q, status, category } = searchParams;

  const where: any = {};

  // Search by title
  if (q) {
    where.title = { contains: q, mode: 'insensitive' };
  }
  // Filter by status
  if (status && status !== 'ALL') {
    where.status = status;
  }
  // Filter by category
  if (category && category !== 'ALL') {
    where.categoryId = category;
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        variants: { include: { inventory: true } },
        images: { take: 1, orderBy: { position: 'asc' } },
      },
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
    ARCHIVED: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display">Products</h1>
          <p className="text-xs text-ink/40 mt-1">{products.length} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="btn btn-primary gap-2"
        >
          <Plus size={16} />
          New Product
        </Link>
      </div>

      {/* Filters */}
      <ProductListFilters categories={categories} />

      {/* Product table */}
      <div className="border border-line rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-line/30 text-ink/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 w-12"></th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-right px-4 py-3">Variants</th>
              <th className="text-right px-4 py-3">Total Stock</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Flags</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const totalStock = p.variants.reduce(
                (sum, v) => sum + (v.inventory?.stock ?? 0),
                0
              );
              const lowStock = totalStock < 50;
              const heroImage = p.images[0]?.url;

              return (
                <tr key={p.id} className="border-t border-line hover:bg-line/10 transition-colors">
                  {/* Thumbnail */}
                  <td className="px-4 py-2.5">
                    {heroImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroImage}
                        alt={p.title}
                        className="w-10 h-10 object-cover rounded-sm border border-line"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-line/30 rounded-sm flex items-center justify-center text-ink/20 text-xs">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{p.title}</td>
                  <td className="px-4 py-2.5 text-ink/60">{p.category.name}</td>
                  <td className="px-4 py-2.5 text-right text-ink/50">{p.variants.length}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={lowStock ? 'text-red-600 font-medium' : 'text-ink/50'}>
                      {totalStock.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-sm border ${
                        STATUS_COLORS[p.status] ?? 'bg-line text-ink/50'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink/40">
                    {[
                      p.featured && 'Featured',
                      p.bestSeller && 'Bestseller',
                      p.newArrival && 'New',
                      p.limited && 'Limited',
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="p-1.5 rounded-sm text-ink/30 hover:text-accent hover:bg-accent/5 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <Link
                        href={`/product/${p.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-sm text-ink/30 hover:text-ink hover:bg-line/50 transition-colors"
                        title="View on store"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <ProductActions productId={p.id} productTitle={p.title} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-ink/30">
                  No products found. {q ? 'Try a different search.' : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
