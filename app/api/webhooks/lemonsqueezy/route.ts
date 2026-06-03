import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

type LSEvent =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_expired"
  | "subscription_resumed"
  | "order_created";

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName: LSEvent = event.meta?.event_name;
  const userId: string | undefined = event.meta?.custom_data?.user_id;
  const attrs = event.data?.attributes;

  if (!userId) {
    return NextResponse.json({ ok: true }); // no user to update
  }

  try {
    if (eventName === "order_created") {
      const lsCustomerId = String(attrs.customer_id);
      await prisma.user.update({
        where: { id: userId },
        data: { lsCustomerId },
      });
    }

    if (
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_resumed"
    ) {
      const status = attrs.status as string; // active | on_trial | cancelled | etc.
      const plan = status === "active" || status === "on_trial" ? "pro" : "free";
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan,
          lsSubscriptionId: String(event.data.id),
          lsSubscriptionStatus: status,
          lsCurrentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
        },
      });
    }

    if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: "free",
          lsSubscriptionStatus: attrs.status,
        },
      });
    }
  } catch (err) {
    console.error("Webhook DB error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
