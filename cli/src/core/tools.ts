import { resolve, relative, isAbsolute, dirname, sep } from "node:path"
import { mkdir, writeFile, readFile, rm, readdir, stat } from "node:fs/promises"
import { existsSync, realpathSync } from "node:fs"
import { spawn } from "node:child_process"
import { appendMemory, loadMemory } from "./memory.js"
import { rateLimit, validateCommandInput, validateContent, validatePathInput } from "./security.js"

// ─── Secure tool system ───────────────────────────────────────────────────────
// Models never touch the machine directly. They REQUEST a tool; the app
// validates it, confines file access to the workspace, blocks dangerous
// commands, asks the user to confirm mutating actions, then runs it and returns
// the result. Same trust model as Claude Code / Cursor / Aider.

// The workspace is the directory OneChater was started in. Every file path must
// resolve to somewhere inside it — nothing above or outside is reachable.
export const WORKSPACE = process.cwd()

// True when `child` is the workspace itself or sits inside it (lexically).
function within(root: string, child: string): boolean {
  const rel = relative(root, child)
  return rel === "" || (rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel))
}

// Resolve a user/AI supplied path against the workspace and refuse anything that
// escapes it: validates the raw input (size, control chars), blocks ../ and
// absolute paths pointing elsewhere, AND resolves symlinks on the deepest
// existing ancestor so a symlink can't tunnel out of the workspace.
export function resolveInWorkspace(p: string): string {
  validatePathInput(p)
  const abs = isAbsolute(p) ? resolve(p) : resolve(WORKSPACE, p)
  if (!within(WORKSPACE, abs)) throw new Error(`path is outside the workspace: ${p}`)

  // Symlink defense: realpath the nearest existing ancestor (the target itself
  // may not exist yet on a create) and confirm it still lands inside the real
  // workspace. Catches a symlink inside the workspace that points elsewhere.
  let probe = abs
  while (!existsSync(probe)) {
    const parent = dirname(probe)
    if (parent === probe) break
    probe = parent
  }
  try {
    if (!within(realpathSync(WORKSPACE), realpathSync(probe))) {
      throw new Error(`path escapes the workspace via a symlink: ${p}`)
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("symlink")) throw err
    // realpath failed for a benign reason (race, permissions) — the lexical
    // check above already passed, so fall through with the resolved path.
  }
  return abs
}

// Commands that must never run, regardless of confirmation. Defense in depth on
// top of the per-command user confirmation.
const DANGEROUS: RegExp[] = [
  /\brm\s+(-[a-z]*\s+)*-?[rf]+[a-z]*\s+([\/~]|\*)/i, // rm -rf / , rm -rf ~ , rm -rf *
  /\brmdir\s+\/s/i,
  /\b(del|erase)\s+\/[sfq]/i,
  /\brd\s+\/s/i, // rd /s  (cmd recursive dir delete)
  /\bformat\b\s+[a-z]:/i,
  /\bmkfs\b/i,
  /\bdd\b[^|]*\bof=\/dev\//i,
  /\b(shutdown|reboot|halt|poweroff)\b/i,
  /\bstop-computer\b/i, // PowerShell shutdown
  /:\s*\(\s*\)\s*\{.*\}\s*;/, // fork bomb :(){ :|:& };:
  />\s*\/dev\/(sd|nvme|disk)/i,
  /\bchmod\s+-R\s+0?777\s+\//i,
  /\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh)\b/i, // curl … | sh
  // ── Windows / PowerShell destructive equivalents (this CLI runs on Windows) ──
  /\bremove-item\b[^|]*\s-(re?c?u?r?s?e?|force|r|f)\b/i, // Remove-Item -Recurse / -Force
  /\bremove-item\b[^|]*\b(env:|[a-z]:\\?|\\\\)/i, // Remove-Item against a drive root / UNC
  /\b(clear-disk|format-volume|clear-content|initialize-disk|reset-computer)\b/i,
  /\b(irm|iwr|invoke-webrequest|invoke-restmethod)\b[^|]*\|\s*(iex|invoke-expression)\b/i, // irm … | iex
  /\biex\b\s*\(/i, // iex( … )  — arbitrary remote code exec
]

export function isDangerousCommand(cmd: string): boolean {
  return DANGEROUS.some((re) => re.test(cmd))
}

export type ToolCall = { name: string; args: Record<string, unknown> }

// A live-output sink: a tool (run_command) calls it with each chunk of stdout/
// stderr as it arrives, so the REPL can stream the process output to the screen
// instead of only showing it once the command finishes.
export type OutputSink = (chunk: string) => void

