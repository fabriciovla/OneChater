import { join } from "node:path"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { CONFIG_DIR } from "./config.js"

// The memory profile is a single free-form prompt injected as the system
// message for every provider — mirrors the web app's `memoryProfile`, so any
// model instantly knows the user. Stored as plain markdown the dev can edit.

const MEMORY_PATH = join(CONFIG_DIR, "memory.md")

const TEMPLATE = `# OneChater memory

## Work context
-

## Personal context
-

## Top of mind
-
`

export function loadMemory(): string {
  if (!existsSync(MEMORY_PATH)) return ""
  try {
    return readFileSync(MEMORY_PATH, "utf8")
  } catch {
    return ""
  }
}

export function saveMemory(profile: string) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(MEMORY_PATH, profile, "utf8")
}

const MEMORY_MAX = 8000

// Append a fact to the persistent memory profile (used by the `remember` tool).
// Free-form: one bullet per note, clamped so it can't grow unbounded.
export function appendMemory(note: string) {
  const clean = note.trim()
  if (!clean) return
  const cur = loadMemory()
  // Don't store the same fact twice (models re-call remember on recall).
  if (cur.toLowerCase().includes(clean.toLowerCase())) return
  const next = (cur.trimEnd() ? cur.trimEnd() + "\n" : "") + "- " + clean + "\n"
  saveMemory(next.slice(0, MEMORY_MAX))
}

// Seed an editable template if the file doesn't exist yet; returns the path so
// callers can open it in $EDITOR.
export function ensureMemoryFile(): string {
  if (!existsSync(MEMORY_PATH)) saveMemory(TEMPLATE)
  return MEMORY_PATH
}

// The system prompt fragment that carries memory into a conversation. Empty if
// the user hasn't written anything yet.
export function memorySystemPrompt(): string {
  const profile = loadMemory().trim()
  if (!profile) return ""
  return `The following is persistent context about the user. Use it to personalize every answer.\n\n${profile}`
}

export { MEMORY_PATH }
