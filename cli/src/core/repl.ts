import readline from "node:readline"
import { readFileSync, existsSync } from "node:fs"
import { stdin, stdout } from "node:process"
import {
  type Config,
  type Provider,
  PROVIDER_NAMES,
  PROVIDERS,
  isProvider,
  getProviderConfig,
  activeProviders,
  hasKey,
  isActive,
  setProviderKey,
  setProviderEnabled,
  setProviderModel,
  saveConfig,
  isFree,
  FREE_KEY_URL,
  isFavorite,
  toggleFavorite,
  orderedProviders,
  setWebSession,
  modelsFor,
  modelLabel,
} from "./config.js"
import { CLI_PAGE, WEB_BASE, loginUrl, openBrowser, createLoopback, syncFromWeb } from "./auth.js"
import { type ChatMessage, streamChat, humanizeProviderError } from "./providers.js"
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
  resolveInWorkspace,
  applyEdit,
} from "./tools.js"
import { type Decision, audit, rateLimit, recentAudit, AUDIT_PATH } from "./security.js"
import {
  C,
  paint,
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
  inputFooter,
  boxPrompt,
  createMarkdownStream,
  createWrapper,
  renderDiff,
} from "./ui.js"

type ReplOptions = {
  fusion: boolean
  provider?: Provider
}

type Command = { name: string; args: string; desc: string }

// Slash commands, shown in the command palette when the input starts with "/".
// The auth row (/login vs /logout) is prepended dynamically by commandList().
const COMMANDS: Command[] = [
  { name: "/disconnect", args: "<provider>", desc: "remove a model" },
  { name: "/providers", args: "", desc: "connected models & mode" },
  { name: "/model", args: "<prov> <model>", desc: "set a provider's model" },
  { name: "/default", args: "<provider>", desc: "pick the synthesizer" },
  { name: "/tools", args: "", desc: "list workspace tools" },
  { name: "/workspace", args: "", desc: "show the workspace dir" },
  { name: "/audit", args: "", desc: "recent tool actions log" },
  { name: "/memory", args: "", desc: "show persistent memory" },
  { name: "/clear", args: "", desc: "reset the conversation" },
  { name: "/help", args: "", desc: "command list" },
  { name: "/exit", args: "", desc: "quit" },
]

// The auth row reflects login state: signed in → /logout with the account email
// in parens; signed out → /login. `web` is the current Config["web"] session.
function authCommand(web: Config["web"]): Command {
  return web
    ? { name: "/logout", args: "", desc: `sign out  (${web.email ?? "signed in"})` }
    : { name: "/login", args: "", desc: "link your onechater.app account" }
}

// Mirror of the current web session, so the command palette (which has no access
// to cfg) can show the right auth row. The REPL refreshes it every turn.
let webSession: Config["web"]

// The full slash-command list with the live auth row first.
function commandList(): Command[] {
  return [authCommand(webSession), ...COMMANDS]
}

