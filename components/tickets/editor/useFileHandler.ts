"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Editor } from "@tiptap/react";
import type { Attachment } from "./types";

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Props {
  editor:   Editor | null;
  ticketId: string;
}

export function useFileHandler({ editor, ticketId }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id);
      att?.abortXhr?.abort();
      return prev.filter(a => a.id !== id);
    });
  }, []);

  const uploadToServer = useCallback((
    file: File,
    id: string,
    onProgress: (pct: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("ticketId", ticketId);

      const xhr = new XMLHttpRequest();

      setAttachments(prev =>
        prev.map(a => a.id === id ? { ...a, abortXhr: xhr } : a)
      );

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.fileUrl);
          } catch {
            reject(new Error("Invalid upload response"));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.onabort = () => reject(new Error("Upload aborted"));

      xhr.open("POST", "/api/upload");
      xhr.send(fd);
    });
  }, [ticketId]);

  const insertImageInline = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE) {
      toast.error(`${file.name} exceeds the 25 MB limit.`);
      return;
    }

    // Optimistic base64 preview
    const reader = new FileReader();
    reader.readAsDataURL(file);
    const base64 = await new Promise<string>((res) => {
      reader.onload = () => res(reader.result as string);
    });

    editor?.chain().focus().setImage({ src: base64, alt: file.name }).run();

    // Find the just-inserted image position (last inserted image with base64 src)
    let imagePos = -1;
    editor?.state.doc.descendants((node, pos) => {
      if (node.type.name === "image" && node.attrs.src === base64) {
        imagePos = pos;
      }
    });

    try {
      const id = uid();
      const fileUrl = await uploadToServer(file, id, () => {});

      // Replace base64 src with the real URL
      if (imagePos >= 0) {
        editor?.commands.command(({ tr }) => {
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === "image" && node.attrs.src === base64) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: fileUrl });
            }
          });
          return true;
        });
      }
    } catch {
      // Remove the optimistic node
      editor?.commands.command(({ tr }) => {
        let found = false;
        editor.state.doc.descendants((node, pos) => {
          if (!found && node.type.name === "image" && node.attrs.src === base64) {
            tr.delete(pos, pos + node.nodeSize);
            found = true;
          }
        });
        return true;
      });
      toast.error(`Failed to upload ${file.name}. Please try again.`);
    }
  }, [editor, uploadToServer]);

  const uploadAttachment = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE) {
      toast.error(`${file.name} exceeds the 25 MB limit.`);
      return;
    }

    const id = uid();
    const att: Attachment = {
      id,
      file,
      filename:       file.name,
      fileSize:       file.size,
      fileType:       file.type,
      uploadProgress: 0,
      status:         "uploading",
    };

    setAttachments(prev => [...prev, att]);

    try {
      const fileUrl = await uploadToServer(file, id, (pct) => {
        setAttachments(prev =>
          prev.map(a => a.id === id ? { ...a, uploadProgress: pct } : a)
        );
      });

      setAttachments(prev =>
        prev.map(a => a.id === id ? { ...a, fileUrl, uploadProgress: 100, status: "done" } : a)
      );
    } catch (err) {
      if ((err as Error).message === "Upload aborted") return;
      setAttachments(prev =>
        prev.map(a => a.id === id ? { ...a, status: "error" } : a)
      );
      toast.error(`Failed to upload ${file.name}. Please try again.`);
    }
  }, [uploadToServer]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith("image/")) {
        insertImageInline(file);
      } else {
        uploadAttachment(file);
      }
    });
  }, [insertImageInline, uploadAttachment]);

  return { attachments, removeAttachment, handleFiles, insertImageInline };
}
