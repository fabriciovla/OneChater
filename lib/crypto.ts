import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

// AES-256-GCM encryption for user secrets at rest (API keys). The plaintext key
// never lands in the DB — only `iv:authTag:ciphertext` (all base64). The server
// secret PROVIDER_ENC_KEY is the only thing that can decrypt it, so a DB leak
// alone exposes nothing usable.

const ALGO = "aes-256-gcm"

// Resolve and validate the 32-byte master key once. Throwing here (instead of
// silently using a weak key) fails the request loudly if the env is misconfigured.
function masterKey(): Buffer {
  const raw = process.env.PROVIDER_ENC_KEY
  if (!raw) throw new Error("[crypto] PROVIDER_ENC_KEY is not set")
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) {
    throw new Error(`[crypto] PROVIDER_ENC_KEY must decode to 32 bytes, got ${key.length}`)
  }
  return key
}

// Encrypt a plaintext string → "iv:authTag:ciphertext" (base64 parts).
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12) // 96-bit nonce, recommended for GCM
  const cipher = createCipheriv(ALGO, masterKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":")
}

// Decrypt a value produced by encryptSecret. Returns null if the payload is
// malformed or tampered with (auth tag mismatch) rather than throwing, so a
// single corrupt row never breaks the whole settings load.
export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null
  const parts = payload.split(":")
  if (parts.length !== 3) return null
  try {
    const [ivB64, tagB64, dataB64] = parts
    const decipher = createDecipheriv(ALGO, masterKey(), Buffer.from(ivB64, "base64"))
    decipher.setAuthTag(Buffer.from(tagB64, "base64"))
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()])
    return dec.toString("utf8")
  } catch {
    return null
  }
}
