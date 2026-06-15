import type { Metadata } from "next";
import type { SeoContent } from "./SeoLanding";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.onechater.com";

// Build per-page metadata: unique title/description, self-canonical and hreflang
// alternates so EN/ES variants are understood as the same page in two languages.
export function buildMetadata(opts: {
  title: string;
  description: string;
  slug: string;
  alt?: { lang: "en" | "es"; path: string };
  locale: "en" | "es";
}): Metadata {
  const languages: Record<string, string> = {};
  languages[opts.locale] = `${SITE_URL}${opts.slug}`;
  if (opts.alt) {
    languages[opts.alt.lang] = `${SITE_URL}${opts.alt.path}`;
    languages["x-default"] = `${SITE_URL}${opts.alt.lang === "en" ? opts.alt.path : opts.slug}`;
  }
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.slug, languages },
    openGraph: {
      title: `${opts.title} · OneChater`,
      description: opts.description,
      url: `${SITE_URL}${opts.slug}`,
      type: "website",
      locale: opts.locale === "es" ? "es_ES" : "en_US",
    },
  };
}

// ── Page content ──────────────────────────────────────────────────────────────

export const howItWorks: SeoContent = {
  lang: "en",
  slug: "/how-it-works",
  alt: { lang: "es", path: "/como-funciona" },
  breadcrumb: "How it works",
  h1: "How OneChater works",
  highlight: "works",
  lede:
    "OneChater lets you chat with GPT, Claude and Gemini in one place, with a persistent memory that follows you across every model. You bring your own API keys and pay each provider directly — no markup, no lock-in.",
  blocks: [
    {
      h: "1. Connect your API keys",
      body:
        "Paste your OpenAI, Anthropic or Google keys once. They're encrypted server-side and tied to your account, then restored on any device when you sign in. Set it up once and you're done.",
      bullets: ["AES-256 encryption", "Restored across devices", "Bring your own key (BYOK)", "Pay providers directly"],
    },
    {
      h: "2. Chat with every model",
      body:
        "Write once and get answers from GPT, Claude and Gemini in real time, side by side. Compare their responses and pick the best — or merge them into a single answer with Fusion.",
      bullets: ["Real-time streaming", "Side-by-side compare", "Switch models mid-conversation"],
    },
    {
      h: "3. Memory learns as you go",
      body:
        "After every chat, OneChater extracts what matters — your projects, preferences and decisions — into a private memory profile you fully control. Next time, every model already knows your context.",
      bullets: ["Automatic capture", "Editable memory profile", "Portable across all models"],
    },
  ],
  faqs: [
    { q: "Do I need a subscription?", a: "No. OneChater is bring-your-own-key: you connect your own provider API keys and pay OpenAI, Anthropic or Google directly with zero markup." },
    { q: "Can I switch models without losing context?", a: "Yes. Your memory profile travels with you, so moving from GPT to Claude or Gemini keeps your projects, preferences and history intact." },
    { q: "How long does setup take?", a: "About 60 seconds — paste your API keys and start chatting. Keys are encrypted and restored automatically on any device." },
  ],
  related: [
    { href: "/memory", label: "Persistent memory" },
    { href: "/models", label: "Supported models" },
    { href: "/fusion", label: "Fusion" },
    { href: "/pricing", label: "Pricing" },
  ],
  cta: { title: "Up and running in 60 seconds", sub: "Connect your keys and chat with every model from a single place.", button: "Start free" },
};

