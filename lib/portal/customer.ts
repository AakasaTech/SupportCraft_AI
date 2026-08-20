import { prisma } from "@/lib/prisma";

export interface PortalCustomer {
  id:       string;
  name:     string;
  email:    string;
  org_id:   string;
  org_name: string;
}

/**
 * Resolve all customer records for a portal user across all organisations.
 *
 * Agents create customers with userId = NULL. On first portal login we fall
 * back to email matching (case-insensitive) and return every matching row so
 * the portal shows tickets from every organisation that knows this person.
 *
 * `Customer.userId` is unique (one linked customer per NextAuth user), so at
 * most one of the email-matched rows can actually be linked — we link the
 * first unlinked match for an instant fast-path next time; any others keep
 * resolving via the slower email lookup on every login.
 */
export async function resolvePortalCustomers(
  userId: string,
  userEmail: string,
): Promise<PortalCustomer[]> {
  const linked = await prisma.customer.findUnique({
    where: { userId },
    select: { id: true, name: true, email: true, organizationId: true, organization: { select: { name: true } } },
  });

  if (linked) return [toPortalCustomer(linked)];

  if (!userEmail) return [];

  const byEmail = await prisma.customer.findMany({
    where: { email: { equals: userEmail, mode: "insensitive" } },
    select: { id: true, name: true, email: true, organizationId: true, userId: true, organization: { select: { name: true } } },
  });

  if (byEmail.length === 0) return [];

  const firstUnlinked = byEmail.find((c) => !c.userId);
  if (firstUnlinked) {
    await prisma.customer.update({ where: { id: firstUnlinked.id }, data: { userId } });
  }

  return byEmail.map(toPortalCustomer);
}

function toPortalCustomer(c: {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  organization: { name: string };
}): PortalCustomer {
  return {
    id:       c.id,
    name:     c.name,
    email:    c.email,
    org_id:   c.organizationId,
    org_name: c.organization.name,
  };
}
