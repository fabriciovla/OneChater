import type { Provider } from "./config.js"

// Ported from the web app's /api/chat route, reshaped as async generators that
// yield text chunks — the natural shape for a terminal that prints as it reads.
// BYOK: the caller passes the user's own apiKey; nothing is proxied.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

// Split an SSE stream into `data:` payloads, yielding the extracted text via the
// provided picker. Shared by every OpenAI-compatible provider.
async function* sseText(
  res: Response,
  pick: (json: any) => string | undefined
): AsyncGenerator<string> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text.slice(0, 200)}`)
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
        const text = pick(JSON.parse(data))
        if (text) yield text
      } catch {}
    }
  }
}

const openAICompatChunk = (j: any): string | undefined => j.choices?.[0]?.delta?.content

async function* streamOpenAICompat(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  extraHeaders: Record<string, string> = {}
): AsyncGenerator<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  })
  yield* sseText(res, openAICompatChunk)
}

async function* streamAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  // Anthropic takes the system prompt as a top-level field, not a message.
  const system = messages.find((m) => m.role === "system")?.content
  const convo = messages.filter((m) => m.role !== "system")
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      ...(system ? { system } : {}),
      messages: convo,
      stream: true,
    }),
  })
  yield* sseText(res, (j) =>
    j.type === "content_block_delta" && j.delta?.type === "text_delta"
      ? j.delta.text
      : undefined
  )
}

async function* streamGoogle(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  // Gemini wants alternating user/model turns; fold system into the first user
  // turn and merge consecutive same-role turns.
  const system = messages.find((m) => m.role === "system")?.content
  type GMsg = { role: "user" | "model"; parts: { text: string }[] }
  const contents = messages
    .filter((m) => m.role !== "system")
    .reduce<GMsg[]>((acc, m, idx) => {
      const role: "user" | "model" = m.role === "assistant" ? "model" : "user"
      let text = m.content
      if (idx === 0 && system && role === "user") text = `${system}\n\n${text}`
      if (acc.length && acc[acc.length - 1].role === role) {
        acc[acc.length - 1].parts[0].text += "\n" + text
      } else {
        acc.push({ role, parts: [{ text }] })
      }
      return acc
    }, [])

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    }
  )
  yield* sseText(res, (j) => j.candidates?.[0]?.content?.parts?.[0]?.text)
}

// Single entry point: dispatch by provider, return a chunk generator. The caller
// (REPL or fusion) just iterates and prints.
export function streamChat(
  provider: Provider,
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  switch (provider) {
    case "openai":
      return streamOpenAICompat("https://api.openai.com/v1/chat/completions", apiKey, model, messages)
    case "anthropic":
      return streamAnthropic(apiKey, model, messages)
    case "google":
      return streamGoogle(apiKey, model, messages)
    case "groq":
      return streamOpenAICompat("https://api.groq.com/openai/v1/chat/completions", apiKey, model, messages)
    case "openrouter":
      return streamOpenAICompat("https://openrouter.ai/api/v1/chat/completions", apiKey, model, messages, {
        "HTTP-Referer": "https://onechater.app",
        "X-Title": "OneChater CLI",
      })
    case "xai":
      return streamOpenAICompat("https://api.x.ai/v1/chat/completions", apiKey, model, messages)
    case "mistral":
      return streamOpenAICompat("https://api.mistral.ai/v1/chat/completions", apiKey, model, messages)
    case "deepseek":
      return streamOpenAICompat("https://api.deepseek.com/v1/chat/completions", apiKey, model, messages)
  }
}

// Collect a full (non-streamed) answer — used by fusion when gathering each
// model's contribution before synthesis.
export async function collectChat(
  provider: Provider,
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  let out = ""
  for await (const chunk of streamChat(provider, apiKey, model, messages)) out += chunk
  return out
}
