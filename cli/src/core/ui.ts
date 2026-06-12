import { stdout } from "node:process"

// ─── OneChater terminal theme ────────────────────────────────────────────────
// A clean, professional look: neutral grays + ONE brand accent (the same indigo
// as the onechater.com landing). The accent marks identity and structure — the
// prompt, gutter bars, headings, the wordmark — never body text. Emphasis still
// comes from weight (bold) and structure. 24-bit truecolor where available.

const ESC = "\x1b["
const RESET = `${ESC}0m`

type RGB = [number, number, number]

const hex = (h: string): RGB => {
  const n = parseInt(h.replace("#", ""), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Neutral palette + the single indigo accent.
export const C = {
  text: hex("#f2f3f5"),
  muted: hex("#9aa0ab"),
  faint: hex("#5b5f72"),
  // Brand accent — indigo-400, tuned to read well on dark terminals.
  accent: hex("#818cf8"),
  // Diff accents — red (removed) / green (added); a diff needs them.
  del: hex("#e5534b"),
  add: hex("#3fb950"),
}

const fg = ([r, g, b]: RGB) => `${ESC}38;2;${r};${g};${b}m`
const bgc = ([r, g, b]: RGB) => `${ESC}48;2;${r};${g};${b}m`
const DEFFG = `${ESC}39m` // reset foreground only (keeps any background)

// Colorize text with a foreground rgb.
export const paint = (rgb: RGB, s: string) => fg(rgb) + s + RESET
export const bold = (s: string) => `${ESC}1m` + s + RESET
export const dim = (s: string) => paint(C.faint, s)
export const muted = (s: string) => paint(C.muted, s)
export const white = (s: string) => paint(C.text, s)
export const accent = (s: string) => paint(C.accent, s)

// Convenience fns — all neutral now. Kept as named exports so existing call
// sites keep working; emphasis is expressed with weight, not color.
export const blue = white
export const violet = (s: string) => bold(white(s))
export const cyan = white
export const green = white
export const amber = (s: string) => bold(white(s))
export const rose = (s: string) => bold(white(s))
// Semantic aliases.
export const yellow = amber
export const red = rose
export const magenta = violet

// Previously a brand gradient; now just bright white so titles read clean.
export function gradient(s: string, _stops?: RGB[]): string {
  return white(s)
}

export const W = () => Math.min(stdout.columns || 80, 84)

// ─── Wordmark ─────────────────────────────────────────────────────────────────

// A large "ANSI Shadow"-style font. Reads as real letters (with depth), not
// chunky squares. Each glyph's rows are equal width; widths differ per letter.
const FONT_H = 6
const FONT: Record<string, string[]> = {
  O: [" ██████╗ ", "██╔═══██╗", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝ "],
  N: ["███╗   ██╗", "████╗  ██║", "██╔██╗ ██║", "██║╚██╗██║", "██║ ╚████║", "╚═╝  ╚═══╝"],
  E: ["███████╗", "██╔════╝", "█████╗  ", "██╔══╝  ", "███████╗", "╚══════╝"],
  C: [" ██████╗", "██╔════╝", "██║     ", "██║     ", "╚██████╗", " ╚═════╝"],
  H: ["██╗  ██╗", "██║  ██║", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
  A: [" █████╗ ", "██╔══██╗", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
  T: ["████████╗", "╚══██╔══╝", "   ██║   ", "   ██║   ", "   ██║   ", "   ╚═╝   "],
  R: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██║  ██║", "╚═╝  ╚═╝"],
  " ": ["  ", "  ", "  ", "  ", "  ", "  "],
}

// Width the big wordmark needs, to decide whether it fits.
function bigWidth(word: string): number {
  return [...word.toUpperCase()].reduce((w, ch) => w + (FONT[ch] ?? FONT[" "])[0].length, 0)
}

// The big wordmark rows, joined (no inter-letter spacing), rendered in solid
// bright white. Title color is intentionally white — clean and professional.
export function bigWord(word = "ONECHATER"): string[] {
  const glyphs = [...word.toUpperCase()].map((ch) => FONT[ch] ?? FONT[" "])
  const rows: string[] = []
  for (let r = 0; r < FONT_H; r++) {
    rows.push(white(glyphs.map((g) => g[r]).join("")))
  }
  return rows
}

// Wordmark for the banner — an accent diamond + bold white text.
export function wordmark(indent = "  ", word = "OneChater"): string[] {
  return [indent + accent("◆ ") + bold(white(word))]
}

// Thin centered divider: ╶────────╴
export function divider(): string {
  const w = W() - 4
  return "  " + dim("╶" + "─".repeat(Math.max(0, w - 2)) + "╴")
}

// Accent gutter bar used to mark a block (prompt, speaker, callouts).
export const bar = (rgb: RGB = C.muted) => paint(rgb, "▎")

// ─── Input frame ──────────────────────────────────────────────────────────────
// Frames the user's input with plain horizontal rules that span the FULL
// terminal width — no corners, no curves:
//   ──────────────────────────────────────────────────────────  (full width)
//   › your text here
//   ──────────────────────────────────────────────────────────  (full width)
// One char short of the full width so the rule never lands on the last column
// (writing the last column puts the terminal in a deferred-wrap state, which
// corrupts in-place redraws of the input frame).
const fullRule = () => muted("─".repeat(Math.max(8, (stdout.columns || 80) - 1)))

export function boxTop(): string {
  return fullRule()
}

export function boxBottom(): string {
  return fullRule()
}

// The input's bottom rule, with the OneChater wordmark centered in it:
//   ──────────────────────| OneChater |───────────────────────
// Spans the full terminal width (minus the last column, same deferred-wrap
// guard as fullRule). Recomputed on every call so each redraw picks up the
// current window width.
export function inputFooter(): string {
  const cols = Math.max(8, (stdout.columns || 80) - 1)
  const plain = "| OneChater |" // label, for width math (strip styling)
  const left = Math.max(0, Math.floor((cols - plain.length) / 2))
  const right = Math.max(0, cols - plain.length - left)
  // Same width as `plain` — only the word carries the brand accent.
  const label = dim("| ") + accent("OneChater") + dim(" |")
  return muted("─".repeat(left)) + label + muted("─".repeat(right))
}

// The prompt printed before the cursor — the brand accent marks "your turn".
export function boxPrompt(): string {
  return bold(accent("›")) + " "
}

// A labelled gutter line: ▎ label   detail  (accent bar, label in `rgb`)
export function gutter(label: string, rgb: RGB = C.text, detail = ""): string {
  return "  " + bar(C.accent) + " " + bold(paint(rgb, label)) + (detail ? "  " + dim(detail) : "")
}

// Key/value row with aligned dim key.
export function kv(key: string, value: string): string {
  return "  " + muted(key.padEnd(8)) + value
}

// ─── Streaming markdown ───────────────────────────────────────────────────────
// The models answer in markdown (**bold**, *italic*, `code`, # headings). The
// terminal won't render that on its own, so we translate the common inline
// marks to ANSI as tokens stream in. State is kept across chunks, and a partial
// marker at a chunk boundary (a lone trailing `*`) is held in `pending` until
// the next chunk arrives. Uses specific on/off codes (22m/23m/39m) so one style
// turning off doesn't clobber another that's still open.
export function createMarkdownStream() {
  let bold = false
  let italic = false
  let code = false
  let heading = false
  let atLineStart = true
  let pending = ""
  let fence = false // inside a ``` fenced code block
  let fenceLine = "" // current (incomplete) line of the fence body

  const BOLD_ON = `${ESC}1m`
  const BOLD_OFF = `${ESC}22m`
  const ITAL_ON = `${ESC}3m`
  const ITAL_OFF = `${ESC}23m`
  const CODE_ON = fg(C.muted)
  const CODE_OFF = `${ESC}39m`
  // Headings get bold + the brand accent; both reset at end of line.
  const HEAD_ON = BOLD_ON + fg(C.accent)
  const HEAD_OFF = BOLD_OFF + DEFFG

  // ANSI to close every style currently open (used at flush / end of answer).
  function closeAll(): string {
    let s = ""
    if (code) s += CODE_OFF
    if (italic) s += ITAL_OFF
    if (heading) s += HEAD_OFF
    else if (bold) s += BOLD_OFF
    bold = italic = code = heading = false
    return s
  }

  function write(input: string): string {
    let s = pending + input
    pending = ""
    let out = ""
    let i = 0
    while (i < s.length) {
      const ch = s[i]

      // Inside a ``` fence: buffer the line, emit it syntax-highlighted on the
      // newline. The closing ``` line ends the fence.
      if (fence) {
        if (ch === "\n") {
          if (fenceLine.trim() === "```") {
            fence = false
            out += fg(C.faint) + "```" + DEFFG + "\n"
          } else {
            out += highlightCode(fenceLine) + DEFFG + "\n"
          }
          fenceLine = ""
          atLineStart = true
        } else {
          fenceLine += ch
        }
        i++
        continue
      }

      // ``` at the start of a line opens a fence. The whole marker line
      // (incl. language tag) must be in hand before we commit — hold a partial.
      if (atLineStart && ch === "`") {
        const rest = s.slice(i)
        if (/^`{1,2}$/.test(rest)) {
          pending = rest // might become ``` with the next chunk
          break
        }
        if (rest.startsWith("```")) {
          const nl = rest.indexOf("\n")
          if (nl === -1) {
            pending = rest // wait for the full ```lang line
            break
          }
          fence = true
          fenceLine = ""
          out += fg(C.faint) + rest.slice(0, nl) + DEFFG + "\n"
          atLineStart = true
          i += nl + 1
          continue
        }
        // a single ` at line start — fall through to the inline-code toggle
      }

      // A newline closes an active heading and resets line state.
      if (ch === "\n") {
        if (heading) {
          out += HEAD_OFF
          heading = false
        }
        out += "\n"
        atLineStart = true
        i++
        continue
      }

      // `# ` … `###### ` at the start of a line → accent-bold the rest of it.
      if (atLineStart && ch === "#") {
        let j = i
        while (j < s.length && s[j] === "#") j++
        if (j >= s.length) {
          pending = s.slice(i) // wait — might be a heading, need the next char
          break
        }
        if (s[j] === " ") {
          i = j + 1
          heading = true
          atLineStart = false
          out += HEAD_ON
          continue
        }
        // not a heading — fall through and print the '#' literally
      }

      // `- ` / `* ` at the start of a line → an accent bullet `•`. (A lone
      // marker at the chunk edge waits for the next char; `* ` only counts as a
      // bullet at line start, so emphasis elsewhere is untouched.)
      if (atLineStart && (ch === "-" || ch === "*")) {
        if (i + 1 >= s.length) {
          pending = ch
          break
        }
        if (s[i + 1] === " ") {
          out += fg(C.accent) + "•" + DEFFG + " "
          atLineStart = false
          i += 2
          continue
        }
        // not a bullet — fall through ('-' prints literally; '*' is emphasis)
      }

      // `code` span.
      if (ch === "`") {
        code = !code
        out += code ? CODE_ON : CODE_OFF
        atLineStart = false
        i++
        continue
      }

      // `**bold**` (two stars) vs `*italic*` (one star).
      if (ch === "*") {
        if (i + 1 >= s.length) {
          pending = "*" // need the next char to know if it's ** or *
          break
        }
        if (s[i + 1] === "*") {
          bold = !bold
          out += bold ? BOLD_ON : BOLD_OFF
          i += 2
        } else {
          italic = !italic
          out += italic ? ITAL_ON : ITAL_OFF
          i += 1
        }
        atLineStart = false
        continue
      }

      out += ch
      if (ch !== " ") atLineStart = false
      i++
    }
    return out
  }

  function flush(): string {
    let tail = pending
    pending = ""
    if (fence && fenceLine) {
      // Answer ended mid-fence — emit what we have, highlighted.
      tail += highlightCode(fenceLine) + DEFFG
      fenceLine = ""
      fence = false
    }
    return tail + closeAll()
  }

  return { write, flush }
}

// ─── Streaming word-wrap ──────────────────────────────────────────────────────
// The terminal soft-wraps long lines back to column 0, which breaks the answer's
// left margin. This wraps text to the terminal width and re-indents every line
// (hard newlines AND wraps) so the whole answer keeps an even left edge. It is
// streaming- and ANSI-aware: escape sequences count as zero width, and a partial
// word at a chunk boundary is buffered until the next whitespace arrives.
export function createWrapper(indent = "  ", width = (stdout.columns || 80)) {
  const max = Math.max(20, width) - 1 // small right gutter
  let col = indent.length
  let word = "" // current word, may contain ANSI
  let wordLen = 0 // visible length of `word`

  // Emit the buffered word, wrapping to a new indented line first if needed.
  function emitWord(): string {
    if (wordLen === 0) {
      const w = word // ANSI-only run, zero width — pass through
      word = ""
      return w
    }
    let res = ""
    if (col > indent.length && col + wordLen > max) {
      res += "\n" + indent
      col = indent.length
    }
    res += word
    col += wordLen
    word = ""
    wordLen = 0
    return res
  }

  function write(s: string): string {
    let out = ""
    let k = 0
    while (k < s.length) {
      const ch = s[k]
      // Zero-width ANSI escape: attach to the current word verbatim.
      if (ch === "\x1b") {
        let j = k + 1
        while (j < s.length && s[j] !== "m") j++
        word += s.slice(k, j + 1)
        k = j + 1
        continue
      }
      if (ch === "\n") {
        out += emitWord()
        out += "\n" + indent
        col = indent.length
        k++
        continue
      }
      if (ch === " ") {
        out += emitWord()
        if (col + 1 > max) {
          out += "\n" + indent
          col = indent.length
        } else {
          out += " "
          col += 1
        }
        k++
        continue
      }
      word += ch
      wordLen += 1
      k++
    }
    return out
  }

  function flush(): string {
    return emitWord()
  }

  return { write, flush }
}

// ─── Code diff ─────────────────────────────────────────────────────────────────
// When a model edits a file we show a line diff: removed lines in RED with their
// old line number, added lines in GREEN with their new line number, plus a few
// dim context lines so the change has a place. Built on a Myers-ish LCS.

type DiffOp = { type: "same" | "del" | "add"; text: string; oldNo?: number; newNo?: number }

// Longest-common-subsequence line diff. Capped: for very large files the O(n·m)
// table is skipped and we fall back to "delete all / add all".
function diffLines(a: string[], b: string[]): DiffOp[] {
  const n = a.length
  const m = b.length
  if (n * m > 4_000_000) {
    const ops: DiffOp[] = []
    a.forEach((t, i) => ops.push({ type: "del", text: t, oldNo: i + 1 }))
    b.forEach((t, j) => ops.push({ type: "add", text: t, newNo: j + 1 }))
    return ops
  }
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ops: DiffOp[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "same", text: a[i], oldNo: i + 1, newNo: j + 1 })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "del", text: a[i], oldNo: i + 1 })
      i++
    } else {
      ops.push({ type: "add", text: b[j], newNo: j + 1 })
      j++
    }
  }
  while (i < n) ops.push({ type: "del", text: a[i], oldNo: i++ + 1 })
  while (j < m) ops.push({ type: "add", text: b[j], newNo: j++ + 1 })
  return ops
}

