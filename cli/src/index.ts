#!/usr/bin/env node
import { Command } from "commander"
import readline from "node:readline"
import { readFileSync } from "node:fs"
import { stdin, stdout, env } from "node:process"
import { spawnSync } from "node:child_process"
import {
  PROVIDERS,
  isProvider,
  type Provider,
  loadConfig,
  saveConfig,
  getProviderConfig,
  setProviderKey,
  setProviderModel,
  CONFIG_PATH,
  isFree,
  FREE_PROVIDERS,
  FREE_KEY_URL,
  FREE_MODELS,
  detectProviderFromKey,
  planAllows,
} from "./core/config.js"
import { runRepl } from "./core/repl.js"
import { ensureMemoryFile, loadMemory, MEMORY_PATH } from "./core/memory.js"
import {
  C,
  bar,
  bold,
  dim,
  muted,
  white,
  green,
  cyan,
  amber,
  rose,
  violet,
  gradient,
  divider,
  kv,
} from "./core/ui.js"

const ok = (s: string) => "  " + green("✓") + " " + s
const program = new Command()

let VERSION = "0.0.0"
try {
  VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version ?? VERSION
} catch {}

program
  .name("onechater")
  .description("Multi-model terminal with fusion mode and persistent memory (BYOK)")
  .version(VERSION)

// ─── chat (default) ────────────────────────────────────────────────────────
program
  .command("chat", { isDefault: true })
  .description("Start an interactive chat — or a one-shot answer with --print / a piped stdin")
  .argument("[message...]", "one-shot message; with no message it opens the interactive chat")
  .option("-p, --provider <provider>", "provider to use (defaults to configured default)")
  .option("--print", "print a single answer and exit (headless, for scripts/CI)")
  .option("--tools", "headless only: run tools and auto-approve them (use with care)")
  .action(async (message: string[], opts: { provider?: string; print?: boolean; tools?: boolean }) => {
    const cfg = loadConfig()
    let provider: Provider | undefined
    if (opts.provider) {
      if (!isProvider(opts.provider)) return die(`unknown provider: ${opts.provider}`)
      provider = opts.provider
    }

    const msg = (message ?? []).join(" ").trim()
    const piped = !stdin.isTTY
    // Headless when asked (--print), given a message, or fed data on stdin.
    if (opts.print || msg || piped) {
      const stdinText = piped ? await readAllStdin() : ""
      const prompt = [msg, stdinText.trim()].filter(Boolean).join("\n\n")
      if (!prompt) {
        // Piped but empty and no message — nothing to do.
        if (!stdin.isTTY) return
        return die("no prompt — pass a message or pipe text in")
      }
      const { runHeadless } = await import("./core/repl.js")
      await runHeadless(cfg, { provider, prompt, tools: opts.tools })
      return
    }

    await runRepl(cfg, { fusion: false, provider })
  })

// ─── fusion ──────────────────────────────────────────────────────────────────
program
  .command("fusion")
  .description("Chat with fusion mode — combine multiple models into one answer")
  .action(async () => {
    const cfg = loadConfig()
    await runRepl(cfg, { fusion: true })
  })

// ─── login (set API key) ───────────────────────────────────────────────────
program
  .command("login [provider]")
  .description("Store an API key for a provider (BYOK, saved locally)")
  .option("-o, --open", "open the provider's key page in your browser first")
  .action(async (providerArg: string | undefined, opts: { open?: boolean }) => {
    const cfg = loadConfig()
    const provider = providerArg ?? (await pick("Provider", PROVIDERS as readonly string[]))
    if (!isProvider(provider)) return die(`unknown provider: ${provider}`)

    const url = FREE_KEY_URL[provider]
    if (url) {
      console.log("  " + muted("free key ") + cyan(url))
      if (opts.open) openUrl(url)
    }
    const key = await hidden("  " + bar(C.muted) + " paste your " + bold(provider) + " API key: ")
    if (!key.trim()) return die("no key entered")

    // Guard against the classic mistake: pasting a key for a different provider.
    const detected = detectProviderFromKey(key)
    let target: Provider = provider
    if (detected && detected !== provider) {
      console.log("  " + amber("⚠ that looks like a " + bold(detected) + " key, not " + bold(provider) + "."))
      const yes = await confirm("  save it under " + detected + " instead?")
      if (yes) target = detected
    }

    saveConfig(setProviderKey(cfg, target, key.trim()))
    console.log(ok(`${bold(target)} key saved` + dim(`   ${CONFIG_PATH}`)))
  })

