import { join } from "node:path"
import { appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs"
import { CONFIG_DIR } from "./config.js"

// ─── Security layer ─────────────────────────────────────────────────────────────
// Defense in depth around the tool system: a tamper-evident audit log of every
// action, a rate limiter that brakes a runaway (or prompt-injected) agent loop,
// and input validators that reject oversized / control-char payloads before they
// reach the filesystem or the shell. Path confinement itself lives in tools.ts
// (resolveInWorkspace), which also enforces the size/null-byte checks here.

// ─── Audit log ──────────────────────────────────────────────────────────────────
// Every tool the model runs — or is denied/blocked — is appended here as one
// JSON line: WHAT ran, WHEN, and whether the user approved it. Lives next to the
// config at ~/.onechater/audit.log. Read it with the `/audit` command.
export const AUDIT_PATH = join(CONFIG_DIR, "audit.log")

export type Decision = "allowed" | "denied" | "blocked" | "auto"

export type AuditEntry = {
  time: string
  tool: string
  detail: string
  decision: Decision
  status: "ok" | "error"
  error?: string
}

export function audit(entry: Omit<AuditEntry, "time">): void {
  try {
    if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
    appendFileSync(AUDIT_PATH, JSON.stringify({ time: new Date().toISOString(), ...entry }) + "\n", "utf8")
  } catch {
    // Logging must never break a turn — swallow any FS error.
  }
}

// The most recent audit entries (newest last), for the `/audit` command.
export function recentAudit(limit = 20): AuditEntry[] {
  try {
    if (!existsSync(AUDIT_PATH)) return []
    const lines = readFileSync(AUDIT_PATH, "utf8").trim().split("\n").filter(Boolean)
    return lines
      .slice(-limit)
      .map((l) => {
        try {
          return JSON.parse(l) as AuditEntry
        } catch {
          return null
        }
      })
      .filter((e): e is AuditEntry => e !== null)
  } catch {
    return []
  }
}

// ─── Rate limiting ──────────────────────────────────────────────────────────────
// A rolling 60s window caps how many shell commands / mutating actions can fire,
// so a model stuck in a loop (or steered by a malicious prompt) can't hammer the
// machine. Per-process: the budget resets when the REPL restarts.
const WINDOW_MS = 60_000
const LIMITS: Record<"command" | "mutation", number> = { command: 30, mutation: 60 }
const hits: Record<"command" | "mutation", number[]> = { command: [], mutation: [] }

export function rateLimit(kind: "command" | "mutation"): void {
  const now = Date.now()
  const recent = hits[kind].filter((t) => now - t < WINDOW_MS)
  if (recent.length >= LIMITS[kind]) {
    throw new Error(`rate limit: more than ${LIMITS[kind]} ${kind}s in 60s — slow down`)
  }
  recent.push(now)
  hits[kind] = recent
}

// ─── Input validation ───────────────────────────────────────────────────────────
const MAX_PATH = 1024
const MAX_COMMAND = 8 * 1024
const MAX_CONTENT = 5 * 1024 * 1024 // 5 MB per file write

// NUL truncates paths at the syscall boundary; other C0/C1 control characters
// can smuggle terminal escape sequences into a path or our own output. Flag any
// of them by code point (0x00–0x1F and 0x7F–0x9F) — no literal control bytes in
// the source. NUL (0x00) is included, so a separate null-byte check is redundant.
// `allowWs` keeps tab/newline/CR (0x09/0x0A/0x0D) — legal in a multi-line shell
// command (heredocs) but never in a file path.
function hasControlChars(s: string, allowWs = false): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (allowWs && (c === 0x09 || c === 0x0a || c === 0x0d)) continue
    if ((c >= 0 && c <= 0x1f) || (c >= 0x7f && c <= 0x9f)) return true
  }
  return false
}

export function validatePathInput(p: unknown): string {
  if (typeof p !== "string" || !p.trim()) throw new Error("missing path")
  if (p.length > MAX_PATH) throw new Error("path too long")
  if (hasControlChars(p)) throw new Error("path contains control characters")
  return p
}

export function validateContent(c: unknown): string {
  if (typeof c !== "string") throw new Error("'content' must be a string")
  if (c.length > MAX_CONTENT) throw new Error(`content too large (max ${MAX_CONTENT / 1024 / 1024}MB)`)
  return c
}

export function validateCommandInput(cmd: unknown): string {
  if (typeof cmd !== "string" || !cmd.trim()) throw new Error("missing command")
  if (cmd.length > MAX_COMMAND) throw new Error("command too long")
  if (hasControlChars(cmd, true)) throw new Error("command contains control characters")
  return cmd
}