export const comoFunciona: SeoContent = {
  lang: "es",
  slug: "/como-funciona",
  alt: { lang: "en", path: "/how-it-works" },
  breadcrumb: "Cómo funciona",
  h1: "Cómo funciona OneChater",
  highlight: "funciona",
  lede:
    "OneChater te deja chatear con GPT, Claude y Gemini en un solo lugar, con una memoria persistente que te sigue entre todos los modelos. Usas tus propias API keys y pagas a cada proveedor directamente — sin recargo y sin lock-in.",
  blocks: [
    {
      h: "1. Conecta tus API keys",
      body:
        "Pega tus claves de OpenAI, Anthropic o Google una sola vez. Se cifran en el servidor y quedan ligadas a tu cuenta, y se restauran en cualquier dispositivo al iniciar sesión. Lo configuras una vez y listo.",
      bullets: ["Cifrado AES-256", "Restauradas entre dispositivos", "Trae tu propia clave (BYOK)", "Paga directo a los proveedores"],
    },
    {
      h: "2. Chatea con todos los modelos",
      body:
        "Escribe una vez y recibe respuestas de GPT, Claude y Gemini en tiempo real, lado a lado. Compáralas y elige la mejor — o fusiónalas en una sola respuesta con Fusión.",
      bullets: ["Streaming en tiempo real", "Comparación lado a lado", "Cambia de modelo a mitad de conversación"],
    },
    {
      h: "3. La memoria aprende sobre la marcha",
      body:
        "Después de cada chat, OneChater extrae lo importante — tus proyectos, preferencias y decisiones — en un perfil de memoria privado que tú controlas. La próxima vez, cada modelo ya conoce tu contexto.",
      bullets: ["Captura automática", "Perfil de memoria editable", "Portable entre todos los modelos"],
    },
  ],
  faqs: [
    { q: "¿Necesito una suscripción?", a: "No. OneChater es bring-your-own-key: conectas tus propias API keys y pagas a OpenAI, Anthropic o Google directamente, sin recargo." },
    { q: "¿Puedo cambiar de modelo sin perder el contexto?", a: "Sí. Tu perfil de memoria viaja contigo, así que pasar de GPT a Claude o Gemini mantiene tus proyectos, preferencias e historial." },
    { q: "¿Cuánto tarda la configuración?", a: "Unos 60 segundos — pega tus API keys y empieza a chatear. Las claves se cifran y se restauran en cualquier dispositivo." },
  ],
  related: [
    { href: "/memoria", label: "Memoria persistente" },
    { href: "/modelos", label: "Modelos compatibles" },
    { href: "/fusion", label: "Fusión" },
    { href: "/precios", label: "Precios" },
  ],
  cta: { title: "Listo en 60 segundos", sub: "Conecta tus claves y chatea con todos los modelos desde un solo lugar.", button: "Empieza gratis" },
};

export const memory: SeoContent = {
  lang: "en",
  slug: "/memory",
  alt: { lang: "es", path: "/memoria" },
  breadcrumb: "Memory",
  h1: "Persistent AI memory that travels across every model",
  highlight: "memory",
  lede:
    "OneChater builds a private, per-user memory so your assistants remember your preferences, projects, goals and long-term context — no matter which model you're talking to.",
  blocks: [
    { h: "One memory, every model", body: "Switch between GPT, Claude and Gemini without losing important information about you or your projects. Your context stays consistent everywhere." },
    { h: "Progressive learning", body: "OneChater remembers relevant details from earlier conversations to deliver more consistent, personalized answers over time — so you never repeat yourself to your AI again." },
    { h: "You're always in control", body: "Your memory is an editable profile tied to your account only. Review, edit or delete what's stored at any time. It's never shared with other users.", bullets: ["Private and encrypted", "Editable profile", "Delete anytime"] },
  ],
  faqs: [
    { q: "Is my memory private?", a: "Yes. Your memory profile is tied to your account only, is encrypted, and is never shared with other users." },
    { q: "Can I edit what the AI remembers?", a: "Yes. Memory is a single editable profile you can review, edit or delete at any time from your settings." },
    { q: "Does memory work across different models?", a: "Yes — that's the point. The same memory travels with you across GPT, Claude, Gemini and every other supported model." },
  ],
  related: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/models", label: "Supported models" },
    { href: "/pricing", label: "Pricing" },
  ],
  cta: { title: "Never start from scratch again", sub: "Give every AI model a memory that actually remembers you.", button: "Start free" },
};

