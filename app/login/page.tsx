"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { signIn } from "next-auth/react"
import { LangToggle, useT } from "@/lib/i18n"

const LOGIN_COPY = {
  en: {
    welcomeBack: "Welcome back",
    createAccount: "Create your account",
    checkEmail: "Check your email",
    enterEmail: "Enter your email and we'll send you an access code.",
    enterEmailSignup: "Enter your email to create your free account.",
    sentTo: "We sent a 6-digit code to",
    continueGoogle: "Continue with Google",
    continueGitHub: "Continue with GitHub",
    orWithEmail: "or with email",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    sending: "Sending…",
    sendCode: "Send code",
    verifying: "Verifying…",
    signIn: "Sign in",
    createFree: "Create free account",
    changeEmail: "← Change email",
    resendIn: "Resend in",
    resendCode: "Resend code",
    terms: "By continuing you agree to our",
    termsLink: "Terms of service",
    and: "and",
    privacyLink: "Privacy policy",
    failedSend: "Failed to send the code",
    failedVerify: "Failed to verify the code",
    incorrectCode: "Incorrect or expired code",
    switchToSignup: "New here?",
    switchToSignupLink: "Create free account",
    switchToSignin: "Already have an account?",
    switchToSigninLink: "Sign in",
  },
  es: {
    welcomeBack: "Bienvenido de vuelta",
    createAccount: "Creá tu cuenta",
    checkEmail: "Revisá tu email",
    enterEmail: "Ingresá tu email y te mandamos un código de acceso.",
    enterEmailSignup: "Ingresá tu email para crear tu cuenta gratis.",
    sentTo: "Enviamos un código de 6 dígitos a",
    continueGoogle: "Continuar con Google",
    continueGitHub: "Continuar con GitHub",
    orWithEmail: "o con email",
    emailLabel: "Email",
    emailPlaceholder: "vos@ejemplo.com",
    sending: "Enviando…",
    sendCode: "Enviar código",
    verifying: "Verificando…",
    signIn: "Iniciar sesión",
    createFree: "Crear cuenta gratis",
    changeEmail: "← Cambiar email",
    resendIn: "Reenviar en",
    resendCode: "Reenviar código",
    terms: "Al continuar aceptás nuestros",
    termsLink: "Términos de uso",
    and: "y la",
    privacyLink: "Política de privacidad",
    failedSend: "Error al enviar el código",
    failedVerify: "Error al verificar el código",
    incorrectCode: "Código incorrecto o expirado",
    switchToSignup: "¿Sos nuevo?",
    switchToSignupLink: "Crear cuenta gratis",
    switchToSignin: "¿Ya tenés cuenta?",
    switchToSigninLink: "Iniciar sesión",
  },
}

function IconGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function IconGitHub() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  )
}

type Step = "email" | "otp"
type Mode = "signin" | "signup"