export type ToolSpec = {
  name: string
  // Mutating tools (write/delete/run) need user confirmation; reads don't.
  mutates: boolean
  // One-line summary for the "OneChater wants to:" permission panel.
  describe: (args: Record<string, unknown>) => string
  // `emit`, when given, receives output chunks live (used by run_command).
  run: (args: Record<string, unknown>, emit?: OutputSink) => Promise<string>
}

const str = (v: unknown, name: string): string => {
  if (typeof v !== "string") throw new Error(`'${name}' must be a string`)
  return v
}

// ─── Helpers for edit / search / git ──────────────────────────────────────────

// Apply a precise edit: replace the single, unique occurrence of `oldStr` with
// `newStr`. Refuses if `oldStr` is missing or ambiguous (appears more than once)
// so an edit never silently lands in the wrong place. Pure — reused by the
// edit_file tool AND the approval panel's diff preview.
export function applyEdit(content: string, oldStr: string, newStr: string): string {
  if (oldStr === "") throw new Error("'old' must not be empty")
  const idx = content.indexOf(oldStr)
  if (idx === -1) throw new Error("'old' text not found in the file")
  if (content.indexOf(oldStr, idx + oldStr.length) !== -1) {
    throw new Error("'old' text is not unique — include more surrounding context")
  }
  return content.slice(0, idx) + newStr + content.slice(idx + oldStr.length)
}

// Directories never worth walking for find_files / grep — noise and huge.
const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next", ".turbo", ".cache", "coverage", ".vercel",
])
const WALK_MAX_FILES = 8000

// Every file under the workspace (relative paths), skipping IGNORE_DIRS. Bounded
// so a pathological tree can't hang the tool.
async function walkFiles(): Promise<string[]> {
  const out: string[] = []
  async function rec(abs: string) {
    if (out.length >= WALK_MAX_FILES) return
    let entries
    try {
      entries = await readdir(abs, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (out.length >= WALK_MAX_FILES) return
      const full = resolve(abs, e.name)
      if (e.isDirectory()) {
        if (!IGNORE_DIRS.has(e.name)) await rec(full)
      } else if (e.isFile()) {
        out.push(relative(WORKSPACE, full).replace(/\\/g, "/"))
      }
    }
  }
  await rec(WORKSPACE)
  return out
}

// Anchored regex from a glob: * → any, ? → one char. Path separators aren't
// special (so "*.ts" matches at any depth when tested against the basename).
function globToRegex(pattern: string): RegExp {
  let re = "^"
  for (const ch of pattern.replace(/\\/g, "/")) {
    if (ch === "*") re += ".*"
    else if (ch === "?") re += "."
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&")
  }
  return new RegExp(re + "$", "i")
}

// A NUL byte in the first few KB means the file is binary — skip it in grep.
function looksBinary(s: string): boolean {
  for (let i = 0; i < s.length && i < 4096; i++) if (s.charCodeAt(i) === 0) return true
  return false
}

// Run git with fixed args (NO shell, so a branch/message can't inject a command)
// in the workspace. Captures stdout+stderr; reports a clean error if git is absent.
function gitRun(args: string[]): Promise<string> {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn("git", args, { cwd: WORKSPACE, windowsHide: true })
    const MAX = 1024 * 1024
    let out = ""
    let size = 0
    const take = (b: Buffer) => {
      const s = b.toString()
      if (size < MAX) {
        out += s
        size += s.length
      }
    }
    child.stdout?.on("data", take)
    child.stderr?.on("data", take)
    child.on("error", (err) =>
      rejectRun(
        err.message.includes("ENOENT") ? new Error("git is not installed or not on PATH") : err
      )
    )
    child.on("close", (code) => {
      const text = out.trimEnd() || "(no output)"
      resolveRun(code === 0 ? text : `${text}\n[git exit ${code}]`)
    })
  })
}

