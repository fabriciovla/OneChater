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
  responses: Partial<Record<Provider, ModelResponseState>>
  isFusion?: boolean
  fusedResponse?: ModelResponseState
}

interface ChatSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  turns?: ConversationTurn[]
}

// A durable fact the AI remembers about the user across ALL conversations.
interface Memory {
  id: string
  content: string
  category?: string | null
  createdAt: number
}

// ─── Provider configs ─────────────────────────────────────────────────────────

const PROVIDERS: Provider[] = ["openai", "anthropic", "google", "groq", "openrouter", "xai", "mistral", "deepseek"]

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

// ─── Image generation ──────────────────────────────────────────────────────────

const IMAGE_CAPABLE: Provider[] = ["openai", "google", "xai"]

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

// Instructions for the extractor model. `known` are facts we already store,
// passed so the model doesn't return duplicates.
function buildExtractPrompt(known: string[]): string {
  return `Sos un extractor de memoria de largo plazo para un asistente de IA. A partir del intercambio, extraé SOLO hechos durables sobre el USUARIO que convenga recordar en futuras conversaciones: su stack/tecnologías, proyectos y clientes, preferencias de trabajo, decisiones tomadas, tono/estilo, y datos personales relevantes para sus tareas.

NO incluyas: preguntas puntuales, contenido efímero, obviedades, ni nada que ya sé.

Ya sé esto (NO lo repitas ni lo reformules):
${known.length ? known.map((k) => `- ${k}`).join("\n") : "(nada todavía)"}

Devolvé EXCLUSIVAMENTE un array JSON válido, con 0 a 5 objetos:
[{"content":"hecho corto en español","category":"stack|project|preference|decision|tone|other"}]

REGLA DE FORMATO ESTRICTA: tu respuesta tiene que EMPEZAR con "[" y TERMINAR con "]". Nada de texto antes o después, nada de explicaciones, nada de markdown ni \`\`\`. Si no hay nada nuevo que valga la pena, devolvé exactamente: []`
}

// Pull a JSON fact array out of an LLM response (which may wrap it in prose
// or a ```json fence). Returns clamped, validated facts.
function parseFacts(raw: string): { content: string; category: string | null }[] {
  try {
    const m = raw.match(/\[[\s\S]*\]/)
    if (!m) return []
    const arr = JSON.parse(m[0])
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x) => x && typeof x.content === "string" && x.content.trim().length > 2)
      .slice(0, 5)
      .map((x) => ({
        content: String(x.content).trim().slice(0, 400),
        category: typeof x.category === "string" ? x.category.slice(0, 40) : null,
      }))
  } catch {
    return []
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSystemPrompt(provider: Provider, activeProviders: Provider[], memories: Memory[]): { role: string; content: string } {
  const others = activeProviders.filter((p) => p !== provider).map((p) => CFG[p].name)
  const othersStr = others.length > 0 ? ` junto a ${others.join(" y ")}` : ""
  const memBlock = memories.length
    ? `\n\nMEMORIA DEL USUARIO (aprendida en conversaciones anteriores, vale para TODA charla con cualquier modelo):\n${memories
        .slice(0, 40)
        .map((m) => `- ${m.content}`)
        .join("\n")}\n\nUsá esta memoria cuando sea relevante. No la recites entera ni digas "según mi memoria"; simplemente actuá como alguien que ya conoce al usuario y su contexto.`
    : ""
  return {
    role: "system",
    content: `Eres ${CFG[provider].name} en una plataforma de chat multi-modelo${othersStr}.

REGLA CRÍTICA: El historial de conversación contiene respuestas de TODOS los modelos participantes. Cada respuesta de asistente tiene prefijos como [${CFG[provider].name}]:${others.map((n) => ` [${n}]:`).join("")} que indican qué modelo dijo cada cosa. Este historial ES tu memoria compartida.

IMPORTANTE: Respondé DIRECTAMENTE sin incluir ningún prefijo como [${CFG[provider].name}]: al inicio. Nunca copies ese formato en tu respuesta. NUNCA digas que no tienes acceso a lo que dijeron otros modelos. Respondé siempre en el idioma del usuario.${memBlock}`,
  }
}

function buildSharedHistory(
  turns: ConversationTurn[],
  activeProviders: Provider[],
  newMessage: string,
  provider: Provider,
  memories: Memory[] = []
): { role: string; content: string }[] {
  const msgs: { role: string; content: string }[] = [buildSystemPrompt(provider, activeProviders, memories)]
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
  const labels: Record<string, string> = { hoy: "Hoy", ayer: "Ayer", semana: "Últimos 7 días", mes: "Últimos 30 días", antiguo: "Más antiguas" }
  return (["hoy", "ayer", "semana", "mes", "antiguo"] as const)
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ label: labels[k], sessions: buckets[k] }))
}

