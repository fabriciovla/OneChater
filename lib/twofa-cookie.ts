// Step-up cookie proving the user cleared 2FA on this device. Signed with HMAC
// over AUTH_SECRET so it can't be forged. Uses Web Crypto (crypto.subtle) so the
// SAME module verifies in the Edge middleware and signs in Node route handlers.

const COOKIE_NAME = "oc_2fa"
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days — "trust this device"

export const TWOFA_COOKIE = COOKIE_NAME
export const TWOFA_TTL_MS = TTL_MS

function keyData(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "")
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", keyData() as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data) as BufferSource)
  return b64url(new Uint8Array(sig))
}

function b64url(bytes: Uint8Array): string {
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// Build the cookie value: "<userId>.<exp>.<hmac(userId.exp)>".
export async function signTwoFactor(userId: string): Promise<string> {
  const payload = `${userId}.${Date.now() + TTL_MS}`
  return `${payload}.${await hmac(payload)}`
}

// True only if the token is well-formed, unexpired, bound to THIS user, and the
// signature matches.
export async function verifyTwoFactor(token: string | undefined, userId: string): Promise<boolean> {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [uid, expStr, sig] = parts
  if (uid !== userId) return false
  const exp = Number(expStr)
  if (!exp || Date.now() > exp) return false
  const expected = await hmac(`${uid}.${expStr}`)
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}
