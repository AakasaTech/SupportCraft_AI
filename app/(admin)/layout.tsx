import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/is-admin-email";
import { LayoutDashboard, Building2, Users, LogOut, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/admin",               label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/users",         label: "Users",         icon: Users },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) redirect("/unauthorized");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border flex flex-col bg-card">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="relative h-8 w-8 shrink-0">
            <Image src="/app_icon.png" alt="SupportCraft AI" width={32} height={32} className="rounded-lg" />
            <ShieldCheck size={12} className="absolute -bottom-1 -right-1 text-primary bg-background rounded-full" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Admin Panel</p>
            <p className="text-[10px] text-muted-foreground leading-tight">SupportCraft AI</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border">
          <p className="px-3 text-[10px] text-muted-foreground truncate mb-1">{user.email}</p>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut size={15} />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
