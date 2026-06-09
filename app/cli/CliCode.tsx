"use client"

import { useState } from "react"

// Fallback shown when the CLI loopback wasn't reachable: the user copies this
// one-time code and pastes it into the terminal prompt.
export default function CliCode({ token, email }: { token: string; email?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--surface, #0b0b0f)",
        color: "var(--text-1, #f5f5f7)",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 460 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>You're signed in</h1>
        <p style={{ fontSize: 14, opacity: 0.7, margin: "0 0 20px" }}>
          {email ? `${email} — ` : ""}copy this code and paste it into the OneChater CLI.
        </p>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "stretch",
          }}
        >
          <code
            style={{
              flex: 1,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              lineHeight: 1.4,
              wordBreak: "break-all",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--border, #2a2a33)",
              background: "var(--surface-2, #15151c)",
              maxHeight: 120,
              overflow: "auto",
            }}
          >
            {token}
          </code>
        </div>

        <button
          onClick={copy}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "11px 16px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            background: "var(--accent, #6366f1)",
            color: "#fff",
          }}
        >
          {copied ? "Copied ✓" : "Copy code"}
        </button>

        <p style={{ fontSize: 12, opacity: 0.5, marginTop: 16 }}>
          This code expires in 10 minutes. You can close this tab after pasting it.
        </p>
      </div>
    </main>
  )
}
