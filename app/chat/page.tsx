"use client"

import { useState, useEffect, useRef, useCallback, useMemo, KeyboardEvent } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import ThemeToggle from "../components/ThemeToggle"
import OneChatLogo from "../components/OneChatLogo"

// ─── Types ────────────────────────────────────────────────────────────────────

type Provider = "openai" | "anthropic" | "google" | "groq" | "openrouter" | "xai" | "mistral" | "deepseek"

interface ModelResponseState {
  content: string
  loading: boolean
  done: boolean
  error?: string
  phase?: "collecting" | "synthesizing"
}

interface ConversationTurn {
  id: string
  userMessage: string
  images?: string[] // data URLs the user attached for vision models
  responses: Partial<Record<Provider, ModelResponseState>>
  isFusion?: boolean
  fusedResponse?: ModelResponseState
}

interface ChatSession {
  id: string
  title: string
  folderId?: string | null
  createdAt: number
  updatedAt: number
  turns?: ConversationTurn[]
}

// A user-created folder that groups chat sessions.
interface Folder {
  id: string
  name: string
  color?: string | null
  createdAt: number
  updatedAt: number
}

// ─── Provider configs ─────────────────────────────────────────────────────────

const PROVIDERS: Provider[] = ["openai", "anthropic", "google", "groq", "openrouter", "xai", "mistral", "deepseek"]

// Providers whose free tier / free models let you use them at no cost (you only
// pay if you opt into bigger paid models). The Free plan can bring keys for
// these; the rest require a paid plan. Demo keys are always exempt.
const FREE_PROVIDERS: Provider[] = ["groq", "openrouter", "mistral", "google"]
const providerLocked = (p: Provider, plan: string, key?: string) =>
  plan === "free" && key !== "demo" && !FREE_PROVIDERS.includes(p)

const CFG = {
  openai: {
    name: "GPT-5",
    label: "OpenAI",
    defaultModel: "gpt-5.5",
    models: [
      { id: "gpt-5.5", label: "GPT-5.5" },
      { id: "gpt-5.4", label: "GPT-5.4" },
      { id: "gpt-5.4-mini", label: "GPT-5.4 mini" },
    ],
    color: "#10b981",
    colorLight: "rgba(16,185,129,0.1)",
    colorBorder: "rgba(16,185,129,0.25)",
    dot: "bg-emerald-400",
    Logo: ({ size = 12 }: { size?: number }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size }}>
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.843-3.369 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.677a.79.79 0 0 0-.402-.677zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    ),
  },
  anthropic: {
    name: "Claude",
    label: "Anthropic",
    defaultModel: "claude-sonnet-4-6",
    models: [
      { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
    color: "#f97316",
    colorLight: "rgba(249,115,22,0.1)",
    colorBorder: "rgba(249,115,22,0.25)",
    dot: "bg-orange-400",
    Logo: ({ size = 12 }: { size?: number }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size }}>
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
      </svg>
    ),
  },
  google: {
    name: "Gemini",
    label: "Google",
    defaultModel: "gemini-2.5-flash",
    models: [
      { id: "gemini-3-pro-preview", label: "Gemini 3 Pro" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    ],
    color: "#3b82f6",
    colorLight: "rgba(59,130,246,0.1)",
    colorBorder: "rgba(59,130,246,0.25)",
    dot: "bg-blue-400",
    Logo: ({ size = 12 }: { size?: number }) => (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  groq: {
    name: "Groq",
    label: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
    ],
    color: "#f55036",
    colorLight: "rgba(245,80,54,0.1)",
    colorBorder: "rgba(245,80,54,0.25)",
    dot: "bg-orange-500",
    Logo: ({ size = 12 }: { size?: number }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z" />
      </svg>
    ),
  },
  openrouter: {
    name: "OpenRouter",
    label: "OpenRouter",
    defaultModel: "nvidia/nemotron-3-super-120b-a12b:free",
    models: [
      { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron 120B" },
      { id: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B" },
      { id: "google/gemma-2-9b-it:free", label: "Gemma 2 9B" },
      { id: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B" },
    ],
    color: "#8b5cf6",
    colorLight: "rgba(139,92,246,0.1)",
    colorBorder: "rgba(139,92,246,0.25)",
    dot: "bg-violet-500",
    Logo: ({ size = 12 }: { size?: number }) => (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }}>
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  xai: {
    name: "Grok",
    label: "xAI",
    defaultModel: "grok-4.3",
    models: [
      { id: "grok-4.3", label: "Grok 4.3" },
      { id: "grok-4-0709", label: "Grok 4" },
      { id: "grok-3", label: "Grok 3" },
    ],
    color: "#0f0f0f",
    colorLight: "rgba(15,15,15,0.07)",
    colorBorder: "rgba(15,15,15,0.2)",
    dot: "bg-gray-900",
    Logo: ({ size = 12 }: { size?: number }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size }}>
        <path d="M13.544 10.62 20.437 2h-1.633l-5.96 6.98L8.33 2H3l7.232 10.512L3 22h1.633l6.327-7.407L15.67 22H21z" />
      </svg>
    ),
  },
  mistral: {
    name: "Mistral",
    label: "Mistral",
    defaultModel: "mistral-large-latest",
    models: [
      { id: "mistral-large-latest", label: "Mistral Large 3" },
      { id: "mistral-medium-latest", label: "Mistral Medium 3.5" },
      { id: "mistral-small-latest", label: "Mistral Small" },
      { id: "codestral-latest", label: "Codestral" },
    ],
    color: "#ff7000",
    colorLight: "rgba(255,112,0,0.09)",
    colorBorder: "rgba(255,112,0,0.25)",
    dot: "bg-orange-500",
    Logo: ({ size = 12 }: { size?: number }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size }}>
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9.5" y="2" width="5" height="5" rx="1" />
        <rect x="17" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9.5" width="5" height="5" rx="1" opacity="0.5" />
        <rect x="17" y="9.5" width="5" height="5" rx="1" opacity="0.5" />
        <rect x="2" y="17" width="5" height="5" rx="1" />
        <rect x="9.5" y="17" width="5" height="5" rx="1" />
        <rect x="17" y="17" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  deepseek: {
    name: "DeepSeek",
    label: "DeepSeek",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "DeepSeek V4" },
      { id: "deepseek-reasoner", label: "DeepSeek V4 Reasoner" },
    ],
    color: "#4D6BFE",
    colorLight: "rgba(77,107,254,0.09)",
    colorBorder: "rgba(77,107,254,0.25)",
    dot: "bg-blue-500",
    Logo: ({ size = 12 }: { size?: number }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    ),
  },
} as const

// Short, human descriptions shown under each model in the picker (menu style).
const MODEL_DESC: Record<string, string> = {
  "gpt-5.5": "OpenAI's most capable model",
  "gpt-5.4": "Balance of quality and cost",
  "gpt-5.4-mini": "Fast and affordable",
  "claude-opus-4-8": "Claude's maximum capability",
  "claude-sonnet-4-6": "The ideal everyday balance",
  "claude-haiku-4-5-20251001": "Fastest for short answers",
  "gemini-3-pro-preview": "Google's advanced reasoning",
  "gemini-2.5-pro": "Powerful for complex tasks",
  "gemini-2.5-flash": "Fast and multimodal",
  "llama-3.3-70b-versatile": "Versatile, very fast on Groq",
  "openai/gpt-oss-120b": "Large open model",
  "llama-3.1-8b-instant": "Ultra-fast for simple tasks",
  "grok-4.3": "The latest from xAI",
  "grok-4-0709": "Grok 4 standard",
  "grok-3": "Previous generation, affordable",
  "mistral-large-latest": "Mistral's most capable model",
  "mistral-medium-latest": "Balanced",
  "mistral-small-latest": "Light and fast",
  "codestral-latest": "Specialized in code",
  "deepseek-chat": "General conversation",
  "deepseek-reasoner": "Deep step-by-step reasoning",
}

// ─── Image generation ──────────────────────────────────────────────────────────

const IMAGE_CAPABLE: Provider[] = ["openai", "google", "xai"]

// Providers whose default models reliably accept image INPUT (vision). Others
// get the text only, so attaching an image never errors a non-vision model.
const VISION_CAPABLE: Provider[] = ["openai", "anthropic", "google", "xai"]

const IMAGE_MODELS: Partial<Record<Provider, { id: string; label: string }[]>> = {
  openai: [
    { id: "dall-e-3", label: "DALL·E 3" },
    { id: "gpt-image-1", label: "GPT Image 1" },
  ],
  google: [{ id: "gemini-2.5-flash-image", label: "Nano Banana" }],
  xai: [{ id: "grok-2-image", label: "Grok 2 Image" }],
}

const DEFAULT_IMAGE_MODELS: Partial<Record<Provider, string>> = {
  openai: "dall-e-3",
  google: "gemini-2.5-flash-image",
  xai: "grok-2-image",
}

const isImageContent = (c: string) => c.startsWith("data:image")

// ─── DB ↔ Frontend mapping ────────────────────────────────────────────────────

function fromDbTurn(dbTurn: {
  id: string
  userMessage: string
  isFusion: boolean
  responses?: { provider: string; model: string; content: string; error: string | null }[]
  fusedResponse?: { content: string; error: string | null; providers: string[] } | null
}): ConversationTurn {
  const responses: Partial<Record<Provider, ModelResponseState>> = {}
  for (const r of dbTurn.responses ?? []) {
    responses[r.provider as Provider] = { content: r.content, loading: false, done: true, error: r.error ?? undefined }
  }
  return {
    id: dbTurn.id,
    userMessage: dbTurn.userMessage,
    isFusion: dbTurn.isFusion,
    responses,
    fusedResponse: dbTurn.fusedResponse
      ? { content: dbTurn.fusedResponse.content, loading: false, done: true, error: dbTurn.fusedResponse.error ?? undefined }
      : undefined,
  }
}

// ─── Cross-conversation memory ──────────────────────────────────────────────────

// Cheapest decent model per provider for the background extraction call, so
// capturing memory costs the user almost nothing. Falls back to selected model.
const MEMORY_MODELS: Partial<Record<Provider, string>> = {
  openai: "gpt-5.4-mini",
  anthropic: "claude-haiku-4-5-20251001",
  google: "gemini-2.5-flash-lite",
  groq: "llama-3.1-8b-instant",
  mistral: "mistral-small-latest",
  deepseek: "deepseek-chat",
  xai: "grok-3",
  openrouter: "nvidia/nemotron-3-super-120b-a12b:free",
}

// Max characters we keep for a memory profile client-side (the API also clamps
// per plan). Big enough for a rich profile, small enough to stay cheap to inject.
const MEMORY_PROFILE_MAX = 8000

// Instructions for the updater model. Memory is a single free-form PROMPT
// (organized in sections) rather than a list of discrete facts. The model is
// asked to return the FULL updated profile so we can store it verbatim.
function buildMemoryUpdatePrompt(currentProfile: string): string {
  return `You maintain a long-term MEMORY PROFILE about a user for an AI assistant. The profile is a short, free-form prompt organized in sections — for example "Work context", "Personal context", "Preferences", "Top of mind". It is shared across every model and conversation, so any assistant reading it instantly knows the user.

Here is the user's CURRENT profile (may be empty):
"""
${currentProfile.trim() || "(empty)"}
"""

From the exchange below, produce an UPDATED profile:
- Add durable, genuinely useful facts about the USER: their work, stack/technologies, projects and clients, goals, preferences, writing tone, and relevant personal context.
- Merge with what's already there — never duplicate, never lose information that is still true, never invent anything.
- Keep it concise and well-structured under clear section headings. Write in the same language the user writes in.
- Ignore one-off questions, ephemeral details and trivia.

Return ONLY the full updated profile text. No preamble, no commentary, no quotes, no markdown code fences. If nothing meaningful changed, return the current profile unchanged.`
}

