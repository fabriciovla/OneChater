import readline from "node:readline"
import { stdin, stdout } from "node:process"
import {
  type Config,
  type Provider,
  PROVIDER_NAMES,
  PROVIDERS,
  isProvider,
  getProviderConfig,
  activeProviders,
  setProviderKey,
  setProviderModel,
  saveConfig,
  isFree,
  FREE_KEY_URL,
} from "./config.js"
import { type ChatMessage, streamChat, collectChat } from "./providers.js"
import { type Turn, buildHistory, gatherFusion, buildSynthesisMessages } from "./fusion.js"
import { loadMemory, MEMORY_PATH } from "./memory.js"
import {
  type ToolCall,
  WORKSPACE,
  TOOL_NAMES,
  getTool,
  parseToolCalls,
  stripToolBlocks,
  toolsSystemPrompt,
  createToolBlockHider,
} from "./tools.js"
import {
  C,
  bar,
  bold,
  dim,
  muted,
  white,
  wordmark,
  divider,
  gutter,
  kv,
  boxTop,
  boxBottom,
  boxPrompt,
  createMarkdownStream,
  createWrapper,
} from "./ui.js"

type ReplOptions = {
  fusion: boolean
  provider?: Provider
}

// Slash commands, shown in the command palette when the input starts with "/".
const COMMANDS: { name: string; args: string; desc: string }[] = [
  { name: "/connect", args: "<provider> [key]", desc: "connect a model" },
  { name: "/disconnect", args: "<provider>", desc: "remove a model" },
  { name: "/providers", args: "", desc: "connected models & mode" },
  { name: "/model", args: "<prov> <model>", desc: "set a provider's model" },
  { name: "/default", args: "<provider>", desc: "pick the synthesizer" },
  { name: "/tools", args: "", desc: "list workspace tools" },
  { name: "/workspace", args: "", desc: "show the workspace dir" },
  { name: "/memory", args: "", desc: "show persistent memory" },
  { name: "/clear", args: "", desc: "reset the conversation" },
  { name: "/help", args: "", desc: "command list" },
  { name: "/exit", args: "", desc: "quit" },
]

// The last message the user submitted — recalled into the input with double-Esc
// so an accidental send can be edited and resent.
let lastInput = ""

// A small in-place "thinking" spinner. Returns a stop() that clears the line.
function startSpinner(label: string): () => void {
  if (!stdout.isTTY) return () => {}
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
  let i = 0
  stdout.write("\x1b[?25l")
  const timer = setInterval(() => {
    stdout.write("\r  " + muted(frames[i % frames.length]) + " " + dim(label) + "\x1b[K")
    i++
  }, 80)
  return () => {
    clearInterval(timer)
    stdout.write("\r\x1b[K\x1b[?25h") // clear the spinner line, show cursor
  }
}

