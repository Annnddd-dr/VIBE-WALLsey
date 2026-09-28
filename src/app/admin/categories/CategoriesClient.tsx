'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X, Loader2, FolderTree } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { products: number };
}

export function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { show } = useToast();

  function openCreate() {
    setEditing(null);
    setName('');
    setSlug('');
    setDescription('');
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? '');
    setModalOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug, description: description || null }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        show(data.error ?? 'Could not save category.', 'error');
        return;
      }
      show(editing ? 'Category updated.' : 'Category created.');
      setModalOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove(cat: Category) {
    if (!window.confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    setDeletingId(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        show(data.error ?? 'Could not delete category.', 'error');
        return;
      }
      show('Category deleted.');
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display">Categories</h1>
          <p className="text-xs text-ink/40 mt-1">{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary text-xs gap-2 py-2.5">
          <Plus size={15} /> New category
        </button>
      </div>

      <div className="border border-line rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-line/30 text-ink/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Slug</th>
              <th className="text-left px-4 py-3">Products</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-t border-line hover:bg-line/10">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <FolderTree size={15} className="text-ink/30" />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink/50">{cat.slug}</td>
                <td className="px-4 py-3 text-ink/60">{cat._count?.products ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-2 text-ink/40 hover:text-ink transition-colors"
                      title="Edit"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => remove(cat)}
                      disabled={deletingId === cat.id}
                      className="p-2 text-ink/40 hover:text-accent transition-colors disabled:opacity-40"
                      title="Delete"
                      aria-label={`Delete ${cat.name}`}
                    >
                      {deletingId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-ink/40 text-sm">
                  No categories yet. Create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-paper border border-line rounded-sm w-full max-w-md p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg">{editing ? 'Edit category' : 'New category'}</h2>
              <button onClick={() => setModalOpen(false)} aria-label="Close" className="p-1 hover:opacity-60">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-1.5">Name</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={60}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-1.5">Slug</label>
                <input
                  className="input font-mono text-xs"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="tamil-cinema"
                  required
                  disabled={!!editing}
                  title={editing ? 'Slug cannot be changed' : undefined}
                />
                <p className="text-[11px] text-ink/40 mt-1">Lowercase letters, numbers, dashes. Used in URLs.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  className="input min-h-[72px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost text-xs py-2">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary text-xs py-2 gap-2">
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {editing ? 'Save changes' : 'Create category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
