"use server"
import { signOut } from "@/auth"
import { cookies } from "next/headers"
import { TWOFA_COOKIE } from "@/lib/twofa-cookie"

// Clear the 2FA step-up cookie BEFORE calling signOut so that on the next
// sign-in the user is properly challenged for TOTP (if they have 2FA enabled).
// The step-up cookie is not cleared by NextAuth's built-in signout flow.
export async function logoutAction(callbackUrl = "/") {
  ;(await cookies()).delete(TWOFA_COOKIE)
  await signOut({ redirectTo: callbackUrl })
}
