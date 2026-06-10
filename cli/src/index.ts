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
  .description("Start an interactive chat with one model")
  .option("-p, --provider <provider>", "provider to use (defaults to configured default)")
  .action(async (opts: { provider?: string }) => {
    const cfg = loadConfig()
    let provider: Provider | undefined
    if (opts.provider) {
      if (!isProvider(opts.provider)) return die(`unknown provider: ${opts.provider}`)
      provider = opts.provider
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
      const free = isFree(p) ? green(" free") : "     "
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