// ─── logout (clear API key) ──────────────────────────────────────────────────
program
  .command("logout <provider>")
  .description("Remove a stored API key")
  .action((provider: string) => {
    if (!isProvider(provider)) return die(`unknown provider: ${provider}`)
    const cfg = loadConfig()
    saveConfig(setProviderKey(cfg, provider, ""))
    console.log(ok(`${provider} key removed`))
  })

// ─── providers (status) ──────────────────────────────────────────────────────
program
  .command("providers")
  .description("List providers and their configured status")
  .action(() => {
    const cfg = loadConfig()
    console.log("\n  " + bold(gradient("Providers")) + "\n")
    for (const p of PROVIDERS) {
      const c = getProviderConfig(cfg, p)
      const dot = c.apiKey.trim() ? green("●") : dim("○")
      // Plan-locked providers (Free account) read "pro" instead of "free".
      const free = !planAllows(cfg, p) ? amber(" pro ") : isFree(p) ? green(" free") : "     "
      const def = p === cfg.defaultProvider ? "  " + cyan("default") : ""
      const inFusion = cfg.fusionSet.includes(p) ? "  " + violet("fusion") : ""
      const name = c.apiKey.trim() ? white(p.padEnd(12)) : muted(p.padEnd(12))
      console.log(`  ${dot} ${name}${free}  ${dim(c.model)}${def}${inFusion}`)
    }
    console.log("\n" + kv("synth", violet(cfg.fusionSynthesizer)))
    console.log(kv("free", green(FREE_PROVIDERS.join(" · "))) + "\n")
  })

// ─── config ──────────────────────────────────────────────────────────────────
const config = program.command("config").description("View or change CLI settings")

config
  .command("show")
  .description("Print the current config path and values")
  .action(() => {
    const cfg = loadConfig()
    console.log(dim(CONFIG_PATH))
    console.log(JSON.stringify(cfg, null, 2))
  })

config
  .command("default <provider>")
  .description("Set the default provider for `chat`")
  .action((provider: string) => {
    if (!isProvider(provider)) return die(`unknown provider: ${provider}`)
    const cfg = loadConfig()
    saveConfig({ ...cfg, defaultProvider: provider })
    console.log(ok(`default provider = ${cyan(provider)}`))
  })

config
  .command("model <provider> <model>")
  .description("Set the model for a provider")
  .action((provider: string, model: string) => {
    if (!isProvider(provider)) return die(`unknown provider: ${provider}`)
    const cfg = loadConfig()
    saveConfig(setProviderModel(cfg, provider, model))
    console.log(ok(`${provider} model = ${cyan(model)}`))
  })

config
  .command("fusion-set <providers...>")
  .description("Set which providers fusion combines (space-separated)")
  .action((providers: string[]) => {
    const bad = providers.filter((p) => !isProvider(p))
    if (bad.length) return die(`unknown provider(s): ${bad.join(", ")}`)
    const cfg = loadConfig()
    saveConfig({ ...cfg, fusionSet: providers as Provider[] })
    console.log(ok(`fusion set = ${violet(providers.join(" · "))}`))
  })

config
  .command("fusion-synth <provider>")
  .description("Set the model that synthesizes the fused answer")
  .action((provider: string) => {
    if (!isProvider(provider)) return die(`unknown provider: ${provider}`)
    const cfg = loadConfig()
    saveConfig({ ...cfg, fusionSynthesizer: provider })
    console.log(ok(`fusion synthesizer = ${violet(provider)}`))
  })

// ─── memory ──────────────────────────────────────────────────────────────────
const memory = program.command("memory").description("Manage the persistent memory profile")

memory
  .command("edit", { isDefault: true })
  .description("Open the memory profile in your $EDITOR")
  .action(() => {
    const path = ensureMemoryFile()
    const editor = env.EDITOR || env.VISUAL || (process.platform === "win32" ? "notepad" : "nano")
    const r = spawnSync(editor, [path], { stdio: "inherit", shell: true })
    if (r.error) {
      console.log(amber(`couldn't open editor (${editor}). Edit manually:`))
      console.log(dim(path))
    }
  })

