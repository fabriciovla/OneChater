import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDodo } from "@/lib/dodo";

// Dodo Payments webhooks (Standard Webhooks spec). The SDK's unwrap() verifies
// the HMAC signature with DODO_WEBHOOK_SECRET and returns the parsed event.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = getDodo().webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": req.headers.get("webhook-id") ?? "",
        "webhook-signature": req.headers.get("webhook-signature") ?? "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      },
    }) as unknown as { type?: string; data?: Record<string, unknown> };
  } catch (err) {
    console.error("Dodo webhook: bad signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const type = event.type ?? "";
  const data = (event.data ?? {}) as Record<string, unknown>;
  const metadata = (data.metadata ?? {}) as Record<string, string>;
  const customer = (data.customer ?? {}) as { customer_id?: string; email?: string };

  // Map the event to an account: metadata.user_id first, then email, then the
  // subscription id we stored on a previous event.
  const subscriptionId = data.subscription_id as string | undefined;
  const userId = metadata.user_id;
  const email = customer.email;

  async function findUserId(): Promise<string | null> {
    if (userId) return userId;
    if (email) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (u) return u.id;
    }
    if (subscriptionId) {
      const u = await prisma.user.findFirst({ where: { dodoSubscriptionId: subscriptionId }, select: { id: true } });
      if (u) return u.id;
    }
    return null;
  }

  try {
    const id = await findUserId();
    if (!id) return NextResponse.json({ ok: true }); // nothing to attach to

    const status = (data.status as string | undefined) ?? undefined;
    const nextBilling = data.next_billing_date as string | undefined;

    if (type === "payment.succeeded") {
      if (customer.customer_id) {
        await prisma.user.update({ where: { id }, data: { dodoCustomerId: customer.customer_id } });
      }
    } else if (type === "subscription.active" || type === "subscription.renewed") {
      await prisma.user.update({
        where: { id },
        data: {
          plan: "pro",
          dodoSubscriptionId: subscriptionId,
          dodoSubscriptionStatus: status ?? "active",
          dodoCurrentPeriodEnd: nextBilling ? new Date(nextBilling) : null,
          ...(customer.customer_id ? { dodoCustomerId: customer.customer_id } : {}),
        },
      });
    } else if (
      type === "subscription.cancelled" ||
      type === "subscription.expired" ||
      type === "subscription.on_hold" ||
      type === "subscription.failed"
    ) {
      await prisma.user.update({
        where: { id },
        data: { plan: "free", dodoSubscriptionStatus: status ?? type.split(".")[1] },
      });
    }
  } catch (err) {
    console.error("Dodo webhook DB error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
