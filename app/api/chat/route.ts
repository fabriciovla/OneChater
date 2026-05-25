import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const { messages, provider, apiKey, model } = await req.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (apiKey === "demo") {
          await streamDemo(messages, provider, controller, encoder)
        } else if (provider === "openai") {
          await streamOpenAI(messages, apiKey, model, controller, encoder)
        } else if (provider === "anthropic") {
          await streamAnthropic(messages, apiKey, model, controller, encoder)
        } else if (provider === "google") {
          await streamGoogle(messages, apiKey, model, controller, encoder)
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
    body: JSON.stringify({ model: model || "gpt-4o", messages, stream: true }),
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
      model: model || "claude-3-5-sonnet-20241022",
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
  // Convert to Google format — merge consecutive same-role messages
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

  const modelName = model || "gemini-1.5-flash"
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`,
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
        const text: string | undefined = json.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) controller.enqueue(encoder.encode(text))
      } catch {}
    }
  }
}
