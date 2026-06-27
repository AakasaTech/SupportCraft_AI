"use client";

import { useEffect } from "react";

interface Props {
  articleId: string;
}

export function ViewTracker({ articleId }: Props) {
  useEffect(() => {
    fetch(`/api/kb/view/${articleId}`, { method: "POST" }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
