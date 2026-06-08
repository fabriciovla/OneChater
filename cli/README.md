# OneChater CLI

A multi-model AI terminal. Connect the models you already pay for, and they
**think together**: every model answers, then one synthesizes a single, better
reply. With persistent memory and workspace tools, it works like an agent —
right in your terminal.

**BYOK** — your API keys never leave your machine (`~/.onechater/`). The CLI
talks to each provider's API directly. No OneChater account, no proxy.

```
npm install -g onechater
onechater
```

Or run it without installing:

```
npx onechater
```

(`och` is a shorter alias for `onechater`.)

## Getting started

Launch it and connect a model — the menus are interactive (↑↓ + enter), so you
never type provider names:

```
onechater
```

```
› /connect          ← pick a provider, paste its key
```

Free keys (no credit card) are available for **Groq**, **Google** and
**OpenRouter** — the menu links them. Connect **two or more** models and fusion
turns on automatically.

## Fusion — models that think together

When 2+ models are connected, every message fans out to all of them in parallel.
The first model then synthesizes their answers into one coherent response,
keeping the best of each and dropping the contradictions. One model connected =
a normal single-model chat.

## Workspace tools

Ask it to build or change things and it acts like Claude Code / Cursor / Aider —
by **requesting tools**, never touching your system directly. Every action is
validated, confined to the current folder (the *workspace*), and **you approve
it**:

```
OneChater wants to:
  • Create file: app/page.tsx
  • Run command: npm install
[a]llow · [d]eny
```

- File access can't escape the workspace; dangerous commands are blocked outright.
- Tools: `create_folder`, `create_file`, `read_file`, `write_file`,
  `delete_file`, `list_directory`, `run_command`.

## Memory

Tell it something about you ("remember my name is…") and it saves a persistent
profile to `~/.onechater/memory.md`. That memory is injected into every model on
every session, so any of them already knows you. View it with `/memory`.

## Slash commands

Type `/` for a navigable command palette (↑↓ to move, enter to pick):

| Command | What it does |
|---|---|
| `/connect` | Connect a model (enables fusion) |
| `/disconnect` | Remove a model |
| `/providers` | Toggle models on/off, see the current mode |
| `/model` | Set a provider's model |
| `/default` | Pick the synthesizer (and default model) |
| `/tools` | List the workspace tools |
| `/workspace` | Show the workspace directory |
| `/memory` | Show the persistent memory |
| `/clear` | Reset the conversation |
| `/help` | Command list |
| `/exit` | Quit |

**Shortcuts:** `Tab` fills the highlighted command · **double-`Esc`** brings your
last message back to edit and resend · `Ctrl-C` / `Ctrl-D` exit.

## Providers

`OpenAI · Anthropic · Google · Groq · OpenRouter · xAI · Mistral · DeepSeek`

Free tiers: **Groq**, **Google**, **OpenRouter**.

## Privacy

- Keys live in `~/.onechater/config.json` (locked to `0600` on POSIX). Nothing
  is proxied through or stored on a OneChater server.
- Conversations go straight from your machine to the provider you connected.
- Memory and config are plain local files you can read, edit, or delete.

## Requirements

Node.js ≥ 18.

---

© OneChater. All rights reserved.
