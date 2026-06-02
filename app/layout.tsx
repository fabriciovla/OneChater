import type { Metadata, Viewport } from "next";
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

// viewport-fit=cover lets us read the iOS notch insets via env(safe-area-inset-*)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${sora.variable} ${lora.variable}`} suppressHydrationWarning>
      <body className="noise">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