// ─── Minimal syntax highlighting ───────────────────────────────────────────────
// A tiny, language-agnostic tokenizer for the diff body: keywords, strings,
// numbers, comments and Capitalized types get a color; everything else stays
// default. Emits foreground-only codes (39m to reset) so it never clobbers the
// diff line's background tint. Good enough for JS/TS/JSON/most C-like code.
const SYN = {
  keyword: hex("#c678dd"),
  string: hex("#e5c07b"),
  number: hex("#d19a66"),
  comment: hex("#7a8290"),
  literal: hex("#56b6c2"),
  type: hex("#56b6c2"),
}
const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while", "switch",
  "case", "break", "continue", "new", "class", "extends", "implements", "import", "from",
  "export", "default", "async", "await", "yield", "try", "catch", "finally", "throw",
  "typeof", "instanceof", "in", "of", "do", "void", "delete", "this", "super", "static",
  "get", "set", "public", "private", "protected", "readonly", "interface", "type", "enum",
  "namespace", "as", "satisfies", "def", "lambda", "elif", "with", "pass", "raise", "fn",
])
const LITERALS = new Set([
  "true", "false", "null", "undefined", "NaN", "Infinity", "None", "True", "False",
])

function highlightCode(line: string): string {
  let out = ""
  let i = 0
  const n = line.length
  while (i < n) {
    const ch = line[i]
    // `//` … line comment → rest of the line.
    if (ch === "/" && line[i + 1] === "/") {
      out += fg(SYN.comment) + line.slice(i) + DEFFG
      break
    }
    // String literal — "...", '...', `...`. Honors backslash escapes.
    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1
      while (j < n && line[j] !== ch) {
        if (line[j] === "\\") j++
        j++
      }
      out += fg(SYN.string) + line.slice(i, Math.min(n, j + 1)) + DEFFG
      i = j + 1
      continue
    }
    // Number (incl. hex / decimals).
    if (ch >= "0" && ch <= "9") {
      let j = i
      while (j < n && /[0-9a-fA-FxX._]/.test(line[j])) j++
      out += fg(SYN.number) + line.slice(i, j) + DEFFG
      i = j
      continue
    }
    // Identifier / keyword / type.
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i
      while (j < n && /[\w$]/.test(line[j])) j++
      const word = line.slice(i, j)
      const col = KEYWORDS.has(word)
        ? SYN.keyword
        : LITERALS.has(word)
        ? SYN.literal
        : /^[A-Z]/.test(word)
        ? SYN.type
        : null
      out += (col ? fg(col) : DEFFG) + word + DEFFG
      i = j
      continue
    }
    out += DEFFG + ch
    i++
  }
  return out
}

