import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/db"

// Paddle v2 sends:  paddle-signature: ts=<unix>;h1=<hex_hmac_sha256>
// HMAC payload:     "<ts>:<raw_body>"
function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret || !header) return false

  const parts: Record<string, string> = {}
  for (const part of header.split(";")) {
    const [k, ...rest] = part.split("=")
    parts[k] = rest.join("=")
  }

  const ts = parts["ts"]
  const h1 = parts["h1"]
  if (!ts || !h1) return false

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex")

  // Constant-time compare to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(h1, "hex"), Buffer.from(expected, "hex"))
  } catch {
    return false
  }
}

// Paddle v2 event shapes we care about
type PaddleEvent = {
  event_type: string
  data: {
    status?: string
    customer?: { email?: string }
    custom_data?: { userId?: string }
    id?: string // subscription id
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get("paddle-signature")

  if (!verifySignature(rawBody, sig)) {
    console.error("[paddle webhook] invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: PaddleEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 })
  }

  const { event_type, data } = event
  const email = data?.customer?.email
  const userId = data?.custom_data?.userId

  // Look up user by userId first, fall back to email
  const whereClause = userId
    ? { id: userId }
    : email
    ? { email }
    : null

  if (!whereClause) {
    // Can't identify user — still return 200 so Paddle stops retrying
    console.warn("[paddle webhook] no user identifier in event", event_type)
    return NextResponse.json({ ok: true })
  }

  try {
    if (["subscription.created", "subscription.updated"].includes(event_type)) {
      const isActive = data?.status === "active" || data?.status === "trialing"
      if (isActive) {
        await prisma.user.update({
          where: whereClause,
          data: { plan: "pro" },
        })
        console.log("[paddle webhook] upgraded to pro:", whereClause)
      }
    }

    if (["subscription.canceled", "subscription.paused"].includes(event_type)) {
      await prisma.user.update({
        where: whereClause,
        data: { plan: "free" },
      })
      console.log("[paddle webhook] downgraded to free:", whereClause)
    }
  } catch (err) {
    // Log but return 200 — Paddle will retry on 5xx, which could cause loops
    console.error("[paddle webhook] db error:", err)
  }

  return NextResponse.json({ ok: true })
}
