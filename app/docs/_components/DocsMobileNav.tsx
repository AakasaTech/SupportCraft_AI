"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { DocsSidebarNav } from "./DocsSidebarNav";

export function DocsMobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        aria-label={open ? "Close docs menu" : "Open docs menu"}
        aria-expanded={open}
      >
        {open ? <X size={15} /> : <Menu size={15} />}
        {open ? "Close" : "Browse docs"}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-border bg-card p-4 shadow-md">
          <DocsSidebarNav onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
