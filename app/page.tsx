"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useSession, SessionProvider } from "next-auth/react";
import ThemeToggle from "./components/ThemeToggle";
import UserMenu from "./components/UserMenu";
import { useLang, useT, LangToggle } from "@/lib/i18n";

// â"€ Landing copy (EN / ES) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const LP = {
  en: {
    nav: { features: "Features", how: "How it works", memory: "Memory", pricing: "Pricing", signIn: "Sign in", startFree: "Start free", menu: "Menu", openMenu: "Open menu", closeMenu: "Close menu", home: "OneChater home" },
    hero: {
      new: "New", badge: "Persistent memory across models",
      srH1: "OneChater — AI chat with GPT, Claude and Gemini in one place, with a persistent memory that follows you across every model",
      line1: "One memory.", line2: "Every AI.",
      subA: "The only AI chat app that doesn't forget you when you switch models.", subBold: " GPT, Claude and Gemini", subC: " in one place, with a memory that travels with you.",
      startFree: "Start free", seeHow: "See how it works",
      proWorldwide: "professionals worldwide", byok: "BYOK · 0% fee", worksWith: "Works with",
    },
    preview: { activeMemory: "Active memory:", chips: "Next.js · Banking client · Short answers", userQ: "How do I optimize this Postgres query?", sent: "Sent to 3 models", now: "Just now", gpt: "Add a composite index on", gptB: "and run EXPLAIN ANALYZE to verify...", claude: "With pgvector on your Supabase you can use", claudeB: "indexes for more efficient searches...", full: "Full answer →", gen: "Generating response...", ask: "Ask every model at once...", send: "Send message" },
    feat: {
      label: "Features", title: "Never start from scratch again",
      subtitle: "Every time you switch models, you lose context. OneChater remembers everything, across every model, forever.",
      items: {
        memory: { name: "Living memory", badge: "Differentiator", long: "The only memory system that works across every model you use. It captures your projects, stack, decisions and tone automatically.",
          bullets: [["Automatic capture", "Stack and decisions, effortlessly."], ["Editable profile", "Add, edit and delete what it knows about you."], ["Semantic search", "The exact answer in seconds."], ["Portable", "Every model knows you the same."]] },
        multi: { name: "Multi-model chat", long: "Write once and get answers from GPT, Claude and Gemini in parallel. Compare them side by side and keep the best.",
          bullets: [["Parallel streaming", "Three answers at once."], ["Compare view", "Differences highlighted instantly."], ["Pick your models", "Toggle them on or off per chat."], ["Fork an answer", "Take the best one and keep going."]] },
        byok: { name: "Your own API keys", long: "Paste your OpenAI, Anthropic and Google keys. They're stored only in your browser, never on our servers. No markup, no middlemen.",
          bullets: [["Browser-only", "Keys stored locally, never on the server."], ["30-second setup", "Paste and go, no OAuth."], ["Easy rotation", "Change or delete them anytime."], ["Multi-provider", "OpenAI, Anthropic, Google and more."]] },
        projects: { name: "Isolated projects", long: "Separate contexts by project. Each one with its own memory, history and configuration. No cross-contamination between clients.",
          bullets: [["Isolated memory", "No mixing between clients."], ["Keys per project", "Assign different API keys."], ["Scoped search", "Filter by the active project."], ["Custom config", "Model and tone per project."]] },
        spend: { name: "Spend dashboard", long: "Track spend by model, by project, by day. Set limits and rest easy knowing you'll never be overcharged.",
          bullets: [["Live tracking", "Every request, in real time."], ["Configurable limits", "Cut off when you hit the cap."], ["Deep breakdown", "By model, project or day."], ["Smart alerts", "A heads-up if something spikes."]] },
      },
    },
    how: {
      label: "How it works", title1: "Up and running in", title2: "60 seconds",
      subtitle: "No complicated setup. No subscriptions to manage. Paste your keys and get started.", step: "Step",
      steps: {
        s1: { eyebrow: "Setup", title: "Connect your API keys", desc: "Paste your OpenAI, Anthropic or Google keys. They're stored only in your browser, never on our servers. Set it up once, forever.", tags: ["OpenAI", "Anthropic", "Google", "Local only"] },
        s2: { eyebrow: "Chat", title: "Chat with every model", desc: "Write once and get answers from GPT, Claude and Gemini in real time, side by side. Compare them and pick the best.", tags: ["Real-time streaming", "Compare view", "Zero friction"] },
        s3: { eyebrow: "Memory", title: "Memory learns as you go", desc: "After every chat, OneChater extracts what matters: projects, preferences, decisions. Next time, every model already knows you.", tags: ["Automatic capture", "Editable profile", "Portable across models"] },
      },
    },
    mem: {
      label: "Per-user memory", premium: "Premium", title1: "Never repeat yourself", title2: "to your AI again",
      subtitle: "OneChater builds a private memory for every user, so your assistants remember your preferences, projects, goals and long-term context.",
      user: "User", account: "Your account", personal: "Personal Memory", encrypted: "Private and encrypted",
      caption: "A single memory shared across all your AI models, keeping context consistent everywhere.",
      noteTitle: "You're in control", noteBody: "Users keep full control over their information. Memory exists to improve your experience and can be managed from the settings panel.",
      cards: {
        personal: { name: "Personal Memory", desc: "Every user gets an independent memory. Information is stored only to improve the quality of their conversations." },
        contexto: { name: "Continuous Context", desc: "Switch between GPT, Claude, Gemini or other models without losing important information about you or your projects." },
        aprendizaje: { name: "Progressive Learning", desc: "OneChater can remember relevant details shared in earlier conversations to deliver more consistent, personalized answers." },
        preferencias: { name: "Persistent Preferences", desc: "Writing style, technical preferences, active projects and settings can carry over between sessions." },
        privacidad: { name: "Privacy First", desc: "Your memory is tied to your account only and is never shared with other users." },
        control: { name: "Full Control", desc: "You can review, edit or delete the stored information at any time." },
      },
    },
    models: { label: "Supported models", title: "Every model you use", subtitle: "Connect your own API key for each provider and pay them directly.", footnote: "+ Amazon Bedrock, Azure OpenAI, Replicate and any OpenAI-compatible endpoint" },
    test: {
      label: "Testimonials", title1: "People who no longer", title2: "start from scratch",
      subtitle: "Professionals and teams who stopped repeating their context to every model.",
      stats: ["Professionals worldwide", "Models supported", "Average rating", "Fee on your keys"],
      items: [
        { quote: "I switched from GPT to Claude mid-project and didn't lose any context. It's the first time an AI tool actually remembers me.", role: "Full-stack developer · freelance" },
        { quote: "I pay for my own API keys with no markup. For a small agency like ours, that's the difference between the numbers working or not.", role: "Founder · design studio" },
        { quote: "Having GPT, Claude and Gemini side by side — and merging them into a single answer — saves me hours. I stopped jumping between tabs.", role: "Product Manager · fintech" },
      ],
    },
    pricing: {
      label: "Pricing", title1: "Simple, transparent", title2: "pricing", subtitle: "You already pay for your API keys. OneChater should be affordable too.",
      monthly: "Monthly", annual: "Annual", soon: "Soon", redirecting: "Redirecting...", mostPopular: "Most popular", rated: "Rated 5 out of 5 stars",
      securePay: "Secure, encrypted payment", currencies: "Cancel anytime · Local currencies coming soon",
      plans: {
        free: { tagline: "To get started", period: "forever", description: "Start with zero friction. No credit card required.", cta: "Start free",
          features: ["Free-AI providers only (Groq, OpenRouter, Mistral, Gemini)", "Personal memory profile", "1 project", "Conversation history", "Community support"] },
        pro: { tagline: "For professionals", period: "/ mo", annualNote: "billed $144/year · 20% off", description: "For professionals who live in AI every day.", cta: "Try Pro",
          features: ["Every provider — bring any API key", "Unlimited memory profile", "Semantic history search", "Unlimited projects", "Cross-device sync", "Full spend dashboard", "Priority support"] },
        team: { tagline: "For teams", period: "/ user / mo", description: "For teams that want AI with shared context.", cta: "Coming soon",
          features: ["Everything in Pro", "Up to 10 members", "Shared prompt library", "Team memory", "SSO / SAML", "Dedicated Slack support"] },
      },
    },
    cta: { title1: "Ready to unify your", title2: "AI workflow?", subtitle: "Join thousands of professionals and freelancers who use OneChater to get the most out of every AI model — with one memory that connects them all.", startFree: "Start for free", seePricing: "See pricing", micro: "No credit card · Set up in 60 seconds · Cancel anytime" },
    footer: {
      tagline: "One memory. Every AI. Bring your keys, own your data.",
      groups: { Product: "Product", Resources: "Resources", Legal: "Legal", Community: "Community" },
      links: { features: "Features", how: "How it works", pricing: "Pricing", models: "Models", docs: "Documentation", api: "API reference", status: "Status", contact: "Contact", privacy: "Privacy policy", terms: "Terms of use", refunds: "Refund policy", discord: "Discord", twitter: "Twitter / X", reddit: "Reddit", newsletter: "Newsletter" },
      rights: "All rights reserved.", systems: "All systems operational", privacy: "Privacy", terms: "Terms", refunds: "Refunds",
    },
  },
  es: {
    nav: { features: "Funcionalidades", how: "Cómo funciona", memory: "Memoria", pricing: "Precios", signIn: "Iniciar sesión", startFree: "Empezar gratis", menu: "Menú", openMenu: "Abrir menú", closeMenu: "Cerrar menú", home: "Inicio de OneChater" },
    hero: {
      new: "Nuevo", badge: "Memoria persistente entre modelos",
      srH1: "OneChater — chat con IA: GPT, Claude y Gemini en un solo lugar, con una memoria persistente que te sigue en todos los modelos",
      line1: "Una memoria.", line2: "Todas las IAs.",
      subA: "La única app de chat con IA que no te olvida cuando cambiás de modelo.", subBold: " GPT, Claude y Gemini", subC: " en un solo lugar, con una memoria que viaja con vos.",
      startFree: "Empezar gratis", seeHow: "Ver cómo funciona",
      proWorldwide: "profesionales en todo el mundo", byok: "BYOK · 0% de comisión", worksWith: "Compatible con",
    },
    preview: { activeMemory: "Memoria activa:", chips: "Next.js · Cliente bancario · Respuestas cortas", userQ: "¿Cómo optimizo esta query de Postgres?", sent: "Enviado a 3 modelos", now: "Hace un momento", gpt: "Agregá un índice compuesto en", gptB: "y usá EXPLAIN ANALYZE para verificar...", claude: "Con pgvector en tu Supabase podés usar índices", claudeB: "para búsquedas más eficientes...", full: "Respuesta completa →", gen: "Generando respuesta...", ask: "Preguntale a todos los modelos a la vez...", send: "Enviar mensaje" },
    feat: {
      label: "Funcionalidades", title: "Nunca más empezar de cero",
      subtitle: "Cada vez que cambiás de modelo, perdés contexto. OneChater lo recuerda todo, en todos los modelos, para siempre.",
      items: {
        memory: { name: "Memoria viva", badge: "Diferenciador", long: "El único sistema de memoria que funciona entre todos tus modelos. Captura proyectos, stack, decisiones y tono automáticamente.",
          bullets: [["Captura automática", "Stack y decisiones, sin esfuerzo."], ["Perfil editable", "Agregás, editás y borrás qué sabe de vos."], ["Búsqueda semántica", "Respuesta exacta en segundos."], ["Portable", "Todos los modelos te conocen igual."]] },
        multi: { name: "Chat multi-modelo", long: "Escribí una vez y recibí respuestas en paralelo de GPT, Claude y Gemini. Comparalas lado a lado y quedate con la mejor.",
          bullets: [["Streaming paralelo", "Tres respuestas a la vez."], ["Vista comparativa", "Diferencias resaltadas al toque."], ["Modelos a elección", "Activá o desactivá por chat."], ["Fork de respuesta", "Tomá la mejor y seguí."]] },
        byok: { name: "Tus propias API keys", long: "Pegá tus keys de OpenAI, Anthropic y Google. Se guardan solo en tu navegador, nunca en nuestros servidores. Sin markup, sin intermediarios.",
          bullets: [["Solo en tu navegador", "Keys guardadas localmente, nunca en el servidor."], ["Setup en 30s", "Pegá y listo, sin OAuth."], ["Rotación fácil", "Cambiá o borrá cuando quieras."], ["Multi-proveedor", "OpenAI, Anthropic, Google y más."]] },
        projects: { name: "Proyectos aislados", long: "Separá contextos por proyecto. Cada uno con su propia memoria, historial y configuración. Sin contaminación entre clientes.",
          bullets: [["Memoria aislada", "Sin mezcla entre clientes."], ["Keys por proyecto", "Asigná API keys distintas."], ["Búsqueda scoped", "Filtrá por proyecto activo."], ["Config custom", "Modelo y tono por proyecto."]] },
        spend: { name: "Dashboard de gasto", long: "Visualizá el gasto por modelo, por proyecto, por día. Poné límites y dormí tranquilo sabiendo que no te van a cobrar de más.",
          bullets: [["Tracking en vivo", "Cada request al toque."], ["Límites configurables", "Cortá al llegar al techo."], ["Breakdown profundo", "Por modelo, proyecto o día."], ["Alertas inteligentes", "Aviso si algo se dispara."]] },
      },
    },
    how: {
      label: "Cómo funciona", title1: "Funcionando en", title2: "60 segundos",
      subtitle: "Sin setup complicado. Sin suscripciones que gestionar. Pegás tus keys y empezás.", step: "Paso",
      steps: {
        s1: { eyebrow: "Setup", title: "Conectá tus API keys", desc: "Pegá tus keys de OpenAI, Anthropic o Google. Se guardan solo en tu navegador, nunca en nuestros servidores. Configuración única, para siempre.", tags: ["OpenAI", "Anthropic", "Google", "Solo local"] },
        s2: { eyebrow: "Chat", title: "Chateá con todos los modelos", desc: "Escribí una vez, recibí respuestas de GPT, Claude y Gemini en tiempo real lado a lado. Comparalos y elegí el mejor.", tags: ["Streaming en tiempo real", "Vista comparativa", "Sin fricción"] },
        s3: { eyebrow: "Memoria", title: "La memoria aprende con vos", desc: "Después de cada chat, OneChater extrae lo relevante: proyectos, preferencias, decisiones. La próxima vez, todos los modelos ya te conocen.", tags: ["Captura automática", "Perfil editable", "Portable entre modelos"] },
      },
    },
    mem: {
      label: "Memoria por usuario", premium: "Premium", title1: "Nunca vuelvas a repetir", title2: "información a tu IA",
      subtitle: "OneChater construye una memoria privada para cada usuario, permitiendo que tus asistentes recuerden preferencias, proyectos, objetivos y contexto a largo plazo.",
      user: "Usuario", account: "Tu cuenta", personal: "Memoria Personal", encrypted: "Privada y cifrada",
      caption: "Una única memoria compartida entre todos tus modelos de IA para mantener el contexto de forma consistente.",
      noteTitle: "Vos tenés el control", noteBody: "Los usuarios mantienen el control total sobre su información. La memoria existe para mejorar la experiencia y puede gestionarse desde el panel de configuración.",
      cards: {
        personal: { name: "Memoria Personal", desc: "Cada usuario dispone de una memoria independiente. La información se almacena únicamente para mejorar la calidad de sus conversaciones." },
        contexto: { name: "Contexto Continuo", desc: "Cambiá entre GPT, Claude, Gemini u otros modelos sin perder información importante sobre vos o tus proyectos." },
        aprendizaje: { name: "Aprendizaje Progresivo", desc: "OneChater puede recordar datos relevantes compartidos en conversaciones anteriores para ofrecer respuestas más consistentes y personalizadas." },
        preferencias: { name: "Preferencias Persistentes", desc: "Estilo de escritura, preferencias técnicas, proyectos activos y configuraciones pueden mantenerse entre sesiones." },
        privacidad: { name: "Privacidad Primero", desc: "Tu memoria está asociada únicamente a tu cuenta y no se comparte con otros usuarios." },
        control: { name: "Control Total", desc: "Podés revisar, editar o eliminar la información almacenada en cualquier momento." },
      },
    },
    models: { label: "Modelos soportados", title: "Todos los modelos que usás", subtitle: "Conectá tu propia API key de cada proveedor y pagá directo a ellos.", footnote: "+ Amazon Bedrock, Azure OpenAI, Replicate y cualquier endpoint compatible con OpenAI" },
    test: {
      label: "Testimonios", title1: "Quienes ya no", title2: "empiezan de cero",
      subtitle: "Profesionales y equipos que dejaron de repetir su contexto en cada modelo.",
      stats: ["Profesionales en todo el mundo", "Modelos soportados", "Rating promedio", "Comisión sobre tus keys"],
      items: [
        { quote: "Cambié de GPT a Claude a mitad de proyecto y no perdí nada de contexto. Es la primera vez que una herramienta de IA realmente me recuerda.", role: "Desarrolladora full-stack · freelance" },
        { quote: "Pago mis propias API keys sin markup. Para una agencia chica como la nuestra, eso es la diferencia entre cerrar los números o no.", role: "Founder · estudio de diseño" },
        { quote: "Tener GPT, Claude y Gemini lado a lado, y que se fusionen en una sola respuesta, me ahorra horas. Dejé de saltar entre pestañas.", role: "Product Manager · fintech" },
      ],
    },
    pricing: {
      label: "Precios", title1: "Precios simples y", title2: "transparentes", subtitle: "Ya pagás tus API keys. OneChater tiene que ser accesible también.",
      monthly: "Mensual", annual: "Anual", soon: "Pronto", redirecting: "Redirigiendo...", mostPopular: "Más popular", rated: "Calificación 5 de 5 estrellas",
      securePay: "Pago seguro con encriptación", currencies: "Cancelá cuando quieras · Monedas locales próximamente",
      plans: {
        free: { tagline: "Para arrancar", period: "para siempre", description: "Para empezar sin fricción. Sin tarjeta de crédito.", cta: "Empezar gratis",
          features: ["Solo proveedores de IA gratis (Groq, OpenRouter, Mistral, Gemini)", "Perfil de memoria personal", "1 proyecto", "Historial de conversaciones", "Soporte por comunidad"] },
        pro: { tagline: "Para profesionales", period: "/ mes", annualNote: "facturado $144/año · 20% off", description: "Para profesionales que viven en la IA todos los días.", cta: "Probar Pro",
          features: ["Todos los proveedores — traé cualquier API key", "Memoria ilimitada", "Búsqueda semántica del historial", "Proyectos ilimitados", "Sync entre dispositivos", "Dashboard de gasto completo", "Soporte prioritario"] },
        team: { tagline: "Para equipos", period: "/ usuario / mes", description: "Para equipos que quieren IA con contexto compartido.", cta: "Próximamente",
          features: ["Todo lo de Pro", "Hasta 10 integrantes", "Biblioteca de prompts compartida", "Memoria de equipo", "SSO / SAML", "Soporte dedicado por Slack"] },
      },
    },
    cta: { title1: "¿Listo para unificar tu", title2: "flujo de trabajo con IA?", subtitle: "Unite a miles de profesionales y freelancers que usan OneChater para aprovechar al máximo cada modelo de IA, con una memoria que los conecta a todos.", startFree: "Empezar gratis", seePricing: "Ver precios", micro: "Sin tarjeta de crédito · Listo en 60 segundos · Cancelá cuando quieras" },
    footer: {
      tagline: "Una memoria. Todas las IAs. Traé tus keys, controlá tus datos.",
      groups: { Product: "Producto", Resources: "Recursos", Legal: "Legal", Community: "Comunidad" },
      links: { features: "Funcionalidades", how: "Cómo funciona", pricing: "Precios", models: "Modelos", docs: "Documentación", api: "Referencia API", status: "Estado", contact: "Contacto", privacy: "Política de privacidad", terms: "Términos de uso", refunds: "Política de reembolsos", discord: "Discord", twitter: "Twitter / X", reddit: "Reddit", newsletter: "Newsletter" },
      rights: "Todos los derechos reservados.", systems: "Todos los sistemas operativos", privacy: "Privacidad", terms: "Términos", refunds: "Reembolsos",
    },
  },
};

