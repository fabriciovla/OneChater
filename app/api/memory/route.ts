import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

// Memory is a single free-form prompt profile per user (sections like "Work
// context", "Personal context", "Top of mind"). Injected into every provider's
// system prompt so any model instantly knows the user.
//
// Per-plan ceiling on the profile length (characters). Free gets a solid base;
// paid tiers are effectively unlimited behind a high runaway guard. Lifting a
// user's `plan` (billing) raises the cap automatically.
const PLAN_PROFILE_CAP: Record<string, number> = { free: 4000, pro: 40000, team: 40000 }
const DEFAULT_CAP = PLAN_PROFILE_CAP.free

// GET — the signed-in user's memory profile.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ profile: "" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { memoryProfile: true },
  })

  return NextResponse.json({ profile: user?.memoryProfile ?? "" })
}

// PUT — replace the whole profile. Used both by manual edits in the UI and by
// the background updater after a turn. Clamped to the user's plan cap.
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const body = await req.json().catch(() => ({}))
  const raw = typeof body.profile === "string" ? body.profile : ""

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
  const cap = PLAN_PROFILE_CAP[user?.plan ?? "free"] ?? DEFAULT_CAP
  const profile = raw.trim().slice(0, cap)

  await prisma.user.update({ where: { id: userId }, data: { memoryProfile: profile } })

  return NextResponse.json({ profile })
}