// Render a diff between old and new file content as colored terminal lines.
// `title` is shown as a header (e.g. the file path). Unchanged runs longer than
// 2·CONTEXT collapse to a `⋮` marker so big files stay scannable. Returns the
// lines to print (already indented + colored), or [] when nothing changed.
export function renderDiff(title: string, oldText: string, newText: string): string[] {
  const CONTEXT = 2
  const a = oldText === "" ? [] : oldText.replace(/\n$/, "").split("\n")
  const b = newText === "" ? [] : newText.replace(/\n$/, "").split("\n")
  const ops = diffLines(a, b)

  const added = ops.filter((o) => o.type === "add").length
  const removed = ops.filter((o) => o.type === "del").length
  if (!added && !removed) {
    return ["  " + dim("▸ " + title + "  (no changes)")]
  }

  // Mark which context lines to keep: any "same" within CONTEXT of a change.
  const keep = new Array(ops.length).fill(false)
  ops.forEach((o, idx) => {
    if (o.type !== "same") {
      for (let k = Math.max(0, idx - CONTEXT); k <= Math.min(ops.length - 1, idx + CONTEXT); k++) {
        keep[k] = true
      }
    }
  })

  // Width of the line-number gutter, from the largest number we'll print.
  const maxNo = ops.reduce((mx, o) => Math.max(mx, o.oldNo ?? 0, o.newNo ?? 0), 0)
  const noW = String(maxNo).length
  const cols = Math.max(40, stdout.columns || 80)
  const codeMax = cols - (3 + noW + 2) // sign + space + number + gap

  const clip = (s: string) => {
    const t = s.replace(/\t/g, "  ")
    return t.length > codeMax ? t.slice(0, codeMax - 1) + "…" : t
  }
  const num = (n?: number) => (n == null ? " ".repeat(noW) : String(n).padStart(noW))

  // Subtle green/red row tints so add/del read at a glance even with the code
  // syntax-highlighted on top (the gutter + sign carry the same accent).
  const bgAdd = bgc([13, 36, 22])
  const bgDel = bgc([46, 20, 20])

  // Build one diff row: colored line-number gutter + sign, then the code
  // (syntax-highlighted for add/del, dim for context), padded so the tint spans
  // the row. Foreground-only codes inside keep the background intact.
  const row = (kind: "add" | "del" | "same", no: number | undefined, raw: string): string => {
    const code = clip(raw)
    const sign = kind === "add" ? "+" : kind === "del" ? "-" : " "
    const accent = kind === "add" ? C.add : kind === "del" ? C.del : C.faint
    const bg = kind === "add" ? bgAdd : kind === "del" ? bgDel : ""
    const gutter = fg(accent) + num(no) + " " + sign + " "
    const body = kind === "same" ? fg(C.faint) + code : highlightCode(code)
    const visible = noW + 3 + code.length // num + space + sign + space + code
    const pad = bg ? " ".repeat(Math.max(0, cols - 2 - visible)) : ""
    return "  " + bg + gutter + body + pad + RESET
  }

  const header =
    "  " + bold(white("▸ " + title)) + "  " +
    paint(C.add, `+${added}`) + " " + paint(C.del, `-${removed}`)
  const out: string[] = [header]

  let collapsed = false
  for (let idx = 0; idx < ops.length; idx++) {
    const o = ops[idx]
    if (!keep[idx]) {
      if (!collapsed) {
        out.push("  " + dim(" ".repeat(noW) + "  ⋮"))
        collapsed = true
      }
      continue
    }
    collapsed = false
    if (o.type === "del") out.push(row("del", o.oldNo, o.text))
    else if (o.type === "add") out.push(row("add", o.newNo, o.text))
    else out.push(row("same", o.oldNo, o.text))
  }
  return out
}

export { RESET }