export const TOOLS: Record<string, ToolSpec> = {
  create_folder: {
    name: "create_folder",
    mutates: true,
    describe: (a) => `Create folder: ${a.path}`,
    run: async (a) => {
      const p = resolveInWorkspace(str(a.path, "path"))
      await mkdir(p, { recursive: true })
      return `Created folder ${a.path}`
    },
  },
  create_file: {
    name: "create_file",
    mutates: true,
    describe: (a) => `Create file: ${a.path}`,
    run: async (a) => {
      const p = resolveInWorkspace(str(a.path, "path"))
      const content = validateContent(a.content ?? "")
      await mkdir(dirname(p), { recursive: true })
      await writeFile(p, content, "utf8")
      return `Wrote ${a.path} (${content.length} bytes)`
    },
  },
  read_file: {
    name: "read_file",
    mutates: false,
    describe: (a) => `Read file: ${a.path}`,
    run: async (a) => {
      const p = resolveInWorkspace(str(a.path, "path"))
      const body = await readFile(p, "utf8")
      return body.length > 20000 ? body.slice(0, 20000) + "\n…[truncated]" : body
    },
  },
  write_file: {
    name: "write_file",
    mutates: true,
    describe: (a) => `Modify file: ${a.path}`,
    run: async (a) => {
      const p = resolveInWorkspace(str(a.path, "path"))
      const content = validateContent(a.content ?? "")
      await mkdir(dirname(p), { recursive: true })
      await writeFile(p, content, "utf8")
      return `Updated ${a.path} (${content.length} bytes)`
    },
  },
  edit_file: {
    name: "edit_file",
    mutates: true,
    describe: (a) => `Edit file: ${a.path}`,
    // Precise edit: swap a unique snippet instead of rewriting the whole file.
    run: async (a) => {
      const p = resolveInWorkspace(str(a.path, "path"))
      if (!existsSync(p)) throw new Error(`${a.path} does not exist — use create_file`)
      const before = await readFile(p, "utf8")
      const after = validateContent(applyEdit(before, str(a.old, "old"), str(a.new, "new")))
      await writeFile(p, after, "utf8")
      return `Edited ${a.path} (${after.length} bytes)`
    },
  },
  delete_file: {
    name: "delete_file",
    mutates: true,
    describe: (a) => `Delete: ${a.path}`,
    run: async (a) => {
      const p = resolveInWorkspace(str(a.path, "path"))
      if (!existsSync(p)) return `${a.path} does not exist`
      await rm(p, { recursive: true, force: true })
      return `Deleted ${a.path}`
    },
  },
  list_directory: {
    name: "list_directory",
    mutates: false,
    describe: (a) => `List directory: ${a.path ?? "."}`,
    run: async (a) => {
      const p = resolveInWorkspace(str((a.path as string) ?? ".", "path"))
      const entries = await readdir(p, { withFileTypes: true })
      if (!entries.length) return "(empty)"
      const lines = await Promise.all(
        entries.map(async (e) => {
          if (e.isDirectory()) return `${e.name}/`
          try {
            const s = await stat(resolve(p, e.name))
            return `${e.name}  ${s.size}b`
          } catch {
            return e.name
          }
        })
      )
      return lines.sort().join("\n")
    },
  },
  find_files: {
    name: "find_files",
    mutates: false,
    describe: (a) => `Find files: ${a.pattern}`,
    run: async (a) => {
      const pattern = str(a.pattern, "pattern")
      const re = globToRegex(pattern)
      const all = await walkFiles()
      const hits = all.filter((f) => re.test(f) || re.test(f.split("/").pop() ?? f))
      if (!hits.length) return `no files match ${pattern}`
      const CAP = 200
      const shown = hits.slice(0, CAP).join("\n")
      return hits.length > CAP ? `${shown}\n…(${hits.length - CAP} more)` : shown
    },
  },
  grep: {
    name: "grep",
    mutates: false,
    describe: (a) => `Search: ${a.pattern}`,
    run: async (a) => {
      const pattern = str(a.pattern, "pattern")
      let re: RegExp
      try {
        re = new RegExp(pattern, "i")
      } catch {
        throw new Error(`invalid regex: ${pattern}`)
      }
      const CAP = 200
      const MAX_FILE = 1024 * 1024 // skip files > 1MB
      const out: string[] = []
      for (const f of await walkFiles()) {
        if (out.length >= CAP) break
        const abs = resolve(WORKSPACE, f)
        let s
        try {
          s = await stat(abs)
        } catch {
          continue
        }
        if (s.size > MAX_FILE) continue
        let body: string
        try {
          body = await readFile(abs, "utf8")
        } catch {
          continue
        }
        if (looksBinary(body)) continue // crude binary skip
        const lines = body.split("\n")
        for (let i = 0; i < lines.length && out.length < CAP; i++) {
          if (re.test(lines[i])) out.push(`${f}:${i + 1}: ${lines[i].trim().slice(0, 200)}`)
        }
      }
      if (!out.length) return `no matches for ${pattern}`
      return out.length >= CAP ? `${out.join("\n")}\n…(capped at ${CAP})` : out.join("\n")
    },
  },
  git_status: {
    name: "git_status",
    mutates: false,
    describe: () => "git status",
    run: () => gitRun(["status", "--short", "--branch"]),
  },
  git_diff: {
    name: "git_diff",
    mutates: false,
    describe: (a) => (a.path ? `git diff ${a.path}` : "git diff"),
    run: (a) => gitRun(a.path ? ["diff", "--", str(a.path, "path")] : ["diff"]),
  },
  git_commit: {
    name: "git_commit",
    mutates: true,
    describe: (a) => `git commit -m "${a.message}"`,
    run: (a) => gitRun(["commit", "-m", str(a.message, "message")]),
  },
  git_checkout: {
    name: "git_checkout",
    mutates: true,
    describe: (a) => `git checkout ${a.branch}`,
    run: (a) => gitRun(["checkout", str(a.branch, "branch")]),
  },
  load_memory: {
    name: "load_memory",
    mutates: false,
    describe: () => "Load memory",
    run: async () => loadMemory().trim() || "(memory is empty)",
  },
  remember: {
    name: "remember",
    // Saving a fact the user asked to remember is benign — no confirmation.
    mutates: false,
    describe: (a) => `Remember: ${a.note}`,
    run: async (a) => {
      const note = str(a.note, "note")
      appendMemory(note)
      return `Saved to memory: ${note}`
    },
  },
  run_command: {
    name: "run_command",
    mutates: true,
    describe: (a) => `Run command: ${a.command}`,
    // Streams output live via `emit` while it runs, and also returns the full
    // captured text (capped) so the model sees the result. Uses spawn instead of
    // exec so progress (git clone, npm install…) shows as it happens.
    run: (a, emit) => {
      const cmd = validateCommandInput(a.command)
      if (isDangerousCommand(cmd)) throw new Error("blocked: dangerous command")
      rateLimit("command") // brake a runaway / injected loop before it spawns
      return new Promise<string>((resolveRun, rejectRun) => {
        const child = spawn(cmd, { cwd: WORKSPACE, shell: true, windowsHide: true })
        const MAX = 4 * 1024 * 1024 // cap what we keep for the model
        let captured = ""
        let size = 0
        const take = (buf: Buffer) => {
          const s = buf.toString()
          if (size < MAX) {
            captured += s
            size += s.length
          }
          emit?.(s) // live to the screen, uncapped
        }
        child.stdout?.on("data", take)
        child.stderr?.on("data", take)
        const timer = setTimeout(() => {
          child.kill()
          rejectRun(new Error("command timed out (120s)"))
        }, 120_000)
        child.on("error", (err) => {
          clearTimeout(timer)
          rejectRun(err)
        })
        child.on("close", (code) => {
          clearTimeout(timer)
          const out = captured.trimEnd() || "(no output)"
          resolveRun(code === 0 ? out : `${out}\n[exit ${code}]`)
        })
      })
    },
  },
}