// Interactive chat loop, mirroring the web app's logic:
//   • The conversation is a list of {user, assistant} turns — shared context
//     ("memory") that every model sees.
//   • Connect 2+ models (each with a key) and they think together: all answer
//     in parallel, then the first synthesizes ONE superior answer. 1 model = a
//     plain single-model chat.
//   • The persistent memory profile is injected into every model's system
//     prompt. Slash commands manage providers live.
export async function runRepl(cfg: Config, opts: ReplOptions) {
  const turns: Turn[] = []

  banner(cfg, opts)

  while (true) {
    const raw = await readBoxedInput()
    if (raw === null) break
    const input = raw.trim()
    if (!input) continue

    // ── Slash commands ──────────────────────────────────────────────────────
    if (input.startsWith("/")) {
      const [cmd, ...rest] = input.split(/\s+/)

      if (cmd === "/exit" || cmd === "/quit") break
      if (cmd === "/help") {
        printHelp()
        continue
      }
      if (cmd === "/clear") {
        turns.length = 0
        if (stdout.isTTY) stdout.write("\x1b[2J\x1b[3J\x1b[H")
        banner(cfg, opts)
        console.log(dim("  · conversation cleared"))
        continue
      }
      if (cmd === "/providers" || cmd === "/status") {
        cfg = await cmdProviders(cfg)
        continue
      }
      if (cmd === "/tools") {
        console.log("")
        console.log("  " + bold("Tools") + dim("   single-model turns can use these (with approval)"))
        for (const t of TOOL_NAMES) console.log("    " + dim("•") + " " + white(t))
        console.log(kv("workspace", dim(WORKSPACE)))
        console.log("")
        continue
      }
      if (cmd === "/workspace" || cmd === "/cwd") {
        console.log("  " + dim("workspace  ") + white(WORKSPACE))
        continue
      }
      if (cmd === "/memory") {
        const m = loadMemory().trim()
        console.log("")
        console.log("  " + bold("Memory") + dim(`   ${MEMORY_PATH}`))
        console.log(m ? indentBlock(m) : "  " + dim("(empty) — onechater memory edit"))
        console.log("")
        continue
      }
      if (cmd === "/connect" || cmd === "/login") {
        cfg = await cmdConnect(cfg, rest)
        continue
      }
      if (cmd === "/disconnect" || cmd === "/logout") {
        cfg = await cmdDisconnect(cfg, rest)
        continue
      }
      if (cmd === "/model") {
        cfg = await cmdModel(cfg, rest)
        continue
      }
      if (cmd === "/default") {
        cfg = await cmdDefault(cfg, rest)
        continue
      }
      console.log("  " + dim(`unknown command ${cmd} — /help`))
      continue
    }

    // ── Chat turn ───────────────────────────────────────────────────────────
    const active = activeProviders(cfg)
    const memory = loadMemory().trim()

    // Forced single model via `chat -p`, otherwise auto: 2+ connected = fusion.
    const forced = opts.provider && getProviderConfig(cfg, opts.provider).apiKey.trim()
      ? opts.provider
      : undefined

    if (!forced && active.length === 0) {
      console.log(
        "\n  " + bar(C.text) + " " + bold(white("no models connected")) + "\n  " +
          dim("connect one:  ") + white("/connect groq") + dim("   (free key: " + (FREE_KEY_URL.groq ?? "") + ")")
      )
      continue
    }

    lastInput = input // remember it for double-Esc recall

    try {
      let answer: string
      if (forced) {
        answer = await singleTurn(cfg, turns, input, forced, memory, [forced])
      } else if (active.length >= 2) {
        answer = await fusionTurn(cfg, turns, input, active, memory)
      } else {
        answer = await singleTurn(cfg, turns, input, active[0], memory, active)
      }
      turns.push({ user: input, assistant: answer })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error"
      console.log("\n  " + bar(C.text) + " " + bold(white("error")) + "  " + dim(msg))
    }
  }

  console.log(dim("\n  see you.\n"))
}

// ─── Streaming a model answer to the terminal (markdown + word-wrap) ───────────

async function streamInto(gen: AsyncGenerator<string>, hideTools = false): Promise<string> {
  stdout.write("  ")
  const md = createMarkdownStream()
  const wrap = createWrapper("  ")
  const hider = hideTools ? createToolBlockHider() : null
  const show = (s: string) => stdout.write(wrap.write(md.write(hider ? hider.write(s) : s)))
  let answer = ""
  for await (const chunk of gen) {
    show(chunk)
    answer += chunk // raw text (incl. tool blocks) for history + parsing
  }
  if (hider) stdout.write(wrap.write(md.write(hider.flush())))
  stdout.write(wrap.write(md.flush()) + wrap.flush())
  stdout.write("\n")
  return answer
}

// Render a full (already collected) answer through the markdown + wrap pipeline.
function renderText(text: string) {
  const md = createMarkdownStream()
  const wrap = createWrapper("  ")
  stdout.write("  " + wrap.write(md.write(text)) + wrap.write(md.flush()) + wrap.flush() + "\n")
}

// Single-model turn — an AGENT loop: the model can request tools, the user
// approves them, they run (confined to the workspace), and results feed back
// until the model produces a final answer. With no tools requested it's a plain
// streamed chat.
// Shared agent loop: stream the first reply, then while the model requests
// tools, approve+run them and feed results back until it produces a final
// answer (no tool block). Tool JSON is hidden from the visible stream.
async function agentLoop(
  cfg: Config,
  provider: Provider,
  messages: ChatMessage[]
): Promise<string> {
  const { apiKey, model } = getProviderConfig(cfg, provider)
  let text = await streamInto(streamChat(provider, apiKey, model, messages), true)
  let calls = parseToolCalls(text)

  let steps = 0
  while (calls.length && steps < 16) {
    steps++
    messages.push({ role: "assistant", content: text })

    // If the model already gave a full answer and only wants to remember a fact
    // (a side effect), run it but don't make it re-answer — avoids the duplicate.
    const onlyRemember = calls.every((c) => c.name === "remember")
    const hadAnswer = stripToolBlocks(text).length > 0
    const results = await runToolCalls(calls)
    if (onlyRemember && hadAnswer) return text

    messages.push({ role: "user", content: "Tool results:\n\n" + results })
    const stop = startSpinner("working…")
    text = await collectChat(provider, apiKey, model, messages)
    stop()
    calls = parseToolCalls(text)
    if (!calls.length && text.trim()) {
      console.log("")
      renderText(text) // final answer after tools
    }
  }
  return text
}