// The running version, read from package.json so the banner always matches the
// installed build (dist/core/repl.js → ../../package.json).
let VERSION = ""
try {
  VERSION = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version ?? ""
} catch {}

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
    webSession = cfg.web // keep the palette's auth row in sync with login state
    const raw = await readBoxedInput()
    if (raw === null) break
    const input = raw.trim()
    if (!input) continue

    // ── Slash commands ──────────────────────────────────────────────────────
    if (input.startsWith("/")) {
      const [cmd, ...rest] = input.split(/\s+/)

      if (cmd === "/exit" || cmd === "/quit") break
      if (cmd === "/help") {
        printHelp(cfg)
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
      if (cmd === "/audit") {
        const entries = recentAudit(20)
        console.log("")
        console.log("  " + bold("Audit") + dim(`   ${AUDIT_PATH}`))
        if (!entries.length) {
          console.log("  " + dim("(no actions logged yet)"))
        } else {
          for (const e of entries) {
            const clock = e.time.slice(11, 19) // HH:MM:SS from the ISO stamp
            const mark =
              e.status === "error"
                ? muted("×")
                : e.decision === "denied" || e.decision === "blocked"
                  ? muted("✗")
                  : white("✓")
            const tag =
              e.decision === "denied" || e.decision === "blocked" ? muted(e.decision) : dim(e.decision)
            console.log(
              "  " + mark + " " + dim(clock) + " " + tag + "  " + white(e.detail) +
                (e.error ? "  " + muted(e.error) : "")
            )
          }
        }
        console.log("")
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
      if (cmd === "/login") {
        cfg = await cmdLogin(cfg)
        continue
      }
      if (cmd === "/logout") {
        cfg = cmdLogout(cfg)
        continue
      }
      if (cmd === "/disconnect") {
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
          dim("add one:  ") + white("/providers") + dim("   (free key: " + (FREE_KEY_URL.groq ?? "") + ")")
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
      // Explain what happened in plain language — never dump the raw HTTP/JSON
      // blob at the user. For a single-model turn we know which provider failed;
      // in fusion the per-model notes already cover it.
      const prov = forced ?? (active.length >= 2 ? undefined : active[0])
      const { summary, hint } = humanizeProviderError(err, prov ? PROVIDER_NAMES[prov] : "the model")
      console.log("\n  " + bar(C.text) + " " + white(summary))
      if (hint) console.log("  " + dim(hint))
    }
  }

  console.log(dim("\n  see you.\n"))
}

// ─── Streaming a model answer to the terminal (markdown + word-wrap) ───────────

// `leadGap`: when this step actually shows prose, prefix one blank line to
// separate it from the block above. It only fires on real output, so a step
// that is purely a (hidden) tool call stays gap-free — no stray blank lines.
async function streamInto(
  gen: AsyncGenerator<string>,
  hideTools = false,
  leadGap = false
): Promise<string> {
  const md = createMarkdownStream()
  const wrap = createWrapper("  ")
  const hider = hideTools ? createToolBlockHider() : null
  // Emit the leading indent (and optional gap) lazily, on the first visible
  // byte. A tool-only reply produces nothing here, so it leaves no blank line.
  let wrote = false
  const out = (s: string) => {
    if (!s) return
    if (!wrote) {
      if (leadGap) stdout.write("\n")
      stdout.write("  ")
      wrote = true
    }
    stdout.write(s)
  }
  const show = (s: string) => out(wrap.write(md.write(hider ? hider.write(s) : s)))
  let answer = ""
  for await (const chunk of gen) {
    show(chunk)
    answer += chunk // raw text (incl. tool blocks) for history + parsing
  }
  if (hider) out(wrap.write(md.write(hider.flush())))
  out(wrap.write(md.flush()) + wrap.flush())
  if (wrote) stdout.write("\n") // only close the line if we opened one
  return answer
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
  // Did the user ever see visible prose? (Tool blocks are hidden from the stream,
  // so a reply that is ONLY a tool block shows nothing.)
  let shownProse = stripToolBlocks(text).trim().length > 0

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
    // Stream the model's NEXT step live too (not just the first), so the user
    // always sees what it's doing between actions — "now I'll edit X", "running
    // the build", etc. — instead of an opaque "working…" spinner. `leadGap`
    // adds the separating blank line only if this step prints prose; a silent
    // tool-only step adds nothing.
    text = await streamInto(streamChat(provider, apiKey, model, messages), true, true)
    if (stripToolBlocks(text).trim()) shownProse = true
    calls = parseToolCalls(text)
  }

  // Safety net: never leave the user staring at a blank turn. If nothing visible
  // was ever shown and no tool ran, surface what happened instead of silence.
  if (!shownProse) {
    const raw = text.trim()
    if (!raw) {
      console.log(
        "  " + dim(`(${PROVIDER_NAMES[provider]} returned an empty response — try again, or switch model with /model)`)
      )
    } else if (!parseToolCalls(text).length) {
      // The reply was a malformed tool block (hidden, unparseable) — show it raw
      // so the user sees the model DID respond, and can react.
      console.log("  " + dim("(couldn't run the model's action — raw reply below)"))
      renderText(raw)
    }
  }
  return text
}

