import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Provider } from "@prisma/client"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const turns = await prisma.conversationTurn.findMany({
    where: { sessionId: id },
    orderBy: { position: "asc" },
    include: { responses: true, fusedResponse: true },
  })

  return NextResponse.json(turns)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { turn, position } = await req.json()

  // Skip slash-command pseudo-turns (not real AI responses)
  const isCommand = turn.userMessage?.startsWith("/")

  const providers = Object.keys(turn.responses ?? {}) as Provider[]

  const created = await prisma.conversationTurn.create({
    data: {
      id: turn.id,
      sessionId: id,
      userMessage: turn.userMessage,
      isFusion: turn.isFusion ?? false,
      position,
      ...(turn.isFusion && turn.fusedResponse
        ? {
            fusedResponse: {
              create: {
                providers: providers,
                content: turn.fusedResponse.content ?? "",
                error: turn.fusedResponse.error ?? null,
              },
            },
          }
        : {}),
      ...(!turn.isFusion && !isCommand && providers.length > 0
        ? {
            responses: {
              create: providers
                .filter((p) => turn.responses[p]?.content || turn.responses[p]?.error)
                .map((p) => ({
                  provider: p,
                  model: turn.responses[p]?.model ?? "",
                  content: turn.responses[p]?.content ?? "",
                  error: turn.responses[p]?.error ?? null,
                })),
            },
          }
        : {}),
    },
  })

  // Update session title from first real turn
  if (position === 0 && !isCommand) {
    await prisma.chatSession.update({
      where: { id },
      data: { title: (turn.userMessage as string).slice(0, 50) },
    })
  }

  return NextResponse.json(created)
}