export const TOOL_NAMES = Object.keys(TOOLS)
export const getTool = (name: string): ToolSpec | undefined => TOOLS[name]

// Remove ```tool fenced blocks, leaving the model's visible prose.
export function stripToolBlocks(text: string): string {
  return text.replace(/```tool\s*\n[\s\S]*?```/g, "").trim()
}

// Index just past the balanced JSON value (object/array) that starts at `start`,
// respecting quoted strings and escapes. -1 if it never closes.
function endOfJsonValue(s: string, start: number): number {
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === "\\") esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === "{" || c === "[") depth++
    else if (c === "}" || c === "]") {
      depth--
      if (depth === 0) return i + 1
    }
  }
  return -1
}

// Pull EVERY top-level JSON value (object or array) out of a string and return
// the ones that parse. Handles a model that emits several values back-to-back —
// "[{…}],[{…}]" or "{…}\n{…}" — instead of one clean array.
function scanJsonValues(s: string): any[] {
  const values: any[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c !== "{" && c !== "[") {
      i++
      continue
    }
    const end = endOfJsonValue(s, i)
    if (end === -1) break
    try {
      values.push(JSON.parse(s.slice(i, end)))
    } catch {}
    i = end
  }
  return values
}

// Best-effort JSON parse of a tool-block body. Models (especially smaller open
// ones) often emit JSON that's ALMOST valid: trailing commas, // comments, smart
// quotes, a single object instead of an array, or — the common 8B failure —
// several arrays/objects glued together ("[{…}],[{…}]"). We try the body as-is,
// then lightly repaired, then fall back to scanning out each JSON value and
// flattening them, so one formatting slip doesn't drop the whole action.
function parseToolBody(body: string): any[] | null {
  const repaired = body
    .replace(/^\s*\/\/.*$/gm, "") // strip // line comments
    .replace(/,(\s*[}\]])/g, "$1") // drop trailing commas
    .replace(/[“”]/g, '"') // smart double quotes
    .replace(/[‘’]/g, "'") // smart single quotes
  const sources = [body, repaired]

  // 1. Fast path: the whole body is one valid JSON value.
  for (const src of sources) {
    try {
      const parsed = JSON.parse(src)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {}
  }

  // 2. Robust path: scan back-to-back values and flatten arrays into one list.
  for (const src of sources) {
    const values = scanJsonValues(src)
    if (values.length) {
      const flat = values.flatMap((v) => (Array.isArray(v) ? v : [v]))
      if (flat.length) return flat
    }
  }
  return null
}

