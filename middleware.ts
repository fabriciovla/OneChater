import NextAuth from "next-auth"
import authConfig from "@/auth.config"

// Solo importa la config liviana → el bundle Edge no arrastra Prisma.
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: ["/chat/:path*"],
}
