// Cloudflare Email Worker type (minimal interface needed)
interface RawEmailMessage {
  headers: { get(name: string): string | null };
}

export interface SpamSignals {
  auto_submitted:   boolean;
  has_x_loop:       boolean;
  is_bounce:        boolean;
  list_unsubscribe: boolean;
}

export function detectSpamSignals(message: RawEmailMessage): SpamSignals {
  const autoSubmitted   = message.headers.get("auto-submitted");
  const xLoop           = message.headers.get("x-loop");
  const returnPath      = message.headers.get("return-path");
  const precedence      = message.headers.get("precedence");
  const listUnsub       = message.headers.get("list-unsubscribe");

  const isAutoReply = Boolean(
    autoSubmitted && autoSubmitted !== "no"
  );
  const hasLoop       = Boolean(xLoop);
  const isBounce      = returnPath === "<>" || returnPath === "";
  const isBulk        = Boolean(
    precedence && /^(bulk|list|junk)$/i.test(precedence.trim())
  );
  const hasListUnsub  = Boolean(listUnsub);

  return {
    auto_submitted:   isAutoReply,
    has_x_loop:       hasLoop,
    is_bounce:        isBounce,
    list_unsubscribe: hasListUnsub || isBulk,
  };
}

/** Returns true if the email should be rejected at SMTP level. */
export function shouldReject(signals: SpamSignals): boolean {
  // Reject hard loops; let newsletter/bulk pass through (flag only)
  return signals.has_x_loop || signals.is_bounce || signals.auto_submitted;
}
