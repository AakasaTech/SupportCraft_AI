"use client";

import { useState, useTransition } from "react";
import { Star, Loader2, Check } from "lucide-react";
import { submitTicketRating } from "@/features/tickets/actions/portalActions";

interface Props {
  ticketId:   string;
  customerId: string;
}

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export function CSATRating({ ticketId, customerId }: Props) {
  const [rating,     setRating]     = useState(0);
  const [hovered,    setHovered]    = useState(0);
  const [comment,    setComment]    = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [isPending,  startTransition] = useTransition();

  const display = hovered || rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setError(null);
    const fd = new FormData();
    fd.set("ticketId",   ticketId);
    fd.set("customerId", customerId);
    fd.set("rating",     String(rating));
    fd.set("comment",    comment.trim());
    startTransition(async () => {
      const result = await submitTicketRating(fd);
      if (result?.error) setError(result.error);
      else setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <div className="sc-card p-5 flex items-center gap-3 bg-success-subtle border-success/20">
        <Check size={18} className="text-success shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Thank you for your feedback!</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your rating helps us improve our support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-card p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">How was your support experience?</p>
        <p className="text-xs text-muted-foreground mt-0.5">Rate this resolved ticket to help us improve.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Stars */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1"
            onMouseLeave={() => setHovered(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <Star
                  size={28}
                  className={star <= display
                    ? "text-amber-400 fill-amber-400"
                    : "text-muted-foreground/40"}
                />
              </button>
            ))}
          </div>
          {display > 0 && (
            <span className="text-sm font-medium text-foreground ml-1">
              {LABELS[display]}
            </span>
          )}
        </div>

        {/* Optional comment */}
        {rating > 0 && (
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)…"
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground text-foreground"
          />
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!rating || isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            {isPending ? "Submitting…" : "Submit Rating"}
          </button>
        </div>
      </form>
    </div>
  );
}
