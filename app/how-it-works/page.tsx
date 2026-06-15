import SeoLanding from "../_seo/SeoLanding";
import { howItWorks, buildMetadata } from "../_seo/content";

export const metadata = buildMetadata({
  title: "How it works",
  description:
    "How OneChater works: connect your API keys, chat with GPT, Claude and Gemini side by side, and build a persistent memory that travels across every model.",
  slug: "/how-it-works",
  alt: { lang: "es", path: "/como-funciona" },
  locale: "en",
});

export default function Page() {
  return <SeoLanding content={howItWorks} />;
}
