import {
  type ToolSpec,
  registerDynamicTool,
  clearDynamicTools,
  addToolPromptBlock,
} from "./tools.js"
import { McpClient, loadMcpConfig, type McpToolInfo } from "./mcp.js"
import { listSkills, loadSkill, type Skill } from "./skills.js"

// ─── Extensions: wiring MCP servers + skills into the tool system ─────────────
// One place that, at REPL startup, connects every configured MCP server,
// registers each remote tool as a dynamic ToolSpec, and exposes local skills via
// the `use_skill` tool. Everything it adds flows through the same approval panel
// and audit log as the built-in tools.

export type McpStatus = {
  name: string
  ok: boolean
  toolCount: number
  tools: string[]
  error?: string
}

export type ExtensionState = {
  mcp: McpStatus[]
  skills: Skill[]
  toolCount: number // dynamic tools registered (MCP tools + use_skill)
  disconnect: () => void
}

// First non-empty line of a description, clamped — keeps the system-prompt line
// for a tool to one tidy row.
function firstLine(s: string | undefined, max = 100): string {
  if (!s) return ""
  const line = s.split("\n").map((l) => l.trim()).find(Boolean) ?? ""
  return line.length > max ? line.slice(0, max - 1) + "…" : line
}

// Top-level property names from a JSON-Schema, for the prompt's "(arg, arg)" hint.
function schemaHint(schema: unknown): string {
  const props = schema && typeof schema === "object" ? (schema as any).properties : null
  if (!props || typeof props !== "object") return ""
  return Object.keys(props).slice(0, 6).join(", ")
}

// Compact one-line render of the args, for the approval panel describe().
function shortArgs(args: Record<string, unknown>): string {
  try {
    const s = JSON.stringify(args)
    return s.length > 80 ? s.slice(0, 79) + "…" : s
  } catch {
    return ""
  }
}

// Wrap one MCP tool as a ToolSpec. Namespaced mcp__<server>__<tool> so two
// servers exposing "read" never collide and the model can tell them apart.
function mcpToolSpec(client: McpClient, t: McpToolInfo): ToolSpec {
  const full = `mcp__${client.name}__${t.name}`
  return {
    name: full,
    source: "mcp",
    // A read-only tool (per its annotation) runs without a prompt; anything that
    // might mutate goes through the approval panel like the built-ins.
    mutates: !t.readOnly,
    describe: (a) => `${client.name} · ${t.name}(${shortArgs(a)})`,
    prompt: `- ${full}(${schemaHint(t.inputSchema)})${t.description ? `  ← ${firstLine(t.description)}` : ""}`,
    run: (a) => client.callTool(t.name, a),
  }
}

// The single tool that loads a skill's instructions on demand. Registered only
// when at least one skill exists.
function useSkillSpec(): ToolSpec {
  return {
    name: "use_skill",
    source: "skill",
    mutates: false, // it only pulls text into context, nothing on disk
    describe: (a) => `Load skill: ${a.name}`,
    run: async (a) => {
      const name = String(a.name ?? "").trim()
      const sk = loadSkill(name)
      if (!sk) {
        const names = listSkills().map((s) => s.name).join(", ") || "(none)"
        return `no skill named "${name}". Available: ${names}`
      }
      return `[Skill "${sk.title}" — follow these instructions for the current task]\n\n${sk.body}`
    },
  }
}

function skillsPromptBlock(skills: Skill[]): string {
  return (
    "SKILLS — reusable instruction sets you can load on demand. When the user's " +
    "request matches a skill's description, FIRST call use_skill(name) in a ```tool " +
    "block to load its full instructions, then follow them. Available skills:\n" +
    skills.map((s) => `- ${s.name}: ${s.description}`).join("\n")
  )
}

// Connect everything. Best-effort: a server that fails to launch is reported in
// `mcp[]` (ok:false) and skipped — the rest still come up.
export async function loadExtensions(): Promise<ExtensionState> {
  clearDynamicTools()
  const clients: McpClient[] = []
  const mcp: McpStatus[] = []
  let toolCount = 0

  const cfg = loadMcpConfig()
  for (const [name, sc] of Object.entries(cfg.mcpServers)) {
    if (!sc || sc.disabled) continue
    const client = new McpClient(name, sc)
    try {
      await client.connect()
      clients.push(client)
      for (const t of client.tools) {
        registerDynamicTool(mcpToolSpec(client, t))
        toolCount++
      }
      mcp.push({ name, ok: true, toolCount: client.tools.length, tools: client.tools.map((t) => t.name) })
    } catch (err) {
      mcp.push({
        name,
        ok: false,
        toolCount: 0,
        tools: [],
        error: err instanceof Error ? err.message : "failed to start",
      })
    }
  }

  const skills = listSkills()
  if (skills.length) {
    registerDynamicTool(useSkillSpec())
    addToolPromptBlock(skillsPromptBlock(skills))
    toolCount++ // use_skill itself
  }

  return {
    mcp,
    skills,
    toolCount,
    disconnect: () => {
      for (const c of clients) c.disconnect()
    },
  }
}
