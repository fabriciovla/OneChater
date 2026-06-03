import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, folderId: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(
    sessions.map((s) => ({
      ...s,
      createdAt: s.createdAt.getTime(),
      updatedAt: s.updatedAt.getTime(),
    }))
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title } = await req.json()

  const chatSession = await prisma.chatSession.create({
    data: { userId: session.user.id, title: title ?? "New conversation" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json({
    ...chatSession,
    createdAt: chatSession.createdAt.getTime(),
    updatedAt: chatSession.updatedAt.getTime(),
  })
}
