import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

// DELETE — forget a single fact. Scoped to the owner.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.memory.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}

// PATCH — edit a fact's text (the "perfil editable" promise).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { content } = await req.json().catch(() => ({}))
  const clean = String(content ?? "").trim().slice(0, 400)
  if (clean.length < 3) return NextResponse.json({ error: "Contenido inválido" }, { status: 400 })

  await prisma.memory.updateMany({
    where: { id, userId: session.user.id },
    data: { content: clean },
  })
  return NextResponse.json({ ok: true })
}
