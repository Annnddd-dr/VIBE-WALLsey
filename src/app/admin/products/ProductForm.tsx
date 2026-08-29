'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploader, ImageItem } from './ImageUploader';
import {
  Save,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  Flame,
  Sparkles,
  Clock,
} from 'lucide-react';

// --- Variant generation constants (mirroring seed.ts / API) ---
const SIZES = [
  { size: 'A5', label: 'A5 (148×210mm)', mult: 1 },
  { size: 'A4', label: 'A4 (210×297mm)', mult: 1.5 },
  { size: 'A3', label: 'A3 (297×420mm)', mult: 2.2 },
  { size: 'A2', label: 'A2 (420×594mm)', mult: 3.2 },
  { size: 'A1', label: 'A1 (594×841mm)', mult: 4.5 },
];
const MATERIALS = [
  { material: 'MATTE', label: 'Matte', addon: 0 },
  { material: 'GLOSSY', label: 'Glossy', addon: 5000 },
  { material: 'TEXTURED', label: 'Textured', addon: 8000 },
];
const FRAMES = [
  { frame: 'NONE', label: 'No Frame', addon: 0 },
  { frame: 'BLACK', label: 'Black', addon: 30000 },
  { frame: 'WHITE', label: 'White', addon: 30000 },
  { frame: 'WOOD', label: 'Wood', addon: 45000 },
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface VariantData {
  id?: string;
  size: string;
  material: string;
  frame: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  isActive: boolean;
  stock: number;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  categories: Category[];
  initialData?: any;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function paiseToRupees(paise: number): string {
  return (paise / 100).toFixed(0);
}

function rupeesToPaise(rupees: string): number {
  const n = parseFloat(rupees);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

function computeVariantPrice(basePaise: number, sizeMult: number, materialAddon: number, frameAddon: number): number {
  return Math.round(basePaise * sizeMult) + materialAddon + frameAddon;
}

export function ProductForm({ mode, categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  // --- Form state ---
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [artist, setArtist] = useState(initialData?.artist ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? categories[0]?.id ?? '');
  const [status, setStatus] = useState(initialData?.status ?? 'DRAFT');
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [bestSeller, setBestSeller] = useState(initialData?.bestSeller ?? false);
  const [newArrival, setNewArrival] = useState(initialData?.newArrival ?? false);
  const [limited, setLimited] = useState(initialData?.limited ?? false);
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription ?? '');
  const [images, setImages] = useState<ImageItem[]>(
    initialData?.images?.map((img: any) => ({ url: img.url, altText: img.altText })) ?? []
  );

  // Pricing
  const [basePriceRupees, setBasePriceRupees] = useState(
    initialData ? paiseToRupees(initialData.variants?.[0]?.price ?? 24900) : '249'
  );
  const [compareAtPriceRupees, setCompareAtPriceRupees] = useState(
    initialData?.variants?.[0]?.compareAtPrice
      ? paiseToRupees(initialData.variants[0].compareAtPrice)
      : ''
  );
  const [defaultStock, setDefaultStock] = useState(50);

  // Variants (only used in edit mode for overrides)
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [variantsExpanded, setVariantsExpanded] = useState(false);
  const [variantSizeFilter, setVariantSizeFilter] = useState<string>('ALL');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugEdited && !isEdit) {
      setSlug(slugify(title));
    }
  }, [title, slugEdited, isEdit]);

  // Initialize variants from initialData in edit mode
  useEffect(() => {
    if (isEdit && initialData?.variants) {
      setVariants(
        initialData.variants.map((v: any) => ({
          id: v.id,
          size: v.size,
          material: v.material,
          frame: v.frame,
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          isActive: v.isActive,
          stock: v.inventory?.stock ?? 0,
        }))
      );
    }
  }, [isEdit, initialData]);

  // Compute preview variants in create mode
  const previewVariants = SIZES.map((s) =>
    MATERIALS.map((m) =>
      FRAMES.map((f) => ({
        size: s.size,
        sizeLabel: s.label,
        material: m.material,
        materialLabel: m.label,
        frame: f.frame,
        frameLabel: f.label,
        price: computeVariantPrice(rupeesToPaise(basePriceRupees), s.mult, m.addon, f.addon),
        compareAtPrice: compareAtPriceRupees
          ? computeVariantPrice(rupeesToPaise(compareAtPriceRupees), s.mult, m.addon, f.addon)
          : null,
      }))
    )
  ).flat(2);

  // Filtered variants for display
  const displayVariants = isEdit ? variants : previewVariants;
  const filteredVariants =
    variantSizeFilter === 'ALL'
      ? displayVariants
      : displayVariants.filter((v) => v.size === variantSizeFilter);

  const updateVariant = useCallback(
    (idx: number, field: keyof VariantData, value: any) => {
      setVariants((prev) => {
        const next = [...prev];
        (next[idx] as any)[field] = value;
        return next;
      });
    },
    []
  );

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    // Basic client-side validation
    if (!title.trim()) {
      setError('Title is required.');
      setSubmitting(false);
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      setSubmitting(false);
      return;
    }
    if (!categoryId) {
      setError('Category is required.');
      setSubmitting(false);
      return;
    }

    try {
      if (isEdit) {
        // PUT update
        const body = {
          title,
          slug,
          description,
          artist: artist || null,
          categoryId,
          status,
          featured,
          bestSeller,
          newArrival,
          limited,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          images: images.map((img) => ({
            url: img.url,
            altText: img.altText,
            publicId: img.publicId,
          })),
          variants: variants.map((v) => ({
            id: v.id,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            isActive: v.isActive,
            stock: v.stock,
          })),
        };

        const res = await fetch(`/api/admin/products/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Update failed');
        }

        setSuccess(true);
        setTimeout(() => router.push('/admin/products'), 1200);
      } else {
        // POST create
        const body = {
          title,
          slug: slug || undefined,
          description,
          artist: artist || undefined,
          categoryId,
          status,
          featured,
          bestSeller,
          newArrival,
          limited,
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
          images: images.map((img) => ({
            url: img.url,
            altText: img.altText,
            publicId: img.publicId,
          })),
          basePricePaise: rupeesToPaise(basePriceRupees),
          compareAtPricePaise: compareAtPriceRupees
            ? rupeesToPaise(compareAtPriceRupees)
            : undefined,
          defaultStock,
        };

        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Creation failed');
        }

        setSuccess(true);
        setTimeout(() => router.push('/admin/products'), 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="text-ink/40 hover:text-ink transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-display">
            {isEdit ? 'Edit Product' : 'New Product'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 size={16} /> Saved!
            </span>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary gap-2"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-sm mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* ═══════════════════ BASIC INFO ═══════════════════ */}
        <section className="border border-line rounded-sm p-6">
          <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-5">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label htmlFor="product-title" className="block text-xs font-medium text-ink/60 mb-1.5">
                Title *
              </label>
              <input
                id="product-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ronin Sunset"
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="product-slug" className="block text-xs font-medium text-ink/60 mb-1.5">
                Slug
              </label>
              <input
                id="product-slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                placeholder="ronin-sunset"
                className="input font-mono text-xs"
              />
              <p className="text-[11px] text-ink/30 mt-1">
                Auto-generated from title. Edit to customise the URL.
              </p>
            </div>
            <div>
              <label htmlFor="product-category" className="block text-xs font-medium text-ink/60 mb-1.5">
                Category *
              </label>
              <select
                id="product-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input"
                required
              >
                <option value="">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="product-artist" className="block text-xs font-medium text-ink/60 mb-1.5">
                Artist
              </label>
              <input
                id="product-artist"
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist name (optional)"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="product-status" className="block text-xs font-medium text-ink/60 mb-1.5">
                Status
              </label>
              <select
                id="product-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="product-description" className="block text-xs font-medium text-ink/60 mb-1.5">
                Description *
              </label>
              <textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this poster…"
                className="input min-h-[120px] resize-y"
                required
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════ FLAGS ═══════════════════ */}
        <section className="border border-line rounded-sm p-6">
          <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-5">
            Flags & Badges
          </h2>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'featured', label: 'Featured', icon: Star, value: featured, set: setFeatured },
              { key: 'bestSeller', label: 'Bestseller', icon: Flame, value: bestSeller, set: setBestSeller },
              { key: 'newArrival', label: 'New Arrival', icon: Sparkles, value: newArrival, set: setNewArrival },
              { key: 'limited', label: 'Limited Edition', icon: Clock, value: limited, set: setLimited },
            ].map(({ key, label, icon: Icon, value, set }) => (
              <button
                key={key}
                type="button"
                onClick={() => set(!value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-medium transition-all border ${
                  value
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-white border-line text-ink/40 hover:border-ink/20 hover:text-ink/60'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ═══════════════════ IMAGES ═══════════════════ */}
        <section className="border border-line rounded-sm p-6">
          <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-5">
            Images
          </h2>
          <ImageUploader images={images} onChange={setImages} />
        </section>

        {/* ═══════════════════ PRICING ═══════════════════ */}
        <section className="border border-line rounded-sm p-6">
          <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-5">
            Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label htmlFor="base-price" className="block text-xs font-medium text-ink/60 mb-1.5">
                Base Price (₹) — A5 Matte, No Frame *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-sm">₹</span>
                <input
                  id="base-price"
                  type="number"
                  value={basePriceRupees}
                  onChange={(e) => setBasePriceRupees(e.target.value)}
                  className="input pl-7"
                  min="1"
                  required={!isEdit}
                  disabled={isEdit}
                />
              </div>
              {isEdit && (
                <p className="text-[11px] text-ink/30 mt-1">
                  In edit mode, adjust prices per-variant below.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="compare-at-price" className="block text-xs font-medium text-ink/60 mb-1.5">
                Compare-at Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-sm">₹</span>
                <input
                  id="compare-at-price"
                  type="number"
                  value={compareAtPriceRupees}
                  onChange={(e) => setCompareAtPriceRupees(e.target.value)}
                  className="input pl-7"
                  min="0"
                  placeholder="Original price (optional)"
                  disabled={isEdit}
                />
              </div>
            </div>
            {!isEdit && (
              <div>
                <label htmlFor="default-stock" className="block text-xs font-medium text-ink/60 mb-1.5">
                  Default Stock per Variant
                </label>
                <input
                  id="default-stock"
                  type="number"
                  value={defaultStock}
                  onChange={(e) => setDefaultStock(parseInt(e.target.value) || 0)}
                  className="input"
                  min="0"
                />
              </div>
            )}
          </div>

          {/* Price preview matrix (create mode) */}
          {!isEdit && basePriceRupees && (
            <div className="mt-5 overflow-x-auto">
              <p className="text-xs text-ink/40 mb-2">
                Price preview — {SIZES.length} sizes × {MATERIALS.length} materials × {FRAMES.length} frames = {SIZES.length * MATERIALS.length * FRAMES.length} variants
              </p>
              <table className="w-full text-xs">
                <thead className="bg-line/30 text-ink/50 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-3 py-2">Size</th>
                    {MATERIALS.map((m) =>
                      FRAMES.map((f) => (
                        <th key={`${m.material}-${f.frame}`} className="text-right px-3 py-2">
                          {m.label}
                          <br />
                          <span className="font-normal normal-case">{f.label}</span>
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map((s) => (
                    <tr key={s.size} className="border-t border-line">
                      <td className="px-3 py-2 font-medium">{s.label}</td>
                      {MATERIALS.map((m) =>
                        FRAMES.map((f) => {
                          const price = computeVariantPrice(
                            rupeesToPaise(basePriceRupees),
                            s.mult,
                            m.addon,
                            f.addon
                          );
                          return (
                            <td key={`${m.material}-${f.frame}`} className="text-right px-3 py-2 tabular-nums">
                              ₹{(price / 100).toLocaleString('en-IN')}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ═══════════════════ VARIANTS (Edit mode) ═══════════════════ */}
        {isEdit && variants.length > 0 && (
          <section className="border border-line rounded-sm">
            <button
              type="button"
              onClick={() => setVariantsExpanded(!variantsExpanded)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-line/20 transition-colors"
            >
              <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide">
                Variants ({variants.length})
              </h2>
              {variantsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {variantsExpanded && (
              <div className="px-6 pb-6 space-y-4">
                {/* Size filter */}
                <div className="flex gap-1.5 flex-wrap">
                  {['ALL', ...SIZES.map((s) => s.size)].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setVariantSizeFilter(s)}
                      className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${
                        variantSizeFilter === s
                          ? 'bg-ink text-paper'
                          : 'bg-line/50 text-ink/50 hover:bg-line'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Variant table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-line/30 text-ink/50 uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-3 py-2">SKU</th>
                        <th className="text-left px-3 py-2">Size</th>
                        <th className="text-left px-3 py-2">Material</th>
                        <th className="text-left px-3 py-2">Frame</th>
                        <th className="text-right px-3 py-2">Price (₹)</th>
                        <th className="text-right px-3 py-2">Compare</th>
                        <th className="text-right px-3 py-2">Stock</th>
                        <th className="text-center px-3 py-2">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVariants.map((v, _filtIdx) => {
                        // Find original index in full variants array
                        const realIdx = variants.findIndex((rv) => rv.id === (v as VariantData).id);
                        if (realIdx === -1) return null;
                        const variant = variants[realIdx];
                        return (
                          <tr key={variant.id} className="border-t border-line">
                            <td className="px-3 py-2 font-mono text-ink/40">{variant.sku}</td>
                            <td className="px-3 py-2">{variant.size}</td>
                            <td className="px-3 py-2">{variant.material}</td>
                            <td className="px-3 py-2">{variant.frame}</td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={Math.round(variant.price / 100)}
                                onChange={(e) =>
                                  updateVariant(
                                    realIdx,
                                    'price',
                                    Math.round(parseFloat(e.target.value || '0') * 100)
                                  )
                                }
                                className="w-20 text-right border border-line rounded-sm px-2 py-1 text-xs bg-white"
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={variant.compareAtPrice ? Math.round(variant.compareAtPrice / 100) : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateVariant(
                                    realIdx,
                                    'compareAtPrice',
                                    val ? Math.round(parseFloat(val) * 100) : null
                                  );
                                }}
                                className="w-20 text-right border border-line rounded-sm px-2 py-1 text-xs bg-white"
                                min="0"
                                placeholder="—"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={variant.stock}
                                onChange={(e) =>
                                  updateVariant(realIdx, 'stock', parseInt(e.target.value) || 0)
                                }
                                className="w-16 text-right border border-line rounded-sm px-2 py-1 text-xs bg-white"
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => updateVariant(realIdx, 'isActive', !variant.isActive)}
                                className={`w-8 h-5 rounded-full transition-colors relative ${
                                  variant.isActive ? 'bg-emerald-500' : 'bg-line'
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                    variant.isActive ? 'left-3.5' : 'left-0.5'
                                  }`}
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ═══════════════════ SEO ═══════════════════ */}
        <section className="border border-line rounded-sm p-6">
          <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-5">
            SEO
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="seo-title" className="block text-xs font-medium text-ink/60 mb-1.5">
                SEO Title
              </label>
              <input
                id="seo-title"
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={title || 'Page title for search engines'}
                className="input"
                maxLength={70}
              />
              <p className="text-[11px] text-ink/30 mt-1">{seoTitle.length}/70 characters</p>
            </div>
            <div>
              <label htmlFor="seo-description" className="block text-xs font-medium text-ink/60 mb-1.5">
                SEO Description
              </label>
              <textarea
                id="seo-description"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Meta description for search results…"
                className="input min-h-[80px] resize-y"
                maxLength={160}
              />
              <p className="text-[11px] text-ink/30 mt-1">{seoDescription.length}/160 characters</p>
            </div>
            {/* Google preview */}
            {(seoTitle || title) && (
              <div className="border border-line rounded-sm p-4 bg-white">
                <p className="text-xs text-ink/30 mb-2">Google Preview</p>
                <p className="text-blue-700 text-sm leading-tight">
                  {seoTitle || title} · POSTERraxx
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  posterraxx.com/product/{slug || 'product-slug'}
                </p>
                <p className="text-xs text-ink/50 mt-1 line-clamp-2">
                  {seoDescription || description || 'Product description will appear here…'}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}