export const memoria: SeoContent = {
  lang: "es",
  slug: "/memoria",
  alt: { lang: "en", path: "/memory" },
  breadcrumb: "Memoria",
  h1: "Memoria de IA persistente que viaja entre todos los modelos",
  highlight: "Memoria",
  lede:
    "OneChater construye una memoria privada por usuario para que tus asistentes recuerden tus preferencias, proyectos, objetivos y contexto a largo plazo — sin importar con qué modelo hables.",
  blocks: [
    { h: "Una memoria, todos los modelos", body: "Cambia entre GPT, Claude y Gemini sin perder información importante sobre ti o tus proyectos. Tu contexto se mantiene consistente en todas partes." },
    { h: "Aprendizaje progresivo", body: "OneChater recuerda detalles relevantes de conversaciones anteriores para dar respuestas más consistentes y personalizadas con el tiempo — para que nunca te repitas con tu IA." },
    { h: "Siempre tienes el control", body: "Tu memoria es un perfil editable ligado solo a tu cuenta. Revisa, edita o borra lo que se guarda en cualquier momento. Nunca se comparte con otros usuarios.", bullets: ["Privada y cifrada", "Perfil editable", "Bórrala cuando quieras"] },
  ],
  faqs: [
    { q: "¿Mi memoria es privada?", a: "Sí. Tu perfil de memoria está ligado solo a tu cuenta, está cifrado y nunca se comparte con otros usuarios." },
    { q: "¿Puedo editar lo que recuerda la IA?", a: "Sí. La memoria es un único perfil editable que puedes revisar, editar o borrar en cualquier momento desde tu configuración." },
    { q: "¿La memoria funciona entre modelos distintos?", a: "Sí, esa es la idea. La misma memoria viaja contigo entre GPT, Claude, Gemini y cualquier otro modelo compatible." },
  ],
  related: [
    { href: "/como-funciona", label: "Cómo funciona" },
    { href: "/modelos", label: "Modelos compatibles" },
    { href: "/precios", label: "Precios" },
  ],
  cta: { title: "Nunca vuelvas a empezar de cero", sub: "Dale a cada modelo de IA una memoria que de verdad te recuerde.", button: "Empieza gratis" },
};

export const models: SeoContent = {
  lang: "en",
  slug: "/models",
  alt: { lang: "es", path: "/modelos" },
  breadcrumb: "Models",
  h1: "Every AI model you use, in one place",
  highlight: "model",
  lede:
    "Connect your own API key for each provider and chat with GPT, Claude, Gemini and more from a single interface — paying each provider directly with no markup.",
  blocks: [
    { h: "Major providers, native support", body: "OpenAI (GPT), Anthropic (Claude) and Google (Gemini) are supported out of the box. Add your key and start chatting in seconds." },
    { h: "And any OpenAI-compatible endpoint", body: "Beyond the majors, OneChater works with Groq, Amazon Bedrock, Azure OpenAI, Replicate and any OpenAI-compatible endpoint — so you're never locked to one vendor." },
    { h: "Compare and fuse", body: "Run the same prompt across models side by side, then merge the best parts into one answer with Fusion." },
  ],
  faqs: [
    { q: "Which models does OneChater support?", a: "GPT (OpenAI), Claude (Anthropic) and Gemini (Google) natively, plus Groq, Amazon Bedrock, Azure OpenAI, Replicate and any OpenAI-compatible endpoint." },
    { q: "Do I pay OneChater for model usage?", a: "No. You bring your own API keys and pay each provider directly with no markup from OneChater." },
    { q: "Can I use more than one model at once?", a: "Yes — send one prompt and get answers from multiple models side by side, then optionally merge them with Fusion." },
  ],
  related: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/memory", label: "Persistent memory" },
    { href: "/fusion", label: "Fusion" },
  ],
  cta: { title: "All your models, one place", sub: "Bring your keys and chat with every major model without switching tabs.", button: "Start free" },
};