// Normalize an updater response into a clean profile string: strip stray code
// fences / wrapping quotes, trim, and clamp length.
function cleanProfile(raw: string): string {
  let s = raw.trim()
  s = s.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "").trim()
  if (s.length > 1 && s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1).trim()
  return s.slice(0, MEMORY_PROFILE_MAX)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSystemPrompt(provider: Provider, activeProviders: Provider[], memoryProfile: string): { role: string; content: string } {
  const others = activeProviders.filter((p) => p !== provider).map((p) => CFG[p].name)
  const othersStr = others.length > 0 ? ` alongside ${others.join(" and ")}` : ""
  const profile = memoryProfile.trim()
  const memBlock = profile
    ? `\n\nUSER MEMORY PROFILE (learned from previous conversations; valid for EVERY chat with ANY model):\n"""\n${profile.slice(0, MEMORY_PROFILE_MAX)}\n"""\n\nUse this memory when relevant. Don't recite it back or say "according to my memory"; just act like someone who already knows the user and their context.`
    : ""
  return {
    role: "system",
    content: `You are ${CFG[provider].name} on a multi-model chat platform${othersStr}.

CRITICAL RULE: The conversation history contains answers from ALL participating models. Each assistant answer is prefixed like [${CFG[provider].name}]:${others.map((n) => ` [${n}]:`).join("")} to indicate which model said what. This history IS your shared memory.

IMPORTANT: Answer DIRECTLY without including any prefix like [${CFG[provider].name}]: at the start. Never copy that format into your answer. NEVER say you don't have access to what other models said. Always answer in the user's language.${memBlock}`,
  }
}

function buildSharedHistory(
  turns: ConversationTurn[],
  activeProviders: Provider[],
  newMessage: string,
  provider: Provider,
  memoryProfile: string = ""
): { role: string; content: string }[] {
  const msgs: { role: string; content: string }[] = [buildSystemPrompt(provider, activeProviders, memoryProfile)]
  for (const turn of turns) {
    msgs.push({ role: "user", content: turn.userMessage })
    if (turn.isFusion && turn.fusedResponse?.done && turn.fusedResponse.content && !turn.fusedResponse.error) {
      msgs.push({ role: "assistant", content: turn.fusedResponse.content })
    } else {
      const parts = (Object.keys(turn.responses) as Provider[])
        .map((p) => {
          const r = turn.responses[p]
          if (r?.done && r.content && !r.error) {
            const body = isImageContent(r.content) ? "[imagen generada]" : r.content
            return `[${CFG[p].name}]:\n${body}`
          }
          return null
        })
        .filter((x): x is string => x !== null)
      if (parts.length > 0) msgs.push({ role: "assistant", content: parts.join("\n\n---\n\n") })
    }
  }
  msgs.push({ role: "user", content: newMessage })
  return msgs
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return "ahora"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
  return `${Math.floor(diff / 86_400_000)}d`
}

function groupSessionsByDate(sessions: ChatSession[]): { label: string; sessions: ChatSession[] }[] {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfDay - 86400000
  const startOfWeek = startOfDay - 7 * 86400000
  const startOfMonth = startOfDay - 30 * 86400000

  const buckets: Record<string, ChatSession[]> = { hoy: [], ayer: [], semana: [], mes: [], antiguo: [] }
  for (const s of sessions) {
    if (s.updatedAt >= startOfDay) buckets.hoy.push(s)
    else if (s.updatedAt >= startOfYesterday) buckets.ayer.push(s)
    else if (s.updatedAt >= startOfWeek) buckets.semana.push(s)
    else if (s.updatedAt >= startOfMonth) buckets.mes.push(s)
    else buckets.antiguo.push(s)
  }
  const labels: Record<string, string> = { hoy: "Today", ayer: "Yesterday", semana: "Last 7 days", mes: "Last 30 days", antiguo: "Older" }
  return (["hoy", "ayer", "semana", "mes", "antiguo"] as const)
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ label: labels[k], sessions: buckets[k] }))
}

const SUGGESTED_PROMPTS: { title: string; subtitle: string; from: string; to: string; icon: React.ReactNode }[] = [
  {
    title: "Creative idea", subtitle: "Brainstorm ideas for…",
    from: "from-orange-500", to: "to-amber-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <path d="M12 3l1.6 4.2L18 8.8l-4.4 1.6L12 14.6l-1.6-4.2L6 8.8l4.4-1.6L12 3z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
      </svg>
    ),
  },
  {
    title: "Explain it", subtitle: "Complex concepts made simple",
    from: "from-amber-400", to: "to-yellow-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
      </svg>
    ),
  },
  {
    title: "Code", subtitle: "Help me debug or write",
    from: "from-blue-500", to: "to-cyan-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: "Compare", subtitle: "Analyze differences between options",
    from: "from-violet-500", to: "to-purple-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <line x1="6" y1="20" x2="6" y2="12" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="18" y1="20" x2="18" y2="9" />
      </svg>
    ),
  },
]

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  return (
    <span className="inline-flex gap-1.5 items-center h-4">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full typing-dot-glow"
          style={{ background: color, color, animationDelay: `${i * 0.16}s` }} />
      ))}
    </span>
  )
}

// ─── Lightweight markdown renderer (no deps) ────────────────────────────────────
// Renders the formatting models actually emit: bold, italic, inline code,
// fenced code, headings, lists, links. Streaming-safe (an unclosed fence just
// renders as a code block until the closing ``` arrives).

function renderInline(text: string, kp: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\s][^*]*\*)|(_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const t = m[0]
    if (t.startsWith("`")) out.push(<code key={`${kp}-${i}`} className="md-code">{t.slice(1, -1)}</code>)
    else if (t.startsWith("**") || t.startsWith("__")) out.push(<strong key={`${kp}-${i}`}>{t.slice(2, -2)}</strong>)
    else if (t.startsWith("[")) {
      const mm = t.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
      if (mm) out.push(<a key={`${kp}-${i}`} href={mm[2]} target="_blank" rel="noopener noreferrer">{mm[1]}</a>)
      else out.push(t)
    } else out.push(<em key={`${kp}-${i}`}>{t.slice(1, -1)}</em>)
    last = re.lastIndex
    i++
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n")
  const blocks: React.ReactNode[] = []
  let i = 0
  let k = 0
  while (i < lines.length) {
    const line = lines[i]
    // Fenced code block
    if (line.trim().startsWith("```")) {
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith("```")) { buf.push(lines[i]); i++ }
      i++ // skip closing fence
      blocks.push(<pre key={k++} className="md-pre"><code>{buf.join("\n")}</code></pre>)
      continue
    }
    // Heading
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const lvl = h[1].length
      blocks.push(<div key={k} className={`md-h md-h${lvl}`}>{renderInline(h[2], `h${k}`)}</div>)
      k++; i++; continue
    }
    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, "")); i++ }
      blocks.push(<blockquote key={k}>{buf.map((b, j) => <span key={j}>{j > 0 && <br />}{renderInline(b, `bq${k}-${j}`)}</span>)}</blockquote>)
      k++; continue
    }
    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++ }
      blocks.push(<ul key={k} className="md-ul">{items.map((it, j) => <li key={j}>{renderInline(it, `ul${k}-${j}`)}</li>)}</ul>)
      k++; continue
    }
    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++ }
      blocks.push(<ol key={k} className="md-ol">{items.map((it, j) => <li key={j}>{renderInline(it, `ol${k}-${j}`)}</li>)}</ol>)
      k++; continue
    }
    // Blank line
    if (line.trim() === "") { i++; continue }
    // Paragraph
    const para: string[] = []
    while (
      i < lines.length && lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) { para.push(lines[i]); i++ }
    blocks.push(<p key={k} className="md-p">{para.map((ln, j) => <span key={j}>{j > 0 && <br />}{renderInline(ln, `p${k}-${j}`)}</span>)}</p>)
    k++
  }
  return <div className="md-content">{blocks}</div>
}

// ─── Response block ───────────────────────────────────────────────────────────

