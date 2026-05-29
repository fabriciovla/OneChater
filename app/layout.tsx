import type { Metadata } from "next";
import { Inter, Sora, Lora } from "next/font/google";
import { SessionProvider } from "next-auth/react";
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

export const metadata: Metadata = {
  title: "OneChat · Una memoria. Todas las IAs.",
  description:
    "La única app de chat con IA que no te olvida cuando cambiás de modelo. GPT, Claude y Gemini en un solo lugar, con una memoria que viaja con vos.",
  keywords: ["AI chat", "OpenAI", "Claude", "Gemini", "multi-modelo", "LLM", "OneChat", "LATAM"],
  openGraph: {
    title: "OneChat · Una memoria. Todas las IAs.",
    description: "La única app de chat con IA que no te olvida cuando cambiás de modelo.",
    type: "website",
    images: [{ url: "/og-image.png", width: 2048, height: 1024 }],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${lora.variable}`}>
      <body className="noise"><SessionProvider>{children}</SessionProvider></body>
    </html>
  );
}
