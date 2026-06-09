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

// The pickable models per provider — latest versions, mirroring the web app's
// model menu (CFG.*.models) so `/model` offers the same curated choices. The
// list isn't exhaustive: `/model` also lets the user type any model id by hand.
export type ModelChoice = { id: string; label: string }

export const PROVIDER_MODELS: Record<Provider, ModelChoice[]> = {
  openai: [
    { id: "gpt-5.5", label: "GPT-5.5" },
    { id: "gpt-5.4", label: "GPT-5.4" },
    { id: "gpt-5.4-mini", label: "GPT-5.4 mini" },
  ],
  anthropic: [
    { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
  google: [
    { id: "gemini-3-pro-preview", label: "Gemini 3 Pro" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
    { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
    { id: "moonshotai/kimi-k2-instruct", label: "Kimi K2" },
  ],
  // Every free model on OpenRouter (text output), from openrouter.ai/collections/
  // free-models. `/model` also accepts any custom id via the "Custom…" entry.
  openrouter: [
    { id: "openrouter/free", label: "Free Models Router (free)" },
    { id: "google/gemma-4-26b-a4b-it:free", label: "Google: Gemma 4 26B A4B (free)" },
    { id: "google/gemma-4-31b-it:free", label: "Google: Gemma 4 31B (free)" },
    { id: "liquid/lfm-2.5-1.2b-instruct:free", label: "LiquidAI: LFM2.5-1.2B-Instruct (free)" },
    { id: "liquid/lfm-2.5-1.2b-thinking:free", label: "LiquidAI: LFM2.5-1.2B-Thinking (free)" },
    { id: "meta-llama/llama-3.2-3b-instruct:free", label: "Meta: Llama 3.2 3B Instruct (free)" },
    { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Meta: Llama 3.3 70B Instruct (free)" },
    { id: "moonshotai/kimi-k2.6:free", label: "MoonshotAI: Kimi K2.6 (free)" },
    { id: "nex-agi/nex-n2-pro:free", label: "Nex AGI: Nex-N2-Pro (free)" },
    { id: "nousresearch/hermes-3-llama-3.1-405b:free", label: "Nous: Hermes 3 405B Instruct (free)" },
    { id: "nvidia/nemotron-3-nano-30b-a3b:free", label: "NVIDIA: Nemotron 3 Nano 30B A3B (free)" },
    { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", label: "NVIDIA: Nemotron 3 Nano Omni (free)" },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "NVIDIA: Nemotron 3 Super (free)" },
    { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "NVIDIA: Nemotron 3 Ultra (free)" },
    { id: "nvidia/nemotron-3.5-content-safety:free", label: "NVIDIA: Nemotron 3.5 Content Safety (free)" },
    { id: "nvidia/nemotron-nano-12b-v2-vl:free", label: "NVIDIA: Nemotron Nano 12B 2 VL (free)" },
    { id: "nvidia/nemotron-nano-9b-v2:free", label: "NVIDIA: Nemotron Nano 9B V2 (free)" },
    { id: "openai/gpt-oss-120b:free", label: "OpenAI: gpt-oss-120b (free)" },
    { id: "openai/gpt-oss-20b:free", label: "OpenAI: gpt-oss-20b (free)" },
    { id: "openrouter/owl-alpha", label: "Owl Alpha (free)" },
    { id: "poolside/laguna-m.1:free", label: "Poolside: Laguna M.1 (free)" },
    { id: "poolside/laguna-xs.2:free", label: "Poolside: Laguna XS.2 (free)" },
    { id: "qwen/qwen3-coder:free", label: "Qwen: Qwen3 Coder 480B A35B (free)" },
    { id: "qwen/qwen3-next-80b-a3b-instruct:free", label: "Qwen: Qwen3 Next 80B A3B Instruct (free)" },
    { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", label: "Venice: Uncensored (free)" },
    { id: "z-ai/glm-4.5-air:free", label: "Z.ai: GLM 4.5 Air (free)" },
  ],
  xai: [
    { id: "grok-4.3", label: "Grok 4.3" },
    { id: "grok-4-0709", label: "Grok 4" },
    { id: "grok-3", label: "Grok 3" },
  ],
  mistral: [
    { id: "mistral-large-latest", label: "Mistral Large 3" },
    { id: "mistral-medium-latest", label: "Mistral Medium 3.5" },
    { id: "mistral-small-latest", label: "Mistral Small" },
    { id: "codestral-latest", label: "Codestral" },
  ],
  deepseek: [
    { id: "deepseek-chat", label: "DeepSeek V4" },
    { id: "deepseek-reasoner", label: "DeepSeek V4 Reasoner" },
  ],
  perplexity: [
    { id: "sonar-pro", label: "Sonar Pro" },
    { id: "sonar", label: "Sonar" },
    { id: "sonar-reasoning-pro", label: "Sonar Reasoning Pro" },
    { id: "sonar-reasoning", label: "Sonar Reasoning" },
  ],
  together: [
    { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "Llama 3.3 70B Turbo" },
    { id: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3" },
    { id: "Qwen/Qwen2.5-72B-Instruct-Turbo", label: "Qwen2.5 72B Turbo" },
    { id: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo", label: "Llama 3.1 405B Turbo" },
  ],
  fireworks: [
    { id: "accounts/fireworks/models/llama-v3p3-70b-instruct", label: "Llama 3.3 70B" },
    { id: "accounts/fireworks/models/deepseek-v3", label: "DeepSeek V3" },
    { id: "accounts/fireworks/models/qwen2p5-72b-instruct", label: "Qwen2.5 72B" },
  ],
  cerebras: [
    { id: "llama-3.3-70b", label: "Llama 3.3 70B" },
    { id: "llama3.1-8b", label: "Llama 3.1 8B" },
    { id: "qwen-3-32b", label: "Qwen 3 32B" },
    { id: "gpt-oss-120b", label: "GPT-OSS 120B" },
  ],
  moonshot: [
    { id: "kimi-k2-0905-preview", label: "Kimi K2" },
    { id: "moonshot-v1-128k", label: "Moonshot v1 128k" },
    { id: "moonshot-v1-32k", label: "Moonshot v1 32k" },
    { id: "moonshot-v1-8k", label: "Moonshot v1 8k" },
  ],
  qwen: [
    { id: "qwen-max", label: "Qwen Max" },
    { id: "qwen-plus", label: "Qwen Plus" },
    { id: "qwen-turbo", label: "Qwen Turbo" },
    { id: "qwen2.5-72b-instruct", label: "Qwen2.5 72B" },
  ],
  cohere: [
    { id: "command-a-03-2025", label: "Command A" },
    { id: "command-r-plus-08-2024", label: "Command R+" },
    { id: "command-r-08-2024", label: "Command R" },
  ],
}

export const modelsFor = (p: Provider): ModelChoice[] => PROVIDER_MODELS[p] ?? []

// Pretty label for a model id (falls back to the raw id for custom models).
export const modelLabel = (p: Provider, id: string): string =>
  modelsFor(p).find((m) => m.id === id)?.label ?? id

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
    "openrouter/free",
    "google/gemma-4-26b-a4b-it:free",
    "google/gemma-4-31b-it:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "liquid/lfm-2.5-1.2b-thinking:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "moonshotai/kimi-k2.6:free",
    "nex-agi/nex-n2-pro:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidia/nemotron-3.5-content-safety:free",
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-20b:free",
    "openrouter/owl-alpha",
    "poolside/laguna-m.1:free",
    "poolside/laguna-xs.2:free",
    "qwen/qwen3-coder:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    "z-ai/glm-4.5-air:free",
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

// Whether a provider has an API key saved (regardless of enabled state).
export const hasKey = (cfg: Config, p: Provider) =>
  getProviderConfig(cfg, p).apiKey.trim().length > 0

// Whether a provider is "on": it has a key AND hasn't been toggled off. A
// provider can keep its key while disabled — disabling never discards the key.
export const isActive = (cfg: Config, p: Provider) => {
  const c = getProviderConfig(cfg, p)
  return c.apiKey.trim().length > 0 && c.enabled !== false
}

// Every provider that's on (key present + enabled). This is the set that "thinks
// together": with 2+ the CLI runs fusion automatically, exactly like the web app
// combining every active model. Ordered with the default provider first so it
// acts as the synthesizer.
export function activeProviders(cfg: Config): Provider[] {
  const connected = PROVIDERS.filter((p) => isActive(cfg, p))
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

// Toggle a provider on/off WITHOUT touching its API key. Re-enabling restores it
// instantly — no need to paste the key again.
export function setProviderEnabled(cfg: Config, p: Provider, enabled: boolean): Config {
  const existing = getProviderConfig(cfg, p)
  return {
    ...cfg,
    providers: { ...cfg.providers, [p]: { ...existing, enabled } },
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
