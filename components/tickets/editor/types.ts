export type EditorMode = "reply" | "note";

export interface Attachment {
  id:               string;
  file:             File;
  filename:         string;
  fileSize:         number;
  fileType:         string;
  fileUrl?:         string;
  uploadProgress:   number;
  status:           "uploading" | "done" | "error";
  abortXhr?:        XMLHttpRequest;
}

export interface CannedResponse {
  id:        string;
  title:     string;
  body:      string; // HTML
  shortcut?: string;
}

export interface Agent {
  id:         string;
  name:       string;
  avatarUrl?: string;
  role:       string;
}
