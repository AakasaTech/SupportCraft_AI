import { requireAuth } from "@/lib/auth/helpers";
import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { SessionTimeout } from "@/components/shared/SessionTimeout";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, organization } = await requireAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SessionTimeout />
      <Sidebar profile={profile} organization={organization} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
