"use client";

import { motion } from "framer-motion";
import { Bot, User, UserCog, Lock, Clock, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketMessageWithAuthor } from "@/types/database";

interface Props {
  message: TicketMessageWithAuthor;
  isFirst?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ name, isAi, isCustomer }: { name: string; isAi: boolean; isCustomer: boolean }) {
  if (isAi) {
    return (
      <div className="w-8 h-8 rounded-full bg-ai-subtle flex items-center justify-center shrink-0">
        <Bot size={15} className="text-ai" />
      </div>
    );
  }
  if (isCustomer) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <User size={15} className="text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function RolePill({ isAi, isCustomer, isInternal, role }: {
  isAi: boolean; isCustomer: boolean; isInternal: boolean; role?: string;
}) {
  if (isAi)       return <span className="text-[10px] font-medium text-ai bg-ai-subtle px-1.5 py-0.5 rounded-full">AI</span>;
  if (isInternal) return <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Lock size={9} />Internal</span>;
  if (isCustomer) return <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Customer</span>;
  return <span className="text-[10px] font-medium text-primary bg-primary-subtle px-1.5 py-0.5 rounded-full capitalize">{role ?? "Agent"}</span>;
}

export function MessageBubble({ message, isFirst }: Props) {
  const isAi       = message.is_ai;
  const isCustomer = message.is_customer;
  const isInternal = message.is_internal;
  const authorName = message.author?.full_name ?? (isCustomer ? "Customer" : isAi ? "AI" : "Unknown");

  const bubbleCls = cn(
    "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words max-w-[85%]",
    isInternal
      ? "bg-amber-50 border border-amber-200 text-amber-900"
      : isAi
        ? "bg-ai-subtle border border-ai/20 text-foreground"
        : isCustomer
          ? "bg-muted text-foreground"
          : "bg-primary text-white"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("flex gap-3", isCustomer ? "flex-row" : "flex-row-reverse")}
    >
      <Avatar name={authorName} isAi={isAi} isCustomer={isCustomer} />

      <div className={cn("flex flex-col gap-1", isCustomer ? "items-start" : "items-end")}>
        {/* Author + role + time */}
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isCustomer ? "flex-row" : "flex-row-reverse")}>
          <span className="font-medium text-foreground">{authorName}</span>
          <RolePill isAi={isAi} isCustomer={isCustomer} isInternal={isInternal} role={message.author?.role} />
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeAgo(message.created_at)}
          </span>
          {message.edited_at && (
            <span className="flex items-center gap-1 opacity-70"><Pencil size={9} />edited</span>
          )}
        </div>

        {/* Bubble */}
        <div className={bubbleCls}>
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}

export function SystemEvent({ message }: { message: TicketMessageWithAuthor }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 py-1"
    >
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
        <UserCog size={11} />
        {message.content}
        <span className="opacity-60 ml-1">{timeAgo(message.created_at)}</span>
      </span>
      <div className="h-px flex-1 bg-border" />
    </motion.div>
  );
}