const SUGGESTED_PROMPTS: { title: string; subtitle: string; from: string; to: string; icon: React.ReactNode }[] = [
  {
    title: "Idea creativa", subtitle: "Brainstormeá ideas para…",
    from: "from-orange-500", to: "to-amber-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <path d="M12 3l1.6 4.2L18 8.8l-4.4 1.6L12 14.6l-1.6-4.2L6 8.8l4.4-1.6L12 3z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
      </svg>
    ),
  },
  {
    title: "Explicame", subtitle: "Conceptos complejos en simple",
    from: "from-amber-400", to: "to-yellow-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
      </svg>
    ),
  },
  {
    title: "Código", subtitle: "Ayudame a debuggear o escribir",
    from: "from-blue-500", to: "to-cyan-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: "Comparar", subtitle: "Analizá diferencias entre opciones",
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

function ResponseCard({ provider, state, selectedModel, index = 0, animate = false }: {
  provider: Provider; state: ModelResponseState; selectedModel: string; index?: number; animate?: boolean
}) {
  const c = CFG[provider]
  const isImg = !state.error && isImageContent(state.content)
  const modelLabel = isImg
    ? (IMAGE_MODELS[provider]?.find((m) => m.id === DEFAULT_IMAGE_MODELS[provider])?.label ?? "Imagen")
    : (c.models.find((m) => m.id === selectedModel)?.label ?? selectedModel)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!state.content) return
    navigator.clipboard.writeText(state.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

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
            Generando
          </span>
        )}
        <div className="flex-1" />
        {state.done && !state.error && state.content && isImg && (
          <a href={state.content} download={`onechat-${provider}.png`}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-all duration-150"
            style={{ background: "var(--surface)", border: `1px solid ${c.colorBorder}`, color: "var(--text-3)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Descargar
          </a>
        )}
        {state.done && !state.error && state.content && !isImg && (
          <button onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-all duration-150"
            style={{ background: "var(--surface)", border: `1px solid ${c.colorBorder}`, color: copied ? c.color : "var(--text-3)" }}>
            {copied ? (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12" /></svg>Copiado</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copiar</>
            )}
          </button>
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
              <img src={state.content} alt="Imagen generada" className="rounded-xl w-full h-auto transition-transform duration-200 hover:scale-[1.01]"
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
        <span className="text-[13px] font-bold text-orange-600">Fusión</span>
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
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12" /></svg>Copiado</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copiar</>
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

function TurnBlock({ turn, activeProviders, selectedModels }: {
  turn: ConversationTurn; activeProviders: Provider[]; selectedModels: Record<Provider, string>
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
        <div className="flex items-end gap-2.5 max-w-[78%]">
          <div className={`px-4 py-3 rounded-2xl rounded-br-md text-[15px] text-white leading-relaxed break-words whitespace-pre-wrap transition-transform duration-200 hover:scale-[1.015]${isNewTurn ? " msg-enter" : ""}`}
            style={{
              background: "linear-gradient(135deg, #2a2b30 0%, #1a1b1f 50%, #0e0f12 100%)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}>
            {turn.userMessage}
          </div>
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
      {/* Responses */}
      {turn.isFusion && turn.fusedResponse && <FusionCard state={turn.fusedResponse} providers={activeProviders} animate={isNewTurn} />}
      {!turn.isFusion && activeProviders.length > 0 && (
        <div className={`grid gap-x-6 gap-y-7 ${grid}`}>
          {activeProviders.map((p, idx) => {
            const state = turn.responses[p]
            if (!state) return null
            return <ResponseCard key={p} provider={p} state={state} selectedModel={selectedModels[p]} index={idx} animate={isNewTurn} />
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
          {hasActive ? "¿Qué querés preguntar?" : "Conectá tu primera IA"}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          {hasActive
            ? "Elegí una pregunta o escribí la tuya. Con más de un modelo activo, las respuestas se fusionan en una sola."
            : "Seleccioná una IA en el botón inferior e ingresá tu API key, o probá el modo demo sin configurar nada."}
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
  apiKeys, setApiKeys, enabled, setEnabled, selectedModels, setSelectedModels, onActivateDemo,
}: {
  apiKeys: Record<Provider, string>
  setApiKeys: (k: Record<Provider, string>) => void
  enabled: Record<Provider, boolean>
  setEnabled: (e: Record<Provider, boolean>) => void
  selectedModels: Record<Provider, string>
  setSelectedModels: (m: Record<Provider, string>) => void
  onActivateDemo: () => void
}) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [expanded, setExpanded] = useState<Provider | null>(null)
  const [draftKey, setDraftKey] = useState("")
  const panelRef = useRef<HTMLDivElement>(null)
  const isDemo = PROVIDERS.some((p) => apiKeys[p] === "demo")
  const activeProviders = PROVIDERS.filter((p) => apiKeys[p].trim() && enabled[p])

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
          <div className="flex -space-x-1">
            {activeProviders.slice(0, 4).map((p, i) => {
              const Logo = CFG[p].Logo
              return (
                <div key={p} className="ai-trigger-pop w-4 h-4 rounded-full flex items-center justify-center ring-1 ring-white"
                  style={{ background: CFG[p].colorLight, color: CFG[p].color, animationDelay: `${i * 0.05}s` }}>
                  <Logo size={9} />
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
            ? `${activeProviders.length} IA${activeProviders.length > 1 ? "s" : ""} activa${activeProviders.length > 1 ? "s" : ""}`
            : "Seleccionar IA"}
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
            <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Seleccionar IA</span>
            {isDemo ? (
              <span className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ color: "#f97316", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                Demo
                <button onClick={() => setApiKeys({ openai: "", anthropic: "", google: "", groq: "", openrouter: "", xai: "", mistral: "", deepseek: "" })}
                  className="ml-0.5 hover:opacity-70 cursor-pointer" style={{ color: "var(--text-4)" }} title="Salir del modo demo">×</button>
              </span>
            ) : (
              <button onClick={() => { onActivateDemo(); close() }}
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                style={{ color: "#f97316", background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 9, height: 9 }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Modo demo
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {PROVIDERS.map((p, ri) => {
              const c = CFG[p]
              const hasKey = !!apiKeys[p].trim() && apiKeys[p] !== "demo"
              const isDemoKey = apiKeys[p] === "demo"
              const active = (hasKey || isDemoKey) && enabled[p]
              const isExp = expanded === p
              const currentModel = c.models.find(m => m.id === selectedModels[p])?.label ?? selectedModels[p]

              return (
                <div key={p} className="ai-row-enter" style={{ borderBottom: "1px solid var(--border-soft)", animationDelay: `${0.04 + ri * 0.035}s` }}>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.03]"
                    onClick={() => handleRowClick(p)}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{ background: active ? c.colorLight : "var(--overlay)", border: `1px solid ${active ? c.colorBorder : "var(--border)"}`, color: active ? c.color : "var(--text-4)" }}>
                      <c.Logo size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold" style={{ color: active ? "var(--text-1)" : "var(--text-2)" }}>{c.name}</div>
                      <div className="text-[11px] truncate" style={{ color: active ? c.color : "var(--text-4)" }}>
                        {isDemoKey ? "Modo demo" : hasKey ? currentModel : "Sin API key · tocá para agregar"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
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
                    </div>
                  </div>

                  {/* Expanded config: inline, no nested dropdown */}
                  {isExp && (
                    <div className="ai-expand px-4 pb-3.5 pt-1.5 flex flex-col gap-3" style={{ background: c.colorLight }}>
                      {/* API key */}
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          placeholder={`API key de ${c.label}…`}
                          value={draftKey}
                          onChange={(e) => setDraftKey(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSaveKey(p) }}
                          className="flex-1 text-xs rounded-lg px-3 py-2 focus:outline-none min-w-0"
                          style={{ border: `1px solid ${c.colorBorder}`, background: "var(--surface)", color: "var(--text-1)" }}
                          autoComplete="off" spellCheck={false} autoFocus
                        />
                        <button onClick={() => handleSaveKey(p)} disabled={!draftKey.trim()}
                          className="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer disabled:opacity-30 hover:opacity-85 flex-shrink-0"
                          style={{ background: c.color }} title="Guardar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        {hasKey && (
                          <button onClick={() => handleRemoveKey(p)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer flex-shrink-0"
                            style={{ border: "1px solid var(--border)", background: "var(--surface)" }} title="Eliminar key">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, color: "#ef4444" }}>
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {/* Model chips */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>Modelo</span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {c.models.map((m) => {
                            const sel = selectedModels[p] === m.id
                            return (
                              <button
                                key={m.id}
                                onClick={() => setSelectedModels({ ...selectedModels, [p]: m.id })}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-150 active:scale-95"
                                style={{
                                  background: sel ? c.color : "var(--surface)",
                                  color: sel ? "#fff" : "var(--text-2)",
                                  border: `1px solid ${sel ? c.color : "var(--border)"}`,
                                }}
                              >
                                {m.label}
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

function HistoryItem({ session, active, onSelect, onDelete, delay = 0 }: {
  session: ChatSession; active: boolean; onSelect: () => void; onDelete: () => void; delay?: number
}) {
  return (
    <div
      className="group flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-lg cursor-pointer transition-all duration-150 relative history-item-enter"
      style={{
        background: active ? "var(--overlay)" : "transparent",
        animationDelay: `${delay}ms`,
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
      <span className="text-[10px] flex-shrink-0 group-hover:hidden tabular-nums" style={{ color: "var(--text-4)" }}>
        {formatRelativeTime(session.updatedAt)}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="hidden group-hover:flex w-6 h-6 flex-shrink-0 items-center justify-center rounded-md transition-colors cursor-pointer"
        style={{ color: "var(--text-4)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)" }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-4)"; e.currentTarget.style.background = "transparent" }}
        title="Eliminar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  )
}

// ─── Sidebar (history only, light theme) ─────────────────────────────────────

function Sidebar({
  open, onClose, sessions, activeSessionId, onSelectSession, onDeleteSession, onNewSession,
  onOpenMemory, memoryCount,
}: {
  open: boolean
  onClose: () => void
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onNewSession: () => void
  onOpenMemory: () => void
  memoryCount: number
}) {
  // Close the drawer after an action only on mobile (overlay); desktop keeps it pinned.
  const closeIfMobile = () => { if (typeof window !== "undefined" && window.innerWidth < 768) onClose() }
  const selectSession = (id: string) => { onSelectSession(id); closeIfMobile() }
  const newSession = () => { onNewSession(); closeIfMobile() }
  const openMemory = () => { onOpenMemory(); closeIfMobile() }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      )}

      <aside
        className={[
          "z-40 overflow-hidden",
          // mobile: fixed slide-in drawer under the topbar
          "fixed top-14 bottom-0 left-0 w-[268px] transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          // desktop: in-flow, width-animated
          "md:static md:top-auto md:bottom-auto md:z-auto md:translate-x-0 md:transition-[width] md:duration-300 md:flex-shrink-0",
          open ? "md:w-[240px]" : "md:w-0",
        ].join(" ")}
        style={{
          background: "var(--surface-2)",
          borderRight: "1px solid var(--border)",
          boxShadow: open ? "4px 0 24px -16px rgba(0,0,0,0.25)" : "none",
        }}
      >
      <div className="flex flex-col h-full w-full md:w-[240px]">

        {/* Header + new chat button */}
        <div className="px-3 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between px-1 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>
              Conversaciones
            </span>
            {sessions.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums"
                style={{ background: "var(--overlay)", color: "var(--text-3)", border: "1px solid var(--border-soft)" }}>
                {sessions.length}
              </span>
            )}
          </div>
          <button
            onClick={newSession}
            className="group/new w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white cursor-pointer transition-all duration-150 hover:opacity-95 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #2a2b30, #0e0f12)",
              boxShadow: "0 4px 14px -6px rgba(14,15,18,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <span className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover/new:rotate-90"
              style={{ background: "rgba(255,255,255,0.14)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            Nueva conversación
          </button>
        </div>

        {/* History grouped by date */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-3">
          {sessions.length === 0 && (
            <div className="px-3 py-10 text-center flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--overlay)", border: "1px solid var(--border-soft)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{ color: "var(--text-4)" }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-4)" }}>Sin conversaciones aún.<br />Empezá a chatear para verlas acá.</p>
            </div>
          )}
          {groupSessionsByDate(sessions).map((group) => (
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
                    delay={sessions.indexOf(s) * 35}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile-only nav: Dashboard + Memoria (topbar hides these < md) */}
        <div className="md:hidden flex-shrink-0 p-2 grid grid-cols-2 gap-1.5" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <Link href="/dashboard" onClick={closeIfMobile}
            className="flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[12.5px] font-medium cursor-pointer transition-all active:scale-[0.98]"
            style={{ background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0" style={{ color: "#7c3aed" }}>
              <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
            Dashboard
          </Link>
          <button onClick={openMemory}
            className="relative flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[12.5px] font-medium cursor-pointer transition-all active:scale-[0.98]"
            style={{ background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0" style={{ color: "#7c3aed" }}>
              <path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" />
              <path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" />
              <path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" />
            </svg>
            Memoria
            {memoryCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
                {memoryCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
    </>
  )
}

// ─── Memory drawer ────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  stack:      { label: "Stack",       color: "#3b82f6" },
  project:    { label: "Proyecto",    color: "#10b981" },
  preference: { label: "Preferencia", color: "#f97316" },
  decision:   { label: "Decisión",    color: "#8b5cf6" },
  tone:       { label: "Tono",        color: "#ec4899" },
  other:      { label: "Otro",        color: "var(--text-3)" },
}

function MemoryDrawer({ memories, onClose, onDelete, onEdit, onAdd }: {
  memories: Memory[]
  onClose: () => void
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => void
  onAdd: (content: string, category: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState("")
  const [newCategory, setNewCategory] = useState("other")

  const startEdit = (m: Memory) => { setEditingId(m.id); setEditText(m.content) }
  const cancelEdit = () => { setEditingId(null); setEditText("") }
  const commitEdit = () => {
    if (editingId && editText.trim().length >= 3) onEdit(editingId, editText)
    cancelEdit()
  }
  const cancelAdd = () => { setAdding(false); setNewText(""); setNewCategory("other") }
  const commitAdd = () => {
    if (newText.trim().length >= 3) onAdd(newText, newCategory)
    cancelAdd()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} style={{ animation: "memFadeIn 0.2s ease both" }} />
      <div className="relative h-full w-full max-w-[420px] flex flex-col bg-white shadow-2xl"
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
            <div className="text-[15px] font-semibold text-gray-900 leading-tight">Memoria</div>
            <div className="text-[12px] text-gray-500 mt-0.5 leading-snug">
              {memories.length > 0
                ? `${memories.length} ${memories.length === 1 ? "hecho que las IAs recuerdan" : "hechos que las IAs recuerdan"} de vos, en todos tus chats y modelos.`
                : "Lo que las IAs aprendan de vos aparecerá acá y te acompaña en cada chat y modelo."}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-black/[0.05] transition-all cursor-pointer flex-shrink-0" title="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Add a fact by hand */}
        <div className="px-4 pt-3 flex-shrink-0">
          {adding ? (
            <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid rgba(124,58,237,0.18)" }}>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                autoFocus
                rows={2}
                placeholder="Ej: Trabajo con Next.js y Postgres en Neon…"
                className="w-full resize-none bg-transparent text-[13px] text-gray-800 outline-none placeholder:text-gray-400 leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitAdd()
                  if (e.key === "Escape") cancelAdd()
                }}
              />
              <div className="flex items-center justify-between mt-2 gap-2">
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                  className="text-[11px] font-medium text-gray-600 bg-white rounded-lg px-2 py-1 cursor-pointer outline-none"
                  style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                  {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div className="flex items-center gap-1.5">
                  <button onClick={cancelAdd}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-black/[0.04] transition-colors cursor-pointer">Cancelar</button>
                  <button onClick={commitAdd} disabled={newText.trim().length < 3}
                    className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>Guardar</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-medium text-gray-600 transition-all hover:text-gray-900 hover:border-violet-300 cursor-pointer"
              style={{ background: "var(--surface-2)", border: "1px dashed rgba(0,0,0,0.15)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14" /></svg>
              Agregar un hecho manualmente
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {memories.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-3 px-6 py-20">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
                <svg viewBox="0 0 24 24" fill="#7c3aed" className="w-5 h-5" style={{ opacity: 0.7 }}>
                  <path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" />
                  <path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" />
                  <path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" />
                </svg>
              </div>
              <p className="text-[12.5px] text-gray-500 leading-relaxed max-w-[260px]">
                Todavía no aprendí nada de vos. Chateá con tu API key y voy guardando tu stack, proyectos y preferencias automáticamente.
              </p>
            </div>
          ) : (
            memories.map((m) => {
              const meta = CATEGORY_META[m.category ?? "other"] ?? CATEGORY_META.other
              const isEditing = editingId === m.id
              const tint = (pct: number) => `color-mix(in srgb, ${meta.color} ${pct}%, transparent)`
              return (
                <div key={m.id} className="group relative rounded-xl p-3 transition-all duration-200 hover:-translate-y-px"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-soft)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = tint(35); e.currentTarget.style.boxShadow = "0 4px 14px -8px rgba(0,0,0,0.25)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-soft)"; e.currentTarget.style.boxShadow = "none" }}>
                  {isEditing ? (
                    <>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        rows={2}
                        className="w-full resize-none rounded-lg px-2.5 py-2 text-[13px] leading-relaxed outline-none"
                        style={{ border: "1px solid rgba(124,58,237,0.35)", background: "var(--surface)", color: "var(--text-1)" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitEdit()
                          if (e.key === "Escape") cancelEdit()
                        }}
                      />
                      <div className="flex items-center gap-1.5 mt-2">
                        <button onClick={commitEdit} disabled={editText.trim().length < 3}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>Guardar</button>
                        <button onClick={cancelEdit}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium hover:bg-black/[0.04] transition-colors cursor-pointer" style={{ color: "var(--text-3)" }}>Cancelar</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Top row: category chip + hover actions */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                          style={{ background: tint(12), color: meta.color, border: `1px solid ${tint(28)}` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(m)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:text-violet-600 hover:bg-violet-500/10"
                            style={{ color: "var(--text-4)" }} title="Editar este hecho">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                              <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                          <button onClick={() => onDelete(m.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:text-red-500 hover:bg-red-500/10"
                            style={{ color: "var(--text-4)" }} title="Olvidar este hecho">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-1)" }}>{m.content}</p>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex-shrink-0 text-[11px] text-gray-400 leading-snug" style={{ borderTop: "1px solid var(--border-soft)" }}>
          Se captura sola al chatear y viaja con vos entre modelos. Borrá lo que no quieras que recuerden.
        </div>
      </div>
    </div>
  )
}

// ─── Slash commands ───────────────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { id: "clear",   label: "/clear",   desc: "Borrar conversación actual" },
  { id: "new",     label: "/new",     desc: "Nueva conversación" },
  { id: "fusion",  label: "/fusion",  desc: "Activar todos los modelos con key" },
  { id: "solo",    label: "/solo",    desc: "Usar solo el primer modelo activo" },
  { id: "models",  label: "/models",  desc: "Ver modelos activos" },
  { id: "sidebar", label: "/sidebar", desc: "Abrir/cerrar sidebar" },
  { id: "retry",   label: "/retry",   desc: "Reenviar último mensaje" },
  { id: "copy",    label: "/copy",    desc: "Copiar última respuesta" },
  { id: "demo",    label: "/demo",    desc: "Activar modo demo" },
  { id: "help",    label: "/help",    desc: "Ver todos los comandos" },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const activeSessionIdRef = useRef<string | null>(null)
  const sessionsRef = useRef<ChatSession[]>([])
  const [turns, setTurnsState] = useState<ConversationTurn[]>([])
  const persistingRef = useRef<Set<string>>(new Set())
  const { data: session } = useSession()

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

  // Cross-conversation memory: facts the AI knows about the user everywhere.
  const [memories, setMemories] = useState<Memory[]>([])
  const memoriesRef = useRef<Memory[]>([])
  useEffect(() => { memoriesRef.current = memories }, [memories])
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
      .then((d: Memory[]) => { if (Array.isArray(d)) { setMemories(d); memoriesRef.current = d } })
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
      body: JSON.stringify({ title: "Nueva conversación" }),
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
      body: JSON.stringify({ title: "Nueva conversación" }),
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [turns])

  const activeProviders = PROVIDERS.filter((p) => enabled[p] && apiKeys[p].trim())
  const fusionMode = activeProviders.length > 1

  const streamProvider = useCallback(
    async (provider: Provider, messages: { role: string; content: string }[], turnId: string, opts?: { mode?: "image"; model?: string }) => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, provider, apiKey: apiKeys[provider], model: opts?.model ?? selectedModels[provider], mode: opts?.mode }),
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

  const collectFull = useCallback(async (provider: Provider, messages: { role: string; content: string }[], modelOverride?: string): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, provider, apiKey: apiKeys[provider], model: modelOverride ?? selectedModels[provider] }),
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

  // Background memory capture: after a turn finishes, the cheapest active model
  // distills durable facts about the user and stores them. Reuses /api/chat
  // (BYOK) so there's no new provider code. Best-effort — never blocks chat.
  const runExtraction = useCallback(
    async (userMsg: string, assistantText: string, provider: Provider) => {
      try {
        const known = memoriesRef.current.slice(0, 60).map((m) => m.content)
        const messages = [
          { role: "system", content: buildExtractPrompt(known) },
          { role: "user", content: `Usuario: ${userMsg}\n\nRespuesta(s) de IA:\n${assistantText.slice(0, 4000)}` },
        ]
        const raw = await collectFull(provider, messages, MEMORY_MODELS[provider])
        const facts = parseFacts(raw)
        if (facts.length === 0) {
          console.debug("[memoria] sin hechos nuevos. Respuesta cruda del modelo:", raw.slice(0, 600))
          return
        }
        const res = await fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facts }),
        })
        if (!res.ok) {
          console.warn("[memoria] POST /api/memory falló:", res.status, await res.text().catch(() => ""))
          return
        }
        const created: Memory[] = await res.json()
        console.debug(`[memoria] extraídos ${facts.length}, guardados ${created.length}`, created)
        if (Array.isArray(created) && created.length > 0) {
          setMemories((prev) => {
            const next = [...created, ...prev]
            memoriesRef.current = next
            return next
          })
          showToast(`Memoria actualizada · +${created.length}`)
        }
      } catch (e) {
        console.warn("[memoria] extracción falló:", e)
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
      void runExtraction(turn.userMessage, assistantText, realActive[0])
    })
  }, [turns, enabled, apiKeys, runExtraction])

  const handleDeleteMemory = useCallback(async (id: string) => {
    setMemories((prev) => {
      const next = prev.filter((m) => m.id !== id)
      memoriesRef.current = next
      return next
    })
    await fetch(`/api/memory/${id}`, { method: "DELETE" }).catch(() => {})
  }, [])

  // Edit a fact's text — the "perfil editable" promise. Optimistic; PATCH is
  // scoped to the owner server-side.
  const handleEditMemory = useCallback(async (id: string, content: string) => {
    const clean = content.trim().slice(0, 400)
    if (clean.length < 3) return
    setMemories((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, content: clean } : m))
      memoriesRef.current = next
      return next
    })
    await fetch(`/api/memory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: clean }),
    }).catch(() => {})
  }, [])

  // Add a fact by hand. Server dedupes (case-insensitive); an empty array back
  // means it was already known.
  const handleAddMemory = useCallback(async (content: string, category: string) => {
    const clean = content.trim().slice(0, 400)
    if (clean.length < 3) return
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: clean, category }),
      })
      if (!res.ok) return
      const created: Memory[] = await res.json()
      if (Array.isArray(created) && created.length > 0) {
        setMemories((prev) => {
          const next = [...created, ...prev]
          memoriesRef.current = next
          return next
        })
        showToast(`Memoria actualizada · +${created.length}`)
      } else {
        showToast("Ya lo recordaba")
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
        setTurns((prev) => [...prev, { id: crypto.randomUUID(), userMessage: "/fusion", responses: { openai: { content: "No hay modelos con API key configurada.", loading: false, done: true } } }])
      } else {
        const next = Object.fromEntries(PROVIDERS.map((p) => [p, withKeys.includes(p)])) as Record<Provider, boolean>
        setEnabled(next)
        showToast(`Fusión activa — ${withKeys.map((p) => CFG[p].name).join(", ")}`)
      }
      textareaRef.current?.focus()
    } else if (id === "solo") {
      const active = PROVIDERS.filter((p) => enabled[p] && apiKeys[p].trim())
      if (active.length > 0) {
        const next = Object.fromEntries(PROVIDERS.map((p) => [p, p === active[0]])) as Record<Provider, boolean>
        setEnabled(next)
        showToast(`Solo ${CFG[active[0]].name} activo`)
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
        navigator.clipboard.writeText(text).then(() => showToast("Copiado al portapapeles")).catch(() => {})
      }
      textareaRef.current?.focus()
    } else if (id === "demo") {
      setApiKeys({ openai: "demo", anthropic: "demo", google: "demo", groq: "", openrouter: "", xai: "", mistral: "", deepseek: "" })
      setEnabled({ openai: true, anthropic: true, google: true, groq: false, openrouter: false, xai: false, mistral: false, deepseek: false })
      textareaRef.current?.focus()
    } else if (id === "models") {
      const active = PROVIDERS.filter((p) => enabled[p] && apiKeys[p].trim())
      const msg = active.length > 0 ? `Modelos activos: ${active.map((p) => CFG[p].name).join(", ")}` : "No hay modelos activos."
      setTurns((prev) => [...prev, { id: crypto.randomUUID(), userMessage: "/models", responses: { openai: { content: msg, loading: false, done: true } } }])
    } else if (id === "help") {
      const msg = SLASH_COMMANDS.map((c) => `${c.label} · ${c.desc}`).join("\n")
      setTurns((prev) => [...prev, { id: crypto.randomUUID(), userMessage: "/help", responses: { openai: { content: msg, loading: false, done: true } } }])
    }
  }, [setApiKeys, setEnabled, enabled, apiKeys, turns, handleNewSession, showToast, setTurns])

  const handleSend = useCallback(async () => {
    const msg = input.trim()
    if (!msg) return
    const matchedCmd = SLASH_COMMANDS.find((c) => c.label === msg)
    if (matchedCmd) { execCommand(matchedCmd.id); return }
    if (isLoading || activeProviders.length === 0) return

    const imgProviders = activeProviders.filter((p) => IMAGE_CAPABLE.includes(p))
    if (imageMode && imgProviders.length === 0) {
      showToast("Activá OpenAI, Google o xAI para generar imágenes")
      return
    }

    await ensureActiveSession()
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setIsLoading(true)
    setSendKey((k) => k + 1)

    const turnId = crypto.randomUUID()
    const currentTurns = turns

    if (imageMode) {
      const initialResponses: Partial<Record<Provider, ModelResponseState>> = {}
      imgProviders.forEach((p) => { initialResponses[p] = { content: "", loading: true, done: false } })
      setTurns((prev) => [...prev, { id: turnId, userMessage: msg, responses: initialResponses }])
      await Promise.all(imgProviders.map((p) =>
        streamProvider(p, [{ role: "user", content: msg }], turnId, { mode: "image", model: DEFAULT_IMAGE_MODELS[p] })
      ))
    } else if (fusionMode) {
      setTurns((prev) => [...prev, {
        id: turnId, userMessage: msg, responses: {}, isFusion: true,
        fusedResponse: { content: "", loading: true, done: false, phase: "collecting" },
      }])
      const results = await Promise.allSettled(activeProviders.map((p) => collectFull(p, buildSharedHistory(currentTurns, activeProviders, msg, p, memoriesRef.current))))
      const parts = activeProviders
        .map((p, i) => {
          const r = results[i]
          if (r.status === "fulfilled" && r.value.trim()) return `[${CFG[p].name}]:\n${r.value.trim()}`
          return null
        })
        .filter((x): x is string => x !== null)
      if (parts.length === 0) {
        setTurns((prev) => prev.map((t) => t.id === turnId ? { ...t, fusedResponse: { content: "", loading: false, done: true, error: "Ningún modelo respondió" } } : t))
        setIsLoading(false)
        return
      }
      const synthesisMsg =
        `A continuación están las respuestas de distintos modelos de IA a la pregunta del usuario: "${msg}"\n\n` +
        parts.join("\n\n---\n\n") +
        `\n\nSintetizá estas respuestas en UNA SOLA respuesta unificada, clara y completa. Tomá los mejores insights de cada modelo, eliminá redundancias y presentá la información de forma coherente. Respondé directamente y naturalmente, sin mencionar que estás sintetizando ni referenciar los modelos por nombre.`
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
      setTurns((prev) => [...prev, { id: turnId, userMessage: msg, responses: initialResponses }])
      await Promise.all(activeProviders.map((p) => streamProvider(p, buildSharedHistory(currentTurns, activeProviders, msg, p, memoriesRef.current), turnId)))
    }

    setIsLoading(false)
    textareaRef.current?.focus()
  }, [input, isLoading, activeProviders, turns, fusionMode, imageMode, showToast, streamProvider, collectFull, streamFusion, execCommand, ensureActiveSession, setTurns])

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
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* ── Topbar ────────────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-2 md:gap-2.5 px-3 md:px-4 h-14 flex-shrink-0 z-20"
        style={{ background: "var(--surface-blur)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-soft)" }}
      >
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="flex w-9 h-9 rounded-xl items-center justify-center transition-all cursor-pointer active:scale-95"
          style={{ color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)" }}
          title={sidebarOpen ? "Ocultar conversaciones" : "Ver conversaciones"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <rect x="3" y="3" width="18" height="18" rx="2.5" /><path d="M9 3v18" />
          </svg>
        </button>

        <Link href="/" className="flex items-center group cursor-pointer ml-0.5">
          <OneChatLogo className="h-9 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
        </Link>

        <div className="flex-1" />

        {/* Divider before the action cluster */}
        <span className="hidden sm:block w-px h-6 mr-0.5" style={{ background: "var(--border)" }} aria-hidden />

        {activeCount > 1 && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide"
            style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.08))", border: "1px solid rgba(249,115,22,0.25)", color: "#c2410c" }}>
            <span className="relative flex items-center justify-center">
              <span className="absolute w-2 h-2 rounded-full bg-orange-400 animate-ping opacity-60" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-orange-500" />
            </span>
            FUSIÓN · {activeCount}
          </span>
        )}

        <ThemeToggle />

        <Link href="/dashboard"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer hover:shadow-sm active:scale-95"
          style={{ color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)" }}
          title="Dashboard · tu uso y gasto estimado">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" style={{ color: "#7c3aed" }}>
            <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <button onClick={() => setMemoryOpen(true)}
          className="hidden md:inline-flex relative items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer hover:shadow-sm active:scale-95"
          style={{ color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)" }}
          title="Memoria · lo que las IAs recuerdan de vos">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" style={{ color: "#7c3aed" }}>
            <path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" />
            <path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" />
            <path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" />
          </svg>
          <span className="hidden sm:inline">Memoria</span>
          {memories.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
              {memories.length}
            </span>
          )}
        </button>

        <button onClick={handleNewSession}
          className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer hover:shadow-sm active:scale-95"
          style={{ color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)" }}
          title="Nueva conversación">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </header>

      {/* ── Memory drawer ─────────────────────────────────────────────── */}
      {memoryOpen && (
        <MemoryDrawer
          memories={memories}
          onClose={() => setMemoryOpen(false)}
          onDelete={handleDeleteMemory}
          onEdit={handleEditMemory}
          onAdd={handleAddMemory}
        />
      )}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onNewSession={handleNewSession}
          onOpenMemory={() => setMemoryOpen(true)}
          memoryCount={memories.length}
        />

        <div className="flex flex-col flex-1 overflow-hidden">

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
                      ? "Seleccioná una IA para empezar…"
                      : imageMode
                      ? "Describí la imagen que querés generar…"
                      : `Preguntale a ${activeProviders.map((p) => CFG[p].name).join(", ")}…`
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
                />
                <div className="flex-1" />
                <button
                  onClick={() => setImageMode((v) => !v)}
                  title={imageMode ? "Modo imagen activo" : "Generar imágenes"}
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
                  disabled={!input.trim() || activeCount === 0 || isLoading}
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
                ? "Modo imagen · OpenAI, Google, xAI generan su imagen"
                : fusionMode
                ? "Fusión · los modelos sintetizan una sola respuesta"
                : "Enter para enviar · Shift+Enter nueva línea"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
