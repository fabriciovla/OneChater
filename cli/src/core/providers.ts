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
      let json: any
      try {
        json = JSON.parse(data)
      } catch {
        continue // a partial chunk — wait for the rest
      }
      // Some providers (OpenRouter, Groq free tier…) return HTTP 200 and report
      // the failure as an `error` event inside the stream. Surface it instead of
      // silently producing an empty answer.
      if (json && json.error) {
        const e = json.error
        throw new Error(typeof e === "string" ? e : e?.message ?? JSON.stringify(e))
      }
      const text = pick(json)
      if (text) yield text
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

// Anthropic REQUIRES max_tokens, and it's a hard cap on the reply — too low and
// a long answer gets cut off mid-sentence. Pick the model's real output ceiling
// so verbose replies finish. It's only a cap (you pay for tokens generated, not
// the limit), so erring high is free. Claude 3 opus/sonnet/haiku top out at
// 4096; 3.5 at 8192; 3.7 and the 4.x family go much higher.
function anthropicMaxTokens(model: string): number {
  const m = model.toLowerCase()
  if (/claude-(opus|sonnet|haiku)-4/.test(m)) return 32000 // Claude 4.x
  if (/claude-3[-.]7/.test(m)) return 32000 // Claude 3.7
  if (/claude-3[-.]5/.test(m)) return 8192 // Claude 3.5
  return 4096 // Claude 3 (opus/sonnet/haiku) and unknown — safe floor
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
      max_tokens: anthropicMaxTokens(model),
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

// Cohere's Chat v2 API. OpenAI-ish message shape but its own SSE event format:
// each `data:` is an event object; text lives in delta.message.content.text.
async function* streamCohere(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const res = await fetch("https://api.cohere.com/v2/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  })
  yield* sseText(res, (j) =>
    j.type === "content-delta" ? j.delta?.message?.content?.text : undefined
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
    case "perplexity":
      return streamOpenAICompat("https://api.perplexity.ai/chat/completions", apiKey, model, messages)
    case "together":
      return streamOpenAICompat("https://api.together.xyz/v1/chat/completions", apiKey, model, messages)
    case "fireworks":
      return streamOpenAICompat("https://api.fireworks.ai/inference/v1/chat/completions", apiKey, model, messages)
    case "cerebras":
      return streamOpenAICompat("https://api.cerebras.ai/v1/chat/completions", apiKey, model, messages)
    case "moonshot":
      return streamOpenAICompat("https://api.moonshot.ai/v1/chat/completions", apiKey, model, messages)
    case "qwen":
      return streamOpenAICompat("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", apiKey, model, messages)
    case "cohere":
      return streamCohere(apiKey, model, messages)
  }
}

// Shorten a provider's own message for inline display.
function trimMsg(s: string): string {
  const t = s.trim().replace(/\s+/g, " ")
  return t.length > 140 ? t.slice(0, 139) + "…" : t
}

// Turn a raw provider/API failure into a calm, plain-language explanation. We
// never dump the raw JSON/HTTP blob at the user — just what happened and a next
// step. `summary` is the one-liner, `hint` the suggested action, and `short` a
// compact label for tight spots (the fusion "skipped" note). `providerLabel` is
// the friendly model name (e.g. "Kimi", "Claude") when known.
export function humanizeProviderError(
  err: unknown,
  providerLabel = "the model"
): { summary: string; hint?: string; short: string } {
  const raw = err instanceof Error ? err.message : String(err ?? "")
  const lower = raw.toLowerCase()
  const P = providerLabel

  // HTTP status, when the message starts with "404: …", "401: …", etc.
  const status = Number(raw.match(/^(\d{3})\b/)?.[1] ?? 0)

  // Provider's own message + code from an embedded JSON body, if any.
  let apiMessage = ""
  let apiCode = ""
  const jsonStart = raw.indexOf("{")
  if (jsonStart !== -1) {
    try {
      const j: any = JSON.parse(raw.slice(jsonStart))
      const e = j?.error ?? j
      apiMessage = typeof e?.message === "string" ? e.message : ""
      apiCode = typeof e?.code === "string" ? e.code : typeof e?.type === "string" ? e.type : ""
    } catch {}
  }
  const hay = `${apiMessage} ${apiCode} ${lower}`.toLowerCase()
  const model = raw.match(/`([^`]+)`/)?.[1] // model id is usually backticked

  // Network / connection — no HTTP status ever reached us.
  if (!status && /fetch failed|enotfound|econnrefused|econnreset|etimedout|getaddrinfo|network|dns/.test(lower)) {
    return {
      summary: `Couldn't reach ${P} — looks like a network or connection issue.`,
      hint: "Check your internet connection and try again.",
      short: "connection issue",
    }
  }
  if (/timed out|timeout/.test(lower)) {
    return { summary: `${P} took too long to respond.`, hint: "Try again in a moment.", short: "timed out" }
  }
  // Model not available / no access.
  if (status === 404 || /model_not_found|does not exist|do not have access|no such model|not found/.test(hay)) {
    return {
      summary: model
        ? `The "${model}" model isn't available on your ${P} account.`
        : `That ${P} model isn't available on your account.`,
      hint: "Pick a different model with /model.",
      short: "model not available",
    }
  }
  // Authentication / permission.
  if (status === 401 || status === 403 || /invalid_api_key|authentication|unauthorized|permission|invalid api key/.test(hay)) {
    return {
      summary: `Your ${P} API key was rejected — it may be wrong, expired, or lack access.`,
      hint: "Update the key in /providers.",
      short: "key rejected",
    }
  }
  // Rate limit / quota / billing.
  if (status === 429 || /rate.?limit|too many requests|quota|insufficient_quota|billing|credit|payment required/.test(hay)) {
    return {
      summary: `${P} is rate-limiting you, or your quota/credit is used up.`,
      hint: `Wait a moment and retry, or check your ${P} plan.`,
      short: "rate-limited",
    }
  }
  // Provider down / overloaded.
  if ((status >= 500 && status <= 599) || /overloaded|server error|service unavailable|try again later/.test(hay)) {
    return {
      summary: `${P} is busy or temporarily down right now.`,
      hint: "Try again in a few seconds.",
      short: "provider busy",
    }
  }
  // Bad request — surface the provider's own message if it's readable.
  if (status === 400 || /invalid_request|bad request/.test(hay)) {
    return {
      summary: apiMessage ? `${P} couldn't process the request: ${trimMsg(apiMessage)}` : `${P} couldn't process the request.`,
      short: "request rejected",
    }
  }
  // Our own already-friendly messages ("no API key …", "no model returned …").
  if (!status && !apiMessage && raw && raw.length < 120) {
    return { summary: raw, short: "unavailable" }
  }
  // Fallback — the parsed message, never the raw blob.
  return {
    summary: apiMessage ? `${P}: ${trimMsg(apiMessage)}` : `Something went wrong talking to ${P}.`,
    hint: "Try again, or switch models with /model.",
    short: "unavailable",
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
