import { NextRequest, NextResponse } from "next/server"
import { SignJWT, jwtVerify } from "jose"
import { prisma } from "@/lib/db"
import { decryptSecret } from "@/lib/crypto"

// CLI sync endpoint. The OneChater CLI calls this with the short-lived token
// minted by /cli (HS256 over AUTH_SECRET, scope "cli") or with the long-lived
// session token we mint below (scope "cli-session"). We verify it, look up the
// user's plan + connected providers and return the decrypted keys the PLAN
// allows so the CLI can restore them locally — same "keys follow the user" idea
// as /api/providers, but authenticated by Bearer token instead of the session
// cookie. The response also carries the plan and the allowed-provider list so
// the terminal can gate its model menus, plus a fresh session token (sliding
// 30-day window) so the CLI can re-check the plan on every startup without
// sending the user back through the browser.

export const runtime = "nodejs"

// Providers a Free-plan account may use — mirrors FREE_PROVIDERS in
// app/chat/page.tsx (the web's BYOK gating). Pro/team plans get everything.
const FREE_PLAN_PROVIDERS = ["groq", "openrouter", "mistral", "google"]

function bearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? ""
  return h.startsWith("Bearer ") ? h.slice(7).trim() || null : null
}

export async function GET(req: NextRequest) {
  const token = bearer(req)
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 401 })

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
  let userId: string
  let email: string | undefined
  try {
    const { payload } = await jwtVerify(token, secret)
    const scope = payload.scope
    if ((scope !== "cli" && scope !== "cli-session") || typeof payload.sub !== "string") {
      throw new Error("bad token")
    }
    userId = payload.sub
    email = typeof payload.email === "string" ? payload.email : undefined
  } catch {
    return NextResponse.json({ error: "invalid or expired token" }, { status: 401 })
  }

  // The plan lives on the user row — it decides which providers the CLI may use.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, email: true },
  })
  if (!user) return NextResponse.json({ error: "invalid or expired token" }, { status: 401 })

  const plan = user.plan || "free"
  // null = no restriction (paid plans). The CLI treats a missing list as "all".
  const allowedProviders = plan === "free" ? FREE_PLAN_PROVIDERS : null

  const rows = await prisma.userProviderSetting.findMany({
    where: { userId, isEnabled: true },
    select: { provider: true, apiKeyEnc: true, selectedModel: true },
  })

  const providers: { provider: string; apiKey: string; model: string }[] = []
  for (const r of rows) {
    // Never hand a Free account the keys of plan-locked providers — the gate is
    // enforced server-side, not just hidden in the terminal UI.
    if (allowedProviders && !allowedProviders.includes(r.provider)) continue
    const apiKey = decryptSecret(r.apiKeyEnc) ?? ""
    if (!apiKey) continue
    providers.push({ provider: r.provider, apiKey, model: r.selectedModel })
  }

  // Sliding session: every successful sync hands back a fresh 30-day token so an
  // active CLI never bounces the user through the browser again, while a stale
  // install (>30 days unused) has to re-authenticate.
  const sessionToken = await new SignJWT({ scope: "cli-session", email: email ?? user.email ?? undefined })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret)

  return NextResponse.json({
    email: email ?? user.email ?? undefined,
    plan,
    allowedProviders,
    sessionToken,
    providers,
  })
}
