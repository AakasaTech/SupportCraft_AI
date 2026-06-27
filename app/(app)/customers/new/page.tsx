"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { CustomerForm } from "@/features/customers/components/CustomerForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewCustomerPage() {
  const router = useRouter();

  return (
    <div>
      <Header title="Add Customer" description="Create a new customer profile" />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Customer details</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm onSuccess={(id) => router.push(`/customers/${id}`)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
