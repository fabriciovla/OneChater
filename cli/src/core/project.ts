import { join, basename } from "node:path"
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { WORKSPACE } from "./tools.js"

// ─── Per-project context, commands and hooks ──────────────────────────────────
// Everything here is read from the WORKSPACE (the dir OneChater was launched in),
// so a project carries its own conventions, shortcuts and automation — the CLI
// equivalent of a repo's AGENTS.md / .onechater folder. All best-effort: a
// missing or malformed file just yields nothing.

// ── Project context (injected into every system prompt) ──
// First of these that exists wins. AGENTS.md is the emerging cross-tool standard;
// the others are OneChater-specific fallbacks.
const CONTEXT_FILES = ["AGENTS.md", "ONECHATER.md", join(".onechater", "CONTEXT.md")]
const CONTEXT_MAX = 16_000

export type ProjectContext = { file: string; content: string }

export function loadProjectContext(): ProjectContext | null {
  for (const rel of CONTEXT_FILES) {
    const abs = join(WORKSPACE, rel)
    try {
      if (!existsSync(abs)) continue
      const raw = readFileSync(abs, "utf8").trim()
      if (!raw) continue
      const content = raw.length > CONTEXT_MAX ? raw.slice(0, CONTEXT_MAX) + "\n…[truncated]" : raw
      return { file: rel, content }
    } catch {
      // unreadable — try the next candidate
    }
  }
  return null
}

// The system-prompt block for the project context. Marked clearly so the model
// treats it as project convention, not user instruction.
export function projectContextBlock(ctx: ProjectContext): string {
  return (
    `PROJECT CONTEXT (from ${ctx.file} in this workspace — follow these conventions ` +
    `for this project):\n${ctx.content}`
  )
}

// ── Custom slash commands (.onechater/commands/*.md) ──
// Each file <name>.md becomes the slash command "/<name>". Its body is a prompt
// template; "$ARGS" (or "$1", "$2"…) is replaced with whatever the user typed
// after the command, then sent as a normal chat turn.
const COMMANDS_DIR = join(WORKSPACE, ".onechater", "commands")

export type ProjectCommand = { name: string; body: string; description: string }

export function loadProjectCommands(): Map<string, ProjectCommand> {
  const out = new Map<string, ProjectCommand>()
  try {
    if (!existsSync(COMMANDS_DIR)) return out
    for (const f of readdirSync(COMMANDS_DIR)) {
      if (!f.toLowerCase().endsWith(".md")) continue
      const name = basename(f, ".md").toLowerCase()
      if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) continue
      try {
        const body = readFileSync(join(COMMANDS_DIR, f), "utf8").trim()
        if (!body) continue
        // Use the first non-empty line as a short description for /help.
        const description = body.split("\n").map((l) => l.trim()).find(Boolean)?.slice(0, 60) ?? ""
        out.set(name, { name, body, description })
      } catch {}
    }
  } catch {}
  return out
}

// Expand a command template with the user's arguments. $ARGS → the whole rest,
// $1..$9 → individual whitespace-separated args (missing ones → empty).
export function expandCommand(cmd: ProjectCommand, argStr: string): string {
  const args = argStr.trim().split(/\s+/).filter(Boolean)
  let body = cmd.body.replace(/\$ARGS\b/g, argStr.trim())
  body = body.replace(/\$([1-9])/g, (_, d) => args[Number(d) - 1] ?? "")
  return body
}

// ── Hooks (.onechater/hooks.json, or config.hooks) ──
// A shell command run automatically after a successful file mutation, e.g. a
// formatter. "$FILE" in the command is replaced with the changed file's path.
export type Hooks = { afterEdit?: string }

const HOOKS_FILE = join(WORKSPACE, ".onechater", "hooks.json")

export function loadProjectHooks(): Hooks {
  try {
    if (!existsSync(HOOKS_FILE)) return {}
    const raw = JSON.parse(readFileSync(HOOKS_FILE, "utf8"))
    const h: Hooks = {}
    if (raw && typeof raw.afterEdit === "string") h.afterEdit = raw.afterEdit
    return h
  } catch {
    return {}
  }
}
