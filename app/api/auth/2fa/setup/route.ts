import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { encryptSecret } from "@/lib/crypto"
import { generateTotpSecret, otpauthURL } from "@/lib/totp"
import QRCode from "qrcode"

// POST — begin enrollment: generate a TOTP secret, stash it (NOT enabled yet),
// and return the QR + manual key so the user can add it to their authenticator.
// The secret only becomes active once /enable confirms a code.
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, totpEnabled: true },
  })
  if (user?.totpEnabled) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 })
  }

  const secret = generateTotpSecret()
  const label = user?.email || session.user.email || "account"
  const url = otpauthURL(secret, label)
  const qr = await QRCode.toDataURL(url)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecretEnc: encryptSecret(secret), totpEnabled: false },
  })

  return NextResponse.json({ secret, otpauthURL: url, qr })
}
