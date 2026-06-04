import type { NextAuthConfig } from "next-auth"
import { TWOFA_COOKIE, verifyTwoFactor } from "@/lib/twofa-cookie"

// Config liviana, Edge-safe (sin Prisma). La usa el middleware.
// auth.ts la extiende agregando el adapter de Prisma + el provider OTP.
export default {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    // Gate de acceso. Rutas públicas (/ y /security) permiten acceso sin sesión
    // pero siguen verificando 2FA para usuarios ya autenticados. Rutas protegidas
    // (/chat, /dashboard) requieren sesión activa + step-up 2FA si aplica.
    authorized: async ({ auth, request }) => {
      const user = auth?.user as { id?: string; requires2fa?: boolean } | undefined
      const pathname = request.nextUrl.pathname

      // Páginas públicas — accesibles sin sesión, pero el 2FA se verifica
      // cuando el usuario YA tiene sesión (para forzar el desafío después del login).
      const isPublic = pathname === "/" || pathname === "/security"
      if (isPublic) {
        if (user?.requires2fa && user.id) {
          const cookie = request.cookies.get(TWOFA_COOKIE)?.value
          const passed = await verifyTwoFactor(cookie, user.id)
          if (!passed) {
            const to = new URL("/login/2fa", request.nextUrl.origin)
            to.searchParams.set("next", pathname)
            return Response.redirect(to)
          }
        }
        return true // permite acceso aunque no haya sesión
      }

      // Rutas protegidas — requieren sesión
      if (!user) return false // NextAuth redirige a /login
      if (user.requires2fa && user.id) {
        const cookie = request.cookies.get(TWOFA_COOKIE)?.value
        const passed = await verifyTwoFactor(cookie, user.id)
        if (!passed) {
          const to = new URL("/login/2fa", request.nextUrl.origin)
          to.searchParams.set("next", pathname)
          return Response.redirect(to)
        }
      }
      return true
    },
    jwt: ({ token, user }) => {
      if (user?.id) token.id = user.id
      if ((user as { plan?: string })?.plan) token.plan = (user as { plan?: string }).plan
      // `user` solo está presente al iniciar sesión: fijamos si requiere 2FA.
      if (user) token.requires2fa = (user as { totpEnabled?: boolean }).totpEnabled === true
      return token
    },
    session: ({ session, token }) => {
      if (token.id) session.user.id = token.id as string
      if (token.plan) (session.user as { plan?: string }).plan = token.plan as string
      ;(session.user as { requires2fa?: boolean }).requires2fa = token.requires2fa === true
      return session
    },
  },
} satisfies NextAuthConfig
