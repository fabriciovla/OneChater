import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  // Build a partial update: rename (title) and/or move to a folder (folderId).
  // `folderId: null` unfiles the chat. Title-only edits leave folderId untouched.
  const data: { title?: string; folderId?: string | null } = {}
  if (typeof body.title === "string") data.title = body.title
  if ("folderId" in body) {
    if (body.folderId === null) data.folderId = null
    else if (typeof body.folderId === "string") {
      // Verify the target folder belongs to the user before filing into it.
      const folder = await prisma.folder.findFirst({
        where: { id: body.folderId, userId: session.user.id },
        select: { id: true },
      })
      if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 })
      data.folderId = folder.id
    }
  }

  const result = await prisma.chatSession.updateMany({
    where: { id, userId: session.user.id },
    data,
  })
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const chatSession = await prisma.chatSession.findUnique({
    where: { id },
    select: { id: true, title: true, folderId: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(
    chatSession && {
      ...chatSession,
      createdAt: chatSession.createdAt.getTime(),
      updatedAt: chatSession.updatedAt.getTime(),
    }
  )
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  await prisma.chatSession.delete({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
