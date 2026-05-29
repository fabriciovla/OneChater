import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    // Google, GitHub, Apple — add when OAuth credentials are ready
    Credentials({
      id: "otp",
      credentials: {
        email: { label: "Email", type: "email" },
        code:  { label: "Código", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined
        const code  = credentials?.code  as string | undefined
        if (!email || !code) return null

        const otp = await prisma.verificationToken.findFirst({
          where: { identifier: email, token: code, expires: { gt: new Date() } },
        })
        if (!otp) return null

        await prisma.verificationToken.deleteMany({
          where: { identifier: email },
        })

        let user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
          user = await prisma.user.create({ data: { email, emailVerified: new Date() } })
        } else if (!user.emailVerified) {
          await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } })
        }

        return user
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) token.id = user.id
      return token
    },
    session: ({ session, token }) => {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
