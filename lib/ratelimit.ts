import { prisma } from "@/lib/db"

// Small DB-backed rate limiter for auth endpoints (no Redis dependency). Auth
// calls are low-frequency, so a row read/write per attempt is fine. Each limiter
// is identified by an opaque `key` so the same table serves send-throttling,
// per-IP throttling and verify-lockout independently.

export type HitResult = { ok: boolean; retryAfterSec: number }

// Fixed-window counter. Allows up to `limit` hits per `windowMs`; the window
// resets lazily on the first hit after it elapses.
export async function rateLimitHit(key: string, limit: number, windowMs: number): Promise<HitResult> {
  const now = Date.now()
  const row = await prisma.rateLimit.findUnique({ where: { key } })

  if (!row || now - row.windowStart.getTime() > windowMs) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: new Date(now), lockedUntil: null },
      update: { count: 1, windowStart: new Date(now), lockedUntil: null },
    })
    return { ok: true, retryAfterSec: 0 }
  }

  if (row.count >= limit) {
    const retry = Math.ceil((row.windowStart.getTime() + windowMs - now) / 1000)
    return { ok: false, retryAfterSec: Math.max(retry, 1) }
  }

  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } })
  return { ok: true, retryAfterSec: 0 }
}

// Seconds remaining on an active lockout, or 0 if not locked. Clears the row
// once a lock has expired so the counter starts fresh.
export async function lockRemainingSec(key: string): Promise<number> {
  const row = await prisma.rateLimit.findUnique({ where: { key } })
  if (!row?.lockedUntil) return 0
  const remaining = row.lockedUntil.getTime() - Date.now()
  if (remaining <= 0) {
    await clearLimit(key)
    return 0
  }
  return Math.ceil(remaining / 1000)
}

// Record one failed attempt; lock the key for `lockMs` once `maxFailures` is hit.
export async function recordFailure(key: string, maxFailures: number, lockMs: number): Promise<void> {
  const now = Date.now()
  const row = await prisma.rateLimit.findUnique({ where: { key } })
  const count = (row?.count ?? 0) + 1
  const lockedUntil = count >= maxFailures ? new Date(now + lockMs) : row?.lockedUntil ?? null
  await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count, windowStart: new Date(now), lockedUntil },
    update: { count, lockedUntil },
  })
}

// Reset a limiter (e.g. after a successful verification).
export async function clearLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } })
}
