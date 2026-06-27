import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
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
  const supabase = createAdminClient();

  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      const subscriptionId = event.resource.id;
      const customId = event.resource.custom_id as string | undefined;

      if (customId) {
        await supabase
          .from("subscriptions")
          .upsert({
            org_id: customId,
            paypal_subscription_id: subscriptionId,
            plan: getPlanFromSubscription(event.resource),
            status: "active",
            current_period_end: event.resource.billing_info?.next_billing_time ?? null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "org_id" });

        await supabase
          .from("organizations")
          .update({ plan: getPlanFromSubscription(event.resource), updated_at: new Date().toISOString() })
          .eq("id", customId);
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED": {
      const subscriptionId = event.resource.id;

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("org_id")
        .eq("paypal_subscription_id", subscriptionId)
        .single();

      if (sub) {
        await supabase
          .from("subscriptions")
          .update({ plan: "free", status: "cancelled", updated_at: new Date().toISOString() })
          .eq("paypal_subscription_id", subscriptionId);

        await supabase
          .from("organizations")
          .update({ plan: "free", updated_at: new Date().toISOString() })
          .eq("id", sub.org_id);
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.RENEWED": {
      const subscriptionId = event.resource.id;
      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          current_period_end: event.resource.billing_info?.next_billing_time ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("paypal_subscription_id", subscriptionId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function getPlanFromSubscription(resource: { plan_id?: string }): "free" | "pro" | "business" {
  const planId = resource.plan_id;
  if (planId === process.env.PAYPAL_PLAN_ID_BUSINESS) return "business";
  if (planId === process.env.PAYPAL_PLAN_ID_PRO) return "pro";
  return "free";
}
