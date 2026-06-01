import { NextRequest } from "next/server"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const { messages, provider, apiKey, model, mode } = await req.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (mode === "image") {
          const prompt =
            [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? ""
          if (apiKey === "demo") await imageDemo(prompt, provider, controller, encoder)
          else if (provider === "openai") await imageOpenAI(prompt, apiKey, model, controller, encoder)
          else if (provider === "google") await imageGoogle(prompt, apiKey, model, controller, encoder)
          else if (provider === "xai") await imageXAI(prompt, apiKey, model, controller, encoder)
          else controller.enqueue(encoder.encode(`[Error: ${provider} no genera imágenes]`))
        } else if (apiKey === "demo") {
          await streamDemo(messages, provider, controller, encoder)
        } else if (provider === "openai") {
          await streamOpenAI(messages, apiKey, model, controller, encoder)
        } else if (provider === "anthropic") {
          await streamAnthropic(messages, apiKey, model, controller, encoder)
        } else if (provider === "google") {
          await streamGoogle(messages, apiKey, model, controller, encoder)
        } else if (provider === "groq") {
          await streamGroq(messages, apiKey, model, controller, encoder)
        } else if (provider === "openrouter") {
          await streamOpenRouter(messages, apiKey, model, controller, encoder)
        } else if (provider === "xai") {
          await streamOpenAICompat("https://api.x.ai/v1/chat/completions", "xAI", messages, apiKey, model || "grok-4.3", controller, encoder)
        } else if (provider === "mistral") {
          await streamOpenAICompat("https://api.mistral.ai/v1/chat/completions", "Mistral", messages, apiKey, model || "mistral-large-latest", controller, encoder)
        } else if (provider === "deepseek") {
          await streamOpenAICompat("https://api.deepseek.com/v1/chat/completions", "DeepSeek", messages, apiKey, model || "deepseek-chat", controller, encoder)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido"
        controller.enqueue(encoder.encode(`\n[Error: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  })
}

async function streamOpenAI(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: model || "gpt-5.5", messages, stream: true }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`)
  }

  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const data = line.slice(6).trim()
      if (data === "[DONE]") continue
      try {
        const json = JSON.parse(data)
        const text: string | undefined = json.choices?.[0]?.delta?.content
        if (text) controller.enqueue(encoder.encode(text))
      } catch {}
    }
  }
}

async function streamAnthropic(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model || "claude-sonnet-4-6",
      max_tokens: 4096,
      messages,
      stream: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`)
  }

  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const data = line.slice(6).trim()
      try {
        const json = JSON.parse(data)
        if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
          controller.enqueue(encoder.encode(json.delta.text))
        }
      } catch {}
    }
  }
}

// ─── Demo mode ────────────────────────────────────────────────────────────────

const DEMO_PERSONAS: Record<string, { intro: string; style: string }> = {
  openai: {
    intro: "GPT-4o",
    style: "Respondo de forma directa y estructurada.",
  },
  anthropic: {
    intro: "Claude",
    style: "Prefiero dar contexto antes de la respuesta concreta.",
  },
  google: {
    intro: "Gemini",
    style: "Aporto perspectivas adicionales y ejemplos prácticos.",
  },
  groq: {
    intro: "Llama (Groq)",
    style: "Respondo ultra rápido con inferencia acelerada.",
  },
}

function buildDemoResponse(provider: string, messages: { role: string; content: string }[]): string {
  const persona = DEMO_PERSONAS[provider] ?? { intro: provider, style: "" }
  const userMessages = messages.filter((m) => m.role === "user")
  const lastUser = userMessages[userMessages.length - 1]?.content ?? ""

  // Detect synthesis request (fusion mode)
  if (lastUser.includes("[GPT-4o]:") || lastUser.includes("[Claude]:") || lastUser.includes("[Gemini]:")) {
    return `Esta es una respuesta fusionada de demostración, sintetizando los aportes de GPT-4o, Claude y Gemini.\n\nEn producción, este modelo analizaría las tres respuestas individuales y produciría una síntesis superior que:\n\n• Combina los mejores argumentos de cada modelo\n• Elimina redundancias y contradicciones\n• Presenta la información de forma clara y unificada\n\nLa fusión de IAs te da lo mejor de cada modelo en una sola respuesta coherente.`
  }

  const isFollowUp = userMessages.length > 1
  const hasPreviousContext = messages.some(
    (m) => m.role === "assistant" && m.content.includes("[")
  )

  const topic = lastUser.slice(0, 60) + (lastUser.length > 60 ? "…" : "")

  let response = `**${persona.intro}** — Modo demo\n\n`

  if (isFollowUp && hasPreviousContext) {
    response += `Retomando el contexto compartido de esta conversación, respondo a "${topic}".\n\n`
    response += `${persona.style} Esta es la respuesta ${userMessages.length} de nuestra sesión — podés ver que mantengo contexto de lo que dijeron los otros modelos anteriormente.\n\n`
    response += `En producción con tu API key real, aquí aparecería mi análisis completo sobre tu consulta, basado en todo lo que se ha discutido en este chat (incluyendo las respuestas de los demás modelos).\n\n`
    response += `✓ Contexto compartido activo\n✓ Streaming en tiempo real\n✓ Respuestas simultáneas de todos los modelos`
  } else {
    response += `Esta es una respuesta simulada para que puedas probar la interfaz sin necesitar API keys reales.\n\n`
    response += `${persona.style}\n\n`
    response += `Cuando conectes tu key de verdad, responderé a "${topic}" con mi análisis completo en tiempo real.\n\n`
    response += `**Funcionalidades que ya están activas:**\n`
    response += `• Streaming simultáneo de múltiples modelos\n`
    response += `• Contexto compartido entre todas las IAs\n`
    response += `• Historial persistente por sesión`
  }

  return response
}

async function streamDemo(
  messages: { role: string; content: string }[],
  provider: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const text = buildDemoResponse(provider, messages)
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

  // Stream word by word to simulate realistic typing
  const words = text.split(" ")
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? "" : " ") + words[i]
    controller.enqueue(encoder.encode(chunk))
    // Vary speed: faster for normal words, slight pause at punctuation
    const hasPunct = /[.,!?:\n]/.test(words[i])
    await delay(hasPunct ? 60 : 25)
  }
}

async function streamGoogle(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  type GMsg = { role: "user" | "model"; parts: { text: string }[] }
  const googleMessages = messages.reduce<GMsg[]>((acc, m) => {
    const role: "user" | "model" = m.role === "assistant" ? "model" : "user"
    if (acc.length > 0 && acc[acc.length - 1].role === role) {
      acc[acc.length - 1].parts[0].text += "\n" + m.content
    } else {
      acc.push({ role, parts: [{ text: m.content }] })
    }
    return acc
  }, [])

  const modelName = model || "gemini-2.5-flash"
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: googleMessages }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = await res.json()
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const words = text.split(" ")
  for (let i = 0; i < words.length; i++) {
    controller.enqueue(encoder.encode((i === 0 ? "" : " ") + words[i]))
    await delay(18)
  }
}

async function streamGroq(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: model || "llama-3.3-70b-versatile", messages, stream: true }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq ${res.status}: ${text.slice(0, 200)}`)
  }

  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const data = line.slice(6).trim()
      if (data === "[DONE]") continue
      try {
        const json = JSON.parse(data)
        const text: string | undefined = json.choices?.[0]?.delta?.content
        if (text) controller.enqueue(encoder.encode(text))
      } catch {}
    }
  }
}

