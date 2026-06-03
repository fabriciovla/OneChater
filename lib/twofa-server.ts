import { prisma } from "@/lib/db"
import { encryptSecret, decryptSecret } from "@/lib/crypto"
import { hashBackupCode } from "@/lib/totp"

// Try to consume a one-time backup code. Returns true and removes the code from
// the stored set if it matches; backup codes are single-use by design.
export async function consumeBackupCode(
  userId: string,
  enc: string | null,
  code: string
): Promise<boolean> {
  if (!enc || !code) return false
  const dec = decryptSecret(enc)
  if (!dec) return false
  let hashes: string[]
  try {
    hashes = JSON.parse(dec)
  } catch {
    return false
  }
  const idx = hashes.indexOf(hashBackupCode(code))
  if (idx === -1) return false
  hashes.splice(idx, 1)
  await prisma.user.update({
    where: { id: userId },
    data: { totpBackupCodesEnc: encryptSecret(JSON.stringify(hashes)) },
  })
  return true
}
