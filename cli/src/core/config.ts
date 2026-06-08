import { homedir } from "node:os"
import { join } from "node:path"
import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs"

// All CLI state lives under ~/.onechater. Keys are stored locally (BYOK), the
// same way aider/claude-code keep credentials on the dev machine. No server
// round-trip is needed to chat — the CLI talks to provider APIs directly.

export const PROVIDERS = [
  "openai",
  "anthropic",
  "google",
  "groq",
  "openrouter",
  "xai",
  "mistral",
  "deepseek",
] as const

export type Provider = (typeof PROVIDERS)[number]

export const isProvider = (p: string): p is Provider =>
  (PROVIDERS as readonly string[]).includes(p)

// Human display names, matching the web app's CFG[p].name — used in the
// multi-model system prompt and fusion attribution so the models refer to each
// other the same way as on the website.
export const PROVIDER_NAMES: Record<Provider, string> = {
  openai: "GPT",
  anthropic: "Claude",
  google: "Gemini",
  groq: "Llama",
  openrouter: "OpenRouter",
  xai: "Grok",
  mistral: "Mistral",
  deepseek: "DeepSeek",
}

// Providers that have a usable free tier / free models. Surfaced in the UI so a
// dev with no budget can get started immediately.
export const FREE_PROVIDERS: Provider[] = ["groq", "google", "openrouter"]
export const isFree = (p: Provider) => FREE_PROVIDERS.includes(p)

// Where to grab a free key for each free provider — shown in `login`/`providers`.
export const FREE_KEY_URL: Partial<Record<Provider, string>> = {
  groq: "https://console.groq.com/keys",
  google: "https://aistudio.google.com/apikey",
  openrouter: "https://openrouter.ai/keys",
}

// Guess the provider from an API key's prefix. Used to warn when a key is being
// saved under the wrong provider (e.g. a `gsk_` Groq key stored as openai).
// Returns null when the prefix is ambiguous (sk- is shared by OpenAI/DeepSeek).
export function detectProviderFromKey(key: string): Provider | null {
  const k = key.trim()
  if (k.startsWith("gsk_")) return "groq"
  if (k.startsWith("sk-ant-")) return "anthropic"
  if (k.startsWith("sk-or-")) return "openrouter"
  if (k.startsWith("xai-")) return "xai"
  if (k.startsWith("AIza")) return "google"
  return null
}

// Sensible default model per provider when the user hasn't picked one. Free
// providers default to a strong free model.
export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-5.5",
  anthropic: "claude-sonnet-4-6",
  google: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
  openrouter: "nvidia/nemotron-3-super-120b-a12b:free",
  xai: "grok-4.3",
  mistral: "mistral-large-latest",
  deepseek: "deepseek-chat",
}

// A short menu of free models per free provider, for `onechater models`.
export const FREE_MODELS: Partial<Record<Provider, string[]>> = {
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "openai/gpt-oss-120b",
    "moonshotai/kimi-k2-instruct",
    "qwen/qwen3-32b",
  ],
  google: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"],
  openrouter: [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "deepseek/deepseek-r1:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen3-235b-a22b:free",
  ],
}

export type ProviderConfig = {
  apiKey: string
  model: string
  enabled: boolean
}

export type Config = {
  // The provider used for a plain `onechater chat`.
  defaultProvider: Provider
  // Providers combined when running `onechater fusion`.
  fusionSet: Provider[]
  // The provider that synthesizes the fused answer.
  fusionSynthesizer: Provider
  providers: Partial<Record<Provider, ProviderConfig>>
}

const DIR = join(homedir(), ".onechater")
const CONFIG_PATH = join(DIR, "config.json")

const DEFAULT_CONFIG: Config = {
  defaultProvider: "openai",
  fusionSet: ["openai", "anthropic", "google"],
  fusionSynthesizer: "anthropic",
  providers: {},
}

function ensureDir() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true })
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG }
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8"))
    return { ...DEFAULT_CONFIG, ...raw, providers: raw.providers ?? {} }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(cfg: Config) {
  ensureDir()
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8")
  // Best-effort: keys are sensitive, lock the file down on POSIX. No-op on Win.
  try {
    chmodSync(CONFIG_PATH, 0o600)
  } catch {}
}

// Every provider the user has connected (has an API key for). This is the set
// that "thinks together": with 2+ the CLI runs fusion automatically, exactly
// like the web app combining every active model. Ordered with the default
// provider first so it acts as the synthesizer.
export function activeProviders(cfg: Config): Provider[] {
  const connected = PROVIDERS.filter((p) => getProviderConfig(cfg, p).apiKey.trim())
  const def = cfg.defaultProvider
  return connected.includes(def)
    ? [def, ...connected.filter((p) => p !== def)]
    : connected
}

export function getProviderConfig(cfg: Config, p: Provider): ProviderConfig {
  return (
    cfg.providers[p] ?? { apiKey: "", model: DEFAULT_MODELS[p], enabled: false }
  )
}

export function setProviderKey(cfg: Config, p: Provider, apiKey: string): Config {
  const existing = getProviderConfig(cfg, p)
  return {
    ...cfg,
    providers: {
      ...cfg.providers,
      [p]: { ...existing, apiKey, enabled: apiKey.trim().length > 0 },
    },
  }
}

export function setProviderModel(cfg: Config, p: Provider, model: string): Config {
  const existing = getProviderConfig(cfg, p)
  return {
    ...cfg,
    providers: { ...cfg.providers, [p]: { ...existing, model } },
  }
}

export const CONFIG_DIR = DIR
export { CONFIG_PATH }