export const modelos: SeoContent = {
  lang: "es",
  slug: "/modelos",
  alt: { lang: "en", path: "/models" },
  breadcrumb: "Modelos",
  h1: "Todos los modelos de IA que usas, en un solo lugar",
  highlight: "modelos",
  lede:
    "Conecta tu propia API key para cada proveedor y chatea con GPT, Claude, Gemini y más desde una sola interfaz — pagando a cada proveedor directamente y sin recargo.",
  blocks: [
    { h: "Proveedores principales, soporte nativo", body: "OpenAI (GPT), Anthropic (Claude) y Google (Gemini) están soportados de fábrica. Agrega tu clave y empieza a chatear en segundos." },
    { h: "Y cualquier endpoint compatible con OpenAI", body: "Además de los principales, OneChater funciona con Groq, Amazon Bedrock, Azure OpenAI, Replicate y cualquier endpoint compatible con OpenAI — para que nunca dependas de un solo proveedor." },
    { h: "Compara y fusiona", body: "Lanza el mismo prompt en varios modelos lado a lado y fusiona lo mejor de cada uno en una sola respuesta con Fusión." },
  ],
  faqs: [
    { q: "¿Qué modelos soporta OneChater?", a: "GPT (OpenAI), Claude (Anthropic) y Gemini (Google) de forma nativa, además de Groq, Amazon Bedrock, Azure OpenAI, Replicate y cualquier endpoint compatible con OpenAI." },
    { q: "¿Le pago a OneChater por el uso de los modelos?", a: "No. Traes tus propias API keys y pagas a cada proveedor directamente, sin recargo de OneChater." },
    { q: "¿Puedo usar más de un modelo a la vez?", a: "Sí — envía un prompt y recibe respuestas de varios modelos lado a lado, y opcionalmente fusiónalas con Fusión." },
  ],
  related: [
    { href: "/como-funciona", label: "Cómo funciona" },
    { href: "/memoria", label: "Memoria persistente" },
    { href: "/fusion", label: "Fusión" },
  ],
  cta: { title: "Todos tus modelos, un solo lugar", sub: "Trae tus claves y chatea con todos los modelos sin cambiar de pestaña.", button: "Empieza gratis" },
};

