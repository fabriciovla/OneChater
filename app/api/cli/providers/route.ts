import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/db"
import { decryptSecret } from "@/lib/crypto"

// CLI sync endpoint. The OneChater CLI calls this with the short-lived token
// minted by /cli (HS256 over AUTH_SECRET, scope "cli"). We verify it, look up
// the user's connected providers and return their decrypted keys so the CLI can
// restore them locally — same "keys follow the user" idea as /api/providers,
// but authenticated by Bearer token instead of the session cookie.

export const runtime = "nodejs"

function bearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? ""
  return h.startsWith("Bearer ") ? h.slice(7).trim() || null : null
}

export async function GET(req: NextRequest) {
  const token = bearer(req)
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 401 })

  let userId: string
  let email: string | undefined
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    const { payload } = await jwtVerify(token, secret)
    if (payload.scope !== "cli" || typeof payload.sub !== "string") throw new Error("bad token")
    userId = payload.sub
    email = typeof payload.email === "string" ? payload.email : undefined
  } catch {
    return NextResponse.json({ error: "invalid or expired token" }, { status: 401 })
  }

  const rows = await prisma.userProviderSetting.findMany({
    where: { userId, isEnabled: true },
    select: { provider: true, apiKeyEnc: true, selectedModel: true },
  })

  const providers: { provider: string; apiKey: string; model: string }[] = []
  for (const r of rows) {
    const apiKey = decryptSecret(r.apiKeyEnc) ?? ""
    if (!apiKey) continue
    providers.push({ provider: r.provider, apiKey, model: r.selectedModel })
  }

  return NextResponse.json({ email, providers })
}
