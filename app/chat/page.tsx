"use client"

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from "react"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

type Provider = "openai" | "anthropic" | "google"

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

// ─── Provider configs ─────────────────────────────────────────────────────────

const PROVIDERS: Provider[] = ["openai", "anthropic", "google"]

const CFG = {
  openai: {
    name: "GPT-4o",
    label: "OpenAI",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
      { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    color: "#10b981",
    colorBg: "rgba(16,185,129,0.08)",
    colorBorder: "rgba(16,185,129,0.22)",
    colorGlow: "rgba(16,185,129,0.15)",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    gradient: "from-emerald-500 to-teal-500",
    Logo: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.843-3.369 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.677a.79.79 0 0 0-.402-.677zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    ),
  },
  anthropic: {
    name: "Claude",
    label: "Anthropic",
    defaultModel: "claude-3-5-sonnet-20241022",
    models: [
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
      { id: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
      { id: "claude-3-opus-20240229", label: "Claude 3 Opus" },
    ],
    color: "#f97316",
    colorBg: "rgba(249,115,22,0.08)",
    colorBorder: "rgba(249,115,22,0.22)",
    colorGlow: "rgba(249,115,22,0.15)",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    dot: "bg-orange-400",
    gradient: "from-orange-500 to-amber-500",
    Logo: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
      </svg>
    ),
  },
  google: {
    name: "Gemini",
    label: "Google",
    defaultModel: "gemini-1.5-flash",
    models: [
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
    color: "#3b82f6",
    colorBg: "rgba(59,130,246,0.08)",
    colorBorder: "rgba(59,130,246,0.22)",
    colorGlow: "rgba(59,130,246,0.15)",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    dot: "bg-blue-400",
    gradient: "from-blue-500 to-cyan-500",
    Logo: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
} as const

// ─── Build shared context history ────────────────────────────────────────────
// All active models' responses from previous turns are combined into one
// assistant message so every model knows what the others said.

function buildSharedHistory(
  turns: ConversationTurn[],
  activeProviders: Provider[],
  newMessage: string
): { role: string; content: string }[] {
  const msgs: { role: string; content: string }[] = []

  for (const turn of turns) {
    msgs.push({ role: "user", content: turn.userMessage })

    if (turn.isFusion && turn.fusedResponse?.done && turn.fusedResponse.content && !turn.fusedResponse.error) {
      // Fusion turn: use synthesized response in history
      msgs.push({ role: "assistant", content: turn.fusedResponse.content })
    } else {
      const parts = activeProviders
        .map((p) => {
          const r = turn.responses[p]
          if (r?.done && r.content && !r.error) return `[${CFG[p].name}]:\n${r.content}`
          return null
        })
        .filter((x): x is string => x !== null)
      if (parts.length > 0) {
        msgs.push({ role: "assistant", content: parts.join("\n\n---\n\n") })
      }
    }
  }

  msgs.push({ role: "user", content: newMessage })
  return msgs
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  return (
    <span className="inline-flex gap-1 items-end h-4 ml-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: color, animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  )
}

// ─── Model logo avatar ────────────────────────────────────────────────────────

function ModelAvatar({ provider, size = "md" }: { provider: Provider; size?: "sm" | "md" }) {
  const c = CFG[provider]
  const dim = size === "sm" ? "w-6 h-6" : "w-8 h-8"
  return (
    <div
      className={`${dim} rounded-xl flex items-center justify-center text-white flex-shrink-0`}
      style={{ background: `linear-gradient(135deg, ${c.color}cc, ${c.color}66)`, boxShadow: `0 4px 12px ${c.colorGlow}` }}
    >
      <c.Logo />
    </div>
  )
}

// ─── Response card ────────────────────────────────────────────────────────────

function ResponseCard({
  provider,
  state,
  selectedModel,
}: {
  provider: Provider
  state: ModelResponseState
  selectedModel: string
}) {
  const c = CFG[provider]
  const modelLabel = c.models.find((m) => m.id === selectedModel)?.label ?? selectedModel

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300"
      style={{
        background: c.colorBg,
        border: `1px solid ${c.colorBorder}`,
        boxShadow: state.loading ? `0 0 24px ${c.colorGlow}` : "none",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <ModelAvatar provider={provider} size="sm" />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-white leading-none">{c.name}</span>
          <span className="text-[10px] text-slate-500 truncate mt-0.5">{modelLabel}</span>
        </div>
        <div className="ml-auto flex-shrink-0">
          {state.loading ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
              style={{ background: c.colorBg, borderColor: c.colorBorder, color: c.color }}
            >
              <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: c.color }} />
              Generando
            </span>
          ) : state.done && !state.error ? (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words min-h-[20px]">
        {state.error ? (
          <span className="text-red-400/90 text-xs flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
            {state.error}
          </span>
        ) : state.content ? (
          state.content
        ) : state.loading ? (
          <TypingDots color={c.color} />
        ) : null}
      </div>
    </div>
  )
}

// ─── Fusion card ─────────────────────────────────────────────────────────────

function FusionCard({
  state,
  providers,
}: {
  state: ModelResponseState
  providers: Provider[]
}) {
  const isCollecting = state.loading && state.phase === "collecting"
  const isSynthesizing = state.loading && state.phase === "synthesizing"

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.06))",
        border: "1px solid rgba(124,58,237,0.3)",
        boxShadow: state.loading ? "0 0 32px rgba(124,58,237,0.15)" : "none",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Stacked model avatars */}
        <div className="flex -space-x-2">
          {providers.map((p) => {
            const Logo = CFG[p].Logo
            return (
              <div
                key={p}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-white flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${CFG[p].color}cc, ${CFG[p].color}66)`,
                  borderColor: "#07071a",
                }}
              >
                <Logo />
              </div>
            )
          })}
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-bold text-white leading-none">Respuesta fusionada</span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {providers.map((p) => CFG[p].name).join(" + ")}
          </span>
        </div>

        <div className="ml-auto">
          {isCollecting && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
              style={{ background: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.3)", color: "#a78bfa" }}
            >
              <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
              Consultando modelos…
            </span>
          )}
          {isSynthesizing && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
              style={{ background: "rgba(59,130,246,0.12)", borderColor: "rgba(59,130,246,0.3)", color: "#93c5fd" }}
            >
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
              Sintetizando…
            </span>
          )}
          {state.done && !state.error && (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2), transparent)" }} />

      {/* Content */}
      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words min-h-[24px]">
        {state.error ? (
          <span className="text-red-400 text-xs flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
            {state.error}
          </span>
        ) : state.content ? (
          state.content
        ) : isCollecting ? (
          <span className="text-slate-600 text-xs italic">
            Analizando respuestas de {providers.length} modelos…
          </span>
        ) : (
          <TypingDots color="#7c3aed" />
        )}
      </div>
    </div>
  )
}

// ─── Turn block ───────────────────────────────────────────────────────────────

function TurnBlock({
  turn,
  activeProviders,
  selectedModels,
}: {
  turn: ConversationTurn
  activeProviders: Provider[]
  selectedModels: Record<Provider, string>
}) {
  const cols = activeProviders.length
  const grid =
    cols === 1
      ? "grid-cols-1 max-w-2xl"
      : cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

  return (
    <div className="space-y-4 w-full max-w-5xl mx-auto">
      {/* User bubble */}
      <div className="flex justify-end">
        <div
          className="max-w-[72%] px-5 py-3 rounded-2xl rounded-tr-md text-sm text-white leading-relaxed shadow-lg"
          style={{
            background: "linear-gradient(135deg,rgba(124,58,237,0.9),rgba(59,130,246,0.85))",
            boxShadow: "0 4px 24px rgba(124,58,237,0.25)",
          }}
        >
          {turn.userMessage}
        </div>
      </div>

      {/* Fusion mode: single card */}
      {turn.isFusion && turn.fusedResponse && (
        <FusionCard state={turn.fusedResponse} providers={activeProviders} />
      )}

      {/* Normal mode: response grid */}
      {!turn.isFusion && activeProviders.length > 0 && (
        <div className={`grid gap-3 ${grid}`}>
          {activeProviders.map((p) => {
            const state = turn.responses[p]
            if (!state) return null
            return (
              <ResponseCard
                key={p}
                provider={p}
                state={state}
                selectedModel={selectedModels[p]}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Custom select ────────────────────────────────────────────────────────────

function StyledSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly { readonly id: string; readonly label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none text-xs text-slate-400 rounded-lg px-3 py-2 pr-8 cursor-pointer focus:outline-none transition-colors"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id} style={{ background: "#0d0d2b" }}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  )
}

// ─── Sidebar provider card ────────────────────────────────────────────────────

function ProviderCard({
  provider,
  apiKey,
  setApiKey,
  isEnabled,
  setEnabled,
  selectedModel,
  setModel,
}: {
  provider: Provider
  apiKey: string
  setApiKey: (v: string) => void
  isEnabled: boolean
  setEnabled: (v: boolean) => void
  selectedModel: string
  setModel: (v: string) => void
}) {
  const c = CFG[provider]
  const hasKey = !!apiKey.trim()
  const active = isEnabled && hasKey

  return (
    <div
      className="rounded-2xl p-3.5 space-y-3 transition-all duration-300"
      style={{
        background: active ? c.colorBg : "rgba(255,255,255,0.02)",
        border: `1px solid ${active ? c.colorBorder : "rgba(255,255,255,0.06)"}`,
        boxShadow: active ? `0 4px 20px ${c.colorGlow}` : "none",
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5">
        <ModelAvatar provider={provider} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white leading-none">{c.name}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{c.label}</div>
        </div>
        {/* Toggle */}
        <button
          onClick={() => hasKey && setEnabled(!isEnabled)}
          title={!hasKey ? "Ingresá tu API key primero" : isEnabled ? "Desactivar" : "Activar"}
          className={`relative w-9 h-5 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${
            !hasKey ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
          }`}
          style={{ background: active ? c.color : "rgba(255,255,255,0.1)" }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300"
            style={{ transform: active ? "translateX(16px)" : "translateX(0)" }}
          />
        </button>
      </div>

      {/* API key input */}
      <div className="relative">
        <input
          type="password"
          placeholder={`sk-... · API key de ${c.label}`}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full text-xs text-slate-300 rounded-lg px-3 py-2 placeholder-slate-600 focus:outline-none transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = `${c.color}66`)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {hasKey && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot} inline-block`} />
          </div>
        )}
      </div>

      {/* Model picker */}
      <StyledSelect
        value={selectedModel}
        onChange={setModel}
        options={c.models}
      />
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  open,
  apiKeys,
  setApiKeys,
  enabled,
  setEnabled,
  selectedModels,
  setSelectedModels,
  onActivateDemo,
}: {
  open: boolean
  apiKeys: Record<Provider, string>
  setApiKeys: (k: Record<Provider, string>) => void
  enabled: Record<Provider, boolean>
  setEnabled: (e: Record<Provider, boolean>) => void
  selectedModels: Record<Provider, string>
  setSelectedModels: (m: Record<Provider, string>) => void
  onActivateDemo: () => void
}) {
  return (
    <aside
      className="flex-shrink-0 overflow-y-auto overflow-x-hidden transition-all duration-300"
      style={{
        width: open ? "288px" : "0",
        opacity: open ? 1 : 0,
        borderRight: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(5,5,20,0.8)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="p-4 space-y-3 w-72">
        {/* Demo mode banner */}
        {PROVIDERS.some((p) => apiKeys[p] === "demo") && (
          <div
            className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
            <span className="text-[10px] text-purple-300 font-medium flex-1">Modo demo activo</span>
            <button
              onClick={() => setApiKeys({ openai: "", anthropic: "", google: "" })}
              className="text-[10px] text-slate-500 hover:text-white transition-colors cursor-pointer underline underline-offset-2"
            >
              Salir
            </button>
          </div>
        )}

        {/* Section label */}
        <div className="pt-1 pb-1 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Modelos · {PROVIDERS.filter((p) => enabled[p] && apiKeys[p]).length} activos
          </p>
          {!PROVIDERS.some((p) => apiKeys[p] === "demo") && !PROVIDERS.some((p) => apiKeys[p] && apiKeys[p] !== "demo") && (
            <button
              onClick={onActivateDemo}
              className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors cursor-pointer font-medium"
            >
              Modo demo
            </button>
          )}
        </div>

        {PROVIDERS.map((p) => (
          <ProviderCard
            key={p}
            provider={p}
            apiKey={apiKeys[p]}
            setApiKey={(v) => setApiKeys({ ...apiKeys, [p]: v })}
            isEnabled={enabled[p]}
            setEnabled={(v) => setEnabled({ ...enabled, [p]: v })}
            selectedModel={selectedModels[p]}
            setModel={(v) => setSelectedModels({ ...selectedModels, [p]: v })}
          />
        ))}

        {/* Privacy note */}
        <div
          className="rounded-xl px-3 py-2.5 flex gap-2.5 items-start mt-1"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Keys nunca guardadas en servidor. Solo viajan en tus requests.
          </p>
        </div>
      </div>
    </aside>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  hasActive,
  onActivateDemo,
}: {
  hasActive: boolean
  onActivateDemo: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-12">
      {/* Decorative orb */}
      <div className="relative">
        <div
          className="absolute rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)", width: "140px", height: "140px", left: "-20px", top: "-20px" }}
        />
        <div
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.15))",
            border: "1px solid rgba(124,58,237,0.3)",
            boxShadow: "0 8px 32px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <svg viewBox="0 0 100 100" fill="none" className="w-10 h-10">
            <path d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="rgba(139,92,246,0.8)" />
            <path d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="rgba(59,130,246,0.8)" />
            <path d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="rgba(34,211,238,0.8)" />
          </svg>
        </div>
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-xl font-bold text-white">
          {hasActive ? "Empezá a chatear" : "¿Sin API keys por ahora?"}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          {hasActive
            ? "Escribí un mensaje y todos los modelos activos van a responder en paralelo con contexto compartido."
            : "Podés probar la interfaz completa con respuestas simuladas. Sin registro, sin tarjeta."}
        </p>
      </div>

      {!hasActive && (
        <div className="flex flex-col items-center gap-3">
          {/* Demo button */}
          <button
            onClick={onActivateDemo}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-white text-sm cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
              boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Probar en modo demo
          </button>
          <p className="text-xs text-slate-600">Activa GPT · Claude · Gemini con respuestas simuladas</p>
        </div>
      )}

      {hasActive && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs text-purple-300"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Enter para enviar · Shift+Enter nueva línea
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [input, setInput] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [fusionMode, setFusionMode] = useState(false)

  const [apiKeys, setApiKeysRaw] = useState<Record<Provider, string>>({
    openai: "",
    anthropic: "",
    google: "",
  })
  const [enabled, setEnabledRaw] = useState<Record<Provider, boolean>>({
    openai: true,
    anthropic: true,
    google: true,
  })
  const [selectedModels, setSelectedModelsRaw] = useState<Record<Provider, string>>({
    openai: "gpt-4o",
    anthropic: "claude-3-5-sonnet-20241022",
    google: "gemini-1.5-flash",
  })

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      const k = localStorage.getItem("oc_keys")
      if (k) setApiKeysRaw(JSON.parse(k))
      const e = localStorage.getItem("oc_enabled")
      if (e) setEnabledRaw(JSON.parse(e))
      const m = localStorage.getItem("oc_models")
      if (m) setSelectedModelsRaw(JSON.parse(m))
    } catch {}
  }, [])

  const setApiKeys = useCallback((k: Record<Provider, string>) => {
    setApiKeysRaw(k)
    localStorage.setItem("oc_keys", JSON.stringify(k))
  }, [])
  const setEnabled = useCallback((e: Record<Provider, boolean>) => {
    setEnabledRaw(e)
    localStorage.setItem("oc_enabled", JSON.stringify(e))
  }, [])
  const setSelectedModels = useCallback((m: Record<Provider, string>) => {
    setSelectedModelsRaw(m)
    localStorage.setItem("oc_models", JSON.stringify(m))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [turns])

  const activeProviders = PROVIDERS.filter((p) => enabled[p] && apiKeys[p].trim())

  const streamProvider = useCallback(
    async (provider: Provider, messages: { role: string; content: string }[], turnId: string) => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            provider,
            apiKey: apiKeys[provider],
            model: selectedModels[provider],
          }),
        })
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

        const reader = res.body.getReader()
        const dec = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = dec.decode(value)
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turnId
                ? {
                    ...t,
                    responses: {
                      ...t.responses,
                      [provider]: {
                        ...t.responses[provider]!,
                        content: (t.responses[provider]?.content ?? "") + chunk,
                      },
                    },
                  }
                : t
            )
          )
        }

        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? { ...t, responses: { ...t.responses, [provider]: { ...t.responses[provider]!, loading: false, done: true } } }
              : t
          )
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido"
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? { ...t, responses: { ...t.responses, [provider]: { content: "", loading: false, done: true, error: msg } } }
              : t
          )
        )
      }
    },
    [apiKeys, selectedModels]
  )

  // Collect full response without streaming to UI (used in fusion mode)
  const collectFull = useCallback(async (provider: Provider, messages: { role: string; content: string }[]): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, provider, apiKey: apiKeys[provider], model: selectedModels[provider] }),
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

  // Stream synthesis into fusedResponse
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
      // Switch phase to synthesizing
      setTurns((prev) => prev.map((t) => t.id === turnId ? { ...t, fusedResponse: { ...t.fusedResponse!, phase: "synthesizing" } } : t))
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value)
        setTurns((prev) => prev.map((t) => t.id === turnId
          ? { ...t, fusedResponse: { ...t.fusedResponse!, content: (t.fusedResponse?.content ?? "") + chunk } }
          : t
        ))
      }
      setTurns((prev) => prev.map((t) => t.id === turnId
        ? { ...t, fusedResponse: { ...t.fusedResponse!, loading: false, done: true } }
        : t
      ))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error"
      setTurns((prev) => prev.map((t) => t.id === turnId
        ? { ...t, fusedResponse: { content: "", loading: false, done: true, error: msg } }
        : t
      ))
    }
  }, [apiKeys, selectedModels])

  const handleSend = useCallback(async () => {
    const msg = input.trim()
    if (!msg || isLoading || activeProviders.length === 0) return

    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setIsLoading(true)

    const turnId = crypto.randomUUID()
    const currentTurns = turns
    const sharedHistory = buildSharedHistory(currentTurns, activeProviders, msg)

    if (fusionMode) {
      // ── Fusion mode: collect all → synthesize → stream one response ──
      setTurns((prev) => [...prev, {
        id: turnId,
        userMessage: msg,
        responses: {},
        isFusion: true,
        fusedResponse: { content: "", loading: true, done: false, phase: "collecting" },
      }])

      // Collect all model responses in parallel (silent, no UI streaming)
      const results = await Promise.allSettled(
        activeProviders.map((p) => collectFull(p, sharedHistory))
      )

      // Build synthesis prompt
      const parts = activeProviders
        .map((p, i) => {
          const r = results[i]
          if (r.status === "fulfilled" && r.value.trim()) {
            return `[${CFG[p].name}]:\n${r.value.trim()}`
          }
          return null
        })
        .filter((x): x is string => x !== null)

      if (parts.length === 0) {
        setTurns((prev) => prev.map((t) => t.id === turnId
          ? { ...t, fusedResponse: { content: "", loading: false, done: true, error: "Ningún modelo respondió" } }
          : t
        ))
        setIsLoading(false)
        return
      }

      const synthesisMsg =
        `A continuación están las respuestas de distintos modelos de IA a la pregunta del usuario: "${msg}"\n\n` +
        parts.join("\n\n---\n\n") +
        `\n\nSintetizá estas respuestas en UNA SOLA respuesta unificada, clara y completa. ` +
        `Tomá los mejores insights de cada modelo, eliminá redundancias y presentá la información de forma coherente. ` +
        `Respondé directamente y naturalmente, sin mencionar que estás sintetizando ni referenciar los modelos por nombre.`

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
      // ── Normal mode: all models respond in parallel ──
      const initialResponses: Partial<Record<Provider, ModelResponseState>> = {}
      activeProviders.forEach((p) => { initialResponses[p] = { content: "", loading: true, done: false } })
      setTurns((prev) => [...prev, { id: turnId, userMessage: msg, responses: initialResponses }])
      await Promise.all(activeProviders.map((p) => streamProvider(p, sharedHistory, turnId)))
    }

    setIsLoading(false)
    textareaRef.current?.focus()
  }, [input, isLoading, fusionMode, activeProviders, turns, streamProvider, collectFull, streamFusion])

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const activeCount = activeProviders.length

  const activateDemo = useCallback(() => {
    const demoKeys: Record<Provider, string> = { openai: "demo", anthropic: "demo", google: "demo" }
    const demoEnabled: Record<Provider, boolean> = { openai: true, anthropic: true, google: true }
    setApiKeys(demoKeys)
    setEnabled(demoEnabled)
  }, [setApiKeys, setEnabled])

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#07071a" }}>

      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-4 h-14 flex-shrink-0 z-10"
        style={{
          background: "rgba(7,7,26,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-all cursor-pointer hover:bg-white/5"
          title="Panel lateral"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
            <rect x="3" y="3" width="18" height="18" rx="2.5" />
            <path d="M9 3v18" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <svg viewBox="0 0 100 100" fill="none" className="w-7 h-7 group-hover:opacity-80 transition-opacity">
            <path d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="white" />
            <path d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="white" />
            <path d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="white" />
          </svg>
          <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">OneChat</span>
        </Link>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Active model chips */}
        <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
          {activeCount > 0 ? (
            PROVIDERS.filter((p) => enabled[p] && apiKeys[p].trim()).map((p) => {
              const c = CFG[p]
              return (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0"
                  style={{ background: c.colorBg, borderColor: c.colorBorder, color: "#e2e8f0" }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {c.name}
                </span>
              )
            })
          ) : (
            <span className="text-xs text-slate-600 italic">Sin modelos activos</span>
          )}

          {/* Shared context badge */}
          {activeCount > 1 && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ml-1 flex-shrink-0"
              style={{ background: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.3)", color: "#a78bfa" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Contexto compartido
            </span>
          )}
        </div>

        {/* New chat */}
        <button
          onClick={() => { setTurns([]); setInput(""); textareaRef.current?.focus() }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-all cursor-pointer hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuevo chat
        </button>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
          enabled={enabled}
          setEnabled={setEnabled}
          selectedModels={selectedModels}
          setSelectedModels={setSelectedModels}
          onActivateDemo={activateDemo}
        />

        {/* Main column */}
        <div className="flex flex-col flex-1 overflow-hidden relative">

          {/* Background orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-5 -top-24 -right-24" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
            <div className="absolute w-80 h-80 rounded-full blur-3xl opacity-5 bottom-32 -left-24" style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-8 relative">
            {turns.length === 0 ? (
              <EmptyState hasActive={activeCount > 0} onActivateDemo={activateDemo} />
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

          {/* ── Input bar ───────────────────────────────────────────── */}
          <div
            className="flex-shrink-0 px-4 md:px-6 py-4 relative z-10"
            style={{
              background: "rgba(7,7,26,0.9)",
              backdropFilter: "blur(16px)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Warning */}
            {activeCount === 0 && (
              <div
                className="flex items-center justify-center gap-2 mb-3 px-4 py-2.5 rounded-xl text-xs text-amber-300/80 max-w-2xl mx-auto"
                style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Configurá al menos una API key en el panel lateral para empezar
              </div>
            )}

            <div
              className="flex gap-3 items-end max-w-4xl mx-auto rounded-2xl px-4 py-3 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: isLoading ? "0 0 32px rgba(124,58,237,0.12)" : "none",
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = "auto"
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"
                }}
                onKeyDown={handleKey}
                placeholder={
                  activeCount > 0
                    ? `Preguntale a ${PROVIDERS.filter((p) => enabled[p] && apiKeys[p].trim()).map((p) => CFG[p].name).join(", ")}…`
                    : "Configurá tus API keys para empezar…"
                }
                disabled={activeCount === 0 || isLoading}
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none disabled:opacity-40 leading-relaxed"
                style={{ maxHeight: "160px" }}
              />

              {/* Fusion toggle */}
              <button
                onClick={() => setFusionMode((v) => !v)}
                title={fusionMode ? "Modo fusión activo — click para desactivar" : "Activar modo fusión"}
                className="h-9 px-3 rounded-xl flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold transition-all duration-200 cursor-pointer"
                style={
                  fusionMode
                    ? { background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(59,130,246,0.2))", border: "1px solid rgba(124,58,237,0.5)", color: "#c4b5fd" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }
                }
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                Fusión
              </button>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || activeCount === 0 || isLoading}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg,#7c3aed,#3b82f6)", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}
              >
                {isLoading ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-700 mt-2">
              {fusionMode
                ? "Modo fusión: los 3 modelos responden internamente y se sintetiza una sola respuesta"
                : "Enter para enviar · Shift+Enter nueva línea · Contexto compartido entre modelos"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
