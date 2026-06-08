import type { Metadata, Viewport } from "next";
import { Inter, Sora, Lora } from "next/font/google";
import { cookies } from "next/headers";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider, type Lang } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  style: ["normal", "italic"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://one-chater.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OneChater — One memory. Every AI.",
    template: "%s · OneChater",
  },
  description:
    "OneChater is the AI chat app that doesn't forget you when you switch models. Use GPT, Claude and Gemini in one place, with a persistent memory that travels with you — bring your own API keys, pay providers directly.",
  applicationName: "OneChater",
  authors: [{ name: "Fabricio Varela" }],
  creator: "OneChater",
  publisher: "OneChater",
  keywords: [
    "AI chat",
    "multi-model AI",
    "GPT",
    "Claude",
    "Gemini",
    "ChatGPT alternative",
    "LLM",
    "persistent AI memory",
    "AI memory",
    "BYOK",
    "bring your own API key",
    "OpenAI",
    "Anthropic",
    "Groq",
    "OneChater",
  ],
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "OneChater — One memory. Every AI.",
    description:
      "The AI chat app that doesn't forget you when you switch models. GPT, Claude and Gemini in one place, with a memory that travels with you.",
    url: SITE_URL,
    siteName: "OneChater",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 2048, height: 1024, alt: "OneChater — One memory. Every AI." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneChater — One memory. Every AI.",
    description:
      "The AI chat app that doesn't forget you when you switch models. GPT, Claude and Gemini in one place.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
};

// viewport-fit=cover lets us read the iOS notch insets via env(safe-area-inset-*)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the persisted language on the server so SSR renders the correct
  // language up-front. This keeps the server HTML and the first client render
  // in sync (no hydration text mismatch, no EN→ES flash).
  const cookieLang = cookies().get("oc_lang")?.value;
  const lang: Lang = cookieLang === "es" || cookieLang === "en" ? cookieLang : "en";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OneChater",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description:
      "AI chat app with GPT, Claude and Gemini in one place and a persistent memory that travels across every model. Bring your own API keys.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "2400",
    },
  };

  return (
    <html lang={lang} className={`${inter.variable} ${sora.variable} ${lora.variable}`} suppressHydrationWarning>
      <body className="noise">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider>
          <SessionProvider>{children}</SessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