// Read ?next= and only allow same-origin relative paths (block open redirects
// like //evil.com or /\evil.com). Falls back to / (home page).
function safeNext(): string {
  if (typeof window === "undefined") return "/"
  const p = new URLSearchParams(window.location.search).get("next")
  if (p && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/\\")) return p
  return "/"
}

export default function LoginPage() {
  const t = useT(LOGIN_COPY)
  const [mode, setMode] = useState<Mode>("signin")
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
      setError(err instanceof Error ? err.message : t.failedSend)
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(code: string) {
    setLoading(true)
    setError("")
    try {
      const res = await signIn("otp", { email: email.trim(), code, redirect: false })
      if (res?.error) throw new Error(t.incorrectCode)
      window.location.href = safeNext()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.failedVerify)
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
              <g>
                <path className="blob blob-1" d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="url(#blobGrad1)" />
                <path className="blob blob-2" d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="url(#blobGrad2)" />
                <path className="blob blob-3" d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="url(#blobGrad3)" />
              </g>
            </svg>
          </div>

          <div className="max-w-md">
            <h2 className="display text-white text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.05]">
              One memory.<br />
              <span
                className="inline-block"
                style={{
                  background: "linear-gradient(120deg, #a5b4fc 0%, #c4b5fd 50%, #d8b4fe 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Every model.
              </span>
            </h2>
            <p className="mt-5 text-white/60 text-lg leading-relaxed">
              GPT, Claude, Gemini. Chat with all of them without losing context.
            </p>
          </div>
        </div>

        {/* Bottom: micro-trust */}
        <div className="relative z-10 flex items-center justify-center gap-6 text-white/40 text-xs">
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Secure session
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Bring your keys
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            No lock-in
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
        style={{ background: "var(--bg-secondary)" }}
      >
        {/* Desktop lang toggle */}
        <div className="hidden lg:block absolute top-6 right-6">
          <LangToggle />
        </div>

        {/* Mobile logo (visible only when left panel hidden) */}
        <div className="lg:hidden flex justify-between items-center mb-8 w-full">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl" style={{ background: "#0E0F12" }}>
            <svg viewBox="0 0 100 100" className="w-7 h-7">
              <path d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="white" />
              <path d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="white" />
              <path d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="white" />
            </svg>
            <span className="text-white font-bold text-[17px] tracking-tight">OneChater</span>
          </div>
          <LangToggle />
        </div>

        <div className="w-full max-w-[420px]">
          {/* Mode toggle */}
          {step === "email" && (
            <div className="flex mb-6 p-1 rounded-2xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => { setMode("signin"); setError("") }}
                className="flex-1 py-2 text-[13px] font-semibold rounded-xl transition-all cursor-pointer"
                style={mode === "signin" ? { background: "var(--surface)", color: "var(--text-1)", boxShadow: "0 1px 4px rgba(14,15,18,0.08)" } : { color: "var(--text-3)" }}
              >
                {t.switchToSigninLink}
              </button>
              <button
                onClick={() => { setMode("signup"); setError("") }}
                className="flex-1 py-2 text-[13px] font-semibold rounded-xl transition-all cursor-pointer"
                style={mode === "signup" ? { background: "var(--surface)", color: "var(--text-1)", boxShadow: "0 1px 4px rgba(14,15,18,0.08)" } : { color: "var(--text-3)" }}
              >
                {t.switchToSignupLink}
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="display text-[28px] lg:text-[32px] font-semibold text-gray-900 tracking-tight leading-tight">
              {step === "email" ? (mode === "signup" ? t.createAccount : t.welcomeBack) : t.checkEmail}
            </h1>
            <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
              {step === "email"
                ? (mode === "signup" ? t.enterEmailSignup : t.enterEmail)
                : <>{t.sentTo} <span className="font-semibold text-gray-700">{email}</span></>}
            </p>
          </div>

          {/* Card */}
          <div
            className="bg-white rounded-2xl p-7"
            style={{
              border: "1px solid var(--border-soft)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 24px rgba(14,15,18,0.06), 0 1px 2px rgba(14,15,18,0.04)",
            }}
          >
            {/* OAuth buttons — always visible */}
            <div className="space-y-2.5 mb-5">
              <button
                onClick={() => signIn("google", { callbackUrl: safeNext() })}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-[14px] font-medium transition-all hover:bg-gray-50 active:scale-[0.98] cursor-pointer"
                style={{ border: "1.5px solid var(--border)", color: "#374151" }}
              >
                <IconGoogle /> {t.continueGoogle}
              </button>
              <button
                onClick={() => signIn("github", { callbackUrl: safeNext() })}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-[14px] font-medium transition-all hover:bg-gray-50 active:scale-[0.98] cursor-pointer"
                style={{ border: "1.5px solid var(--border)", color: "#374151" }}
              >
                <IconGitHub /> {t.continueGitHub}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[11px] font-medium" style={{ color: "var(--text-4)" }}>{t.orWithEmail}</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            {step === "email" ? (
              <form onSubmit={handleSendOTP} className="space-y-3">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">{t.emailLabel}</label>
                <input
                  ref={emailRef}
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  disabled={loading}
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition-all disabled:opacity-50"
                  style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)" }}
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
                  {loading ? t.sending : (mode === "signup" ? t.createFree : t.sendCode)}
                </button>
              </form>

            ) : (
              <div className="space-y-5">
                <div className="flex justify-center gap-1.5 sm:gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      autoComplete={idx === 0 ? "one-time-code" : "off"}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(idx, e)}
                      onPaste={handleOtpPaste}
                      disabled={loading}
                      className="w-9 h-12 sm:w-11 sm:h-14 text-center text-[18px] sm:text-[22px] font-bold text-gray-900 rounded-xl focus:outline-none transition-all disabled:opacity-40"
                      style={{
                        background: "var(--surface-2)",
                        border: digit ? "2px solid var(--text-1)" : "2px solid var(--border-strong)",
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
                  {loading ? t.verifying : t.signIn}
                </button>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <button
                    onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError("") }}
                    className="hover:text-gray-600 transition-colors cursor-pointer">
                    {t.changeEmail}
                  </button>
                  {resendCountdown > 0 ? (
                    <span>{t.resendIn} {resendCountdown}s</span>
                  ) : (
                    <button
                      onClick={() => handleSendOTP()}
                      disabled={loading}
                      className="hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-40">
                      {t.resendCode}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
            {t.terms}{" "}
            <a href="/terms" className="underline underline-offset-2 cursor-pointer hover:text-gray-600">{t.termsLink}</a>
            {" "}{t.and}{" "}
            <a href="/privacy" className="underline underline-offset-2 cursor-pointer hover:text-gray-600">{t.privacyLink}</a>
          </p>
        </div>
      </div>
    </div>
  )
}
