import { resolve, relative, isAbsolute, dirname } from "node:path"
import { mkdir, writeFile, readFile, rm, readdir, stat } from "node:fs/promises"
import { existsSync } from "node:fs"
import { exec } from "node:child_process"
import { promisify } from "node:util"
import { appendMemory } from "./memory.js"

const execAsync = promisify(exec)

// ─── Secure tool system ───────────────────────────────────────────────────────
// Models never touch the machine directly. They REQUEST a tool; the app
// validates it, confines file access to the workspace, blocks dangerous
// commands, asks the user to confirm mutating actions, then runs it and returns
// the result. Same trust model as Claude Code / Cursor / Aider.

// The workspace is the directory OneChater was started in. Every file path must
// resolve to somewhere inside it — nothing above or outside is reachable.
export const WORKSPACE = process.cwd()

// Resolve a user/AI supplied path against the workspace and refuse anything that
// escapes it (../, absolute paths pointing elsewhere, etc.).
export function resolveInWorkspace(p: string): string {
  if (typeof p !== "string" || !p.trim()) throw new Error("missing path")
  const abs = isAbsolute(p) ? resolve(p) : resolve(WORKSPACE, p)
  const rel = relative(WORKSPACE, abs)
  if (rel === ".." || rel.startsWith(".." + "/") || rel.startsWith(".." + "\\") || isAbsolute(rel)) {
    throw new Error(`path is outside the workspace: ${p}`)
  }
  return abs
}

// Commands that must never run, regardless of confirmation. Defense in depth on
// top of the per-command user confirmation.
const DANGEROUS: RegExp[] = [
  /\brm\s+(-[a-z]*\s+)*-?[rf]+[a-z]*\s+([\/~]|\*)/i, // rm -rf / , rm -rf ~ , rm -rf *
  /\brmdir\s+\/s/i,
  /\bdel\s+\/[sfq]/i,
  /\bformat\b\s+[a-z]:/i,
  /\bmkfs\b/i,
  /\bdd\b[^|]*\bof=\/dev\//i,
  /\b(shutdown|reboot|halt|poweroff)\b/i,
  /:\s*\(\s*\)\s*\{.*\}\s*;/, // fork bomb :(){ :|:& };:
  />\s*\/dev\/(sd|nvme|disk)/i,
  /\bchmod\s+-R\s+0?777\s+\//i,
  /\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh)\b/i, // curl … | sh
]

export function isDangerousCommand(cmd: string): boolean {
  return DANGEROUS.some((re) => re.test(cmd))
}

export type ToolCall = { name: string; args: Record<string, unknown> }

export type ToolSpec = {
  name: string
  // Mutating tools (write/delete/run) need user confirmation; reads don't.
  mutates: boolean
  // One-line summary for the "OneChater wants to:" permission panel.
  describe: (args: Record<string, unknown>) => string
  run: (args: Record<string, unknown>) => Promise<string>
}

const str = (v: unknown, name: string): string => {
  if (typeof v !== "string") throw new Error(`'${name}' must be a string`)
  return v
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
      await mkdir(dirname(p), { recursive: true })
      await writeFile(p, str(a.content ?? "", "content"), "utf8")
      return `Wrote ${a.path} (${String(a.content ?? "").length} bytes)`
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
      await mkdir(dirname(p), { recursive: true })
      await writeFile(p, str(a.content ?? "", "content"), "utf8")
      return `Updated ${a.path} (${String(a.content ?? "").length} bytes)`
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
    run: async (a) => {
      const cmd = str(a.command, "command")
      if (isDangerousCommand(cmd)) throw new Error("blocked: dangerous command")
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: WORKSPACE,
        timeout: 120_000,
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true,
      })
      const out = (stdout || "").trimEnd()
      const err = (stderr || "").trimEnd()
      return [out, err ? `[stderr]\n${err}` : ""].filter(Boolean).join("\n") || "(no output)"
    },
  },
}

export const TOOL_NAMES = Object.keys(TOOLS)
export const getTool = (name: string): ToolSpec | undefined => TOOLS[name]

// Remove ```tool fenced blocks, leaving the model's visible prose.
export function stripToolBlocks(text: string): string {
  return text.replace(/```tool\s*\n[\s\S]*?```/g, "").trim()
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
    try {
      const parsed = JSON.parse(body)
      const list = Array.isArray(parsed) ? parsed : [parsed]
      for (const c of list) {
        if (c && typeof c.name === "string") {
          calls.push({ name: c.name, args: (c.args ?? {}) as Record<string, unknown> })
        }
      }
    } catch {
      // Ignore malformed tool blocks — the model gets a result error and retries.
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
- write_file(path, content)
- delete_file(path)
- list_directory(path)
- run_command(command)
- remember(note)  ← save/update a fact about the user in long-term memory

Rules:
- If you need a tool, request it in your FIRST message, before writing any
  answer. Do not answer and then request a tool.
- Request only the tools you need; you can request several at once.
- After a tool block, send nothing else and wait for "Tool results".
- When the task is finished, reply normally (no tool block) with a SHORT summary.
- Never claim you cannot access files — use the tools.
- MEMORY: call remember(note) ONLY when the user gives you NEW information about
  themselves to keep (their name, preferences, what they're working on). Do NOT
  call remember when simply recalling or answering about something already known.
  NEVER create or write files to store memory — that's what remember is for.`
}
