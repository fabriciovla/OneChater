import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "¡Bienvenido a Pro! · OneChat",
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center" style={{ background: "#fafaf9" }}>
      {/* Checkmark */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          boxShadow: "0 12px 32px -8px rgba(99,102,241,0.5)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">¡Ya sos Pro!</h1>
        <p className="mt-2 text-gray-500 max-w-xs mx-auto">
          Tu suscripción está activa. La memoria ilimitada y todas las funciones Pro ya están disponibles.
        </p>
      </div>

      <Link
        href="/chat"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          boxShadow: "0 8px 24px -6px rgba(99,102,241,0.5)",
        }}
      >
        Ir al chat
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>

      <p className="text-xs text-gray-400">
        Recibís un email de confirmación de Paddle.{" "}
        <a href="mailto:fabriciouala1@gmail.com" className="underline hover:text-gray-600">¿Problemas?</a>
      </p>
    </div>
  )
}