function ResponseCard({ provider, state, selectedModel, index = 0, animate = false, onRegenerate }: {
  provider: Provider; state: ModelResponseState; selectedModel: string; index?: number; animate?: boolean
  onRegenerate?: () => void
}) {
  const c = CFG[provider]
  const isImg = !state.error && isImageContent(state.content)
  const modelLabel = isImg
    ? (IMAGE_MODELS[provider]?.find((m) => m.id === DEFAULT_IMAGE_MODELS[provider])?.label ?? "Imagen")
    : (c.models.find((m) => m.id === selectedModel)?.label ?? selectedModel)
  const [copied, setCopied] = useState(false)
  const [vote, setVote] = useState<"up" | "down" | null>(null)

  const handleCopy = () => {
    if (!state.content) return
    navigator.clipboard.writeText(state.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  // Compact icon button for the action bar under a response.
  const ActBtn = ({ onClick, title, active, children }: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) => (
    <button onClick={onClick} title={title}
      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors"
      style={{ color: active ? c.color : "var(--text-4)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--overlay)"; if (!active) e.currentTarget.style.color = "var(--text-2)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; if (!active) e.currentTarget.style.color = "var(--text-4)" }}>
      {children}
    </button>
  )

  return (
    <div className={`group flex flex-col${animate ? " resp-in" : ""}`}
      style={{ ...(animate && { animationDelay: `${index * 0.08}s` }) }}>

      {/* Attribution row — which model answered */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0${animate ? " pop-in" : ""}`}
          style={{ background: c.colorLight, border: `1px solid ${c.colorBorder}`, color: c.color, ...(animate && { animationDelay: `${index * 0.08 + 0.1}s` }) }}>
          <c.Logo size={13} />
        </div>
        <span className="text-[13px] font-bold" style={{ color: c.color }}>{c.name}</span>
        <span className="text-[11px]" style={{ color: "var(--text-4)" }}>{modelLabel}</span>
        {state.loading && (
          <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: c.color }}>
            <span className="relative flex items-center justify-center ml-0.5">
              <span className="absolute w-2 h-2 rounded-full animate-ping opacity-50" style={{ background: c.color }} />
              <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
            </span>
            Generating
          </span>
        )}
        <div className="flex-1" />
        {state.done && !state.error && state.content && isImg && (
          <a href={state.content} download={`onechater-${provider}.png`}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-all duration-150"
            style={{ background: "var(--surface)", border: `1px solid ${c.colorBorder}`, color: "var(--text-3)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Download
          </a>
        )}
      </div>

      {/* Content — flat, with a thin model-coloured accent rail */}
      <div className="text-[15px] leading-[1.7] break-words min-h-[24px] pl-3.5"
        style={{ borderLeft: `2px solid ${c.colorBorder}`, color: "var(--text-1)" }}>
        {state.error
          ? <span className="text-red-500 text-sm">{state.error}</span>
          : isImg
          ? <a href={state.content} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.content} alt="Generated image" className="rounded-xl w-full h-auto transition-transform duration-200 hover:scale-[1.01]"
                style={{ border: "1px solid var(--border-soft)" }} />
            </a>
          : state.content
          ? <>
              <Markdown text={state.content} />
              {state.loading && <span className="stream-caret" style={{ background: c.color }} />}
            </>
          : state.loading
          ? <div className="pt-0.5"><TypingDots color={c.color} /></div>
          : null}
      </div>

      {/* Action bar — ChatGPT-style: copy, like, dislike, regenerate */}
      {state.done && !state.error && state.content && !isImg && (
        <div className="flex items-center gap-0.5 mt-1.5 ml-3 opacity-60 group-hover:opacity-100 transition-opacity">
          <ActBtn onClick={handleCopy} title={copied ? "Copied" : "Copy"} active={copied}>
            {copied
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
          </ActBtn>
          <ActBtn onClick={() => setVote((v) => (v === "up" ? null : "up"))} title="Good response" active={vote === "up"}>
            <svg viewBox="0 0 24 24" fill={vote === "up" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>
          </ActBtn>
          <ActBtn onClick={() => setVote((v) => (v === "down" ? null : "down"))} title="Bad response" active={vote === "down"}>
            <svg viewBox="0 0 24 24" fill={vote === "down" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" /></svg>
          </ActBtn>
          {onRegenerate && (
            <ActBtn onClick={onRegenerate} title="Regenerate response">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>
            </ActBtn>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Fusion card ──────────────────────────────────────────────────────────────

function FusionCard({ state, providers, animate = false }: { state: ModelResponseState; providers: Provider[]; animate?: boolean }) {
  const isCollecting = state.loading && state.phase === "collecting"
  const isSynthesizing = state.loading && state.phase === "synthesizing"
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!state.content) return
    navigator.clipboard.writeText(state.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const isLoading = state.loading

  return (
    <div className={`group flex flex-col relative${animate ? " resp-in" : ""}`}>

      {/* Attribution row — fused output + which models contributed */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex -space-x-1.5 flex-shrink-0">
          {providers.map((p, i) => {
            const Logo = CFG[p].Logo
            return (
              <div key={p}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110${isLoading ? " fusion-logo-pulse" : ""}`}
                style={{
                  background: CFG[p].colorLight,
                  color: CFG[p].color,
                  border: `1px solid ${CFG[p].colorBorder}`,
                  boxShadow: "0 0 0 2px var(--surface)",
                  transitionDelay: `${i * 40}ms`,
                  animationDelay: `${i * 0.15}s`,
                }}>
                <Logo size={11} />
              </div>
            )
          })}
        </div>
        <span className="text-[13px] font-bold text-orange-600">Fusion</span>
        <span className="text-[11px]" style={{ color: "var(--text-4)" }}>{providers.map((p) => CFG[p].name).join(" · ")}</span>
        {isCollecting && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-orange-500">
            <span className="relative flex items-center justify-center ml-0.5">
              <span className="absolute w-2 h-2 rounded-full bg-orange-400/60 animate-ping" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-orange-500" />
            </span>
            Consultando {providers.length}…
          </span>
        )}
        {isSynthesizing && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-orange-500">
            <span className="relative flex items-center justify-center ml-0.5">
              <span className="absolute w-2 h-2 rounded-full bg-orange-400/60 animate-ping" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-orange-500" />
            </span>
            Sintetizando…
          </span>
        )}
        <div className="flex-1" />
        {state.done && !state.error && state.content && (
          <button onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-all duration-150"
            style={{ background: "var(--surface)", border: "1px solid rgba(249,115,22,0.25)", color: copied ? "#f97316" : "var(--text-3)" }}>
            {copied ? (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12" /></svg>Copied</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copy</>
            )}
          </button>
        )}
      </div>

      {/* Content — flat, orange accent rail */}
      <div className="text-[15px] leading-[1.7] break-words min-h-[24px] pl-3.5"
        style={{ borderLeft: "2px solid rgba(249,115,22,0.25)", color: "var(--text-1)" }}>
        {state.error
          ? <span className="text-red-500 text-sm">{state.error}</span>
          : state.content
          ? <>
              <Markdown text={state.content} />
              {isSynthesizing && <span className="stream-caret" style={{ background: "#f97316" }} />}
            </>
          : isCollecting
          ? <div className="flex items-center gap-2 pt-0.5">
              <div className="flex gap-1">
                {providers.map((p, i) => (
                  <span key={p} className="w-2 h-2 rounded-full typing-dot-glow"
                    style={{ background: CFG[p].color, color: CFG[p].color, animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
              <span className="text-[13px] italic" style={{ color: "var(--text-4)" }}>Recogiendo {providers.length} respuestas…</span>
            </div>
          : <div className="pt-0.5"><TypingDots color="#f97316" /></div>}
      </div>
    </div>
  )
}

// ─── Turn block ───────────────────────────────────────────────────────────────

function TurnBlock({ turn, activeProviders, selectedModels, onRegenerate }: {
  turn: ConversationTurn; activeProviders: Provider[]; selectedModels: Record<Provider, string>
  onRegenerate?: (turnId: string, provider: Provider) => void
}) {
  const cols = activeProviders.length
  const grid = cols === 1 ? "grid-cols-1 max-w-2xl" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
  // Only animate turns created live (not loaded from localStorage on page init)
  const isNewTurn = useMemo(() => {
    if (turn.isFusion) return !turn.fusedResponse?.done
    return Object.values(turn.responses).some((r) => r?.loading)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`space-y-4 w-full max-w-4xl mx-auto${isNewTurn ? " turn-enter" : ""}`}>
      {/* User message */}
      <div className="flex justify-end">
        <div className="flex flex-col items-end gap-2 max-w-[78%]">
          {/* Attached images */}
          {turn.images && turn.images.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {turn.images.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`adjunto ${i + 1}`} className="rounded-xl max-h-44 w-auto object-cover transition-transform duration-200 hover:scale-[1.02]"
                    style={{ border: "1px solid var(--border)" }} />
                </a>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2.5">
          {turn.userMessage && (
          <div className={`px-4 py-3 rounded-2xl rounded-br-md text-[15px] text-white leading-relaxed break-words whitespace-pre-wrap transition-transform duration-200 hover:scale-[1.015]${isNewTurn ? " msg-enter" : ""}`}
            style={{
              background: "linear-gradient(135deg, #2a2b30 0%, #1a1b1f 50%, #0e0f12 100%)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}>
            {turn.userMessage}
          </div>
          )}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 transition-transform duration-300 hover:scale-110 hover:rotate-6${isNewTurn ? " pop-in" : ""}`}
            style={{
              background: "linear-gradient(135deg, #1e1f24, #0a0b0d)",
              color: "white",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          </div>
        </div>
      </div>
      {/* Responses */}
      {turn.isFusion && turn.fusedResponse && <FusionCard state={turn.fusedResponse} providers={activeProviders} animate={isNewTurn} />}
      {!turn.isFusion && activeProviders.length > 0 && (
        <div className={`grid gap-x-6 gap-y-7 ${grid}`}>
          {activeProviders.map((p, idx) => {
            const state = turn.responses[p]
            if (!state) return null
            return <ResponseCard key={p} provider={p} state={state} selectedModel={selectedModels[p]} index={idx} animate={isNewTurn}
              onRegenerate={onRegenerate && !turn.userMessage.startsWith("/") ? () => onRegenerate(turn.id, p) : undefined} />
          })}
        </div>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasActive, onActivateDemo, onPromptClick }: {
  hasActive: boolean; onActivateDemo: () => void; onPromptClick: (prompt: string) => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 md:gap-7 px-6 py-6 md:py-12 text-center">
      {/* Animated logo orb */}
      <div className="relative orb-float mb-3 md:mb-5">
        {/* Orbital ring */}
        <div className="absolute -inset-8 orb-ring pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_3px_rgba(249,115,22,0.5)]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400 shadow-[0_0_8px_2px_rgba(139,92,246,0.5)]" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]" />
        </div>
        {/* Glow blob */}
        <div className="absolute -inset-3 rounded-[2rem] blur-2xl glow-pulse"
          style={{ background: "conic-gradient(from 0deg, #f97316, #8b5cf6, #3b82f6, #10b981, #f97316)" }} />
        <div className="relative w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #1e1f24, #0a0b0d)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-10 h-10">
            <path d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="white" />
            <path d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="white" />
            <path d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="white" />
          </svg>
        </div>
      </div>

      <div className="space-y-2 max-w-md heading-enter">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          {hasActive ? "What do you want to ask?" : "Connect your first AI"}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          {hasActive
            ? "Pick a prompt or write your own. With more than one model active, the answers merge into a single one."
            : "Select an AI from the button below and enter your API key, or try demo mode without setting anything up."}
        </p>
      </div>

      {/* Suggested prompts grid */}
      {hasActive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
          {SUGGESTED_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => onPromptClick(`${p.title}: `)}
              className="group prompt-card flex items-center gap-3 px-4 py-3 rounded-2xl text-left cursor-pointer bg-white prompt-enter active:scale-[0.98]"
              style={{ border: "1px solid var(--border)", animationDelay: `${0.15 + i * 0.07}s` }}>
              <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.from} ${p.to} flex items-center justify-center text-white flex-shrink-0 ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-105`}
                style={{ boxShadow: "0 4px 12px -2px rgba(14,15,18,0.18), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
                {p.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-900">{p.title}</div>
                <div className="text-[11px] text-gray-500 truncate">{p.subtitle}</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {!hasActive && (
        <button onClick={onActivateDemo}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ background: "#1e1f24", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Probar en modo demo
        </button>
      )}
    </div>
  )
}

// ─── Model Dropdown ───────────────────────────────────────────────────────────

function AIChipSelector({
  apiKeys, setApiKeys, enabled, setEnabled, selectedModels, setSelectedModels, onActivateDemo, plan,
}: {
  apiKeys: Record<Provider, string>
  setApiKeys: (k: Record<Provider, string>) => void
  enabled: Record<Provider, boolean>
  setEnabled: (e: Record<Provider, boolean>) => void
  selectedModels: Record<Provider, string>
  setSelectedModels: (m: Record<Provider, string>) => void
  onActivateDemo: () => void
  plan: string
}) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [expanded, setExpanded] = useState<Provider | null>(null)
  const [draftKey, setDraftKey] = useState("")
  const panelRef = useRef<HTMLDivElement>(null)
  const isDemo = PROVIDERS.some((p) => apiKeys[p] === "demo")
  const activeProviders = PROVIDERS.filter((p) => apiKeys[p].trim() && enabled[p] && !providerLocked(p, plan, apiKeys[p]))

  const close = () => { setPanelOpen(false); setExpanded(null); setDraftKey("") }

  useEffect(() => {
    if (!panelOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [panelOpen])

  const handleToggle = (p: Provider) => setEnabled({ ...enabled, [p]: !enabled[p] })

  const handleRowClick = (p: Provider) => {
    if (providerLocked(p, plan, apiKeys[p])) return // paid-only on Free plan
    if (expanded === p) { setExpanded(null); setDraftKey("") }
    else { setExpanded(p); setDraftKey(apiKeys[p] === "demo" ? "" : apiKeys[p]) }
  }

  const handleSaveKey = (p: Provider) => {
    if (draftKey.trim()) {
      setApiKeys({ ...apiKeys, [p]: draftKey.trim() })
      setEnabled({ ...enabled, [p]: true })
    }
    setExpanded(null)
    setDraftKey("")
  }

  const handleRemoveKey = (p: Provider) => {
    setApiKeys({ ...apiKeys, [p]: "" })
    setEnabled({ ...enabled, [p]: false })
    setExpanded(null)
    setDraftKey("")
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => { if (panelOpen) close(); else setPanelOpen(true) }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 select-none"
        style={{
          background: panelOpen ? "#1e1f24" : "var(--overlay)",
          border: panelOpen ? "1px solid #1e1f24" : "1px solid var(--border)",
          color: panelOpen ? "#fff" : "var(--text-2)",
        }}
      >
        {activeProviders.length > 0 ? (
          <div className="flex -space-x-1.5">
            {activeProviders.slice(0, 4).map((p, i) => {
              const Logo = CFG[p].Logo
              return (
                <div key={p} className="ai-trigger-pop w-[18px] h-[18px] rounded-full flex items-center justify-center"
                  style={{
                    background: CFG[p].colorLight,
                    color: CFG[p].color,
                    boxShadow: `0 0 0 1.5px ${panelOpen ? "#1e1f24" : "var(--surface)"}, inset 0 0 0 1px ${CFG[p].colorBorder}`,
                    zIndex: 10 - i,
                    animationDelay: `${i * 0.05}s`,
                  }}>
                  <Logo size={10} />
                </div>
              )
            })}
          </div>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
            <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          </svg>
        )}
        <span>
          {activeProviders.length > 0
            ? `${activeProviders.length} AI${activeProviders.length > 1 ? "s" : ""} active`
            : "Select AI"}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ width: 10, height: 10, transition: "transform 0.15s", transform: panelOpen ? "rotate(180deg)" : "none" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Mobile backdrop */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ background: "rgba(0,0,0,0.45)" }} onClick={close} />
      )}

      {/* Panel — bottom sheet on mobile, popover on desktop */}
      {panelOpen && (
        <div
          className="ai-sheet z-50 flex flex-col fixed inset-x-0 bottom-0 rounded-t-2xl md:absolute md:inset-x-auto md:left-0 md:bottom-full md:mb-2 md:w-[340px] md:rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 -8px 44px rgba(0,0,0,0.24)",
            maxHeight: "min(72vh, 470px)",
          }}
        >
          {/* mobile grabber */}
          <div className="md:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0">
            <span className="w-9 h-1 rounded-full" style={{ background: "var(--border-strong)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Select AI</span>
            {isDemo ? (
              <span className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ color: "#f97316", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                Demo
                <button onClick={() => setApiKeys({ openai: "", anthropic: "", google: "", groq: "", openrouter: "", xai: "", mistral: "", deepseek: "" })}
                  className="ml-0.5 hover:opacity-70 cursor-pointer" style={{ color: "var(--text-4)" }} title="Exit demo mode">×</button>
              </span>
            ) : (
              <button onClick={() => { onActivateDemo(); close() }}
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                style={{ color: "#f97316", background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 9, height: 9 }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Demo mode
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {PROVIDERS.map((p, ri) => {
              const c = CFG[p]
              const locked = providerLocked(p, plan, apiKeys[p])
              const hasKey = !!apiKeys[p].trim() && apiKeys[p] !== "demo"
              const isDemoKey = apiKeys[p] === "demo"
              const active = (hasKey || isDemoKey) && enabled[p] && !locked
              const isExp = expanded === p && !locked
              const currentModel = c.models.find(m => m.id === selectedModels[p])?.label ?? selectedModels[p]

              return (
                <div key={p} className="ai-row-enter" style={{ borderBottom: "1px solid var(--border-soft)", animationDelay: `${0.04 + ri * 0.035}s`, opacity: locked ? 0.65 : 1 }}>
                  {/* Row */}
                  <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${locked ? "cursor-default" : "cursor-pointer hover:bg-black/[0.03]"}`}
                    onClick={() => handleRowClick(p)}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{ background: active ? c.colorLight : "var(--overlay)", border: `1px solid ${active ? c.colorBorder : "var(--border)"}`, color: active ? c.color : "var(--text-4)" }}>
                      <c.Logo size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold" style={{ color: active ? "var(--text-1)" : "var(--text-2)" }}>{c.name}</span>
                        {locked && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                            style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                            Pro
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: active ? c.color : "var(--text-4)" }}>
                        {locked ? "Paid plan required" : isDemoKey ? "Demo mode" : hasKey ? currentModel : "No API key · tap to add"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {locked ? (
                        <a href="/#pricing" className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                          Upgrade
                        </a>
                      ) : (
                        <>
                          {(hasKey || isDemoKey) && (
                            <button onClick={() => handleToggle(p)}
                              className="w-9 h-5 rounded-full transition-colors duration-200 relative cursor-pointer flex-shrink-0"
                              style={{ background: active ? c.color : "var(--border-strong)" }}>
                              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                                style={{ left: active ? "18px" : "2px" }} />
                            </button>
                          )}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ width: 13, height: 13, color: "var(--text-4)", transition: "transform 0.18s", transform: isExp ? "rotate(180deg)" : "none" }}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded config: inline, no nested dropdown */}
                  {isExp && (
                    <div className="ai-expand px-4 pb-3.5 pt-1.5 flex flex-col gap-3" style={{ background: c.colorLight }}>
                      {/* API key */}
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          placeholder={`${c.label} API key…`}
                          value={draftKey}
                          onChange={(e) => setDraftKey(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSaveKey(p) }}
                          className="flex-1 text-xs rounded-lg px-3 py-2 focus:outline-none min-w-0"
                          style={{ border: `1px solid ${c.colorBorder}`, background: "var(--surface)", color: "var(--text-1)" }}
                          autoComplete="off" spellCheck={false} autoFocus
                        />
                        <button onClick={() => handleSaveKey(p)} disabled={!draftKey.trim()}
                          className="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer disabled:opacity-30 hover:opacity-85 flex-shrink-0"
                          style={{ background: c.color }} title="Save">
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        {hasKey && (
                          <button onClick={() => handleRemoveKey(p)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer flex-shrink-0"
                            style={{ border: "1px solid var(--border)", background: "var(--surface)" }} title="Remove key">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, color: "#ef4444" }}>
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {/* Model list — menu style: name + description + check */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>Model</span>
                        <div className="mt-1.5 rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                          {c.models.map((m, mi) => {
                            const sel = selectedModels[p] === m.id
                            const desc = MODEL_DESC[m.id]
                            return (
                              <button
                                key={m.id}
                                onClick={() => setSelectedModels({ ...selectedModels, [p]: m.id })}
                                className="ai-model-row w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors"
                                style={{
                                  background: sel ? c.colorLight : "transparent",
                                  borderTop: mi === 0 ? "none" : "1px solid var(--border-soft)",
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-semibold leading-tight" style={{ color: sel ? c.color : "var(--text-1)" }}>{m.label}</div>
                                  {desc && <div className="text-[11px] mt-0.5 leading-tight truncate" style={{ color: "var(--text-4)" }}>{desc}</div>}
                                </div>
                                {sel && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── History Item ─────────────────────────────────────────────────────────────

function HistoryItem({ session, active, onSelect, onDelete, delay = 0, folders, onMove }: {
  session: ChatSession; active: boolean; onSelect: () => void; onDelete: () => void; delay?: number
  folders: Folder[]; onMove: (folderId: string | null) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/chat-id", session.id); e.dataTransfer.effectAllowed = "move" }}
      className="group flex items-center gap-2.5 pl-3 pr-2 py-1.5 min-h-[36px] rounded-lg cursor-pointer transition-colors duration-150 relative history-item-enter"
      style={{
        background: active ? "var(--overlay)" : "transparent",
        animationDelay: `${delay}ms`,
        zIndex: menuOpen ? 50 : undefined,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--border-soft)" }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent" }}
      onClick={onSelect}
    >
      {/* Active indicator: clean solid orange rail */}
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full" style={{ background: "#f97316" }} />}

      {/* Status dot */}
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors"
        style={{ background: active ? "#f97316" : "var(--border-strong)" }} />

      <span className="flex-1 text-[12.5px] truncate min-w-0"
        style={{ color: active ? "var(--text-1)" : "var(--text-2)", fontWeight: active ? 600 : 500 }}>
        {session.title}
      </span>
      <span className={`text-[10px] flex-shrink-0 tabular-nums ${menuOpen ? "hidden" : "group-hover:hidden"}`} style={{ color: "var(--text-4)" }}>
        {formatRelativeTime(session.updatedAt)}
      </span>

      {/* Move to folder */}
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
          className={`${menuOpen ? "flex" : "hidden group-hover:flex"} w-6 h-6 items-center justify-center rounded-md transition-colors cursor-pointer`}
          style={{ color: menuOpen ? "#f97316" : "var(--text-4)" }}
          onMouseEnter={(e) => { if (!menuOpen) e.currentTarget.style.color = "var(--text-2)" }}
          onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.color = "var(--text-4)" }}
          title="Move to folder"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
            <div className="absolute right-0 top-7 z-50 w-48 rounded-xl py-1 overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 10px 30px -8px rgba(0,0,0,0.3)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>Move to</div>
              {session.folderId && (
                <button onClick={() => { onMove(null); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors hover:bg-black/[0.04]" style={{ color: "var(--text-2)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  Remove from folder
                </button>
              )}
              {folders.length === 0 && (
                <div className="px-3 py-2 text-[12px]" style={{ color: "var(--text-4)" }}>No folders yet.</div>
              )}
              {folders.map((f) => {
                const here = session.folderId === f.id
                return (
                  <button key={f.id} disabled={here} onClick={() => { onMove(f.id); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors hover:bg-black/[0.04] disabled:opacity-50 disabled:cursor-default"
                    style={{ color: "var(--text-1)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={f.color ?? "#f97316"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="flex-1 truncate">{f.name}</span>
                    {here && <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="hidden group-hover:flex w-6 h-6 flex-shrink-0 items-center justify-center rounded-md transition-colors cursor-pointer"
        style={{ color: "var(--text-4)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)" }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-4)"; e.currentTarget.style.background = "transparent" }}
        title="Delete"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  )
}

// ─── Folder section (collapsible) ───────────────────────────────────────────────

function FolderSection({
  folder, sessions, collapsed, onToggle, activeSessionId, onSelectSession, onDeleteSession,
  onRenameFolder, onDeleteFolder, onMoveChat, allFolders,
}: {
  folder: Folder
  sessions: ChatSession[]
  collapsed: boolean
  onToggle: () => void
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  onMoveChat: (chatId: string, folderId: string | null) => void
  allFolders: Folder[]
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(folder.name)
  const [dragOver, setDragOver] = useState(false)
  const accent = folder.color ?? "#f97316"

  const commitRename = () => {
    const clean = name.trim()
    if (clean && clean !== folder.name) onRenameFolder(folder.id, clean)
    else setName(folder.name)
    setRenaming(false)
  }

  return (
    <div
      onDragOver={(e) => { if (e.dataTransfer.types.includes("text/chat-id")) { e.preventDefault(); setDragOver(true) } }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("text/chat-id")
        setDragOver(false)
        if (id) onMoveChat(id, folder.id)
      }}
      className="rounded-lg transition-colors"
      style={{ background: dragOver ? `color-mix(in srgb, ${accent} 12%, transparent)` : "transparent", outline: dragOver ? `1px dashed ${accent}` : "none" }}
    >
      {/* Folder header row */}
      <div className="group/folder flex items-center gap-1.5 pl-1.5 pr-1 py-1.5 min-h-[36px] rounded-lg cursor-pointer transition-colors relative"
        style={{ zIndex: menuOpen ? 50 : undefined }}
        onClick={onToggle}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border-soft)" }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="w-3 h-3 flex-shrink-0 transition-transform" style={{ color: "var(--text-4)", transform: collapsed ? "none" : "rotate(90deg)" }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
        <svg viewBox="0 0 24 24" fill={collapsed ? "none" : accent} stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0" style={{ opacity: collapsed ? 1 : 0.9 }}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        {renaming ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setName(folder.name); setRenaming(false) } }}
            onBlur={commitRename}
            className="flex-1 min-w-0 bg-transparent text-[12.5px] font-semibold outline-none rounded px-1"
            style={{ color: "var(--text-1)", border: `1px solid ${accent}` }}
          />
        ) : (
          <span className="flex-1 text-[12.5px] font-semibold truncate min-w-0" style={{ color: "var(--text-1)" }}>{folder.name}</span>
        )}
        <span className="text-[10px] tabular-nums flex-shrink-0 px-1.5 rounded-full" style={{ color: "var(--text-4)", background: "var(--overlay)" }}>{sessions.length}</span>

        <div className="relative flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
            className={`${menuOpen ? "flex" : "hidden group-hover/folder:flex"} w-6 h-6 items-center justify-center rounded-md cursor-pointer`}
            style={{ color: menuOpen ? "#f97316" : "var(--text-4)" }} title="Opciones">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
              <div className="absolute right-0 top-7 z-50 w-40 rounded-xl py-1 overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 10px 30px -8px rgba(0,0,0,0.3)" }}
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setRenaming(true); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors hover:bg-black/[0.04]" style={{ color: "var(--text-2)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                  Rename
                </button>
                <button onClick={() => { onDeleteFolder(folder.id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors hover:bg-red-500/10" style={{ color: "#ef4444" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
                  Delete folder
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Folder contents */}
      {!collapsed && (
        <div className="pl-3 pb-1 space-y-0.5">
          {sessions.length === 0 ? (
            <div className="px-3 py-2 text-[11px] italic" style={{ color: "var(--text-4)" }}>Empty · drag a chat here</div>
          ) : (
            sessions.map((s) => (
              <HistoryItem
                key={s.id}
                session={s}
                active={s.id === activeSessionId}
                onSelect={() => onSelectSession(s.id)}
                onDelete={() => onDeleteSession(s.id)}
                folders={allFolders}
                onMove={(fid) => onMoveChat(s.id, fid)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sidebar (history only, light theme) ─────────────────────────────────────

function Sidebar({
  open, onClose, onExpand, sessions, activeSessionId, onSelectSession, onDeleteSession, onNewSession,
  onOpenMemory, memoryCount, userName, userEmail,
  folders, collapsedFolders, onToggleFolder, onCreateFolder, onRenameFolder, onDeleteFolder, onMoveChat,
}: {
  open: boolean
  onClose: () => void
  onExpand: () => void
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onNewSession: () => void
  onOpenMemory: () => void
  memoryCount: number
  userName?: string | null
  userEmail?: string | null
  folders: Folder[]
  collapsedFolders: Record<string, boolean>
  onToggleFolder: (id: string) => void
  onCreateFolder: () => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  onMoveChat: (chatId: string, folderId: string | null) => void
}) {
  // Close the drawer after an action only on mobile (overlay); desktop keeps it pinned.
  const closeIfMobile = () => { if (typeof window !== "undefined" && window.innerWidth < 768) onClose() }
  const selectSession = (id: string) => { onSelectSession(id); closeIfMobile() }
  const newSession = () => { onNewSession(); closeIfMobile() }
  const openMemory = () => { onOpenMemory(); closeIfMobile() }

  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Partition: chats inside a (still-existing) folder vs unfiled chats.
  const folderIds = new Set(folders.map((f) => f.id))
  const sessionsByFolder = (fid: string) => sessions.filter((s) => s.folderId === fid)
  const unfiled = sessions.filter((s) => !s.folderId || !folderIds.has(s.folderId))
  const [rootDragOver, setRootDragOver] = useState(false)

  const q = search.trim().toLowerCase()
  const searchResults = q ? sessions.filter((s) => s.title.toLowerCase().includes(q)) : null

  const initials = (((userName || userEmail || "U").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("")) || "U").toUpperCase()

  // From the rail, "Buscar" expands then focuses the input.
  const openSearch = () => { if (!open) onExpand(); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 80) }

  const Avatar = ({ size = 32 }: { size?: number }) => (
    <span className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: "linear-gradient(135deg,#10b981,#059669)" }}>
      {initials}
    </span>
  )

  // ── Collapsed icon rail (desktop only — mobile uses the full drawer) ──────────
  const railBtnBase = "w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
  const rail = (
    <div className="hidden md:flex flex-col items-center h-full w-[72px] py-3">
      {/* Expand toggle */}
      <button onClick={onExpand} title="Expand sidebar" className={railBtnBase} style={{ color: "var(--text-2)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--overlay)" }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><rect x="3" y="3" width="18" height="18" rx="2.5" /><path d="M9 3v18" /></svg>
      </button>
      <div className="w-8 h-px my-2 flex-shrink-0" style={{ background: "var(--border-soft)" }} />
      <div className="flex flex-col items-center gap-1">
        <button onClick={() => onNewSession()} title="New chat" className={railBtnBase}
          style={{ color: "#fff", background: "linear-gradient(135deg,#2a2b30,#0e0f12)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        {[
          { t: "Search chats", on: openSearch, ic: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></> },
          { t: "New folder", on: onCreateFolder, ic: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M12 11v6M9 14h6" /></> },
        ].map((b) => (
          <button key={b.t} onClick={b.on} title={b.t} className={railBtnBase} style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--overlay)"; e.currentTarget.style.color = "var(--text-1)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">{b.ic}</svg>
          </button>
        ))}
        <Link href="/dashboard" title="Dashboard" className={railBtnBase} style={{ color: "var(--text-3)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--overlay)"; e.currentTarget.style.color = "#7c3aed" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
        </Link>
        <button onClick={openMemory} title="Memoria" className={`relative ${railBtnBase}`} style={{ color: "var(--text-3)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--overlay)"; e.currentTarget.style.color = "#7c3aed" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)" }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" /><path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" /><path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" /></svg>
          {memoryCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#7c3aed" }} />}
        </button>
      </div>
      <div className="flex-1" />
      <ThemeToggle />
      <button onClick={onExpand} title="Profile" className="mt-2"><Avatar /></button>
    </div>
  )

  // ── Reusable expanded nav row ────────────────────────────────────────────────
  const NavRow = ({ icon, label, onClick, accent, badge, active }: {
    icon: React.ReactNode; label: string; onClick: () => void; accent?: string; badge?: number; active?: boolean
  }) => (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-colors"
      style={{ color: "var(--text-2)", background: active ? "var(--overlay)" : "transparent" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--border-soft)" }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? "var(--overlay)" : "transparent" }}>
      <span className="flex-shrink-0" style={{ color: accent ?? "var(--text-3)" }}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>{badge}</span>
      )}
    </button>
  )

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" style={{ background: "rgba(0,0,0,0.45)", animation: "memFadeIn 0.22s ease both" }} onClick={onClose} />
      )}

      <aside
        className={[
          "z-40 overflow-hidden",
          // mobile: fixed slide-in drawer (full height, no topbar)
          "fixed top-0 bottom-0 left-0 w-[280px] transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          // desktop: in-flow, width-animated (rail when collapsed)
          "md:static md:top-auto md:bottom-auto md:z-auto md:translate-x-0 md:transition-[width] md:duration-300 md:flex-shrink-0",
          open ? "md:w-[260px]" : "md:w-[72px]",
        ].join(" ")}
        style={{
          background: "var(--surface-2)",
          borderRight: "1px solid var(--border)",
          boxShadow: open ? "4px 0 24px -16px rgba(0,0,0,0.25)" : "none",
        }}
      >
      {!open ? rail : (
      <div className="flex flex-col h-full w-full md:w-[260px]">

        {/* Header: logo + theme + collapse */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1 flex-shrink-0">
          <Link href="/" className="flex items-center group cursor-pointer">
            <OneChatLogo className="h-8 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={onClose} title="Collapse sidebar"
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--overlay)"; e.currentTarget.style.color = "var(--text-1)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2.5" /><path d="M9 3v18" /></svg>
            </button>
          </div>
        </div>

        {/* Nav block */}
        <div className="px-2 pt-2 pb-1 flex-shrink-0 space-y-0.5">
          <NavRow label="New chat" onClick={newSession} accent="var(--text-1)"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>} />
          <NavRow label="Search chats" onClick={() => { setSearchOpen((v) => !v); setTimeout(() => searchRef.current?.focus(), 60) }}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>} />
          <NavRow label="New folder" onClick={onCreateFolder}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M12 11v6M9 14h6" /></svg>} />
          <Link href="/dashboard" onClick={closeIfMobile}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-colors"
            style={{ color: "var(--text-2)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border-soft)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
            <span className="flex-shrink-0" style={{ color: "#7c3aed" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
            </span>
            <span className="flex-1 text-left">Dashboard</span>
          </Link>
          <NavRow label="Memory" onClick={openMemory} accent="#7c3aed"
            icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" /><path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" /><path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" /></svg>} />

          {/* Search input (revealed) */}
          {searchOpen && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 mt-1 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-4)" }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations…"
                className="flex-1 min-w-0 bg-transparent text-[12.5px] outline-none" style={{ color: "var(--text-1)" }}
                onKeyDown={(e) => { if (e.key === "Escape") { setSearch(""); setSearchOpen(false) } }} />
              {search && <button onClick={() => setSearch("")} className="flex-shrink-0 cursor-pointer" style={{ color: "var(--text-4)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg></button>}
            </div>
          )}
        </div>

        <div className="mx-3 my-1 h-px flex-shrink-0" style={{ background: "var(--border-soft)" }} />

        {/* Folders + history grouped by date (or flat search results) */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-3">
          <div className="px-2 pb-1 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>
              {searchResults ? `Resultados (${searchResults.length})` : "Recientes"}
            </span>
          </div>

          {searchResults ? (
            searchResults.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px]" style={{ color: "var(--text-4)" }}>No matches for “{search}”.</div>
            ) : (
              <div className="space-y-0.5">
                {searchResults.map((s) => (
                  <HistoryItem key={s.id} session={s} active={s.id === activeSessionId}
                    onSelect={() => selectSession(s.id)} onDelete={() => onDeleteSession(s.id)}
                    folders={folders} onMove={(fid) => onMoveChat(s.id, fid)} />
                ))}
              </div>
            )
          ) : (
            <>
              {sessions.length === 0 && folders.length === 0 && (
                <div className="px-3 py-10 text-center flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--overlay)", border: "1px solid var(--border-soft)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{ color: "var(--text-4)" }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-4)" }}>No conversations yet.<br />Start chatting to see them here.</p>
                </div>
              )}

              {folders.length > 0 && (
                <div className="space-y-0.5 mb-1">
                  {folders.map((f) => (
                    <FolderSection
                      key={f.id}
                      folder={f}
                      sessions={sessionsByFolder(f.id)}
                      collapsed={collapsedFolders[f.id] ?? false}
                      onToggle={() => onToggleFolder(f.id)}
                      activeSessionId={activeSessionId}
                      onSelectSession={selectSession}
                      onDeleteSession={onDeleteSession}
                      onRenameFolder={onRenameFolder}
                      onDeleteFolder={onDeleteFolder}
                      onMoveChat={onMoveChat}
                      allFolders={folders}
                    />
                  ))}
                </div>
              )}

              {/* Unfiled chats grouped by date — also a drop zone to unfile a chat */}
              <div
                onDragOver={(e) => { if (e.dataTransfer.types.includes("text/chat-id")) { e.preventDefault(); setRootDragOver(true) } }}
                onDragLeave={() => setRootDragOver(false)}
                onDrop={(e) => { const id = e.dataTransfer.getData("text/chat-id"); setRootDragOver(false); if (id) onMoveChat(id, null) }}
                className="rounded-lg transition-colors"
                style={{ outline: rootDragOver ? "1px dashed var(--border-strong)" : "none" }}
              >
                {groupSessionsByDate(unfiled).map((group) => (
                  <div key={group.label} className="mt-3 first:mt-1">
                    <div className="px-2 pb-1.5 pt-0.5">
                      <span className="text-[9.5px] font-bold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>
                        {group.label}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {group.sessions.map((s) => (
                        <HistoryItem
                          key={s.id}
                          session={s}
                          active={s.id === activeSessionId}
                          onSelect={() => selectSession(s.id)}
                          onDelete={() => onDeleteSession(s.id)}
                          delay={unfiled.indexOf(s) * 35}
                          folders={folders}
                          onMove={(fid) => onMoveChat(s.id, fid)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User footer */}
        <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}>
            <Avatar size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{userName || "Usuario"}</div>
              <div className="text-[11px] truncate" style={{ color: "var(--text-4)" }}>{userEmail || "Gratis"}</div>
            </div>
          </div>
        </div>
      </div>
      )}
    </aside>
    </>
  )
}

// ─── Memory drawer ────────────────────────────────────────────────────────────

function MemoryDrawer({ profile, onClose, onSave }: {
  profile: string
  onClose: () => void
  onSave: (profile: string) => void
}) {
  // Initialized once per open (the drawer remounts each time it opens, so a
  // background update that lands while it's closed shows up on next open).
  const [draft, setDraft] = useState(profile)
  const dirty = draft !== profile

  const PLACEHOLDER = `Work context
What you do, your stack and current projects…

Personal context
Language, interests, relevant personal details…

Preferences
Tone, answer length, conventions you like…

Top of mind
What you're focused on right now…`

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} style={{ animation: "memFadeIn 0.2s ease both" }} />
      <div className="relative h-full w-full max-w-[460px] flex flex-col bg-white shadow-2xl"
        style={{ borderLeft: "1px solid var(--border)", animation: "memDrawerIn 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", boxShadow: "0 6px 16px -4px rgba(124,58,237,0.5)" }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" />
              <path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" />
              <path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-gray-900 leading-tight">Memory</div>
            <div className="text-[12px] text-gray-500 mt-0.5 leading-snug">
              A single profile every AI reads before answering — across all your chats and models. It updates itself as you chat; edit it freely.
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-black/[0.05] transition-all cursor-pointer flex-shrink-0" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MEMORY_PROFILE_MAX))}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            className="w-full h-full min-h-[340px] resize-none rounded-xl p-3.5 text-[13px] leading-relaxed outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-soft)", color: "var(--text-1)", fontFamily: "inherit" }}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between gap-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <span className="text-[11px] text-gray-400 tabular-nums">{draft.length.toLocaleString()} / {MEMORY_PROFILE_MAX.toLocaleString()}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => onSave("")} disabled={!profile.trim()}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.04]" style={{ color: "var(--text-3)" }}>
              Clear
            </button>
            <button onClick={() => onSave(draft)} disabled={!dirty}
              className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slash commands ───────────────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { id: "clear",   label: "/clear",   desc: "Clear current conversation" },
  { id: "new",     label: "/new",     desc: "New conversation" },
  { id: "fusion",  label: "/fusion",  desc: "Enable every model with a key" },
  { id: "solo",    label: "/solo",    desc: "Use only the first active model" },
  { id: "models",  label: "/models",  desc: "Show active models" },
  { id: "sidebar", label: "/sidebar", desc: "Toggle sidebar" },
  { id: "retry",   label: "/retry",   desc: "Resend last message" },
  { id: "copy",    label: "/copy",    desc: "Copy last answer" },
  { id: "demo",    label: "/demo",    desc: "Enable demo mode" },
  { id: "help",    label: "/help",    desc: "Show all commands" },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const activeSessionIdRef = useRef<string | null>(null)
  const sessionsRef = useRef<ChatSession[]>([])

  // Folders to organize chats. Collapse state is UI-only, kept in localStorage.
  const [folders, setFolders] = useState<Folder[]>([])
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({})
  const [turns, setTurnsState] = useState<ConversationTurn[]>([])
  const persistingRef = useRef<Set<string>>(new Set())
  const { data: session } = useSession()
  // Billing plan gates which providers can bring their own key (Free → only
  // free-AI providers). Defaults to "free" until the session resolves.
  const plan: string = (session?.user as { plan?: string } | undefined)?.plan ?? "free"

  const [input, setInput] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cmdIndex, setCmdIndex] = useState(0)
  const [toast, setToast] = useState("")
  const [toastHiding, setToastHiding] = useState(false)
  const [toastKey, setToastKey] = useState(0)
  const [sendKey, setSendKey] = useState(0)
  const [inputFocused, setInputFocused] = useState(false)
  const [imageMode, setImageMode] = useState(false)
  // Images the user attached for vision models (data URLs, current message only).
  const [attachments, setAttachments] = useState<string[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  const addAttachments = useCallback((files: FileList | null) => {
    if (!files?.length) return
    const room = 4 - attachments.length
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room))
    picked.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return // 5MB cap each
      const reader = new FileReader()
      reader.onload = () => {
        const url = reader.result as string
        if (url?.startsWith("data:image")) setAttachments((prev) => (prev.length >= 4 ? prev : [...prev, url]))
      }
      reader.readAsDataURL(file)
    })
  }, [attachments.length])

  // Cross-conversation memory: a single free-form profile the AI knows about
  // the user everywhere. Editable by hand, auto-updated after each turn.
  const [memoryProfile, setMemoryProfile] = useState<string>("")
  const memoryProfileRef = useRef<string>("")
  useEffect(() => { memoryProfileRef.current = memoryProfile }, [memoryProfile])
  const [memoryOpen, setMemoryOpen] = useState(false)
  const extractedRef = useRef<Set<string>>(new Set())

  const [apiKeys, setApiKeysRaw] = useState<Record<Provider, string>>({
    openai: "", anthropic: "", google: "", groq: "", openrouter: "", xai: "", mistral: "", deepseek: "",
  })
  const [enabled, setEnabledRaw] = useState<Record<Provider, boolean>>({
    openai: true, anthropic: true, google: true, groq: true, openrouter: true, xai: true, mistral: true, deepseek: true,
  })
  const [selectedModels, setSelectedModelsRaw] = useState<Record<Provider, string>>({
    openai: "gpt-5.5",
    anthropic: "claude-sonnet-4-6",
    google: "gemini-2.5-flash",
    groq: "llama-3.3-70b-versatile",
    openrouter: "nvidia/nemotron-3-super-120b-a12b:free",
    xai: "grok-4.3",
    mistral: "mistral-large-latest",
    deepseek: "deepseek-chat",
  })
  const selectedModelsRef = useRef(selectedModels)
  useEffect(() => { selectedModelsRef.current = selectedModels }, [selectedModels])

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true)
  }, [])

  useEffect(() => { activeSessionIdRef.current = activeSessionId }, [activeSessionId])
  useEffect(() => { sessionsRef.current = sessions }, [sessions])

  // Load the user's persistent memory once signed in. Available to every
  // session immediately, so any chat starts already "knowing" the user.
  useEffect(() => {
    if (!session?.user?.id) return
    fetch("/api/memory")
      .then((r) => r.json())
      .then((d: { profile?: string }) => {
        const p = typeof d?.profile === "string" ? d.profile : ""
        setMemoryProfile(p); memoryProfileRef.current = p
      })
      .catch(() => {})
  }, [session?.user?.id])

  const loadTurnsForSession = useCallback(async (sessionId: string) => {
    try {
      const dbTurns = await fetch(`/api/sessions/${sessionId}/turns`).then((r) => r.json())
      const mapped: ConversationTurn[] = dbTurns.map(fromDbTurn)
      // Mark loaded turns as already persisted AND already extracted, so
      // reopening an old conversation never re-saves or re-mines its turns.
      mapped.forEach((t) => { persistingRef.current.add(t.id); extractedRef.current.add(t.id) })
      setTurnsState(mapped)
    } catch {
      setTurnsState([])
    }
  }, [])

  // Init: load sessions from DB, preferences from localStorage
  useEffect(() => {
    if (!session?.user?.id) return
    try {
      const k = localStorage.getItem("oc_keys")
      if (k) setApiKeysRaw({ openai: "", anthropic: "", google: "", groq: "", openrouter: "", xai: "", mistral: "", deepseek: "", ...JSON.parse(k) })
      const e = localStorage.getItem("oc_enabled")
      if (e) setEnabledRaw({ openai: true, anthropic: true, google: true, groq: true, openrouter: true, xai: true, mistral: true, deepseek: true, ...JSON.parse(e) })
      const m = localStorage.getItem("oc_models")
      if (m) {
        const parsed = JSON.parse(m)
        // Migrate any saved model id no longer offered (renamed/retired) to
        // the provider's current default, so old prefs never send a dead id.
        const migrated = { ...parsed } as Record<Provider, string>
        for (const p of PROVIDERS) {
          if (!CFG[p].models.some((mm) => mm.id === migrated[p])) migrated[p] = CFG[p].defaultModel
        }
        setSelectedModelsRaw(migrated)
        localStorage.setItem("oc_models", JSON.stringify(migrated))
      }
      const fc = localStorage.getItem("oc_folders_collapsed")
      if (fc) setCollapsedFolders(JSON.parse(fc))
    } catch {}

    fetch(`/api/sessions`)
      .then((r) => r.json())
      .then(async (data: ChatSession[]) => {
        setSessions(data)
        sessionsRef.current = data
        if (data.length > 0) {
          setActiveSessionId(data[0].id)
          activeSessionIdRef.current = data[0].id
          await loadTurnsForSession(data[0].id)
        }
      })
      .catch(() => {})

    fetch(`/api/folders`)
      .then((r) => r.json())
      .then((data: Folder[]) => { if (Array.isArray(data)) setFolders(data) })
      .catch(() => {})
  }, [session?.user?.id, loadTurnsForSession])

  // Persist completed turns to DB
  useEffect(() => {
    const sid = activeSessionIdRef.current
    if (!sid) return
    turns.forEach((turn, idx) => {
      if (persistingRef.current.has(turn.id)) return
      const allDone = turn.isFusion
        ? (turn.fusedResponse?.done === true)
        : Object.values(turn.responses).length > 0 &&
          Object.values(turn.responses).every((r) => r?.done === true)
      if (!allDone) return
      persistingRef.current.add(turn.id)
      const sm = selectedModelsRef.current
      const enrichedResponses = Object.fromEntries(
        (Object.keys(turn.responses) as Provider[]).map((p) => [
          p,
          { ...turn.responses[p], model: sm[p] ?? "" },
        ])
      )
      fetch(`/api/sessions/${sid}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turn: { ...turn, responses: enrichedResponses }, position: idx }),
      })
        .then(() => {
          if (idx === 0) {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === sid ? { ...s, title: turn.userMessage.slice(0, 50), updatedAt: Date.now() } : s
              )
            )
          }
        })
        .catch(() => { persistingRef.current.delete(turn.id) })
    })
  }, [turns])

  const setApiKeys = useCallback((k: Record<Provider, string>) => {
    setApiKeysRaw(k); localStorage.setItem("oc_keys", JSON.stringify(k))
  }, [])
  const setEnabled = useCallback((e: Record<Provider, boolean>) => {
    setEnabledRaw(e); localStorage.setItem("oc_enabled", JSON.stringify(e))
  }, [])
  const setSelectedModels = useCallback((m: Record<Provider, string>) => {
    setSelectedModelsRaw(m); localStorage.setItem("oc_models", JSON.stringify(m))
  }, [])

  const setTurns = useCallback((updater: ConversationTurn[] | ((prev: ConversationTurn[]) => ConversationTurn[])) => {
    setTurnsState((prev) => typeof updater === "function" ? updater(prev) : updater)
  }, [])

  const ensureActiveSession = useCallback(async (): Promise<string> => {
    const existingId = activeSessionIdRef.current
    if (existingId && sessionsRef.current.some((s) => s.id === existingId)) return existingId
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New conversation" }),
    })
    const newSession: ChatSession = await res.json()
    activeSessionIdRef.current = newSession.id
    setActiveSessionId(newSession.id)
    setSessions((prev) => {
      const updated = [newSession, ...prev]
      sessionsRef.current = updated
      return updated
    })
    return newSession.id
  }, [])

  const handleNewSession = useCallback(async () => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New conversation" }),
    })
    const newSession: ChatSession = await res.json()
    setSessions((prev) => {
      const updated = [newSession, ...prev]
      sessionsRef.current = updated
      return updated
    })
    setActiveSessionId(newSession.id)
    activeSessionIdRef.current = newSession.id
    setTurnsState([])
    setInput("")
    textareaRef.current?.focus()
  }, [])

  const handleSelectSession = useCallback(async (id: string) => {
    setActiveSessionId(id)
    activeSessionIdRef.current = id
    await loadTurnsForSession(id)
    textareaRef.current?.focus()
  }, [loadTurnsForSession])

  const handleDeleteSession = useCallback(async (id: string) => {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" }).catch(() => {})
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      sessionsRef.current = updated
      if (activeSessionIdRef.current === id) {
        const nextId = updated[0]?.id ?? null
        setActiveSessionId(nextId)
        activeSessionIdRef.current = nextId
        if (nextId) loadTurnsForSession(nextId)
        else setTurnsState([])
      }
      return updated
    })
  }, [loadTurnsForSession])

  // ─── Folder handlers ──────────────────────────────────────────────────────
  const handleCreateFolder = useCallback(async () => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New folder" }),
      })
      if (!res.ok) return
      const folder: Folder = await res.json()
      setFolders((prev) => [...prev, folder])
    } catch {}
  }, [])

  const handleRenameFolder = useCallback(async (id: string, name: string) => {
    const clean = name.trim().slice(0, 60)
    if (!clean) return
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: clean } : f)))
    await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clean }),
    }).catch(() => {})
  }, [])

  const handleDeleteFolder = useCallback(async (id: string) => {
    // Optimistic: drop the folder and unfile its chats locally (they stay).
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setSessions((prev) => {
      const updated = prev.map((s) => (s.folderId === id ? { ...s, folderId: null } : s))
      sessionsRef.current = updated
      return updated
    })
    await fetch(`/api/folders/${id}`, { method: "DELETE" }).catch(() => {})
  }, [])

  const handleMoveChat = useCallback(async (chatId: string, folderId: string | null) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === chatId ? { ...s, folderId } : s))
      sessionsRef.current = updated
      return updated
    })
    await fetch(`/api/sessions/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    }).catch(() => {})
  }, [])

  const handleToggleFolder = useCallback((id: string) => {
    setCollapsedFolders((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem("oc_folders_collapsed", JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [turns])

  // A locked provider (paid-only on the Free plan) is never sent to, even if a
  // stale key lingers in localStorage from a previous paid period.
  const activeProviders = PROVIDERS.filter(
    (p) => enabled[p] && apiKeys[p].trim() && !providerLocked(p, plan, apiKeys[p])
  )
  const fusionMode = activeProviders.length > 1

  const streamProvider = useCallback(
    async (provider: Provider, messages: { role: string; content: string }[], turnId: string, opts?: { mode?: "image"; model?: string; images?: string[] }) => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, provider, apiKey: apiKeys[provider], model: opts?.model ?? selectedModels[provider], mode: opts?.mode, images: opts?.images }),
        })
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = dec.decode(value)
          setTurns((prev) => prev.map((t) =>
            t.id === turnId
              ? { ...t, responses: { ...t.responses, [provider]: { ...t.responses[provider]!, content: (t.responses[provider]?.content ?? "") + chunk } } }
              : t
          ))
        }
        setTurns((prev) => prev.map((t) => {
          if (t.id !== turnId) return t
          const raw = t.responses[provider]?.content ?? ""
          const cleaned = raw.replace(/^\s*\[[\w\s\-.]+\]:\s*/i, "")
          return { ...t, responses: { ...t.responses, [provider]: { ...t.responses[provider]!, content: cleaned, loading: false, done: true } } }
        }))
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido"
        setTurns((prev) => prev.map((t) =>
          t.id === turnId
            ? { ...t, responses: { ...t.responses, [provider]: { content: "", loading: false, done: true, error: msg } } }
            : t
        ))
      }
    },
    [apiKeys, selectedModels, setTurns]
  )

  // Re-run a single provider's answer for an existing turn, using the same
  // shared history it originally had. Re-persists the new content.
  const handleRegenerate = useCallback(async (turnId: string, provider: Provider) => {
    const all = turns
    const idx = all.findIndex((t) => t.id === turnId)
    if (idx < 0) return
    const turn = all[idx]
    if (turn.isFusion || !apiKeys[provider]?.trim()) return
    const prevTurns = all.slice(0, idx)
    const providersInTurn = Object.keys(turn.responses) as Provider[]
    persistingRef.current.delete(turnId) // allow the refreshed answer to save
    setTurns((prev) => prev.map((t) =>
      t.id === turnId ? { ...t, responses: { ...t.responses, [provider]: { content: "", loading: true, done: false } } } : t
    ))
    await streamProvider(provider, buildSharedHistory(prevTurns, providersInTurn, turn.userMessage, provider, memoryProfileRef.current), turnId)
  }, [turns, apiKeys, streamProvider, setTurns])

  const collectFull = useCallback(async (provider: Provider, messages: { role: string; content: string }[], modelOverride?: string, images?: string[]): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, provider, apiKey: apiKeys[provider], model: modelOverride ?? selectedModels[provider], images }),
    })
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let text = ""
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += dec.decode(value)
    }
    return text
  }, [apiKeys, selectedModels])

  const streamFusion = useCallback(async (provider: Provider, messages: { role: string; content: string }[], turnId: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, provider, apiKey: apiKeys[provider], model: selectedModels[provider] }),
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      setTurns((prev) => prev.map((t) => t.id === turnId ? { ...t, fusedResponse: { ...t.fusedResponse!, phase: "synthesizing" } } : t))
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value)
        setTurns((prev) => prev.map((t) =>
          t.id === turnId ? { ...t, fusedResponse: { ...t.fusedResponse!, content: (t.fusedResponse?.content ?? "") + chunk } } : t
        ))
      }
      setTurns((prev) => prev.map((t) =>
        t.id === turnId ? { ...t, fusedResponse: { ...t.fusedResponse!, loading: false, done: true } } : t
      ))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error"
      setTurns((prev) => prev.map((t) =>
        t.id === turnId ? { ...t, fusedResponse: { content: "", loading: false, done: true, error: msg } } : t
      ))
    }
  }, [apiKeys, selectedModels, setTurns])

  const showToast = useCallback((msg: string) => {
    setToast(msg); setToastHiding(false); setToastKey((k) => k + 1)
    setTimeout(() => setToastHiding(true), 1800)
    setTimeout(() => setToast(""), 2000)
  }, [])

  // Background memory update: after a turn finishes, the cheapest active model
  // rewrites the user's memory profile, folding in any durable new facts.
  // Reuses /api/chat (BYOK) so there's no new provider code. Best-effort —
  // never blocks chat.
  const runMemoryUpdate = useCallback(
    async (userMsg: string, assistantText: string, provider: Provider) => {
      try {
        const current = memoryProfileRef.current
        const messages = [
          { role: "system", content: buildMemoryUpdatePrompt(current) },
          { role: "user", content: `User: ${userMsg}\n\nAI answer(s):\n${assistantText.slice(0, 4000)}` },
        ]
        const raw = await collectFull(provider, messages, MEMORY_MODELS[provider])
        const updated = cleanProfile(raw)
        if (!updated || updated === current.trim()) {
          console.debug("[memory] no profile change.")
          return
        }
        const res = await fetch("/api/memory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: updated }),
        })
        if (!res.ok) {
          console.warn("[memory] PUT /api/memory failed:", res.status, await res.text().catch(() => ""))
          return
        }
        const data: { profile?: string } = await res.json()
        const saved = typeof data?.profile === "string" ? data.profile : updated
        setMemoryProfile(saved); memoryProfileRef.current = saved
        showToast("Memory updated")
      } catch (e) {
        console.warn("[memory] update failed:", e)
      }
    },
    [collectFull, showToast]
  )

  // Fire extraction once per completed, real turn (skip demo / commands / images).
  useEffect(() => {
    const realActive = PROVIDERS.filter((p) => enabled[p] && apiKeys[p].trim() && apiKeys[p] !== "demo")
    if (realActive.length === 0) return
    turns.forEach((turn) => {
      if (extractedRef.current.has(turn.id)) return
      if (turn.userMessage.startsWith("/")) { extractedRef.current.add(turn.id); return }
      const allDone = turn.isFusion
        ? turn.fusedResponse?.done === true
        : Object.values(turn.responses).length > 0 && Object.values(turn.responses).every((r) => r?.done === true)
      if (!allDone) return
      extractedRef.current.add(turn.id)
      let assistantText = ""
      if (turn.isFusion && turn.fusedResponse?.content && !turn.fusedResponse.error) {
        assistantText = turn.fusedResponse.content
      } else {
        assistantText = (Object.keys(turn.responses) as Provider[])
          .map((p) => turn.responses[p])
          .filter((r) => r?.done && r.content && !r.error && !isImageContent(r.content))
          .map((r) => r!.content)
          .join("\n\n")
      }
      if (!assistantText.trim()) return
      void runMemoryUpdate(turn.userMessage, assistantText, realActive[0])
    })
  }, [turns, enabled, apiKeys, runMemoryUpdate])

  // Save the whole memory profile by hand (the "editable profile" promise).
  // Optimistic; PUT is scoped to the owner and clamped per plan server-side.
  const handleSaveProfile = useCallback(async (profile: string) => {
    const clean = profile.slice(0, MEMORY_PROFILE_MAX)
    setMemoryProfile(clean); memoryProfileRef.current = clean
    try {
      const res = await fetch("/api/memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: clean }),
      })
      if (res.ok) {
        const data: { profile?: string } = await res.json().catch(() => ({}))
        if (typeof data?.profile === "string") { setMemoryProfile(data.profile); memoryProfileRef.current = data.profile }
        showToast(clean.trim() ? "Memory saved" : "Memory cleared")
      }
    } catch {}
  }, [showToast])

  const execCommand = useCallback((id: string) => {
    setInput("")
    if (id === "clear") {
      setTurns([]); textareaRef.current?.focus()
    } else if (id === "new") {
      handleNewSession()
    } else if (id === "sidebar") {
      setSidebarOpen((v) => !v); textareaRef.current?.focus()
    } else if (id === "fusion") {
      const withKeys = PROVIDERS.filter((p) => apiKeys[p] && apiKeys[p] !== "demo")
      if (withKeys.length === 0) {
        setTurns((prev) => [...prev, { id: crypto.randomUUID(), userMessage: "/fusion", responses: { openai: { content: "No models with an API key configured.", loading: false, done: true } } }])
      } else {
        const next = Object.fromEntries(PROVIDERS.map((p) => [p, withKeys.includes(p)])) as Record<Provider, boolean>
        setEnabled(next)
        showToast(`Fusion active — ${withKeys.map((p) => CFG[p].name).join(", ")}`)
      }
      textareaRef.current?.focus()
    } else if (id === "solo") {
      const active = PROVIDERS.filter((p) => enabled[p] && apiKeys[p].trim())
      if (active.length > 0) {
        const next = Object.fromEntries(PROVIDERS.map((p) => [p, p === active[0]])) as Record<Provider, boolean>
        setEnabled(next)
        showToast(`Only ${CFG[active[0]].name} active`)
      }
      textareaRef.current?.focus()
    } else if (id === "retry") {
      const last = [...turns].reverse().find((t) => t.userMessage && !t.userMessage.startsWith("/"))
      if (last) setInput(last.userMessage)
      textareaRef.current?.focus()
    } else if (id === "copy") {
      const last = [...turns].reverse().find((t) => !t.userMessage.startsWith("/"))
      if (last) {
        const text = last.isFusion
          ? (last.fusedResponse?.content ?? "")
          : (Object.entries(last.responses) as [Provider, ModelResponseState | undefined][])
              .map(([p, r]) => r?.content ? `[${CFG[p].name}]:\n${r.content}` : null)
              .filter((x): x is string => x !== null)
              .join("\n\n---\n\n")
        navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard")).catch(() => {})
      }
      textareaRef.current?.focus()
    } else if (id === "demo") {
      setApiKeys({ openai: "demo", anthropic: "demo", google: "demo", groq: "", openrouter: "", xai: "", mistral: "", deepseek: "" })
      setEnabled({ openai: true, anthropic: true, google: true, groq: false, openrouter: false, xai: false, mistral: false, deepseek: false })
      textareaRef.current?.focus()
    } else if (id === "models") {
      const active = PROVIDERS.filter((p) => enabled[p] && apiKeys[p].trim())
      const msg = active.length > 0 ? `Active models: ${active.map((p) => CFG[p].name).join(", ")}` : "No active models."
      setTurns((prev) => [...prev, { id: crypto.randomUUID(), userMessage: "/models", responses: { openai: { content: msg, loading: false, done: true } } }])
    } else if (id === "help") {
      const msg = SLASH_COMMANDS.map((c) => `${c.label} · ${c.desc}`).join("\n")
      setTurns((prev) => [...prev, { id: crypto.randomUUID(), userMessage: "/help", responses: { openai: { content: msg, loading: false, done: true } } }])
    }
  }, [setApiKeys, setEnabled, enabled, apiKeys, turns, handleNewSession, showToast, setTurns])

  const handleSend = useCallback(async () => {
    const msg = input.trim()
    // Attached images can be sent with no text (e.g. "qué ves acá").
    const imgs = imageMode ? [] : attachments
    if (!msg && imgs.length === 0) return
    const matchedCmd = SLASH_COMMANDS.find((c) => c.label === msg)
    if (matchedCmd) { execCommand(matchedCmd.id); return }
    if (isLoading || activeProviders.length === 0) return

    const imgProviders = activeProviders.filter((p) => IMAGE_CAPABLE.includes(p))
    if (imageMode && imgProviders.length === 0) {
      showToast("Enable OpenAI, Google or xAI to generate images")
      return
    }
    if (imgs.length > 0 && !activeProviders.some((p) => VISION_CAPABLE.includes(p))) {
      showToast("Enable OpenAI, Claude, Gemini or Grok to send images")
      return
    }

    await ensureActiveSession()
    setInput("")
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setIsLoading(true)
    setSendKey((k) => k + 1)

    const turnId = crypto.randomUUID()
    const currentTurns = turns
    // Text shown/sent for this turn; vision-only sends get a default prompt.
    const sendText = msg || (imgs.length ? "What do you see in this image?" : "")

    if (imageMode) {
      const initialResponses: Partial<Record<Provider, ModelResponseState>> = {}
      imgProviders.forEach((p) => { initialResponses[p] = { content: "", loading: true, done: false } })
      setTurns((prev) => [...prev, { id: turnId, userMessage: msg, responses: initialResponses }])
      await Promise.all(imgProviders.map((p) =>
        streamProvider(p, [{ role: "user", content: msg }], turnId, { mode: "image", model: DEFAULT_IMAGE_MODELS[p] })
      ))
    } else if (fusionMode) {
      setTurns((prev) => [...prev, {
        id: turnId, userMessage: sendText, images: imgs, responses: {}, isFusion: true,
        fusedResponse: { content: "", loading: true, done: false, phase: "collecting" },
      }])
      const results = await Promise.allSettled(activeProviders.map((p) => collectFull(p, buildSharedHistory(currentTurns, activeProviders, sendText, p, memoryProfileRef.current), undefined, VISION_CAPABLE.includes(p) ? imgs : [])))
      const parts = activeProviders
        .map((p, i) => {
          const r = results[i]
          if (r.status === "fulfilled" && r.value.trim()) return `[${CFG[p].name}]:\n${r.value.trim()}`
          return null
        })
        .filter((x): x is string => x !== null)
      if (parts.length === 0) {
        setTurns((prev) => prev.map((t) => t.id === turnId ? { ...t, fusedResponse: { content: "", loading: false, done: true, error: "No model responded" } } : t))
        setIsLoading(false)
        return
      }
      const synthesisMsg =
        `Below are the answers from different AI models to the user's question: "${sendText}"\n\n` +
        parts.join("\n\n---\n\n") +
        `\n\nSynthesize these answers into ONE single unified, clear and complete answer. Take the best insights from each model, remove redundancies and present the information coherently. Answer directly and naturally, without mentioning that you're synthesizing or referencing the models by name. Always answer in the user's language.`
      const synthProvider = activeProviders[0]
      const synthHistory = [
        ...currentTurns.flatMap((t): { role: string; content: string }[] => {
          const arr: { role: string; content: string }[] = [{ role: "user", content: t.userMessage }]
          if (t.isFusion && t.fusedResponse?.content) arr.push({ role: "assistant", content: t.fusedResponse.content })
          return arr
        }),
        { role: "user", content: synthesisMsg },
      ]
      await streamFusion(synthProvider, synthHistory, turnId)
    } else {
      const initialResponses: Partial<Record<Provider, ModelResponseState>> = {}
      activeProviders.forEach((p) => { initialResponses[p] = { content: "", loading: true, done: false } })
      setTurns((prev) => [...prev, { id: turnId, userMessage: sendText, images: imgs, responses: initialResponses }])
      await Promise.all(activeProviders.map((p) => streamProvider(p, buildSharedHistory(currentTurns, activeProviders, sendText, p, memoryProfileRef.current), turnId, { images: VISION_CAPABLE.includes(p) ? imgs : [] })))
    }

    setIsLoading(false)
    textareaRef.current?.focus()
  }, [input, isLoading, activeProviders, turns, fusionMode, imageMode, attachments, showToast, streamProvider, collectFull, streamFusion, execCommand, ensureActiveSession, setTurns])

  const filteredCmds = input.startsWith("/")
    ? SLASH_COMMANDS.filter((c) => c.label.startsWith(input.toLowerCase().split(" ")[0]))
    : []
  const showCmdPalette = filteredCmds.length > 0 && !input.includes(" ")

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCmdPalette) {
      if (e.key === "ArrowDown") { e.preventDefault(); setCmdIndex((i) => (i + 1) % filteredCmds.length) }
      if (e.key === "ArrowUp") { e.preventDefault(); setCmdIndex((i) => (i - 1 + filteredCmds.length) % filteredCmds.length) }
      if (e.key === "Tab") { e.preventDefault(); setInput(filteredCmds[cmdIndex]?.label ?? input); return }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); execCommand(filteredCmds[cmdIndex]?.id ?? ""); return }
      if (e.key === "Escape") { setInput(""); return }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const activeCount = activeProviders.length

  const activateDemo = useCallback(() => {
    setApiKeys({ openai: "demo", anthropic: "demo", google: "demo", groq: "", openrouter: "", xai: "", mistral: "", deepseek: "" })
    setEnabled({ openai: true, anthropic: true, google: true, groq: false, openrouter: false, xai: false, mistral: false, deepseek: false })
  }, [setApiKeys, setEnabled])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* Edge hint: a thin tappable strip so a swipe/tap on the far-left
          screen edge also opens the drawer on mobile. */}
      <button
        aria-label="Open conversations"
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-0 bottom-0 left-0 w-2 z-20"
        style={{ background: "transparent", opacity: sidebarOpen ? 0 : 1, pointerEvents: sidebarOpen ? "none" : "auto" }}
      />

      {/* ── Memory drawer ─────────────────────────────────────────────── */}
      {memoryOpen && (
        <MemoryDrawer
          profile={memoryProfile}
          onClose={() => setMemoryOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onExpand={() => setSidebarOpen(true)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onNewSession={handleNewSession}
          onOpenMemory={() => setMemoryOpen(true)}
          memoryCount={memoryProfile.trim() ? 1 : 0}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          folders={folders}
          collapsedFolders={collapsedFolders}
          onToggleFolder={handleToggleFolder}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveChat={handleMoveChat}
        />

        <div className="flex flex-col flex-1 overflow-hidden">

          {/* ── Mobile top bar (md:hidden) ───────────────────────────────────
              Sits in normal flow so content never hides under the iOS notch.
              padding-top reads the safe-area inset so it clears the notch. */}
          <div
            className="md:hidden flex-shrink-0 flex items-center gap-1.5 px-2"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
              paddingBottom: "8px",
              background: "var(--surface-blur)",
              backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {/* Left — open conversations drawer */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="View conversations"
              className="h-9 w-9 rounded-lg flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              style={{ color: "var(--text-2)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]">
                <rect x="3" y="3" width="18" height="18" rx="2.5" /><path d="M9 3v18" /><path d="M13.5 9l2.5 3-2.5 3" />
              </svg>
            </button>

            {/* Center — active models (or app name) */}
            <div className="flex-1 flex items-center justify-center min-w-0 px-1">
              <span className="text-[14px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
                {activeCount > 0 ? activeProviders.map((p) => CFG[p].name).join(" · ") : "OneChater"}
              </span>
            </div>

            {/* Right — new chat */}
            <button
              onClick={handleNewSession}
              aria-label="New chat"
              className="h-9 w-9 rounded-lg flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              style={{ color: "var(--text-2)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll chat-backdrop px-3 md:px-8 py-6 md:py-10 space-y-8 md:space-y-10">
            {turns.length === 0 ? (
              <EmptyState hasActive={activeCount > 0} onActivateDemo={activateDemo}
                onPromptClick={(p) => { setInput(p); textareaRef.current?.focus() }} />
            ) : (
              turns.map((turn) => (
                <TurnBlock
                  key={turn.id}
                  turn={turn}
                  activeProviders={PROVIDERS.filter((p) => !!turn.responses[p])}
                  selectedModels={selectedModels}
                  onRegenerate={handleRegenerate}
                />
              ))
            )}
            <div ref={bottomRef} className="h-2" />
          </div>

          {/* ── Input area (floating island — no background band) ───────── */}
          <div className="flex-shrink-0 px-3 md:px-8 pb-3 md:pb-4 pt-1" style={{ background: "transparent" }}>

            {toast && (
              <div key={toastKey} className="max-w-4xl mx-auto mb-2 flex justify-center">
                <div className="toast-animated flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white"
                  style={{
                    background: "#1e1f24", boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    animation: toastHiding ? "toastOut 0.2s ease-in forwards" : "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
                  }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-green-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {toast}
                </div>
              </div>
            )}

            {showCmdPalette && (
              <div className="max-w-4xl mx-auto mb-2 rounded-xl overflow-hidden border border-black/10 bg-white shadow-lg">
                {filteredCmds.map((cmd, i) => (
                  <button key={cmd.id}
                    onMouseDown={(e) => { e.preventDefault(); execCommand(cmd.id) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer"
                    style={{ background: i === cmdIndex ? "rgba(0,0,0,0.04)" : "transparent" }}
                    onMouseEnter={() => setCmdIndex(i)}>
                    <span className="text-sm font-mono font-semibold text-gray-900">{cmd.label}</span>
                    <span className="text-xs text-gray-600">{cmd.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input card */}
            <div className="input-card-lift max-w-4xl mx-auto rounded-2xl overflow-visible"
              style={{
                background: "var(--surface)",
                border: inputFocused ? "1px solid var(--border-strong)" : "1px solid var(--border)",
                transform: inputFocused ? "translateY(-1px)" : "translateY(0)",
                boxShadow: isLoading
                  ? "0 0 0 3px rgba(249,115,22,0.08), 0 8px 28px -10px rgba(0,0,0,0.22)"
                  : inputFocused
                    ? "0 0 0 3px var(--overlay), 0 10px 30px -12px rgba(0,0,0,0.28)"
                    : "0 8px 26px -12px rgba(0,0,0,0.22)",
              }}>

              {/* Attachment thumbnails (vision) */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pt-3">
                  {attachments.map((src, i) => (
                    <div key={i} className="relative group/att w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ border: "1px solid var(--border)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`adjunto ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                        title="Remove image">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Row 1: textarea */}
              <div className="px-4 pt-3 pb-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    setCmdIndex(0)
                    e.target.style.height = "auto"
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"
                  }}
                  onFocus={() => {
                    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
                    setInputFocused(true)
                  }}
                  onBlur={() => {
                    blurTimerRef.current = setTimeout(() => setInputFocused(false), 200)
                  }}
                  onKeyDown={handleKey}
                  placeholder={
                    activeCount === 0
                      ? "Select an AI to get started…"
                      : imageMode
                      ? "Describe the image you want to generate…"
                      : `Ask ${activeProviders.map((p) => CFG[p].name).join(", ")}…`
                  }
                  disabled={activeCount === 0 || isLoading}
                  rows={1}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full bg-transparent text-[15px] text-gray-900 placeholder-gray-600 resize-none focus:outline-none disabled:opacity-70 leading-relaxed"
                  style={{ maxHeight: "160px" }}
                />
              </div>

              {/* Row 2: toolbar */}
              <div className="flex items-center gap-2 px-3 pb-2.5">
                <AIChipSelector
                  apiKeys={apiKeys}
                  setApiKeys={setApiKeys}
                  enabled={enabled}
                  setEnabled={setEnabled}
                  selectedModels={selectedModels}
                  setSelectedModels={setSelectedModels}
                  onActivateDemo={activateDemo}
                  plan={plan}
                />
                <div className="flex-1" />
                {/* Attach image (vision) — hidden in image-generation mode */}
                {!imageMode && (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => { addAttachments(e.target.files); if (e.target) e.target.value = "" }}
                    />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={activeCount === 0 || isLoading || attachments.length >= 4}
                      title={attachments.length >= 4 ? "Maximum 4 images" : "Attach image"}
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "rgba(0,0,0,0.05)", color: "#6b7280", border: "1px solid rgba(0,0,0,0.1)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setImageMode((v) => !v)}
                  title={imageMode ? "Image mode active" : "Generate images"}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-150 active:scale-95"
                  style={{
                    background: imageMode ? "linear-gradient(135deg, #f97316, #ea580c)" : "rgba(0,0,0,0.05)",
                    color: imageMode ? "white" : "#6b7280",
                    border: imageMode ? "1px solid #ea580c" : "1px solid rgba(0,0,0,0.1)",
                    boxShadow: imageMode ? "0 2px 8px rgba(249,115,22,0.3)" : "none",
                  }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && attachments.length === 0) || activeCount === 0 || isLoading}
                  className="send-btn w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #2a2b30, #1e1f24)",
                    boxShadow: "0 2px 6px rgba(14,15,18,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}>
                  {isLoading ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <span key={sendKey} className={sendKey > 0 ? "send-icon-pop inline-flex" : "inline-flex"}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-gray-500 mt-1.5 truncate px-2">
              {imageMode
                ? "Image mode · OpenAI, Google, xAI each generate their image"
                : fusionMode
                ? "Fusion · the models synthesize a single answer"
                : "Enter to send · Shift+Enter for a new line"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
