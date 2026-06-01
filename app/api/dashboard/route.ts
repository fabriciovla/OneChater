import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

// Rough blended price (USD per 1M tokens, input+output averaged) per provider.
// Used ONLY to estimate spend — BYOK means we never see the real invoice, so
// this is a size-based approximation, never billed.
const PRICE_PER_MTOK: Record<string, number> = {
  openai: 5, anthropic: 6, google: 1.5, groq: 0.6,
  openrouter: 0.5, xai: 5, mistral: 2, deepseek: 0.5,
}
const CHARS_PER_TOKEN = 4

// GET — aggregated usage for the dashboard. Pro/Team only; free users get a
// { locked: true } payload so the page can render the upsell.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
  const plan = user?.plan ?? "free"
  if (plan === "free") return NextResponse.json({ locked: true, plan })

  // Responses grouped by provider (+ output chars for the spend estimate).
  const byProvider = await prisma.$queryRaw<
    { provider: string; responses: number; out_chars: number }[]
  >`
    SELECT tr.provider::text AS provider,
           count(*)::int AS responses,
           COALESCE(sum(length(tr.content)), 0)::int AS out_chars
    FROM turn_responses tr
    JOIN conversation_turns ct ON ct.id = tr.turn_id
    JOIN chat_sessions cs ON cs.id = ct.session_id
    WHERE cs.user_id = ${userId} AND tr.error IS NULL
    GROUP BY tr.provider`

  // Turn-level totals (messages, fusion count, input chars).
  const totalsRows = await prisma.$queryRaw<
    { turns: number; fusion_turns: number; in_chars: number }[]
  >`
    SELECT count(*)::int AS turns,
           COALESCE(count(*) FILTER (WHERE ct.is_fusion), 0)::int AS fusion_turns,
           COALESCE(sum(length(ct.user_message)), 0)::int AS in_chars
    FROM conversation_turns ct
    JOIN chat_sessions cs ON cs.id = ct.session_id
    WHERE cs.user_id = ${userId}`

  // Activity for the last 30 days, bucketed per day.
  const dailyRows = await prisma.$queryRaw<{ day: Date; turns: number }[]>`
    SELECT date_trunc('day', ct.created_at) AS day, count(*)::int AS turns
    FROM conversation_turns ct
    JOIN chat_sessions cs ON cs.id = ct.session_id
    WHERE cs.user_id = ${userId} AND ct.created_at > now() - interval '30 days'
    GROUP BY day
    ORDER BY day`

  const memRows = await prisma.$queryRaw<{ category: string | null; n: number }[]>`
    SELECT category, count(*)::int AS n FROM memories WHERE user_id = ${userId} GROUP BY category`

  const [sessionsCount, memoryCount] = await Promise.all([
    prisma.chatSession.count({ where: { userId } }),
    prisma.memory.count({ where: { userId } }),
  ])

  const totals = totalsRows[0] ?? { turns: 0, fusion_turns: 0, in_chars: 0 }
  const totalResponses = byProvider.reduce((s, r) => s + r.responses, 0)
  const inTokTotal = totals.in_chars / CHARS_PER_TOKEN

  // Per-provider spend estimate: its own output tokens + a share of the input
  // tokens (prompts are shared across providers within a fusion turn).
  const providers = byProvider
    .map((r) => {
      const outTok = r.out_chars / CHARS_PER_TOKEN
      const inTok = totalResponses > 0 ? inTokTotal * (r.responses / totalResponses) : 0
      const tokens = Math.round(outTok + inTok)
      const cost = (tokens / 1_000_000) * (PRICE_PER_MTOK[r.provider] ?? 1)
      return { provider: r.provider, responses: r.responses, tokens, cost }
    })
    .sort((a, b) => b.cost - a.cost)

  const estimatedSpend = providers.reduce((s, p) => s + p.cost, 0)

  return NextResponse.json({
    locked: false,
    plan,
    totals: {
      messages: totals.turns,
      sessions: sessionsCount,
      responses: totalResponses,
      fusionTurns: totals.fusion_turns,
      memories: memoryCount,
      estimatedSpend,
    },
    providers,
    daily: dailyRows.map((d) => ({ day: new Date(d.day).getTime(), turns: d.turns })),
    memoryByCategory: memRows.map((m) => ({ category: m.category ?? "other", n: m.n })),
  })
}
