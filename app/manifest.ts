import type { MetadataRoute } from "next";

// PWA / install manifest. Also reinforces the brand name + icons for crawlers.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OneChater — One memory. Every AI.",
    short_name: "OneChater",
    description:
      "AI chat app with GPT, Claude and Gemini in one place and a persistent memory that travels across every model.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
