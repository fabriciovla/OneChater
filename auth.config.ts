import type { NextAuthConfig } from "next-auth"

// Config liviana, Edge-safe (sin Prisma). La usa el middleware.
// auth.ts la extiende agregando el adapter de Prisma + el provider OTP.
export default {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized: ({ auth }) => !!auth?.user,
    jwt: ({ token, user }) => {
      if (user?.id) token.id = user.id
      return token
    },
    session: ({ session, token }) => {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
} satisfies NextAuthConfig
