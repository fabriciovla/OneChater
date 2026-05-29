import { defineConfig } from "prisma/config"
import * as fs from "fs"
import * as path from "path"

// Load .env manually since Prisma config runs before Next.js env loading
const envPath = path.resolve(process.cwd(), ".env")
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^"|"$/g, "")
      if (!process.env[key]) process.env[key] = val
    }
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL!,
  },
})
