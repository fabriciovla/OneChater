import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const folders = await prisma.folder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, color: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(
    folders.map((f) => ({
      ...f,
      createdAt: f.createdAt.getTime(),
      updatedAt: f.updatedAt.getTime(),
    }))
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, color } = await req.json().catch(() => ({}))

  const folder = await prisma.folder.create({
    data: {
      userId: session.user.id,
      name: (typeof name === "string" && name.trim()) ? name.trim().slice(0, 60) : "New folder",
      color: typeof color === "string" ? color.slice(0, 16) : null,
    },
    select: { id: true, name: true, color: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json({
    ...folder,
    createdAt: folder.createdAt.getTime(),
    updatedAt: folder.updatedAt.getTime(),
  })
}
