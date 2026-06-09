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
  "perplexity",
  "together",
  "fireworks",
  "cerebras",
  "moonshot",
  "qwen",
  "cohere",
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
  perplexity: "Perplexity",
  together: "Together",
  fireworks: "Fireworks",
  cerebras: "Cerebras",
  moonshot: "Kimi",
  qwen: "Qwen",
  cohere: "Command",
}

// Providers that have a usable free tier / free models. Surfaced in the UI so a
// dev with no budget can get started immediately.
export const FREE_PROVIDERS: Provider[] = ["groq", "google", "openrouter", "cerebras"]
export const isFree = (p: Provider) => FREE_PROVIDERS.includes(p)

// Where to grab a free key for each free provider — shown in `login`/`providers`.
export const FREE_KEY_URL: Partial<Record<Provider, string>> = {
  groq: "https://console.groq.com/keys",
  google: "https://aistudio.google.com/apikey",
  openrouter: "https://openrouter.ai/keys",
  cerebras: "https://cloud.cerebras.ai",
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
  if (k.startsWith("pplx-")) return "perplexity"
  if (k.startsWith("fw_")) return "fireworks"
  if (k.startsWith("csk-")) return "cerebras"
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
  perplexity: "sonar-pro",
  together: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  fireworks: "accounts/fireworks/models/llama-v3p3-70b-instruct",
  cerebras: "llama-3.3-70b",
  moonshot: "kimi-k2-0905-preview",
  qwen: "qwen-max",
  cohere: "command-a-03-2025",
}

// A short menu of free models per free provider, for `onechater models`.
export const FREE_MODELS: Partial<Record<Provider, string[]>> = {
  groq: [
    // OpenAI open-weight (GPT-OSS)
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    // Llama
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    // Others
    "moonshotai/kimi-k2-instruct",
    "qwen/qwen3-32b",
    "deepseek-r1-distill-llama-70b",
    "gemma2-9b-it",
    "allam-2-7b",
  ],
  google: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"],
  cerebras: ["llama-3.3-70b", "llama3.1-8b", "qwen-3-32b", "gpt-oss-120b"],
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
  // Providers the user pinned as favorites. They float to the top of every
  // provider menu (in this order) so the ones they use most are one keystroke
  // away even as the provider list grows.
  favorites: Provider[]
  // OneChater web session (set by `/login`). When present, the CLI is linked to
  // the user's onechater.app account and can sync their connected providers.
  web?: WebSession
}

export type WebSession = {
  token: string
  email?: string
}

const DIR = join(homedir(), ".onechater")
const CONFIG_PATH = join(DIR, "config.json")

const DEFAULT_CONFIG: Config = {
  defaultProvider: "openai",
  fusionSet: ["openai", "anthropic", "google"],
  fusionSynthesizer: "anthropic",
  providers: {},
  favorites: [],
}

function ensureDir() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true })
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG }
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8"))
    return {
      ...DEFAULT_CONFIG,
      ...raw,
      providers: raw.providers ?? {},
      favorites: Array.isArray(raw.favorites) ? raw.favorites.filter(isProvider) : [],
    }
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

export const isFavorite = (cfg: Config, p: Provider) =>
  (cfg.favorites ?? []).includes(p)

// Pin/unpin a provider as favorite. Pinning appends (preserving the order the
// user starred them in); unpinning removes it.
export function toggleFavorite(cfg: Config, p: Provider): Config {
  const favs = cfg.favorites ?? []
  return {
    ...cfg,
    favorites: favs.includes(p) ? favs.filter((x) => x !== p) : [...favs, p],
  }
}

// Every provider, favorites first (in the order they were pinned), then the
// rest in their canonical order. The single source of truth for menu ordering.
export function orderedProviders(cfg: Config): Provider[] {
  const favs = (cfg.favorites ?? []).filter(isProvider)
  return [...favs, ...PROVIDERS.filter((p) => !favs.includes(p))]
}

export function setProviderModel(cfg: Config, p: Provider, model: string): Config {
  const existing = getProviderConfig(cfg, p)
  return {
    ...cfg,
    providers: { ...cfg.providers, [p]: { ...existing, model } },
  }
}

// Save / clear the OneChater web session created by `/login`.
export function setWebSession(cfg: Config, web: WebSession | null): Config {
  const next = { ...cfg }
  if (web) next.web = web
  else delete next.web
  return next
}

export const CONFIG_DIR = DIR
export { CONFIG_PATH }
