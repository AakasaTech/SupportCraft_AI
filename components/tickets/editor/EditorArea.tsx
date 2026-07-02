"use client";

import { useEffect } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import type { EditorMode } from "./types";

interface Props {
  editor:     Editor | null;
  mode:       EditorMode;
  onPaste:    (e: ClipboardEvent) => void;
}

export function EditorArea({ editor, mode, onPaste }: Props) {
  // Register paste handler on the underlying DOM element
  useEffect(() => {
    const el = editor?.view?.dom;
    if (!el) return;
    el.addEventListener("paste", onPaste as EventListener);
    return () => el.removeEventListener("paste", onPaste as EventListener);
  }, [editor, onPaste]);

  return (
    <>
      <style>{`
        .sc-reply-editor .ProseMirror {
          min-height: 140px;
          outline: none;
          padding: 10px 12px;
          font-size: 0.875rem;
          line-height: 1.6;
          color: inherit;
        }
        .sc-reply-editor .ProseMirror h1 { font-size: 1.25rem; font-weight: 500; margin: 0.5em 0; }
        .sc-reply-editor .ProseMirror h2 { font-size: 1.1rem;  font-weight: 500; margin: 0.5em 0; }
        .sc-reply-editor .ProseMirror h3 { font-size: 1rem;    font-weight: 500; margin: 0.4em 0; }
        .sc-reply-editor .ProseMirror blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 12px;
          color: #6b7280;
          margin: 0.5em 0;
        }
        .sc-reply-editor .ProseMirror pre {
          background: #f3f4f6;
          border-radius: 6px;
          padding: 12px;
          font-family: ui-monospace, monospace;
          font-size: 0.8rem;
          margin: 0.5em 0;
          overflow-x: auto;
        }
        .sc-reply-editor .ProseMirror a {
          color: var(--color-primary, #6d28d9);
          text-decoration: underline;
        }
        .sc-reply-editor .ProseMirror img {
          max-width: 100%;
          max-height: 280px;
          border-radius: 6px;
          border: 0.5px solid rgba(0,0,0,0.08);
          object-fit: contain;
          display: block;
          margin: 4px 0;
        }
        .sc-reply-editor .ProseMirror ul,
        .sc-reply-editor .ProseMirror ol { padding-left: 20px; margin: 0.25em 0; }
        .sc-reply-editor .ProseMirror p { margin: 0.15em 0; }
        .sc-reply-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>

      <div
        role="textbox"
        aria-multiline="true"
        aria-label="Reply editor"
        className={cn(
          "sc-reply-editor min-h-[140px] cursor-text",
          mode === "note" && "bg-amber-50/40 dark:bg-amber-950/10"
        )}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </>
  );
}