// Parse tool requests out of a model reply. Models emit one or more fenced
// ```tool blocks, each holding a JSON object or array of {name, args}.
export function parseToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = []
  const fence = /```tool\s*\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = fence.exec(text)) !== null) {
    const body = m[1].trim()
    if (!body) continue
    const list = parseToolBody(body)
    if (!list) continue // truly unparseable — the safety net surfaces it
    for (const c of list) {
      if (c && typeof c.name === "string") {
        calls.push({ name: c.name, args: (c.args ?? {}) as Record<string, unknown> })
      }
    }
  }
  return calls
}

// A streaming filter that hides ```tool fenced blocks from the visible output
// (their raw JSON — including whole file contents — would be huge noise), while
// the caller still keeps the raw text for parseToolCalls. Line-buffered: it
// emits each completed line unless it's inside a tool block. The first hidden
// block emits a small italic "requesting tools…" note in its place.
export function createToolBlockHider() {
  let inside = false
  let line = ""

  function write(s: string): string {
    let out = ""
    for (const ch of s) {
      if (ch === "\n") {
        const t = line.trim()
        if (!inside && /^```tool\b/.test(t)) {
          inside = true
        } else if (inside && t === "```") {
          inside = false
        } else if (!inside) {
          out += line + "\n"
        }
        line = ""
      } else {
        line += ch
      }
    }
    return out
  }

  function flush(): string {
    if (inside) {
      line = ""
      return ""
    }
    const rest = line
    line = ""
    return rest
  }

  return { write, flush }
}

// The system-prompt fragment that teaches a model the tool protocol.
export function toolsSystemPrompt(): string {
  return `You can operate on the user's workspace through TOOLS. You never run anything yourself — you REQUEST a tool, the app asks the user to approve it, runs it, and returns the result to you.

WORKSPACE (all paths are relative to it and must stay inside it): ${WORKSPACE}

To use tools, output a fenced code block tagged \`tool\` containing a JSON array of calls, then STOP and wait for the results — do not write the final answer in the same message:
\`\`\`tool
[{"name":"create_file","args":{"path":"app/page.tsx","content":"..."}}]
\`\`\`

Available tools:
- create_folder(path)
- create_file(path, content)
- read_file(path)
- write_file(path, content)            ← overwrites the WHOLE file
- edit_file(path, old, new)            ← replace one exact, unique snippet (preferred for small changes)
- delete_file(path)
- list_directory(path)
- find_files(pattern)                  ← glob, e.g. "**/*.ts" or "page.tsx"
- grep(pattern)                        ← regex search across the workspace; returns path:line: text
- run_command(command)
- git_status()
- git_diff(path?)
- git_commit(message)                  ← commits the already-STAGED changes (run "git add" first via run_command)
- git_checkout(branch)
- load_memory()                        ← read your persistent memory profile
- remember(note)                       ← save/update a fact about the user in long-term memory

Rules:
- If you need a tool, request it in your FIRST message, before writing any
  answer. Do not answer and then request a tool.
- Request only the tools you need; you can request several at once. Put ALL calls
  in ONE JSON array — [{...},{...}] — never several arrays separated by commas.
- To change part of an existing file, PREFER edit_file (give enough surrounding
  context in "old" that it matches exactly once). Use write_file only for a full
  rewrite or a brand-new file.
- To locate code, use find_files (by name/glob) or grep (by content) instead of
  guessing paths.
- After a tool block, send nothing else and wait for "Tool results".
- When the task is finished, reply normally (no tool block) with a SHORT summary.
- Never claim you cannot access files — use the tools.
- MEMORY: call remember(note) ONLY when the user gives you NEW information about
  themselves to keep (their name, preferences, what they're working on). Do NOT
  call remember when simply recalling or answering about something already known.
  NEVER create or write files to store memory — that's what remember is for.`
}
