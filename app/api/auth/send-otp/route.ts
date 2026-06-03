import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendOTPEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const normalized = email.toLowerCase().trim()
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
