import type { Metadata } from "next";
import { Plus } from "lucide-react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/shared/Header";
import { CustomerTable } from "@/features/customers/components/CustomerTable";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const user = await requireAuth();

  const customers = await prisma.customer.findMany({
    where:   { organizationId: user.profile.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Header
        title="Customers"
        description="Your customer directory"
        actions={
          <Button asChild>
            <Link href="/customers/new">
              <Plus />
              Add Customer
            </Link>
          </Button>
        }
      />
      <div className="p-6">
        <CustomerTable customers={customers} />
      </div>
    </div>
  );
}
