"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  LayoutDashboard, Ticket, BookOpen, Megaphone,
  User, LogOut, Menu, X, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/portal/dashboard",     label: "Dashboard",       icon: LayoutDashboard },
  { href: "/portal/tickets",       label: "My Tickets",      icon: Ticket },
  { href: "/portal/knowledge-base",label: "Knowledge Base",  icon: BookOpen },
  { href: "/portal/announcements", label: "Announcements",   icon: Megaphone },
];

export function PortalHeader() {
  const pathname = usePathname();
  const router   = useRouter();

  const [email,       setEmail]       = useState<string | null>(null);
  const [userOpen,    setUserOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  const isLoginPage = pathname === "/portal/login";

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  const isActive = (href: string) =>
    href === "/portal/tickets"
      ? pathname.startsWith("/portal/tickets")
      : pathname.startsWith(href);

  return (
    <>
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href={isLoginPage ? "/portal/login" : "/portal/dashboard"}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">SC</span>
            </div>
            <span className="font-semibold text-sm hidden sm:block">Support Portal</span>
          </Link>

          {!isLoginPage && (
            <>
              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      isActive(href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-hover",
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label="Toggle menu"
                  className="md:hidden p-2 rounded-lg hover:bg-hover text-muted-foreground transition-colors"
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                {/* Desktop user menu */}
                {email && (
                  <div className="relative hidden md:block">
                    <button
                      onClick={() => setUserOpen((v) => !v)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-hover transition-colors"
                    >
                      <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-xs">
                        {email[0].toUpperCase()}
                      </div>
                      <ChevronDown size={12} className="text-muted-foreground" />
                    </button>

                    {userOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                        <div className="absolute right-0 top-full mt-1.5 z-20 w-56 sc-card p-1.5 shadow-dropdown">
                          <div className="px-3 py-2 mb-1 border-b border-border">
                            <p className="text-xs text-muted-foreground truncate">{email}</p>
                          </div>
                          <Link
                            href="/portal/profile"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-hover transition-colors"
                          >
                            <User size={14} className="text-muted-foreground" />
                            <span className="text-foreground">Profile</span>
                          </Link>
                          <button
                            onClick={() => { setUserOpen(false); void handleSignOut(); }}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 transition-colors text-destructive"
                          >
                            <LogOut size={14} />
                            Sign out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile nav drawer */}
      {!isLoginPage && mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 z-30 border-b border-border bg-background shadow-dropdown px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-hover",
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <div className="border-t border-border pt-2 mt-2 space-y-1">
            <Link
              href="/portal/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-hover transition-colors"
            >
              <User size={16} />
              Profile
            </Link>
            {email && (
              <button
                onClick={() => { setMobileOpen(false); void handleSignOut(); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
