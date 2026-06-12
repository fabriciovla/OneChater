import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { join } from "node:path"
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs"
import { CONFIG_DIR } from "./config.js"

// ─── MCP (Model Context Protocol) client ──────────────────────────────────────
// Connects local MCP servers (the stdio transport — a child process speaking
// JSON-RPC 2.0 over newline-delimited stdin/stdout) and exposes their tools to
// the model exactly like the built-in workspace tools. Config format mirrors
// Claude Code / Cursor (`mcpServers`) so an existing config pastes straight in.
//
// Same trust model as the rest of the CLI: the user configures these servers on
// their own machine, the calls still flow through the approval panel before
// anything mutating runs.

export const MCP_CONFIG_PATH = join(CONFIG_DIR, "mcp.json")

export type McpServerConfig = {
  // ── stdio (local child process) ──
  command?: string
  args?: string[]
  env?: Record<string, string>
  // ── remote (streamable HTTP / SSE) ──
  // When `url` (or type "http"/"sse") is set, the server is reached over HTTP
  // instead of a local process — for hosted MCP servers (GitHub, Linear, …).
  type?: "stdio" | "http" | "sse"
  url?: string
  // Extra HTTP headers, e.g. { "Authorization": "Bearer <token>" } for auth.
  headers?: Record<string, string>
  // Skip this server on startup without deleting its config.
  disabled?: boolean
}

export type McpConfig = { mcpServers: Record<string, McpServerConfig> }

// A tool advertised by an MCP server, as returned by tools/list.
export type McpToolInfo = {
  name: string
  description?: string
  inputSchema?: unknown
  // tools/list annotations — readOnlyHint lets a read-only tool skip the
  // approval prompt (everything else is treated as mutating, i.e. confirmed).
  readOnly?: boolean
}

export function loadMcpConfig(): McpConfig {
  try {
    if (!existsSync(MCP_CONFIG_PATH)) return { mcpServers: {} }
    const raw = JSON.parse(readFileSync(MCP_CONFIG_PATH, "utf8"))
    const servers = raw && typeof raw === "object" ? raw.mcpServers : null
    return { mcpServers: servers && typeof servers === "object" ? servers : {} }
  } catch {
    return { mcpServers: {} }
  }
}

export function saveMcpConfig(cfg: McpConfig): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(MCP_CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8")
  try {
    if (process.platform !== "win32") chmodSync(MCP_CONFIG_PATH, 0o600)
  } catch {}
}

// Write a starter mcp.json with a commented-out example, so `/mcp` can point the
// user at a real file to edit instead of an empty one. Returns the path.
export function ensureMcpConfigFile(): string {
  if (!existsSync(MCP_CONFIG_PATH)) {
    saveMcpConfig({
      mcpServers: {
        // Example (disabled): a LOCAL filesystem server scoped to the current
        // dir. Flip "disabled" to false (or add your own) and relaunch.
        example: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
          disabled: true,
        },
        // Example (disabled): a REMOTE server over HTTP, with a bearer token.
        "example-remote": {
          type: "http",
          url: "https://your-mcp-server.example.com/mcp",
          headers: { Authorization: "Bearer YOUR_TOKEN" },
          disabled: true,
        },
      },
    })
  }
  return MCP_CONFIG_PATH
}

