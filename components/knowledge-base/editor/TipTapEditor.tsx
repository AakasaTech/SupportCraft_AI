"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlock from "@tiptap/extension-code-block";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link2, Code2, Undo2, Redo2,
  Image as ImageIcon,
} from "lucide-react";

interface Props {
  value:    string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarButtonProps {
  onClick:   () => void;
  active?:   boolean;
  disabled?: boolean;
  title:     string;
  children:  React.ReactNode;
}

function ToolbarBtn({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-lg text-sm transition-colors",
        active
          ? "bg-primary text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-border mx-0.5" />;
}

export function TipTapEditor({ value, onChange, placeholder = "Start writing…", className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline underline-offset-2" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl max-w-full my-4" } }),
      CodeBlock.configure({ HTMLAttributes: { class: "rounded-xl bg-muted p-4 font-mono text-sm overflow-x-auto my-3" } }),
      CharacterCount,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-1 py-2 text-foreground",
      },
    },
  });

  // Sync external value reset (e.g. AI generation fills the field)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== undefined && value !== current) {
      editor.commands.setContent(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url  = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (!url) { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  if (!editor) return null;

  const wordCount = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 border-b border-border bg-muted/30">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()}        active={editor.isActive("bold")}        title="Bold (⌘B)">        <Bold        size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()}      active={editor.isActive("italic")}      title="Italic (⌘I)">      <Italic      size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()}      active={editor.isActive("strike")}      title="Strikethrough">    <Strikethrough size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()}        active={editor.isActive("code")}        title="Inline Code">      <Code        size={14} /></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1"> <Heading1 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"> <Heading2 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"> <Heading3 size={14} /></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive("bulletList")}  title="Bullet List">     <List        size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">    <ListOrdered size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}  active={editor.isActive("blockquote")}  title="Blockquote">      <Quote       size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()}   active={editor.isActive("codeBlock")}   title="Code Block">      <Code2       size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">                                                  <Minus       size={14} /></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={setLink}   active={editor.isActive("link")}  title="Link">  <Link2      size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={addImage}  title="Image">                                    <ImageIcon  size={14} /></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (⌘Z)"> <Undo2 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (⌘⇧Z)"><Redo2 size={14} /></ToolbarBtn>

        <span className="ml-auto text-[11px] text-muted-foreground pr-1">{wordCount} words</span>
      </div>

      {/* Content */}
      <EditorContent editor={editor} className="px-4 py-3" />
    </div>
  );
}
