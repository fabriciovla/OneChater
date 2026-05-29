"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { signIn } from "next-auth/react"

type Step = "email" | "otp"

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCountdown, setResendCountdown] = useState(0)

  const emailRef = useRef<HTMLInputElement>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { emailRef.current?.focus() }, [])
  useEffect(() => {
    if (step === "otp") setTimeout(() => otpRefs.current[0]?.focus(), 80)
  }, [step])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  async function handleSendOTP(e?: React.FormEvent) {
    e?.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Error")
      setStep("otp")
      setResendCountdown(60)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar el código")
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(code: string) {
    setLoading(true)
    setError("")
    try {
      const res = await signIn("otp", { email: email.trim(), code, redirect: false })
      if (res?.error) throw new Error("Código incorrecto o expirado")
      window.location.href = "/chat"
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al verificar el código")
      setOtp(["", "", "", "", "", ""])
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus()
    if (next.every((d) => d !== "")) setTimeout(() => verifyCode(next.join("")), 60)
  }

  function handleOtpKey(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
    if (e.key === "Enter") verifyCode(otp.join(""))
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(""))
      setTimeout(() => verifyCode(pasted), 60)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ─── LEFT: Brand panel ───────────────────────────────── */}
      <div
        className="relative hidden lg:flex flex-col items-center justify-between overflow-hidden p-12 xl:p-16"
        style={{
          background:
            "radial-gradient(1000px 600px at 20% -10%, rgba(99,102,241,0.22), transparent 60%)," +
            "radial-gradient(800px 500px at 100% 100%, rgba(139,92,246,0.20), transparent 55%)," +
            "linear-gradient(180deg, #14161B 0%, #0E0F12 60%, #0A0B0E 100%)",
        }}
      >
        {/* Floating blob orbs */}
        <div
          className="absolute -top-20 -left-20 w-[380px] h-[380px] rounded-full opacity-40 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.45), transparent 65%)",
            filter: "blur(40px)",
            animation: "loginOrb1 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-0 -right-32 w-[420px] h-[420px] rounded-full opacity-40 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.45), transparent 65%)",
            filter: "blur(40px)",
            animation: "loginOrb2 17s ease-in-out infinite",
          }}
        />

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top: small wordmark */}
        <a href="/" className="relative z-10 inline-flex items-center gap-2.5 w-fit group cursor-pointer">
          <svg viewBox="0 0 100 100" className="w-7 h-7">
            <rect width="100" height="100" rx="22" fill="white" />
            <path d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="#0E0F12" />
            <path d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="#0E0F12" />
            <path d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="#0E0F12" />
          </svg>
          <span className="text-white font-bold text-[17px] tracking-tight group-hover:opacity-80 transition-opacity">OneChater</span>
        </a>

        {/* Center: giant 3-blob logo + tagline */}
        <div className="relative z-10 flex flex-col items-center text-center gap-10 mx-auto">
          <div
            className="relative"
            style={{ animation: "logoFloat 6s ease-in-out infinite" }}
          >
            <svg viewBox="0 0 100 100" className="w-[280px] h-[280px] xl:w-[340px] xl:h-[340px]">
              <defs>
                <linearGradient id="blobGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e0e7ff" />
                </linearGradient>
                <linearGradient id="blobGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#ddd6fe" />
                </linearGradient>
                <linearGradient id="blobGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e9d5ff" />
                </linearGradient>
                <filter id="blobGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#blobGlow)">
                <path className="blob blob-1" d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="url(#blobGrad1)" />
                <path className="blob blob-2" d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="url(#blobGrad2)" />
                <path className="blob blob-3" d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="url(#blobGrad3)" />
              </g>
            </svg>
          </div>

          <div className="max-w-md">
            <h2 className="display text-white text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.05]">
              Una memoria.<br />
              <span
                className="inline-block"
                style={{
                  background: "linear-gradient(120deg, #a5b4fc 0%, #c4b5fd 50%, #d8b4fe 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Todos los modelos.
              </span>
            </h2>
            <p className="mt-5 text-white/60 text-lg leading-relaxed">
              GPT, Claude, Gemini — chateá con todos sin perder el contexto.
            </p>
          </div>
        </div>

        {/* Bottom: micro-trust */}
        <div className="relative z-10 flex items-center justify-center gap-6 text-white/40 text-xs">
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            AES-256
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            SOC 2 compliant
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sin lock-in
          </span>
        </div>

        <style jsx>{`
          @keyframes loginOrb1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(40px, 30px) scale(1.1); }
          }
          @keyframes loginOrb2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-30px, -40px) scale(1.05); }
          }
          @keyframes logoFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(1deg); }
          }
        `}</style>
      </div>

      {/* ─── RIGHT: Form panel ───────────────────────────────── */}
      <div
        className="relative flex flex-col items-center justify-center px-6 py-12 lg:px-12"
        style={{ background: "linear-gradient(145deg, #f8f8f7 0%, #eeede9 100%)" }}
      >
        {/* Mobile logo (visible only when left panel hidden) */}
        <div className="lg:hidden flex justify-center mb-8">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl" style={{ background: "#0E0F12" }}>
            <svg viewBox="0 0 100 100" className="w-7 h-7">
              <path d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="white" />
              <path d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="white" />
              <path d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="white" />
            </svg>
            <span className="text-white font-bold text-[17px] tracking-tight">OneChater</span>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="display text-[28px] lg:text-[32px] font-semibold text-gray-900 tracking-tight leading-tight">
              {step === "email" ? "Bienvenido de vuelta" : "Revisá tu correo"}
            </h1>
            <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
              {step === "email"
                ? "Ingresá tu correo y te enviamos un código de acceso."
                : <>Enviamos un código de 6 dígitos a <span className="font-semibold text-gray-700">{email}</span></>}
            </p>
          </div>

          {/* Card */}
          <div
            className="bg-white rounded-2xl p-7"
            style={{
              border: "1px solid rgba(14,15,18,0.07)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 24px rgba(14,15,18,0.06), 0 1px 2px rgba(14,15,18,0.04)",
            }}
          >
            {step === "email" ? (
              <form onSubmit={handleSendOTP} className="space-y-3">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  disabled={loading}
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition-all disabled:opacity-50"
                  style={{ background: "#f9fafb", border: "1.5px solid rgba(14,15,18,0.09)" }}
                />

                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 mt-2 rounded-xl text-[14px] font-semibold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  style={{
                    background: "linear-gradient(180deg, #1F2025 0%, #0E0F12 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 24px -8px rgba(14,15,18,0.35)",
                  }}>
                  {loading ? "Enviando…" : "Enviar código"}
                </button>
              </form>

            ) : (
              <div className="space-y-5">
                <div className="flex justify-center gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      disabled={loading}
                      className="w-11 h-14 text-center text-[22px] font-bold text-gray-900 rounded-xl focus:outline-none transition-all disabled:opacity-40"
                      style={{
                        background: "#f9fafb",
                        border: digit ? "2px solid #0E0F12" : "2px solid #e5e7eb",
                        fontFamily: "monospace",
                      }}
                    />
                  ))}
                </div>

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                <button
                  onClick={() => verifyCode(otp.join(""))}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  style={{
                    background: "linear-gradient(180deg, #1F2025 0%, #0E0F12 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 24px -8px rgba(14,15,18,0.35)",
                  }}>
                  {loading ? "Verificando…" : "Ingresar"}
                </button>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <button
                    onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError("") }}
                    className="hover:text-gray-600 transition-colors cursor-pointer">
                    ← Cambiar correo
                  </button>
                  {resendCountdown > 0 ? (
                    <span>Reenviar en {resendCountdown}s</span>
                  ) : (
                    <button
                      onClick={() => handleSendOTP()}
                      disabled={loading}
                      className="hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-40">
                      Reenviar código
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
            Al continuar aceptás nuestros{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-gray-600">Términos de servicio</span>
            {" "}y{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-gray-600">Política de privacidad</span>
          </p>
        </div>
      </div>
    </div>
  )
}
