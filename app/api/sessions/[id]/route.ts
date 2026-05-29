import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { title } = await req.json()

  const chatSession = await prisma.chatSession.update({
    where: { id, userId: session.user.id },
    data: { title },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json({
    ...chatSession,
    createdAt: chatSession.createdAt.getTime(),
    updatedAt: chatSession.updatedAt.getTime(),
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  await prisma.chatSession.delete({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