// â"€â"€â"€ OneChat Logo Components â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function OneChatIsotipo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className={className}>
      <path d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="#0E0F12" />
      <path d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="#0E0F12" />
      <path d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="#0E0F12" />
    </svg>
  );
}

function OneChatLogoFull({ className = "h-8" }: { className?: string }) {
  return (
    <>
      <Image
        src="/OneChater-35-blobs/svg/horizontal-light.svg"
        alt="OneChater"
        height={44}
        width={220}
        className={`${className} logo-dark-hidden`}
        priority
      />
      <Image
        src="/OneChater-35-blobs/svg/horizontal-dark.svg"
        alt="OneChater"
        height={44}
        width={220}
        className={`${className} logo-dark-only`}
        aria-hidden="true"
        priority
      />
    </>
  );
}

// â"€â"€â"€ SVG Icons â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

// Brand blob icons - inspired by 3-blob OneChat logo
// All use organic Q-curves, filled (no strokes), to match logo language

function IconBrain() {
  // Literal mini-logo: 3 memory blobs in triangle = memoria viva
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" />
      <path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" />
      <path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" />
    </svg>
  );
}

function IconKey() {
  // Blob bow + shaft with two teeth
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M8 4Q3.5 5 3.5 9Q4 13.5 8.5 13.5Q13 13 12.5 8.5Q12 4.5 8 4ZM8 7.5Q6.5 7.7 6.5 9.2Q6.8 10.8 8.2 10.7Q9.7 10.5 9.5 9Q9.3 7.5 8 7.5Z" />
      <path d="M12 10.5Q12.3 11.5 13 12L21 20Q21.6 20.6 20 22Q18.4 23.4 17.8 22.8L17 22L18 21L17 20L16 21L15 20L16.5 18.5L13 15Q12 14 11 14Z" />
    </svg>
  );
}

