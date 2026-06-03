import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { decryptSecret } from "@/lib/crypto"
import { verifyTotp } from "@/lib/totp"
import { consumeBackupCode } from "@/lib/twofa-server"
import { TWOFA_COOKIE } from "@/lib/twofa-cookie"

// POST { code } — turn 2FA off. Requires a valid current code (or backup code) so
// a hijacked but un-stepped-up session can't silently strip protection.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { code } = await req.json().catch(() => ({}))
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecretEnc: true, totpBackupCodesEnc: true, totpEnabled: true },
  })
  if (!user?.totpEnabled || !user.totpSecretEnc) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 })
  }

  const secret = decryptSecret(user.totpSecretEnc)
  let ok = !!secret && verifyTotp(secret, String(code ?? ""))
  if (!ok) ok = await consumeBackupCode(userId, user.totpBackupCodesEnc, String(code ?? ""))
  if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 400 })

  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: false, totpSecretEnc: null, totpBackupCodesEnc: null },
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(TWOFA_COOKIE, "", { path: "/", maxAge: 0 }) // clear step-up cookie
  return res
}