memory
  .command("show")
  .description("Print the current memory profile")
  .action(() => {
    const m = loadMemory()
    console.log(m.trim() ? m : dim(`(empty) — run: onechater memory edit\n${MEMORY_PATH}`))
  })

memory
  .command("path")
  .description("Print the memory file path")
  .action(() => console.log(MEMORY_PATH))

// ─── chats (saved conversations) ─────────────────────────────────────────────
const chats = program.command("chats").description("Manage saved chats")

chats
  .command("list", { isDefault: true })
  .description("List saved chats")
  .action(async () => {
    const { listChats, relTime, CHATS_DIR } = await import("./core/chats.js")
    const metas = listChats()
    if (!metas.length) return console.log(dim("no saved chats — use /save inside the terminal"))
    console.log("")
    for (const m of metas) {
      console.log(
        "  " + bar(C.muted) + " " + bold(white(m.name)) +
          dim(`   ${m.slug} · ${m.turnCount} turn${m.turnCount === 1 ? "" : "s"} · ${relTime(m.updatedAt)}`)
      )
    }
    console.log("\n" + dim(`  ${CHATS_DIR}\n`))
  })

chats
  .command("show <slug>")
  .description("Print a saved chat")
  .action(async (slug: string) => {
    const { loadChat } = await import("./core/chats.js")
    const c = loadChat(slug)
    if (!c) return die(`no saved chat: ${slug}`)
    console.log("\n  " + bold(white(c.name)) + dim(`   ${c.turns.length} turns\n`))
    for (const t of c.turns) {
      console.log("  " + bold(white("you")) + "  " + t.user)
      console.log("  " + muted("ai") + "   " + t.assistant.split("\n").join("\n       ") + "\n")
    }
  })

chats
  .command("delete <slug>")
  .description("Delete a saved chat")
  .action(async (slug: string) => {
    const { deleteChat } = await import("./core/chats.js")
    if (deleteChat(slug)) console.log(ok(`deleted ${slug}`))
    else die(`no saved chat: ${slug}`)
  })

// ─── mcp (Model Context Protocol servers) ────────────────────────────────────
const mcp = program.command("mcp").description("Manage MCP servers (tools the models can call)")

mcp
  .command("list", { isDefault: true })
  .description("List configured MCP servers")
  .action(async () => {
    const { loadMcpConfig, ensureMcpConfigFile, MCP_CONFIG_PATH } = await import("./core/mcp.js")
    const servers = Object.entries(loadMcpConfig().mcpServers)
    if (!servers.length) {
      ensureMcpConfigFile()
      console.log(dim(`no MCP servers configured — edit ${MCP_CONFIG_PATH} (mcpServers), then run onechater`))
      return
    }
    console.log("\n  " + bold(gradient("MCP servers")) + dim(`   ${MCP_CONFIG_PATH}\n`))
    for (const [name, sc] of servers) {
      const off = sc.disabled ? dim(" (disabled)") : ""
      const where = sc.url ? sc.url : [sc.command, ...(sc.args ?? [])].filter(Boolean).join(" ")
      console.log("  " + bar(C.muted) + " " + bold(white(name)) + off)
      console.log("    " + dim(where))
    }
    console.log("")
  })

mcp
  .command("path")
  .description("Print the MCP config path (creates a starter file)")
  .action(async () => {
    const { ensureMcpConfigFile } = await import("./core/mcp.js")
    console.log(ensureMcpConfigFile())
  })

// ─── skills ───────────────────────────────────────────────────────────────────
const skills = program.command("skills").description("Manage skills (reusable instruction sets)")

skills
  .command("list", { isDefault: true })
  .description("List available skills")
  .action(async () => {
    const { listSkills, ensureSkillsDir, SKILLS_DIR } = await import("./core/skills.js")
    const all = listSkills()
    if (!all.length) {
      ensureSkillsDir()
      console.log(dim(`no skills yet — add a folder with a SKILL.md under ${SKILLS_DIR}`))
      return
    }
    console.log("\n  " + bold(gradient("Skills")) + dim(`   ${SKILLS_DIR}\n`))
    for (const s of all) {
      console.log("  " + bar(C.muted) + " " + bold(white(s.name)) + dim(`   ${s.description}`))
    }
    console.log("")
  })

