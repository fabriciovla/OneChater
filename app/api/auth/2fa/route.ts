import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

// GET — whether the signed-in user has 2FA enabled (drives the security panel UI).
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ enabled: false }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpEnabled: true },
  })
  return NextResponse.json({ enabled: user?.totpEnabled === true })
}
