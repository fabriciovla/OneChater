import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { encryptSecret, decryptSecret } from "@/lib/crypto"
import type { Provider } from "@prisma/client"

// Per-user provider settings: the BYOK API key (encrypted at rest), whether the
// provider is enabled, and the selected model. This is what makes keys follow a
// user across devices — they're restored on login and never stored in plaintext.

const PROVIDERS: Provider[] = ["openai", "anthropic", "google", "groq", "openrouter", "xai", "mistral", "deepseek"]
const isProvider = (p: unknown): p is Provider => typeof p === "string" && (PROVIDERS as string[]).includes(p)

// A key value we never persist server-side. "demo" is an ephemeral local mode;
// empty means the user cleared the key.
const isStorable = (key: unknown): key is string =>
  typeof key === "string" && key.trim().length > 0 && key !== "demo"

// GET — the signed-in user's provider settings, with keys DECRYPTED for the
// owner (over HTTPS) so the client can restore them into its existing flow.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ providers: {} }, { status: 401 })

  const rows = await prisma.userProviderSetting.findMany({
    where: { userId: session.user.id },
    select: { provider: true, apiKeyEnc: true, isEnabled: true, selectedModel: true },
  })

  const providers: Record<string, { apiKey: string; isEnabled: boolean; selectedModel: string }> = {}
  for (const r of rows) {
    providers[r.provider] = {
      apiKey: decryptSecret(r.apiKeyEnc) ?? "",
      isEnabled: r.isEnabled,
      selectedModel: r.selectedModel,
    }
  }

  return NextResponse.json({ providers })
}

// PUT — upsert a snapshot of provider settings. Body:
// { providers: { [provider]: { apiKey, isEnabled, selectedModel } } }
// Keys are encrypted before storage; "demo"/empty keys are stored as null so
// they never leak across sessions or devices.
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const body = await req.json().catch(() => ({}))
  const incoming = body?.providers
  if (!incoming || typeof incoming !== "object") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const ops = []
  for (const [provider, raw] of Object.entries(incoming as Record<string, unknown>)) {
    if (!isProvider(provider)) continue
    const v = (raw ?? {}) as { apiKey?: unknown; isEnabled?: unknown; selectedModel?: unknown }
    const selectedModel = typeof v.selectedModel === "string" && v.selectedModel ? v.selectedModel : ""
    if (!selectedModel) continue // selectedModel is required by the schema
    const isEnabled = v.isEnabled !== false
    const apiKeyEnc = isStorable(v.apiKey) ? encryptSecret(v.apiKey.trim()) : null

    ops.push(
      prisma.userProviderSetting.upsert({
        where: { userId_provider: { userId, provider } },
        create: { userId, provider, apiKeyEnc, isEnabled, selectedModel },
        update: { apiKeyEnc, isEnabled, selectedModel },
      })
    )
  }

  if (ops.length) await prisma.$transaction(ops)
  return NextResponse.json({ ok: true })
}
