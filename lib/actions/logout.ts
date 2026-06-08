"use server"
import { cookies } from "next/headers"
import { TWOFA_COOKIE } from "@/lib/twofa-cookie"

// Clear the 2FA step-up cookie so the next sign-in re-challenges TOTP (if the
// user has 2FA enabled). NextAuth's built-in signout flow does NOT clear it.
//
// NOTE: the actual sign-out + redirect is done client-side via next-auth/react's
// `signOut()`. A server-action `signOut({ redirectTo })` fired from an onClick
// handler throws NEXT_REDIRECT that the client never follows — so the button
// appeared to "do nothing". This action only clears the cookie (no redirect).
export async function clearTwofaCookie() {
  ;(await cookies()).delete(TWOFA_COOKIE)
}
