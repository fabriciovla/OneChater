import { join } from "node:path"
import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { CONFIG_DIR } from "./config.js"

// ─── Skills ───────────────────────────────────────────────────────────────────
// Claude-Code-style skills: a folder per skill under ~/.onechater/skills/<name>/
// with a SKILL.md whose YAML frontmatter carries `name` + `description`. The
// model sees the catalog (name + description) in its system prompt and pulls a
// skill's full instructions on demand via the `use_skill` tool — so a big skill
// body only enters the context when it's actually relevant.

export const SKILLS_DIR = join(CONFIG_DIR, "skills")

export type Skill = {
  name: string // slug used by use_skill (the folder name)
  title: string // frontmatter `name`, falls back to the folder name
  description: string // frontmatter `description` — what triggers it
  body: string // the instructions below the frontmatter
}

// Minimal frontmatter parser: a leading `---` block of `key: value` lines. Good
// enough for the two fields skills use; values may be quoted.
function parseFrontmatter(src: string): { meta: Record<string, string>; body: string } {
  const text = src.replace(/^﻿/, "")
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?/.exec(text)
  if (!m) return { meta: {}, body: text.trim() }
  const meta: Record<string, string> = {}
  for (const line of m[1].split("\n")) {
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line.trim())
    if (kv) meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, "")
  }
  return { meta, body: text.slice(m[0].length).trim() }
}

// Load every skill folder that has a readable SKILL.md.
export function listSkills(): Skill[] {
  try {
    if (!existsSync(SKILLS_DIR)) return []
    const out: Skill[] = []
    for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const md = join(SKILLS_DIR, entry.name, "SKILL.md")
      if (!existsSync(md)) continue
      try {
        const { meta, body } = parseFrontmatter(readFileSync(md, "utf8"))
        out.push({
          name: entry.name,
          title: meta.name || entry.name,
          description: meta.description || "(no description)",
          body,
        })
      } catch {}
    }
    return out.sort((a, b) => (a.name < b.name ? -1 : 1))
  } catch {
    return []
  }
}

export function loadSkill(name: string): Skill | null {
  return listSkills().find((s) => s.name === name.trim().toLowerCase()) ?? null
}

// Seed an example skill the first time, so `/skills` has something to show and a
// template to copy. Returns the skills directory path.
export function ensureSkillsDir(): string {
  if (!existsSync(SKILLS_DIR)) mkdirSync(SKILLS_DIR, { recursive: true })
  const exampleDir = join(SKILLS_DIR, "commit-style")
  const exampleMd = join(exampleDir, "SKILL.md")
  if (!existsSync(exampleMd)) {
    try {
      mkdirSync(exampleDir, { recursive: true })
      writeFileSync(
        exampleMd,
        `---
name: Commit style
description: How to write git commit messages for this user. Use when writing a commit.
---

Write commits in Conventional Commits format: \`type(scope): subject\`.
Keep the subject under 50 characters, imperative mood. Add a body only when
the "why" isn't obvious from the subject. Author is Fabricio Varela — never add
a Co-Authored-By trailer.
`,
        "utf8"
      )
    } catch {}
  }
  return SKILLS_DIR
}