export const fusion: SeoContent = {
  lang: "en",
  slug: "/fusion",
  breadcrumb: "Fusion",
  h1: "Fusion — merge GPT, Claude and Gemini into one answer",
  highlight: "Fusion",
  lede:
    "Ask once, get the combined intelligence of multiple models. Fusion sends your prompt to GPT, Claude and Gemini and merges their best parts into a single, stronger answer.",
  blocks: [
    { h: "One prompt, many minds", body: "Instead of jumping between tabs, send a single message and let several models answer in parallel. Fusion synthesizes them so you get the strongest response, not just the first one." },
    { h: "Best of every model", body: "Different models are good at different things. Fusion keeps the sharpest reasoning, the cleanest code and the clearest explanation from each — in one place." },
    { h: "Still your keys, still no markup", body: "Fusion runs on your own connected API keys. You pay each provider directly, exactly like a normal chat." },
  ],
  faqs: [
    { q: "What is Fusion?", a: "Fusion sends one prompt to multiple AI models (GPT, Claude, Gemini) at once and merges their answers into a single, combined response." },
    { q: "Does Fusion cost extra?", a: "Fusion uses your own API keys and you pay each provider directly — there's no markup from OneChater." },
    { q: "Can I still see each model's individual answer?", a: "Yes. You can compare each model side by side and also get the merged Fusion answer." },
  ],
  related: [
    { href: "/models", label: "Supported models" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/memory", label: "Persistent memory" },
  ],
  cta: { title: "Get the best of every model at once", sub: "Stop tab-hopping. Ask once and let Fusion merge the answers.", button: "Start free" },
};

export const pricing: SeoContent = {
  lang: "en",
  slug: "/pricing",
  alt: { lang: "es", path: "/precios" },
  breadcrumb: "Pricing",
  h1: "Simple pricing — bring your own keys, pay providers directly",
  highlight: "pricing",
  lede:
    "OneChater doesn't mark up your AI usage. You connect your own API keys and pay OpenAI, Anthropic and Google directly. No per-token markup, no surprise bills.",
  blocks: [
    { h: "Bring your own key (BYOK)", body: "Connect your own provider keys and pay each provider directly at their list price. OneChater never adds a markup on model usage." },
    { h: "Free to start", body: "Create an account and start chatting with free providers right away. Upgrade when you want the full multi-model experience and persistent memory across every model." },
    { h: "No lock-in", body: "Your keys, your data, your memory profile. Export or delete anytime. Cancel without losing access to the providers you already pay for." },
  ],
  faqs: [
    { q: "How much does OneChater cost?", a: "OneChater is bring-your-own-key: you pay each AI provider directly with no markup. You can start free and upgrade for the full multi-model experience." },
    { q: "Is there a free plan?", a: "Yes. You can start free with free providers and upgrade when you want all models plus persistent memory across every model." },
    { q: "Are there hidden per-token fees?", a: "No. OneChater never marks up model usage — you pay OpenAI, Anthropic or Google directly." },
  ],
  related: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/models", label: "Supported models" },
    { href: "/memory", label: "Persistent memory" },
  ],
  cta: { title: "Start free, pay providers directly", sub: "No markup on AI usage. Connect your keys and go.", button: "Start free" },
};

export const precios: SeoContent = {
  lang: "es",
  slug: "/precios",
  alt: { lang: "en", path: "/pricing" },
  breadcrumb: "Precios",
  h1: "Precios simples — trae tus claves y paga directo a los proveedores",
  highlight: "Precios",
  lede:
    "OneChater no le pone recargo a tu uso de IA. Conectas tus propias API keys y pagas a OpenAI, Anthropic y Google directamente. Sin recargo por token, sin facturas sorpresa.",
  blocks: [
    { h: "Trae tu propia clave (BYOK)", body: "Conecta tus claves de proveedor y paga a cada uno directamente a su precio de lista. OneChater nunca añade recargo sobre el uso de los modelos." },
    { h: "Gratis para empezar", body: "Crea una cuenta y empieza a chatear con proveedores gratuitos de inmediato. Mejora cuando quieras la experiencia multimodelo completa y memoria persistente entre todos los modelos." },
    { h: "Sin lock-in", body: "Tus claves, tus datos, tu perfil de memoria. Expórtalos o bórralos cuando quieras. Cancela sin perder acceso a los proveedores que ya pagas." },
  ],
  faqs: [
    { q: "¿Cuánto cuesta OneChater?", a: "OneChater es bring-your-own-key: pagas a cada proveedor de IA directamente, sin recargo. Puedes empezar gratis y mejorar para la experiencia multimodelo completa." },
    { q: "¿Hay un plan gratis?", a: "Sí. Puedes empezar gratis con proveedores gratuitos y mejorar cuando quieras todos los modelos más memoria persistente entre ellos." },
    { q: "¿Hay tarifas ocultas por token?", a: "No. OneChater nunca recarga el uso de los modelos — pagas a OpenAI, Anthropic o Google directamente." },
  ],
  related: [
    { href: "/como-funciona", label: "Cómo funciona" },
    { href: "/modelos", label: "Modelos compatibles" },
    { href: "/memoria", label: "Memoria persistente" },
  ],
  cta: { title: "Empieza gratis, paga directo a los proveedores", sub: "Sin recargo en el uso de IA. Conecta tus claves y listo.", button: "Empieza gratis" },
};
