# OneChat — Brief de Producto Completo

## Identidad

**Nombre:** OneChat
**Tagline:** Una memoria. Todas las IAs.
**One-liner:** La única app de chat con IA que NO te olvida cuando cambiás de modelo. GPT, Claude y Gemini en un solo lugar, con una memoria que viaja con vos.

---

## El problema

Hoy, usar varias IAs significa:

- Abrir 3+ pestañas (chat.openai.com, claude.ai, gemini.google.com)
- Empezar cada conversación de cero en cada plataforma
- Ninguna IA sabe lo que le contaste a las otras
- Cuando llegás al límite de uso de una, perdés contexto al saltar a otra
- Copiar y pegar contexto manualmente entre modelos
- Pagar 3 suscripciones distintas

## La solución

Un único chat que se conecta a múltiples modelos de IA mediante las API keys del propio usuario (BYOK — Bring Your Own Key), con una capa de memoria persistente que existe POR ENCIMA de los modelos.

---

## Features principales

### 1. Chat multi-modelo unificado

- Una sola interfaz para GPT, Claude, Gemini (y más a futuro)
- Selector de modelo manual + opción de cambio automático según tarea
- Historial unificado: todas las conversaciones en un solo lugar, sin importar qué modelo se usó
- Streaming de respuestas en tiempo real

### 2. Living Memory (diferenciador principal)

Sistema de memoria persistente propia del usuario, independiente de los modelos.

**Cómo funciona:**

- **Captura automática:** después de cada conversación, OneChat extrae datos relevantes con un modelo barato (Haiku/Gemini Flash): hechos del usuario, proyectos activos, preferencias de tono, stack técnico, decisiones tomadas.
- **Perfil vivo y editable:** el usuario tiene un "perfil de memoria" visible. Puede ver qué sabe OneChat sobre él, agregar, borrar, organizar por proyectos.
- **Inyección contextual inteligente:** antes de cada mensaje, OneChat selecciona qué partes de la memoria son relevantes y las inyecta optimizadas al context window del modelo elegido.
- **Búsqueda semántica del historial:** "¿qué decidimos sobre el cliente bancario el mes pasado?" busca en todas las conversaciones pasadas y trae el contexto.
- **Memoria portable entre modelos:** el usuario empieza con GPT, sigue con Claude, termina con Gemini. Los tres lo conocen.

### 3. BYOK puro (Bring Your Own Key)

- El usuario conecta sus propias API keys de cada proveedor
- OneChat NO intermedia los pagos de inferencia
- Las keys se guardan encriptadas (AES-256) en la base de datos
- El usuario paga directo a OpenAI/Anthropic/Google
- OneChat solo cobra suscripción por la app

### 4. Organización por proyectos

- Carpetas/proyectos para agrupar conversaciones
- Memoria específica por proyecto (la memoria del proyecto "Cliente A" no contamina al proyecto "Personal")
- Prompts guardados y reutilizables

### 5. Dashboard de gasto

- Visibilidad clara de cuánto gastó el user en cada modelo
- Comparativa: "esta misma pregunta hubiera costado X en GPT vs Y en Gemini"
- Alertas de consumo
- Presupuestos mensuales opcionales

---

## Diferenciación frente a competidores

|                              | ChatGPT    | Claude     | Poe     | TypingMind | OpenRouter | OneChat  |
| ---------------------------- | ---------- | ---------- | ------- | ---------- | ---------- | -------- |
| Multi-modelo                 | ❌         | ❌         | ✅      | ✅         | ✅ (API)   | ✅       |
| Memoria persistente          | ✅ interna | ✅ interna | ❌      | Limitada   | ❌         | ✅       |
| Memoria entre modelos        | ❌         | ❌         | ❌      | ❌         | ❌         | ✅ ÚNICO |
| Memoria editable por usuario | Limitada   | Limitada   | ❌      | ❌         | ❌         | ✅       |
| Organización por proyectos   | ❌         | ✅         | ❌      | Carpetas   | ❌         | ✅       |
| BYOK puro                    | ❌         | ❌         | ❌      | ✅         | ✅         | ✅       |
| Pagos locales LATAM          | ❌         | ❌         | ❌      | ❌         | ❌         | ✅       |
| Interfaz 100% en español     | Parcial    | Parcial    | Parcial | ❌         | ❌         | ✅       |
| Dashboard de gasto           | ❌         | ❌         | ❌      | Básico     | ✅         | ✅       |

---

## Audiencia objetivo

- **Primaria:** Profesionales independientes y freelancers en LATAM (devs, diseñadores, marketers, consultores)
- **Secundaria:** Agencias pequeñas (2-20 personas) que necesitan IA para el equipo
- **Terciaria:** Estudiantes universitarios y de posgrado

---

## Modelo de negocio

### Planes

