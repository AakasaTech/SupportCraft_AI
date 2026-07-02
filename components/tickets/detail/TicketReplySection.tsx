"use client";

import { useRouter } from "next/navigation";
import { ReplyEditor } from "@/components/tickets/editor/ReplyEditor";

interface Props {
  ticketId:      string;
  onRequestAI?:  () => void;
  isAILoading?:  boolean;
  aiSuggestion?: string;
}

export function TicketReplySection({ ticketId, onRequestAI, isAILoading, aiSuggestion }: Props) {
  const router = useRouter();

  return (
    <ReplyEditor
      ticketId={ticketId}
      onSuccess={() => router.refresh()}
      onRequestAI={onRequestAI}
      isAILoading={isAILoading}
      aiSuggestion={aiSuggestion}
    />
  );
}
