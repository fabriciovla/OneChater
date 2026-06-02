"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Paddle v2 types (minimal)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any
  }
}

const PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID ?? "pri_01kt3hegyvwsrx70z9ssr0ky2s"
const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ""

export default function CheckoutProPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [phase, setPhase] = useState<"loading" | "opening" | "error">("loading")
  const [errMsg, setErrMsg] = useState("")

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.replace("/login?next=/checkout/pro")
      return
    }

    if (!CLIENT_TOKEN) {
      setPhase("error")
      setErrMsg("Paddle client token no configurado (NEXT_PUBLIC_PADDLE_CLIENT_TOKEN).")
      return
    }

    // Load Paddle.js v2
    const existing = document.querySelector("script[src*='paddle.com']")
    const initAndOpen = () => {
      try {
        window.Paddle.Initialize({
          token: CLIENT_TOKEN,
          eventCallback: (ev: { name: string }) => {
            if (ev.name === "checkout.completed") {
              router.replace("/checkout/success")
            }
            if (ev.name === "checkout.closed") {
              router.replace("/precios")
            }
          },
        })
        setPhase("opening")
        window.Paddle.Checkout.open({
          items: [{ priceId: PRICE_ID, quantity: 1 }],
          customer: { email: session?.user?.email ?? undefined },
          customData: { userId: (session?.user as { id?: string })?.id ?? "" },
          settings: {
            displayMode: "overlay",
            theme: "light",
            locale: "es",
            allowLogout: false,
          },
        })
      } catch (e) {
        setPhase("error")
        setErrMsg(String(e))
      }
    }

    if (existing) {
      initAndOpen()
    } else {
      const script = document.createElement("script")
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
      script.async = true
      script.onload = initAndOpen
      script.onerror = () => {
        setPhase("error")
        setErrMsg("No se pudo cargar Paddle.js")
      }
      document.head.appendChild(script)
    }
  }, [status, session, router])

  if (phase === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#fafaf9" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#fee2e2" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <p className="text-gray-700 max-w-sm">{errMsg}</p>
        <Link href="/precios" className="text-sm text-indigo-600 underline">Volver a precios</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: "#fafaf9" }}>
      {/* Spinner */}
      <svg className="w-8 h-8 animate-spin" style={{ color: "#6366f1" }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
        <path d="M22 12A10 10 0 0 0 12 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-sm text-gray-500">
        {phase === "loading" ? "Cargando…" : "Abriendo checkout…"}
      </p>
    </div>
  )
}