function IconMessages() {
  // 3 chat blobs - one big with tail + two smaller stacked
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M4 4Q2 4.3 2 6.5V11.5Q2 13.5 4 13.8H6L5 16.5L9 13.8H13Q15 13.5 15 11.5V6.5Q15 4.3 13 4Z" />
      <path d="M17 9Q15.5 9.2 15.5 10.8Q15.5 11.2 15.5 11.6Q15.5 15 17 15.2H19L18 17L21 15.2H21.5Q23 15 23 13.5V10.8Q23 9.2 21.5 9Z" />
    </svg>
  );
}

function IconFolder() {
  // Blob folder with rounded organic tab
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M3 6Q2 6 2 7.5V9H22Q22 7.5 21 7.5H12L10.5 5.5Q10 5 9 5H4Q3 5 3 6Z" />
      <path d="M2 10.5V18.5Q2 20.5 4 20.5H20Q22 20.5 22 18.5V10.5Z" />
    </svg>
  );
}

function IconBarChart() {
  // 3 blob bars in triangle composition - varying heights
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <rect x="3" y="13" width="5" height="8" rx="2.2" />
      <rect x="9.5" y="7" width="5" height="14" rx="2.2" />
      <rect x="16" y="3" width="5" height="18" rx="2.2" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconShuffle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2c-4 2.5-4 17.5 0 20" />
      <path d="M12 2c4 2.5 4 17.5 0 20" />
    </svg>
  );
}

// â"€â"€â"€ Model Logos â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function OpenAILogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.843-3.369 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.677a.79.79 0 0 0-.402-.677zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function AnthropicLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MistralLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-orange-400">
      <rect x="0" y="0" width="7" height="7" rx="1" />
      <rect x="17" y="0" width="7" height="7" rx="1" />
      <rect x="8.5" y="0" width="7" height="7" rx="1" />
      <rect x="0" y="8.5" width="7" height="7" rx="1" />
      <rect x="17" y="8.5" width="7" height="7" rx="1" />
      <rect x="0" y="17" width="7" height="7" rx="1" />
      <rect x="8.5" y="17" width="7" height="7" rx="1" />
      <rect x="17" y="17" width="7" height="7" rx="1" />
    </svg>
  );
}

function MetaLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-blue-400">
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 2.92 1.22 1.978 0 3.262-1.081 4.069-2.753C23.88 17.085 24 15.8 24 14.449c0-2.6-.76-5.37-1.904-7.233-1.198-1.946-2.936-3.186-4.96-3.186-1.338 0-2.493.73-3.444 1.72C12.845 4.514 12 5.777 11.044 7.7c-.807-1.685-1.573-2.83-2.408-3.627C7.703 3.303 6.93 4.03 6.915 4.03z" />
    </svg>
  );
}

function GroqLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-green-400">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function XAILogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DeepSeekLogo() {
  return (
    <svg viewBox="0 0 100 100" className="w-7 h-7" fill="none">
      <circle cx="50" cy="50" r="48" fill="#4462F5"/>
      <circle cx="50" cy="50" r="26" fill="white"/>
      <circle cx="50" cy="50" r="13" fill="#4462F5"/>
    </svg>
  );
}

function CohereLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#39D3C3" strokeWidth="2"/>
      <circle cx="12" cy="12" r="5" fill="#39D3C3" opacity="0.5"/>
      <circle cx="12" cy="12" r="2.5" fill="#39D3C3"/>
    </svg>
  );
}

function PerplexityLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <path d="M12 3L21 8.5V15.5L12 21L3 15.5V8.5L12 3Z" stroke="#1CB0F6" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 3V21" stroke="#1CB0F6" strokeWidth="1.5"/>
      <path d="M3 8.5L21 15.5M21 8.5L3 15.5" stroke="#1CB0F6" strokeWidth="1" opacity="0.5"/>
    </svg>
  );
}

// â"€â"€â"€ Navbar â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const t = useT(LP);

  type NavItem = { label: string; sectionId: string };

  const navItems: NavItem[] = [
    { label: t.nav.features, sectionId: "features" },
    { label: t.nav.how,      sectionId: "how-it-works" },
    { label: t.nav.memory,   sectionId: "memoria" },
    { label: t.nav.pricing,  sectionId: "pricing" },
  ];

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const close = () => setMobileOpen(false);

  // Smooth-scroll to a section. We intentionally do NOT push a slug into the
  // URL — the path stays "/" so a page refresh always lands on the home top.
  const scrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <nav className="nav-enter absolute top-0 left-0 right-0 z-50" style={{ background: "transparent" }}>
        <div className="w-full max-w-[1600px] mx-auto px-5 md:px-10 lg:px-16 h-[72px] flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center cursor-pointer group" aria-label={t.nav.home}>
            <div className="transition-all duration-300 group-hover:opacity-80 group-hover:scale-[1.02]">
              <OneChatLogoFull className="h-8 md:h-9 w-auto" />
            </div>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.sectionId}
                onClick={() => scrollTo(item.sectionId)}
                className="nav-item-link px-3.5 py-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 rounded-full hover:bg-black/[0.05] transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              >
                {item.label}
              </button>
            ))}
            <span className="nav-separator mx-2 h-5 w-px bg-gradient-to-b from-transparent via-black/15 to-transparent" />
            <LangToggle className="!h-8" />
            <ThemeToggle className="!w-8 !h-8" />
            {session?.user ? (
              <UserMenu />
            ) : (
              <>
                <a href="/login" className="px-3.5 py-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 rounded-full hover:bg-black/[0.05] transition-all cursor-pointer">
                  {t.nav.signIn}
                </a>
                <a href="/login" className="ml-1 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold text-white transition-all duration-200 cursor-pointer hover:-translate-y-px"
                  style={{ background: "linear-gradient(180deg, #1F2025 0%, #0E0F12 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.4), 0 1px 2px rgba(14,15,18,0.2), 0 6px 18px -6px rgba(14,15,18,0.35)" }}>
                  {t.nav.startFree} <IconArrowRight />
                </a>
              </>
            )}
          </div>

          {/* Mobile right: lang + theme + open */}
          <div className="md:hidden flex items-center gap-2">
            <LangToggle className="!h-8" />
            <ThemeToggle className="!w-8 !h-8" />
            <button
              onClick={() => setMobileOpen(true)}
              aria-label={t.nav.openMenu}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-4 h-4">
                <path d="M3 12h18M3 6h18M3 18h12" />
              </svg>
              {t.nav.menu}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[199] md:hidden bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Fullscreen mobile overlay ── */}
      <div className={`nav-overlay md:hidden${mobileOpen ? " open" : ""}`} aria-hidden={!mobileOpen}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 h-[72px] border-b" style={{ borderColor: "var(--border)" }}>
          <OneChatLogoFull className="h-8 w-auto" />
          <button
            onClick={close}
            aria-label={t.nav.closeMenu}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer"
            style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="px-5 mt-2">
          {navItems.map((item) => (
            <button
              key={item.sectionId}
              onClick={() => { scrollTo(item.sectionId); close(); }}
              className="nav-overlay-link w-full text-left"
            >
              <span className="inline-flex items-center gap-2">{item.label}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-30">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </nav>

        {/* Bottom CTAs */}
        <div className="px-5 mt-8 flex flex-col gap-3">
          <a href="/login" className="btn-primary text-[15px] py-3.5 justify-center">
            {t.nav.startFree} <IconArrowRight />
          </a>
          <a href="/login" className="text-center text-sm py-2.5 font-medium rounded-xl transition-all"
            style={{ color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {t.nav.signIn}
          </a>
        </div>
      </div>
    </>
  );
}

// â"€â"€â"€ Hero Chat Preview â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function ChatPreview() {
  const t = useT(LP).preview;
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div
        className="rounded-2xl overflow-hidden border border-black/10"
        style={{
          background: "var(--surface)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 0 0 1px var(--border)",
        }}
      >
        {/* Titlebar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/8 bg-gray-50/80">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-lg shadow-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-lg shadow-yellow-500/20" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-lg shadow-green-500/20" />
          </div>
          <div className="flex-1 mx-4">
            <div className="w-40 mx-auto h-6 rounded-lg bg-gray-100 border border-black/8 flex items-center justify-center">
              <span className="text-xs text-gray-500 font-mono">onechater.app/chat</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-300 border border-green-500/30 shadow-sm">GPT-5</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-300 border border-orange-500/30 shadow-sm">Claude</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-300 border border-blue-500/30 shadow-sm">Gemini</span>
          </div>
        </div>

        {/* Chat area */}
        <div className="p-5 space-y-5 min-h-[300px] bg-white">
          {/* Memory chip */}
          <div className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 border border-black/10 shadow-sm w-fit hover:border-black/20 transition-all cursor-default">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="text-xs text-gray-700 font-medium">{t.activeMemory}</span>
            <span className="text-xs text-gray-500">{t.chips}</span>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div className="group max-w-[75%] px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm text-white shadow-xl"
              style={{ background: "#0E0F12" }}>
              <p className="leading-relaxed font-medium">{t.userQ}</p>
              <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center gap-3 text-xs text-white/70">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  {t.sent}
                </span>
                <span className="opacity-50">·</span>
                <span>{t.now}</span>
              </div>
            </div>
          </div>

          {/* Three model responses */}
          <div className="grid grid-cols-3 gap-3">
            {/* GPT-5 */}
            <div className="group rounded-xl p-4 space-y-3 border border-black/8 bg-white hover:border-black/20 hover:shadow-md transition-all">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-100 border border-black/8 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  <OpenAILogo />
                </div>
                <span className="text-sm font-semibold text-gray-900">GPT-5</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t.gpt} <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">user_id, created_at</code> {t.gptB}
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-black/6">
                <span className="text-[10px] text-gray-400 font-medium">{t.full}</span>
              </div>
            </div>

            {/* Claude */}
            <div className="group rounded-xl p-4 space-y-3 border border-black/8 bg-white hover:border-black/20 hover:shadow-md transition-all">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-100 border border-black/8 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  <AnthropicLogo />
                </div>
                <span className="text-sm font-semibold text-gray-900">Claude</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t.claude} <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">HNSW</code> {t.claudeB}
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-black/6">
                <span className="text-[10px] text-gray-400 font-medium">{t.full}</span>
              </div>
            </div>

            {/* Gemini */}
            <div className="group rounded-xl p-4 space-y-3 border border-black/8 bg-white hover:border-black/20 hover:shadow-md transition-all">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-100 border border-black/8 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  <GoogleLogo />
                </div>
                <span className="text-sm font-semibold text-gray-900">Gemini</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
              </div>
              <div className="flex gap-1.5 items-center h-6">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-black/6">
                <span className="text-[10px] text-gray-400 font-medium">{t.gen}</span>
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="flex gap-2 items-center mt-4">
            <div className="flex-1 h-9 rounded-xl bg-gray-50 border border-black/10 flex items-center px-3">
              <span className="text-xs text-gray-400">{t.ask}</span>
            </div>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
              style={{ background: "#0E0F12" }}
              aria-label={t.send}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 rounded-full blur-3xl opacity-40"
        style={{ background: "linear-gradient(90deg, var(--border-soft), rgba(0,0,0,0.02))" }}
      />
    </div>
  );
}

