import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { SignJWT } from "jose"
import { auth } from "@/auth"
import { TWOFA_COOKIE, verifyTwoFactor } from "@/lib/twofa-cookie"
import CliCode from "./CliCode"

// CLI login bridge. The OneChater CLI opens this page (with ?port=NNNN pointing
// at its local loopback server). If the visitor isn't signed in we bounce them
// through /login and back here. Once authenticated we mint a short-lived token
// and hand it to the CLI — by redirecting to its loopback when a port is given,
// or by showing a copy-paste code as a fallback.

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function mintCliToken(userId: string, email?: string | null): Promise<string> {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
  return new SignJWT({ scope: "cli", email: email ?? undefined })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret)
}

export default async function CliAuthPage({
  searchParams,
}: {
  searchParams: { port?: string }
}) {
  const port = typeof searchParams.port === "string" && /^\d{2,5}$/.test(searchParams.port)
    ? searchParams.port
    : ""

  const session = await auth()
  const back = `/cli${port ? `?port=${port}` : ""}`
  if (!session?.user?.id) {
    redirect(`/login?next=${encodeURIComponent(back)}`)
  }

  // Honour 2FA step-up: /cli isn't behind the middleware matcher, so enforce the
  // same device check here before handing the CLI a token.
  const user = session.user as { id: string; requires2fa?: boolean }
  if (user.requires2fa) {
    const cookie = (await cookies()).get(TWOFA_COOKIE)?.value
    if (!(await verifyTwoFactor(cookie, user.id))) {
      redirect(`/login/2fa?next=${encodeURIComponent(back)}`)
    }
  }

  const token = await mintCliToken(session.user.id, session.user.email)

  // Loopback present → hand the token straight to the running CLI and we're done.
  if (port) {
    redirect(`http://127.0.0.1:${port}/cb?token=${encodeURIComponent(token)}`)
  }

  // No loopback (browser couldn't reach the CLI, or it was opened manually) →
  // show the code so the user can paste it into the terminal.
  return <CliCode token={token} email={session.user.email ?? undefined} />
}