// Quote one argument for a Windows shell command line: wrap in double quotes
// when it contains whitespace or shell metacharacters, escaping inner quotes.
function quoteArg(a: string): string {
  return /[\s"&|<>^()]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a
}

type Pending = { resolve: (v: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }

// One live connection to a stdio MCP server. Spawns the process, performs the
// JSON-RPC handshake, lists its tools, and forwards tools/call requests.
export class McpClient {
  private child: ChildProcessWithoutNullStreams | null = null
  private buf = ""
  private nextId = 1
  private pending = new Map<number, Pending>()
  private closed = false
  // Remote (HTTP) transport state — unused for stdio servers.
  private http = false
  private url = ""
  private sessionId = ""
  tools: McpToolInfo[] = []

  constructor(
    public readonly name: string,
    private readonly cfg: McpServerConfig
  ) {}

  // Connect (spawn a child OR open the HTTP transport), then run the JSON-RPC
  // handshake + tools/list. Throws on a failed launch or handshake so the caller
  // can report which server didn't come up (and keep the others).
  async connect(timeoutMs = 20_000): Promise<void> {
    const type = this.cfg.type ?? (this.cfg.url ? "http" : "stdio")
    if (type === "http" || type === "sse") {
      this.http = true
      this.url = (this.cfg.url ?? "").trim()
      if (!this.url) throw new Error(`MCP server "${this.name}" has no url`)
      await this.handshake(timeoutMs)
      return
    }

    // ── stdio: local child process ──
    if (!this.cfg.command) throw new Error(`MCP server "${this.name}" has no command`)
    // npx / .cmd shims on Windows aren't directly executable — go through the
    // shell so PATH resolution finds them. POSIX runs the binary directly. On
    // Windows we fold the args into the command string (with quoting) and pass
    // an empty args array, which dodges Node's DEP0190 warning about combining
    // an args array with shell:true while still letting the shell resolve npx.
    const win = process.platform === "win32"
    let command = this.cfg.command
    let args = this.cfg.args ?? []
    if (win && args.length) {
      command = [command, ...args].map(quoteArg).join(" ")
      args = []
    }
    const child = spawn(command, args, {
      env: { ...process.env, ...(this.cfg.env ?? {}) },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      shell: win,
    }) as ChildProcessWithoutNullStreams
    this.child = child

    child.stdout.setEncoding("utf8")
    child.stdout.on("data", (chunk: string) => this.onData(chunk))
    // MCP servers log diagnostics to stderr; swallow it so it never corrupts the
    // chat UI. (A server that fails to start surfaces via the spawn error.)
    child.stderr.on("data", () => {})
    child.on("error", (err) => this.failAll(err))
    child.on("close", () => {
      this.closed = true
      this.failAll(new Error(`MCP server "${this.name}" exited`))
    })

    await this.handshake(timeoutMs)
  }

  // Transport-agnostic handshake: initialize → initialized → tools/list.
  private async handshake(timeoutMs: number): Promise<void> {
    await this.rpc(
      "initialize",
      {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "onechater", version: "0.2.0" },
      },
      timeoutMs
    )
    this.notifyRpc("notifications/initialized")
    const res = await this.rpc("tools/list", {}, timeoutMs)
    const list = Array.isArray(res?.tools) ? res.tools : []
    this.tools = list.map((t: any) => ({
      name: String(t?.name ?? ""),
      description: typeof t?.description === "string" ? t.description : undefined,
      inputSchema: t?.inputSchema,
      readOnly: t?.annotations?.readOnlyHint === true,
    })).filter((t: McpToolInfo) => t.name)
  }

  // One request, routed to the active transport.
  private rpc(method: string, params: unknown, timeoutMs: number): Promise<any> {
    return this.http ? this.httpRpc(method, params, false, timeoutMs) : this.request(method, params, timeoutMs)
  }

  // One notification (no response expected), routed to the active transport.
  private notifyRpc(method: string): void {
    if (this.http) this.httpRpc(method, {}, true).catch(() => {})
    else this.notify(method)
  }

  // ── HTTP (streamable) transport ────────────────────────────────────────────
  // POST one JSON-RPC message; the response comes back as JSON or as an SSE
  // stream (Accept advertises both). A session id from initialize is echoed on
  // every later call so the server keeps our context.
  private async httpRpc(method: string, params: unknown, isNotify: boolean, timeoutMs = 20_000): Promise<any> {
    const id = isNotify ? undefined : this.nextId++
    const payload: Record<string, unknown> = { jsonrpc: "2.0", method, params: params ?? {} }
    if (id !== undefined) payload.id = id
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          ...(this.sessionId ? { "Mcp-Session-Id": this.sessionId } : {}),
          ...(this.cfg.headers ?? {}),
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      })
      const sid = res.headers.get("mcp-session-id")
      if (sid) this.sessionId = sid
      if (isNotify) return undefined
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`MCP "${this.name}" http ${res.status} ${txt.slice(0, 200)}`)
      }
      const ctype = res.headers.get("content-type") ?? ""
      const msg = ctype.includes("text/event-stream") ? await this.readSse(res, id!) : await res.json()
      if (msg?.error) throw new Error(msg.error?.message ?? "MCP error")
      return msg?.result
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw new Error(`MCP "${this.name}" timed out on ${method}`)
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  // Read an SSE response stream and return the JSON-RPC message matching `id`.
  private async readSse(res: any, id: number): Promise<any> {
    if (!res.body) return undefined
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ""
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        let nl: number
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim()
          buf = buf.slice(nl + 1)
          if (!line.startsWith("data:")) continue
          const data = line.slice(5).trim()
          if (!data || data === "[DONE]") continue
          try {
            const m = JSON.parse(data)
            if (m && m.id === id) return m
          } catch {
            // partial / non-JSON SSE comment — keep reading
          }
        }
      }
    } finally {
      reader.cancel().catch(() => {})
    }
    return undefined
  }

  // Invoke a tool and flatten its content blocks to a single text string.
  async callTool(name: string, args: Record<string, unknown>, timeoutMs = 120_000): Promise<string> {
    const res = await this.rpc("tools/call", { name, arguments: args ?? {} }, timeoutMs)
    const parts = Array.isArray(res?.content) ? res.content : []
    const text = parts
      .map((c: any) => {
        if (c?.type === "text") return String(c.text ?? "")
        if (c?.type === "image") return "[image returned]"
        if (c?.type === "resource") return `[resource: ${c?.resource?.uri ?? "?"}]`
        return ""
      })
      .filter(Boolean)
      .join("\n")
      .trim()
    const body = text || "(no content)"
    return res?.isError ? `ERROR from tool: ${body}` : body
  }

  disconnect(): void {
    this.closed = true
    try {
      this.child?.kill()
    } catch {}
    this.failAll(new Error("disconnected"))
  }

  // ── JSON-RPC plumbing ──────────────────────────────────────────────────────

  private request(method: string, params: unknown, timeoutMs: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.closed || !this.child) return reject(new Error("MCP server not running"))
      const id = this.nextId++
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`MCP "${this.name}" timed out on ${method}`))
      }, timeoutMs)
      this.pending.set(id, { resolve, reject, timer })
      this.send({ jsonrpc: "2.0", id, method, params })
    })
  }

  private notify(method: string, params?: unknown): void {
    this.send({ jsonrpc: "2.0", method, params: params ?? {} })
  }

  private send(msg: unknown): void {
    try {
      this.child?.stdin.write(JSON.stringify(msg) + "\n")
    } catch (err) {
      this.failAll(err instanceof Error ? err : new Error("write failed"))
    }
  }

  // Newline-delimited JSON: accumulate, split on \n, parse each complete line.
  private onData(chunk: string): void {
    this.buf += chunk
    let nl: number
    while ((nl = this.buf.indexOf("\n")) !== -1) {
      const line = this.buf.slice(0, nl).trim()
      this.buf = this.buf.slice(nl + 1)
      if (!line) continue
      let msg: any
      try {
        msg = JSON.parse(line)
      } catch {
        continue // ignore non-JSON noise some servers emit
      }
      if (msg && typeof msg.id === "number" && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id)!
        this.pending.delete(msg.id)
        clearTimeout(p.timer)
        if (msg.error) p.reject(new Error(msg.error?.message ?? "MCP error"))
        else p.resolve(msg.result)
      }
      // Server-initiated requests/notifications are ignored — we expose no
      // sampling/roots capability, so there's nothing to answer.
    }
  }

  private failAll(err: Error): void {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer)
      p.reject(err)
    }
    this.pending.clear()
  }
}
