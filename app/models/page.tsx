import SeoLanding from "../_seo/SeoLanding";
import { models, buildMetadata } from "../_seo/content";

export const metadata = buildMetadata({
  title: "Supported AI models",
  description:
    "Chat with GPT, Claude, Gemini and any OpenAI-compatible model in one place. Bring your own API keys and pay each provider directly with no markup.",
  slug: "/models",
  alt: { lang: "es", path: "/modelos" },
  locale: "en",
});

export default function Page() {
  return <SeoLanding content={models} />;
}