// â"€â"€â"€ Features â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

// ── Feature showcase config ──────────────────────────────────────────

type FeatureAccent = {
  from: string;
  to: string;
  glow: string;
  text: string;
  ring: string;
  bar: string;
};

type FeatureDef = {
  id: string;
  n: string;
  name: string;
  short: string;
  badge?: string;
  long: string;
  icon: React.ReactNode;
  accent: FeatureAccent;
};

const FEATURES: FeatureDef[] = [
  {
    id: "memory",
    n: "01",
    name: "Living memory",
    short: "Context that's always on",
    badge: "Differentiator",
    long: "The only memory system that works across every model you use. It captures your projects, stack, decisions and tone automatically.",
    icon: <IconBrain />,
    accent: {
      from: "from-orange-500",
      to: "to-amber-500",
      glow: "rgba(249,115,22,0.45)",
      text: "text-orange-600",
      ring: "rgba(249,115,22,0.25)",
      bar: "from-orange-500 to-amber-400",
    },
  },
  {
    id: "multi",
    n: "02",
    name: "Multi-model chat",
    short: "One message, 3 answers",
    long: "Write once and get answers from GPT, Claude and Gemini in parallel. Compare them side by side and keep the best.",
    icon: <IconMessages />,
    accent: {
      from: "from-blue-500",
      to: "to-cyan-500",
      glow: "rgba(59,130,246,0.45)",
      text: "text-blue-600",
      ring: "rgba(59,130,246,0.25)",
      bar: "from-blue-500 to-cyan-400",
    },
  },
  {
    id: "byok",
    n: "03",
    name: "Your own API keys",
    short: "0% fee, pay providers direct",
    long: "Paste your OpenAI, Anthropic and Google keys. They're stored only in your browser, never on our servers. No markup, no middlemen.",
    icon: <IconKey />,
    accent: {
      from: "from-violet-500",
      to: "to-purple-600",
      glow: "rgba(139,92,246,0.45)",
      text: "text-violet-600",
      ring: "rgba(139,92,246,0.25)",
      bar: "from-violet-500 to-purple-500",
    },
  },
  {
    id: "projects",
    n: "04",
    name: "Isolated projects",
    short: "Every client, its own space",
    long: "Separate contexts by project. Each one with its own memory, history and configuration. No cross-contamination between clients.",
    icon: <IconFolder />,
    accent: {
      from: "from-green-500",
      to: "to-emerald-600",
      glow: "rgba(34,197,94,0.45)",
      text: "text-emerald-600",
      ring: "rgba(34,197,94,0.25)",
      bar: "from-emerald-500 to-green-400",
    },
  },
  {
    id: "spend",
    n: "05",
    name: "Spend dashboard",
    short: "Know exactly what you spend",
    long: "Track spend by model, by project, by day. Set limits and rest easy knowing you'll never be overcharged.",
    icon: <IconBarChart />,
    accent: {
      from: "from-orange-400",
      to: "to-amber-500",
      glow: "rgba(245,158,11,0.45)",
      text: "text-amber-600",
      ring: "rgba(245,158,11,0.25)",
      bar: "from-orange-400 to-amber-400",
    },
  },
];

// Icons per feature card (order matches the bullets in the LP dictionary).
const FEATURE_BULLET_ICONS: Record<string, React.ReactNode[]> = {
  memory:   [<IconZap key="z" />, <IconPencil key="p" />, <IconSearch key="s" />, <IconShuffle key="h" />],
  multi:    [<IconZap key="z" />, <IconSearch key="s" />, <IconShuffle key="h" />, <IconPencil key="p" />],
  byok:     [<IconShield key="d" />, <IconZap key="z" />, <IconKey key="k" />, <IconShuffle key="h" />],
  projects: [<IconFolder key="f" />, <IconKey key="k" />, <IconSearch key="s" />, <IconPencil key="p" />],
  spend:    [<IconBarChart key="b" />, <IconShield key="d" />, <IconSearch key="s" />, <IconZap key="z" />],
};

type FeatureText = { name: string; long: string; badge?: string; bullets: string[][] };

