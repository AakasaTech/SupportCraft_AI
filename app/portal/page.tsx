import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/helpers";

export default async function PortalRootPage() {
  const user = await getAuthUser();
  redirect(user ? "/portal/dashboard" : "/portal/login");
}
