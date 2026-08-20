import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paypal";

export async function POST(request: Request) {
  const body = await request.text();

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });

  const isValid = await verifyWebhookSignature(headers, body).catch(() => false);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      const subscriptionId = event.resource.id;
      const customId = event.resource.custom_id as string | undefined;

      if (customId) {
        const plan = getPlanFromSubscription(event.resource);
        const currentPeriodEnd = event.resource.billing_info?.next_billing_time
          ? new Date(event.resource.billing_info.next_billing_time)
          : null;

        await prisma.subscription.upsert({
          where:  { organizationId: customId },
          create: {
            organizationId: customId,
            paypalSubscriptionId: subscriptionId,
            plan,
            status: "active",
            currentPeriodEnd,
          },
          update: {
            paypalSubscriptionId: subscriptionId,
            plan,
            status: "active",
            currentPeriodEnd,
          },
        });

        await prisma.organization.update({
          where: { id: customId },
          data:  { plan },
        });
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED": {
      const subscriptionId = event.resource.id;

      const sub = await prisma.subscription.findFirst({
        where:  { paypalSubscriptionId: subscriptionId },
        select: { organizationId: true },
      });

      if (sub) {
        await prisma.subscription.updateMany({
          where: { paypalSubscriptionId: subscriptionId },
          data:  { plan: "free", status: "cancelled" },
        });

        await prisma.organization.update({
          where: { id: sub.organizationId },
          data:  { plan: "free" },
        });
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.RENEWED": {
      const subscriptionId = event.resource.id;
      await prisma.subscription.updateMany({
        where: { paypalSubscriptionId: subscriptionId },
        data: {
          status: "active",
          currentPeriodEnd: event.resource.billing_info?.next_billing_time
            ? new Date(event.resource.billing_info.next_billing_time)
            : null,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function getPlanFromSubscription(resource: { plan_id?: string }): "free" | "pro" | "business" {
  const planId = resource.plan_id;

  const businessIds = [
    process.env.PAYPAL_PLAN_ID_BUSINESS,
    process.env.PAYPAL_PLAN_ID_BUSINESS_YEARLY,
    process.env.PAYPAL_PLAN_ID_AGENCY,
    process.env.PAYPAL_PLAN_ID_AGENCY_YEARLY,
  ];

  const proIds = [
    process.env.PAYPAL_PLAN_ID_PRO,
    process.env.PAYPAL_PLAN_ID_PRO_YEARLY,
    process.env.PAYPAL_PLAN_ID_FREELANCER_MONTHLY,
    process.env.PAYPAL_PLAN_ID_FREELANCER_YEARLY,
  ];

  if (businessIds.includes(planId)) return "business";
  if (proIds.includes(planId)) return "pro";
  return "free";
}
