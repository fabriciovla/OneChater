"use client"

import { useState, useEffect, useMemo, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ThemeToggle from "../components/ThemeToggle"
import OneChatLogo from "../components/OneChatLogo"

// ─── Types ────────────────────────────────────────────────────────────────────

type Totals = {
  messages: number
  sessions: number
  responses: number
  fusionTurns: number
  memories: number
  estimatedSpend: number
}
type ProviderStat = { provider: string; responses: number; tokens: number; cost: number }
type DayPoint = { day: number; turns: number }
type CatPoint = { category: string; n: number }

type DashboardData =
  | { locked: true; plan: string }
  | {
      locked: false
      plan: string
      totals: Totals
      providers: ProviderStat[]
      daily: DayPoint[]
      memoryByCategory: CatPoint[]
    }

// ─── Provider + category meta (colors match the chat app) ───────────────────────

const PROVIDER_META: Record<string, { name: string; color: string }> = {
  openai: { name: "GPT-5", color: "#10b981" },
  anthropic: { name: "Claude", color: "#f97316" },
  google: { name: "Gemini", color: "#3b82f6" },
  groq: { name: "Groq", color: "#f55036" },
  openrouter: { name: "OpenRouter", color: "#8b5cf6" },
  xai: { name: "Grok", color: "#0f0f0f" },
  mistral: { name: "Mistral", color: "#ff7000" },
  deepseek: { name: "DeepSeek", color: "#4D6BFE" },
}
const pmeta = (p: string) => PROVIDER_META[p] ?? { name: p, color: "#6b7280" }

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  stack: { label: "Stack", color: "#3b82f6" },
  project: { label: "Proyecto", color: "#10b981" },
  preference: { label: "Preferencia", color: "#f97316" },
  decision: { label: "Decisión", color: "#8b5cf6" },
  tone: { label: "Tono", color: "#ec4899" },
  other: { label: "Otro", color: "#6b7280" },
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmtUSD = (n: number) =>
  n >= 1 ? `$${n.toFixed(2)}` : n > 0 ? `$${n.toFixed(3)}` : "$0.00"
const fmtNum = (n: number) => n.toLocaleString("es-AR")

// Build a continuous 30-day axis (UTC keys to match date_trunc in the DB).
function build30Days(daily: DayPoint[]) {
  const utcKey = (ms: number) => {
    const d = new Date(ms)
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
  }
  const map = new Map<string, number>()
  for (const d of daily) map.set(utcKey(d.day), d.turns)
  const out: { ts: number; turns: number }[] = []
  const now = new Date()
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  for (let i = 29; i >= 0; i--) {
    const ts = todayUTC - i * 86400000
    out.push({ ts, turns: map.get(utcKey(ts)) ?? 0 })
  }
  return out
}

// ─── Small reusable bits ────────────────────────────────────────────────────────

function Reveal({ delay = 0, className, children }: { delay?: number; className?: string; children: ReactNode }) {
  const [m, setM] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setM(true), 20)
    return () => clearTimeout(t)
  }, [])
  return (
    <div
      className={className}
      style={{
        opacity: m ? 1 : 0,
        transform: m ? "none" : "translateY(10px)",
        transition: `opacity .5s ease ${delay}ms, transform .5s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function Card({ title, hint, children, className = "" }: { title?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white p-5 ${className}`}
      style={{ border: "1px solid var(--border)", boxShadow: "0 2px 14px rgba(0,0,0,0.04)" }}
    >
      {title && (
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-gray-900">{title}</h3>
          {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

function StatCard({ icon, value, label, color, sub, delay }: {
  icon: ReactNode; value: string; label: string; color: string; sub?: string; delay: number
}) {
  return (
    <Reveal delay={delay}>
      <div className="rounded-2xl bg-white p-5 h-full" style={{ border: "1px solid var(--border)", boxShadow: "0 2px 14px rgba(0,0,0,0.04)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
          style={{ background: `${color}14`, color }}>
          {icon}
        </div>
        <div className="display text-[26px] font-semibold text-gray-900 leading-none tracking-tight">{value}</div>
        <div className="text-[12px] text-gray-500 mt-1.5">{label}</div>
        {sub && <div className="text-[11px] font-medium mt-0.5" style={{ color }}>{sub}</div>}
      </div>
    </Reveal>
  )
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function ActivityChart({ daily }: { daily: DayPoint[] }) {
  const days = useMemo(() => build30Days(daily), [daily])
  const max = Math.max(1, ...days.map((d) => d.turns))
  const total = days.reduce((s, d) => s + d.turns, 0)
  const W = 700, H = 200, pad = 18
  const n = days.length
  const x = (i: number) => pad + (i / (n - 1)) * (W - 2 * pad)
  const y = (v: number) => H - pad - (v / max) * (H - 2 * pad)
  const line = days.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.turns).toFixed(1)}`).join(" ")
  const area = `${line} L ${x(n - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`
  const ticks = [0, 9, 19, 29]
  const fmtTick = (ts: number) => new Date(ts).toLocaleDateString("es-AR", { day: "numeric", month: "short" })

  if (total === 0) {
    return <div className="flex items-center justify-center h-[200px] text-[13px] text-gray-400">Sin actividad en los últimos 30 días.</div>
  }
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="display text-[22px] font-semibold text-gray-900">{fmtNum(total)}</span>
        <span className="text-[12px] text-gray-500">mensajes en 30 días</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="actFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f97316" stopOpacity="0.28" />
            <stop offset="1" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={pad + g * (H - 2 * pad)} y2={pad + g * (H - 2 * pad)} stroke="var(--border-soft)" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#actFill)" />
        <path d={line} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {days.map((d, i) => d.turns === max && max > 0 ? (
          <circle key={i} cx={x(i)} cy={y(d.turns)} r="3.5" fill="#f97316" stroke="white" strokeWidth="2" />
        ) : null)}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {ticks.map((t) => <span key={t} className="text-[10px] text-gray-400">{days[t] ? fmtTick(days[t].ts) : ""}</span>)}
      </div>
    </div>
  )
}

function SpendBars({ providers, total }: { providers: ProviderStat[]; total: number }) {
  const max = Math.max(...providers.map((p) => p.cost), 0.000001)
  if (providers.length === 0) return <div className="text-[13px] text-gray-400 py-8 text-center">Todavía no hay uso para estimar.</div>
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="display text-[26px] font-semibold text-gray-900">{fmtUSD(total)}</span>
        <span className="text-[12px] text-gray-500">estimado</span>
      </div>
      <div className="space-y-3">
        {providers.map((p) => {
          const m = pmeta(p.provider)
          return (
            <div key={p.provider}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                  <span className="text-[12px] font-medium text-gray-700">{m.name}</span>
                </div>
                <span className="text-[12px] font-semibold text-gray-900 tabular-nums">{fmtUSD(p.cost)}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border-soft)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.max(4, (p.cost / max) * 100)}%`, background: m.color, transition: "width .7s cubic-bezier(0.22,1,0.36,1)" }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UsageDonut({ providers, responses, fusionPct }: { providers: ProviderStat[]; responses: number; fusionPct: number }) {
  const R = 52, C = 2 * Math.PI * R
  let acc = 0
  const segs = providers
    .filter((p) => p.responses > 0)
    .map((p) => {
      const frac = responses > 0 ? p.responses / responses : 0
      const seg = { provider: p.provider, frac, offset: acc }
      acc += frac
      return seg
    })
  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0" style={{ width: 132, height: 132 }}>
        <svg viewBox="0 0 132 132" className="w-full h-full -rotate-90">
          <circle cx="66" cy="66" r={R} fill="none" stroke="var(--border-soft)" strokeWidth="14" />
          {segs.map((s) => {
            const m = pmeta(s.provider)
            return (
              <circle key={s.provider} cx="66" cy="66" r={R} fill="none" stroke={m.color} strokeWidth="14"
                strokeDasharray={`${s.frac * C} ${C}`} strokeDashoffset={`${-s.offset * C}`} strokeLinecap="butt" />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="display text-[22px] font-semibold text-gray-900 leading-none">{fmtNum(responses)}</span>
          <span className="text-[10px] text-gray-500 mt-0.5">respuestas</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {segs.length === 0 && <div className="text-[13px] text-gray-400">Sin respuestas todavía.</div>}
        {segs.map((s) => {
          const m = pmeta(s.provider)
          return (
            <div key={s.provider} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                <span className="text-[12px] text-gray-700 truncate">{m.name}</span>
              </div>
              <span className="text-[11px] font-medium text-gray-500 tabular-nums">{Math.round(s.frac * 100)}%</span>
            </div>
          )
        })}
        {responses > 0 && (
          <div className="pt-1.5 mt-1.5 text-[11px] text-gray-400" style={{ borderTop: "1px solid var(--border-soft)" }}>
            {fusionPct}% en modo fusión
          </div>
        )}
      </div>
    </div>
  )
}

function MemoryBars({ cats, total }: { cats: CatPoint[]; total: number }) {
  if (total === 0) return <div className="text-[13px] text-gray-400 py-8 text-center">La memoria está vacía.</div>
  const sorted = [...cats].sort((a, b) => b.n - a.n)
  const max = Math.max(...sorted.map((c) => c.n), 1)
  return (
    <div className="space-y-2.5">
      {sorted.map((c) => {
        const meta = CATEGORY_META[c.category] ?? CATEGORY_META.other
        return (
          <div key={c.category} className="flex items-center gap-3">
            <span className="text-[12px] text-gray-600 w-20 flex-shrink-0">{meta.label}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border-soft)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(6, (c.n / max) * 100)}%`, background: meta.color, transition: "width .7s ease" }} />
            </div>
            <span className="text-[12px] font-semibold text-gray-900 w-6 text-right tabular-nums">{c.n}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── States ─────────────────────────────────────────────────────────────────────

function Topbar() {
  return (
    <header className="flex items-center gap-3 px-4 md:px-6 h-14 flex-shrink-0 sticky top-0 z-20"
      style={{ background: "var(--surface-blur)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-soft)" }}>
      <Link href="/chat" className="flex items-center group cursor-pointer">
        <OneChatLogo className="h-9 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
      </Link>
      <div className="flex-1" />
      <ThemeToggle />
      <Link href="/chat"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer hover:shadow-sm active:scale-95"
        style={{ color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Volver al chat
      </Link>
    </header>
  )
}

function Skeleton() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Topbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="h-8 w-48 rounded-lg bg-black/5 animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[120px] rounded-2xl bg-black/5 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[280px] rounded-2xl bg-black/5 animate-pulse" />
          <div className="h-[280px] rounded-2xl bg-black/5 animate-pulse" />
        </div>
      </main>
    </div>
  )
}

function LockedUpsell() {
  const perks = [
    "Gasto estimado por modelo, en vivo",
    "Actividad de los últimos 30 días",
    "Distribución de uso entre proveedores",
    "Memoria por categoría",
  ]
  return (
    <Reveal>
      <div className="max-w-lg mx-auto mt-10 rounded-3xl bg-white p-8 text-center relative overflow-hidden"
        style={{ border: "1px solid var(--border)", boxShadow: "0 12px 40px var(--border)" }}>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)" }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.14), transparent 70%)" }} />
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", boxShadow: "0 10px 28px -8px rgba(124,58,237,0.6)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="display text-2xl font-semibold text-gray-900 mb-2">El dashboard es Pro</h2>
          <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
            Visualizá tu uso y tu gasto estimado entre todos los modelos. Actualizá a Pro para desbloquearlo.
          </p>
          <div className="text-left space-y-2.5 mb-7 max-w-xs mx-auto">
            {perks.map((p) => (
              <div key={p} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.1)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-[13px] text-gray-700">{p}</span>
              </div>
            ))}
          </div>
          <Link href="/#pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-[14px] font-semibold transition-all cursor-pointer hover:shadow-lg active:scale-95"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", boxShadow: "0 8px 24px -6px rgba(124,58,237,0.5)" }}>
            Actualizá a Pro
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </Reveal>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d: DashboardData) => setData(d))
      .catch(() => setErr(true))
  }, [status])

  if (status === "loading" || (status === "authenticated" && !data && !err)) return <Skeleton />
  if (err) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <Topbar />
        <main className="max-w-6xl mx-auto px-6 py-20 text-center text-gray-500">No se pudo cargar el dashboard. Recargá la página.</main>
      </div>
    )
  }
  if (!data) return <Skeleton />

  if (data.locked) {
    return (
      <div className="min-h-screen chat-backdrop" style={{ background: "var(--bg-primary)" }}>
        <Topbar />
        <main className="max-w-6xl mx-auto px-6 py-10">
          <LockedUpsell />
        </main>
      </div>
    )
  }

  const { totals, providers, daily, memoryByCategory } = data
  const fusionPct = totals.messages > 0 ? Math.round((totals.fusionTurns / totals.messages) * 100) : 0
  const memTotal = memoryByCategory.reduce((s, c) => s + c.n, 0)

  return (
    <div className="min-h-screen chat-backdrop" style={{ background: "var(--bg-primary)" }}>
      <Topbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Reveal>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
            <div>
              <h1 className="display text-3xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-[14px] text-gray-500 mt-1">Tu uso y gasto estimado entre todos los modelos.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide text-white"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" />
                <path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" />
                <path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" />
              </svg>
              PLAN {data.plan.toUpperCase()}
            </span>
          </div>
        </Reveal>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <StatCard delay={40} color="#f97316" label="Gasto estimado" value={fmtUSD(totals.estimatedSpend)} sub="acumulado"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} />
          <StatCard delay={90} color="#3b82f6" label="Mensajes" value={fmtNum(totals.messages)}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>} />
          <StatCard delay={140} color="#10b981" label="Sesiones" value={fmtNum(totals.sessions)}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 7h18M3 12h18M3 17h18" /></svg>} />
          <StatCard delay={190} color="#8b5cf6" label="Respuestas IA" value={fmtNum(totals.responses)}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" /><path d="M8 12l3 3 5-6" /></svg>} />
          <StatCard delay={240} color="#7c3aed" label="Hechos en memoria" value={fmtNum(totals.memories)}
            icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" /><path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" /><path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" /></svg>} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Reveal delay={290} className="lg:col-span-2">
            <Card title="Actividad" hint="últimos 30 días"><ActivityChart daily={daily} /></Card>
          </Reveal>
          <Reveal delay={340}>
            <Card title="Gasto estimado por modelo"><SpendBars providers={providers} total={totals.estimatedSpend} /></Card>
          </Reveal>
          <Reveal delay={390}>
            <Card title="Distribución de uso"><UsageDonut providers={providers} responses={totals.responses} fusionPct={fusionPct} /></Card>
          </Reveal>
          <Reveal delay={440} className="lg:col-span-2">
            <Card title="Memoria por categoría" hint={`${memTotal} hechos`}><MemoryBars cats={memoryByCategory} total={memTotal} /></Card>
          </Reveal>
        </div>

        <p className="text-[11px] text-gray-400 mt-5 leading-relaxed max-w-2xl">
          El gasto es una <strong className="font-semibold text-gray-500">estimación</strong> calculada a partir del tamaño de los mensajes y un precio promedio por modelo. No refleja la facturación real de tu proveedor: con BYOK, ese cobro lo hace cada proveedor directamente sobre tu API key.
        </p>
      </main>
    </div>
  )
}
