import { ProductCard, ProductCardData } from './ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return <EmptyState title="NO POSTERS FOUND" description="Try a different search or category." />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-6 lg:gap-y-12">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
