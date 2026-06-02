import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de uso · OneChat",
  description: "Términos y condiciones de uso de OneChat.",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos de uso</h1>
        <p className="text-gray-500 mb-10">Al usar OneChat aceptás estos términos. Leelos con cuidado.</p>

        <Section title="1. Aceptación">
          <p>Al acceder o usar OneChat ("el Servicio"), aceptás quedar vinculado por estos Términos de uso. Si no estás de acuerdo, no uses el Servicio.</p>
        </Section>

        <Section title="2. Descripción del servicio">
          <p>OneChat es una aplicación de chat multi-modelo que te permite interactuar con distintos proveedores de IA (OpenAI, Anthropic, Google, y otros) utilizando tus propias API keys (modelo BYOK — Bring Your Own Key). OneChat no provee ni financia el acceso a las APIs de terceros.</p>
        </Section>

        <Section title="3. Cuenta de usuario">
          <ul>
            <li>Debés tener al menos 13 años para usar el Servicio.</li>
            <li>Sos responsable de mantener la confidencialidad de tus credenciales.</li>
            <li>Notificanos inmediatamente ante cualquier uso no autorizado de tu cuenta.</li>
          </ul>
        </Section>

        <Section title="4. Tus API keys (BYOK)">
          <p>Vos proveés tus propias API keys de terceros. Esas keys se almacenan únicamente en tu navegador (localStorage). OneChat no almacena tus keys en nuestros servidores. Sos responsable del uso y los costos asociados a esas keys. No compartás tus keys con nadie.</p>
        </Section>

        <Section title="5. Uso aceptable">
          <p>No podés usar OneChat para:</p>
          <ul>
            <li>Generar contenido ilegal, abusivo, o que viole derechos de terceros.</li>
            <li>Hacer ingeniería inversa, descompilar, o copiar el código fuente (más allá de lo que permite la licencia MIT).</li>
            <li>Intentar interferir con la infraestructura del Servicio.</li>
            <li>Suplantar la identidad de otras personas.</li>
          </ul>
        </Section>

        <Section title="6. Contenido generado por IA">
          <p>Las respuestas de los modelos de IA son generadas por terceros (OpenAI, Anthropic, Google, etc.). OneChat no es responsable por la exactitud, completitud, o adecuación de ese contenido. No dependas exclusivamente de respuestas de IA para decisiones críticas (médicas, legales, financieras, etc.).</p>
        </Section>

        <Section title="7. Propiedad intelectual">
          <p>El código fuente de OneChat está disponible bajo licencia MIT. Los logos, marcas y diseños son propiedad de Fabricio Varela. No podés usar la marca "OneChat" sin permiso expreso.</p>
        </Section>

        <Section title="8. Limitación de responsabilidad">
          <p>El Servicio se provee "tal como está", sin garantías de ningún tipo. En la máxima medida permitida por la ley, OneChat y sus operadores no son responsables por daños directos, indirectos, incidentales o consecuentes derivados del uso del Servicio.</p>
        </Section>

        <Section title="9. Modificaciones">
          <p>Podemos actualizar estos términos en cualquier momento. Si los cambios son significativos, lo notificaremos en el Servicio o por email. El uso continuado del Servicio implica aceptación de los nuevos términos.</p>
        </Section>

        <Section title="10. Ley aplicable">
          <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será resuelta en los tribunales competentes de la Ciudad Autónoma de Buenos Aires.</p>
        </Section>

        <Section title="11. Contacto">
          <p>Para consultas sobre estos términos, escribí a <a href="mailto:fabriciouala1@gmail.com" className="underline text-gray-700 hover:text-gray-900">fabriciouala1@gmail.com</a>.</p>
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
