"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";

interface Props {
  articleId:  string;
  customerId?: string;
}

export function ArticleFeedback({ articleId, customerId }: Props) {
  const [state,   setState]   = useState<"idle" | "submitting" | "done">("idle");
  const [voted,   setVoted]   = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);

  const vote = async (helpful: boolean) => {
    if (state !== "idle") return;
    setVoted(helpful);
    if (!helpful) { setShowComment(true); return; }
    await submit(helpful, "");
  };

  const submit = async (helpful: boolean, note: string) => {
    setState("submitting");
    try {
      await fetch("/api/kb/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ articleId, isHelpful: helpful, comment: note || undefined, customerId }),
      });
      setState("done");
    } catch {
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle size={14} className="text-success" />
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Was this article helpful?</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => vote(true)}
          disabled={state === "submitting"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
            voted === true
              ? "bg-success/10 border-success/30 text-success"
              : "border-border text-muted-foreground hover:border-success/40 hover:text-success"
          }`}
        >
          <ThumbsUp size={14} />
          Yes, helpful
        </button>
        <button
          onClick={() => vote(false)}
          disabled={state === "submitting"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
            voted === false
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
          }`}
        >
          <ThumbsDown size={14} />
          Not helpful
        </button>
      </div>

      {showComment && voted === false && (
        <div className="space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What could be improved? (optional)"
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={() => submit(false, comment)}
            disabled={state === "submitting"}
            className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-50"
          >
            Submit feedback
          </button>
        </div>
      )}
    </div>
  );
}
