import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de reembolsos · OneChat",
  description: "Política de reembolsos de OneChat.",
};

export default function RefundsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary, #fafaf9)" }}>
      {/* Nav */}
      <header className="border-b border-black/6 px-5 md:px-10 h-14 flex items-center justify-between">
        <Link href="/" className="text-[15px] font-semibold text-gray-900 hover:opacity-70 transition-opacity">
          ← OneChat
        </Link>
        <span className="text-xs text-gray-400">Actualizado: junio 2026</span>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-14">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de reembolsos</h1>
        <p className="text-gray-500 mb-10">Transparencia total sobre cómo manejamos los pagos y reembolsos.</p>

        <Section title="1. Plan gratuito">
          <p>OneChat ofrece actualmente un plan gratuito sin costo. No se requiere tarjeta de crédito para registrarse ni para usar las funcionalidades básicas del Servicio.</p>
        </Section>

        <Section title="2. Modelo BYOK (Bring Your Own Key)">
          <p>OneChat funciona con el modelo BYOK: vos proveés tus propias API keys de los proveedores de IA (OpenAI, Anthropic, Google, etc.). <strong>OneChat no cobra por el acceso a los modelos de IA.</strong> Los costos de uso de las APIs son facturados directamente por cada proveedor a vos, según sus propios términos y precios.</p>
          <p>Para consultas sobre cargos de los proveedores de IA, debés contactar directamente a cada proveedor.</p>
        </Section>

        <Section title="3. Planes pagos (próximamente)">
          <p>En el futuro, OneChat podría ofrecer planes de suscripción pagos con funcionalidades adicionales. Cuando eso ocurra, esta política se actualizará con los detalles correspondientes.</p>
          <p>Para cualquier plan pago futuro, la política de reembolsos será:</p>
          <ul>
            <li><strong>Período de prueba:</strong> reembolso completo dentro de los primeros 7 días sin preguntas.</li>
            <li><strong>Cancelación:</strong> podés cancelar en cualquier momento. El acceso continúa hasta el fin del período facturado. No se ofrecen reembolsos proporcionales por períodos parciales, salvo en casos donde la ley aplicable lo exija.</li>
            <li><strong>Falla del servicio:</strong> si OneChat sufre una interrupción significativa (más de 24 horas), podemos ofrecer crédito o reembolso proporcional a criterio del equipo.</li>
          </ul>
        </Section>

        <Section title="4. Cómo solicitar un reembolso">
          <p>Para solicitar un reembolso (cuando aplique), escribí a <a href="mailto:fabriciouala1@gmail.com" className="underline text-gray-700 hover:text-gray-900">fabriciouala1@gmail.com</a> con el asunto <strong>"Solicitud de reembolso"</strong> e incluí:</p>
          <ul>
            <li>Tu email de cuenta registrado en OneChat.</li>
            <li>Motivo de la solicitud.</li>
            <li>Fecha y monto del cargo (si aplica).</li>
          </ul>
          <p>Responderemos dentro de los 5 días hábiles.</p>
        </Section>

        <Section title="5. Excepciones">
          <p>No se procesarán reembolsos en casos de:</p>
          <ul>
            <li>Violación de los Términos de uso que resultó en suspensión de la cuenta.</li>
            <li>Uso fraudulento o abuso del Servicio.</li>
            <li>Cargos de terceros proveedores de IA (esos corresponden a cada proveedor).</li>
          </ul>
        </Section>

        <Section title="6. Contacto">
          <p>¿Tenés alguna duda? Escribinos a <a href="mailto:fabriciouala1@gmail.com" className="underline text-gray-700 hover:text-gray-900">fabriciouala1@gmail.com</a>.</p>
        </Section>
      </main>

      <footer className="border-t border-black/6 px-5 py-8 text-center text-xs text-gray-400">
        <div className="flex justify-center gap-6">
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacidad</Link>
          <Link href="/terms" className="hover:text-gray-700 transition-colors">Términos</Link>
          <Link href="/refunds" className="hover:text-gray-700 transition-colors">Reembolsos</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="text-[17px] font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="text-[15px] text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
