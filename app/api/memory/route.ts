import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

// Per-plan ceiling on stored facts. Free gets a taste (50); paid tiers are
// effectively unlimited ("Memoria ilimitada" on pricing) behind a high runaway
// guard. Lifting a user's `plan` (billing) raises the cap automatically.
const PLAN_FACT_CAP: Record<string, number> = { free: 50, pro: 2000, team: 2000 }
const DEFAULT_CAP = PLAN_FACT_CAP.free
const MAX_CONTENT_LEN = 400    // a fact should be a sentence, not an essay

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

// GET — all memories for the signed-in user (newest first).
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const memories = await prisma.memory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, content: true, category: true, createdAt: true },
  })

  return NextResponse.json(
    memories.map((m) => ({ ...m, createdAt: m.createdAt.getTime() }))
  )
}

// POST — add one or many facts. Accepts { content, category } or
// { facts: [{ content, category }] }. Dedupes against what the user
// already knows (case-insensitive) and within the batch. Returns the
// rows actually created. Neon HTTP has no createMany, so we insert one
// statement at a time (same pattern as the turns route).
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const body = await req.json().catch(() => ({}))
  const incoming: { content?: string; category?: string }[] = Array.isArray(body.facts)
    ? body.facts
    : body.content
    ? [{ content: body.content, category: body.category }]
    : []

  // Clean + clamp
  const cleaned = incoming
    .map((f) => ({
      content: String(f.content ?? "").trim().slice(0, MAX_CONTENT_LEN),
      category: f.category ? String(f.category).trim().slice(0, 40) : null,
    }))
    .filter((f) => f.content.length > 2)

  if (cleaned.length === 0) return NextResponse.json([])

  // Dedupe vs existing + within batch. Fetch the plan alongside so the cap
  // reflects the user's tier.
  const [user, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    prisma.memory.findMany({ where: { userId }, select: { content: true } }),
  ])
  const cap = PLAN_FACT_CAP[user?.plan ?? "free"] ?? DEFAULT_CAP
  const seen = new Set(existing.map((m) => norm(m.content)))
  const total = existing.length

  const toCreate: { content: string; category: string | null }[] = []
  for (const f of cleaned) {
    const key = norm(f.content)
    if (seen.has(key)) continue
    seen.add(key)
    toCreate.push(f)
  }
  if (total + toCreate.length > cap) {
    toCreate.length = Math.max(0, cap - total)
  }

  const created = []
  for (const f of toCreate) {
    const m = await prisma.memory.create({
      data: { userId, content: f.content, category: f.category },
      select: { id: true, content: true, category: true, createdAt: true },
    })
    created.push({ ...m, createdAt: m.createdAt.getTime() })
  }

  return NextResponse.json(created)
}
