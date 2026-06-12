import { join } from "node:path"
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  unlinkSync,
  chmodSync,
} from "node:fs"
import { CONFIG_DIR } from "./config.js"
import type { Turn } from "./fusion.js"

// ─── Saved chats ─────────────────────────────────────────────────────────────
// Local-first chat persistence: one JSON file per named chat under
// ~/.onechater/chats/. The full turn history lives on disk; on resume only a
// capped tail is fed back to the models (a 200-turn chat must not blow the
// context window). Same style as memory.ts/config.ts: sync fs, silent
// failures, files private to the user.

export const CHATS_DIR = join(CONFIG_DIR, "chats")

export type ChatMeta = { name: string; slug: string; turnCount: number; updatedAt: string }

export type SavedChat = {
  version: 1
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  turns: Turn[]
  // Cached AI summary of the oldest turns (the part capTurns drops from the
  // live context on resume) and how many turns it covers — so a 200-turn chat
  // is "remembered" whole without re-summarizing on every resume.
  summary?: string
  summaryUpto?: number
}

// How much of a resumed chat is sent back to the models. Everything stays on
// disk; this only bounds the live context.
export const RESUME_MAX_TURNS = 30
export const RESUME_MAX_CHARS = 60_000

// The tail of `turns` that fits the resume budget (count AND total chars).
export function capTurns(turns: Turn[]): Turn[] {
  const out: Turn[] = []
  let chars = 0
  for (let i = turns.length - 1; i >= 0; i--) {
    const t = turns[i]
    const size = t.user.length + t.assistant.length
    if (out.length >= RESUME_MAX_TURNS || chars + size > RESUME_MAX_CHARS) break
    out.unshift(t)
    chars += size
  }
  // Always resume at least the last turn, even if it alone busts the char cap.
  if (!out.length && turns.length) out.push(turns[turns.length - 1])
  return out
}

// Filesystem-safe slug from a user-given name: lowercase, diacritics stripped,
// anything non-alphanumeric collapsed to "-". Never produces a reserved or
// invalid Windows filename (no / \ : * ? " < > |, no empty string).
export function slugify(name: string): string {
  const s = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // drop combining accents (café → cafe)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "")
  return s || "chat"
}

const chatPath = (slug: string) => join(CHATS_DIR, slug + ".json")

// A slug that doesn't collide with an existing file: name, name-2, name-3…
export function uniqueSlug(name: string): string {
  const base = slugify(name)
  if (!existsSync(chatPath(base))) return base
  for (let i = 2; ; i++) {
    const cand = `${base}-${i}`
    if (!existsSync(chatPath(cand))) return cand
  }
}

export function newChat(name: string, turns: Turn[]): SavedChat {
  const now = new Date().toISOString()
  return { version: 1, name: name.trim(), slug: uniqueSlug(name), createdAt: now, updatedAt: now, turns: [...turns] }
}

// Atomic write (tmp + rename) so a kill mid-write can't truncate the chat.
// Private to the user, like the config (keys travel in neither, but turns are
// still personal data).
export function saveChat(chat: SavedChat): void {
  try {
    if (!existsSync(CHATS_DIR)) mkdirSync(CHATS_DIR, { recursive: true })
    const p = chatPath(chat.slug)
    writeFileSync(p + ".tmp", JSON.stringify(chat, null, 2), "utf8")
    renameSync(p + ".tmp", p)
    try {
      if (process.platform !== "win32") chmodSync(p, 0o600)
    } catch {}
  } catch {
    // Persistence must never break a turn.
  }
}

export function loadChat(slug: string): SavedChat | null {
  try {
    const raw = readFileSync(chatPath(slug), "utf8")
    const c = JSON.parse(raw) as SavedChat
    if (!c || !Array.isArray(c.turns)) return null
    c.turns = c.turns.filter(
      (t) => t && typeof t.user === "string" && typeof t.assistant === "string"
    )
    return c
  } catch {
    return null
  }
}

export function deleteChat(slug: string): boolean {
  try {
    unlinkSync(chatPath(slug))
    return true
  } catch {
    return false
  }
}

// Rename: new display name + move the file to the new slug. Returns the
// updated chat, or null if it couldn't be loaded.
export function renameChat(slug: string, newName: string): SavedChat | null {
  const chat = loadChat(slug)
  if (!chat) return null
  const name = newName.trim()
  if (!name) return chat
  chat.name = name
  const next = slugify(name)
  if (next !== chat.slug) {
    deleteChat(chat.slug)
    chat.slug = existsSync(chatPath(next)) ? uniqueSlug(name) : next
  }
  chat.updatedAt = new Date().toISOString()
  saveChat(chat)
  return chat
}

// All saved chats, most recently updated first.
export function listChats(): ChatMeta[] {
  try {
    if (!existsSync(CHATS_DIR)) return []
    const metas: ChatMeta[] = []
    for (const f of readdirSync(CHATS_DIR)) {
      if (!f.endsWith(".json")) continue
      const c = loadChat(f.slice(0, -5))
      if (c) metas.push({ name: c.name, slug: c.slug, turnCount: c.turns.length, updatedAt: c.updatedAt })
    }
    return metas.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  } catch {
    return []
  }
}

// "2h ago"-style timestamp for the chat picker.
export function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return ""
  const min = Math.floor(ms / 60_000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? "yesterday" : `${d}d ago`
}
