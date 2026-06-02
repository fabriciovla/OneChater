import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { name, color } = await req.json().catch(() => ({}))

  const data: { name?: string; color?: string | null } = {}
  if (typeof name === "string" && name.trim()) data.name = name.trim().slice(0, 60)
  if (color === null || typeof color === "string") data.color = color ? String(color).slice(0, 16) : null

  // Scope the update to the owner so users can only touch their own folders.
  const result = await prisma.folder.updateMany({
    where: { id, userId: session.user.id },
    data,
  })
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const folder = await prisma.folder.findUnique({
    where: { id },
    select: { id: true, name: true, color: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json(
    folder && { ...folder, createdAt: folder.createdAt.getTime(), updatedAt: folder.updatedAt.getTime() }
  )
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Chats inside are unfiled (folderId → null via SetNull), never deleted.
  const result = await prisma.folder.deleteMany({ where: { id, userId: session.user.id } })
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
