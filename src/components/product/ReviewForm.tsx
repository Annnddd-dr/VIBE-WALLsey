'use client';

import { useState, useCallback } from 'react';
import { Star, Loader2, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function ReviewForm({
  productId,
  isLoggedIn,
}: {
  productId: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Memoize handleSubmit to prevent re-creation on every render
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title: title || undefined,
          body,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to post review.');

      setSuccess(true);
      setTitle('');
      setBody('');
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, productId, rating, title, body, router]);

  if (!isLoggedIn) {
    return (
      <div className="bg-line/20 border border-line rounded-sm p-4 text-xs text-ink/70 flex items-center justify-between">
        <span>Have you purchased this poster? Share your thoughts.</span>
        <Link href="/login" className="btn btn-ghost text-xs py-1.5 px-3">
          Sign In to Review
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-sm p-5 bg-surface">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="btn btn-ghost w-full gap-2 text-xs py-2.5"
        >
          <MessageSquarePlus size={15} />
          Write a Review
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink">Write a Review</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-ink/40 hover:text-ink"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-3 rounded-sm mb-4">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-xs text-emerald-700 bg-emerald-50 p-4 rounded-sm flex items-center gap-2">
              <CheckCircle2 size={16} />
              Thank you! Your review has been submitted.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Star selector */}
              <div>
                <label className="block text-ink/60 mb-1.5 font-medium">Your Rating *</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-ink/20 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={20}
                          className={active ? 'fill-accent text-accent' : 'text-line'}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-ink/50 text-xs">
                    {rating === 5 && 'Outstanding'}
                    {rating === 4 && 'Very Good'}
                    {rating === 3 && 'Average'}
                    {rating === 2 && 'Below Average'}
                    {rating === 1 && 'Poor'}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-ink/60 mb-1 font-medium">Review Title (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Stunning print quality & framing!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input text-xs"
                  maxLength={100}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-ink/60 mb-1 font-medium">Review Details *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="How does the poster look on your wall? How was the finish and paper thickness?"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="input text-xs resize-y"
                  minLength={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !body.trim()}
                  className="btn btn-primary text-xs"
                >
                  {loading ? <Loader2 size={13} className="animate-spin" /> : 'Submit Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
