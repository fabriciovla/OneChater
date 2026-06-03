import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { decryptSecret } from "@/lib/crypto"
import { verifyTotp } from "@/lib/totp"
import { consumeBackupCode } from "@/lib/twofa-server"
import { signTwoFactor, TWOFA_COOKIE, TWOFA_TTL_MS } from "@/lib/twofa-cookie"
import { lockRemainingSec, recordFailure, clearLimit } from "@/lib/ratelimit"

const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

// POST { code } — step-up at login: the user already passed the primary factor
// but still needs their authenticator code (or a backup code). On success we set
// the signed step-up cookie that the middleware checks. Brute-force protected.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const lockKey = `2fa_verify:${userId}`
  if ((await lockRemainingSec(lockKey)) > 0) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

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

  if (!ok) {
    await recordFailure(lockKey, MAX_ATTEMPTS, LOCK_MS)
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }
  await clearLimit(lockKey)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(TWOFA_COOKIE, await signTwoFactor(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(TWOFA_TTL_MS / 1000),
  })
  return res
}