- **Free:** BYOK, 100 mensajes con memoria al mes, 1 proyecto
- **Pro ($7 USD/mes):** BYOK + memoria ilimitada + búsqueda semántica + proyectos ilimitados + sync entre dispositivos + dashboard de gasto completo
- **Team ($19 USD/usuario/mes):** todo lo de Pro + workspace compartido + memoria de equipo + prompts compartidos + facturación consolidada

### Pagos

- Pagos en pesos argentinos, soles peruanos, pesos mexicanos, reales brasileños
- Mercado Pago, transferencia bancaria, tarjeta local
- Factura fiscal en cada país (cuando aplique)
- Stripe para pagos internacionales

### Por qué no intermediamos el consumo de IA

- El usuario paga directo a los proveedores con SUS keys
- Más privado: los datos van directo al proveedor
- Más barato: 0% de fee de plataforma sobre inferencia
- OneChat solo cobra suscripción por la interfaz y la memoria

---

## Stack técnico

### Frontend

- **Framework:** Next.js 14+ (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Estado:** Zustand o React Context
- **Hosting:** Vercel

### Backend

- **API routes:** Next.js API Routes / Server Actions
- **Base de datos:** Supabase (Postgres + auth + storage)
- **Embeddings/búsqueda semántica:** pgvector en Supabase
- **Encriptación de keys:** AES-256 con clave maestra en variables de entorno

### Integración con modelos

- **Librería:** Vercel AI SDK (NO usamos OpenRouter — el user trae keys directas)
- **Proveedores soportados al lanzar:** OpenAI, Anthropic, Google
- **Modelos a futuro:** xAI, DeepSeek, Mistral, Groq

### Memoria

- **Extracción:** modelo barato (Claude Haiku o Gemini Flash) corre después de cada chat
- **Almacenamiento:** tabla `user_memory` con campos estructurados (facts, preferences, projects, tone)
- **Embeddings:** text-embedding-3-small (OpenAI) o equivalente barato
- **Búsqueda semántica:** pgvector con índice HNSW

### Pagos

- **Stripe:** suscripciones internacionales
- **Mercado Pago:** suscripciones LATAM
- **Webhooks:** sincronización de estado de suscripción

### Otros

- **Auth:** Supabase Auth (email + Google)
- **Email:** Resend
- **Analytics:** PostHog
- **Errores:** Sentry

---

## Roadmap (90 días)

### Días 1-15: Validación

- Landing page simple en Carrd/Framer/Next.js
- Captura de emails para lista de espera
- Difusión en comunidades LATAM (Twitter/X, Reddit r/SideProject, Discord, comunidades de devs hispanohablantes)
- **Meta:** 100 emails en lista de espera

### Días 16-60: MVP

- Auth con Google
- Conexión de API keys (encriptadas) de OpenAI, Anthropic, Google
- Chat funcional con selector manual de modelo
- Historial de conversaciones
- Memoria básica (perfil del user editable)
- Stripe con un plan único: $7/mes

### Días 61-90: Primeros pagos

- Acceso early-bird a la lista de espera (50% off de por vida)
- Llamadas/DMs con cada usuario para feedback
- Iteración rápida basada en feedback real
- **Meta:** 20-50 usuarios pagos

### Post-MVP (mes 4+)

- Búsqueda semántica del historial
- Proyectos/workspaces
- Dashboard de gasto avanzado
- App móvil (React Native o PWA optimizada)
- Plan Team para equipos
- Integraciones MCP (Notion, Drive, Gmail)

---

## Principios de producto

1. **No al feature creep.** OneChat es un chat con memoria, no un agente, no un IDE, no controla la PC del user. Cada nuevo feature pasa el filtro: "¿esto me ayuda a vender más o me distrae?"

2. **BYOK es sagrado.** Nunca intermediamos pagos de inferencia. El user paga directo al proveedor. Esto es parte del pitch.

3. **Seguridad primero con las keys.** Encriptación at rest, nunca logueadas, nunca enviadas al cliente, HTTPS obligatorio. Términos claros con el user.

4. **LATAM first.** No copiamos productos gringos en inglés. Español neutro y regional, pagos locales, soporte humano en zona horaria.

5. **Validar antes de construir.** Cada feature nuevo arranca con una landing o una conversación con users reales, no con código.

6. **El moat real es la memoria.** Cualquiera puede hacer chat multi-modelo en una semana. Una memoria que funciona bien entre modelos requiere meses de pulido. Ese es nuestro foso.

---

## Lo que NO es OneChat (importante)

- ❌ NO es un agente que controla la PC del usuario
- ❌ NO es un IDE ni una herramienta de coding (eso es Cursor/Claude Code)
- ❌ NO es un automatizador de workflows (eso es n8n/Zapier)
- ❌ NO intermedia pagos de inferencia (eso es Poe/OpenRouter)
- ❌ NO es para developers que construyen apps (eso es OpenRouter API)
- ✅ ES un chat con IA con memoria persistente entre modelos, para uso diario.
