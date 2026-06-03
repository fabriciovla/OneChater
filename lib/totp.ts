import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto"

// RFC 6238 TOTP + RFC 4226 HOTP, dependency-free. Server-side only (Node crypto).
// Used to enroll and verify authenticator-app codes. The compatible defaults
// (SHA1 / 6 digits / 30s) are what Google Authenticator, Authy, 1Password expect.

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
const PERIOD = 30
const DIGITS = 6

export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes))
}

export function otpauthURL(secret: string, label: string, issuer = "OneChater"): string {
  const enc = encodeURIComponent
  return `otpauth://totp/${enc(issuer)}:${enc(label)}?secret=${secret}&issuer=${enc(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD}`
}

// Accepts a code valid for the current 30s step ± `window` steps (clock drift).
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const t = (token || "").replace(/\D/g, "")
  if (t.length !== DIGITS) return false
  const counter = Math.floor(Date.now() / 1000 / PERIOD)
  for (let i = -window; i <= window; i++) {
    if (constTimeEqual(hotp(secret, counter + i), t)) return true
  }
  return false
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  const hmac = createHmac("sha1", key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3]
  return (bin % 10 ** DIGITS).toString().padStart(DIGITS, "0")
}

// ─── Backup codes ──────────────────────────────────────────────────────────────
// Generated once at enrollment, shown to the user, and stored ONLY as hashes.

export function generateBackupCodes(n = 10): { codes: string[]; hashes: string[] } {
  const codes: string[] = []
  for (let i = 0; i < n; i++) {
    const raw = randomBytes(5).toString("hex") // 10 hex chars
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`)
  }
  return { codes, hashes: codes.map(hashBackupCode) }
}

export function hashBackupCode(code: string): string {
  return createHash("sha256").update(code.replace(/[\s-]/g, "").toLowerCase()).digest("hex")
}

// ─── base32 (RFC 4648) ──────────────────────────────────────────────────────────

function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = ""
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i]
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/=+$/, "").replace(/\s/g, "")
  let bits = 0, value = 0
  const out: number[] = []
  for (let i = 0; i < clean.length; i++) {
    const idx = B32.indexOf(clean[i])
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

function constTimeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a), bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}
