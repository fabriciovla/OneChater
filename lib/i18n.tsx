"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

export type Lang = "en" | "es"

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void }

const LanguageContext = createContext<Ctx>({ lang: "en", setLang: () => {}, toggle: () => {} })

const STORAGE_KEY = "oc_lang"

function detect(): Lang {
  if (typeof navigator === "undefined") return "en"
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en"
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Deterministic default for SSR + first client render → no hydration mismatch.
  // The real preference is resolved in the effect below (localStorage, else the
  // browser language) and the tree re-renders once on mount.
  const [lang, setLangState] = useState<Lang>("en")

  useEffect(() => {
    let initial: Lang
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null
      initial = stored === "es" || stored === "en" ? stored : detect()
    } catch {
      initial = detect()
    }
    setLangState(initial)
    document.documentElement.lang = initial
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch {}
    document.documentElement.lang = l
  }, [])

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "en" ? "es" : "en"
      try { localStorage.setItem(STORAGE_KEY, next) } catch {}
      document.documentElement.lang = next
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
