import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { platform } from "node:os"
import {
  type Config,
  isProvider,
  setProviderKey,
  setProviderModel,
  setWebSession,
} from "./config.js"

// OneChater web login. The CLI stays BYOK/local-first, but `/login` links it to
// the user's onechater.com account so the API keys they already saved on the web
// (stored AES-encrypted server-side) are pulled down and connected here too —
// no re-pasting keys per machine.
//
// Flow (like `gh auth login` / `vercel login`): the CLI spins up a throwaway
// loopback server, opens the browser to the web's /cli page with that port. The
// web signs the user in (if needed) and redirects the browser back to the
// loopback with a short-lived token. Browser → terminal, no copy-paste. If the
// loopback can't be reached, the user pastes a code from /cli instead.

// Override for local dev / self-host: ONECHATER_WEB=http://localhost:3000
export const WEB_BASE = (process.env.ONECHATER_WEB ?? "https://www.onechater.com").replace(/\/+$/, "")

// Page that signs in and hands the token back. With ?port it bounces to the
// loopback; without it, it shows a paste-able code.
export const CLI_PAGE = `${WEB_BASE}/cli`
export const loginUrl = (port: number) => `${CLI_PAGE}?port=${port}`

// Best-effort open a URL in the default browser (no-op if it fails — the user
// can always paste the URL by hand).
export function openBrowser(url: string): void {
  try {
    const p = platform()
    const [cmd, args] =
      p === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : p === "darwin"
          ? ["open", [url]]
          : ["xdg-open", [url]]
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref()
  } catch {}
}

const DONE_HTML =
  "<!doctype html><meta charset=utf-8><title>OneChater CLI</title>" +
  "<body style='font-family:system-ui;background:#0b0b0f;color:#f5f5f7;display:grid;place-items:center;height:100vh;margin:0'>" +
  "<div style='text-align:center'><h2>You're signed in ✓</h2><p style='opacity:.6'>Return to your terminal — you can close this tab.</p></div>"

export type Loopback = {
  port: number
  waitForToken: (timeoutMs: number) => Promise<string | null>
  close: () => void
}

// Start a loopback server on an ephemeral 127.0.0.1 port. The web redirects the
// browser to http://127.0.0.1:<port>/cb?token=… once the user is authenticated.
export function createLoopback(): Promise<Loopback> {
  return new Promise((resolve, reject) => {
    let pending: { resolve: (t: string | null) => void; timer: ReturnType<typeof setTimeout> } | null = null

    const server = createServer((req, res) => {
      let token: string | null = null
      try {
        const u = new URL(req.url ?? "/", "http://127.0.0.1")
        // Only the callback path carries the token — ignore favicon/other probes
        // so a stray request can't be mistaken for the auth redirect.
        if (u.pathname === "/cb") token = u.searchParams.get("token")
      } catch {}
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      res.end(DONE_HTML)
      if (token && pending) {
        clearTimeout(pending.timer)
        pending.resolve(token)
        pending = null
      }
    })

    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address()
      const port = addr && typeof addr === "object" ? addr.port : 0
      resolve({
        port,
        waitForToken: (timeoutMs) =>
          new Promise<string | null>((res2) => {
            const timer = setTimeout(() => {
              pending = null
              res2(null)
            }, timeoutMs)
            pending = { resolve: res2, timer }
          }),
        close: () => {
          try {
            server.close()
          } catch {}
        },
      })
    })
  })
}

type ProvidersResponse = {
  email?: string
  plan?: string
  allowedProviders?: string[] | null
  sessionToken?: string
  providers?: { provider: string; apiKey?: string; model?: string }[]
}

// Thrown when the server rejects our token — the caller should send the user
// back through a fresh browser login instead of retrying.
export class TokenRejectedError extends Error {
  constructor() {
    super("session expired — sign in again")
    this.name = "TokenRejectedError"
  }
}

// Exchange a CLI token for the account's plan + connected providers and merge
// them into the local config. The server also hands back a fresh 30-day session
// token (stored in place of the short-lived login one) so the CLI can re-check
// the plan on every startup. Returns the updated config + how many synced, or
// throws (TokenRejectedError on a bad token).
export async function syncFromWeb(
  cfg: Config,
  token: string
): Promise<{ cfg: Config; email?: string; plan?: string; count: number }> {
  const res = await fetch(`${WEB_BASE}/api/cli/providers`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
  if (res.status === 401 || res.status === 403) {
    throw new TokenRejectedError()
  }
  if (!res.ok) {
    throw new Error(`${WEB_BASE} responded ${res.status}`)
  }
  const data = (await res.json()) as ProvidersResponse

  const allowed = Array.isArray(data.allowedProviders)
    ? data.allowedProviders.filter(isProvider)
    : undefined
  let next = setWebSession(cfg, {
    token: data.sessionToken?.trim() || token,
    email: data.email,
    plan: data.plan,
    allowedProviders: allowed,
  })
  let count = 0
  for (const entry of data.providers ?? []) {
    if (!isProvider(entry.provider) || !entry.apiKey?.trim()) continue
    // Belt-and-braces: the server already filters plan-locked providers out.
    if (allowed && !allowed.includes(entry.provider)) continue
    next = setProviderKey(next, entry.provider, entry.apiKey.trim())
    if (entry.model?.trim()) next = setProviderModel(next, entry.provider, entry.model.trim())
    count++
  }
  return { cfg: next, email: data.email, plan: data.plan, count }
}
