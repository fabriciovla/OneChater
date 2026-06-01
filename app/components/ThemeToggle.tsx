"use client"

import { useEffect, useState } from "react"

// Toggles the `dark` class on <html> and persists the choice. The initial
// class is set by the no-flash script in layout.tsx before paint.
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggle = () => {
    const next = !dark
    // Suppress all CSS transitions for 2 rAF frames → instant, no lag
    document.documentElement.classList.add("theme-switching")
    document.documentElement.classList.toggle("dark", next)
    setDark(next)
    try { localStorage.setItem("theme", next ? "dark" : "light") } catch {}
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("theme-switching")
      })
    })
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:shadow-sm active:scale-95 ${className}`}
      style={{ color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {mounted && dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
