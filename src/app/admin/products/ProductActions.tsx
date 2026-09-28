'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductActionsProps {
  productId: string;
  productTitle: string;
}

export function ProductActions({ productId, productTitle }: ProductActionsProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}?hard=false`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Delete failed');
      }

      // Refresh the page
      router.refresh();
      setShowDeleteConfirm(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-sm p-6">
          <h3 className="text-lg font-semibold mb-2">Archive Product?</h3>
          <p className="text-sm text-ink/60 mb-6">
            Are you sure you want to archive <strong>{productTitle}</strong>? It will no longer be visible on the storefront, but can be restored.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn btn-ghost text-sm"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-danger gap-2 text-sm"
            >
              {deleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Archiving…
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Archive
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowDeleteConfirm(true)}
      className="p-1.5 rounded-sm text-ink/30 hover:text-red-600 hover:bg-red-50 transition-colors"
      title="Archive product"
    >
      <Trash2 size={14} />
    </button>
  );
}
