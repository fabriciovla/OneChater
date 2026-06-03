import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createProCheckout } from "@/lib/lemonsqueezy";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = await createProCheckout(session.user.email, session.user.id);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