// Single-model turn — the model can use tools (agent loop), or just chat.
async function singleTurn(
  cfg: Config,
  turns: Turn[],
  question: string,
  provider: Provider,
  memory: string,
  active: Provider[]
): Promise<string> {
  const { apiKey, model } = getProviderConfig(cfg, provider)
  if (!apiKey.trim()) throw new Error(`no API key for ${provider} — /connect ${provider}`)

  const messages = buildHistory(turns, active, provider, memory, question, toolsSystemPrompt())
  console.log("\n" + gutter(PROVIDER_NAMES[provider], C.text, model) + "\n")
  return agentLoop(cfg, provider, messages)
}

// Run a batch of tool calls: confirm the mutating ones once, then execute each
// (read-only tools never need approval). Returns a text block of results.
async function runToolCalls(calls: ToolCall[]): Promise<string> {
  const mutating = calls.filter((c) => getTool(c.name)?.mutates)
  let allowed = true
  if (mutating.length) allowed = await confirmActions(mutating)

  const results: string[] = []
  for (const c of calls) {
    const tool = getTool(c.name)
    if (!tool) {
      results.push(`${c.name}: unknown tool`)
      continue
    }
    if (tool.mutates && !allowed) {
      results.push(`${c.name}: DENIED by the user`)
      continue
    }
    try {
      console.log("  " + white("▸") + " " + dim(tool.describe(c.args)))
      const out = await tool.run(c.args)
      results.push(`${c.name} → ${out}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error"
      console.log("  " + muted("×") + " " + dim(msg))
      results.push(`${c.name}: ERROR ${msg}`)
    }
  }
  return results.join("\n\n")
}

// The "OneChater wants to:" permission panel + [Allow]/[Deny].
async function confirmActions(calls: ToolCall[]): Promise<boolean> {
  console.log("\n  " + bold(white("OneChater wants to:")))
  for (const c of calls) {
    const tool = getTool(c.name)!
    console.log("    " + dim("•") + " " + white(tool.describe(c.args)))
  }
  const ans = await readChoice("  " + dim("[a]llow  ·  [d]eny  › "))
  const ok = ans === "a" || ans === "y" || ans === "\r" || ans === "\n"
  console.log("  " + (ok ? white("✓ allowed") : muted("✗ denied")) + "\n")
  return ok
}

// Read a single key (TTY) or a line (piped) for a yes/no style choice.
function readChoice(promptText: string): Promise<string> {
  stdout.write(promptText)
  return new Promise((resolve) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      pipeReadLine().then((l) => resolve(((l ?? "").trim().toLowerCase()[0] ?? "d")))
      return
    }
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding("utf8")
    const on = (d: string) => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener("data", on)
      stdout.write("\n")
      const c = d[0]
      resolve(c === "\x03" ? "d" : c.toLowerCase())
    }
    stdin.on("data", on)
  })
}

// Interactive list picker: arrow keys (or j/k) move, Enter selects, Esc/Ctrl-C
// cancels. Returns the chosen index, or null if cancelled. Redraws in place.
// Falls back to a numbered prompt when stdin isn't a TTY.
function selectMenu(
  title: string,
  items: { label: string; hint?: string }[],
  footer = "↑↓ move · enter select · esc cancel"
): Promise<number | null> {
  return new Promise((resolve) => {
    if (!items.length) return resolve(null)
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      console.log("  " + title)
      items.forEach((it, i) => console.log(`  ${i + 1}. ${it.label}${it.hint ? "  " + it.hint : ""}`))
      pipeReadLine().then((l) => {
        const n = parseInt((l ?? "").trim(), 10) - 1
        resolve(Number.isInteger(n) && n >= 0 && n < items.length ? n : null)
      })
      return
    }

    let sel = 0
    let drawn = 0 // rows below the title line (for moving back up to redraw)

    stdout.write("\n\x1b[?25l") // spacing + hide cursor
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding("utf8")
    render(true)

    function render(firstTime = false) {
      let out = ""
      if (!firstTime) out += `\x1b[${drawn}A`
      out += "\r\x1b[J"
      const lines: string[] = ["  " + bold(white(title))]
      items.forEach((it, i) => {
        const on = i === sel
        lines.push(
          "  " + (on ? white("›") : " ") + " " +
            (on ? bold(white(it.label)) : white(it.label)) +
            (it.hint ? "  " + dim(it.hint) : "")
        )
      })
      lines.push("  " + dim(footer))
      out += lines.join("\n")
      drawn = lines.length - 1
      stdout.write(out)
    }

    function finish(result: number | null) {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener("data", onData)
      stdout.write("\x1b[?25h\n") // show cursor, drop below the menu
      resolve(result)
    }

    function onData(data: string) {
      let i = 0
      while (i < data.length) {
        const ch = data[i]
        if (ch === "\x03") return finish(null)
        if (ch === "\r" || ch === "\n") return finish(sel)
        if (ch === "k") {
          sel = (sel - 1 + items.length) % items.length
          i++
          continue
        }
        if (ch === "j") {
          sel = (sel + 1) % items.length
          i++
          continue
        }
        if (ch === "\x1b") {
          const seq = data.slice(i)
          if (seq.startsWith("\x1b[A")) {
            sel = (sel - 1 + items.length) % items.length
            i += 3
          } else if (seq.startsWith("\x1b[B")) {
            sel = (sel + 1) % items.length
            i += 3
          } else if (seq === "\x1b") {
            return finish(null)
          } else {
            let j = i + 1
            while (j < data.length && !/[a-zA-Z~]/.test(data[j])) j++
            i = j + 1
          }
          continue
        }
        i++
      }
      render()
    }

    stdin.on("data", onData)
  })
}

async function fusionTurn(
  cfg: Config,
  turns: Turn[],
  question: string,
  active: Provider[],
  memory: string
): Promise<string> {
  // Phase 1 — every connected model answers in parallel (silently). They get
  // the tools protocol too, so they propose actions instead of refusing.
  const names = active.map((p) => PROVIDER_NAMES[p]).join(" · ")
  console.log("\n" + gutter("fusion", C.text, names))
  const stop = startSpinner(`${names} thinking together…`)
  const parts = await gatherFusion(turns, active, cfg, memory, question, toolsSystemPrompt())
  stop()
  // Only note models that failed; successes are implied by the answer below.
  for (const p of parts.filter((x) => x.error)) {
    console.log("  " + dim(`· ${PROVIDER_NAMES[p.provider]} unavailable`))
  }

  if (!parts.some((p) => p.answer.trim())) throw new Error("no model returned an answer")

  // Phase 2 — the synthesizer (first model) merges the answers AND can use
  // tools to act, via the agent loop. No extra header; the answer just follows.
  console.log("")
  const messages = buildSynthesisMessages(turns, parts, question)
  messages.unshift({ role: "system", content: toolsSystemPrompt() })
  return agentLoop(cfg, active[0], messages)
}

// ─── Slash command handlers (interactive) ─────────────────────────────────────

// Prompt for a line of text under a label (reuses the boxed input).
async function promptText(label: string): Promise<string> {
  console.log("  " + dim(label))
  const v = await readBoxedInput()
  return (v ?? "").trim()
}

// /providers — a live toggle menu: Enter connects (asks for a key) or
// disconnects the highlighted provider; Esc closes. No typing of names needed.
async function cmdProviders(cfg: Config): Promise<Config> {
  if (!stdin.isTTY) {
    printProviders(cfg)
    return cfg
  }
  while (true) {
    const active = activeProviders(cfg)
    const items = PROVIDERS.map((p) => {
      const on = !!getProviderConfig(cfg, p).apiKey.trim()
      const tags = [on ? "connected" : isFree(p) ? "free" : "", on && p === active[0] ? "synth" : ""]
        .filter(Boolean)
        .join(" · ")
      return { label: (on ? "● " : "○ ") + PROVIDER_NAMES[p], hint: tags }
    })
    const idx = await selectMenu("Providers", items, "↑↓ move · enter connect/disconnect · esc done")
    if (idx === null) break
    const p = PROVIDERS[idx]
    const on = !!getProviderConfig(cfg, p).apiKey.trim()
    if (on) {
      cfg = setProviderKey(cfg, p, "")
      saveConfig(cfg)
      console.log("  " + dim("disconnected ") + bold(white(PROVIDER_NAMES[p])))
    } else {
      const url = FREE_KEY_URL[p]
      const key = await promptText(`paste your ${PROVIDER_NAMES[p]} API key${url ? `   (free: ${url})` : ""}:`)
      if (key) {
        cfg = setProviderKey(cfg, p, key)
        saveConfig(cfg)
        console.log("  " + white("✓") + " " + bold(white(PROVIDER_NAMES[p])) + dim(" connected"))
      }
    }
  }
  const n = activeProviders(cfg).length
  console.log("  " + dim(n >= 2 ? `fusion · ${n} models` : n === 1 ? "single model" : "no models connected"))
  return cfg
}

async function cmdConnect(cfg: Config, rest: string[]): Promise<Config> {
  let provider = rest[0]
  let key = rest.slice(1).join(" ").trim()
  if (!provider || !isProvider(provider)) {
    const items = PROVIDERS.map((p) => ({
      label: PROVIDER_NAMES[p],
      hint: getProviderConfig(cfg, p).apiKey.trim() ? "connected" : isFree(p) ? "free" : "",
    }))
    const idx = await selectMenu("Connect a model", items)
    if (idx === null) return cfg
    provider = PROVIDERS[idx]
  }
  if (!isProvider(provider)) return cfg
  if (!key) {
    const url = FREE_KEY_URL[provider]
    key = await promptText(`paste your ${PROVIDER_NAMES[provider]} API key${url ? `   (free: ${url})` : ""}:`)
  }
  if (!key) {
    console.log("  " + dim("no key entered"))
    return cfg
  }
  cfg = setProviderKey(cfg, provider, key)
  saveConfig(cfg)
  const n = activeProviders(cfg).length
  console.log(
    "  " + white("✓") + " " + bold(white(PROVIDER_NAMES[provider])) + " connected" +
      dim(n >= 2 ? `   · fusion (${n} models)` : "   · single-model")
  )
  return cfg
}

async function cmdDisconnect(cfg: Config, rest: string[]): Promise<Config> {
  let provider = rest[0]
  if (!provider || !isProvider(provider)) {
    const connected = PROVIDERS.filter((p) => getProviderConfig(cfg, p).apiKey.trim())
    if (!connected.length) {
      console.log("  " + dim("no models connected"))
      return cfg
    }
    const idx = await selectMenu("Disconnect a model", connected.map((p) => ({ label: PROVIDER_NAMES[p] })))
    if (idx === null) return cfg
    provider = connected[idx]
  }
  if (!isProvider(provider)) return cfg
  cfg = setProviderKey(cfg, provider, "")
  saveConfig(cfg)
  console.log("  " + white("✓") + " " + bold(white(PROVIDER_NAMES[provider])) + " disconnected")
  return cfg
}

async function cmdModel(cfg: Config, rest: string[]): Promise<Config> {
  let provider = rest[0]
  let model = rest.slice(1).join(" ").trim()
  if (!provider || !isProvider(provider)) {
    const items = PROVIDERS.map((p) => ({ label: PROVIDER_NAMES[p], hint: getProviderConfig(cfg, p).model }))
    const idx = await selectMenu("Set model for…", items)
    if (idx === null) return cfg
    provider = PROVIDERS[idx]
  }
  if (!isProvider(provider)) return cfg
  if (!model) {
    model = await promptText(`model for ${PROVIDER_NAMES[provider]}  (current: ${getProviderConfig(cfg, provider).model}):`)
  }
  if (!model) return cfg
  cfg = setProviderModel(cfg, provider, model)
  saveConfig(cfg)
  console.log("  " + white("✓") + " " + bold(white(PROVIDER_NAMES[provider])) + dim("  model = ") + white(model))
  return cfg
}

async function cmdDefault(cfg: Config, rest: string[]): Promise<Config> {
  let provider = rest[0]
  if (!provider || !isProvider(provider)) {
    const list = activeProviders(cfg).length ? activeProviders(cfg) : [...PROVIDERS]
    const items = list.map((p) => ({ label: PROVIDER_NAMES[p], hint: p === cfg.defaultProvider ? "current" : "" }))
    const idx = await selectMenu("Synthesizer (default model)", items)
    if (idx === null) return cfg
    provider = list[idx]
  }
  if (!isProvider(provider)) return cfg
  cfg = { ...cfg, defaultProvider: provider }
  saveConfig(cfg)
  console.log("  " + white("✓") + dim("  default / synthesizer = ") + bold(white(PROVIDER_NAMES[provider])))
  return cfg
}

// ─── Banner & info ─────────────────────────────────────────────────────────────

function banner(cfg: Config, opts: ReplOptions) {
  const active = activeProviders(cfg)
  const memory = loadMemory().trim()
  console.log("")
  for (const row of wordmark("  ", "OneChater")) console.log(row)
  console.log("  " + muted("multi-model terminal"))
  console.log("")

  const forced = opts.provider && getProviderConfig(cfg, opts.provider).apiKey.trim() ? opts.provider : undefined
  if (forced) {
    const { model } = getProviderConfig(cfg, forced)
    console.log(kv("mode", bold(white("single")) + dim(`  ${PROVIDER_NAMES[forced]} · ${model}`)))
  } else if (active.length >= 2) {
    console.log(kv("mode", bold(white("fusion")) + dim(`  ${active.length} models think together`)))
    console.log(kv("models", active.map((p) => bold(white(PROVIDER_NAMES[p]))).join(dim(" · "))))
    console.log(kv("synth", bold(white(PROVIDER_NAMES[active[0]]))))
  } else if (active.length === 1) {
    const { model } = getProviderConfig(cfg, active[0])
    console.log(kv("mode", bold(white("single")) + dim(`  ${PROVIDER_NAMES[active[0]]} · ${model}`)))
    console.log(kv("tip", dim("connect another model → ") + white("/connect <provider>") + dim(" → fusion")))
  } else {
    console.log(kv("mode", dim("no models connected")))
    console.log(kv("start", white("/connect groq") + dim("   free key: " + (FREE_KEY_URL.groq ?? ""))))
  }
  console.log(kv("memory", memory ? bold(white("on")) : dim("empty")))
  console.log(kv("tools", bold(white("on")) + dim(`   ${WORKSPACE}`)))

  console.log(divider())
  console.log(
    "  " +
      dim("/help") + muted("  commands   ") +
      dim("/connect") + muted("  add model   ") +
      dim("/clear") + muted("  reset   ") +
      dim("/exit") + muted("  quit")
  )
}

function printProviders(cfg: Config) {
  const active = activeProviders(cfg)
  console.log("")
  console.log("  " + bold("Providers"))
  for (const p of PROVIDERS) {
    const c = getProviderConfig(cfg, p)
    const on = !!c.apiKey.trim()
    const dot = on ? white("●") : dim("○")
    const name = on ? bold(white(PROVIDER_NAMES[p].padEnd(11))) : muted(PROVIDER_NAMES[p].padEnd(11))
    const free = isFree(p) ? dim(" free") : "     "
    const synth = on && p === active[0] ? "  " + dim("synth") : ""
    console.log(`  ${dot} ${name}${free}  ${dim(c.model)}${synth}`)
  }
  console.log("")
  const mode = active.length >= 2 ? `fusion · ${active.length} models` : active.length === 1 ? "single" : "none"
  console.log(kv("mode", bold(white(mode))))
  console.log("")
}

function printHelp() {
  const row = (cmd: string, args: string, desc: string) =>
    "  " + white(cmd.padEnd(13)) + muted(args.padEnd(18)) + dim(desc)
  console.log("")
  console.log("  " + bold("Chat"))
  console.log("  " + dim("just type — connect 2+ models and they fuse into one answer"))
  console.log("")
  console.log("  " + bold("Commands") + dim("   (interactive — pick with ↑↓ and enter)"))
  console.log(row("/providers", "", "connect/disconnect models (toggle menu)"))
  console.log(row("/connect", "", "connect a model (enables fusion)"))
  console.log(row("/disconnect", "", "remove a model"))
  console.log(row("/model", "", "set a provider's model"))
  console.log(row("/default", "", "pick the synthesizer model"))
  console.log(row("/tools", "", "list the workspace tools"))
  console.log(row("/workspace", "", "show the workspace directory"))
  console.log(row("/memory", "", "show the persistent memory"))
  console.log(row("/clear", "", "reset the conversation"))
  console.log(row("/help", "", "this list"))
  console.log(row("/exit", "", "quit"))
  console.log("")
  console.log("  " + bold("Providers") + "  " + dim(PROVIDERS.join(" · ")))
  console.log("")
}

function indentBlock(s: string): string {
  return s
    .split("\n")
    .map((l) => "  " + dim(l))
    .join("\n")
}

// ─── Boxed raw-mode input ──────────────────────────────────────────────────────

const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "")

// Shared line reader for the non-TTY (piped) fallback. One readline interface is
// reused across calls so buffered lines aren't dropped between reads.
let pipeRl: readline.Interface | null = null
let pipeClosed = false
const pipeQueue: string[] = []
const pipeWaiters: ((v: string | null) => void)[] = []
function pipeReadLine(): Promise<string | null> {
  if (pipeQueue.length) return Promise.resolve(pipeQueue.shift()!)
  if (pipeClosed) return Promise.resolve(null)
  if (!pipeRl) {
    pipeRl = readline.createInterface({ input: stdin })
    pipeRl.on("line", (l) => {
      const w = pipeWaiters.shift()
      if (w) w(l)
      else pipeQueue.push(l)
    })
    pipeRl.on("close", () => {
      pipeClosed = true
      while (pipeWaiters.length) pipeWaiters.shift()!(null)
    })
  }
  return new Promise((res) => pipeWaiters.push(res))
}

// Read one line framed by a horizontal rule above AND below, both visible while
// typing. Node's readline clears the screen below the cursor on every refresh,
// so we drive raw mode ourselves and redraw the frame. The input is kept to a
// single visual row (horizontal scroll, never wrapping) so the block is always
// three lines. Redraws are coalesced and written atomically with the cursor
// hidden, which removes the key-repeat flicker. Returns null on Ctrl-C / EOF.
function readBoxedInput(): Promise<string | null> {
  const promptStr = boxPrompt()
  const promptW = [...stripAnsi(promptStr)].length

  return new Promise((resolve) => {
    // Non-interactive (piped) fallback — no frame redraw, rule after submit.
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      console.log("\n" + boxTop())
      stdout.write(promptStr)
      pipeReadLine().then((line) => {
        stdout.write((line ?? "") + "\n")
        console.log(boxBottom())
        resolve(line)
      })
      return
    }

    const buf: string[] = []
    let pos = 0 // cursor index within buf
    let off = 0 // horizontal scroll offset (in buf chars)
    let first = true
    let done = false
    let scheduled = false
    let pasteBuf: string | null = null // accumulates a bracketed paste
    let sel = 0 // highlighted row in the command palette
    let dismissed = false // palette closed with Esc until the next edit
    let lastExtra = 1 // rows drawn below the input line last time (bottom + palette)
    let sawEsc = false // previous key was a standalone Esc (for double-Esc recall)

    stdout.write("\n") // spacing above the box
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding("utf8")
    stdout.write("\x1b[?2004h") // enable bracketed paste
    draw()

    // Commands matching the current input — the palette is open when this is
    // non-empty (input is a bare "/word", not dismissed).
    function matches() {
      const cur = buf.join("")
      if (dismissed || !cur.startsWith("/") || cur.includes(" ")) return []
      return COMMANDS.filter((c) => c.name.startsWith(cur))
    }

    // One rendered line per command, the selected one marked with ›.
    function paletteLines(ms: typeof COMMANDS): string[] {
      return ms.map((c, i) => {
        const on = i === sel
        const marker = on ? white("›") : " "
        const name = on ? bold(white(c.name.padEnd(12))) : white(c.name.padEnd(12))
        const args = dim((c.args || "").padEnd(17))
        return "  " + marker + " " + name + args + dim(c.desc)
      })
    }

    // Redraw the frame (and palette). Incremental — rewrite only the input line —
    // when no palette is/was shown (kills key-repeat flicker); otherwise a full
    // clear+redraw of the box plus the dropdown. `force` always does the full one.
    function draw(force = false) {
      const cols = Math.max(8, stdout.columns || 80)
      const avail = Math.max(1, cols - promptW - 1)
      if (pos < off) off = pos
      if (pos > off + avail) off = pos - avail
      if (off < 0) off = 0
      const visible = buf.slice(off, off + avail).join("")

      const ms = matches()
      if (sel >= ms.length) sel = Math.max(0, ms.length - 1)
      const full = first || force || ms.length > 0 || lastExtra > 1

      let out = "\x1b[?25l" // hide cursor
      if (!full) {
        out += "\r\x1b[K" + promptStr + visible + "\r"
        lastExtra = 1
      } else {
        if (!first) out += "\x1b[1A\r\x1b[J" // up to top rule, clear box + old palette
        first = false
        out += boxTop() + "\n" + promptStr + visible + "\n" + boxBottom()
        const pal = paletteLines(ms)
        for (const l of pal) out += "\n" + l
        lastExtra = 1 + pal.length
        out += `\x1b[${lastExtra}A\r` // back up to the input line
      }
      const col = promptW + (pos - off)
      if (col > 0) out += `\x1b[${col}C`
      out += "\x1b[?25h" // show cursor
      stdout.write(out)
    }

    // Coalesce bursts (key-repeat delivers many data events) into one redraw.
    function scheduleDraw() {
      if (scheduled || done) return
      scheduled = true
      setImmediate(() => {
        scheduled = false
        if (!done) draw()
      })
    }

    const onResize = () => {
      if (!done && !first) draw(true)
    }
    stdout.on("resize", onResize)

    function cleanup() {
      done = true
      stdout.write("\x1b[?2004l") // disable bracketed paste
      stdout.removeListener("resize", onResize)
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener("data", onData)
    }

    // Insert literal text (a paste) at the cursor. Newlines collapse to spaces
    // since the input is a single line; control chars are dropped.
    function insertText(t: string) {
      for (const ch of t) {
        if (ch >= " ") {
          buf.splice(pos, 0, ch)
          pos++
        }
      }
    }

    function exitBelow() {
      stdout.write(`\x1b[${lastExtra}B\r\n`) // drop below the box (and palette)
    }

    function leaveBox() {
      dismissed = true
      draw() // flush final state (palette closed)
      exitBelow()
    }

    // Fill the input with a command from the palette. Arg-less commands could be
    // run straight away; we just fill + space and let the user press Enter.
    function fillCommand(name: string) {
      const text = name + " "
      buf.length = 0
      buf.push(...text)
      pos = buf.length
      dismissed = true
    }

    // Process a run of keystrokes. Returns true if the input was resolved
    // (submit / cancel) so the caller stops feeding more data.
    function handleKeys(data: string): boolean {
      let i = 0
      while (i < data.length) {
        const ch = data[i]
        const pal = matches() // current palette entries (empty = closed)
        const wasEsc = sawEsc // was the immediately-previous key a standalone Esc?
        sawEsc = false

        if (ch === "\x03") {
          cleanup()
          exitBelow()
          resolve(null)
          return true
        }
        if (ch === "\x04") {
          if (buf.length === 0) {
            cleanup()
            exitBelow()
            resolve(null)
            return true
          }
          i++
          continue
        }
        if (ch === "\r" || ch === "\n") {
          // With the palette open, Enter picks the highlighted command.
          if (pal.length) {
            const cmd = pal[Math.min(sel, pal.length - 1)]
            if (cmd.args) {
              fillCommand(cmd.name) // needs args → fill and wait
              i++
              continue
            }
            buf.length = 0
            buf.push(...cmd.name) // arg-less → run it
            pos = buf.length
          }
          leaveBox()
          cleanup()
          resolve(buf.join(""))
          return true
        }
        if (ch === "\t") {
          if (pal.length) fillCommand(pal[Math.min(sel, pal.length - 1)].name)
          i++
          continue
        }
        if (ch === "\x7f" || ch === "\b") {
          if (pos > 0) {
            buf.splice(pos - 1, 1)
            pos--
          }
          dismissed = false
          sel = 0
          i++
          continue
        }
        if (ch === "\x1b") {
          const seq = data.slice(i)
          if (seq.startsWith("\x1b[A")) {
            // Up: move palette selection, else ignore.
            if (pal.length) sel = (sel - 1 + pal.length) % pal.length
            i += 3
          } else if (seq.startsWith("\x1b[B")) {
            if (pal.length) sel = (sel + 1) % pal.length
            i += 3
          } else if (seq.startsWith("\x1b[D")) {
            if (pos > 0) pos--
            i += 3
          } else if (seq.startsWith("\x1b[C")) {
            if (pos < buf.length) pos++
            i += 3
          } else if (seq.startsWith("\x1b[H") || seq.startsWith("\x1b[1~")) {
            pos = 0
            i += seq.startsWith("\x1b[H") ? 3 : 4
          } else if (seq.startsWith("\x1b[F") || seq.startsWith("\x1b[4~")) {
            pos = buf.length
            i += seq.startsWith("\x1b[F") ? 3 : 4
          } else if (seq.startsWith("\x1b[3~")) {
            if (pos < buf.length) buf.splice(pos, 1)
            i += 4
          } else if (seq === "\x1b" || seq.startsWith("\x1b\x1b")) {
            // Standalone Escape (also matches the first of a "\x1b\x1b" pair).
            if (pal.length) {
              dismissed = true // first close the palette
            } else if (wasEsc && lastInput) {
              // Double-Esc on an open prompt → recall the last message to edit.
              buf.length = 0
              buf.push(...lastInput)
              pos = buf.length
              dismissed = false
              sel = 0
            } else {
              sawEsc = true // wait for a possible second Esc
            }
            i += 1
          } else {
            let j = i + 1
            while (j < data.length && !/[a-zA-Z~]/.test(data[j])) j++
            i = j + 1
          }
          continue
        }
        if (ch < " ") {
          i++
          continue
        }
        buf.splice(pos, 0, ch)
        pos++
        dismissed = false // typing reopens / refilters the palette
        sel = 0
        i++
      }
      return false
    }

    // Dispatch incoming data: route pasted text to insertText (so it never
    // auto-submits on embedded newlines) and everything else to handleKeys.
    function onData(data: string) {
      let s = data
      while (s.length) {
        // Inside a bracketed paste: accumulate until the end marker.
        if (pasteBuf !== null) {
          const end = s.indexOf("\x1b[201~")
          if (end === -1) {
            pasteBuf += s
            return
          }
          pasteBuf += s.slice(0, end)
          insertText(pasteBuf.replace(/\r\n|\r|\n/g, " "))
          pasteBuf = null
          s = s.slice(end + 6)
          continue
        }
        // Start of a bracketed paste.
        const start = s.indexOf("\x1b[200~")
        if (start !== -1) {
          if (start > 0 && handleKeys(s.slice(0, start))) return
          pasteBuf = ""
          s = s.slice(start + 6)
          continue
        }
        // Fallback for terminals without bracketed paste: a chunk with a newline
        // that is FOLLOWED by more text is a multi-line paste, not an Enter.
        // (A trailing newline alone — fast typing "a\r" — still submits.)
        if (/[\r\n][^\r\n]*\S/.test(s)) {
          insertText(s.replace(/\r\n|\r|\n/g, " "))
          s = ""
          continue
        }
        if (handleKeys(s)) return
        s = ""
      }
      scheduleDraw()
    }

    stdin.on("data", onData)
  })
}
