import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad · OneChat",
  description: "Cómo OneChat recopila, usa y protege tu información.",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de privacidad</h1>
        <p className="text-gray-500 mb-10">Tu privacidad importa. Acá te explicamos qué datos recopilamos y cómo los usamos.</p>

        <Section title="1. Qué datos recopilamos">
          <p><strong>Datos de cuenta:</strong> nombre, dirección de email y foto de perfil (cuando iniciás sesión con Google, GitHub, o Apple). También almacenamos las sesiones de autenticación necesarias para mantener tu sesión activa.</p>
          <p><strong>Conversaciones:</strong> el historial de tus chats se guarda en nuestra base de datos para que puedas accederlo desde cualquier dispositivo.</p>
          <p><strong>Memoria persistente:</strong> los hechos que el sistema extrae de tus conversaciones se guardan asociados a tu cuenta para personalizar futuras respuestas.</p>
          <p><strong>API keys:</strong> tus API keys de terceros (OpenAI, Anthropic, Google, etc.) se almacenan <em>únicamente en tu navegador</em> (localStorage). Nunca las enviamos ni almacenamos en nuestros servidores.</p>
        </Section>

        <Section title="2. Cómo usamos tus datos">
          <ul>
            <li>Proveer y mejorar el Servicio.</li>
            <li>Mantener tu historial de conversaciones y memoria sincronizados entre dispositivos.</li>
            <li>Enviarte emails transaccionales (OTP para login, notificaciones importantes). Usamos <strong>Resend</strong> para el envío de emails.</li>
            <li>Detectar y prevenir abusos.</li>
          </ul>
          <p>No vendemos tus datos. No los usamos para publicidad.</p>
        </Section>

        <Section title="3. Terceros con acceso a tus datos">
          <ul>
            <li><strong>Neon</strong> (base de datos Postgres) — almacena tus conversaciones y datos de cuenta.</li>
            <li><strong>Vercel</strong> — hosting e infraestructura de la aplicación.</li>
            <li><strong>Resend</strong> — envío de emails transaccionales.</li>
            <li><strong>NextAuth / Auth.js</strong> — gestión de sesiones y OAuth.</li>
            <li><strong>Proveedores de IA</strong> (OpenAI, Anthropic, Google, etc.) — tus mensajes se envían directamente a estos servicios usando tu propia API key. Están sujetos a sus propias políticas de privacidad.</li>
          </ul>
        </Section>

        <Section title="4. Cookies y almacenamiento local">
          <p>Usamos cookies de sesión necesarias para la autenticación (HttpOnly, Secure). No usamos cookies de rastreo ni de publicidad.</p>
          <p>Usamos <code>localStorage</code> para guardar tus API keys y preferencias de la app (tema, modelos seleccionados). Estos datos nunca salen de tu dispositivo.</p>
        </Section>

        <Section title="5. Retención de datos">
          <p>Conservamos tus datos mientras tu cuenta esté activa. Podés solicitar la eliminación de tu cuenta y todos sus datos asociados escribiendo a nuestro email de contacto.</p>
        </Section>

        <Section title="6. Tus derechos">
          <p>Tenés derecho a acceder, corregir, exportar o eliminar tus datos personales. Para ejercer estos derechos, escribinos a <a href="mailto:fabriciouala1@gmail.com" className="underline text-gray-700 hover:text-gray-900">fabriciouala1@gmail.com</a>.</p>
        </Section>

        <Section title="7. Seguridad">
          <p>Usamos HTTPS en todas las comunicaciones, tokens de sesión con rotación, y acceso a la base de datos restringido por roles. Ningún sistema es 100% seguro; ante cualquier incidente de seguridad, lo comunicaremos a los usuarios afectados.</p>
        </Section>

        <Section title="8. Cambios a esta política">
          <p>Podemos actualizar esta política. Si los cambios son significativos, te notificaremos por email o mediante un aviso en el Servicio.</p>
        </Section>

        <Section title="9. Contacto">
          <p>Para consultas sobre privacidad: <a href="mailto:fabriciouala1@gmail.com" className="underline text-gray-700 hover:text-gray-900">fabriciouala1@gmail.com</a>.</p>
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
      <div className="text-[15px] text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px]">
        {children}
      </div>
    </section>
  );
}