// ── Static feature card (no inner interactivity) ────────────────────
function FeatureCard({ f, span }: { f: FeatureDef; span: boolean }) {
  const fi = (useT(LP).feat.items as Record<string, FeatureText>)[f.id];
  const icons = FEATURE_BULLET_ICONS[f.id] ?? [];
  const bullets = fi.bullets.map((b, i) => ({ icon: icons[i], label: b[0], desc: b[1] }));
  return (
    <div className={`feature-card relative rounded-2xl p-7 md:p-8 h-full overflow-hidden`}>
      {/* faint static corner accent */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-40"
        style={{ background: `radial-gradient(circle, ${f.accent.glow}, transparent 65%)`, filter: "blur(44px)" }}
      />
      <div className="relative">
        {/* header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.accent.from} ${f.accent.to} flex items-center justify-center text-white flex-shrink-0 ring-1 ring-white/40`}
            style={{ boxShadow: `0 10px 28px -6px ${f.accent.glow}, inset 0 1px 0 rgba(255,255,255,0.25)` }}
          >
            {f.icon}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-mono font-bold tracking-widest ${f.accent.text}`}>{f.n}</span>
            {fi.badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                {fi.badge}
              </span>
            )}
          </div>
        </div>

        <h3 className="display text-xl md:text-2xl font-semibold text-gray-900 tracking-tight leading-tight">{fi.name}</h3>
        <p className="hidden sm:block mt-3 text-gray-500 text-[14px] leading-relaxed text-pretty">{fi.long}</p>

        {/* capabilities — static list (enlarged on the wide span card) */}
        <div className={`grid ${span ? "mt-5 sm:mt-7 gap-x-6 gap-y-3 sm:gap-y-5 sm:grid-cols-2" : "mt-4 sm:mt-6 gap-x-5 gap-y-2.5 sm:gap-y-3.5 grid-cols-1"}`}>
          {bullets.map((b) => (
            <div key={b.label} className={`flex items-start ${span ? "gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl" : "gap-2 sm:gap-2.5"}`}
              style={span ? { background: "var(--overlay)", border: "1px solid var(--border-soft)" } : undefined}>
              <span
                className={`rounded-lg flex items-center justify-center flex-shrink-0 ${f.accent.text} ${
                  span ? "mt-0.5 w-8 h-8 sm:w-10 sm:h-10 [&_svg]:w-[16px] [&_svg]:h-[16px] sm:[&_svg]:w-[20px] sm:[&_svg]:h-[20px]" : "mt-0.5 w-6 h-6 [&_svg]:w-3.5 [&_svg]:h-3.5"
                }`}
                style={{ background: f.accent.ring }}
              >
                {b.icon}
              </span>
              <div className="min-w-0">
                <div className={`font-semibold text-gray-900 leading-snug ${span ? "text-[14px] sm:text-[15px]" : "text-[12.5px]"}`}>{b.label}</div>
                <div className={`hidden sm:block text-gray-500 leading-relaxed mt-0.5 ${span ? "text-[13px]" : "text-[11.5px]"}`}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* static bottom accent */}
        <div className={`${span ? "mt-7" : "mt-6"} h-1 w-12 rounded-full bg-gradient-to-r ${f.accent.bar} opacity-60`} />
      </div>
    </div>
  );
}

function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const tf = useT(LP).feat;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="relative py-10 md:py-14 px-5 md:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className={`text-center mb-8 md:mb-14 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">{tf.label}</span>
          <h2 className="display mt-4 md:mt-6 text-[1.75rem] sm:text-3xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.1] md:leading-[1.05] text-balance">
            {tf.title}
          </h2>
          <p className="hidden md:block mt-5 text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
            {tf.subtitle}
          </p>
        </div>

        {/* Bento grid — static cards, no inner interactivity.
            auto-rows-fr only from sm+ (where there are real columns); on a
            single-column mobile layout it would stretch every card to the
            tallest one's height, leaving dead space below the shorter cards. */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:auto-rows-fr">
          {FEATURES.map((f, i) => (
            <div
              key={f.id}
              className={`card-item${inView ? " in-view" : ""} ${f.id === "memory" ? "lg:col-span-2" : ""}`}
              style={inView ? { animationDelay: `${i * 90}ms` } : {}}
            >
              <FeatureCard f={f} span={f.id === "memory"} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// â"€â"€â"€ How It Works â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const steps = [
  {
    n: "01",
    eyebrow: "Setup",
    title: "Connect your API keys",
    description: "Paste your OpenAI, Anthropic or Google keys. They're stored only in your browser, never on our servers. Set it up once, forever.",
    tags: ["OpenAI", "Anthropic", "Google", "Local only"],
    gradient: "from-violet-500 to-purple-600",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    shadow: "rgba(139,92,246,0.4)",
    tone: "tone-violet",
    glow: "glow-violet",
    icon: <IconKey />,
  },
  {
    n: "02",
    eyebrow: "Chat",
    title: "Chat with every model",
    description: "Write once and get answers from GPT, Claude and Gemini in real time, side by side. Compare them and pick the best.",
    tags: ["Real-time streaming", "Compare view", "Zero friction"],
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    shadow: "rgba(59,130,246,0.4)",
    tone: "tone-blue",
    glow: "glow-blue",
    icon: <IconMessages />,
  },
  {
    n: "03",
    eyebrow: "Memory",
    title: "Memory learns as you go",
    description: "After every chat, OneChater extracts what matters: projects, preferences, decisions. Next time, every model already knows you.",
    tags: ["Automatic capture", "Editable profile", "Portable across models"],
    gradient: "from-orange-500 to-amber-500",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
    shadow: "rgba(249,115,22,0.4)",
    tone: "tone-orange",
    glow: "glow-orange",
    icon: <IconBrain />,
  },
];

function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const th = useT(LP).how;
  const stepsT = [th.steps.s1, th.steps.s2, th.steps.s3];

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-10 md:py-14 px-5 md:px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.04] rounded-full"
          style={{ background: "radial-gradient(ellipse, #6366f1, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className={`text-center mb-8 md:mb-14 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">{th.label}</span>
          <h2 className="display mt-4 md:mt-6 text-[1.75rem] sm:text-3xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.1] md:leading-[1.05] text-balance">
            {th.title1}{" "}
            <span className="gradient-text">{th.title2}</span>
          </h2>
          <p className="hidden md:block mt-5 text-gray-500 max-w-lg mx-auto text-lg leading-relaxed">
            {th.subtitle}
          </p>
        </div>

        <div className="relative">
          {/* Horizontal connector line (desktop) */}
          <div className="hidden md:block absolute top-[3.75rem] left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-[2px]">
            <div className="w-full h-full bg-gradient-to-r from-violet-300/40 via-blue-300/40 to-orange-300/40 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400/60 via-blue-400/60 to-orange-400/60 rounded-full blur-sm" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const st = stepsT[i];
              return (
              <div
                key={step.n}
                className={`step-card-premium group rounded-2xl p-8 card-item${inView ? " in-view" : ""}`}
                style={{
                  ...(inView ? { animationDelay: `${i * 180}ms` } : {}),
                }}
              >
                {/* Giant numeral background flourish */}
                <div className="absolute top-4 right-5 pointer-events-none select-none">
                  <span className={`step-numeral ${step.tone} text-[5.5rem] opacity-[0.10] group-hover:opacity-[0.18] transition-opacity duration-700`}>
                    {step.n}
                  </span>
                </div>

                {/* Icon + eyebrow row */}
                <div className="flex items-center gap-4 mb-7">
                  <div
                    className={`step-number w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center text-white flex-shrink-0 ring-1 ring-white/40`}
                    style={{ boxShadow: `0 10px 28px -4px ${step.shadow}, inset 0 1px 0 rgba(255,255,255,0.25)` }}
                  >
                    {step.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="eyebrow text-gray-400">{th.step} {step.n}</span>
                    <span className={`text-[11px] font-semibold ${step.tone === "tone-violet" ? "text-violet-600" : step.tone === "tone-blue" ? "text-blue-600" : "text-orange-600"}`}>{st.eyebrow}</span>
                  </div>
                </div>

                <h3 className="display text-lg md:text-xl font-semibold text-gray-900 tracking-tight mb-3 group-hover:text-gray-700 transition-colors">{st.title}</h3>
                <p className="hidden sm:block text-gray-500 leading-relaxed mb-6 text-[15px]">{st.desc}</p>

                <div className="flex flex-wrap gap-2">
                  {st.tags.map((tag) => (
                    <span key={tag} className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-600 font-medium border border-black/8 shadow-sm group-hover:border-black/16 group-hover:-translate-y-0.5 transition-all">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bottom gradient accent */}
                <div className={`mt-7 h-1 w-12 rounded-full bg-gradient-to-r ${step.gradient} opacity-50 group-hover:opacity-100 group-hover:w-24 transition-all duration-500`} />
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Memoria Persistente por Usuario -----------------------------------

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSync() {
  // Circular refresh arrows — contexto que se mantiene al cambiar de modelo
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function IconLayers() {
  // Capas que se acumulan — aprendizaje progresivo
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="m2 12 10 5 10-5" />
      <path d="m2 17 10 5 10-5" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

type MemoryCardDef = {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  glow: string;       // premium-card glow-* class (drives hover glow + dark mode)
  from: string;
  to: string;
  bar: string;        // bottom accent-bar gradient
  glowColor: string;  // icon tile shadow tint
};

const MEMORY_CARDS: MemoryCardDef[] = [
  {
    id: "personal",
    name: "Personal Memory",
    desc: "Every user gets an independent memory. Information is stored only to improve the quality of their conversations.",
    icon: <IconBrain />,
    glow: "glow-orange",
    from: "from-orange-500",
    to: "to-amber-500",
    bar: "from-orange-500 to-amber-400",
    glowColor: "rgba(249,115,22,0.5)",
  },
  {
    id: "contexto",
    name: "Continuous Context",
    desc: "Switch between GPT, Claude, Gemini or other models without losing important information about you or your projects.",
    icon: <IconSync />,
    glow: "glow-blue",
    from: "from-blue-500",
    to: "to-cyan-500",
    bar: "from-blue-500 to-cyan-400",
    glowColor: "rgba(59,130,246,0.5)",
  },
  {
    id: "aprendizaje",
    name: "Progressive Learning",
    desc: "OneChater can remember relevant details shared in earlier conversations to deliver more consistent, personalized answers.",
    icon: <IconLayers />,
    glow: "glow-violet",
    from: "from-violet-500",
    to: "to-purple-600",
    bar: "from-violet-500 to-purple-500",
    glowColor: "rgba(139,92,246,0.5)",
  },
  {
    id: "preferencias",
    name: "Persistent Preferences",
    desc: "Writing style, technical preferences, active projects and settings can carry over between sessions.",
    icon: <IconTarget />,
    glow: "glow-green",
    from: "from-green-500",
    to: "to-emerald-600",
    bar: "from-emerald-500 to-green-400",
    glowColor: "rgba(34,197,94,0.5)",
  },
  {
    id: "privacidad",
    name: "Privacy First",
    desc: "Your memory is tied to your account only and is never shared with other users.",
    icon: <IconShield />,
    glow: "glow-indigo",
    from: "from-indigo-500",
    to: "to-blue-600",
    bar: "from-indigo-500 to-blue-500",
    glowColor: "rgba(99,102,241,0.5)",
  },
  {
    id: "control",
    name: "Full Control",
    desc: "You can review, edit or delete the stored information at any time.",
    icon: <IconGear />,
    glow: "glow-cyan",
    from: "from-cyan-500",
    to: "to-teal-500",
    bar: "from-cyan-500 to-teal-400",
    glowColor: "rgba(6,182,212,0.5)",
  },
];

// Responsive connector: horizontal arrow on desktop, vertical on mobile.
function MemoryFlowArrow() {
  return (
    <div className="flex items-center justify-center text-gray-300 md:px-1" aria-hidden="true">
      <svg className="hidden md:block" width="48" height="24" viewBox="0 0 48 24" fill="none">
        <path className="flow-path" d="M2 12 H39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M35 6 L43 12 L35 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg className="block md:hidden my-1" width="24" height="40" viewBox="0 0 24 40" fill="none">
        <path className="flow-path" d="M12 2 V31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 27 L12 35 L18 27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function MemorySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const tm = useT(LP).mem;
  const cardsT = tm.cards as Record<string, { name: string; desc: string }>;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="memoria" className="relative py-10 md:py-14 px-5 md:px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[820px] h-[440px] opacity-[0.04] rounded-full"
          style={{ background: "radial-gradient(ellipse, #f97316, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className={`text-center mb-8 md:mb-14 card-item${inView ? " in-view" : ""}`}>
          <div className="inline-flex items-center gap-2">
            <span className="section-label">{tm.label}</span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)", boxShadow: "0 6px 16px -6px rgba(139,92,246,0.6), inset 0 1px 0 rgba(255,255,255,0.3)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
              </svg>
              {tm.premium}
            </span>
          </div>
          <h2 className="display mt-4 md:mt-6 text-[1.75rem] sm:text-3xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.1] md:leading-[1.05] text-balance">
            {tm.title1}{" "}
            <span className="gradient-text">{tm.title2}</span>
          </h2>
          <p className="hidden md:block mt-5 text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
            {tm.subtitle}
          </p>
        </div>

        {/* Conceptual visualization: Usuario → Memoria Personal → GPT / Claude / Gemini */}
        <div
          className={`relative rounded-[28px] p-6 md:p-12 surface-light overflow-hidden card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "80ms" } : {}}
        >
          {/* dot grid backdrop */}
          <div className="absolute inset-0 opacity-[0.5] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(var(--border-strong) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 75%)",
            }} />

          <div className="relative flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3">
            {/* Usuario */}
            <div className="rounded-3xl px-6 py-5 text-center w-[150px] flex-shrink-0"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
              <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                <IconUser />
              </div>
              <div className="mt-3 text-sm font-semibold text-gray-900">{tm.user}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{tm.account}</div>
            </div>

            <MemoryFlowArrow />

            {/* Memoria Personal (hub) */}
            <div className="relative flex-shrink-0">
              <div aria-hidden="true" className="memory-hub-pulse absolute -inset-3 rounded-[32px]"
                style={{ background: "radial-gradient(circle, rgba(249,115,22,0.28), transparent 70%)", zIndex: 0 }} />
              <div className="relative rounded-3xl px-6 py-6 text-center w-[210px]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-mid)", zIndex: 1 }}>
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white ring-1 ring-white/40"
                  style={{ boxShadow: "0 10px 28px -6px rgba(249,115,22,0.5), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
                  <IconBrain />
                </div>
                <div className="mt-3.5 text-[15px] font-semibold text-gray-900">{tm.personal}</div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {tm.encrypted}
                </div>
              </div>
            </div>

            <MemoryFlowArrow />

            {/* Modelos */}
            <div className="flex flex-col gap-2.5 flex-shrink-0">
              {[
                { name: "GPT", logo: <OpenAILogo /> },
                { name: "Claude", logo: <AnthropicLogo /> },
                { name: "Gemini", logo: <GoogleLogo /> },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 w-[180px]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    {m.logo}
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">{m.name}</span>
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Caption */}
          <p className="relative mt-8 md:mt-10 text-center text-[14px] md:text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed text-pretty">
            {tm.caption}
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12 md:mt-16">
          {MEMORY_CARDS.map((c, i) => (
            <div
              key={c.id}
              className={`premium-card ${c.glow} rounded-2xl p-7 card-item${inView ? " in-view" : ""}`}
              style={inView ? { animationDelay: `${120 + i * 80}ms` } : {}}
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center text-white ring-1 ring-white/40`}
                style={{ boxShadow: `0 10px 28px -6px ${c.glowColor}, inset 0 1px 0 rgba(255,255,255,0.25)` }}
              >
                {c.icon}
              </div>
              <h3 className="display mt-5 text-lg md:text-xl font-semibold text-gray-900 tracking-tight leading-tight">{cardsT[c.id].name}</h3>
              <p className="mt-2.5 text-[14px] text-gray-500 leading-relaxed text-pretty">{cardsT[c.id].desc}</p>
              <div className={`accent-bar bg-gradient-to-r ${c.bar}`} />
            </div>
          ))}
        </div>

        {/* Important note */}
        <div className={`mt-12 md:mt-16 card-item${inView ? " in-view" : ""}`} style={inView ? { animationDelay: "200ms" } : {}}>
          <div className="relative rounded-2xl p-6 md:p-7 flex items-start gap-4 surface-light overflow-hidden">
            <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-40"
              style={{ background: "radial-gradient(circle, rgba(99,102,241,0.35), transparent 65%)", filter: "blur(44px)" }} />
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white flex-shrink-0 ring-1 ring-white/40"
              style={{ boxShadow: "0 8px 22px -6px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
              <IconShield />
            </div>
            <div className="relative">
              <div className="text-[15px] font-semibold text-gray-900">{tm.noteTitle}</div>
              <p className="mt-1.5 text-[14px] text-gray-500 leading-relaxed text-pretty">
                {tm.noteBody}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// â"€â"€â"€ Models Section â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

type ModelCard = {
  name: string;
  provider: string;
  tag?: string;
  logo: React.ReactNode;
  accent: string;
};

const supportedModels: ModelCard[] = [
  { name: "GPT-5.5",           provider: "OpenAI",    tag: "Flagship",   logo: <OpenAILogo />,    accent: "#10b981" },
  { name: "GPT-5.4 mini",      provider: "OpenAI",    tag: "Fast",       logo: <OpenAILogo />,    accent: "#10b981" },
  { name: "Claude Opus 4.8",   provider: "Anthropic", tag: "Deep",       logo: <AnthropicLogo />, accent: "#f97316" },
  { name: "Claude Sonnet 4.6", provider: "Anthropic", tag: "Reasoning",  logo: <AnthropicLogo />, accent: "#f97316" },
  { name: "Claude Haiku 4.5",  provider: "Anthropic", tag: "Light",      logo: <AnthropicLogo />, accent: "#f97316" },
  { name: "Gemini 3 Pro",      provider: "Google",    tag: "Advanced",   logo: <GoogleLogo />,    accent: "#3b82f6" },
  { name: "Gemini 2.5 Flash",  provider: "Google",    tag: "Multimodal", logo: <GoogleLogo />,    accent: "#3b82f6" },
  { name: "Grok 4.3",          provider: "xAI",       tag: "Realtime",   logo: <XAILogo />,       accent: "#111111" },
  { name: "Grok 4",            provider: "xAI",       tag: "Powerful",   logo: <XAILogo />,       accent: "#111111" },
  { name: "Llama 3.3 70B",     provider: "Groq",      tag: "Ultra fast", logo: <GroqLogo />,      accent: "#f55036" },
  { name: "Llama 3.1 8B",      provider: "Groq",      tag: "Instant",    logo: <GroqLogo />,      accent: "#f55036" },
  { name: "GPT-OSS 120B",      provider: "Groq",      tag: "Open",       logo: <GroqLogo />,      accent: "#f55036" },
  { name: "Mistral Large 3",   provider: "Mistral",   tag: "Top tier",   logo: <MistralLogo />,   accent: "#ff7000" },
  { name: "Mistral Medium 3.5", provider: "Mistral",  tag: "Balanced",   logo: <MistralLogo />,   accent: "#ff7000" },
  { name: "Codestral",         provider: "Mistral",   tag: "Code",       logo: <MistralLogo />,   accent: "#ff7000" },
  { name: "DeepSeek V4",       provider: "DeepSeek",  tag: "Open",       logo: <DeepSeekLogo />,  accent: "#4462F5" },
  { name: "DeepSeek V4 Reasoner", provider: "DeepSeek", tag: "Reasoning", logo: <DeepSeekLogo />, accent: "#4462F5" },
  { name: "OpenRouter",        provider: "Gateway",   tag: "300+ models", logo: <PerplexityLogo />, accent: "#8b5cf6" },
];

function ModelCardItem({ m }: { m: ModelCard }) {
  return (
    <div
      className="group shrink-0 mx-2 w-[260px] rounded-2xl border border-black/8 bg-white px-4 py-3.5 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-black/16 hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.18)]"
    >
      <div
        className="w-11 h-11 rounded-xl bg-gray-50 border border-black/8 flex items-center justify-center shrink-0 transition-all"
        style={{ boxShadow: `inset 0 0 0 1px ${m.accent}10` }}
      >
        {m.logo}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-gray-900 truncate leading-tight">{m.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-gray-400 font-medium">{m.provider}</span>
          {m.tag && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: m.accent }}
              >
                {m.tag}
              </span>
            </>
          )}
        </div>
      </div>
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
    </div>
  );
}

function ModelsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const tmo = useT(LP).models;
  const half = Math.ceil(supportedModels.length / 2);
  const rowA = supportedModels.slice(0, half);
  const rowB = supportedModels.slice(half);

  return (
    <section ref={sectionRef} id="models" className="relative py-10 md:py-14 px-5 md:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <div className={`text-center mb-10 md:mb-14 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">{tmo.label}</span>
          <h2 className="display mt-6 text-[1.75rem] sm:text-3xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.1] md:leading-[1.05] text-balance">
            {tmo.title}
          </h2>
          <p className="hidden md:block mt-5 text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
            {tmo.subtitle}
          </p>
        </div>

        <div className={`space-y-6 card-item${inView ? " in-view" : ""}`}>
          <div className="marquee-wrap marquee-mask overflow-hidden">
            <div className="marquee-track py-1">
              {[...rowA, ...rowA].map((m, i) => <ModelCardItem key={`a-${i}`} m={m} />)}
            </div>
          </div>
          <div className="marquee-wrap marquee-mask overflow-hidden">
            <div className="marquee-track reverse slow py-1">
              {[...rowB, ...rowB].map((m, i) => <ModelCardItem key={`b-${i}`} m={m} />)}
            </div>
          </div>
        </div>

        <p className={`text-center text-gray-400 text-sm mt-10 card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "300ms" } : {}}>
          {tmo.footnote}
        </p>

      </div>
    </section>
  );
}

// ━━━ Pricing ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Plan = {
  name: string; tagline: string; price: string; period: string; description: string;
  features: string[]; cta: string; highlighted: boolean;
  gradient: string; accentBar: string; iconBg: string; icon: React.ReactNode;
  annual?: { price: string; period: string; note: string }; comingSoon?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    tagline: "To get started",
    price: "$0",
    period: "forever",
    description: "Start with zero friction. No credit card required.",
    features: [
      "Free-AI providers only (Groq, OpenRouter, Mistral, Gemini)",
      "Personal memory profile",
      "1 project",
      "Conversation history",
      "Community support",
    ],
    cta: "Start free",
    highlighted: false,
    gradient: "from-gray-500 to-gray-600",
    accentBar: "from-gray-300 to-gray-400",
    iconBg: "bg-gradient-to-br from-gray-700 to-gray-900",
    icon: (
      // Single blob — el comienzo, una sola memoria
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11 4Q5 5.5 5 11Q5.5 18 12 18Q19 17.5 19 11Q18.5 5 11 4Z" />
      </svg>
    ),
  },
  {
    name: "Pro",
    tagline: "For professionals",
    price: "$15",
    period: "/ mo",
    annual: { price: "$12", period: "/ mo", note: "billed $144/year · 20% off" },
    description: "For professionals who live in AI every day.",
    features: [
      "Every provider — bring any API key",
      "Unlimited memory profile",
      "Semantic history search",
      "Unlimited projects",
      "Cross-device sync",
      "Full spend dashboard",
      "Priority support",
    ],
    cta: "Try Pro",
    highlighted: true,
    gradient: "from-indigo-500 via-purple-500 to-violet-500",
    accentBar: "from-indigo-500 via-purple-500 to-violet-500",
    iconBg: "bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500",
    icon: (
      // Logo OneChat literal - 3 blobs = el plan emblema
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" />
        <path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" />
        <path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" />
      </svg>
    ),
  },
  {
    name: "Team",
    tagline: "For teams",
    price: "$19",
    period: "/ user / mo",
    description: "For teams that want AI with shared context.",
    features: [
      "Everything in Pro",
      "Up to 10 members",
      "Shared prompt library",
      "Team memory",
      "SSO / SAML",
      "Dedicated Slack support",
    ],
    cta: "Coming soon",
    comingSoon: true,
    highlighted: false,
    gradient: "from-blue-500 to-cyan-500",
    accentBar: "from-blue-500 to-cyan-400",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    icon: (
      // 5 blobs conectados = equipo
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M6 4Q3 4.5 3 7.5Q3.3 11 6.3 10.8Q9.3 10.5 9 7.5Q8.7 4.5 6 4Z" />
        <path d="M17.7 4Q14.7 4.5 14.7 7.5Q15 11 18 10.8Q21 10.5 20.7 7.5Q20.4 4.5 17.7 4Z" />
        <path d="M12 12Q8.5 12.3 8.5 16Q8.7 20 12.3 19.7Q15.9 19.4 15.5 15.7Q15.1 12.3 12 12Z" />
      </svg>
    ),
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────

// Count-up number that animates once when scrolled into view.
function CountUp({
  value, decimals = 0, prefix = "", suffix = "", separator = "", durationMs = 1400, start,
}: {
  value: number; decimals?: number; prefix?: string; suffix?: string; separator?: string; durationMs?: number; start: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value, durationMs]);

  let out = display.toFixed(decimals);
  if (separator) out = out.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return <>{prefix}{out}{suffix}</>;
}

type Stat = { value: number; decimals?: number; prefix?: string; suffix?: string; separator?: string; label: string; star?: boolean };

const STATS: Stat[] = [
  { value: 2400, suffix: "+", separator: ",", label: "Professionals worldwide" },
  { value: 18, label: "Models supported" },
  { value: 4.9, decimals: 1, label: "Average rating", star: true },
  { value: 0, suffix: "%", label: "Fee on your keys" },
];

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  city: string;
  initials: string;
  gradient: string;
};

// NOTE: sample testimonials — replace names/roles with real ones once you have them.
const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I switched from GPT to Claude mid-project and didn't lose any context. It's the first time an AI tool actually remembers me.",
    name: "Martina Rossi",
    role: "Full-stack developer · freelance",
    city: "Buenos Aires",
    initials: "MR",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    quote: "I pay for my own API keys with no markup. For a small agency like ours, that's the difference between the numbers working or not.",
    name: "Diego Herrera",
    role: "Founder · design studio",
    city: "Mexico City",
    initials: "DH",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    quote: "Having GPT, Claude and Gemini side by side — and merging them into a single answer — saves me hours. I stopped jumping between tabs.",
    name: "Camila Reyes",
    role: "Product Manager · fintech",
    city: "Bogotá",
    initials: "CR",
    gradient: "from-blue-500 to-cyan-500",
  },
];

function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const tt = useT(LP).test;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="testimonials" className="relative py-10 md:py-14 px-5 md:px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[760px] h-[420px] opacity-[0.04] rounded-full"
          style={{ background: "radial-gradient(ellipse, #6366f1, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className={`text-center mb-10 md:mb-14 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">{tt.label}</span>
          <h2 className="display mt-6 text-[1.75rem] sm:text-3xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.1] md:leading-[1.05] text-balance">
            {tt.title1}{" "}
            <span className="gradient-text">{tt.title2}</span>
          </h2>
          <p className="hidden md:block mt-5 text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
            {tt.subtitle}
          </p>
        </div>

        {/* Stats band */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden mb-14 surface-light card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "120ms" } : {}}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              className={`flex flex-col items-center text-center px-5 py-7 ${i !== 0 ? "border-l border-black/8" : ""} ${i >= 2 ? "border-t md:border-t-0 border-black/8" : ""} ${i === 2 ? "border-l-0 md:border-l" : ""}`}
            >
              <div className="display text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 leading-none flex items-center gap-1.5 tabular-nums">
                <CountUp
                  value={s.value}
                  decimals={s.decimals}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  separator={s.separator}
                  start={inView}
                />
                {s.star && (
                  <svg viewBox="0 0 24 24" fill="#FBBF24" className="w-5 h-5 md:w-6 md:h-6 mt-0.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </div>
              <div className="mt-2 text-[12.5px] text-gray-500 font-medium leading-snug max-w-[140px]">{tt.stats[i]}</div>
            </div>
          ))}
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className={`premium-card rounded-2xl p-7 flex flex-col card-item${inView ? " in-view" : ""}`}
              style={inView ? { animationDelay: `${200 + i * 120}ms` } : {}}
            >
              {/* Quote mark */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-200 mb-3">
                <path d="M7.17 6A5.17 5.17 0 0 0 2 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 0 1 7.17 9.5zM18.5 6A5.17 5.17 0 0 0 13.33 11.17V18h6.84v-6.83h-3.34A1.67 1.67 0 0 1 18.5 9.5z" />
              </svg>

              {/* Stars */}
              <div className="flex gap-0.5 mb-3" role="img" aria-label="Rated 5 out of 5 stars">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} viewBox="0 0 24 24" fill="#FBBF24" className="w-3.5 h-3.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              <blockquote className="text-[15px] text-gray-700 leading-relaxed flex-1">
                “{tt.items[i].quote}”
              </blockquote>

              <figcaption className="mt-6 pt-5 border-t border-black/8 flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 ring-1 ring-white/40`}
                  style={{ boxShadow: "0 6px 16px -4px rgba(14,15,18,0.25), inset 0 1px 0 rgba(255,255,255,0.25)" }}
                >
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-gray-900 leading-tight">{t.name}</div>
                  <div className="text-[11px] text-gray-500 leading-tight mt-0.5 truncate">{tt.items[i].role}</div>
                  <div className="text-[11px] text-gray-400 leading-tight mt-0.5">{t.city}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

type PlanText = { tagline: string; period: string; description: string; cta: string; features: string[]; annualNote?: string };

function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { data: session } = useSession();
  const tp = useT(LP).pricing;
  const plansT = tp.plans as Record<string, PlanText>;

  async function handleProCheckout() {
    if (!session?.user) {
      window.location.href = "/login?next=/";
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Couldn't create checkout: " + (data.error ?? "unknown"));
      }
    } catch {
      alert("Network error creating checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="pricing" className="relative py-10 md:py-14 px-5 md:px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-[0.03] rounded-full"
          style={{ background: "radial-gradient(ellipse, #8b5cf6, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className={`text-center mb-10 md:mb-14 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">{tp.label}</span>
          <h2 className="display mt-6 text-[1.75rem] sm:text-3xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.1] md:leading-[1.05] text-balance">
            {tp.title1}{" "}
            <span className="gradient-text">{tp.title2}</span>
          </h2>
          <p className="hidden md:block mt-5 text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
            {tp.subtitle}
          </p>
        </div>

        {/* Billing toggle */}
        <div className={`flex justify-center mb-10 card-item${inView ? " in-view" : ""}`} style={inView ? { animationDelay: "60ms" } : {}}>
          <div className="relative inline-grid grid-cols-2 p-1 rounded-full select-none" style={{ background: "var(--toggle-track)", border: "1px solid var(--border)" }}>
            <span aria-hidden className="absolute top-1 bottom-1 rounded-full"
              style={{ width: "calc(50% - 4px)", left: "4px", background: "var(--surface)", boxShadow: "0 2px 10px rgba(0,0,0,0.12)", transform: billing === "annual" ? "translateX(100%)" : "translateX(0px)", transition: "transform 0.32s cubic-bezier(0.22,1,0.36,1)", willChange: "transform" }} />
            <button onClick={() => setBilling("monthly")}
              className="relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer text-center"
              style={{ color: billing === "monthly" ? "var(--text-1)" : "var(--text-3)" }}>
              {tp.monthly}
            </button>
            <button onClick={() => setBilling("annual")}
              className="relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              style={{ color: billing === "annual" ? "var(--text-1)" : "var(--text-3)" }}>
              {tp.annual}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.16)", color: "#10b981" }}>−20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => {
            const pt = plansT[plan.name.toLowerCase()];
            return (
            <div
              key={plan.name}
              className={`plan-card relative rounded-2xl flex flex-col card-item${inView ? " in-view" : ""} ${
                plan.highlighted ? "pro-ring md:-mt-4 md:mb-4" : ""
              }`}
              style={{
                ...(inView ? { animationDelay: `${100 + i * 120}ms` } : {}),
              }}
            >
              {/* Badge for Pro — outside overflow-hidden */}
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30">
                  <span
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold text-white tracking-wide whitespace-nowrap"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
                      boxShadow: "0 10px 24px -6px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.3)",
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
                    </svg>
                    {tp.mostPopular}
                  </span>
                </div>
              )}

              {/* Inner content wrapper */}
              <div className={`relative rounded-2xl p-7 flex flex-col gap-5 h-full overflow-hidden ${
                plan.highlighted ? "plan-card-pro" : "plan-card-light"
              }`}>

                {/* Top: icon + name + tagline */}
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl ${plan.iconBg} flex items-center justify-center text-white flex-shrink-0 ring-1 ${plan.highlighted ? "ring-white/15" : "ring-white/40"}`}
                      style={{
                        boxShadow: plan.highlighted
                          ? "0 10px 24px -4px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.25)"
                          : "0 6px 18px -4px rgba(14,15,18,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
                      }}
                    >
                      {plan.icon}
                    </div>
                    <div>
                      <div className={`display text-lg font-semibold tracking-tight ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{plan.name}</div>
                      <div className={`text-[11px] font-medium ${plan.highlighted ? "text-indigo-300/90" : "text-gray-400"}`}>{pt.tagline}</div>
                    </div>
                  </div>
                </div>

                {/* Price block */}
                {(() => {
                  const showAnnual = billing === "annual" && !!plan.annual && !plan.comingSoon;
                  const price = plan.comingSoon ? tp.soon : showAnnual ? plan.annual!.price : plan.price;
                  const period = plan.comingSoon ? "" : pt.period;
                  const note = showAnnual ? pt.annualNote : null;
                  return (
                    <div className="relative">
                      <div className="flex items-end gap-1.5">
                        <span key={price} className={`price-swap display ${plan.comingSoon ? "text-[2.5rem]" : "text-[3.5rem]"} font-semibold tracking-tight leading-none ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{price}</span>
                        {period && <span className={`mb-2 text-sm ${plan.highlighted ? "text-white/50" : "text-gray-400"}`}>{period}</span>}
                      </div>
                      {note && <p className={`mt-1.5 text-xs font-semibold ${plan.highlighted ? "text-indigo-300" : "text-emerald-600"}`}>{note}</p>}
                      <p className={`mt-3 text-sm leading-relaxed ${plan.highlighted ? "text-white/65" : "text-gray-500"}`}>{pt.description}</p>
                    </div>
                  );
                })()}

                {/* Divider */}
                <div className={`h-px ${plan.highlighted ? "bg-gradient-to-r from-transparent via-white/15 to-transparent" : "bg-gradient-to-r from-transparent via-black/10 to-transparent"}`} />

                <ul className="space-y-3 flex-1 relative">
                  {pt.features.map((f) => (
                    <li key={f} className={`flex items-start gap-3 text-sm ${plan.highlighted ? "text-white/85" : "text-gray-600"}`}>
                      <span
                        className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          plan.highlighted
                            ? "bg-gradient-to-br from-indigo-400 to-purple-500 text-white"
                            : "bg-gradient-to-br from-gray-900 to-gray-700 text-white"
                        }`}
                        style={{
                          boxShadow: plan.highlighted
                            ? "0 4px 10px -2px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.25)"
                            : "0 3px 8px -2px rgba(14,15,18,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
                        }}
                      >
                        <IconCheck />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={plan.comingSoon || (plan.highlighted && checkoutLoading)}
                  onClick={
                    plan.comingSoon
                      ? undefined
                      : plan.highlighted
                        ? handleProCheckout
                        : () => (window.location.href = "/chat")
                  }
                  className={`relative w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.comingSoon
                      ? "cursor-not-allowed"
                      : "cursor-pointer btn-primary"
                  }`}
                  style={
                    plan.comingSoon
                      ? { background: "rgba(0,0,0,0.04)", border: "1px solid var(--border)", color: "var(--text-4)" }
                      : plan.highlighted
                        ? {
                            background: "linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px var(--border), 0 10px 28px -8px rgba(255,255,255,0.4)",
                            color: "#0E0F12",
                            opacity: checkoutLoading ? 0.6 : 1,
                          }
                        : undefined
                  }
                >
                  {plan.highlighted
                    ? checkoutLoading ? tp.redirecting : pt.cta
                    : pt.cta}
                  {!plan.comingSoon && !plan.highlighted && <IconArrowRight />}
                  {plan.highlighted && !checkoutLoading && <IconArrowRight />}
                </button>

                {/* Bottom accent bar */}
                {!plan.highlighted && (
                  <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${plan.accentBar} opacity-50`} />
                )}
              </div>
            </div>
            );
          })}
        </div>

        <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "600ms" } : {}}>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>{tp.securePay}</span>
          </div>
          <span className="hidden sm:block text-gray-300">·</span>
          <span className="text-sm text-gray-400">{tp.currencies}</span>
        </div>
      </div>
    </section>
  );
}

// â"€â"€â"€ CTA Section â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const tc = useT(LP).cta;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-10 md:py-14 px-5 md:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center">
        <div
          className={`relative rounded-[28px] p-8 md:p-20 overflow-hidden card-item${inView ? " in-view" : ""}`}
          style={{
            background:
              "radial-gradient(1000px 500px at 20% -10%, rgba(99,102,241,0.16), transparent 60%)," +
              "radial-gradient(800px 500px at 100% 110%, rgba(139,92,246,0.14), transparent 60%)," +
              "linear-gradient(180deg, #14161B 0%, #0E0F12 60%, #0A0B0E 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 30px 80px -30px rgba(99,102,241,0.30), 0 12px 40px -12px rgba(0,0,0,0.5)",
          }}
        >
          {/* Top highlight line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          {/* Dot grid overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          <div className="relative z-10">
            <div className="flex justify-center gap-1 mb-6" role="img" aria-label="Rated 5 out of 5 stars">
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 24 24" fill="#FBBF24" className="w-4 h-4">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <h2 className="display text-4xl md:text-[3.25rem] font-semibold text-white leading-[1.05] tracking-tight text-balance">
              {tc.title1}
              <br className="hidden sm:block" />{" "}
              <span
                style={{
                  background: "linear-gradient(120deg, #fff 0%, #C7D2FE 35%, #DDD6FE 60%, #fff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {tc.title2}
              </span>
            </h2>
            <p className="mt-5 text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
              {tc.subtitle}
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/chat" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[15px] text-[#0E0F12] transition-all cursor-pointer hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px var(--border), 0 10px 30px -10px rgba(255,255,255,0.4)",
                }}
              >
                {tc.startFree} <IconArrowRight />
              </a>
              <button
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[15px] text-white/85 transition-all cursor-pointer hover:bg-white/[0.08] hover:text-white"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {tc.seePricing}
              </button>
            </div>
            <p className="mt-6 text-sm text-white/45">
              {tc.micro}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// â"€â"€â"€ Footer â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function Footer() {
  const tf = useT(LP).footer;
  const groups: { id: keyof typeof tf.groups; items: { label: string; href: string }[] }[] = [
    { id: "Product", items: [
      { label: tf.links.features, href: "#features" },
      { label: tf.links.how,      href: "#how-it-works" },
      { label: tf.links.pricing,  href: "#pricing" },
      { label: tf.links.models,   href: "#models" },
    ] },
    { id: "Resources", items: [
      { label: tf.links.docs,    href: "#" },
      { label: tf.links.api,     href: "#" },
      { label: tf.links.status,  href: "#" },
      { label: tf.links.contact, href: "mailto:fabriciouala1@gmail.com" },
    ] },
    { id: "Legal", items: [
      { label: tf.links.privacy, href: "/privacy" },
      { label: tf.links.terms,   href: "/terms" },
      { label: tf.links.refunds, href: "/refunds" },
    ] },
    { id: "Community", items: [
      { label: tf.links.discord,    href: "#" },
      { label: tf.links.twitter,    href: "#" },
      { label: tf.links.reddit,     href: "#" },
      { label: tf.links.newsletter, href: "#" },
    ] },
  ];

  return (
    <footer className="border-t border-black/8 py-14 md:py-20 px-5 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <OneChatLogoFull className="h-7 w-auto" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              {tf.tagline}
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="footer-social-btn w-8 h-8 rounded-lg bg-black/[0.04] border border-black/10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-black/[0.08] transition-all cursor-pointer">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.id}>
              <h4 className="eyebrow text-gray-500 mb-4">{tf.groups[group.id]}</h4>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="footer-link text-sm text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-black/6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} OneChater. {tf.rights}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {tf.systems}
            </span>
            <span className="text-gray-300">·</span>
            <a href="/privacy" className="footer-link text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">{tf.privacy}</a>
            <a href="/terms" className="footer-link text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">{tf.terms}</a>
            <a href="/refunds" className="footer-link text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">{tf.refunds}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// â"€â"€â"€ Hero Section â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function HeroSection() {
  const th = useT(LP).hero;
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
      {/* Subtle dot grid */}
      <div className="hero-dot-grid absolute inset-0 animate-fade-in opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(14,15,18,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 40%, transparent 80%)",
        }} />

      {/* Floating gradient orbs */}
      <div className="hero-orb-1 absolute top-20 -left-32 w-[560px] h-[560px] rounded-full opacity-[0.10] pointer-events-none"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
      <div className="hero-orb-2 absolute top-40 -right-24 w-[460px] h-[460px] rounded-full opacity-[0.08] pointer-events-none"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col items-center">
        {/* Eyebrow badge */}
        <div className="animate-fade-up delay-100 mb-7">
          <button onClick={() => { const el = document.getElementById("features"); if(el) el.scrollIntoView({behavior:"smooth"}); }} className="hero-badge group inline-flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full text-xs font-medium text-gray-700 transition-all cursor-pointer"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(247,247,245,0.85))",
              border: "1px solid rgba(14,15,18,0.10)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(14,15,18,0.04), 0 8px 24px -10px rgba(99,102,241,0.20)",
            }}
          >
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              {th.new}
            </span>
            <span className="hero-badge-inner-text text-gray-700">{th.badge}</span>
            <span className="transition-transform group-hover:translate-x-0.5 text-gray-500">
              <IconArrowRight />
            </span>
          </button>
        </div>

        {/* SEO H1 — hidden visually, indexed by search engines */}
        <h1 className="sr-only">{th.srH1}</h1>

        {/* Visual headline — decorative, aria-hidden */}
        <div aria-hidden="true" className="animate-fade-up delay-200 relative display display-tight text-center text-[clamp(2.75rem,9vw,5.75rem)] leading-[1.02] max-w-5xl">
          {/* soft glow behind headline for depth */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[170%]"
            style={{ background: "radial-gradient(58% 48% at 50% 50%, rgba(99,102,241,0.12), rgba(139,92,246,0.06) 45%, transparent 72%)", filter: "blur(22px)" }} />
          <span className="relative block font-light text-gray-800">
            {th.line1}
          </span>
          <span className="relative block font-semibold mt-1 sm:mt-2 gradient-text-premium">
            {th.line2}
          </span>
        </div>

        {/* Subtext */}
        <p className="animate-fade-up delay-300 mt-7 text-center text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed">
          {th.subA}
          <span className="text-gray-700 font-medium">{th.subBold}</span>{th.subC}
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-400 mt-10 flex flex-col sm:flex-row gap-3">
          <a href="/chat" className="btn-primary text-[15px] px-8 py-3.5">
            {th.startFree} <IconArrowRight />
          </a>
          <button
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="btn-ghost text-[15px] px-7 py-3.5">
            <span className="w-5 h-5 rounded-full bg-gray-100 border border-black/10 flex items-center justify-center text-gray-700">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 ml-0.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
            {th.seeHow}
          </button>
        </div>

        {/* Social proof + Stats */}
        <div className="animate-fade-up delay-500 mt-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {["#4F46E5", "#7C3AED", "#2563EB", "#0891B2", "#059669"].map(
                (c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-[2.5px] border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                    style={{ background: c }}
                  >
                    {["F", "M", "J", "A", "L"][i]}
                  </div>
                )
              )}
            </div>
            <span className="text-sm text-gray-500">
              <span className="text-gray-900 font-semibold">2,400+</span>{" "}
              {th.proWorldwide}
            </span>
          </div>

          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="#FBBF24" className="w-3.5 h-3.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-900 font-semibold">4.9</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {th.byok}
            </span>
          </div>
        </div>

        {/* Trust bar — providers */}
        <div className="animate-fade-up delay-600 mt-12 w-full max-w-4xl">
          <div className="flex items-center gap-3 mb-5 justify-center">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300" />
            <span className="eyebrow text-gray-400">{th.worksWith}</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-70 grayscale">
            <div className="flex items-center gap-2 text-gray-600"><OpenAILogo /><span className="text-sm font-semibold">OpenAI</span></div>
            <div className="flex items-center gap-2 text-gray-600"><AnthropicLogo /><span className="text-sm font-semibold">Anthropic</span></div>
            <div className="flex items-center gap-2 text-gray-600"><GoogleLogo /><span className="text-sm font-semibold">Google</span></div>
            <div className="flex items-center gap-2 text-gray-600"><MistralLogo /><span className="text-sm font-semibold">Mistral</span></div>
            <div className="flex items-center gap-2 text-gray-600"><MetaLogo /><span className="text-sm font-semibold">Meta</span></div>
            <div className="flex items-center gap-2 text-gray-600"><XAILogo /><span className="text-sm font-semibold">xAI</span></div>
          </div>
        </div>

        {/* Video — hidden on mobile */}
        <div className="animate-fade-up delay-600 w-full mt-16 hidden md:flex justify-center px-4">
          <div className="relative flex justify-center" style={{ maxWidth: "980px", width: "100%" }}>
            {/* Glow behind video */}
            <div
              className="hero-orb-1"
              style={{
                position: "absolute",
                inset: "-120px",
                background: "radial-gradient(ellipse at center, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.15) 30%, rgba(168,85,247,0.08) 55%, transparent 75%)",
                filter: "blur(80px)",
                borderRadius: "50%",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            {/* Outer ring */}
            <div className="hero-video-outer relative w-full rounded-[20px] p-1.5">
              {/* Window chrome */}
              <div
                className="relative w-full rounded-[14px] overflow-hidden"
                style={{
                  background: "#0E0F12",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <iframe
                  id="demo-video"
                  className="w-full block"
                  style={{ height: "600px", background: "#0E0F12" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// â"€â"€â"€ Page â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

// Reads ?to= param and scrolls to the matching section, then cleans the URL.
// Must be its own component so it can be wrapped in <Suspense>.
function SectionScrollHandler() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const to = searchParams.get("to");
    if (!to) return;
    const map: Record<string, string> = {
      precios: "pricing",
      funcionalidades: "features",
      "como-funciona": "how-it-works",
      memoria: "memoria",
    };
    const id = map[to];
    if (!id) return;
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `/${to}`);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchParams]);
  return null;
}

function HomeInner() {
  useEffect(() => {
    const iframe = document.getElementById("demo-video") as HTMLIFrameElement;
    if (!iframe) return;

    let hasPlayed = false;

    const handleScroll = () => {
      if (hasPlayed) return;
      const scrollY = window.scrollY;
      const videoSection = iframe.closest("section");
      if (videoSection) {
        const rect = videoSection.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.7) {
          hasPlayed = true;
          iframe.src = "/video-demo.html?autoplay=false";
          iframe.contentWindow?.postMessage("play-video", "*");
          window.removeEventListener("scroll", handleScroll);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main>
      <Suspense fallback={null}>
        <SectionScrollHandler />
      </Suspense>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <MemorySection />
      <ModelsSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <HomeInner />
    </SessionProvider>
  );
}