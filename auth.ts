import NextAuth from "next-auth"

// Fail fast if AUTH_SECRET was never replaced — forged JWTs become trivial otherwise.
if (process.env.AUTH_SECRET === "REEMPLAZAR_CON_SECRET_SEGURO") {
  throw new Error(
    "[OneChater] AUTH_SECRET is still the placeholder value. " +
    "Generate a real secret with: openssl rand -base64 32"
  )
}
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { prisma } from "@/lib/db"
import { lockRemainingSec, recordFailure, clearLimit } from "@/lib/ratelimit"
import authConfig from "@/auth.config"

const VERIFY_MAX_ATTEMPTS = 5
const VERIFY_LOCK_MS = 15 * 60 * 1000 // 15 min

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      id: "otp",
      credentials: {
        email: { label: "Email", type: "email" },
        code:  { label: "Code", type: "text" },
      },
      authorize: async (credentials) => {
        const rawEmail = credentials?.email as string | undefined
        const code  = credentials?.code  as string | undefined
        if (!rawEmail || !code) return null
        // Normalize to match how send-otp stored the identifier (lowercased).
        const email = rawEmail.toLowerCase().trim()

        // Brute-force guard: too many wrong codes locks this email out briefly.
        const lockKey = `otp_verify:${email}`
        if ((await lockRemainingSec(lockKey)) > 0) return null

        const otp = await prisma.verificationToken.findFirst({
          where: { identifier: email, token: code, expires: { gt: new Date() } },
        })
        if (!otp) {
          await recordFailure(lockKey, VERIFY_MAX_ATTEMPTS, VERIFY_LOCK_MS)
          return null
        }
        await clearLimit(lockKey)

        await prisma.verificationToken.deleteMany({
          where: { identifier: email },
        })

        let user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
          user = await prisma.user.create({ data: { email, emailVerified: new Date() } })
        } else if (!user.emailVerified) {
          await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } })
        }

        return { ...user, plan: user.plan }
      },
    }),
  ],
})
