import Link from "next/link";
import OneChatLogo from "../components/OneChatLogo";

// ── Types ────────────────────────────────────────────────────────────────────
export type Faq = { q: string; a: string };
export type Block = { h: string; body: string; bullets?: string[] };

export type SeoContent = {
  lang: "en" | "es";
  /** Canonical path for this page, e.g. "/how-it-works". */
  slug: string;
  /** hreflang counterpart in the other language (omit for single-locale pages). */
  alt?: { lang: "en" | "es"; path: string };
  breadcrumb: string;
  h1: string;
  /** Optional substring of h1 to render with the gradient accent. */
  highlight?: string;
  lede: string;
  blocks: Block[];
  faqs: Faq[];
  related: { href: string; label: string }[];
  cta: { title: string; sub: string; button: string };
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.onechater.com";

function renderH1(h1: string, highlight?: string) {
  if (!highlight || !h1.includes(highlight)) return h1;
  const [before, after] = h1.split(highlight);
  return (
    <>
      {before}
      <span className="gradient-text">{highlight}</span>
      {after}
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
// Server-rendered, content-rich marketing page. Each former redirect slug now
// resolves to real, crawlable HTML with unique copy, breadcrumbs and FAQ — so
// Google can index it and generative engines can quote it (GEO).
export default function SeoLanding({ content }: { content: SeoContent }) {
  const t =
    content.lang === "es"
      ? { home: "Inicio", start: "Empieza gratis", chat: "Ir al chat", more: "Explora más", faq: "Preguntas frecuentes" }
      : { home: "Home", start: "Start free", chat: "Go to chat", more: "Explore more", faq: "Frequently asked questions" };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.home, item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: content.breadcrumb, item: `${SITE_URL}${content.slug}` },
    ],
  };

  const faqLd =
    content.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface, #fafaf9)", color: "var(--text-1, #111827)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      {/* Nav */}
      <header className="border-b px-5 md:px-10 h-14 flex items-center justify-between" style={{ borderColor: "var(--border, rgba(0,0,0,0.06))" }}>
        <Link href="/" className="flex items-center hover:opacity-70 transition-opacity" aria-label="OneChater">
          <OneChatLogo className="h-7 w-auto" />
        </Link>
        <Link href="/login" className="btn-primary text-[13px] px-4 py-1.5">{t.start}</Link>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-14 md:py-20">
        {/* Breadcrumb (visible + matches JSON-LD) */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm" style={{ color: "var(--text-3, #6B7280)" }}>
          <Link href="/" className="hover:underline">{t.home}</Link>
          <span className="mx-2">/</span>
          <span aria-current="page">{content.breadcrumb}</span>
        </nav>

        <h1 className="display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
          {renderH1(content.h1, content.highlight)}
        </h1>
        <p className="mt-5 text-lg md:text-xl leading-relaxed" style={{ color: "var(--text-2, #374151)" }}>
          {content.lede}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="btn-primary text-[15px] px-7 py-3">{t.start}</Link>
          <Link href="/chat" className="text-[15px] px-7 py-3 rounded-xl font-semibold border transition-colors hover:bg-black/[0.03]" style={{ borderColor: "var(--border, rgba(0,0,0,0.12))" }}>{t.chat}</Link>
        </div>

        {/* Content blocks */}
        <div className="mt-14 space-y-12">
          {content.blocks.map((b, i) => (
            <section key={i}>
              <h2 className="display text-xl md:text-2xl font-semibold tracking-tight">{b.h}</h2>
              <p className="mt-3 leading-relaxed" style={{ color: "var(--text-2, #374151)" }}>{b.body}</p>
              {b.bullets && (
                <ul className="mt-4 space-y-2">
                  {b.bullets.map((li, j) => (
                    <li key={j} className="flex gap-2.5 leading-relaxed" style={{ color: "var(--text-2, #374151)" }}>
                      <span aria-hidden className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }} />
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* FAQ */}
        {content.faqs.length > 0 && (
          <section className="mt-16">
            <h2 className="display text-xl md:text-2xl font-semibold tracking-tight">{t.faq}</h2>
            <div className="mt-5 divide-y" style={{ borderColor: "var(--border, rgba(0,0,0,0.08))" }}>
              {content.faqs.map((f, i) => (
                <details key={i} className="group py-4">
                  <summary className="cursor-pointer list-none font-medium flex items-center justify-between gap-4">
                    <span>{f.q}</span>
                    <span aria-hidden className="transition-transform group-open:rotate-45 text-xl leading-none" style={{ color: "var(--text-3, #9CA3AF)" }}>+</span>
                  </summary>
                  <p className="mt-3 leading-relaxed" style={{ color: "var(--text-2, #374151)" }}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related links — internal linking helps crawl + relevance */}
        {content.related.length > 0 && (
          <nav className="mt-16" aria-label={t.more}>
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-3, #6B7280)" }}>{t.more}</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {content.related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="inline-flex px-4 py-2 rounded-full text-sm border transition-colors hover:bg-black/[0.03]" style={{ borderColor: "var(--border, rgba(0,0,0,0.12))" }}>
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* CTA */}
        <section className="mt-20 rounded-2xl p-8 md:p-10 text-center" style={{ background: "var(--surface-2, #ffffff)", border: "1px solid var(--border, rgba(0,0,0,0.08))" }}>
          <h2 className="display text-2xl md:text-3xl font-bold tracking-tight">{content.cta.title}</h2>
          <p className="mt-3 max-w-xl mx-auto leading-relaxed" style={{ color: "var(--text-2, #374151)" }}>{content.cta.sub}</p>
          <Link href="/login" className="btn-primary text-[15px] px-8 py-3.5 mt-6 inline-flex">{content.cta.button}</Link>
        </section>
      </main>

      <footer className="border-t px-5 md:px-10 py-8 text-center text-sm" style={{ borderColor: "var(--border, rgba(0,0,0,0.06))", color: "var(--text-3, #9CA3AF)" }}>
        <Link href="/" className="hover:underline">OneChater</Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:underline">{content.lang === "es" ? "Privacidad" : "Privacy"}</Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:underline">{content.lang === "es" ? "Términos" : "Terms"}</Link>
      </footer>
    </div>
  );
}
