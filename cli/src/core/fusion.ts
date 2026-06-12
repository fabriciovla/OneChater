import {
  type Config,
  type Provider,
  PROVIDER_NAMES,
  getProviderConfig,
} from "./config.js"
import {
  type ChatMessage,
  type ImageAttachment,
  collectChat,
} from "./providers.js"

// Ports the web app's chat + fusion logic to the terminal:
//   • Every connected model answers with a shared, memory-aware system prompt.
//   • If 2+ models are connected they "think together": each answers
//     independently, then the first model synthesizes ONE superior answer.
//   • The whole conversation (a list of {user, assistant} turns) is shared
//     context, so every model sees what was said before — its memory.

export type Turn = { user: string; assistant: string }
export type FusionPart = { provider: Provider; model: string; answer: string; error?: string }

const MEMORY_PROFILE_MAX = 8000

// The per-model system prompt — mirror of the web app's buildSystemPrompt. Tells
// the model it's on a multi-model platform, that history is shared memory, and
// injects the persistent user memory profile.
function buildSystemPrompt(provider: Provider, active: Provider[], memory: string): ChatMessage {
  const name = PROVIDER_NAMES[provider]
  const others = active.filter((p) => p !== provider).map((p) => PROVIDER_NAMES[p])
  const othersStr = others.length ? ` alongside ${others.join(" and ")}` : ""
  const profile = memory.trim()
  const memBlock = profile
    ? `\n\nUSER MEMORY PROFILE (learned from previous conversations; valid for EVERY chat with ANY model):\n"""\n${profile.slice(0, MEMORY_PROFILE_MAX)}\n"""\n\nUse this memory when relevant. Don't recite it back or say "according to my memory"; just act like someone who already knows the user and their context.`
    : ""
  return {
    role: "system",
    content: `You are ${name} on a multi-model chat platform${othersStr}.

CRITICAL RULE: The conversation history contains answers from ALL participating models. Each assistant answer is prefixed like [${name}]:${others.map((n) => ` [${n}]:`).join("")} to indicate which model said what. This history IS your shared memory.

IMPORTANT: Answer DIRECTLY without including any prefix like [${name}]: at the start. Never copy that format into your answer. NEVER say you don't have access to what other models said. Always answer in the user's language.${memBlock}`,
  }
}

// Full message list for one provider: system prompt + prior turns + new message.
// `extraSystem` appends to the system prompt (used to add the tools protocol).
export function buildHistory(
  turns: Turn[],
  active: Provider[],
  provider: Provider,
  memory: string,
  newMessage: string,
  extraSystem = "",
  images?: ImageAttachment[]
): ChatMessage[] {
  const base = buildSystemPrompt(provider, active, memory)
  const sys: ChatMessage = extraSystem
    ? { role: "system", content: base.content + "\n\n" + extraSystem }
    : base
  const msgs: ChatMessage[] = [sys]
  for (const t of turns) {
    msgs.push({ role: "user", content: t.user })
    if (t.assistant.trim()) msgs.push({ role: "assistant", content: t.assistant })
  }
  msgs.push({ role: "user", content: newMessage, ...(images?.length ? { images } : {}) })
  return msgs
}

// Phase 1 — every active model answers the question in parallel (full text). A
// model that errors or has no key is reported, not fatal. Each gets its own
// memory-aware shared history.
export async function gatherFusion(
  turns: Turn[],
  active: Provider[],
  cfg: Config,
  memory: string,
  question: string,
  extraSystem = "",
  images?: ImageAttachment[],
  // Live progress: called as each model finishes (or fails), so the terminal
  // can show who's done instead of a blind spinner.
  onUpdate?: (provider: Provider, status: "done" | "error") => void
): Promise<FusionPart[]> {
  return Promise.all(
    active.map(async (provider): Promise<FusionPart> => {
      const { apiKey, model } = getProviderConfig(cfg, provider)
      try {
        const messages = buildHistory(turns, active, provider, memory, question, extraSystem, images)
        const answer = await collectChat(provider, apiKey, model, messages)
        onUpdate?.(provider, "done")
        return { provider, model, answer }
      } catch (err) {
        onUpdate?.(provider, "error")
        return {
          provider,
          model,
          answer: "",
          error: err instanceof Error ? err.message : "unknown error",
        }
      }
    })
  )
}

// Phase 2 — message list for the synthesizer: prior turns + a synthesis request
// built from every model's contribution. The caller runs this through the agent
// loop, so the synthesizer can also use tools to act, not just answer.
export function buildSynthesisMessages(
  turns: Turn[],
  parts: FusionPart[],
  question: string,
  images?: ImageAttachment[]
): ChatMessage[] {
  const contributions = parts
    .filter((p) => p.answer.trim())
    .map((p) => `[${PROVIDER_NAMES[p.provider]}]:\n${p.answer.trim()}`)
    .join("\n\n---\n\n")

  const synthesisMsg =
    `Below are the answers from different AI models to the user's question: "${question}"\n\n` +
    contributions +
    `\n\nSynthesize these answers into ONE single unified, clear and complete answer. Take the best insights from each model, remove redundancies and present the information coherently. If the task requires acting on the workspace, USE THE TOOLS to do it — ignore any model that claimed it cannot access the system. Answer directly and naturally, without mentioning that you're synthesizing or referencing the models by name. Always answer in the user's language.`

  const messages: ChatMessage[] = []
  for (const t of turns) {
    messages.push({ role: "user", content: t.user })
    if (t.assistant.trim()) messages.push({ role: "assistant", content: t.assistant })
  }
  messages.push({ role: "user", content: synthesisMsg, ...(images?.length ? { images } : {}) })
  return messages
}
