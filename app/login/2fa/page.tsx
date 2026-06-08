"use client"

import { useState, useRef, useEffect, KeyboardEvent, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { signOut } from "next-auth/react"
import { clearTwofaCookie } from "@/lib/actions/logout"

async function handleSignOut() {
  await clearTwofaCookie()
  await signOut({ callbackUrl: "/" })
}

// Only allow same-origin relative paths (block open redirects). Falls back to /.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) return raw
  return "/"
}

function TwoFactorInner() {
  const params = useSearchParams()
  const next = safeNext(params.get("next"))

  const [mode, setMode] = useState<"totp" | "backup">("totp")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [backup, setBackup] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { if (mode === "totp") setTimeout(() => otpRefs.current[0]?.focus(), 80) }, [mode])

  async function verify(code: string) {
    if (loading) return
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        const msg = res.status === 429 ? "Too many attempts. Try again later." : "Invalid code"
        throw new Error((await res.json().catch(() => ({}))).error || msg)
      }
      window.location.href = next
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code")
      setOtp(["", "", "", "", "", ""])
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
      setLoading(false)
    }
  }

  function handleOtpChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1)
    const nextOtp = [...otp]; nextOtp[idx] = digit; setOtp(nextOtp)
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus()
    if (nextOtp.every((d) => d !== "")) setTimeout(() => verify(nextOtp.join("")), 60)
  }
  function handleOtpKey(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }
  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) { setOtp(pasted.split("")); setTimeout(() => verify(pasted), 60) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "var(--bg-secondary)" }}>
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl" style={{ background: "#0E0F12" }}>
            <svg viewBox="0 0 100 100" className="w-7 h-7">
              <path d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="white" />
              <path d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="white" />
              <path d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="white" />
            </svg>
            <span className="text-white font-bold text-[17px] tracking-tight">OneChater</span>
          </div>
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 8px 24px -8px rgba(99,102,241,0.6)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="display text-[26px] font-semibold text-gray-900 tracking-tight">Two-factor authentication</h1>
          <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
            {mode === "totp"
              ? "Enter the 6-digit code from your authenticator app."
              : "Enter one of your backup codes."}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-7" style={{ border: "1px solid var(--border-soft)", boxShadow: "0 4px 24px rgba(14,15,18,0.06)" }}>
          {mode === "totp" ? (
            <div className="flex justify-center gap-1.5 sm:gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpRefs.current[idx] = el }}
                  type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
                  value={digit}
                  autoComplete={idx === 0 ? "one-time-code" : "off"}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(idx, e)}
                  onPaste={handleOtpPaste}
                  disabled={loading}
                  className="w-9 h-12 sm:w-11 sm:h-14 text-center text-[18px] sm:text-[22px] font-bold text-gray-900 rounded-xl focus:outline-none transition-all disabled:opacity-40"
                  style={{ background: "var(--surface-2)", border: digit ? "2px solid var(--text-1)" : "2px solid var(--border-strong)", fontFamily: "monospace" }}
                />
              ))}
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (backup.trim()) verify(backup.trim()) }}>
              <input
                autoFocus
                value={backup}
                onChange={(e) => { setBackup(e.target.value); setError("") }}
                placeholder="xxxxx-xxxxx"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl text-[15px] text-center text-gray-900 placeholder-gray-400 focus:outline-none transition-all disabled:opacity-50"
                style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", fontFamily: "monospace" }}
              />
              <button type="submit" disabled={loading || !backup.trim()}
                className="w-full py-3 mt-3 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] cursor-pointer"
                style={{ background: "linear-gradient(180deg, #1F2025 0%, #0E0F12 100%)" }}>
                {loading ? "Verifying…" : "Verify"}
              </button>
            </form>
          )}

          {error && <p className="text-xs text-red-500 text-center mt-3">{error}</p>}

          <button
            onClick={() => { setMode((m) => (m === "totp" ? "backup" : "totp")); setError(""); setBackup("") }}
            className="w-full text-center text-[12px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer mt-5">
            {mode === "totp" ? "Use a backup code instead" : "Use your authenticator app"}
          </button>
        </div>

        <button onClick={handleSignOut}
          className="w-full text-center text-[12px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer mt-6">
          Sign in with a different account
        </button>
      </div>
    </div>
  )
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={null}>
      <TwoFactorInner />
    </Suspense>
  )
}
