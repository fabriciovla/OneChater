import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { Provider } from "@prisma/client"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const chatSession = await prisma.chatSession.findUnique({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const turns = await prisma.conversationTurn.findMany({
    where: { sessionId: id },
    orderBy: { position: "asc" },
    include: { responses: true, fusedResponse: true },
  })

  return NextResponse.json(turns)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const chatSession = await prisma.chatSession.findUnique({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { turn, position } = await req.json()

  // Skip slash-command pseudo-turns (not real AI responses)
  const isCommand = turn.userMessage?.startsWith("/")

  const providers = Object.keys(turn.responses ?? {}) as Provider[]

  // Neon HTTP adapter no soporta transacciones, así que Prisma falla en nested
  // writes (create con relaciones anidadas). Insertamos en pasos separados,
  // cada uno una sola sentencia SQL.
  const created = await prisma.conversationTurn.create({
    data: {
      id: turn.id,
      sessionId: id,
      userMessage: turn.userMessage,
      isFusion: turn.isFusion ?? false,
      position,
    },
  })

  if (turn.isFusion && turn.fusedResponse) {
    await prisma.fusedResponse.create({
      data: {
        turnId: created.id,
        providers: providers,
        content: turn.fusedResponse.content ?? "",
        error: turn.fusedResponse.error ?? null,
      },
    })
  } else if (!turn.isFusion && !isCommand && providers.length > 0) {
    const rows = providers
      .filter((p) => turn.responses[p]?.content || turn.responses[p]?.error)
      .map((p) => ({
        turnId: created.id,
        provider: p,
        model: turn.responses[p]?.model ?? "",
        content: turn.responses[p]?.content ?? "",
        error: turn.responses[p]?.error ?? null,
      }))
    // create individual (1 statement c/u) en vez de createMany: el adapter
    // Neon HTTP falla con createMany.
    for (const data of rows) {
      await prisma.turnResponse.create({ data })
    }
  }

  // Update session title from first real turn
  if (position === 0 && !isCommand) {
    await prisma.chatSession.update({
      where: { id },
      data: { title: (turn.userMessage as string).slice(0, 50) },
    })
  }

  return NextResponse.json(created)
}