skills
  .command("path")
  .description("Print the skills directory (creates it with a starter skill)")
  .action(async () => {
    const { ensureSkillsDir } = await import("./core/skills.js")
    console.log(ensureSkillsDir())
  })

// ─── models (free model catalog) ─────────────────────────────────────────────
program
  .command("models")
  .description("List free models you can use without a credit card")
  .action(() => {
    console.log("\n  " + bold(gradient("Free models")) + dim("   no credit card\n"))
    for (const p of FREE_PROVIDERS) {
      console.log("  " + bar(C.muted) + " " + cyan(p) + dim(`   ${FREE_KEY_URL[p] ?? ""}`))
      for (const m of FREE_MODELS[p] ?? []) console.log("    " + muted("·") + " " + white(m))
      console.log("")
    }
    console.log(dim("  set one: ") + white("onechater config model <provider> <model>") + "\n")
  })

// ─── keys (free key onboarding) ───────────────────────────────────────────────
program
  .command("keys")
  .description("Show where to get FREE API keys and how to add them")
  .option("-o, --open", "open all free-key pages in your browser")
  .action((opts: { open?: boolean }) => {
    console.log("\n  " + bold(gradient("Free API keys")) + dim("   no credit card needed\n"))
    FREE_PROVIDERS.forEach((p, i) => {
      const url = FREE_KEY_URL[p] ?? ""
      console.log("  " + bar(C.muted) + " " + bold(white(`${i + 1}. ${p}`)))
      console.log("    " + muted("get key  ") + cyan(url))
      console.log("    " + muted("add it   ") + white(`onechater login ${p}`))
      console.log("")
      if (opts.open && url) openUrl(url)
    })
    console.log(dim("  tip: ") + white("onechater login groq --open") + dim("  opens the page + prompts.\n"))
  })

program.parseAsync().catch((err) => die(err instanceof Error ? err.message : String(err)))

// ─── helpers ──────────────────────────────────────────────────────────────────
// Open a URL in the OS default browser.
function openUrl(url: string) {
  const cmd =
    process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open"
  // On Windows `start` needs an empty title arg and runs via the shell.
  const args = process.platform === "win32" ? ["", url] : [url]
  try {
    spawnSync(cmd, args, { stdio: "ignore", shell: true })
  } catch {}
}

function die(msg: string): never {
  console.error("  " + rose("✗") + " " + msg)
  process.exit(1)
}

// Drain all of stdin (used when text is piped in for a headless one-shot).
function readAllStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = ""
    stdin.setEncoding("utf8")
    stdin.on("data", (c) => (data += c))
    stdin.on("end", () => resolve(data))
    stdin.on("error", () => resolve(data))
  })
}

// Read a line with the input masked — for API keys.
function hidden(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: stdin, output: stdout })
    const out = rl as unknown as { _writeToOutput: (s: string) => void }
    const original = out._writeToOutput.bind(out)
    let first = true
    out._writeToOutput = (s: string) => {
      if (first) {
        original(s)
        first = false
      } else if (s.includes("\n")) {
        original("\n")
      }
      // swallow echoed key characters
    }
    rl.question(promptText, (answer) => {
      rl.close()
      stdout.write("\n")
      resolve(answer)
    })
  })
}

// Yes/no prompt; defaults to yes on empty input.
function confirm(promptText: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: stdin, output: stdout })
    rl.question(cyan(`${promptText} `) + dim("[Y/n] "), (a) => {
      rl.close()
      const v = a.trim().toLowerCase()
      resolve(v === "" || v === "y" || v === "yes")
    })
  })
}

// Numbered picker for when an arg is omitted.
function pick(label: string, options: readonly string[]): Promise<string> {
  console.log("\n  " + bold(label))
  options.forEach((o, i) => console.log("  " + muted(`${i + 1}`) + " " + white(o)))
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: stdin, output: stdout })
    rl.question("  " + bar(C.muted) + " ", (a) => {
      rl.close()
      const idx = parseInt(a.trim(), 10) - 1
      resolve(options[idx] ?? a.trim())
    })
  })
}
