"use client";

import { Sparkles, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toolbar }        from "./Toolbar";
import { EditorArea }     from "./EditorArea";
import { AttachmentList } from "./AttachmentList";
import { FooterBar }      from "./FooterBar";
import { DragOverlay }    from "./DragOverlay";
import { useReplyEditor } from "./useReplyEditor";

interface Props {
  ticketId:      string;
  onReplySent?:  () => void;
  onSuccess?:    (messageId: string) => void;
  aiSuggestion?: string;
  onRequestAI?:  () => void;
  isAILoading?:  boolean;
  className?:    string;
}

export function ReplyEditor({
  ticketId,
  onReplySent,
  onSuccess,
  aiSuggestion,
  onRequestAI,
  isAILoading,
  className,
}: Props) {
  const {
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
  } = useReplyEditor({ ticketId, onReplySent, onSuccess, aiSuggestion });

  return (
    <div
      className={cn("border-t border-border bg-background", className)}
      onKeyDown={handleKeyDown}
    >
      {/* AI suggestion banner */}
      {aiSuggestion && (
        <div className="px-3 pt-3">
          <div className="flex items-start gap-2 rounded-xl border border-ai/20 bg-ai-subtle p-3 text-sm">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-ai" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ai mb-1">AI Suggestion Ready</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{aiSuggestion}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => editor?.commands.setContent(`<p>${aiSuggestion}</p>`)}
              >
                Use
              </Button>
              <button className="rounded p-1 hover:bg-muted" onClick={() => {}}>
                <X size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2">
        <button
          onClick={() => setMode("reply")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            mode === "reply"
              ? "bg-primary text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Public Reply
        </button>
        <button
          onClick={() => setMode("note")}
          className={cn(
            "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            mode === "note"
              ? "bg-amber-500 text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Lock size={11} />
          Internal Note
        </button>
      </div>

      {/* Note mode banner */}
      {mode === "note" && (
        <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700 border border-amber-200">
          <Lock size={11} />
          Visible to agents only — not sent to the customer.
        </div>
      )}

      {/* Toolbar */}
      {editor && (
        <Toolbar
          editor={editor}
          onInsertImage={triggerImagePicker}
          onAttachFile={triggerFilePicker}
        />
      )}

      {/* Editor + drag target */}
      <div
        className="relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && <DragOverlay />}
        <EditorArea editor={editor} mode={mode} onPaste={handlePaste} />
      </div>

      {/* Attachments */}
      <AttachmentList attachments={attachments} onRemove={removeAttachment} />

      {/* Footer */}
      <FooterBar
        editor={editor}
        mode={mode}
        isEmpty={isEmpty}
        isSubmitting={isSubmitting}
        onSubmit={submit}
        onTriggerImage={triggerImagePicker}
        onTriggerFile={triggerFilePicker}
        onRequestAI={onRequestAI}
        isAILoading={isAILoading}
      />

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onImageInputChange}
        aria-hidden="true"
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onFileInputChange}
        aria-hidden="true"
      />
    </div>
  );
}
