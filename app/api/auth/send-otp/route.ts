import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendOTPEmail } from "@/lib/email"
import { rateLimitHit } from "@/lib/ratelimit"

const WINDOW_MS = 15 * 60 * 1000 // 15 min
const MAX_PER_EMAIL = 3 // codes per email per window
const MAX_PER_IP = 10 // codes per IP per window (shared NATs need headroom)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const normalized = email.toLowerCase().trim()
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"

    // Throttle by email AND by IP to stop email-bombing / quota abuse.
    const [byEmail, byIp] = await Promise.all([
      rateLimitHit(`otp_send:${normalized}`, MAX_PER_EMAIL, WINDOW_MS),
      rateLimitHit(`otp_send_ip:${ip}`, MAX_PER_IP, WINDOW_MS),
    ])
    const limited = !byEmail.ok ? byEmail : !byIp.ok ? byIp : null
    if (limited) {
      return NextResponse.json(
        { error: "Too many codes requested. Try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      )
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    // Remove any previous OTPs for this email then create new one
    await prisma.verificationToken.deleteMany({ where: { identifier: normalized } })
    await prisma.verificationToken.create({
      data: { identifier: normalized, token: code, expires },
    })

    await sendOTPEmail({ to: normalized, code })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("send-otp error:", err)
    return NextResponse.json({ error: "Failed to send the code" }, { status: 500 })
  }
}