// Render a full (already collected) answer through the markdown + wrap pipeline.
function renderText(text: string) {
  const md = createMarkdownStream()
  const wrap = createWrapper("  ")
  stdout.write("  " + wrap.write(md.write(text)) + wrap.write(md.flush()) + wrap.flush() + "\n")
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
  if (!apiKey.trim()) throw new Error(`no API key for ${provider} — add it with /providers`)

  const messages = buildHistory(turns, active, provider, memory, question, toolsSystemPrompt())
  console.log("\n" + gutter(PROVIDER_NAMES[provider], C.text, model) + "\n")
  return agentLoop(cfg, provider, messages)
}

// A live output sink for streaming commands: indents each line of stdout/stderr
// under a dim gutter as it arrives, preserving the program's own colors and its
// carriage-return progress bars (git clone, npm…). `end()` finishes the last
// line so following output starts clean.
function liveSink() {
  let atLineStart = true
  const GUT = "  " + dim("│ ")
  const sink = (chunk: string) => {
    let out = ""
    for (const ch of chunk) {
      if (ch === "\n") {
        out += "\n"
        atLineStart = true
        continue
      }
      if (ch === "\r") {
        out += "\r"
        atLineStart = true
        continue
      }
      if (atLineStart) {
        out += GUT
        atLineStart = false
      }
      out += ch
    }
    stdout.write(out)
  }
  sink.end = () => {
    if (!atLineStart) stdout.write("\n")
    atLineStart = true
  }
  return sink
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
      audit({ tool: c.name, detail: "(unknown tool)", decision: "blocked", status: "error", error: "unknown tool" })
      results.push(`${c.name}: unknown tool`)
      continue
    }
    const detail = tool.describe(c.args)
    if (tool.mutates && !allowed) {
      audit({ tool: c.name, detail, decision: "denied", status: "ok" })
      results.push(`${c.name}: DENIED by the user`)
      continue
    }
    // Read-only tools run without a prompt → "auto"; mutating ones the user
    // just approved → "allowed".
    const decision: Decision = tool.mutates ? "allowed" : "auto"
    try {
      // Cap the rate of mutating actions (write/delete/run) — a second brake on
      // a runaway loop, on top of run_command's own per-command limit.
      if (tool.mutates) rateLimit("mutation")

      // Commands stream their output live (git clone, npm install…). Show the
      // command like a shell prompt and pipe stdout/stderr to the screen as it
      // runs, instead of waiting with a spinner. File edits already showed their
      // diff in the approval panel, so here we just print the action + result.
      const isCmd = c.name === "run_command"
      let out: string
      if (isCmd) {
        console.log("  " + paint(C.add, "$ ") + white(String(c.args.command ?? "")))
        const sink = liveSink()
        out = await tool.run(c.args, sink)
        sink.end()
      } else {
        console.log("  " + white("▸") + " " + dim(detail))
        out = await tool.run(c.args)
      }

      audit({ tool: c.name, detail, decision, status: "ok" })
      results.push(`${c.name} → ${out}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error"
      console.log("  " + muted("×") + " " + dim(msg))
      audit({ tool: c.name, detail, decision, status: "error", error: msg })
      results.push(`${c.name}: ERROR ${msg}`)
    }
  }
  return results.join("\n\n")
}

// Per-action glyph. Create = green +, delete = red −  (the same accents diffs
// use, so "+ add / − remove" reads consistently); modify = ~, command = $.
function actionGlyph(name: string): string {
  if (name === "create_file" || name === "create_folder") return paint(C.add, "+")
  if (name === "delete_file") return paint(C.del, "-")
  if (name === "run_command" || name === "git_commit" || name === "git_checkout") return bold(white("$"))
  if (name === "write_file" || name === "edit_file") return bold(white("~"))
  return white("•")
}

// Read the on-disk content of an edit target (empty if new/unreadable), so the
// panel can preview the change as a diff before anything is written.
function currentContent(pathArg: unknown): string {
  try {
    const p = resolveInWorkspace(String(pathArg ?? ""))
    return existsSync(p) ? readFileSync(p, "utf8") : ""
  } catch {
    return ""
  }
}

// The permission panel. Frames what OneChater is about to do, PREVIEWS each file
// edit as a red/green diff *before* you approve (so you see the exact change up
// front, not after it's written), shows commands verbatim, then reads one
// allow/deny key. Enter = allow.
async function confirmActions(calls: ToolCall[]): Promise<boolean> {
  const n = calls.length
  console.log("")
  console.log(
    "  " + bar(C.text) + " " + bold(white("Permission required")) +
      dim(`   ${n} action${n === 1 ? "" : "s"} · review before allowing`)
  )
  console.log("")
  for (const c of calls) {
    const tool = getTool(c.name)!
    console.log("  " + actionGlyph(c.name) + " " + white(tool.describe(c.args)))
    // Edits get a diff preview so you see the exact change before approving.
    if (c.name === "write_file" || c.name === "create_file") {
      const before = currentContent(c.args.path)
      const after = String(c.args.content ?? "")
      for (const line of renderDiff(String(c.args.path ?? ""), before, after)) console.log(line)
    } else if (c.name === "edit_file") {
      const before = currentContent(c.args.path)
      try {
        const after = applyEdit(before, String(c.args.old ?? ""), String(c.args.new ?? ""))
        for (const line of renderDiff(String(c.args.path ?? ""), before, after)) console.log(line)
      } catch (err) {
        // Can't compute the diff (snippet missing/ambiguous) — flag it; the tool
        // will surface the same error if approved.
        console.log("    " + dim("⚠ " + (err instanceof Error ? err.message : "cannot preview edit")))
      }
    }
    console.log("")
  }
  // Explicit choice: the user highlights Allow or Deny (↑↓ / j-k) and presses
  // Enter to confirm — no single keypress auto-resolves. Esc / Ctrl-C → deny.
  // Allow is highlighted first (the common case) but still needs Enter.
  const choice = await selectMenuEx(
    "Apply these actions?",
    [{ label: "Allow" }, { label: "Deny" }],
    "↑↓ choose · enter confirm · esc denies"
  )
  const ok = choice?.index === 0
  console.log("  " + (ok ? white("✓ allowed") : muted("✗ denied")) + "\n")
  return ok
}

// What a menu interaction resolved to: the highlighted row plus which key the
// user pressed — `null` action means a plain Enter (select), otherwise it's one
// of the caller-supplied `actionKeys` (e.g. "f" to favorite without leaving).
type MenuResult = { index: number; action: string | null }

// Interactive list picker: arrow keys (or j/k) move, Enter selects, Esc/Ctrl-C
// cancels. Returns the chosen index, or null if cancelled. Redraws in place.
// Falls back to a numbered prompt when stdin isn't a TTY.
function selectMenu(
  title: string,
  items: { label: string; hint?: string }[],
  footer = "↑↓ move · enter select · esc cancel"
): Promise<number | null> {
  return selectMenuEx(title, items, footer).then((r) => (r ? r.index : null))
}

// Like selectMenu but also accepts extra single-char `actionKeys`. Pressing one
// resolves with that key as `action` (and the highlighted index) so the caller
// can act in place and reopen the menu. Powers in-menu favoriting.
function selectMenuEx(
  title: string,
  items: { label: string; hint?: string }[],
  footer = "↑↓ move · enter select · esc cancel",
  actionKeys: string[] = []
): Promise<MenuResult | null> {
  return new Promise((resolve) => {
    if (!items.length) return resolve(null)
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      console.log("  " + title)
      items.forEach((it, i) => console.log(`  ${i + 1}. ${it.label}${it.hint ? "  " + it.hint : ""}`))
      pipeReadLine().then((l) => {
        const n = parseInt((l ?? "").trim(), 10) - 1
        resolve(Number.isInteger(n) && n >= 0 && n < items.length ? { index: n, action: null } : null)
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

    function finish(result: MenuResult | null) {
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
        if (ch === "\r" || ch === "\n") return finish({ index: sel, action: null })
        if (actionKeys.includes(ch)) return finish({ index: sel, action: ch })
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
  // Each gets a short, plain-language reason instead of a raw error.
  for (const p of parts.filter((x) => x.error)) {
    const { short } = humanizeProviderError(p.error, PROVIDER_NAMES[p.provider])
    console.log("  " + dim(`· ${PROVIDER_NAMES[p.provider]} skipped — ${short}`))
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

// /providers — one self-contained panel that redraws IN PLACE. Navigate with
// arrows, `f` favorites, Enter connects (key typed inline, no new prompt) or
// disconnects, Esc closes. Every change repaints the same block — it never
// reprints itself as a fresh message.
function cmdProviders(cfg: Config): Promise<Config> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    printProviders(cfg)
    return Promise.resolve(cfg)
  }

  return new Promise<Config>((resolve) => {
    let sel = 0
    let drawn = 0
    let firstTime = true
    let mode: "list" | "input" = "list"
    let inputBuf = ""

    stdout.write("\n\x1b[?25l") // spacing + hide cursor
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding("utf8")
    render()

    function render() {
      const ord = orderedProviders(cfg)
      const active = activeProviders(cfg)
      const lines: string[] = ["  " + bold(white("Providers"))]
      ord.forEach((p, i) => {
        const keyed = hasKey(cfg, p)
        const on = isActive(cfg, p)
        const onSel = i === sel
        const star = isFavorite(cfg, p) ? white("★") : " "
        // ● on · ◯ off-but-key-saved · ○ no key
        const dot = on ? "●" : keyed ? "◯" : "○"
        const state = on ? "connected" : keyed ? "off · key saved" : isFree(p) ? "free" : ""
        const tags = [state, on && p === active[0] ? "synth" : ""].filter(Boolean).join(" · ")
        const label = `${star} ${dot} ${PROVIDER_NAMES[p]}`
        lines.push(
          "  " + (onSel ? white("›") : " ") + " " +
            (onSel ? bold(white(label)) : white(label)) +
            (tags ? "  " + dim(tags) : "")
        )
      })
      lines.push("")
      if (mode === "input") {
        const p = ord[sel]
        const url = FREE_KEY_URL[p]
        lines.push("  " + dim(`paste ${PROVIDER_NAMES[p]} API key${url ? `   (free: ${url})` : ""}:`))
        const shown = inputBuf ? white("•".repeat(Math.min(inputBuf.length, 32))) : dim("…")
        lines.push("  " + white("› ") + shown)
        lines.push("  " + dim("enter save · esc cancel"))
      } else {
        const n = active.length
        lines.push("  " + dim(n >= 2 ? `fusion · ${n} models` : n === 1 ? "single model" : "no models connected"))
        lines.push("  " + dim("↑↓ move · enter on/off · f favorite · x remove key · esc done"))
      }
      let out = ""
      if (!firstTime) out += `\x1b[${drawn}A`
      out += "\r\x1b[J" + lines.join("\n")
      drawn = lines.length - 1
      stdout.write(out)
      firstTime = false
    }

    function finish() {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener("data", onData)
      stdout.write("\x1b[?25h\n") // show cursor, drop below the panel
      resolve(cfg)
    }

    const move = (d: number) => {
      const len = orderedProviders(cfg).length
      sel = (sel + d + len) % len
    }

    function onData(data: string) {
      let i = 0
      while (i < data.length) {
        const ch = data[i]

        if (mode === "input") {
          if (ch === "\x03") return finish()
          if (ch === "\r" || ch === "\n") {
            const p = orderedProviders(cfg)[sel]
            if (inputBuf.trim()) {
              cfg = setProviderKey(cfg, p, inputBuf.trim())
              saveConfig(cfg)
            }
            inputBuf = ""
            mode = "list"
            i++
            continue
          }
          if (ch === "\x1b") {
            const seq = data.slice(i)
            if (seq.startsWith("\x1b[")) {
              let j = i + 2
              while (j < data.length && !/[a-zA-Z~]/.test(data[j])) j++
              i = j + 1
            } else {
              inputBuf = ""
              mode = "list"
              i++
            }
            continue
          }
          if (ch === "\x7f" || ch === "\b") {
            inputBuf = inputBuf.slice(0, -1)
            i++
            continue
          }
          if (ch >= " ") inputBuf += ch
          i++
          continue
        }

        // list mode
        if (ch === "\x03") return finish()
        if (ch === "\r" || ch === "\n") {
          const p = orderedProviders(cfg)[sel]
          if (hasKey(cfg, p)) {
            // Toggle on/off WITHOUT discarding the key — re-enabling is instant.
            cfg = setProviderEnabled(cfg, p, !isActive(cfg, p))
            saveConfig(cfg)
          } else {
            mode = "input" // no key yet → type it inline, same panel
            inputBuf = ""
          }
          i++
          continue
        }
        if (ch === "x") {
          // Fully remove the saved key for this provider.
          const p = orderedProviders(cfg)[sel]
          if (hasKey(cfg, p)) {
            cfg = setProviderKey(cfg, p, "")
            saveConfig(cfg)
          }
          i++
          continue
        }
        if (ch === "f") {
          const p = orderedProviders(cfg)[sel]
          cfg = toggleFavorite(cfg, p)
          saveConfig(cfg)
          sel = Math.max(0, orderedProviders(cfg).indexOf(p)) // keep highlight on it
          i++
          continue
        }
        if (ch === "k") {
          move(-1)
          i++
          continue
        }
        if (ch === "j") {
          move(1)
          i++
          continue
        }
        if (ch === "\x1b") {
          const seq = data.slice(i)
          if (seq.startsWith("\x1b[A")) {
            move(-1)
            i += 3
          } else if (seq.startsWith("\x1b[B")) {
            move(1)
            i += 3
          } else if (seq === "\x1b") {
            return finish()
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

// /login — link the CLI to the user's onechater.app account. Opens the browser
// to the web /cli page; once signed in it redirects back to our loopback with a
// token (no copy-paste). Falls back to pasting a code from /cli if the loopback
// can't be reached. Either way we then pull down the account's providers/keys.
async function cmdLogin(cfg: Config): Promise<Config> {
  console.log("")
  console.log("  " + bold(white("Sign in to OneChater")))

  let token = ""
  let lb: Awaited<ReturnType<typeof createLoopback>> | null = null
  try {
    lb = await createLoopback()
  } catch {
    lb = null
  }

  const url = lb ? loginUrl(lb.port) : CLI_PAGE
  console.log("  " + dim("opening ") + white(url))
  openBrowser(url)
  console.log("  " + dim("sign in on the page — this terminal continues automatically."))

  if (lb) {
    const stopWait = startSpinner("waiting for the browser…")
    token = (await lb.waitForToken(180_000)) ?? ""
    stopWait()
    lb.close()
  }

  if (!token) {
    console.log("  " + dim(`didn't come back? open ${CLI_PAGE} and paste the code below.`))
    token = await promptText("paste your login code:")
  }
  if (!token) {
    console.log("  " + dim("login cancelled"))
    return cfg
  }

  const stop = startSpinner("linking your account…")
  try {
    const { cfg: next, email, count } = await syncFromWeb(cfg, token)
    saveConfig(next)
    stop()
    console.log(
      "  " + white("✓") + " " + bold(white("logged in")) +
        (email ? dim("  " + email) : "") +
        dim(count ? `   · synced ${count} model${count === 1 ? "" : "s"}` : "   · no models on your account yet")
    )
    const n = activeProviders(next).length
    console.log("  " + dim(n >= 2 ? `fusion · ${n} models` : n === 1 ? "single model" : "add a model with /providers"))
    return next
  } catch (err) {
    stop()
    const msg = err instanceof Error ? err.message : "unknown error"
    console.log("  " + bold(white("login failed")) + "  " + dim(msg))
    return cfg
  }
}

// /logout — unlink the web account (local provider keys are kept).
function cmdLogout(cfg: Config): Config {
  if (!cfg.web) {
    console.log("  " + dim("not logged in"))
    return cfg
  }
  const next = setWebSession(cfg, null)
  saveConfig(next)
  console.log("  " + white("✓") + " " + dim("logged out of ") + white(WEB_BASE))
  return next
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

// /model — switch a CONNECTED provider's model. Unlike /providers (which manages
// keys), this only offers providers you've actually connected, then lists THAT
// provider's own models (latest versions) to pick from — e.g. Claude → Opus 4.8
// / Sonnet 4.6 / Haiku 4.5. A "Custom…" entry still allows any model id.
async function cmdModel(cfg: Config, rest: string[]): Promise<Config> {
  let provider = rest[0]
  let model = rest.slice(1).join(" ").trim()

  // Only providers with a key — there's no point setting a model on one you
  // can't call.
  const connected = orderedProviders(cfg).filter((p) => getProviderConfig(cfg, p).apiKey.trim())
  if (!connected.length) {
    console.log("  " + dim("no models connected — use ") + white("/login") + dim(" or ") + white("/providers") + dim(" first"))
    return cfg
  }

  if (!provider || !isProvider(provider)) {
    const items = connected.map((p) => ({
      label: (isFavorite(cfg, p) ? white("★") + " " : "") + PROVIDER_NAMES[p],
      hint: modelLabel(p, getProviderConfig(cfg, p).model),
    }))
    const idx = await selectMenu("Set model for…", items)
    if (idx === null) return cfg
    provider = connected[idx]
  }
  if (!isProvider(provider)) return cfg
  if (!getProviderConfig(cfg, provider).apiKey.trim()) {
    console.log("  " + dim(`${PROVIDER_NAMES[provider]} isn't connected — add it with /providers`))
    return cfg
  }

  // No explicit model arg → show this provider's own model menu.
  if (!model) {
    const current = getProviderConfig(cfg, provider).model
    const choices = modelsFor(provider)
    const items = [
      ...choices.map((m) => ({
        label: m.label,
        hint: m.id === current ? "current" : m.id,
      })),
      { label: dim("Custom…"), hint: "type any model id" },
    ]
    const idx = await selectMenu(`${PROVIDER_NAMES[provider]} models`, items)
    if (idx === null) return cfg
    if (idx < choices.length) {
      model = choices[idx].id
    } else {
      model = await promptText(`model id for ${PROVIDER_NAMES[provider]}  (current: ${current}):`)
    }
  }

  if (!model) return cfg
  cfg = setProviderModel(cfg, provider, model)
  saveConfig(cfg)
  console.log(
    "  " + white("✓") + " " + bold(white(PROVIDER_NAMES[provider])) +
      dim("  model = ") + white(modelLabel(provider, model))
  )
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
  const rows = wordmark("  ", "OneChater")
  if (VERSION) rows[rows.length - 1] += "  " + dim("v" + VERSION)
  for (const row of rows) console.log(row)
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
    console.log(kv("tip", dim("add another model → ") + white("/providers") + dim(" → fusion")))
  } else {
    console.log(kv("mode", dim("no models connected")))
    console.log(kv("start", white("/providers") + dim("   free key: " + (FREE_KEY_URL.groq ?? ""))))
  }
  console.log(kv("memory", memory ? bold(white("on")) : dim("empty")))
  console.log(kv("tools", bold(white("on")) + dim(`   ${WORKSPACE}`)))
  // Account line: show the signed-in email (and how to sign out) when linked.
  if (cfg.web) {
    console.log(kv("account", bold(white(cfg.web.email ?? "signed in")) + dim("   /logout")))
  }

  console.log(divider())
  console.log(
    "  " +
      dim("/help") + muted("  commands   ") +
      dim("/providers") + muted("  add model   ") +
      dim("/clear") + muted("  reset   ") +
      dim("/exit") + muted("  quit")
  )
}

function printProviders(cfg: Config) {
  const active = activeProviders(cfg)
  console.log("")
  console.log("  " + bold("Providers"))
  for (const p of orderedProviders(cfg)) {
    const c = getProviderConfig(cfg, p)
    const keyed = hasKey(cfg, p)
    const on = isActive(cfg, p)
    const star = isFavorite(cfg, p) ? white("★") : " "
    const dot = on ? white("●") : keyed ? dim("◯") : dim("○")
    const name = on ? bold(white(PROVIDER_NAMES[p].padEnd(11))) : muted(PROVIDER_NAMES[p].padEnd(11))
    const note = keyed && !on ? dim(" off ") : isFree(p) ? dim(" free") : "     "
    const synth = on && p === active[0] ? "  " + dim("synth") : ""
    console.log(`  ${star} ${dot} ${name}${note}  ${dim(c.model)}${synth}`)
  }
  console.log("")
  const mode = active.length >= 2 ? `fusion · ${active.length} models` : active.length === 1 ? "single" : "none"
  console.log(kv("mode", bold(white(mode))))
  console.log("")
}

function printHelp(cfg: Config) {
  const row = (cmd: string, args: string, desc: string) =>
    "  " + white(cmd.padEnd(13)) + muted(args.padEnd(18)) + dim(desc)
  console.log("")
  console.log("  " + bold("Chat"))
  console.log("  " + dim("just type — connect 2+ models and they fuse into one answer"))
  console.log("")
  console.log("  " + bold("Commands") + dim("   (interactive — pick with ↑↓ and enter)"))
  // Auth row: when signed in show /logout with the account email; else /login.
  if (cfg.web) console.log(row("/logout", "", `sign out  (${cfg.web.email ?? "signed in"})`))
  else console.log(row("/login", "", "link your onechater.app account (syncs keys)"))
  console.log(row("/providers", "", "add/remove key, on/off + favorite (★ with f)"))
  console.log(row("/disconnect", "", "remove a model"))
  console.log(row("/model", "", "set a provider's model"))
  console.log(row("/default", "", "pick the synthesizer model"))
  console.log(row("/tools", "", "list the workspace tools"))
  console.log(row("/workspace", "", "show the workspace directory"))
  console.log(row("/audit", "", "recent tool actions log"))
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

// Read one line: the prompt sits on top with a labelled "OneChater" rule BELOW
// it. The input is the top line of the block, so every redraw only clears
// downward — which is reliable even after a terminal resize reflows the wrapped
// rule (clearing upward would need the reflowed row count, which terminals don't
// report, and that's what made resize pile up ghost rules). Node's readline
// clears the screen below on every refresh, so we drive raw mode ourselves. The
// input is kept to a single visual row (horizontal scroll, never wrapping).
// Redraws are coalesced and written atomically with the cursor hidden, removing
// key-repeat flicker. Returns null on Ctrl-C / EOF.
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
      return commandList().filter((c) => c.name.startsWith(cur))
    }

    // One rendered line per command, the selected one marked with ›.
    function paletteLines(ms: Command[]): string[] {
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
        // The input line is the TOP of the box; the rule + palette sit BELOW it.
        // So a full redraw only ever clears DOWNWARD from the cursor (\x1b[J),
        // which is reliable no matter how the terminal reflowed wrapped lines on
        // a resize. Nothing wraps above the cursor, so no stale fragments can
        // pile up. (A full-width rule ABOVE the input can't be cleared this way —
        // clearing upward needs the reflowed row count, which terminals don't
        // report reliably — so there is intentionally no top rule.)
        if (!first) out += "\r\x1b[J"
        first = false
        out += promptStr + visible + "\n" + inputFooter()
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
      // The input line is the top of the box, so a full redraw clears only
      // downward — reliable regardless of how the terminal reflowed the wrapped
      // rule/palette below. No reflow-row guessing, no stale fragments.
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
