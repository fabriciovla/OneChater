"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

type Step = "loading" | "off" | "setup" | "backup" | "on" | "disable"

export default function SecurityPage() {
  const { status } = useSession()
  const [step, setStep] = useState<Step>("loading")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  // Enrollment data
  const [qr, setQr] = useState("")
  const [secret, setSecret] = useState("")
  const [code, setCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  useEffect(() => {
    if (status === "unauthenticated") { window.location.href = "/login?next=/security"; return }
    if (status !== "authenticated") return
    fetch("/api/auth/2fa")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => setStep(d?.enabled ? "on" : "off"))
      .catch(() => setStep("off"))
  }, [status])

  async function startSetup() {
    setBusy(true); setError("")
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to start")
      const d = await res.json()
      setQr(d.qr); setSecret(d.secret); setCode(""); setStep("setup")
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to start") }
    finally { setBusy(false) }
  }

  async function confirmEnable() {
    setBusy(true); setError("")
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Invalid code")
      const d = await res.json()
      setBackupCodes(d.backupCodes ?? []); setStep("backup")
    } catch (e) { setError(e instanceof Error ? e.message : "Invalid code") }
    finally { setBusy(false) }
  }

  async function confirmDisable() {
    setBusy(true); setError("")
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Invalid code")
      setCode(""); setStep("off")
    } catch (e) { setError(e instanceof Error ? e.message : "Invalid code") }
    finally { setBusy(false) }
  }

  function copyBackup() {
    navigator.clipboard.writeText(backupCodes.join("\n")).catch(() => {})
  }

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: "var(--bg-secondary)" }}>
      <div className="w-full max-w-[560px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <a href="/chat" className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-black/[0.05] cursor-pointer" style={{ border: "1px solid var(--border)", color: "var(--text-2)" }} title="Back to chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </a>
          <div>
            <h1 className="display text-[22px] font-semibold text-gray-900 tracking-tight leading-tight">Security</h1>
            <p className="text-[13px] text-gray-500">Two-factor authentication (2FA)</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-7" style={{ border: "1px solid var(--border-soft)", boxShadow: "0 4px 24px rgba(14,15,18,0.05)" }}>
          {step === "loading" && <p className="text-sm text-gray-400 text-center py-8">Loading…</p>}

          {/* OFF — intro + enable */}
          {step === "off" && (
            <div className="text-center">
              <Badge on={false} />
              <h2 className="text-[17px] font-semibold text-gray-900 mt-4">Add an extra layer of security</h2>
              <p className="text-[13.5px] text-gray-500 mt-2 leading-relaxed max-w-sm mx-auto">
                Require a code from an authenticator app (Google Authenticator, Authy, 1Password…) when you sign in on a new device — so a stolen password or email isn&apos;t enough to get into your account.
              </p>
              <button onClick={startSetup} disabled={busy}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98] cursor-pointer"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {busy ? "Starting…" : "Enable 2FA"}
              </button>
            </div>
          )}

          {/* SETUP — QR + manual key + confirm code */}
          {step === "setup" && (
            <div>
              <h2 className="text-[16px] font-semibold text-gray-900">1. Scan the QR with your app</h2>
              <div className="flex flex-col items-center mt-4">
                {qr && /* eslint-disable-next-line @next/next/no-img-element */ (
                  <img src={qr} alt="2FA QR code" className="w-44 h-44 rounded-xl" style={{ border: "1px solid var(--border)" }} />
                )}
                <p className="text-[12px] text-gray-400 mt-3">Can&apos;t scan? Enter this key manually:</p>
                <code className="mt-1 text-[12.5px] font-mono px-3 py-1.5 rounded-lg break-all text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border-soft)", color: "var(--text-1)" }}>{secret}</code>
              </div>

              <h2 className="text-[16px] font-semibold text-gray-900 mt-6">2. Enter the 6-digit code</h2>
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError("") }}
                inputMode="numeric" placeholder="000000" autoFocus
                className="w-full mt-3 px-4 py-3 rounded-xl text-[20px] tracking-[0.4em] text-center text-gray-900 focus:outline-none"
                style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", fontFamily: "monospace" }}
              />
              {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => { setStep("off"); setError("") }} className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors hover:bg-black/[0.04] cursor-pointer" style={{ color: "var(--text-3)" }}>Cancel</button>
                <button onClick={confirmEnable} disabled={busy || code.length !== 6}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  {busy ? "Verifying…" : "Verify & enable"}
                </button>
              </div>
            </div>
          )}

          {/* BACKUP — show one-time codes */}
          {step === "backup" && (
            <div className="text-center">
              <Badge on={true} />
              <h2 className="text-[17px] font-semibold text-gray-900 mt-4">Save your backup codes</h2>
              <p className="text-[13px] text-gray-500 mt-2 leading-relaxed max-w-sm mx-auto">
                Each code works once. Keep them somewhere safe — they&apos;re the only way in if you lose your phone.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-5 text-left">
                {backupCodes.map((c) => (
                  <code key={c} className="text-[13px] font-mono px-3 py-2 rounded-lg text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border-soft)", color: "var(--text-1)" }}>{c}</code>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-5">
                <button onClick={copyBackup} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer" style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}>Copy codes</button>
                <button onClick={() => setStep("on")} className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>I saved them</button>
              </div>
            </div>
          )}

          {/* ON — enabled, offer disable */}
          {step === "on" && (
            <div className="text-center">
              <Badge on={true} />
              <h2 className="text-[17px] font-semibold text-gray-900 mt-4">2FA is on</h2>
              <p className="text-[13.5px] text-gray-500 mt-2 leading-relaxed max-w-sm mx-auto">
                Your account asks for an authenticator code when you sign in on a new device or browser. Nice — that&apos;s the strong setup.
              </p>
              <button onClick={() => { setStep("disable"); setCode(""); setError("") }}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-all hover:bg-red-50 active:scale-[0.98] cursor-pointer text-red-500"
                style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
                Disable 2FA
              </button>
            </div>
          )}

          {/* DISABLE — confirm with a code */}
          {step === "disable" && (
            <div>
              <h2 className="text-[16px] font-semibold text-gray-900">Confirm to disable 2FA</h2>
              <p className="text-[13px] text-gray-500 mt-1.5">Enter a current authenticator code (or a backup code) to turn off 2FA.</p>
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value); setError("") }}
                placeholder="000000 or backup code" autoFocus
                className="w-full mt-4 px-4 py-3 rounded-xl text-[16px] text-center text-gray-900 focus:outline-none"
                style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", fontFamily: "monospace" }}
              />
              {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => { setStep("on"); setError("") }} className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors hover:bg-black/[0.04] cursor-pointer" style={{ color: "var(--text-3)" }}>Cancel</button>
                <button onClick={confirmDisable} disabled={busy || !code.trim()}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  style={{ background: "#ef4444" }}>
                  {busy ? "Disabling…" : "Disable 2FA"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Badge({ on }: { on: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
      style={on
        ? { background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" }
        : { background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "#10b981" : "var(--text-4)" }} />
      {on ? "Enabled" : "Not enabled"}
    </span>
  )
}
