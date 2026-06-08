"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import ThemeToggle from "./components/ThemeToggle";
import UserMenu from "./components/UserMenu";
import { useLang, useT, LangToggle } from "@/lib/i18n";

// â"€ Landing copy (EN / ES) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const LP = {
  en: {
    nav: { features: "Features", how: "How it works", memory: "Memory", fusion: "Fusion", pricing: "Pricing", signIn: "Sign in", startFree: "Start free", goToChat: "Go to chat", menu: "Menu", openMenu: "Open menu", closeMenu: "Close menu", home: "OneChater home" },
    hero: {
      new: "New", badge: "Persistent memory across models",
      srH1: "OneChater — AI chat with GPT, Claude and Gemini in one place, with a persistent memory that follows you across every model",
      line1: "One memory.", line2: "Every AI.",
      subA: "The only AI chat app that doesn't forget you when you switch models.", subBold: " GPT, Claude and Gemini", subC: " in one place, with a memory that travels with you.",
      startFree: "Start free", goToChat: "Go to chat", profile: "@fabriciovla",
      proWorldwide: "professionals worldwide", byok: "BYOK · 0% fee", worksWith: "Works with",
    },
    preview: { activeMemory: "Active memory:", chips: "Next.js · Banking client · Short answers", userQ: "How do I optimize this Postgres query?", sent: "Sent to 3 models", now: "Just now", gpt: "Add a composite index on", gptB: "and run EXPLAIN ANALYZE to verify...", claude: "With pgvector on your Supabase you can use", claudeB: "indexes for more efficient searches...", full: "Full answer →", gen: "Generating response...", ask: "Ask every model at once...", send: "Send message" },
    how: {
      label: "How it works", title1: "Up and running in", title2: "60 seconds",
      subtitle: "No complicated setup. No subscriptions to manage. Paste your keys and get started.", step: "Step",
      steps: {
        s1: { eyebrow: "Setup", title: "Connect your API keys", desc: "Paste your OpenAI, Anthropic or Google keys. They're encrypted and tied to your account, restored on any device when you log in. Set it up once, forever.", tags: ["OpenAI", "Anthropic", "Google", "Encrypted"] },
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
    fusion: {
      label: "Fusion mode", badge: "Most powerful",
      title1: "The best of every AI,", title2: "fused into one answer",
      subtitle: "Send your prompt once. GPT, Claude and Gemini answer simultaneously. OneChater's Fusion mode synthesizes all three into one superior, sharper response — automatically.",
      step1: { num: "01", title: "Write once", desc: "Your prompt is sent to GPT, Claude and Gemini simultaneously. No switching tabs, no copy-pasting." },
      step2: { num: "02", title: "Three answers in parallel", desc: "All three models respond in real time, side by side. See their different approaches instantly." },
      step3: { num: "03", title: "One fused response", desc: "Fusion mode analyzes all three answers and synthesizes the best parts into a single, superior response." },
      cta: "Try Fusion mode",
      tagGPT: "GPT-4o", tagClaude: "Claude 3.5", tagGemini: "Gemini Pro", tagFusion: "Fused answer",
      note: "Fusion mode uses your own API keys — you pay providers directly, zero markup.",
      synth: "Synthesized",
      promptText: "How should I structure this database for scale?",
      youLabel: "You", askLabel: "Asked once", liveLabel: "live",
      qualities: ["More accurate", "More complete", "Fewer hallucinations"],
      stats: [
        { v: "3 → 1", l: "models merged into one answer" },
        { v: "1 prompt", l: "no tab-switching, no copy-paste" },
        { v: "0% markup", l: "your keys, you pay providers direct" },
      ],
    },
    cta: { title1: "Ready to unify your", title2: "AI workflow?", subtitle: "Join thousands of professionals and freelancers who use OneChater to get the most out of every AI model — with one memory that connects them all.", startFree: "Start for free", goToChat: "Go to chat", seePricing: "See pricing", micro: "No credit card · Set up in 60 seconds · Cancel anytime" },
    footer: {
      tagline: "One memory. Every AI. Bring your keys, own your data.",
      groups: { Product: "Product", Resources: "Resources", Legal: "Legal", Community: "Community" },
      links: { features: "Features", how: "How it works", pricing: "Pricing", models: "Models", docs: "Documentation", api: "API reference", status: "Status", contact: "Contact", privacy: "Privacy policy", terms: "Terms of use", refunds: "Refund policy", discord: "Discord", twitter: "Twitter / X", reddit: "Reddit", newsletter: "Newsletter" },
      rights: "All rights reserved.", systems: "All systems operational", privacy: "Privacy", terms: "Terms", refunds: "Refunds",
    },
  },
  es: {
    nav: { features: "Funcionalidades", how: "Cómo funciona", memory: "Memoria", fusion: "Fusión", pricing: "Precios", signIn: "Iniciar sesión", startFree: "Empezar gratis", goToChat: "Ir al chat", menu: "Menú", openMenu: "Abrir menú", closeMenu: "Cerrar menú", home: "Inicio de OneChater" },
    hero: {
      new: "Nuevo", badge: "Memoria persistente entre modelos",
      srH1: "OneChater — chat con IA: GPT, Claude y Gemini en un solo lugar, con una memoria persistente que te sigue en todos los modelos",
      line1: "Una memoria.", line2: "Todas las IAs.",
      subA: "La única app de chat con IA que no te olvida cuando cambiás de modelo.", subBold: " GPT, Claude y Gemini", subC: " en un solo lugar, con una memoria que viaja con vos.",
      startFree: "Empezar gratis", goToChat: "Ir al chat", profile: "@fabriciovla",
      proWorldwide: "profesionales en todo el mundo", byok: "BYOK · 0% de comisión", worksWith: "Compatible con",
    },
    preview: { activeMemory: "Memoria activa:", chips: "Next.js · Cliente bancario · Respuestas cortas", userQ: "¿Cómo optimizo esta query de Postgres?", sent: "Enviado a 3 modelos", now: "Hace un momento", gpt: "Agregá un índice compuesto en", gptB: "y usá EXPLAIN ANALYZE para verificar...", claude: "Con pgvector en tu Supabase podés usar índices", claudeB: "para búsquedas más eficientes...", full: "Respuesta completa →", gen: "Generando respuesta...", ask: "Preguntale a todos los modelos a la vez...", send: "Enviar mensaje" },
    how: {
      label: "Cómo funciona", title1: "Funcionando en", title2: "60 segundos",
      subtitle: "Sin setup complicado. Sin suscripciones que gestionar. Pegás tus keys y empezás.", step: "Paso",
      steps: {
        s1: { eyebrow: "Setup", title: "Conectá tus API keys", desc: "Pegá tus keys de OpenAI, Anthropic o Google. Se cifran y quedan atadas a tu cuenta, restauradas en cualquier dispositivo al entrar. Configuración única, para siempre.", tags: ["OpenAI", "Anthropic", "Google", "Cifradas"] },
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
    fusion: {
      label: "Modo Fusión", badge: "Lo más poderoso",
      title1: "Lo mejor de cada IA,", title2: "fusionado en una respuesta",
      subtitle: "Enviá tu prompt una vez. GPT, Claude y Gemini responden al mismo tiempo. El modo Fusión de OneChater sintetiza las tres respuestas en una sola, superior — automáticamente.",
      step1: { num: "01", title: "Escribís una vez", desc: "Tu prompt se manda a GPT, Claude y Gemini al mismo tiempo. Sin cambiar pestañas, sin copiar y pegar." },
      step2: { num: "02", title: "Tres respuestas en paralelo", desc: "Los tres modelos responden en tiempo real, lado a lado. Ves sus distintos enfoques al instante." },
      step3: { num: "03", title: "Una respuesta fusionada", desc: "El modo Fusión analiza las tres respuestas y sintetiza lo mejor de cada una en una sola, superior." },
      cta: "Probar Fusión",
      tagGPT: "GPT-4o", tagClaude: "Claude 3.5", tagGemini: "Gemini Pro", tagFusion: "Respuesta fusionada",
      note: "El modo Fusión usa tus propias API keys — pagás directo a los proveedores, sin markup.",
      synth: "Sintetizada",
      promptText: "¿Cómo estructuro esta base de datos para escalar?",
      youLabel: "Vos", askLabel: "Preguntás una vez", liveLabel: "en vivo",
      qualities: ["Más precisa", "Más completa", "Menos alucinaciones"],
      stats: [
        { v: "3 → 1", l: "modelos fusionados en una respuesta" },
        { v: "1 prompt", l: "sin cambiar pestañas, sin copiar/pegar" },
        { v: "0% markup", l: "tus keys, pagás directo a los proveedores" },
      ],
    },
    cta: { title1: "¿Listo para unificar tu", title2: "flujo de trabajo con IA?", subtitle: "Unite a miles de profesionales y freelancers que usan OneChater para aprovechar al máximo cada modelo de IA, con una memoria que los conecta a todos.", startFree: "Empezar gratis", goToChat: "Ir al chat", seePricing: "Ver precios", micro: "Sin tarjeta de crédito · Listo en 60 segundos · Cancelá cuando quieras" },
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
    { label: t.nav.how,      sectionId: "how-it-works" },
    { label: t.nav.memory,   sectionId: "memoria" },
    { label: t.nav.fusion,   sectionId: "fusion" },
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
                <a href="/login" className="ml-1 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold text-white transition-all duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer hover:-translate-y-0.5 hover:brightness-110"
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
          {session?.user ? (
            <a href="/chat" className="btn-primary text-[15px] py-3.5 justify-center">
              {t.nav.goToChat} <IconArrowRight />
            </a>
          ) : (
            <>
              <a href="/login" className="btn-primary text-[15px] py-3.5 justify-center">
                {t.nav.startFree} <IconArrowRight />
              </a>
              <a href="/login" className="text-center text-sm py-2.5 font-medium rounded-xl transition-all"
                style={{ color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                {t.nav.signIn}
              </a>
            </>
          )}
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

// ─── How It Works ──────────────────────────────────────────────────────────

type StepDef = { n: string; eyebrow: string; title: string; description: string; tags: string[]; gradient: string; iconBg: string; shadow: string; tone: string; glow: string; icon: React.ReactNode };

const STEPS: StepDef[] = [
  {
    n: "01", eyebrow: "Setup", title: "Connect your API keys",
    description: "Paste your OpenAI, Anthropic or Google keys. They're encrypted and tied to your account, restored on any device when you log in. Set it up once, forever.",
    tags: ["OpenAI", "Anthropic", "Google", "Encrypted"],
    gradient: "from-violet-500 to-purple-600", iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    shadow: "rgba(139,92,246,0.4)", tone: "tone-violet", glow: "glow-violet",
    icon: <IconKey />,
  },
  {
    n: "02", eyebrow: "Chat", title: "Chat with every model",
    description: "Write once and get answers from GPT, Claude and Gemini in real time, side by side. Compare them and pick the best.",
    tags: ["Real-time streaming", "Compare view", "Zero friction"],
    gradient: "from-blue-500 to-cyan-500", iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    shadow: "rgba(59,130,246,0.4)", tone: "tone-blue", glow: "glow-blue",
    icon: <IconMessages />,
  },
  {
    n: "03", eyebrow: "Memory", title: "Memory learns as you go",
    description: "After every chat, OneChater extracts what matters: projects, preferences, decisions. Next time, every model already knows you.",
    tags: ["Automatic capture", "Editable profile", "Portable across models"],
    gradient: "from-orange-500 to-amber-500", iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
    shadow: "rgba(249,115,22,0.4)", tone: "tone-orange", glow: "glow-orange",
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
    <section ref={sectionRef} id="how-it-works" className="relative py-12 md:py-20 px-5 md:px-6 overflow-hidden">
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

        <div className="grid md:grid-cols-3 gap-10 md:gap-12">
          {STEPS.map((step, i) => {
            const st = stepsT[i];
            return (
            <div
              key={step.n}
              className={`relative card-item${inView ? " in-view" : ""} md:px-2 text-center md:text-left`}
              style={inView ? { animationDelay: `${i * 120}ms` } : {}}
            >
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                >
                  {step.icon}
                </div>
                <span className="eyebrow text-gray-400">{th.step} {step.n}</span>
              </div>
              <h3 className="display text-xl md:text-2xl font-semibold text-gray-900 tracking-tight mb-3">{st.title}</h3>
              <p className="text-gray-500 leading-relaxed text-[15px]">{st.desc}</p>
            </div>
            );
          })}
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
    <section ref={sectionRef} id="memoria" className="relative py-12 md:py-20 px-5 md:px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[820px] h-[440px] opacity-[0.04] rounded-full"
          style={{ background: "radial-gradient(ellipse, #6366f1, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className={`text-center mb-8 md:mb-14 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">{tm.label}</span>
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
          className={`relative rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 md:p-12 surface-light overflow-hidden card-item${inView ? " in-view" : ""}`}
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
            <div className="mem-node rounded-3xl px-6 py-5 text-center w-[150px] flex-shrink-0"
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
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%)", zIndex: 0 }} />
              <div className="mem-node relative rounded-3xl px-6 py-6 text-center w-[210px]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-mid)", zIndex: 1 }}>
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white ring-1 ring-white/40"
                  style={{ boxShadow: "0 10px 28px -6px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
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
                <div key={m.name} className="mem-node flex items-center gap-2.5 rounded-2xl px-4 py-2.5 w-[180px]"
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

        {/* Feature list — clean, no boxes */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 mt-14 md:mt-20">
          {MEMORY_CARDS.map((c, i) => (
            <div
              key={c.id}
              className={`card-item${inView ? " in-view" : ""} text-center md:text-left`}
              style={inView ? { animationDelay: `${120 + i * 60}ms` } : {}}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto md:mx-0"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
              >
                {c.icon}
              </div>
              <h3 className="display mt-4 text-lg font-semibold text-gray-900 tracking-tight leading-tight">{cardsT[c.id].name}</h3>
              <p className="mt-2 text-[14px] text-gray-500 leading-relaxed text-pretty">{cardsT[c.id].desc}</p>
            </div>
          ))}
        </div>

        {/* Important note */}
        <div className={`mt-12 md:mt-16 card-item${inView ? " in-view" : ""}`} style={inView ? { animationDelay: "200ms" } : {}}>
          <div className="relative rounded-2xl p-5 md:p-7 flex items-start gap-3.5 md:gap-4 surface-light overflow-hidden">
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
    <section ref={sectionRef} id="models" className="relative py-12 md:py-20 px-5 md:px-6 overflow-hidden">
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
    gradient: "from-gray-500 to-gray-600",
    accentBar: "from-gray-300 to-gray-400",
    iconBg: "bg-gradient-to-br from-gray-700 to-gray-900",
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

// ─── Fusion Section ────────────────────────────────────────────────────────

function FusionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const tf = useT(LP).fusion;
  const { lang } = useLang()
  const { data: session } = useSession();

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Desktop-only: only load the demo video on ≥md screens (mobile shows the static diagram).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const steps = [tf.step1, tf.step2, tf.step3];
  const MODELS = [
    { tag: tf.tagGPT,    color: "#10a37f", logo: <OpenAILogo /> },
    { tag: tf.tagClaude, color: "#d97757", logo: <AnthropicLogo /> },
    { tag: tf.tagGemini, color: "#4285f4", logo: <GoogleLogo /> },
  ];

  return (
    <section ref={sectionRef} id="fusion" className="relative py-12 md:py-20 px-5 md:px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-[0.05] rounded-full"
          style={{ background: "radial-gradient(ellipse, #a855f7, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className={`text-center mb-8 md:mb-14 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">{tf.label}</span>
          <h2 className="display mt-4 md:mt-6 text-[1.75rem] sm:text-3xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.1] md:leading-[1.05] text-balance">
            {tf.title1}{" "}
            <span className="gradient-text">{tf.title2}</span>
          </h2>
          <p className="hidden md:block mt-5 text-gray-500 max-w-2xl mx-auto text-[15px] md:text-lg leading-relaxed">
            {tf.subtitle}
          </p>
        </div>

        {/* Desktop: live Fusion demo video */}
        <div className={`hidden md:flex justify-center card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "80ms" } : {}}>
          <div className="relative flex justify-center w-full" style={{ maxWidth: "1040px" }}>
            <div className="hero-orb-1" style={{ position: "absolute", inset: "-10%", background: "radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.10) 38%, transparent 72%)", filter: "blur(80px)", borderRadius: "50%", pointerEvents: "none", zIndex: 0 }} />
            <div className="hero-video-outer relative w-full rounded-[16px] md:rounded-[20px] p-1 md:p-1.5">
              <div className="video-embed rounded-[12px] md:rounded-[14px]" style={{ background: "#0E0F12", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <iframe
                  id="fusion-video"
                  title="OneChater Fusion demo"
                  src={inView && isDesktop ? `/video-fusion-demo.html?lang=${lang}` : undefined}
                  style={{ background: "#0E0F12" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fusion showcase — hidden (video is desktop-only; mobile stays clean) */}
        <div className={`hidden relative rounded-[28px] p-5 sm:p-8 surface-light overflow-hidden card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "80ms" } : {}}>
          {/* dot grid backdrop + violet glow */}
          <div className="absolute inset-0 opacity-[0.5] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(var(--border-strong) 1px, transparent 1px)", backgroundSize: "26px 26px", maskImage: "radial-gradient(ellipse 75% 70% at 50% 42%, #000 30%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 42%, #000 30%, transparent 75%)" }} />
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[320px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.16), transparent 70%)" }} />

          {/* Prompt — asked once */}
          <div className="relative flex flex-col items-center mb-7 md:mb-9">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: "var(--text-3)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#a855f7" }} />
              {tf.askLabel}
            </span>
            <div className="w-full max-w-md rounded-2xl px-4 py-3.5 flex items-center gap-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>{tf.youLabel[0]}</span>
              <span className="flex-1 text-left text-[13px] md:text-sm truncate" style={{ color: "var(--text-2)" }}>{tf.promptText}</span>
              <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </div>
          </div>

          {/* Flow: three models → core → fused answer */}
          <div className="relative flex flex-col md:flex-row md:items-stretch gap-4 md:gap-0">
            {/* Three models in parallel */}
            <div className="md:flex-1 flex flex-col justify-between gap-3 md:gap-4">
              {MODELS.map((m, i) => (
                <div key={i} className="relative rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${m.color}14`, border: `1px solid ${m.color}33`, color: m.color }}>
                    {m.logo}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{m.tag}</span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide" style={{ color: m.color }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: m.color }} />{tf.liveLabel}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-1">
                      {[100, 70].map((w, j) => (
                        <div key={j} className="h-1.5 rounded-full fz-stream"
                          style={{ width: `${w}%`, background: `linear-gradient(90deg,${m.color}1f,${m.color}cc,${m.color}1f)`, animationDelay: `${i * 0.2 + j * 0.25}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Connector + fusion core (desktop) */}
            <div className="hidden md:block relative w-[120px] flex-shrink-0">
              <svg viewBox="0 0 120 240" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" fill="none">
                <defs>
                  <linearGradient id="fzIn" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#6366f1" stopOpacity="0.12" />
                    <stop offset="1" stopColor="#a855f7" stopOpacity="0.85" />
                  </linearGradient>
                  <linearGradient id="fzOut" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#a855f7" />
                    <stop offset="1" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <path d="M0 34 C 52 34, 38 120, 82 120" stroke="url(#fzIn)" strokeWidth="2" className="fz-flow" />
                <path d="M0 120 L 82 120" stroke="url(#fzIn)" strokeWidth="2" className="fz-flow" />
                <path d="M0 206 C 52 206, 38 120, 82 120" stroke="url(#fzIn)" strokeWidth="2" className="fz-flow" />
                <path d="M82 120 L 120 120" stroke="url(#fzOut)" strokeWidth="2.5" />
              </svg>
              <div className="absolute top-1/2 -translate-y-1/2" style={{ left: "54%" }}>
                <div className="relative w-14 h-14">
                  <span className="absolute inset-0 rounded-full fz-ring" style={{ border: "1px solid rgba(168,85,247,0.5)" }} />
                  <span className="absolute inset-0 rounded-full fz-ring" style={{ border: "1px solid rgba(99,102,241,0.5)", animationDelay: "1.4s" }} />
                  <div className="fz-float absolute inset-0 rounded-2xl flex items-center justify-center text-white"
                    style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", boxShadow: "0 12px 30px -6px rgba(139,92,246,0.7)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Fusion core (mobile) */}
            <div className="flex md:hidden flex-col items-center gap-1.5 py-1">
              <div className="relative w-12 h-12">
                <span className="absolute inset-0 rounded-full fz-ring" style={{ border: "1px solid rgba(168,85,247,0.5)" }} />
                <div className="fz-float absolute inset-0 rounded-2xl flex items-center justify-center text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", boxShadow: "0 10px 26px -6px rgba(139,92,246,0.7)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "#a855f7" }}>Fusion</span>
            </div>

            {/* Fused answer (hero) */}
            <div className="md:flex-1">
              <div className="relative rounded-2xl p-[1.5px] h-full"
                style={{ background: "linear-gradient(135deg,#6366f1,#a855f7,#22c55e)", boxShadow: "0 24px 60px -22px rgba(139,92,246,0.5)" }}>
                <div className="h-full rounded-[15px] p-5 md:p-6 flex flex-col" style={{ background: "var(--surface)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
                      style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {tf.tagFusion}
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>{tf.synth}</span>
                  </div>
                  <div className="flex flex-col gap-2 mb-5">
                    {[100, 96, 90, 82, 64].map((w, j) => (
                      <div key={j} className="h-2 rounded-full"
                        style={{ width: `${w}%`, background: j === 0 ? "linear-gradient(90deg,#6366f1,#a855f7)" : "var(--surface-2)" }} />
                    ))}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {tf.qualities.map((q, j) => (
                      <span key={j} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="w-3 h-3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats — slim metric strip */}
        <div className={`mt-7 md:mt-9 grid grid-cols-3 card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "140ms" } : {}}>
          {tf.stats.map((s, i) => (
            <div key={i} className="relative flex flex-col items-center text-center px-2 py-3">
              {i > 0 && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8" style={{ background: "var(--border)" }} />}
              <div className="display text-lg md:text-2xl font-semibold gradient-text">{s.v}</div>
              <div className="text-[11px] md:text-[12px] mt-1 leading-tight" style={{ color: "var(--text-3)" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* 3-step flow */}
        <div className="grid md:grid-cols-3 gap-10 md:gap-12 mt-14 md:mt-20 mb-12">
          {steps.map((s, i) => (
            <div key={i} className={`relative card-item${inView ? " in-view" : ""} md:px-2`}
              style={inView ? { animationDelay: `${160 + i * 100}ms` } : {}}>
              <div className="flex items-center gap-3 mb-5">
                <span className="display text-2xl font-semibold text-gray-300">{s.num}</span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              </div>
              <h3 className="display text-xl font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`flex flex-col items-center gap-3 card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "460ms" } : {}}>
          <a href={session?.user ? "/chat" : "/login"}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[15px] text-white transition-all cursor-pointer hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 8px 24px -8px rgba(99,102,241,0.5)" }}>
            {tf.cta} <IconArrowRight />
          </a>
          <p className="text-[12px] text-gray-400">{tf.note}</p>
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
    <section ref={sectionRef} id="pricing" className="relative py-12 md:py-20 px-5 md:px-6 overflow-hidden">
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
                    className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-bold text-white tracking-wide whitespace-nowrap"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      boxShadow: "0 10px 24px -6px rgba(139,92,246,0.5)",
                    }}
                  >
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
                      : plan.highlighted
                        ? "cursor-pointer btn-primary pricing-cta-pro"
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
  const { data: session } = useSession();

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-12 md:py-20 px-5 md:px-6 overflow-hidden">
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
              <a href="/chat" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[15px] text-[#0E0F12] transition-all duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer hover:-translate-y-0.5 hover:brightness-[0.97] hover:shadow-[0_22px_50px_-14px_rgba(255,255,255,0.5)]"
                style={{
                  background: "linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px var(--border), 0 10px 30px -10px rgba(255,255,255,0.4)",
                }}
              >
                {session?.user ? tc.goToChat : tc.startFree} <IconArrowRight />
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
  const { data: session } = useSession();
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-10 md:pb-12 overflow-hidden">
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
          <button onClick={() => { const el = document.getElementById("how-it-works"); if(el) el.scrollIntoView({behavior:"smooth"}); }} className="hero-badge group inline-flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }} />
            <span className="hero-badge-inner-text">{th.badge}</span>
            <span className="transition-transform group-hover:translate-x-0.5" style={{ color: "var(--text-4)" }}>
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
          <span className="relative block font-medium text-gray-900">
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
            {session?.user ? th.goToChat : th.startFree} <IconArrowRight />
          </a>
          <a
            href="https://github.com/fabriciovla"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-[15px] px-7 py-3.5 flex items-center gap-2.5"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            {th.profile}
          </a>
        </div>

        {/* Hero visual — desktop-only live demo (mobile stays text-first, no card) */}
        <div className="animate-fade-up delay-500 hidden md:flex w-full mt-16 justify-center">
          <div className="relative flex justify-center w-full" style={{ maxWidth: "1040px" }}>
            {/* Glow behind video */}
            <div
              className="hero-orb-1"
              style={{
                position: "absolute",
                inset: "-10%",
                background: "radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.10) 35%, transparent 72%)",
                filter: "blur(80px)",
                borderRadius: "50%",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            {/* Outer ring */}
            <div className="hero-video-outer relative w-full rounded-[20px] p-1.5">
              {/* Window chrome — fixed 900×600 demo scaled to fit (see .video-embed) */}
              <div
                className="video-embed rounded-[14px]"
                style={{
                  background: "#0E0F12",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <iframe id="demo-video" title="OneChater demo" style={{ background: "#0E0F12" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Works with — quiet trust strip */}
        <div className="animate-fade-up delay-600 mt-12 md:mt-16 w-full max-w-4xl">
          <p className="text-center eyebrow text-gray-400 mb-5 md:mb-6">{th.worksWith}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:gap-x-10 sm:gap-y-5 opacity-60 grayscale">
            <div className="flex items-center gap-2 text-gray-600"><OpenAILogo /><span className="hidden sm:inline text-sm font-semibold">OpenAI</span></div>
            <div className="flex items-center gap-2 text-gray-600"><AnthropicLogo /><span className="hidden sm:inline text-sm font-semibold">Anthropic</span></div>
            <div className="flex items-center gap-2 text-gray-600"><GoogleLogo /><span className="hidden sm:inline text-sm font-semibold">Google</span></div>
            <div className="flex items-center gap-2 text-gray-600"><MistralLogo /><span className="hidden sm:inline text-sm font-semibold">Mistral</span></div>
            <div className="flex items-center gap-2 text-gray-600"><MetaLogo /><span className="hidden sm:inline text-sm font-semibold">Meta</span></div>
            <div className="flex items-center gap-2 text-gray-600"><XAILogo /><span className="hidden sm:inline text-sm font-semibold">xAI</span></div>
          </div>
          <p className="mt-7 md:mt-8 text-center text-[13px] text-gray-400 px-4">
            <span className="text-gray-700 font-semibold">2,400+</span> {th.proWorldwide} · {th.byok}
          </p>
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
  const { lang } = useLang()
  const [animating, setAnimating] = useState(false)
  const prevLangRef = useRef(lang)
  const langRef = useRef(lang)
  langRef.current = lang

  // Trigger animation + reload demo-video on lang change
  useEffect(() => {
    if (lang === prevLangRef.current) return
    prevLangRef.current = lang
    setAnimating(true)
    const t = setTimeout(() => setAnimating(false), 400)
    const iframe = document.getElementById("demo-video") as HTMLIFrameElement
    if (iframe?.src) iframe.src = `/video-demo.html?lang=${lang}`
    return () => clearTimeout(t)
  }, [lang])

  useEffect(() => {
    // Desktop-only: don't load the demo video on mobile (fallback preview shows instead).
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 768px)").matches) return;

    const iframe = document.getElementById("demo-video") as HTMLIFrameElement;
    if (!iframe) return;

    let hasPlayed = false;

    const handleScroll = () => {
      if (hasPlayed) return;
      const videoSection = iframe.closest("section");
      if (videoSection) {
        const rect = videoSection.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.7) {
          hasPlayed = true;
          iframe.src = `/video-demo.html?lang=${langRef.current}`;
          window.removeEventListener("scroll", handleScroll);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scale each fixed-size demo iframe (900×600) to its container width so the
  // videos stay sharp and proportional on every screen, mobile included.
  useEffect(() => {
    const embeds = Array.from(document.querySelectorAll<HTMLElement>(".video-embed"));
    if (!embeds.length) return;
    const update = () =>
      embeds.forEach((el) => el.style.setProperty("--vscale", String(el.clientWidth / 900)));
    update();
    const ro = new ResizeObserver(update);
    embeds.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, []);

  return (
    <main className={animating ? "lang-switch" : ""}>
      <Suspense fallback={null}>
        <SectionScrollHandler />
      </Suspense>
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <MemorySection />
      <ModelsSection />
      <FusionSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}

export default function Home() {
  return <HomeInner />;
}