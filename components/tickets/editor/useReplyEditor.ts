"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { toast } from "sonner";
import { useFileHandler } from "./useFileHandler";
import type { EditorMode } from "./types";

interface Props {
  ticketId:    string;
  onReplySent?: () => void;
  onSuccess?:  (messageId: string) => void;
  aiSuggestion?: string;
}

export function useReplyEditor({ ticketId, onReplySent, onSuccess, aiSuggestion }: Props) {
  const [mode,         setMode]         = useState<EditorMode>("reply");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging,   setIsDragging]   = useState(false);
  const [editorEmpty,  setEditorEmpty]  = useState(true);
  const dragCounter = useRef(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: {} }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({
        placeholder: ({ editor: e }) =>
          e.isEmpty
            ? (mode === "note"
                ? "Add an internal note (never visible to the customer)…"
                : "Write a reply to the customer…")
            : "",
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
    ],
    autofocus: false,
    content:   "",
    onCreate:  ({ editor: e }) => setEditorEmpty(e.isEmpty),
    onUpdate:  ({ editor: e }) => setEditorEmpty(e.isEmpty),
  });

  const { attachments, removeAttachment, handleFiles, insertImageInline } = useFileHandler({
    editor,
    ticketId,
  });

  const isEmpty = editorEmpty && attachments.filter(a => a.status === "done").length === 0;

  // Apply AI suggestion
  useEffect(() => {
    if (aiSuggestion && editor && editor.isEmpty) {
      editor.commands.setContent(`<p>${aiSuggestion}</p>`);
    }
  }, [aiSuggestion, editor]);

  // ── Drag and drop ──────────────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items && Array.from(e.dataTransfer.items).some(i => i.kind === "file")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // ── Clipboard paste ────────────────────────────────────────────────────────
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find(i => i.type.startsWith("image/"));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) insertImageInline(file);
    }
  }, [insertImageInline]);

  // ── File pickers ───────────────────────────────────────────────────────────
  const triggerImagePicker = useCallback(() => imageInputRef.current?.click(), []);
  const triggerFilePicker  = useCallback(() => fileInputRef.current?.click(),  []);

  const onImageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  }, [handleFiles]);

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  }, [handleFiles]);

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isEmpty && !isSubmitting) submit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, isSubmitting]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    if (isEmpty || isSubmitting) return;
    setIsSubmitting(true);

    const html      = editor?.getHTML()  ?? "";
    const text      = editor?.getText()  ?? "";
    const fileUrls  = attachments.filter(a => a.status === "done" && a.fileUrl).map(a => a.fileUrl!);

    try {
      const res = await fetch("/api/send-reply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ticketId, html, text, fileUrls, mode }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error ?? "Send failed");
      }

      const { messageId } = await res.json();
      editor?.commands.clearContent();
      onSuccess?.(messageId);
      onReplySent?.();
    } catch (err) {
      toast.error("Failed to send reply. Please try again.");
      console.error("send-reply error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [isEmpty, isSubmitting, editor, attachments, ticketId, mode, onSuccess, onReplySent]);

  return {
    editor,
    mode,
    setMode,
    attachments,
    removeAttachment,
    isDragging,
    handleDrop,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handlePaste,
    triggerImagePicker,
    triggerFilePicker,
    imageInputRef,
    fileInputRef,
    onImageInputChange,
    onFileInputChange,
    isSubmitting,
    submit,
    isEmpty,
    handleKeyDown,
  };
}