async function streamOpenAICompat(
  baseUrl: string,
  providerName: string,
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${providerName} ${res.status}: ${text.slice(0, 200)}`)
  }

  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const data = line.slice(6).trim()
      if (data === "[DONE]") continue
      try {
        const json = JSON.parse(data)
        const text: string | undefined = json.choices?.[0]?.delta?.content
        if (text) controller.enqueue(encoder.encode(text))
      } catch {}
    }
  }
}

// ─── Image generation ──────────────────────────────────────────────────────────
// Cada función emite UNA sola data URL (base64) como contenido del stream.
// El front detecta el prefijo `data:image` y renderiza <img> en vez de texto.

async function imageOpenAI(
  prompt: string,
  apiKey: string,
  model: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const m = model || "dall-e-3"
  const body: Record<string, unknown> = { model: m, prompt, n: 1, size: "1024x1024" }
  // gpt-image-1 devuelve b64 por defecto y rechaza response_format; DALL·E sí lo necesita.
  if (m.startsWith("dall-e")) body.response_format = "b64_json"

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`)

  const json = await res.json()
  const b64: string | undefined = json.data?.[0]?.b64_json
  if (!b64) throw new Error("OpenAI no devolvió imagen")
  controller.enqueue(encoder.encode(`data:image/png;base64,${b64}`))
}

async function imageXAI(
  prompt: string,
  apiKey: string,
  model: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: model || "grok-2-image", prompt, response_format: "b64_json", n: 1 }),
  })
  if (!res.ok) throw new Error(`xAI ${res.status}: ${(await res.text()).slice(0, 200)}`)

  const json = await res.json()
  const b64: string | undefined = json.data?.[0]?.b64_json
  if (!b64) throw new Error("xAI no devolvió imagen")
  controller.enqueue(encoder.encode(`data:image/png;base64,${b64}`))
}

async function imageGoogle(
  prompt: string,
  apiKey: string,
  model: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const modelName = model || "gemini-2.5-flash-image"
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    }
  )
  if (!res.ok) throw new Error(`Google ${res.status}: ${(await res.text()).slice(0, 200)}`)

  const json = await res.json()
  const parts: { inlineData?: { mimeType?: string; data?: string } }[] =
    json.candidates?.[0]?.content?.parts ?? []
  const img = parts.find((p) => p.inlineData?.data)
  if (!img?.inlineData?.data) throw new Error("Gemini no devolvió imagen")
  const mime = img.inlineData.mimeType || "image/png"
  controller.enqueue(encoder.encode(`data:${mime};base64,${img.inlineData.data}`))
}

async function imageDemo(
  prompt: string,
  provider: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const colors: Record<string, [string, string]> = {
    openai: ["#10b981", "#059669"],
    google: ["#3b82f6", "#2563eb"],
    xai: ["#0f0f0f", "#374151"],
  }
  const [c1, c2] = colors[provider] ?? ["#f97316", "#ea580c"]
  const label = prompt.slice(0, 40).replace(/[<>&]/g, "")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="512" height="512" fill="url(#g)"/>
    <text x="256" y="240" font-family="sans-serif" font-size="26" fill="white" text-anchor="middle" font-weight="bold">Imagen demo</text>
    <text x="256" y="280" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.85)" text-anchor="middle">${label}</text>
  </svg>`
  const b64 = Buffer.from(svg).toString("base64")
  await new Promise((r) => setTimeout(r, 600))
  controller.enqueue(encoder.encode(`data:image/svg+xml;base64,${b64}`))
}

async function streamOpenRouter(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://onechat.app",
      "X-Title": "OneChater",
    },
    body: JSON.stringify({ model: model || "nvidia/nemotron-3-super-120b-a12b:free", messages, stream: true }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`)
  }

  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const data = line.slice(6).trim()
      if (data === "[DONE]") continue
      try {
        const json = JSON.parse(data)
        const text: string | undefined = json.choices?.[0]?.delta?.content
        if (text) controller.enqueue(encoder.encode(text))
      } catch {}
    }
  }
}
