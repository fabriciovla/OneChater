"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

export type Lang = "en" | "es"

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void }

const LanguageContext = createContext<Ctx>({ lang: "en", setLang: () => {}, toggle: () => {} })

const STORAGE_KEY = "oc_lang"
const ONE_YEAR = 60 * 60 * 24 * 365

function detect(): Lang {
  if (typeof navigator === "undefined") return "en"
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en"
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

// Persist the choice everywhere the app reads it from: localStorage (client),
// a cookie (so the SERVER can render the right language on the next request and
// keep SSR === first client render), and the <html lang> attribute.
function persist(l: Lang) {
  try { localStorage.setItem(STORAGE_KEY, l) } catch {}
  document.cookie = `${STORAGE_KEY}=${l};path=/;max-age=${ONE_YEAR};samesite=lax`
  document.documentElement.lang = l
}

export function LanguageProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode
  initialLang?: Lang
}) {
  // `initialLang` is read from the `oc_lang` cookie on the SERVER (layout.tsx),
  // so the server HTML and the first client render use the exact same language.
  // The old code read document.documentElement.lang inside useState during the
  // initial render — but the server always defaulted to "en", so an "es" visitor
  // hydrated in Spanish over English markup → "Text content does not match
  // server-rendered HTML." Deriving the initial state from a server-provided prop
  // removes the mismatch (and the EN→ES flash) entirely.
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    // Resolve the persisted choice in the same priority the server used, so the
    // effect never disagrees with the cookie that drove SSR:
    //   localStorage (explicit client choice) → cookie (what SSR used) → browser.
    // First-time visitors (none set) fall back to the browser language.
    let stored: string | null = null
    try { stored = localStorage.getItem(STORAGE_KEY) } catch {}
    const persisted = stored ?? readCookie(STORAGE_KEY)
    const next: Lang = persisted === "es" || persisted === "en" ? persisted : detect()
    if (next !== lang) setLangState(next)
    persist(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    persist(l)
  }, [])

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "en" ? "es" : "en"
      persist(next)
      return next
    })
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang(): Ctx {
  return useContext(LanguageContext)
}

// Pick the dictionary slice for the active language. Pass a `{ en, es }` object.
export function useT<T>(dict: { en: T; es: T }): T {
  const { lang } = useLang()
  return dict[lang]
}

// ─── Language toggle button (matches ThemeToggle styling) ──────────────────────

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, toggle } = useLang()
  const other = lang === "en" ? "ES" : "EN"
  return (
    <button
      onClick={toggle}
      aria-label={lang === "en" ? "Cambiar a español" : "Switch to English"}
      title={lang === "en" ? "Español" : "English"}
      className={`relative h-9 px-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-sm active:scale-95 ${className}`}
      style={{ color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 0 20a15.3 15.3 0 0 1 0-20z" />
      </svg>
      <span className="text-[11px] font-bold tracking-wide">{other}</span>
    </button>
  )
}
