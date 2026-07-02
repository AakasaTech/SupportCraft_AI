import Image from "next/image";
import Link from "next/link";
import { DocsSidebarNav } from "./_components/DocsSidebarNav";
import { DocsMobileNav  } from "./_components/DocsMobileNav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Top nav — same pattern as /privacy and /faq */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/app_icon.png" alt="SupportCraft AI" width={28} height={28} className="rounded-lg" />
              <span className="font-semibold text-sm">SupportCraft AI</span>
            </Link>
            <Link
              href="/docs"
              className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block"
            >
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"    className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block">Sign in</Link>
            <Link href="/register" className="sc-btn-primary rounded-lg px-4 py-2 text-sm font-semibold">Start free</Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Mobile nav toggle */}
        <div className="mb-6">
          <DocsMobileNav />
        </div>

        <div className="flex gap-12">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-24">
              <DocsSidebarNav />
            </div>
          </aside>

          {/* Page content */}
          <main className="min-w-0 flex-1 pb-20">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
