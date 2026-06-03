## Quiero que uses esta skill para siempre hasta que yo te diga que pares

- Usa /caveman para que tus respuestas sean mas cortas, asi podemos ahorrar tokens. No lo relaciones con las tareas que te digo, es decir si te pido una cosa quiero que des lo mejor de ti para resolverlo, caveman solo sirve para las respuestas que me das

## Landing page (`app/page.tsx`)

- Una sola page client-side. Cada sección es su propio componente y se ensamblan en orden dentro de `HomeInner`:
  `HeroSection → FeaturesSection (#features) → HowItWorksSection (#how-it-works) → MemorySection (#memoria) → ModelsSection (#models) → TestimonialsSection (#testimonials) → PricingSection (#pricing) → CTASection → Footer`.
- Patrón de sección: `<section ref={sectionRef} id="..." className="relative py-10 md:py-14 px-5 md:px-6 overflow-hidden">` + `IntersectionObserver` que setea `inView` y aplica `card-item`/`in-view` para las animaciones al hacer scroll (con `animationDelay` escalonado).
- Estilo: usar `section-label` (eyebrow), clase `display` para títulos, `gradient-text` para resaltar palabras, y tarjetas `.premium-card glow-*` o `.feature-card` (ya traen variante dark).
- Modo oscuro: los grises de Tailwind (`text-gray-*`, `bg-white/gray-50`) se voltean solos vía overrides en `globals.css`; para estilos inline usar vars semánticas (`--surface`, `--surface-2`, `--text-*`, `--border`, `--shadow-*`). Ver [[project_dark_mode]].
- `MemorySection`: sección premium de "Memoria Persistente por Usuario" — diagrama Usuario → Memoria Personal → GPT/Claude/Gemini (conectores `.flow-path`, hub con `.memory-hub-pulse`) + 6 tarjetas (`MEMORY_CARDS`) + nota de control. Animaciones loop registradas en el guard de `prefers-reduced-motion`.
