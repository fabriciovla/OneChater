import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createProCheckout } from "@/lib/dodo";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = await createProCheckout(session.user.email, session.user.id);
    return NextResponse.json({ url });
  } catch (err) {
    // Surface the real Dodo error (status + body) so failures are debuggable.
    const e = err as { status?: number; message?: string; error?: unknown };
    const detail =
      typeof e?.error === "object" ? JSON.stringify(e.error) : e?.message ?? String(err);
    console.error("Checkout error:", e?.status, detail, err);
    return NextResponse.json(
      { error: "Failed to create checkout", status: e?.status, detail },
      { status: 500 },
    );
  }
}
