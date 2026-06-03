import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { encryptSecret, decryptSecret } from "@/lib/crypto"
import { verifyTotp, generateBackupCodes } from "@/lib/totp"
import { signTwoFactor, TWOFA_COOKIE, TWOFA_TTL_MS } from "@/lib/twofa-cookie"

// POST { code } — confirm enrollment: verify a code against the pending secret,
// flip 2FA on, and return one-time backup codes. Also drops the step-up cookie so
// the user isn't immediately bounced to /login/2fa in their current session.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await req.json().catch(() => ({}))
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecretEnc: true, totpEnabled: true },
  })
  if (user?.totpEnabled) return NextResponse.json({ error: "Already enabled" }, { status: 400 })
  if (!user?.totpSecretEnc) return NextResponse.json({ error: "Start setup first" }, { status: 400 })

  const secret = decryptSecret(user.totpSecretEnc)
  if (!secret || !verifyTotp(secret, String(code ?? ""))) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }

  const { codes, hashes } = generateBackupCodes()
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpEnabled: true, totpBackupCodesEnc: encryptSecret(JSON.stringify(hashes)) },
  })

  const res = NextResponse.json({ ok: true, backupCodes: codes })
  res.cookies.set(TWOFA_COOKIE, await signTwoFactor(session.user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(TWOFA_TTL_MS / 1000),
  })
  return res
}
